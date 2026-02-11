import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
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
} from '../services/dto/dashboardDto';

import {
  getHomeInit,
  getWeekSteps,
  upsertStepsForDate,
} from '../services/dashboardService';

import styles from './styles/dashboardStyles';

const { width: screenWidth } = Dimensions.get('window');

export type StepsEntry = {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  numberOfSteps: number;
};

export type HomeInitDto = {
  user: {
    id: number | null;
    name: string;
    email: string;
    stepLength: number; // Meter pro Schritt
  };
  team: {
    id: number | null;
    name: string;
  };
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
    timeProgress?: number; // 0..1
  };
  steps_this_week?: StepsEntry[];
};

const EMPTY_WEEK = [0, 0, 0, 0, 0, 0, 0] as const;
const FIX_STEP_LENGTH_M = 0.78;
const MAX_STEP_DELTA = 100000;

// ---------- Helpers ----------
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
  const firstWeekday = ((first.getDay() + 6) % 7) + 1; // 1..7, Mo=1
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

const Dashboard: React.FC = () => {
  const router = useRouter();

  // Core VM
  const [vm, setVm] = useState<HomeInitDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // UI State
  const [modalVisible, setModalVisible] = useState(false);
  const [stepInput, setStepInput] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Date & Week State
  const [displayDate, setDisplayDate] = useState(new Date());
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(
    startOfWeek(new Date())
  );
  const [weekSteps, setWeekSteps] = useState<number[]>([...EMPTY_WEEK]);
  const [stepsToday, setStepsToday] = useState(0);
  const [weekLoading, setWeekLoading] = useState(false);

  // Calendar modal state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [calendarPick, setCalendarPick] = useState<Date>(new Date());

  // Warning state
  const [showExpiredWarning, setShowExpiredWarning] = useState(true);

  // Congrats popup
  const [showCongrats, setShowCongrats] = useState(false);
  const [didShowCongrats, setDidShowCongrats] = useState(false);
  const prevChallengeStateRef = useRef<string | null>(null);
  const prevChallengeIdRef = useRef<number | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ===== Challenge bounds =====
  const minDate = useMemo(
    () => (vm?.challenge?.startDate ? stripTime(vm.challenge.startDate) : null),
    [vm?.challenge?.startDate]
  );
  const maxDate = useMemo(
    () => (vm?.challenge?.endDate ? stripTime(vm.challenge.endDate) : null),
    [vm?.challenge?.endDate]
  );

  const today = stripTime(new Date());

  const isChallengeExpired = useMemo(
    () => !!maxDate && today > maxDate,
    [maxDate, today]
  );

  // Clamp displayDate wenn Bounds sich ändern
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

  const todayClamped = useMemo(
    () => clampDate(new Date(), minDate, maxDate),
    [minDate, maxDate]
  );

  const isFutureSelected = useMemo(
    () => stripTime(displayDate) > todayClamped,
    [displayDate, todayClamped]
  );

  const calendarHeader = useMemo(
    () =>
      calendarMonth.toLocaleDateString('de-DE', {
        month: 'long',
        year: 'numeric',
      }),
    [calendarMonth]
  );

  const calendarGrid = useMemo(
    () => buildCalendarGrid(calendarMonth, minDate, maxDate),
    [calendarMonth, minDate, maxDate]
  );

  const canGoPrevMonth = useMemo(() => {
    if (!minDate) return true;
    const prev = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() - 1,
      1
    );
    return lastOfMonth(prev) >= firstOfMonth(minDate);
  }, [calendarMonth, minDate]);

  const canGoNextMonth = useMemo(() => {
    if (!maxDate) return true;
    const next = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + 1,
      1
    );
    return firstOfMonth(next) <= lastOfMonth(maxDate);
  }, [calendarMonth, maxDate]);

  const goPrevMonth = () => {
    if (canGoPrevMonth) {
      setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    }
  };
  const goNextMonth = () => {
    if (canGoNextMonth) {
      setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    }
  };

  const challengeDistanceKm = useMemo(() => {
    const ch = vm?.challenge;
    if (!ch) return 0;
    const d = ch.distanceKm ?? ch.distance ?? 0;
    return Number(d || 0);
  }, [vm?.challenge]);


  // ---------- Date helpers (timezone-safe) ----------
  const toIsoUtcMidnight = (d: Date) => {
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    return new Date(Date.UTC(y, m, day, 0, 0, 0, 0)).toISOString();
  };


  // ========= Initial load & Retry =========
  const initFromMapped = (mapped: HomeInitDto | null) => {
    if (!mapped) {
      setVm(null);
      setErrorMsg('Keine Daten verfügbar.');
      return;
    }

    setVm(mapped);

    const initialDisplay = clampDate(
      new Date(),
      mapped.challenge.startDate,
      mapped.challenge.endDate
    );

    setDisplayDate(initialDisplay);
    setSelectedWeekStart(startOfWeek(initialDisplay));

    const weekArr = buildWeekFromEntries(mapped.steps_this_week);
    setWeekSteps(weekArr);

    const idx = (initialDisplay.getDay() + 6) % 7;
    setStepsToday(weekArr[idx] ?? 0);
  };

  const loadInitial = useCallback(async () => {
    let alive = true;
    setLoading(true);
    setErrorMsg(null);

    try {
      const raw = await getHomeInit();
      if (!alive) return;

      const pivot = startOfWeek(new Date());
      const mapped = mapHomeInitToDashboard(raw, pivot) as HomeInitDto | null;
      initFromMapped(mapped);
    } catch (e: any) {
      if (!alive) return;
      setErrorMsg(e?.message ?? 'Unbekannter Fehler');
    } finally {
      if (alive) setLoading(false);
    }

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // ===== Woche nachladen / Refresh =====
  const refreshWeek = useCallback(async () => {
    if (!vm?.user?.id || !vm?.challenge?.id) return;

    const pivot = clampDate(displayDate, minDate, maxDate);
    const weekStart = startOfWeek(pivot);

    try {
      setWeekLoading(true);
      const respWeek = await getWeekSteps(
        vm.challenge.id!,
        vm.user.id!,
        toISO(weekStart)
      );

      if (!isMountedRef.current) return;


      const parsed = Array.isArray(respWeek)
        ? parseStepsThisWeek(respWeek, weekStart)
        : parseStepsThisWeek([], weekStart);


      const arr = parsed.map((x) => x.numberOfSteps);

      setWeekSteps(arr);

      const idx = (pivot.getDay() + 6) % 7;
      setStepsToday(arr[idx] ?? 0);
      setSelectedWeekStart(weekStart);
    } catch {
      // optional logging
    } finally {
      if (isMountedRef.current) setWeekLoading(false);
    }
  }, [vm?.user?.id, vm?.challenge?.id, displayDate, minDate, maxDate]);

  // Week change & Tageswerte
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

    setWeekLoading(true);
    (async () => {
      try {
        const resp = await getWeekSteps(
          vm.challenge!.id!,
          vm.user!.id!,
          toISO(weekStart)
        );

        const parsed = Array.isArray(resp)
          ? parseStepsThisWeek(resp, weekStart)
          : parseStepsThisWeek([], weekStart);

        const arr = parsed.map((x) => x.numberOfSteps);
        setWeekSteps(arr);

        const idx = (pivot.getDay() + 6) % 7;
        setStepsToday(arr[idx] ?? 0);
        setSelectedWeekStart(weekStart);
      } catch {
        const empty = [...EMPTY_WEEK];
        const idx = (pivot.getDay() + 6) % 7;
        setWeekSteps(empty);
        setStepsToday(empty[idx] ?? 0);
        setSelectedWeekStart(weekStart);
      } finally {
        setWeekLoading(false);
      }
    })();
  }, [
    displayDate,
    vm?.user?.id,
    vm?.challenge?.id,
    selectedWeekStart,
    minDate,
    maxDate,
    weekSteps,
  ]);

  // ---- Save Steps ----
  const saveAbsoluteStepsForSelectedDay = async (newValue: number) => {
    console.log('🟦 saveAbsoluteStepsForSelectedDay START:', newValue);

    if (!vm?.user?.id || !vm?.challenge?.id || !vm?.team?.id) return;

    const dateSafe = clampDate(displayDate, minDate, maxDate);
    if (stripTime(dateSafe) > stripTime(new Date())) return; // keine Zukunft

    const idx = (dateSafe.getDay() + 6) % 7;

    // IMPORTANT: send UTC-midnight ISO to backend to avoid iPhone timezone shifting the date
    const dateISO = toIsoUtcMidnight(dateSafe);

    const prev = [...weekSteps];
    const next = [...weekSteps];

    next[idx] = Math.max(0, Math.floor(newValue));

    // optimistic update
    setWeekSteps(next);
    setStepsToday(next[idx]);

    try {
      console.log('🟦 CALL upsertStepsForDate:', {
        userId: vm.user.id,
        challengeId: vm.challenge.id,
        teamId: vm.team.id,
        dateISO,
        numberOfSteps: next[idx],
      });

      await upsertStepsForDate(vm.user.id, dateISO, next[idx], {
        challengeId: vm.challenge.id,
        teamId: vm.team.id,
      });

      // Refresh once to sync UI with backend
      await refreshWeek();
    } catch (e) {
      setWeekSteps(prev);
      setStepsToday(prev[idx] ?? 0);
      console.warn('Save steps failed:', e);
    }
  };


  const applyStepDelta = async (delta: number) => {
    const dateSafe = clampDate(displayDate, minDate, maxDate);
    if (stripTime(dateSafe) > stripTime(new Date())) return;

    const idx = (dateSafe.getDay() + 6) % 7;
    const current = weekSteps[idx] ?? 0;

    console.log('🟨 applyStepDelta START', { delta, idx, current });

    if (delta > 0) {
      const add = Math.min(delta, MAX_STEP_DELTA);
      const newTotal = current + add;
      console.log('🟨 ADDING', { current, add, newTotal });
      await saveAbsoluteStepsForSelectedDay(newTotal);
      return;
    }

    if (delta < 0) {
      const remove = Math.min(current, Math.abs(delta));
      const newTotal = current - remove;
      console.log('🟨 REMOVING', { current, remove, newTotal });
      await saveAbsoluteStepsForSelectedDay(newTotal);
    }
  };


  // ========= Derived =========
  const weeklyMax = Math.max(1, ...weekSteps);
  const weeklyTotal = useMemo(
    () => weekSteps.reduce((a, b) => a + b, 0),
    [weekSteps]
  );

  const stepLengthMeters =
    vm?.user?.stepLength && vm.user.stepLength > 0
      ? vm.user.stepLength
      : FIX_STEP_LENGTH_M;

  const distanceKmToday = useMemo(() => {
    const km = (stepsToday * stepLengthMeters) / 1000;
    return Math.round(km * 100) / 100;
  }, [stepsToday, stepLengthMeters]);

  const kcal = useMemo(() => {
    const k = stepsToday * 0.04;
    return Math.round(k * 100) / 100;
  }, [stepsToday]);

  // ✅ Congrats: nur bei State-Transition open -> closed
  useEffect(() => {
    const ch = vm?.challenge;
    if (!ch?.id) return;

    // Reset wenn neue Challenge
    if (prevChallengeIdRef.current !== ch.id) {
      prevChallengeIdRef.current = ch.id;
      prevChallengeStateRef.current = ch.state ?? null;
      setDidShowCongrats(false);
      setShowCongrats(false);
      return;
    }

    const prev = prevChallengeStateRef.current;
    const next = ch.state ?? null;

    if (prev === 'open' && next === 'closed' && !didShowCongrats) {
      setDidShowCongrats(true);
      setShowCongrats(true);

      const t = setTimeout(() => setShowCongrats(false), 1400);
      return () => clearTimeout(t);
    }

    prevChallengeStateRef.current = next;
  }, [vm?.challenge?.id, vm?.challenge?.state, didShowCongrats]);

  // ===== Auto-Refresh =====
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
  }, [vm?.user?.id, vm?.team?.id, vm?.challenge?.id, selectedWeekStart, refreshWeek]);

  // ========= Render Guards =========
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5F7F4',
        }}
      >
        <ActivityIndicator size="large" />
        <Text style={[styles.font, { marginTop: 12, color: '#2F3E34' }]}>
          Lade Daten...
        </Text>
      </View>
    );
  }

  if (errorMsg || !vm) {
    const pivot = startOfWeek(new Date());
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#F5F7F4',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}
      >
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
          <Text
            style={[
              styles.font,
              {
                fontSize: 18,
                fontWeight: '800',
                color: '#111',
                marginBottom: 6,
                textAlign: 'center',
              },
            ]}
          >
            Keine offene Challenge
          </Text>

          <Text
            style={[
              styles.font,
              {
                fontSize: 14,
                color: '#6B7280',
                lineHeight: 20,
                marginBottom: 22,
                textAlign: 'center',
              },
            ]}
          >
            Sieht so aus als hättest du keine offene Challenge. Schau dir die kommenden hier an.
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
            <Text style={[styles.font, { color: '#fff', fontWeight: '800', fontSize: 15 }]}>
              Zu den Challenges
            </Text>
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
            <Text style={[styles.font, { color: '#374151', fontWeight: '700', fontSize: 14 }]}>
              Meine Challenge-Historie
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ========= Render (Active Challenge) =========
  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }}
      >
        {isChallengeExpired && showExpiredWarning && (
          <View style={styles.expiredWarningContainer}>
            <Ionicons
              name="information-circle"
              size={22}
              color="#DC2626"
              style={styles.expiredWarningIcon}
            />
            <View style={styles.expiredWarningContent}>
              <Text style={[styles.font, styles.expiredWarningTitle]}>
                Challenge beendet
              </Text>
              <Text style={[styles.font, styles.expiredWarningText]}>
                Diese Challenge ist bereits abgelaufen. Du kannst keine Schritte mehr
                hinzufügen oder entfernen, aber du kannst weiterhin die Statistiken
                und das Ranking einsehen.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowExpiredWarning(false)}
              style={styles.closeWarningButton}
            >
              <Ionicons name="close" size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        )}

        {/* DATE + USER + CHALLENGE */}
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
              <Text style={[styles.date, styles.font, { marginRight: 6 }]}>
                {currentDate}
              </Text>
              <Ionicons name="calendar-outline" size={22} color="#2F3E34" />
            </TouchableOpacity>
          </View>

          {vm.user?.name && (
            <Text
              style={[
                styles.font,
                { textAlign: 'center', color: '#6B7280', marginTop: 8 },
              ]}
            >
              Willkommen,{' '}
              <Text style={{ color: '#2F3E34', fontWeight: '700' }}>
                {vm.user.name}
              </Text>
              {vm.team?.name && (
                <Text style={{ color: '#7FA58C', fontWeight: '600' }}>
                  {' · '}Team {vm.team.name}
                </Text>
              )}{' '}
            </Text>
          )}

          <View style={styles.hr} />

          <Text style={[styles.challengeRow, styles.font]}>
            <Text style={styles.challengeLabel}>Challenge: </Text>
            {vm.challenge.startLocation || '—'} → {vm.challenge.targetLocation || '—'}{' '}
            <Text style={styles.challengeMeta}>({challengeDistanceKm} km)</Text>
          </Text>

          {/* METRICS */}
          <View style={styles.metricsRow}>
            <View style={styles.metricSide}>
              <View style={{ alignItems: 'center' }}>
                <Ionicons
                  name="flame"
                  size={screenWidth < 380 ? 22 : 24}
                  color="#E25822"
                  style={{ marginBottom: 4 }}
                />
                <Text style={[styles.metricSideValue, styles.font]}>
                  {weekLoading ? '…' : kcal}
                </Text>
                <Text style={[styles.metricSideLabel, styles.font]}>Kcal</Text>
              </View>
            </View>

            <View style={styles.stepCircleWrapper}>
              <View style={styles.stepCircleOuter}>
                <View style={styles.stepCircleInnerRing} />
                <View style={styles.stepCircle}>
                  <Text style={[styles.stepValue, styles.font]}>
                    {weekLoading ? '…' : stepsToday}
                  </Text>
                  <Text style={[styles.stepLabel, styles.font]}>SCHRITTE</Text>
                </View>
              </View>
            </View>

            <View style={styles.metricSide}>
              <View style={{ alignItems: 'center' }}>
                <MaterialIcons
                  name="place"
                  size={screenWidth < 380 ? 22 : 24}
                  color="#F54927"
                  style={{ marginBottom: 4 }}
                />
                <Text style={[styles.metricSideValue, styles.font]}>
                  {weekLoading ? '…' : distanceKmToday}
                </Text>
                <Text style={[styles.metricSideLabel, styles.font]}>km</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.editBtn,
              (isFutureSelected || isChallengeExpired) && { opacity: 0.5 },
            ]}
            disabled={isFutureSelected || isChallengeExpired}
            onPress={() => setModalVisible(true)}
          >
            <Text style={[styles.editBtnText, styles.font]}>
              {isChallengeExpired
                ? 'Challenge abgelaufen - Keine Bearbeitung möglich'
                : isFutureSelected
                  ? 'Zukunft nicht bearbeitbar'
                  : 'Schritte bearbeiten'}
            </Text>
          </TouchableOpacity>

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

        {/* MODAL: Schritte verwalten */}
        <Modal
          animationType="fade"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.stepsCard}>
              <View style={styles.cardHeader}>
                <Text style={[styles.font, styles.cardTitle]}>Schritte verwalten</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.headerX}>
                  <Ionicons name="close" size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.font, styles.fieldLabel]}>Anzahl Schritte</Text>
                <View style={styles.inputWrap}>
                  <Ionicons
                    name="walk-outline"
                    size={18}
                    style={{ marginRight: 8, opacity: 0.6 }}
                  />
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
                <Text style={[styles.font, { color: '#B91C1C', textAlign: 'center', marginTop: 8 }]}>
                  {modalError}
                </Text>
              ) : null}

              {isChallengeExpired ? (
                <View style={styles.expiredModalWarning}>
                  <Ionicons name="information-circle" size={18} color="#B91C1C" />
                  <Text style={[styles.font, styles.expiredModalWarningText]}>
                    Diese Challenge ist bereits beendet. Das Hinzufügen oder Entfernen von
                    Schritten ist nicht mehr möglich.
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
                }}
              >
                <Text style={[styles.font, styles.cancelGhostText]}>Abbrechen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL: Calendar */}
        <Modal
          animationType="fade"
          transparent
          visible={calendarOpen}
          onRequestClose={() => setCalendarOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setCalendarOpen(false)}
          >
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
      </ScrollView>

      {showCongrats && (
        <View
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: 40,
            backgroundColor: '#2F3E34',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 18,
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 6,
          }}
        >
          <Text
            style={[
              styles.font,
              {
                color: '#fff',
                fontWeight: '800',
                textAlign: 'center',
                fontSize: 15,
              },
            ]}
          >
            🎉 Gratulation! Challenge abgeschlossen!
          </Text>
        </View>
      )}
    </>
  );
};

export default Dashboard;