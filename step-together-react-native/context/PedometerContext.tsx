import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

const PEDOMETER_SESSION_KEY = 'step_together_pedometer_session';

type PedometerSession = {
    isTracking: boolean;
    sessionStartTime: number;
    baseSteps: number;
    challengeId: number;
    dateISO: string;
};

type PedometerContextType = {
    isTracking: boolean;
    sessionSteps: number;
    challengeId: number | null;
    dateISO: string | null;
    baseSteps: number;
    isPedometerAvailable: boolean | null;
    startTracking: (baseSteps: number, challengeId: number, dateISO: string) => Promise<void>;
    stopTracking: () => Promise<{ sessionSteps: number }>;
};

const PedometerContext = createContext<PedometerContextType>({
    isTracking: false,
    sessionSteps: 0,
    challengeId: null,
    dateISO: null,
    baseSteps: 0,
    isPedometerAvailable: null,
    startTracking: async () => {},
    stopTracking: async () => ({ sessionSteps: 0 }),
});

export const usePedometer = () => useContext(PedometerContext);

export const PedometerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isTracking, setIsTracking] = useState(false);
    const [sessionSteps, setSessionSteps] = useState(0);
    const [challengeId, setChallengeId] = useState<number | null>(null);
    const [dateISO, setDateISO] = useState<string | null>(null);
    const [baseSteps, setBaseSteps] = useState(0);
    const [isPedometerAvailable, setIsPedometerAvailable] = useState<boolean | null>(null);

    const sessionStartTimeRef = useRef<number | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isMountedRef = useRef(true);
    const isTrackingRef = useRef(false);
    isTrackingRef.current = isTracking;

    const readSteps = useCallback(async (): Promise<number> => {
        if (!sessionStartTimeRef.current) return 0;
        try {
            const result = await Pedometer.getStepCountAsync(
                new Date(sessionStartTimeRef.current),
                new Date()
            );
            return result.steps;
        } catch {
            return 0;
        }
    }, []);

    const startPoll = useCallback(() => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        // immediate first read
        readSteps().then((steps) => {
            if (isMountedRef.current) setSessionSteps(steps);
        });
        pollIntervalRef.current = setInterval(async () => {
            if (!isTrackingRef.current) return;
            const steps = await readSteps();
            if (isMountedRef.current) setSessionSteps(steps);
        }, 3000);
    }, [readSteps]);

    const stopPoll = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

    // Restore session from AsyncStorage on mount
    useEffect(() => {
        isMountedRef.current = true;

        const restore = async () => {
            try {
                const available = await Pedometer.isAvailableAsync();
                if (isMountedRef.current) setIsPedometerAvailable(available);

                const raw = await AsyncStorage.getItem(PEDOMETER_SESSION_KEY);
                if (!raw) return;
                const session: PedometerSession = JSON.parse(raw);
                if (!session.isTracking) return;

                sessionStartTimeRef.current = session.sessionStartTime;
                if (isMountedRef.current) {
                    setIsTracking(true);
                    setChallengeId(session.challengeId);
                    setDateISO(session.dateISO);
                    setBaseSteps(session.baseSteps);
                    startPoll();
                }
            } catch {
                // corrupt storage — ignore
            }
        };

        restore();

        return () => {
            isMountedRef.current = false;
            stopPoll();
        };
    }, [startPoll, stopPoll]);

    // Pause/resume polling based on app foreground state
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (!isTrackingRef.current) return;
            if (state === 'active') {
                startPoll();
            } else {
                stopPoll();
            }
        });
        return () => sub.remove();
    }, [startPoll, stopPoll]);

    const startTracking = useCallback(async (base: number, cId: number, dISO: string) => {
        const available = await Pedometer.isAvailableAsync();
        setIsPedometerAvailable(available);
        if (!available) throw new Error('Pedometer nicht verfügbar');

        const now = Date.now();
        sessionStartTimeRef.current = now;

        const session: PedometerSession = {
            isTracking: true,
            sessionStartTime: now,
            baseSteps: base,
            challengeId: cId,
            dateISO: dISO,
        };
        await AsyncStorage.setItem(PEDOMETER_SESSION_KEY, JSON.stringify(session));

        setIsTracking(true);
        setSessionSteps(0);
        setChallengeId(cId);
        setDateISO(dISO);
        setBaseSteps(base);
        startPoll();
    }, [startPoll]);

    const stopTracking = useCallback(async () => {
        stopPoll();

        // Final authoritative read before clearing the start time
        const finalSteps = await readSteps();
        sessionStartTimeRef.current = null;

        await AsyncStorage.removeItem(PEDOMETER_SESSION_KEY);

        setIsTracking(false);
        setSessionSteps(0);
        setChallengeId(null);
        setDateISO(null);
        setBaseSteps(0);

        return { sessionSteps: finalSteps };
    }, [stopPoll, readSteps]);

    return (
        <PedometerContext.Provider value={{
            isTracking,
            sessionSteps,
            challengeId,
            dateISO,
            baseSteps,
            isPedometerAvailable,
            startTracking,
            stopTracking,
        }}>
            {children}
        </PedometerContext.Provider>
    );
};
