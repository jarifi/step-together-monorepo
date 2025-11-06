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
} from './dashboard/dashboardDto';

import { getHomeInit, getWeekSteps, upsertStepsForDate } from '../services/dashboardService';
import { getTeamRanking } from '../services/teamService';
import styles from './styles/dashboardStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ======================
// Types (lokal)
// ======================
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

export type RankingItem = {
  userId: number | null;
  name: string;
  steps: number;
  stepLength?: number | null; // m per step
  isUser?: boolean;
  rankColor?: string | null;
};

// ======================
// Bottom Navigation Component
// ======================
const BottomNavigation: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({ activeTab, onTabChange }) => {
  return (
    <View style={bottomNavStyles.container}>
      <TouchableOpacity
        style={bottomNavStyles.tab}
        onPress={() => onTabChange('dashboard')}
      >
        <Ionicons
          name={activeTab === 'dashboard' ? 'home' : 'home-outline'}
          size={22}
          color={activeTab === 'dashboard' ? '#7FA58C' : '#6B7280'}
        />
        <Text style={[
          bottomNavStyles.tabText,
          { color: activeTab === 'dashboard' ? '#7FA58C' : '#6B7280' }
        ]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={bottomNavStyles.tab}
        onPress={() => onTabChange('ranking')}
      >
        <Ionicons
          name={activeTab === 'ranking' ? 'trophy' : 'trophy-outline'}
          size={22}
          color={activeTab === 'ranking' ? '#7FA58C' : '#6B7280'}
        />
        <Text style={[
          bottomNavStyles.tabText,
          { color: activeTab === 'ranking' ? '#7FA58C' : '#6B7280' }
        ]}>
          Ranking
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={bottomNavStyles.tab}
        onPress={() => onTabChange('challenges')}
      >
        <Ionicons
          name={activeTab === 'challenges' ? 'flag' : 'flag-outline'}
          size={22}
          color={activeTab === 'challenges' ? '#7FA58C' : '#6B7280'}
        />
        <Text style={[
          bottomNavStyles.tabText,
          { color: activeTab === 'challenges' ? '#7FA58C' : '#6B7280' }
        ]}>
          Challenges
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={bottomNavStyles.tab}
        onPress={() => onTabChange('teams')}
      >
        <Ionicons
          name={activeTab === 'teams' ? 'people' : 'people-outline'}
          size={22}
          color={activeTab === 'teams' ? '#7FA58C' : '#6B7280'}
        />
        <Text style={[
          bottomNavStyles.tabText,
          { color: activeTab === 'teams' ? '#7FA58C' : '#6B7280' }
        ]}>
          Teams
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={bottomNavStyles.tab}
        onPress={() => onTabChange('more')}
      >
        <Ionicons
          name={activeTab === 'more' ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline'}
          size={22}
          color={activeTab === 'more' ? '#7FA58C' : '#6B7280'}
        />
        <Text style={[
          bottomNavStyles.tabText,
          { color: activeTab === 'more' ? '#7FA58C' : '#6B7280' }
        ]}>
          Mehr
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const bottomNavStyles = {
  container: {
    flexDirection: 'row' as const,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 8,
    paddingTop: 8,
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 6,
  },
  tabText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500' as const,
  },
};

// ======================
// Main Dashboard Component
// ======================
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
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(startOfWeek(new Date()));
  const [weekSteps, setWeekSteps] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [stepsToday, setStepsToday] = useState(0);
  const [weekLoading, setWeekLoading] = useState(false);

  // Calendar modal state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [calendarPick, setCalendarPick] = useState<Date>(new Date());

  // Warning state
  const [showExpiredWarning, setShowExpiredWarning] = useState(true);

  // Bottom Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');

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

  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const fmt = useMemo(() => new Intl.NumberFormat('de-DE'), []);
  const fmt1 = useMemo(() => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }), []);

  const [distanceKmDone, setDistanceKmDone] = useState(0);
  const [distancePct, setDistancePct] = useState(0); // 0..100

  const FIX_STEP_LENGTH_M = 0.78;
  const MAX_STEP_DELTA = 100000;

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ===== Challenge Status =====
  const isChallengeExpired = useMemo(() => {
    if (!maxDate) return false;
    return today > maxDate;
  }, [maxDate, today]);

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

  const todayClamped = useMemo(() => clampDate(new Date(), minDate, maxDate), [minDate, maxDate]);

  const isFutureSelected = useMemo(
    () => stripTime(displayDate) > todayClamped,
    [displayDate, todayClamped]
  );

  const calendarHeader = useMemo(
    () => calendarMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
    [calendarMonth]
  );

  const calendarGrid = useMemo(() => {
    const first = firstOfMonth(calendarMonth);
    const firstWeekday = ((first.getDay() + 6) % 7) + 1; // 1..7, Mo=1
    const start = new Date(first);
    start.setDate(first.getDate() - (firstWeekday - 1));

    const cells: { date: Date; inMonth: boolean; selectable: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const inMonth = d.getMonth() === calendarMonth.getMonth();
      const selectable = isInRange(d, minDate, maxDate);
      cells.push({ date: d, inMonth, selectable });
    }
    return cells;
  }, [calendarMonth, minDate, maxDate]);

  const canGoPrevMonth = useMemo(() => {
    if (!minDate) return true;
    const prev = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    return lastOfMonth(prev) >= firstOfMonth(minDate);
  }, [calendarMonth, minDate]);

  const canGoNextMonth = useMemo(() => {
    if (!maxDate) return true;
    const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    return firstOfMonth(next) <= lastOfMonth(maxDate);
  }, [calendarMonth, maxDate]);

  const goPrevMonth = () => { if (canGoPrevMonth) setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)); };
  const goNextMonth = () => { if (canGoNextMonth) setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)); };

  // ===== Challenge-Distanz robust =====
  const challengeDistanceKm = useMemo(() => {
    const ch = vm?.challenge;
    if (!ch) return 0;
    const d = ch.distanceKm ?? ch.distance ?? 0;
    return Number(d || 0);
  }, [vm?.challenge]);

  // ========= Initial load =========
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const raw = await getHomeInit();
        if (!alive) return;

        const pivot = startOfWeek(new Date());
        const mapped = mapHomeInitToDashboard(raw, pivot) as HomeInitDto | null;
        if (!mapped) {
          setVm(null);
          setErrorMsg('Keine Daten verfügbar.');
          return;
        }

        setVm(mapped);

        const initialDisplay = clampDate(new Date(), mapped.challenge.startDate, mapped.challenge.endDate);
        setDisplayDate(initialDisplay);
        setSelectedWeekStart(startOfWeek(initialDisplay));

        const arr = (mapped.steps_this_week ?? []).map((s) => s.numberOfSteps);
        const weekArr = arr.length === 7 ? arr : [0, 0, 0, 0, 0, 0, 0];
        setWeekSteps(weekArr);

        const idx = (initialDisplay.getDay() + 6) % 7;
        setStepsToday(weekArr[idx] ?? 0);
      } catch (e: any) {
        if (!alive) return;
        setErrorMsg(e?.message ?? 'Unbekannter Fehler');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ===== zentraler Refresh (Woche + Ranking) =====
  const refreshWeekAndRanking = useCallback(async () => {
    if (!vm?.user?.id || !vm?.challenge?.id) return;
    const pivot = clampDate(displayDate, minDate, maxDate);
    const weekStart = startOfWeek(pivot);

    try {
      setWeekLoading(true);
      const [respWeek, respRank] = await Promise.all([
        getWeekSteps(vm.challenge.id!, vm.user.id!, toISO(weekStart)),
        vm.team?.id && vm?.challenge?.id ? getTeamRanking(vm.team.id, vm.challenge.id) : Promise.resolve(null),
      ]);

      if (!isMountedRef.current) return;

      const parsed = Array.isArray(respWeek)
        ? parseStepsThisWeek(respWeek, weekStart)
        : parseStepsThisWeek([], weekStart);
      const arr = parsed.map((x) => x.numberOfSteps);
      setWeekSteps(arr);

      const idx = (pivot.getDay() + 6) % 7;
      setStepsToday(arr[idx] ?? 0);
      setSelectedWeekStart(weekStart);

      if (respRank) {
        const normalized: RankingItem[] = respRank.map((r: any) => {
          const slRaw =
            r?.stepLength ?? r?.user?.stepLength ?? r?.step_length ?? r?.user_step_length ?? 0;
          const sl = Number(slRaw);
          return {
            userId: (r?.userId ?? r?.user?.id ?? r?.id) ?? null,
            name: String(r?.name ?? r?.user?.name ?? '—'),
            steps: Number(r?.numberOfSteps ?? r?.steps ?? 0),
            stepLength: Number.isFinite(sl) && sl > 0 ? sl : FIX_STEP_LENGTH_M,
          };
        });

        normalized.sort((a, b) => b.steps - a.steps);
        const decorated = normalized.map((r, i) => ({
          ...r,
          isUser: vm.user?.id != null && r.userId === vm.user.id,
          rankColor: i === 0 ? '#C8A100' : i === 1 ? '#999999' : i === 2 ? '#C9716D' : null,
        }));

        setRankings(decorated);
      }
    } catch {
      // optional logging
    } finally {
      if (isMountedRef.current) setWeekLoading(false);
    }
  }, [vm?.user?.id, vm?.team?.id, vm?.challenge?.id, displayDate, minDate, maxDate]);

  // Team-Ranking initial
  useEffect(() => {
    if (!vm?.team?.id || !vm?.challenge?.id) return;
    let alive = true;
    (async () => {
      try {
        setRankingLoading(true);
        setRankingError(null);
        const raw = await getTeamRanking(vm.team.id!, vm.challenge.id!);
        if (!alive) return;

        const normalized: RankingItem[] = raw.map((r: any) => {
          const slRaw =
            r?.stepLength ?? r?.user?.stepLength ?? r?.step_length ?? r?.user_step_length ?? 0;
          const sl = Number(slRaw);
          return {
            userId: (r?.userId ?? r?.user?.id ?? r?.id) ?? null,
            name: String(r?.name ?? r?.user?.name ?? '—'),
            steps: Number(r?.numberOfSteps ?? r?.steps ?? 0),
            stepLength: Number.isFinite(sl) && sl > 0 ? sl : FIX_STEP_LENGTH_M,
          };
        });
        normalized.sort((a, b) => b.steps - a.steps);
        const decorated = normalized.map((r, i) => ({
          ...r,
          isUser: vm.user?.id != null && r.userId === vm.user.id,
          rankColor: i === 0 ? '#C8A100' : i === 1 ? '#999999' : i === 2 ? '#C9716D' : null,
        }));
        setRankings(decorated);
      } catch (err: any) {
        console.error('Error fetching team ranking', err);
        setRankingError(err?.message ?? 'Konnte Ranking nicht laden');
        setRankings([]);
      } finally {
        setRankingLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [vm?.team?.id, vm?.challenge?.id, vm?.user?.id]);

  // ========= Week change & Tageswerte =========
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
        const resp = await getWeekSteps(vm.challenge!.id!, vm.user!.id!, toISO(weekStart));
        const parsed = Array.isArray(resp)
          ? parseStepsThisWeek(resp, weekStart)
          : parseStepsThisWeek([], weekStart);

        const arr = parsed.map((x) => x.numberOfSteps);
        setWeekSteps(arr);

        const idx = (pivot.getDay() + 6) % 7;
        setStepsToday(arr[idx] ?? 0);
        setSelectedWeekStart(weekStart);
      } catch {
        const empty = [0, 0, 0, 0, 0, 0, 0];
        const idx = (pivot.getDay() + 6) % 7;
        setWeekSteps(empty);
        setStepsToday(empty[idx] ?? 0);
        setSelectedWeekStart(weekStart);
      } finally {
        setWeekLoading(false);
      }
    })();
  }, [displayDate, vm?.user?.id, vm?.challenge?.id, selectedWeekStart, minDate, maxDate]);

  // ---- Save Steps ----
  const saveAbsoluteStepsForSelectedDay = async (newValue: number) => {
    if (!vm?.user?.id || !vm?.challenge?.id || !vm?.team?.id) return;

    const dateSafe = clampDate(displayDate, minDate, maxDate);
    if (stripTime(dateSafe) > stripTime(new Date())) return; // keine Zukunft

    const idx = (dateSafe.getDay() + 6) % 7;
    const dateISO = toISO(dateSafe);

    const prev = [...weekSteps];
    const next = [...weekSteps];
    next[idx] = Math.max(0, Math.floor(newValue));
    setWeekSteps(next);
    setStepsToday(next[idx]);

    try {
      await upsertStepsForDate(
        vm.user.id,
        dateISO,
        next[idx],
        { challengeId: vm.challenge.id, teamId: vm.team.id }
      );
      // sofort Server-Wert + Ranking holen
      refreshWeekAndRanking();
    } catch (e) {
      // rollback
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

    if (delta > 0) {
      const add = Math.min(delta, MAX_STEP_DELTA);
      await saveAbsoluteStepsForSelectedDay(current + add);
    } else if (delta < 0) {
      const remove = Math.min(current, Math.abs(delta));
      await saveAbsoluteStepsForSelectedDay(current - remove);
    }
  };

  // ========= Derived =========
  const weeklyMax = Math.max(1, ...weekSteps);
  const weeklyTotal = useMemo(() => weekSteps.reduce((a, b) => a + b, 0), [weekSteps]);

  const stepLengthMeters = vm?.user?.stepLength && vm.user.stepLength > 0
    ? vm.user.stepLength
    : 0.78;

  const distanceKm = useMemo(() => {
    const km = (stepsToday * stepLengthMeters) / 1000;
    return Math.round(km * 100) / 100;
  }, [stepsToday, stepLengthMeters]);

  const kcal = useMemo(() => {
    const k = stepsToday * 0.04; // grob
    return Math.round(k * 100) / 100;
  }, [stepsToday]);

  const timeProgressRaw = vm?.challenge?.timeProgress ?? 0;
  const daysLeft = vm?.challenge?.daysLeft;

  // ===== Team-Progress =====
  useEffect(() => {
    const targetKm = Number(challengeDistanceKm || 0);
    if (!Array.isArray(rankings) || rankings.length === 0 || !targetKm) {
      setDistanceKmDone(0);
      setDistancePct(0);
      return;
    }

    const kmSum = rankings.reduce((sum, r) => {
      const steps = Number(r?.steps || 0);
      const len = Number(r?.stepLength || 0) > 0 ? Number(r.stepLength) : 0.78;
      return sum + (steps * len) / 1000;
    }, 0);

    const pct = Math.max(0, Math.min(100, (kmSum / Math.max(1, targetKm)) * 100));
    setDistanceKmDone(Number.isFinite(kmSum) ? kmSum : 0);
    setDistancePct(Math.round(pct));
  }, [rankings, challengeDistanceKm]);

  // ===== Auto-Refresh =====
  useFocusEffect(
    useCallback(() => {
      refreshWeekAndRanking();
      return undefined;
    }, [refreshWeekAndRanking])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshWeekAndRanking();
    });
    return () => sub.remove();
  }, [refreshWeekAndRanking]);

  useEffect(() => {
    if (!vm?.user?.id) return;
    const id = setInterval(() => {
      refreshWeekAndRanking();
    }, 30000);
    return () => clearInterval(id);
  }, [vm?.user?.id, vm?.team?.id, vm?.challenge?.id, selectedWeekStart, refreshWeekAndRanking]);

  // ========= More Menu Functions =========
  const handleMoreMenuItemPress = (item: string) => {
    switch (item) {
      case 'Alle Teams':
        router.push('/teams');
        break;
      case 'Alle Challenges':
        router.push('/challenges');
        break;
      case 'Alle Benutzer':
        router.push('/users');
        break;
      case 'Einstellungen':
        router.push('/settings');
        break;
      case 'Admin-Bereich':
        router.push('/admin');
        break;
      case 'Logout':
        // Logout-Logik hier implementieren
        console.log('Logout durchgeführt');
        router.replace('/login');
        break;
      default:
        break;
    }
  };

  // ========= Render Content Based on Active Tab =========
  const renderDashboardContent = () => (
    <>
      {/* SOFORTIGE WARNMELDUNG - Immer sichtbar wenn Challenge abgelaufen */}
      {isChallengeExpired && showExpiredWarning && (
        <View style={styles.expiredWarningContainer}>
          <Ionicons name="information-circle" size={22} color="#DC2626" style={styles.expiredWarningIcon} />
          <View style={styles.expiredWarningContent}>
            <Text style={[styles.font, styles.expiredWarningTitle]}>
              Challenge beendet 
            </Text>
            <Text style={[styles.font, styles.expiredWarningText]}>
              Diese Challenge ist bereits abgelaufen. Du kannst keine Schritte mehr hinzufügen oder entfernen, 
              aber du kannst weiterhin die Statistiken und das Ranking einsehen.
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

        {/* Username */}
        {vm.user?.name ? (
          <Text style={[styles.font, { textAlign: 'center', color: '#6B7280', marginTop: 8 }]}>
            Willkommen, <Text style={{ color: '#2F3E34', fontWeight: '700' }}>{vm.user.name}</Text> 👋
          </Text>
        ) : null}

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
              <Ionicons name="flame" size={screenWidth < 380 ? 22 : 24} color="#E25822" style={{ marginBottom: 4 }} />
              <Text style={[styles.metricSideValue, styles.font]}>{weekLoading ? '…' : kcal}</Text>
              <Text style={[styles.metricSideLabel, styles.font]}>Kcal</Text>
            </View>
          </View>

          <View style={styles.stepCircleWrapper}>
            <View style={styles.stepCircleOuter}>
              <View style={styles.stepCircleInnerRing} />
              <View style={styles.stepCircle}>
                <Text style={[styles.stepValue, styles.font]}>{weekLoading ? '…' : stepsToday}</Text>
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
              <Text style={[styles.metricSideValue, styles.font]}>{weekLoading ? '…' : distanceKm}</Text>
              <Text style={[styles.metricSideLabel, styles.font]}>km</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.editBtn, (isFutureSelected || isChallengeExpired) && { opacity: 0.5 }]}
          disabled={isFutureSelected || isChallengeExpired}
          onPress={() => setModalVisible(true)}
        >
          <Text style={[styles.editBtnText, styles.font]}>
            {isChallengeExpired ? 'Challenge abgelaufen - Keine Bearbeitung möglich' : isFutureSelected ? 'Zukunft nicht bearbeitbar' : 'Schritte bearbeiten'}
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

      {/* CHALLENGE PROGRESS */}
      <View style={styles.progressCard}>
        <Text style={[styles.progressTitle, styles.font]}>
          <Text style={{ color: '#5F764E', fontWeight: '700' }}>Challenge </Text>Fortschritt
        </Text>

        <View style={styles.topScaleRow}>
          <Text style={[styles.scaleTick, styles.font]}>Start </Text>
          <Text style={[styles.scaleTick, styles.font]}>Ziel: {challengeDistanceKm} km</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${distancePct}%` }]} />
        </View>
        <Text style={[styles.progressNote, styles.font]}>
          <Text style={{ color: '#5F764E', fontWeight: '800' }}>{distancePct}%</Text> der Strecke geschafft.
          {' '}({fmt1.format(distanceKmDone)} / {challengeDistanceKm} km){'\n'}
          {typeof daysLeft === 'number' ? <>Noch <Text style={{ fontWeight: '900' }}>{daysLeft}</Text> Tage übrig.</> : null}
        </Text>
      </View>
    </>
  );

  const renderRankingContent = () => (
    <View style={styles.progressCard}>
      <Text style={[styles.progressTitle, styles.font]}>
        <Text style={{ color: '#5F764E', fontWeight: '700' }}>Team </Text>Ranking
      </Text>

      {rankingLoading && (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator />
        </View>
      )}

      {rankingError && !rankingLoading && (
        <Text style={[styles.font, { color: '#B91C1C', marginVertical: 6, textAlign: 'center' }]}>
          {rankingError}
        </Text>
      )}

      {!rankingLoading && !rankingError && rankings.length === 0 && (
        <Text style={[styles.font, { color: '#6B7280', marginVertical: 20, textAlign: 'center' }]}>
          Noch keine Ranking-Daten vorhanden.
        </Text>
      )}

      {!rankingLoading && !rankingError && rankings.length > 0 && rankings.map((u, idx) => (
        <View key={`${u.userId ?? 'x'}-${idx}`} style={[styles.rankRow, u.isUser && styles.rankRowMe]}>
          <Text style={[styles.rankBadge, styles.font, u.rankColor ? { color: u.rankColor } : null]}>
            {idx + 1}#
          </Text>
          <View style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <View style={styles.rowBetween}>
              <Text style={[styles.userName, styles.font]} numberOfLines={1}>{u.name}</Text>
              {u.isUser ? <Text style={[styles.youNote, styles.font]}>(Du)</Text> : null}
            </View>
            <Text style={[styles.userSteps, styles.font]}>{fmt.format(u.steps)}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderChallengesContent = () => (
    <View style={styles.progressCard}>
      <Text style={[styles.progressTitle, styles.font]}>
        <Text style={{ color: '#5F764E', fontWeight: '700' }}>Aktive </Text>Challenges
      </Text>
      
      {/* Aktuelle Challenge */}
      <View style={challengeCardStyles.card}>
        <View style={challengeCardStyles.header}>
          <Text style={[styles.font, challengeCardStyles.title]}>
            {vm.challenge.name}
          </Text>
          <View style={challengeCardStyles.statusBadge}>
            <Text style={[styles.font, challengeCardStyles.statusText]}>
              {isChallengeExpired ? 'Beendet' : 'Aktiv'}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.font, challengeCardStyles.route]}>
          🗺️ {vm.challenge.startLocation} → {vm.challenge.targetLocation}
        </Text>
        
        <View style={challengeCardStyles.progressSection}>
          <View style={challengeCardStyles.progressHeader}>
            <Text style={[styles.font, challengeCardStyles.progressLabel]}>Team Fortschritt</Text>
            <Text style={[styles.font, challengeCardStyles.progressPercent]}>{distancePct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${distancePct}%` }]} />
          </View>
          <Text style={[styles.font, challengeCardStyles.progressDetails]}>
            {fmt1.format(distanceKmDone)} km von {challengeDistanceKm} km
          </Text>
        </View>

        <View style={challengeCardStyles.statsRow}>
          <View style={challengeCardStyles.stat}>
            <Text style={[styles.font, challengeCardStyles.statValue]}>{daysLeft}</Text>
            <Text style={[styles.font, challengeCardStyles.statLabel]}>Tage übrig</Text>
          </View>
          <View style={challengeCardStyles.stat}>
            <Text style={[styles.font, challengeCardStyles.statValue]}>{rankings.length}</Text>
            <Text style={[styles.font, challengeCardStyles.statLabel]}>Teilnehmer</Text>
          </View>
          <View style={challengeCardStyles.stat}>
            <Text style={[styles.font, challengeCardStyles.statValue]}>{fmt.format(weeklyTotal)}</Text>
            <Text style={[styles.font, challengeCardStyles.statLabel]}>Deine Schritte</Text>
          </View>
        </View>
      </View>

      {/* Platzhalter für weitere Challenges */}
      <View style={challengeCardStyles.comingSoon}>
        <Ionicons name="time-outline" size={32} color="#9CA3AF" />
        <Text style={[styles.font, challengeCardStyles.comingSoonText]}>
          Weitere Challenges kommen bald...
        </Text>
      </View>
    </View>
  );

  const renderTeamsContent = () => (
    <View style={styles.progressCard}>
      <Text style={[styles.progressTitle, styles.font]}>
        <Text style={{ color: '#5F764E', fontWeight: '700' }}>Dein </Text>Team
      </Text>

      {vm.team && (
        <View style={teamCardStyles.card}>
          <View style={teamCardStyles.header}>
            <View style={teamCardStyles.teamIcon}>
              <Ionicons name="people" size={24} color="#7FA58C" />
            </View>
            <View style={teamCardStyles.teamInfo}>
              <Text style={[styles.font, teamCardStyles.teamName]}>
                {vm.team.name}
              </Text>
              <Text style={[styles.font, teamCardStyles.teamMembers]}>
                {rankings.length} Teammitglieder
              </Text>
            </View>
          </View>

          {/* Team Fortschritt */}
          <View style={teamCardStyles.progressSection}>
            <Text style={[styles.font, teamCardStyles.sectionTitle]}>Team Fortschritt</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${distancePct}%` }]} />
            </View>
            <Text style={[styles.font, teamCardStyles.progressText]}>
              {distancePct}% der Challenge geschafft
            </Text>
          </View>

          {/* Top 3 Team-Mitglieder */}
          <View style={teamCardStyles.rankingSection}>
            <Text style={[styles.font, teamCardStyles.sectionTitle]}>Top 3 im Team</Text>
            {rankings.slice(0, 3).map((member, index) => (
              <View key={index} style={teamCardStyles.memberRow}>
                <View style={teamCardStyles.memberRank}>
                  <Text style={[styles.font, teamCardStyles.rankNumber]}>{index + 1}</Text>
                </View>
                <View style={teamCardStyles.memberInfo}>
                  <Text style={[styles.font, teamCardStyles.memberName]}>
                    {member.name}
                    {member.isUser && <Text style={teamCardStyles.youIndicator}> (Du)</Text>}
                  </Text>
                  <Text style={[styles.font, teamCardStyles.memberSteps]}>
                    {fmt.format(member.steps)} Schritte
                  </Text>
                </View>
                {index === 0 && <Ionicons name="trophy" size={20} color="#C8A100" />}
                {index === 1 && <Ionicons name="medal" size={20} color="#999999" />}
                {index === 2 && <Ionicons name="ribbon" size={20} color="#C9716D" />}
              </View>
            ))}
          </View>

          {/* Team Rangliste Button */}
          <TouchableOpacity 
            style={teamCardStyles.rankingButton}
            onPress={() => setActiveTab('ranking')}
          >
            <Text style={[styles.font, teamCardStyles.rankingButtonText]}>
              Vollständige Rangliste anzeigen
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#7FA58C" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderMoreContent = () => (
    <View style={styles.progressCard}>
      <Text style={[styles.progressTitle, styles.font]}>
        <Text style={{ color: '#5F764E', fontWeight: '700' }}>Mehr </Text>Optionen
      </Text>

      {/* More Menu Items */}
      <View style={moreMenuStyles.menuContainer}>
        <TouchableOpacity 
          style={moreMenuStyles.menuItem}
          onPress={() => handleMoreMenuItemPress('Alle Teams')}
        >
          <Ionicons name="people-outline" size={20} color="#6B7280" />
          <Text style={[styles.font, moreMenuStyles.menuItemText]}>Alle Teams</Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={moreMenuStyles.menuItem}
          onPress={() => handleMoreMenuItemPress('Alle Challenges')}
        >
          <Ionicons name="flag-outline" size={20} color="#6B7280" />
          <Text style={[styles.font, moreMenuStyles.menuItemText]}>Alle Challenges</Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={moreMenuStyles.menuItem}
          onPress={() => handleMoreMenuItemPress('Alle Benutzer')}
        >
          <Ionicons name="person-outline" size={20} color="#6B7280" />
          <Text style={[styles.font, moreMenuStyles.menuItemText]}>Alle Benutzer</Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={moreMenuStyles.menuItem}
          onPress={() => handleMoreMenuItemPress('Einstellungen')}
        >
          <Ionicons name="settings-outline" size={20} color="#6B7280" />
          <Text style={[styles.font, moreMenuStyles.menuItemText]}>Einstellungen</Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Admin Bereich */}
        <TouchableOpacity 
          style={moreMenuStyles.menuItem}
          onPress={() => handleMoreMenuItemPress('Admin-Bereich')}
        >
          <Ionicons name="shield-outline" size={20} color="#6B7280" />
          <Text style={[styles.font, moreMenuStyles.menuItemText]}>Admin-Bereich</Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <View style={moreMenuStyles.divider} />

        <TouchableOpacity 
          style={moreMenuStyles.menuItem}
          onPress={() => handleMoreMenuItemPress('Logout')}
        >
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={[styles.font, moreMenuStyles.menuItemText, moreMenuStyles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={moreMenuStyles.userInfo}>
        <View style={moreMenuStyles.userAvatar}>
          <Text style={moreMenuStyles.userInitials}>
            {vm.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={moreMenuStyles.userDetails}>
          <Text style={[styles.font, moreMenuStyles.userName]}>{vm.user?.name}</Text>
          <Text style={[styles.font, moreMenuStyles.userEmail]}>{vm.user?.email}</Text>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'ranking':
        return renderRankingContent();
      case 'challenges':
        return renderChallengesContent();
      case 'teams':
        return renderTeamsContent();
      case 'more':
        return renderMoreContent();
      case 'dashboard':
      default:
        return renderDashboardContent();
    }
  };

  // ========= Render Guards =========
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7F4' }}>
        <ActivityIndicator size="large" />
        <Text style={[styles.font, { marginTop: 12, color: '#2F3E34' }]}>Lade Daten...</Text>
      </View>
    );
  }

  if (errorMsg || !vm) {
    const pivot = startOfWeek(new Date());
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7F4', padding: 24 }}>
        <Text style={[styles.font, { color: '#B91C1C', fontSize: 16, textAlign: 'center' }]}>
          Ups, konnte Home-Daten nicht laden.
        </Text>
        {errorMsg ? (
          <Text style={[styles.font, { color: '#6B7280', marginTop: 6, textAlign: 'center' }]}>{String(errorMsg)}</Text>
        ) : null}
        <TouchableOpacity
          onPress={async () => {
            try {
              setLoading(true);
              setErrorMsg(null);
              const raw = await getHomeInit();
              const mapped = mapHomeInitToDashboard(raw, pivot) as HomeInitDto | null;
              setVm(mapped);

              const initialDisplay = mapped
                ? clampDate(new Date(), mapped.challenge.startDate, mapped.challenge.endDate)
                : new Date();

              const arr = (mapped?.steps_this_week ?? []).map((s) => s.numberOfSteps);
              const weekArr = arr.length === 7 ? arr : [0, 0, 0, 0, 0, 0, 0];
              setWeekSteps(weekArr);

              const idx = (initialDisplay.getDay() + 6) % 7;
              setStepsToday(weekArr[idx] ?? 0);
              setSelectedWeekStart(startOfWeek(initialDisplay));
              setDisplayDate(initialDisplay);
            } catch (e: any) {
              setErrorMsg(e?.message ?? 'Unbekannter Fehler');
            } finally {
              setLoading(false);
            }
          }}
          style={{ marginTop: 16, backgroundColor: '#7FA58C', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 }}
        >
          <Text style={[styles.font, { color: '#fff', fontWeight: '700' }]}>Erneut versuchen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ========= Render =========
  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7F4' }}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ 
          paddingBottom: 80,
          paddingTop: 20,
          minHeight: screenHeight - 80
        }}
      >
        {renderContent()}

        {/* MODAL: Schritte verwalten */}
        <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
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
                    const current = weekSteps[idx] ?? 0;
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
                    Diese Challenge ist bereits beendet. Das Hinzufügen oder Entfernen von Schritten ist nicht mehr möglich.
                  </Text>
                </View>
              ) : isFutureSelected ? (
                <Text style={[styles.font, { color: '#6B7280', textAlign: 'center', marginTop: 8 }]}>
                  Zukünftige Tage können nicht bearbeitet werden.
                </Text>
              ) : null}

              <TouchableOpacity style={styles.cancelGhost} onPress={() => { setModalVisible(false); setModalError(null); }}>
                <Text style={[styles.font, styles.cancelGhostText]}>Abbrechen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL: Calendar */}
        <Modal animationType="fade" transparent visible={calendarOpen} onRequestClose={() => setCalendarOpen(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setCalendarOpen(false)}>
            <View style={styles.calendarCard}>
              <View style={styles.calHeader}>
                <TouchableOpacity onPress={goPrevMonth} style={[styles.navPill, !canGoPrevMonth && { opacity: 0.35 }]} disabled={!canGoPrevMonth}>
                  <Ionicons name="chevron-back" size={18} />
                </TouchableOpacity>
                <Text style={[styles.font, styles.calHeaderTitle]}>{calendarHeader}</Text>
                <TouchableOpacity onPress={goNextMonth} style={[styles.navPill, !canGoNextMonth && { opacity: 0.35 }]} disabled={!canGoNextMonth}>
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
                <Text style={[styles.font, styles.applyBtnText]}>Übernehmen </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCalendarOpen(false)}>
                <Text style={[styles.font, styles.cancelBtnText]}>Abbrechen</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
};

// ======================
// Additional Styles for new Components
// ======================
const challengeCardStyles = {
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2F3E34',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#7FA58C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  route: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5F764E',
  },
  progressDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2F3E34',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  comingSoon: {
    alignItems: 'center',
    padding: 20,
  },
  comingSoonText: {
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
};

const teamCardStyles = {
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2F3E34',
  },
  teamMembers: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F3E34',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  rankingSection: {
    marginBottom: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F7F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7FA58C',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2F3E34',
  },
  youIndicator: {
    color: '#7FA58C',
    fontWeight: '600',
  },
  memberSteps: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  rankingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#7FA58C',
    borderRadius: 8,
  },
  rankingButtonText: {
    color: '#7FA58C',
    fontWeight: '600',
    marginRight: 4,
  },
};

const moreMenuStyles = {
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#2F3E34',
    marginLeft: 12,
  },
  logoutText: {
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#7FA58C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F3E34',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
};

export default Dashboard;