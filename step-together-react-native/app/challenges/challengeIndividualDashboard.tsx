import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    AppState,
    Dimensions,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    clampDate,
    dayLabelDe,
    firstOfMonth,
    isInRange,
    lastOfMonth,
    mapHomeInitToDashboard,
    parseStepsThisWeek,
    sameDay,
    startOfWeek,
    stripTime,
    toIsoDate as toISO,
} from '../../services/dto/dashboardDto';

import ChallengeTabs from '../../components/ChallengeTabs';
import { usePedometer } from '../../context/PedometerContext';
import { getChallengeById } from '../../services/challengeService';
import { getHomeInit, getWeekSteps, listMyStepLogs, upsertStepsForDate } from '../../services/dashboardService';
import styles from '../styles/dashboardStyles';

const { width: screenWidth } = Dimensions.get('window');

export type StepsEntry = {
    date: string;
    dayOfWeek: string;
    numberOfSteps: number;
};

export type HomeInitDto = {
    user: { id: number | null; name: string; email: string; stepLength: number };
    team: { id: number | null; name: string };
    challenge: {
        id: number | null;
        name: string;
        startLocation: string;
        targetLocation: string;
        distanceKm?: number;
        distance?: number;
        startDate: Date | null;
        endDate: Date | null;
        state: string;
        daysLeft?: number;
        timeProgress?: number;
    };
    steps_this_week?: StepsEntry[];
};

const EMPTY_WEEK = [0, 0, 0, 0, 0, 0, 0] as const;
const FIX_STEP_LENGTH_M = 0.78;
const MAX_STEP_DELTA = 100000;
const PENDING_STEPS_KEY = 'step_together_pending_save';
const DAILY_GOAL_KEY = 'step_together_daily_goal';
const DEFAULT_GOAL = 8000;
const GOAL_MESSAGES = [
    'Na endlich.',
    'Gut gemacht. Für deine Verhältnisse.',
    'Hätte früher auch nicht geschadet.',
    'Super. Jetzt jeden Tag so.',
    'Immerhin.',
    'Wenigstens das.',
    'Morgen auch bitte.',
    "Ich sag's ungern, aber: gut.",
    'Heute ausnahmsweise mal: Respekt.',
    'Okay. Reicht.',
    'lowkey impressed ngl.',
    'Niemand hat damit gerechnet. Wirklich niemand.',
    'Heute mal kein Versagen. Schön.',
    'Dein Therapeut wäre stolz.',
];

const buildWeekFromEntries = (entries?: StepsEntry[]) => {
    if (!entries || entries.length !== 7) return [...EMPTY_WEEK];
    return entries.map((s) => s.numberOfSteps);
};

const buildCalendarGrid = (
    month: Date,
    minDate: Date | null,
    maxDate: Date | null
): { date: Date; inMonth: boolean; selectable: boolean }[] => {
    const first = firstOfMonth(month);
    const firstWeekday = ((first.getDay() + 6) % 7) + 1;
    const start = new Date(first);
    start.setDate(first.getDate() - (firstWeekday - 1));

    const cells: { date: Date; inMonth: boolean; selectable: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        cells.push({
            date: d,
            inMonth: d.getMonth() === month.getMonth(),
            selectable: isInRange(d, minDate, maxDate),
        });
    }
    return cells;
};

const toIsoUtcMidnight = (d: Date) => {
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    return new Date(Date.UTC(y, m, day, 0, 0, 0, 0)).toISOString();
};

const isAbortError = (err: any) => err?.name === 'AbortError';
const isUnauthorizedError = (err: any) => Number(err?.status) === 401;

const firstParam = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');

const toMaybeNumber = (value: string | string[] | undefined): number | null => {
    const raw = firstParam(value).trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
};

const IndividualDashboard: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const params = useLocalSearchParams();

    const selectedChallengeId = useMemo(() => toMaybeNumber(params?.id as string | string[] | undefined), [params?.id]);
    const selectedChallengeName = firstParam(params?.name as string | string[] | undefined);
    const selectedStartLocation = firstParam(params?.startLocation as string | string[] | undefined);
    const selectedTargetLocation = firstParam(params?.targetLocation as string | string[] | undefined);
    const selectedDistance = toMaybeNumber(params?.distance as string | string[] | undefined) ?? 0;
    const selectedStartDate = firstParam(params?.startDate as string | string[] | undefined);
    const selectedEndDate = firstParam(params?.endDate as string | string[] | undefined);
    const selectedState = firstParam(params?.state as string | string[] | undefined);

    const [vm, setVm] = useState<HomeInitDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [hasPendingSteps, setHasPendingSteps] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [stepInput, setStepInput] = useState('');
    const [modalError, setModalError] = useState<string | null>(null);

    const [displayDate, setDisplayDate] = useState(new Date());
    const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(startOfWeek(new Date()));
    const [weekSteps, setWeekSteps] = useState<number[]>([...EMPTY_WEEK]);
    const [stepsToday, setStepsToday] = useState(0);
    const [weekLoading, setWeekLoading] = useState(false);

    const [calendarOpen, setCalendarOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
    const [calendarPick, setCalendarPick] = useState<Date>(new Date());

    const [showExpiredWarning, setShowExpiredWarning] = useState(true);
    const [goalReached, setGoalReached] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);

    const pedometer = usePedometer();
    const isTracking = pedometer.isTracking && pedometer.challengeId === (vm?.challenge?.id ?? null);
    const [isStoppingTracking, setIsStoppingTracking] = useState(false);
    const [dailyGoal, setDailyGoal] = useState(DEFAULT_GOAL);
    const [goalModalVisible, setGoalModalVisible] = useState(false);
    const [goalInput, setGoalInput] = useState('');
    const [showDailyCelebration, setShowDailyCelebration] = useState(false);
    const [celebrationMsg, setCelebrationMsg] = useState('');
    const [goalError, setGoalError] = useState<string | null>(null);

    const celebrationAnim = useRef(new Animated.Value(0)).current;
    const celebrationShownRef = useRef(false);
    const isMountedRef = useRef(true);
    const initAbortRef = useRef<AbortController | null>(null);
    const weekAbortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            initAbortRef.current?.abort();
            weekAbortRef.current?.abort();
            initAbortRef.current = null;
            weekAbortRef.current = null;
        };
    }, []);

    useEffect(() => {
        AsyncStorage.getItem(DAILY_GOAL_KEY).then((v) => {
            if (v) setDailyGoal(Number(v) || DEFAULT_GOAL);
        });
    }, []);

    const minDate = useMemo(
        () => (vm?.challenge?.startDate ? stripTime(vm.challenge.startDate) : null),
        [vm?.challenge?.startDate]
    );

    const maxDate = useMemo(
        () => (vm?.challenge?.endDate ? stripTime(vm.challenge.endDate) : null),
        [vm?.challenge?.endDate]
    );

    const today = useMemo(() => stripTime(new Date()), []);
    const isChallengeExpired = useMemo(() => !!maxDate && today > maxDate, [maxDate, today]);

    useEffect(() => {
        if (!vm) return;
        setDisplayDate((d) => clampDate(d, minDate, maxDate));
    }, [vm, minDate, maxDate]);

    const currentDate = useMemo(
        () =>
            displayDate.toLocaleDateString('de-DE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }),
        [displayDate]
    );

    const todayClamped = useMemo(() => clampDate(new Date(), minDate, maxDate), [minDate, maxDate]);
    const isFutureSelected = useMemo(() => stripTime(displayDate) > todayClamped, [displayDate, todayClamped]);

    const initFromMapped = useCallback((mapped: HomeInitDto | null) => {
        if (!mapped) {
            setVm(null);
            setErrorMsg('Keine Daten verfügbar.');
            return;
        }

        setVm(mapped);

        const initialDisplay = clampDate(new Date(), mapped.challenge.startDate, mapped.challenge.endDate);
        const weekStart = startOfWeek(initialDisplay);

        setDisplayDate(initialDisplay);
        setSelectedWeekStart(weekStart);

        const weekArr = buildWeekFromEntries(mapped.steps_this_week);
        setWeekSteps(weekArr);

        const idx = (initialDisplay.getDay() + 6) % 7;
        setStepsToday(weekArr[idx] ?? 0);
    }, []);

    const loadInitial = useCallback(async () => {
        initAbortRef.current?.abort();
        const controller = new AbortController();
        initAbortRef.current = controller;

        setLoading(true);
        setErrorMsg(null);

        try {
            const raw = await getHomeInit(controller.signal);
            if (!isMountedRef.current) return;

            const pivot = startOfWeek(new Date());
            const mapped = mapHomeInitToDashboard(raw, pivot) as HomeInitDto | null;

            if (!mapped) {
                initFromMapped(mapped);
                return;
            }

            if (!selectedChallengeId) {
                initFromMapped(mapped);
                return;
            }

            let selected = null;
            try {
                selected = await getChallengeById(selectedChallengeId);
            } catch (e) {
                console.warn('Failed to load selected challenge by id, fallback to route params:', e);
            }

            const selectedStart = selected?.startDate ?? selected?.start_date ?? selectedStartDate;
            const selectedEnd = selected?.endDate ?? selected?.end_date ?? selectedEndDate;

            const merged: HomeInitDto = {
                ...mapped,
                challenge: {
                    id: selectedChallengeId,
                    name: selected?.name ?? selectedChallengeName ?? mapped.challenge.name,
                    startLocation:
                        selected?.startLocation ??
                        selected?.start_location ??
                        selectedStartLocation ??
                        mapped.challenge.startLocation,
                    targetLocation:
                        selected?.targetLocation ??
                        selected?.target_location ??
                        selectedTargetLocation ??
                        mapped.challenge.targetLocation,
                    distanceKm:
                        Number(selected?.distanceKm ?? selected?.distance ?? selectedDistance ?? mapped.challenge.distanceKm) || 0,
                    distance:
                        Number(selected?.distanceKm ?? selected?.distance ?? selectedDistance ?? mapped.challenge.distanceKm) || 0,
                    startDate: selectedStart ? new Date(selectedStart) : mapped.challenge.startDate,
                    endDate: selectedEnd ? new Date(selectedEnd) : mapped.challenge.endDate,
                    state: String(selected?.state ?? selectedState ?? mapped.challenge.state ?? ''),
                },
            };

            initFromMapped(merged);

            // Ziel-Check: kumulierte Schritte vs. Challenge-Distanz
            try {
                const allLogs = await listMyStepLogs();
                const cId = selectedChallengeId ?? merged.challenge.id;
                const totalSteps = (allLogs ?? [])
                    .filter((s: any) => Number(s.challengeId ?? s.challenge_id) === cId)
                    .reduce((sum: number, s: any) => sum + Number(s.numberOfSteps ?? 0), 0);
                const sl = merged.user?.stepLength;
                const stepLen = sl && sl > 0 ? sl : FIX_STEP_LENGTH_M;
                const coveredKm = (totalSteps * stepLen) / 1000;
                const targetKm = Number(merged.challenge.distanceKm ?? merged.challenge.distance ?? 0);
                if (isMountedRef.current && targetKm > 0 && coveredKm >= targetKm) {
                    setGoalReached(true);
                    setShowGoalModal(true);
                }
            } catch {
                // Ziel-Check ist optional — kein Fehler werfen
            }
        } catch (e: any) {
            if (isAbortError(e)) return;
            if (!isMountedRef.current) return;
            setErrorMsg(e?.message ?? 'Unbekannter Fehler');
            setVm(null);
        } finally {
            if (isMountedRef.current) setLoading(false);
            if (initAbortRef.current === controller) {
                initAbortRef.current = null;
            }
        }
    }, [
        initFromMapped,
        selectedChallengeId,
        selectedChallengeName,
        selectedStartLocation,
        selectedTargetLocation,
        selectedDistance,
        selectedStartDate,
        selectedEndDate,
        selectedState,
    ]);

    useEffect(() => {
        loadInitial();
    }, [loadInitial]);

    const fetchAndApplyWeek = useCallback(
        async (weekStart: Date, pivotDay: Date) => {
            if (!vm?.user?.id || !vm?.challenge?.id) return;

            weekAbortRef.current?.abort();
            const controller = new AbortController();
            weekAbortRef.current = controller;

            setWeekLoading(true);
            try {
                const resp = await getWeekSteps(vm.challenge.id!, toISO(weekStart), controller.signal);
                if (!isMountedRef.current) return;

                const parsed = parseStepsThisWeek(Array.isArray(resp) ? resp : [], weekStart);
                const arr = parsed.map((x) => x.numberOfSteps);

                setWeekSteps(arr);
                setSelectedWeekStart(weekStart);

                const idx = (pivotDay.getDay() + 6) % 7;
                setStepsToday(arr[idx] ?? 0);
            } catch (e) {
                if (isAbortError(e)) return;
                if (!isMountedRef.current) return;

                const empty = [...EMPTY_WEEK];
                setWeekSteps(empty);
                setSelectedWeekStart(weekStart);

                const idx = (pivotDay.getDay() + 6) % 7;
                setStepsToday(empty[idx] ?? 0);
            } finally {
                if (isMountedRef.current) setWeekLoading(false);
                if (weekAbortRef.current === controller) {
                    weekAbortRef.current = null;
                }
            }
        },
        [vm?.user?.id, vm?.challenge?.id]
    );

    const refreshWeek = useCallback(async () => {
        if (!vm?.user?.id || !vm?.challenge?.id) return;

        const pivot = clampDate(displayDate, minDate, maxDate);
        const weekStart = startOfWeek(pivot);

        await fetchAndApplyWeek(weekStart, pivot);
    }, [vm?.user?.id, vm?.challenge?.id, displayDate, minDate, maxDate, fetchAndApplyWeek]);

    useEffect(() => {
        if (!vm?.user?.id || !vm?.challenge?.id) return;

        const pivot = clampDate(displayDate, minDate, maxDate);
        if (!sameDay(pivot, displayDate)) setDisplayDate(pivot);

        const weekStart = startOfWeek(pivot);

        if (sameDay(weekStart, selectedWeekStart)) {
            const idx = (pivot.getDay() + 6) % 7;
            setStepsToday(weekSteps[idx] ?? 0);
            return;
        }

        fetchAndApplyWeek(weekStart, pivot);
    }, [
        displayDate,
        minDate,
        maxDate,
        vm?.user?.id,
        vm?.challenge?.id,
        selectedWeekStart,
        weekSteps,
        fetchAndApplyWeek,
    ]);

    const saveTrackedSteps = useCallback(
        async (stepsToAdd: number) => {
            if (!vm?.challenge?.id) return;

            const dateSafe = clampDate(displayDate, minDate, maxDate);
            if (stripTime(dateSafe) > stripTime(new Date())) return;

            const idx = (dateSafe.getDay() + 6) % 7;
            const dateISO = toIsoUtcMidnight(dateSafe);

            const prev = [...weekSteps];
            const current = Number(prev[idx] ?? 0);
            const nextValue = current + Math.max(0, Math.floor(stepsToAdd));

            const next = [...weekSteps];
            next[idx] = nextValue;

            setWeekSteps(next);
            setStepsToday(next[idx]);

            // Persist before API call — steps survive token expiry or network failure
            await AsyncStorage.setItem(
                PENDING_STEPS_KEY,
                JSON.stringify({ dateISO, steps: nextValue, challengeId: vm.challenge.id })
            );

            try {
                await upsertStepsForDate(dateISO, nextValue, {
                    challengeId: vm.challenge.id,
                });
                await AsyncStorage.removeItem(PENDING_STEPS_KEY);
                setHasPendingSteps(false);
                await refreshWeek();
            } catch (e) {
                setHasPendingSteps(true);
                console.warn('Save tracked steps failed:', e);
                if (isUnauthorizedError(e)) {
                    setErrorMsg('Session bleibt aktiv. Schritte werden später automatisch synchronisiert.');
                } else {
                    setErrorMsg('Schritte konnten nicht gespeichert werden. Werden automatisch synchronisiert.');
                }
            }
        },
        [vm?.challenge?.id, vm?.team?.id, displayDate, minDate, maxDate, weekSteps, refreshWeek]
    );

    const saveAbsoluteStepsForSelectedDay = useCallback(
        async (newValue: number) => {
            if (!vm?.challenge?.id) return;

            const dateSafe = clampDate(displayDate, minDate, maxDate);
            if (stripTime(dateSafe) > stripTime(new Date())) return;

            const idx = (dateSafe.getDay() + 6) % 7;
            const dateISO = toIsoUtcMidnight(dateSafe);

            const prev = [...weekSteps];
            const next = [...weekSteps];
            next[idx] = Math.max(0, Math.floor(newValue));

            setWeekSteps(next);
            setStepsToday(next[idx]);

            try {
                await upsertStepsForDate(dateISO, next[idx], {
                    challengeId: vm.challenge.id,
                });
                await refreshWeek();
            } catch (e) {
                setWeekSteps(prev);
                setStepsToday(prev[idx] ?? 0);
                console.warn('Save steps failed:', e);
                setErrorMsg('Schritte konnten nicht gespeichert werden.');
            }
        },
        [vm?.challenge?.id, vm?.team?.id, displayDate, minDate, maxDate, weekSteps, refreshWeek]
    );

    const saveGoal = async (value: number) => {
        setDailyGoal(value);
        await AsyncStorage.setItem(DAILY_GOAL_KEY, String(value));
    };

    const flushPendingSteps = useCallback(async () => {
        if (!vm?.challenge?.id) return;
        let pending: { dateISO: string; steps: number; challengeId: number } | null = null;
        try {
            const raw = await AsyncStorage.getItem(PENDING_STEPS_KEY);
            if (!raw) return;
            pending = JSON.parse(raw);
        } catch {
            return;
        }
        if (!pending || Number(pending.challengeId) !== Number(vm.challenge.id)) return;
        try {
            await upsertStepsForDate(pending.dateISO, pending.steps, {
                challengeId: pending.challengeId,
            });
            await AsyncStorage.removeItem(PENDING_STEPS_KEY);
            setHasPendingSteps(false);
            setErrorMsg(null);
            await refreshWeek();
        } catch {
            // Will retry on next focus or foreground event
        }
    }, [vm?.challenge?.id, refreshWeek]);
    const applyStepDelta = useCallback(
        async (delta: number) => {
            const dateSafe = clampDate(displayDate, minDate, maxDate);
            if (stripTime(dateSafe) > stripTime(new Date())) return;

            const idx = (dateSafe.getDay() + 6) % 7;
            const current = weekSteps[idx] ?? 0;

            if (delta > 0) {
                const add = Math.min(delta, MAX_STEP_DELTA);
                await saveAbsoluteStepsForSelectedDay(current + add);
                return;
            }

            if (delta < 0) {
                const remove = Math.min(current, Math.abs(delta));
                await saveAbsoluteStepsForSelectedDay(current - remove);
            }
        },
        [displayDate, minDate, maxDate, weekSteps, saveAbsoluteStepsForSelectedDay]
    );

    const startTracking = async () => {
        try {
            if (pedometer.isPedometerAvailable === false) {
                setErrorMsg('Pedometer ist auf diesem Gerät nicht verfügbar.');
                return;
            }

            if (!vm?.challenge?.id || vm?.challenge?.state !== 'open') {
                setErrorMsg('Du kannst nur Schritte tracken, wenn eine aktive Challenge vorhanden ist.');
                return;
            }

            if (isFutureSelected || isChallengeExpired) {
                setErrorMsg('Schritte können für diesen Tag nicht getrackt werden.');
                return;
            }

            setErrorMsg(null);
            const dateSafe = clampDate(displayDate, minDate, maxDate);
            const idx = (dateSafe.getDay() + 6) % 7;
            const base = Number(weekSteps[idx] ?? stepsToday ?? 0);
            const dateISO = toIsoUtcMidnight(dateSafe);

            await pedometer.startTracking(base, vm.challenge.id, dateISO);
        } catch (e) {
            console.warn('startTracking failed:', e);
            setErrorMsg('Pedometer konnte nicht gestartet werden.');
        }
    };

    const stopTracking = async () => {
        if (isStoppingTracking) return;
        const capturedBase = pedometer.baseSteps;
        try {
            setIsStoppingTracking(true);
            const { sessionSteps: stepsToSave } = await pedometer.stopTracking();
            const finalSteps = Math.max(0, Math.floor(stepsToSave));
            if (finalSteps > 0) {
                await saveAbsoluteStepsForSelectedDay(capturedBase + finalSteps);
            }
        } catch (e) {
            console.warn('stopTracking failed:', e);
            setErrorMsg('Schritte konnten nicht gespeichert werden.');
        } finally {
            setIsStoppingTracking(false);
        }
    };

    const liveStepsToday = useMemo(() => {
        if (isTracking) {
            return pedometer.baseSteps + pedometer.sessionSteps;
        }
        return stepsToday;
    }, [stepsToday, isTracking, pedometer.sessionSteps, pedometer.baseSteps]);

    const weeklyMax = useMemo(() => Math.max(1, ...weekSteps), [weekSteps]);
    const weeklyTotal = useMemo(() => weekSteps.reduce((a, b) => a + b, 0), [weekSteps]);

    const stepLengthMeters = useMemo(() => {
        const sl = vm?.user?.stepLength;
        return sl && sl > 0 ? sl : FIX_STEP_LENGTH_M;
    }, [vm?.user?.stepLength]);

    const distanceKmToday = useMemo(() => {
        const km = (liveStepsToday * stepLengthMeters) / 1000;
        return Math.round(km * 100) / 100;
    }, [liveStepsToday, stepLengthMeters]);

    const kcal = useMemo(() => {
        const k = liveStepsToday * 0.04;
        return Math.round(k * 100) / 100;
    }, [liveStepsToday]);

    const challengeDistanceKm = useMemo(() => {
        const ch = vm?.challenge;
        if (!ch) return 0;
        const d = ch.distanceKm ?? ch.distance ?? 0;
        return Number(d || 0);
    }, [vm?.challenge]);

    const goalProgress = useMemo(() => Math.min(1, liveStepsToday / dailyGoal), [liveStepsToday, dailyGoal]);
    const dailyGoalReached = useMemo(() => liveStepsToday >= dailyGoal, [liveStepsToday, dailyGoal]);

    useEffect(() => {
        if (dailyGoalReached && !celebrationShownRef.current) {
            celebrationShownRef.current = true;
            setCelebrationMsg(GOAL_MESSAGES[Math.floor(Math.random() * GOAL_MESSAGES.length)]);
            setShowDailyCelebration(true);
            celebrationAnim.setValue(0);
            Animated.sequence([
                Animated.spring(celebrationAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    damping: 14,
                    stiffness: 130,
                }),
                Animated.delay(2600),
                Animated.timing(celebrationAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start(() => setShowDailyCelebration(false));
        }
        if (!dailyGoalReached) {
            celebrationShownRef.current = false;
        }
    }, [dailyGoalReached]);

    useFocusEffect(
        useCallback(() => {
            if (!isTracking && !isStoppingTracking) {
                refreshWeek();
                flushPendingSteps();
            }
            return undefined;
        }, [refreshWeek, flushPendingSteps, isTracking, isStoppingTracking])
    );

    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active' && !isTracking && !isStoppingTracking) {
                refreshWeek();
                flushPendingSteps();
            }
        });
        return () => sub.remove();
    }, [refreshWeek, flushPendingSteps, isTracking, isStoppingTracking]);

    // On mount: restore pending state from AsyncStorage
    useEffect(() => {
        AsyncStorage.getItem(PENDING_STEPS_KEY).then((v) => {
            if (v) setHasPendingSteps(true);
        });
    }, []);

    // Auto-retry flush once vm is ready and there is a pending save
    useEffect(() => {
        if (isTracking || isStoppingTracking) return;
        if (!hasPendingSteps || !vm?.challenge?.id) return;
        flushPendingSteps();
    }, [hasPendingSteps, vm?.challenge?.id, flushPendingSteps, isTracking, isStoppingTracking]);

    useEffect(() => {
        if (!vm?.user?.id || isTracking || isStoppingTracking) return;
        const id = setInterval(() => refreshWeek(), 30000);
        return () => clearInterval(id);
    }, [vm?.user?.id, vm?.challenge?.id, refreshWeek, isTracking, isStoppingTracking]);

    const EmptyChallengeCard = () => (
        <View style={{ flex: 1, backgroundColor: '#F5F7F4', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
            <View
                style={{
                    width: '100%',
                    maxWidth: 420,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 26,
                    paddingVertical: 26,
                    paddingHorizontal: 22,
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 22,
                    shadowOffset: { width: 0, height: 10 },
                    elevation: 5,
                }}
            >
                <View
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        backgroundColor: '#e3efe6',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                        alignSelf: 'center',
                    }}
                >
                    <Ionicons name="flag-outline" size={22} color="#2f5c3a" />
                </View>

                <Text style={[styles.font, { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 6, textAlign: 'center' }]}>
                    Keine offene Challenge
                </Text>

                <Text style={[styles.font, { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 22, textAlign: 'center' }]}>
                    Du hast zurzeit keine offene Challenge. Schau dir die kommenden Challenges an oder wirf einen Blick auf deine bisherigen Aktivitäten.
                </Text>

                <TouchableOpacity
                    onPress={() => router.push('/userHistory')}
                    activeOpacity={0.85}
                    style={{
                        paddingVertical: 12,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        backgroundColor: '#F9FAFB',
                    }}
                >
                    <Text style={[styles.font, { color: '#374151', fontWeight: '700', fontSize: 14 }]}>Meine Challenge-Historie</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#F5F7F4' }}>
                <ChallengeTabs active="overview" overviewPath="/challenges/challengeIndividualDashboard" rankingPath="/challenges/challengeIndividualDashboardDetails" />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" />
                    <Text style={[styles.font, { marginTop: 12, color: '#2F3E34' }]}>Lade Daten...</Text>
                </View>
            </View>
        );
    }

    const hasActiveChallenge = vm?.challenge?.id != null && vm?.challenge?.state === 'open';
    const hasSelectedChallenge = selectedChallengeId != null;
    const canShowChallenge = hasSelectedChallenge ? vm?.challenge?.id != null : hasActiveChallenge;

    if (!vm || !canShowChallenge) {
        return (
            <View style={{ flex: 1 }}>
                <ChallengeTabs active="overview" overviewPath="/challenges/challengeIndividualDashboard" rankingPath="/challenges/challengeIndividualDashboardDetails" />
                <EmptyChallengeCard />
            </View>
        );
    }

    const calendarHeader = calendarMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    const calendarGrid = buildCalendarGrid(calendarMonth, minDate, maxDate);

    const canGoPrevMonth = (() => {
        if (!minDate) return true;
        const prev = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
        return lastOfMonth(prev) >= firstOfMonth(minDate);
    })();

    const canGoNextMonth = (() => {
        if (!maxDate) return true;
        const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
        return firstOfMonth(next) <= lastOfMonth(maxDate);
    })();

    const goPrevMonth = () => {
        if (!canGoPrevMonth) return;
        setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    };

    const goNextMonth = () => {
        if (!canGoNextMonth) return;
        setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    };

    const isTodaySelected = sameDay(displayDate, today);

    const overviewPath = vm?.challenge?.id ? `/challenges/challengeIndividualDashboard?id=${vm.challenge.id}` : '/challenges/challengeIndividualDashboard';
    const rankingPath = vm?.challenge?.id ? `/challenges/challengeIndividualDashboardDetails?id=${vm.challenge.id}` : '/challenges/challengeIndividualDashboardDetails';

    return (
        <View style={{ flex: 1 }}>
            <ChallengeTabs active="overview" overviewPath={overviewPath} rankingPath={rankingPath} />
            <ScrollView style={[styles.container, { paddingTop: 0 }]} contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}>
                {!goalReached && isChallengeExpired && showExpiredWarning && (
                    <View style={styles.expiredWarningContainer}>
                        <Ionicons name="information-circle" size={22} color="#DC2626" style={styles.expiredWarningIcon} />
                        <View style={styles.expiredWarningContent}>
                            <Text style={[styles.font, styles.expiredWarningTitle]}>Challenge beendet</Text>
                            <Text style={[styles.font, styles.expiredWarningText]}>
                                Diese Challenge ist bereits abgelaufen. Du kannst keine Schritte mehr hinzufügen, aber du kannst weiterhin die Statistiken
                                und das Ranking einsehen.
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowExpiredWarning(false)} style={styles.closeWarningButton}>
                            <Ionicons name="close" size={18} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.topSection}>
                    <View style={styles.dateRow}>
                        <TouchableOpacity
                            accessibilityRole="button"
                            onPress={() => {
                                const safe = clampDate(displayDate, minDate, maxDate);
                                setCalendarPick(safe);
                                setCalendarMonth(new Date(safe.getFullYear(), safe.getMonth(), 1));
                                setCalendarOpen(true);
                            }}
                            style={[styles.calIconBtn, { flexDirection: 'row', alignItems: 'center' }]}
                        >
                            <Text style={[styles.date, styles.font, { marginRight: 6 }]}>{currentDate}</Text>
                            <Ionicons name="calendar-outline" size={22} color="#2F3E34" />
                        </TouchableOpacity>
                    </View>

                    {vm.user?.name && (
                        <Text style={[styles.font, { textAlign: 'center', color: '#6B7280', marginTop: 8 }]}>
                            Willkommen, <Text style={{ color: '#2F3E34', fontWeight: '700' }}>{vm.user.name}</Text>
                            <Text style={{ color: '#7FA58C', fontWeight: '600' }}>{' · '}Individual Challenge</Text>
                        </Text>
                    )}

                    <View style={styles.hr} />

                    <Text style={[styles.challengeRow, styles.font]}>
                        <Text style={styles.challengeLabel}>Challenge: </Text>
                        {vm.challenge.startLocation || '—'} → {vm.challenge.targetLocation || '—'}{' '}
                        <Text style={styles.challengeMeta}>({challengeDistanceKm} km)</Text>
                    </Text>

                    <View style={styles.metricsRow}>
                        <View style={styles.metricSide}>
                            <View style={{ alignItems: 'center' }}>
                                <Ionicons name="flame" size={screenWidth < 380 ? 22 : 24} color="#E25822" style={{ marginBottom: 4 }} />
                                <Text style={[styles.metricSideValue, styles.font]}>{weekLoading ? '…' : kcal}</Text>
                                <Text style={[styles.metricSideLabel, styles.font]}>Kcal</Text>
                            </View>
                        </View>

                        <View style={styles.stepCircleWrapper}>
                            <View style={styles.stepCircleOuter}>
                                <View style={styles.stepCircleInnerRing} />
                                <View style={styles.stepCircle}>
                                    <Text style={[styles.stepValue, styles.font]}>{weekLoading ? '…' : liveStepsToday}</Text>
                                    <Text style={[styles.stepLabel, styles.font]}>{isTracking ? 'LIVE' : 'SCHRITTE'}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.metricSide}>
                            <View style={{ alignItems: 'center' }}>
                                <MaterialIcons name="place" size={screenWidth < 380 ? 22 : 24} color="#F54927" style={{ marginBottom: 4 }} />
                                <Text style={[styles.metricSideValue, styles.font]}>{weekLoading ? '…' : distanceKmToday}</Text>
                                <Text style={[styles.metricSideLabel, styles.font]}>km</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ marginTop: 16, marginBottom: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={[styles.font, { fontSize: 13, color: '#6B7280' }]}>Tagesziel</Text>
                            <TouchableOpacity
                                onPress={() => { setGoalInput(String(dailyGoal)); setGoalModalVisible(true); }}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            >
                                <Text style={[styles.font, { fontSize: 13, color: dailyGoalReached ? '#2F6B45' : '#7FA58C', fontWeight: '700' }]}>
                                    {dailyGoalReached ? '✓ ' : ''}{dailyGoal.toLocaleString('de-DE')} Schritte
                                </Text>
                                <Ionicons name="pencil-outline" size={13} color={dailyGoalReached ? '#2F6B45' : '#7FA58C'} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ height: 8, backgroundColor: '#E8F0EA', borderRadius: 999, overflow: 'hidden' }}>
                            <View style={{ height: '100%', width: `${Math.round(goalProgress * 100)}%`, backgroundColor: dailyGoalReached ? '#2F6B45' : '#7EA88F', borderRadius: 999 }} />
                        </View>
                        <Text style={[styles.font, { fontSize: 12, color: '#9CA3AF', marginTop: 4, textAlign: 'right' }]}>
                            {Math.round(goalProgress * 100)} %{dailyGoalReached ? ' — Ziel erreicht!' : ` von ${dailyGoal.toLocaleString('de-DE')}`}
                        </Text>
                    </View>

                    {isTracking && (
                        <View style={{ marginTop: 14, alignItems: 'center' }}>
                            <View style={{
                                backgroundColor: '#EAF4ED',
                                borderRadius: 18,
                                paddingHorizontal: 28,
                                paddingVertical: 12,
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#C8DFD0',
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#2F6B45' }} />
                                    <Text style={[styles.font, { fontSize: 11, color: '#5A8B6A', fontWeight: '700', letterSpacing: 0.8 }]}>SESSION</Text>
                                </View>
                                <Text style={[styles.font, { fontSize: 30, fontWeight: '800', color: '#2F6B45', lineHeight: 34 }]}>
                                    {Number.isFinite(Number(pedometer.sessionSteps))
                                        ? Number(pedometer.sessionSteps).toLocaleString('de-DE')
                                        : '0'}
                                </Text>
                                <Text style={[styles.font, { fontSize: 12, color: '#7FA88C', marginTop: 2 }]}>Schritte</Text>
                            </View>
                        </View>
                    )}

                    {errorMsg ? (
                        <Text style={[styles.font, { marginTop: 12, textAlign: 'center', color: '#B91C1C' }]}>
                            {errorMsg}
                        </Text>
                    ) : null}

                    {hasPendingSteps ? (
                        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <MaterialIcons name="sync" size={16} color="#D97706" />
                            <Text style={[styles.font, { color: '#D97706', fontSize: 13 }]}>
                                Schritte ausstehend — werden synchronisiert (Session bleibt aktiv)
                            </Text>
                            <TouchableOpacity onPress={flushPendingSteps} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Text style={[styles.font, { color: '#D97706', fontSize: 13, textDecorationLine: 'underline' }]}>
                                    Jetzt
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    {pedometer.isPedometerAvailable === false ? (
                        <Text style={[styles.font, { marginTop: 12, textAlign: 'center', color: '#6B7280' }]}>
                            Pedometer ist auf diesem Gerät nicht verfügbar.
                        </Text>
                    ) : null}

                    <View style={{ marginTop: 18, gap: 12 }}>
                        <TouchableOpacity
                            style={[
                                styles.primaryActionBtn,
                                (isTracking || pedometer.isPedometerAvailable === false || isFutureSelected || isChallengeExpired || goalReached || !isTodaySelected) && styles.buttonDisabled,
                            ]}
                            disabled={isTracking || pedometer.isPedometerAvailable === false || isFutureSelected || isChallengeExpired || goalReached || !isTodaySelected}
                            onPress={startTracking}
                            activeOpacity={0.9}
                        >
                            <Ionicons name="play" size={18} color="#fff" />
                            <Text style={[styles.primaryActionBtnText, styles.font]}>Tracking starten</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.dangerActionBtn,
                                (!isTracking || !isTodaySelected || isStoppingTracking) && styles.buttonDisabled,
                            ]}
                            disabled={!isTracking || !isTodaySelected || isStoppingTracking}
                            onPress={stopTracking}
                            activeOpacity={0.9}
                        >
                            <Ionicons name="stop" size={18} color="#fff" />
                            <Text style={[styles.dangerActionBtnText, styles.font]}>
                                {isStoppingTracking ? 'Speichert…' : 'Stopp & speichern'}
                            </Text>
                        </TouchableOpacity>

                        {!isTodaySelected && (
                            <Text style={[styles.font, { textAlign: 'center', color: '#6B7280', marginTop: 8 }]}>
                                Tracking ist nur für den heutigen Tag verfügbar.
                            </Text>
                        )}

                        {__DEV__ && (
                            <View style={{ gap: 8 }}>
                                <TouchableOpacity
                                    style={{ backgroundColor: '#fbbf24', padding: 10, borderRadius: 8, alignItems: 'center' }}
                                    onPress={() => saveTrackedSteps(500)}
                                >
                                    <Text style={{ fontWeight: '700' }}>DEV: save 500 steps (success)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ backgroundColor: '#f87171', padding: 10, borderRadius: 8, alignItems: 'center' }}
                                    onPress={async () => {
                                        // Simulate what happens when the API call fails (e.g. token expired after 3h)
                                        const idx = (new Date().getDay() + 6) % 7;
                                        const prev = [...weekSteps];
                                        setWeekSteps(prev); // no optimistic update
                                        setErrorMsg('Schritte konnten nicht gespeichert werden.');
                                    }}
                                >
                                    <Text style={{ fontWeight: '700', color: '#fff' }}>DEV: simulate save failure</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.secondaryActionBtn,
                                (isFutureSelected || isChallengeExpired || goalReached) && styles.buttonDisabled,
                            ]}
                            disabled={isFutureSelected || isChallengeExpired || goalReached}
                            onPress={() => setModalVisible(true)}
                            activeOpacity={0.9}
                        >
                            <Ionicons name="create-outline" size={18} color="#2F3E34" />
                            <Text style={[styles.secondaryActionBtnText, styles.font]}>
                                {isChallengeExpired || goalReached
                                    ? 'Keine Bearbeitung möglich'
                                    : isFutureSelected
                                        ? 'Zukünftiger Tag'
                                        : 'Schritte bearbeiten'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.weeklyTitle, styles.font]}>
                        Diese Woche: <Text style={{ color: '#5F764E' }}>{weeklyTotal} Schritte</Text>
                    </Text>

                    <View style={styles.weekChart}>
                        {weekSteps.map((value, i) => {
                            const height = (value / weeklyMax) * 120;
                            return (
                                <View key={i} style={styles.barCol}>
                                    <View style={styles.barTrack}>
                                        <View style={[styles.barFill, { height }]} />
                                    </View>
                                    <Text style={[styles.dayLabel, styles.font]}>{dayLabelDe[i]}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                <Modal animationType="slide" transparent visible={goalModalVisible} onRequestClose={() => { setGoalModalVisible(false); setGoalError(null); }}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.stepsCard, { paddingTop: 20 }]}>
                            <View style={{ width: 42, height: 42, borderRadius: 999, backgroundColor: '#e3efe6', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 10 }}>
                                <Ionicons name="flag" size={20} color="#2F6B45" />
                            </View>
                            <Text style={[styles.font, { fontSize: 17, fontWeight: '900', color: '#0F1411', textAlign: 'center', marginBottom: 3 }]}>
                                Tagesziel setzen
                            </Text>
                            <Text style={[styles.font, { fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 16 }]}>
                                Heute: <Text style={{ fontWeight: '700', color: '#2F3E34' }}>{liveStepsToday.toLocaleString('de-DE')}</Text> Schritte
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                                {[
                                    { steps: 5000, label: 'Immerhin' },
                                    { steps: 8000, label: 'Passt schon' },
                                    { steps: 10000, label: 'Okay Respekt' },
                                    { steps: 15000, label: 'Krank' },
                                ].map(({ steps, label }) => {
                                    const selected = goalInput === String(steps);
                                    return (
                                        <TouchableOpacity
                                            key={steps}
                                            onPress={() => setGoalInput(String(steps))}
                                            style={{
                                                width: '47%',
                                                paddingVertical: 10,
                                                borderRadius: 14,
                                                alignItems: 'center',
                                                backgroundColor: selected ? '#2F6B45' : '#F2F7F3',
                                                borderWidth: selected ? 0 : 1,
                                                borderColor: '#DDE8DF',
                                            }}
                                        >
                                            <Text style={[styles.font, { fontSize: 17, fontWeight: '900', color: selected ? '#fff' : '#2F3E34' }]}>
                                                {steps / 1000}k
                                            </Text>
                                            <Text style={[styles.font, { fontSize: 11, color: selected ? 'rgba(255,255,255,0.75)' : '#6B7280', marginTop: 2 }]}>
                                                {label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <View style={styles.fieldWrap}>
                                <Text style={[styles.font, styles.fieldLabel]}>Eigene Zahl</Text>
                                <View style={styles.inputWrap}>
                                    <Ionicons name="walk-outline" size={18} style={{ marginRight: 8, opacity: 0.6 }} />
                                    <TextInput
                                        style={[styles.inputBare, styles.font]}
                                        placeholder="z. B. 9000"
                                        placeholderTextColor="#9AA7A0"
                                        keyboardType="number-pad"
                                        value={goalInput}
                                        onChangeText={setGoalInput}
                                    />
                                </View>
                            </View>
                            <TouchableOpacity
                                style={{ backgroundColor: '#2F6B45', paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginTop: 4 }}
                                onPress={() => {
                                    const num = parseInt(goalInput, 10);
                                    if (!isNaN(num) && num >= 100 && num <= 50000) {
                                        saveGoal(num);
                                        setGoalModalVisible(false);
                                        setGoalError(null);
                                    } else if (isNaN(num) || num < 100) {
                                        setGoalError('Mindestens 100 Schritte eingeben.');
                                    } else {
                                        setGoalError('Maximum: 50.000 Schritte.');
                                    }
                                }}
                                activeOpacity={0.9}
                            >
                                <Text style={[styles.font, { color: '#fff', fontWeight: '800', fontSize: 15 }]}>Speichern</Text>
                            </TouchableOpacity>
                            {goalError ? (
                                <Text style={[styles.font, { color: '#B91C1C', fontSize: 12, textAlign: 'center', marginTop: 6 }]}>{goalError}</Text>
                            ) : null}
                            <TouchableOpacity style={[styles.cancelGhost, { marginTop: 8 }]} onPress={() => { setGoalModalVisible(false); setGoalError(null); }}>
                                <Text style={[styles.font, styles.cancelGhostText]}>Abbrechen</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.stepsCard}>
                            <View style={styles.cardHeader}>
                                <Text style={[styles.font, styles.cardTitle]}>Schritte verwalten</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setModalVisible(false);
                                        setModalError(null);
                                        setStepInput('');
                                    }}
                                    style={styles.headerX}
                                >
                                    <Ionicons name="close" size={18} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.fieldWrap}>
                                <Text style={[styles.font, styles.fieldLabel]}>Anzahl Schritte</Text>
                                <View style={styles.inputWrap}>
                                    <Ionicons name="walk-outline" size={18} style={{ marginRight: 8, opacity: 0.6 }} />
                                    <TextInput
                                        style={[styles.inputBare, styles.font]}
                                        placeholder="z. B. 1200"
                                        placeholderTextColor="#9AA7A0"
                                        keyboardType="number-pad"
                                        value={stepInput}
                                        onChangeText={setStepInput}
                                    />
                                </View>
                            </View>

                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    style={[styles.primaryBtn, (isFutureSelected || isChallengeExpired) && { opacity: 0.5 }]}
                                    disabled={isFutureSelected || isChallengeExpired}
                                    onPress={async () => {
                                        const num = parseInt(stepInput, 10);
                                        if (!isNaN(num) && num > 0 && num <= MAX_STEP_DELTA) {
                                            setModalError(null);
                                            await applyStepDelta(num);
                                            setModalVisible(false);
                                            setStepInput('');
                                        } else if (num > MAX_STEP_DELTA) {
                                            setModalError(`Maximal ${MAX_STEP_DELTA} Schritte pro Vorgang erlaubt.`);
                                        } else {
                                            setModalError('Bitte eine gültige Schrittzahl eingeben.');
                                        }
                                    }}
                                >
                                    <Text style={[styles.font, styles.primaryBtnText]}>Hinzufügen</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.secondaryBtn, (isFutureSelected || isChallengeExpired) && { opacity: 0.5 }]}
                                    disabled={isFutureSelected || isChallengeExpired}
                                    onPress={async () => {
                                        const num = parseInt(stepInput, 10);
                                        const dateSafe = clampDate(displayDate, minDate, maxDate);
                                        const idx = (dateSafe.getDay() + 6) % 7;
                                        const current = Number(weekSteps[idx] ?? 0);

                                        if (!isNaN(num) && num > 0 && num <= current) {
                                            setModalError(null);
                                            await applyStepDelta(-num);
                                            setModalVisible(false);
                                            setStepInput('');
                                        } else if (num > current) {
                                            setModalError('Du kannst nicht mehr Schritte entfernen als vorhanden.');
                                        } else {
                                            setModalError('Bitte eine gültige Schrittzahl eingeben.');
                                        }
                                    }}
                                >
                                    <Text style={[styles.font, styles.secondaryBtnText]}>Entfernen</Text>
                                </TouchableOpacity>
                            </View>

                            {modalError ? (
                                <Text style={[styles.font, { color: '#B91C1C', textAlign: 'center', marginTop: 8 }]}>{modalError}</Text>
                            ) : null}

                            {isChallengeExpired ? (
                                <View style={styles.expiredModalWarning}>
                                    <Ionicons name="information-circle" size={18} color="#B91C1C" />
                                    <Text style={[styles.font, styles.expiredModalWarningText]}>
                                        Diese Challenge ist bereits beendet. Das Hinzufügen oder Entfernen von Schritten ist nicht mehr möglich.
                                    </Text>
                                </View>
                            ) : isFutureSelected ? (
                                <Text style={[styles.font, { color: '#6B7280', textAlign: 'center', marginTop: 8 }]}>
                                    Zukünftige Tage können nicht bearbeitet werden.
                                </Text>
                            ) : null}

                            <TouchableOpacity
                                style={styles.cancelGhost}
                                onPress={() => {
                                    setModalVisible(false);
                                    setModalError(null);
                                    setStepInput('');
                                }}
                            >
                                <Text style={[styles.font, styles.cancelGhostText]}>Abbrechen</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal animationType="fade" transparent visible={calendarOpen} onRequestClose={() => setCalendarOpen(false)}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setCalendarOpen(false)}>
                        <View style={styles.calendarCard}>
                            <View style={styles.calHeader}>
                                <TouchableOpacity
                                    onPress={goPrevMonth}
                                    style={[styles.navPill, !canGoPrevMonth && { opacity: 0.35 }]}
                                    disabled={!canGoPrevMonth}
                                >
                                    <Ionicons name="chevron-back" size={18} />
                                </TouchableOpacity>

                                <Text style={[styles.font, styles.calHeaderTitle]}>{calendarHeader}</Text>

                                <TouchableOpacity
                                    onPress={goNextMonth}
                                    style={[styles.navPill, !canGoNextMonth && { opacity: 0.35 }]}
                                    disabled={!canGoNextMonth}
                                >
                                    <Ionicons name="chevron-forward" size={18} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.weekRow}>
                                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
                                    <Text key={d} style={[styles.font, styles.weekCell]}>
                                        {d}
                                    </Text>
                                ))}
                            </View>

                            <View style={styles.grid}>
                                {calendarGrid.map(({ date, inMonth, selectable }, idx) => {
                                    const isSame = sameDay(date, calendarPick);
                                    const disabled = !inMonth || !selectable;
                                    const isPast = stripTime(date) < today;
                                    const isToday = sameDay(date, today);

                                    return (
                                        <TouchableOpacity
                                            key={`${date.toISOString()}-${idx}`}
                                            style={[
                                                styles.dayCellWrap,
                                                isPast && inMonth && selectable && styles.dayPastWrap,
                                                isToday && styles.dayTodayWrap,
                                                isSame && !disabled && styles.daySelectedWrap,
                                                disabled && { opacity: 0.35 },
                                            ]}
                                            onPress={() => !disabled && setCalendarPick(date)}
                                            disabled={disabled}
                                        >
                                            <View style={styles.dayCellInner}>
                                                <Text
                                                    style={[
                                                        styles.dayCellText,
                                                        styles.font,
                                                        !inMonth && styles.dayOutText,
                                                        isSame && !disabled && styles.daySelectedText,
                                                    ]}
                                                >
                                                    {date.getDate()}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <TouchableOpacity
                                style={styles.applyBtn}
                                onPress={() => {
                                    const safe = clampDate(calendarPick, minDate, maxDate);
                                    setDisplayDate(safe);
                                    setCalendarOpen(false);
                                }}
                            >
                                <Text style={[styles.font, styles.applyBtnText]}>Übernehmen</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setCalendarOpen(false)}>
                                <Text style={[styles.font, styles.cancelBtnText]}>Abbrechen</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
                <Modal animationType="fade" transparent visible={showGoalModal} onRequestClose={() => setShowGoalModal(false)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                        <View style={{ backgroundColor: '#fff', borderRadius: 28, padding: 28, width: '100%', maxWidth: 380, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}>
                            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#e3efe6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                <Ionicons name="trophy" size={32} color="#2E7D32" />
                            </View>
                            <Text style={[styles.font, { fontSize: 22, fontWeight: '900', color: '#0F1411', marginBottom: 8, textAlign: 'center' }]}>
                                Ziel erreicht! 🎉
                            </Text>
                            <Text style={[styles.font, { fontSize: 15, color: '#55605A', lineHeight: 22, textAlign: 'center', marginBottom: 8 }]}>
                                Du hast die Challenge-Distanz von{' '}
                                <Text style={{ fontWeight: '800', color: '#2E7D32' }}>{challengeDistanceKm} km</Text>{' '}
                                erfolgreich zurückgelegt.
                            </Text>
                            <Text style={[styles.font, { fontSize: 13, color: '#8A9590', textAlign: 'center', marginBottom: 24 }]}>
                                Es können keine weiteren Schritte mehr hinzugefügt werden.
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowGoalModal(false)}
                                activeOpacity={0.9}
                                style={{ backgroundColor: '#55805c', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 18, width: '100%', alignItems: 'center' }}
                            >
                                <Text style={[styles.font, { color: '#fff', fontWeight: '800', fontSize: 15 }]}>Verstanden</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>

            {showDailyCelebration && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        {
                            position: 'absolute',
                            bottom: 130,
                            left: 16,
                            right: 16,
                            backgroundColor: '#1A5432',
                            borderRadius: 24,
                            paddingVertical: 18,
                            paddingHorizontal: 20,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 14,
                            shadowColor: '#000',
                            shadowOpacity: 0.28,
                            shadowRadius: 20,
                            shadowOffset: { width: 0, height: 10 },
                            elevation: 12,
                        },
                        {
                            opacity: celebrationAnim,
                            transform: [
                                {
                                    translateY: celebrationAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [80, 0],
                                    }),
                                },
                                {
                                    scale: celebrationAnim.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [0.88, 1.04, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <View style={{ width: 52, height: 52, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="trophy" size={28} color="#FFD700" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.font, { color: '#fff', fontWeight: '900', fontSize: 17, marginBottom: 3 }]}>
                            Tagesziel erreicht! 🎉
                        </Text>
                        <Text style={[styles.font, { color: 'rgba(255,255,255,0.72)', fontSize: 13 }]}>
                            {celebrationMsg}
                        </Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

export default IndividualDashboard;