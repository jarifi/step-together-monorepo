import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
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

import BottomBar from '../../components/BottomBar';
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

    const [isTracking, setIsTracking] = useState(false);
    const [sessionSteps, setSessionSteps] = useState(0);
    const [sessionStart, setSessionStart] = useState<number | null>(null);
    const [isPedometerAvailable, setIsPedometerAvailable] = useState<boolean | null>(null);

    const subscriptionRef = useRef<any>(null);
    const isMountedRef = useRef(true);
    const initAbortRef = useRef<AbortController | null>(null);
    const weekAbortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;

            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
            }

            initAbortRef.current?.abort();
            weekAbortRef.current?.abort();
            initAbortRef.current = null;
            weekAbortRef.current = null;
        };
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
            const available = await Pedometer.isAvailableAsync();
            if (isMountedRef.current) {
                setIsPedometerAvailable(available);
            }

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

            try {
                await upsertStepsForDate(dateISO, nextValue, {
                    challengeId: vm.challenge.id,
                });
                await refreshWeek();
            } catch (e) {
                setWeekSteps(prev);
                setStepsToday(prev[idx] ?? 0);
                console.warn('Save tracked steps failed:', e);
                setErrorMsg('Schritte konnten nicht gespeichert werden.');
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
            const available = await Pedometer.isAvailableAsync();
            setIsPedometerAvailable(available);

            if (!available) {
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

            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
            }

            setErrorMsg(null);
            setSessionSteps(0);
            setSessionStart(null);
            setIsTracking(true);

            subscriptionRef.current = Pedometer.watchStepCount((result) => {
                const total = Number(result?.steps ?? 0);

                setSessionStart((prev) => {
                    const base = prev ?? total;
                    const counted = total - base;
                    setSessionSteps(counted > 0 ? counted : 0);
                    return base;
                });
            });
        } catch (e) {
            console.warn('startTracking failed:', e);
            setIsTracking(false);
            setErrorMsg('Pedometer konnte nicht gestartet werden.');
        }
    };

    const stopTracking = async () => {
        try {
            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
            }

            setIsTracking(false);

            if (sessionSteps > 0) {
                await saveTrackedSteps(sessionSteps);
            }
        } catch (e) {
            console.warn('stopTracking failed:', e);
            setErrorMsg('Schritte konnten nicht gespeichert werden.');
        } finally {
            setSessionSteps(0);
            setSessionStart(null);
        }
    };

    const liveStepsToday = useMemo(() => {
        return stepsToday + (isTracking ? sessionSteps : 0);
    }, [stepsToday, isTracking, sessionSteps]);

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

    useFocusEffect(
        useCallback(() => {
            refreshWeek();
            return undefined;
        }, [refreshWeek])
    );

    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') refreshWeek();
        });
        return () => sub.remove();
    }, [refreshWeek]);

    useEffect(() => {
        if (!vm?.user?.id) return;
        const id = setInterval(() => refreshWeek(), 30000);
        return () => clearInterval(id);
    }, [vm?.user?.id, vm?.challenge?.id, refreshWeek]);

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
                    onPress={() => router.push('/challenges/activeChallenges')}
                    activeOpacity={0.9}
                    style={{
                        backgroundColor: '#658869ff',
                        paddingVertical: 14,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                    }}
                >
                    <Text style={[styles.font, { color: '#fff', fontWeight: '800', fontSize: 15 }]}>Zu den Challenges</Text>
                </TouchableOpacity>

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
            <>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7F4' }}>
                    <ActivityIndicator size="large" />
                    <Text style={[styles.font, { marginTop: 12, color: '#2F3E34' }]}>Lade Daten...</Text>
                </View>
                <BottomBar pathname={pathname} overviewPath={vm?.challenge?.id ? `/challenges/challengeIndividualDashboard?id=${vm.challenge.id}` : '/challenges/challengeIndividualDashboard'} />
            </>
        );
    }

    const hasActiveChallenge = vm?.challenge?.id != null && vm?.challenge?.state === 'open';
    const hasSelectedChallenge = selectedChallengeId != null;
    const canShowChallenge = hasSelectedChallenge ? vm?.challenge?.id != null : hasActiveChallenge;

    if (!vm || errorMsg || !canShowChallenge) {
        return (
            <>
                <EmptyChallengeCard />
                <BottomBar pathname={pathname} overviewPath={vm?.challenge?.id ? `/challenges/challengeIndividualDashboard?id=${vm.challenge.id}` : '/challenges/challengeIndividualDashboard'} />
            </>
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

    return (
        <>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }}>
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

                    <View style={{ alignItems: 'center', marginTop: 12 }}>
                        <Text style={[styles.font, { color: '#6B7280' }]}>Session</Text>
                        <Text style={[styles.font, { fontSize: 22, fontWeight: '800', color: '#2F3E34' }]}>{sessionSteps}</Text>
                    </View>

                    {errorMsg ? (
                        <Text style={[styles.font, { marginTop: 12, textAlign: 'center', color: '#B91C1C' }]}>
                            {errorMsg}
                        </Text>
                    ) : null}

                    {isPedometerAvailable === false ? (
                        <Text style={[styles.font, { marginTop: 12, textAlign: 'center', color: '#6B7280' }]}>
                            Pedometer ist auf diesem Gerät nicht verfügbar.
                        </Text>
                    ) : null}

                    <View style={{ marginTop: 18, gap: 12 }}>
                        <TouchableOpacity
                            style={[
                                styles.primaryActionBtn,
                                (isTracking || isPedometerAvailable === false || isFutureSelected || isChallengeExpired || goalReached || !isTodaySelected) && styles.buttonDisabled,
                            ]}
                            disabled={isTracking || isPedometerAvailable === false || isFutureSelected || isChallengeExpired || goalReached || !isTodaySelected}
                            onPress={startTracking}
                            activeOpacity={0.9}
                        >
                            <Ionicons name="play" size={18} color="#fff" />
                            <Text style={[styles.primaryActionBtnText, styles.font]}>Tracking starten</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.dangerActionBtn,
                                (!isTracking || !isTodaySelected) && styles.buttonDisabled,
                            ]}
                            disabled={!isTracking || !isTodaySelected}
                            onPress={stopTracking}
                            activeOpacity={0.9}
                        >
                            <Ionicons name="stop" size={18} color="#fff" />
                            <Text style={[styles.dangerActionBtnText, styles.font]}>Stopp & speichern</Text>
                        </TouchableOpacity>

                        {!isTodaySelected && (
                            <Text style={[styles.font, { textAlign: 'center', color: '#6B7280', marginTop: 8 }]}>
                                Tracking ist nur für den heutigen Tag verfügbar.
                            </Text>
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
            <BottomBar
                pathname={pathname}
                overviewPath={vm?.challenge?.id ? `/challenges/challengeIndividualDashboard?id=${vm.challenge.id}` : '/challenges/challengeIndividualDashboard'}
                challengePath={
                    vm?.challenge?.id
                        ? `/challenges/challengeIndividualDashboardDetails?id=${vm.challenge.id}`
                        : '/challenges/challengeIndividualDashboardDetails'
                }
            />
        </>
    );
};

export default IndividualDashboard;