import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';

const PEDOMETER_SESSION_KEY = 'step_together_pedometer_session';

type PedometerSession = {
    isTracking: boolean;
    // Steps accumulated in previous subscription windows (e.g. after app restore).
    // watchStepCount resets its counter each time a new subscription starts, so we
    // carry over whatever was already counted before the current subscription began.
    stepOffset?: number;
    // ISO timestamp of when tracking started — used to query system pedometer
    // history (getStepCountAsync) so background/locked steps are not lost.
    sessionStartTime?: string;
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
    startTracking: async () => { },
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

    const subscriptionRef = useRef<ReturnType<typeof Pedometer.watchStepCount> | null>(null);
    const isMountedRef = useRef(true);
    const isTrackingRef = useRef(false);
    isTrackingRef.current = isTracking;

    // Steps counted before the current watchStepCount window.
    // watchStepCount resets to 0 on each new subscription, so we track the
    // cumulative offset from previous windows here.
    const stepOffsetRef = useRef(0);

    // ISO string of when the current session started — needed so we can query
    // getStepCountAsync(sessionStart, now) to capture steps taken while the app
    // was in the background or the phone was locked.
    const sessionStartTimeRef = useRef<string | null>(null);

    const toSafeStepNumber = useCallback((value: unknown) => {
        const num = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(num) || num < 0) return 0;
        return Math.floor(num);
    }, []);

    const ensureActivityPermission = useCallback(async () => {
        if (Platform.OS !== 'android') return true;
        if (typeof Platform.Version === 'number' && Platform.Version < 29) return true;

        try {
            const granted = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
            );
            if (granted) return true;
        } catch {
            // Continue with other permission methods below.
        }

        try {
            const result = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
                {
                    title: 'Aktivitaetserkennung erlauben',
                    message: 'Step Together braucht Aktivitaetserkennung, um Schritte zu tracken.',
                    buttonNegative: 'Ablehnen',
                    buttonPositive: 'Erlauben',
                },
            );
            if (result === PermissionsAndroid.RESULTS.GRANTED) return true;
        } catch {
            // Continue with Expo pedometer permission fallback.
        }

        try {
            const pedometerApi = Pedometer as unknown as {
                requestPermissionsAsync?: () => Promise<{ status?: string }>;
            };
            if (pedometerApi.requestPermissionsAsync) {
                const res = await pedometerApi.requestPermissionsAsync();
                return res?.status === 'granted';
            }
        } catch {
            return false;
        }

        return false;
    }, []);

    // Query system pedometer history from sessionStart until now.
    // The system pedometer (iOS CoreMotion / Android step-counter sensor) keeps
    // counting even when the app is backgrounded or the phone is locked, so this
    // gives us all steps — not just the ones watchStepCount observed.
    // Falls back to `fallbackSteps` when the API is unavailable (older Android).
    const getSystemStepsSinceStart = useCallback(async (fallbackSteps: number): Promise<number> => {
        const startISO = sessionStartTimeRef.current;
        if (!startISO) return fallbackSteps;
        try {
            const result = await Pedometer.getStepCountAsync(new Date(startISO), new Date());
            const steps = toSafeStepNumber(result?.steps);
            return steps;
        } catch {
            return fallbackSteps;
        }
    }, [toSafeStepNumber]);

    const stopSubscription = useCallback(() => {
        if (subscriptionRef.current) {
            subscriptionRef.current.remove();
            subscriptionRef.current = null;
        }
    }, []);

    const startSubscription = useCallback((offset: number) => {
        stopSubscription();
        stepOffsetRef.current = toSafeStepNumber(offset);

        subscriptionRef.current = Pedometer.watchStepCount((result) => {
            if (isMountedRef.current) {
                const liveSteps = toSafeStepNumber(result?.steps);
                setSessionSteps(stepOffsetRef.current + liveSteps);
            }
        });
    }, [stopSubscription, toSafeStepNumber]);

    // Restore session from AsyncStorage on mount
    useEffect(() => {
        isMountedRef.current = true;

        const restore = async () => {
            try {
                const hasPermission = await ensureActivityPermission();
                const available = await Pedometer.isAvailableAsync();
                if (isMountedRef.current) setIsPedometerAvailable(available && hasPermission);

                const raw = await AsyncStorage.getItem(PEDOMETER_SESSION_KEY);
                if (!raw) return;
                const session: PedometerSession = JSON.parse(raw);
                if (!session.isTracking) return;
                if (!hasPermission || !available) {
                    await AsyncStorage.removeItem(PEDOMETER_SESSION_KEY);
                    return;
                }
                const savedOffset = toSafeStepNumber(session.stepOffset);
                // Restore the session start time so getStepCountAsync works.
                sessionStartTimeRef.current = session.sessionStartTime ?? null;

                // Use system pedometer history to recover steps taken while the
                // app was killed / phone was locked since the session started.
                let restoredOffset = savedOffset;
                if (session.sessionStartTime) {
                    try {
                        const result = await Pedometer.getStepCountAsync(
                            new Date(session.sessionStartTime),
                            new Date(),
                        );
                        restoredOffset = toSafeStepNumber(result?.steps);
                    } catch {
                        // Older Android without step-count history — keep savedOffset.
                    }
                }

                if (isMountedRef.current) {
                    setIsTracking(true);
                    setChallengeId(session.challengeId);
                    setDateISO(session.dateISO);
                    setBaseSteps(session.baseSteps);
                    setSessionSteps(restoredOffset);
                    startSubscription(restoredOffset);
                }
            } catch {
                // corrupt storage --- ignore
            }
        };

        restore();

        return () => {
            isMountedRef.current = false;
            stopSubscription();
        };
    }, [startSubscription, stopSubscription, toSafeStepNumber, ensureActivityPermission]);

    // When the app goes to background: save accumulated steps and stop the
    // subscription (Android kills sensors in the background).
    // When it comes back to foreground: query system pedometer history to recover
    // any steps taken while the phone was locked / app was backgrounded.
    useEffect(() => {
        const sub = AppState.addEventListener('change', async (state) => {
            if (!isTrackingRef.current) return;

            if (state === 'active') {
                // Read saved offset from state (synchronously available via setSessionSteps callback)
                const savedOffset = await new Promise<number>((resolve) => {
                    setSessionSteps((prev) => {
                        resolve(toSafeStepNumber(prev));
                        return prev;
                    });
                });
                // Prefer system pedometer history so background/locked steps are included.
                const catchUpSteps = await getSystemStepsSinceStart(savedOffset);
                if (isMountedRef.current) {
                    setSessionSteps(catchUpSteps);
                    startSubscription(catchUpSteps);
                }
            } else {
                // Capture current count, persist it, then stop subscription
                setSessionSteps((prev) => {
                    const safePrev = toSafeStepNumber(prev);
                    setChallengeId((cId) => {
                        setDateISO((dISO) => {
                            setBaseSteps((base) => {
                                if (cId !== null && dISO !== null) {
                                    const session: PedometerSession = {
                                        isTracking: true,
                                        stepOffset: safePrev,
                                        sessionStartTime: sessionStartTimeRef.current ?? undefined,
                                        baseSteps: base,
                                        challengeId: cId,
                                        dateISO: dISO,
                                    };
                                    AsyncStorage.setItem(
                                        PEDOMETER_SESSION_KEY,
                                        JSON.stringify(session),
                                    ).catch(() => { });
                                }
                                return base;
                            });
                            return dISO;
                        });
                        return cId;
                    });
                    stopSubscription();
                    return safePrev;
                });
            }
        });
        return () => sub.remove();
    }, [startSubscription, stopSubscription, toSafeStepNumber, getSystemStepsSinceStart]);

    const startTracking = useCallback(async (base: number, cId: number, dISO: string) => {
        const hasPermission = await ensureActivityPermission();
        if (!hasPermission) {
            setIsPedometerAvailable(false);
            throw new Error('Aktivitaetserkennung nicht erlaubt');
        }

        const available = await Pedometer.isAvailableAsync();
        setIsPedometerAvailable(available);
        if (!available) throw new Error('Pedometer nicht verfuegbar');

        const startTime = new Date().toISOString();
        sessionStartTimeRef.current = startTime;

        const session: PedometerSession = {
            isTracking: true,
            stepOffset: 0,
            sessionStartTime: startTime,
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
        startSubscription(0);
    }, [startSubscription, ensureActivityPermission]);

    const stopTracking = useCallback(async () => {
        stopSubscription();

        // Capture the final value from state
        const finalSteps = await new Promise<number>((resolve) => {
            setSessionSteps((prev) => {
                const safePrev = toSafeStepNumber(prev);
                resolve(safePrev);
                return 0;
            });
        });

        await AsyncStorage.removeItem(PEDOMETER_SESSION_KEY);

        setIsTracking(false);
        setChallengeId(null);
        setDateISO(null);
        setBaseSteps(0);
        stepOffsetRef.current = 0;
        sessionStartTimeRef.current = null;

        return { sessionSteps: finalSteps };
    }, [stopSubscription]);

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
