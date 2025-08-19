import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
} from '../services/dashboard/dashboardDto';

import { getHomeInit, getWeekSteps, upsertStepsForDate } from '../services/dashboard/dashboardService';
import styles from './styles/dashboardStyles';

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
    stepLength: number;
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
    distanceKm: number;
    startDate: Date | null;
    endDate: Date | null;
    state: string;
    daysLeft: number;
    timeProgress: number; // 0..1
  };
  steps_this_week?: StepsEntry[];
};

// ======================
// Component
// ======================
const Dashboard: React.FC = () => {
  // Core VM
  const [vm, setVm] = useState<HomeInitDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // UI State
  const [modalVisible, setModalVisible] = useState(false);
  const [stepInput, setStepInput] = useState('');

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

  // ===== Challenge bounds =====
  const minDate = useMemo(() => (vm?.challenge?.startDate ? stripTime(vm.challenge.startDate) : null), [vm?.challenge?.startDate]);
  const maxDate = useMemo(() => (vm?.challenge?.endDate ? stripTime(vm.challenge.endDate) : null), [vm?.challenge?.endDate]);

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

  const goPrevMonth = () => {
    if (!canGoPrevMonth) return;
    setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  };
  const goNextMonth = () => {
    if (!canGoNextMonth) return;
    setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  };

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

        // Clamp initial dates in Challenge
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
    return () => {
      alive = false;
    };
  }, []);

  // ========= Week change =========
  useEffect(() => {
    if (!vm?.user?.id) return;

    // clamp displayDate before using it
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
        const weekStartISO = toISO(weekStart);
        const resp = await getWeekSteps(vm.user!.id!, weekStartISO);
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
  }, [displayDate, vm?.user?.id, selectedWeekStart, weekSteps, minDate, maxDate]);

  // ---- Save Steps ----
  const saveAbsoluteStepsForSelectedDay = async (newValue: number) => {
    if (!vm?.user?.id || !vm?.challenge?.id || !vm?.team?.id) return;

    const dateSafe = clampDate(displayDate, minDate, maxDate);
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
        {
          challengeId: vm.challenge.id,
          teamId: vm.team.id,
        }
      );
    } catch (e) {
      // rollback bei Fehler
      setWeekSteps(prev);
      setStepsToday(prev[idx] ?? 0);
      console.warn('Save steps failed:', e);
    }
  };

  const applyStepDelta = async (delta: number) => {
    const dateSafe = clampDate(displayDate, minDate, maxDate);
    const idx = (dateSafe.getDay() + 6) % 7;
    const current = weekSteps[idx] ?? 0;
    const target = Math.max(0, current + delta);
    await saveAbsoluteStepsForSelectedDay(target);
  };

  // ========= Derived =========
  const weeklyMax = Math.max(1, ...weekSteps);
  const weeklyTotal = useMemo(() => weekSteps.reduce((a, b) => a + b, 0), [weekSteps]);

  const stepLengthMeters = vm?.user?.stepLength ?? 0;
  const distanceKm = useMemo(() => {
    const km = (stepsToday * stepLengthMeters) / 1000;
    return Math.round(km * 100) / 100;
  }, [stepsToday, stepLengthMeters]);

  const kcal = useMemo(() => {
    const k = stepsToday * 0.04;
    return Math.round(k * 100) / 100;
  }, [stepsToday]);

  const timeProgressRaw = vm?.challenge?.timeProgress ?? 0;
  const timeProgressPct = Math.round(Math.max(0, Math.min(1, timeProgressRaw)) * 100);
  const daysLeft = vm?.challenge?.daysLeft;

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
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* DATE + USER + CHALLENGE */}
        <View style={styles.topSection}>
          <View style={styles.dateRow}>
            <Text style={[styles.date, styles.font]}>{currentDate}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                const safe = clampDate(displayDate, minDate, maxDate);
                setCalendarPick(safe);
                setCalendarMonth(new Date(safe.getFullYear(), safe.getMonth(), 1));
                setCalendarOpen(true);
              }}
              style={[styles.calIconBtn, { marginLeft: 10 }]}
            >
              <Ionicons name="calendar-outline" size={22} color="#2F3E34" />
            </TouchableOpacity>
          </View>

          {/* Username */}
          {vm.user?.name ? (
            <Text style={[styles.font, { textAlign: 'center', color: '#6B7280', marginTop: 6 }]}>
              Willkommen, <Text style={{ color: '#2F3E34', fontWeight: '700' }}>{vm.user.name}</Text> 👋
            </Text>
          ) : null}

          <View style={styles.hr} />

          <Text style={[styles.challengeRow, styles.font]}>
            <Text style={styles.challengeLabel}>Challenge: </Text>
            {vm.challenge.startLocation || '—'} → {vm.challenge.targetLocation || '—'}{' '}
            <Text style={styles.challengeMeta}>({vm.challenge.distanceKm ?? 0} Km)</Text>
          </Text>

          {/* METRICS */}
          <View style={styles.metricsRow}>
            {/* kcal */}
            <View style={styles.metricSide}>
              <Ionicons name="flame" size={24} color="#E25822" style={{ marginBottom: 4 }} />
              <Text style={[styles.metricSideValue, styles.font]}>{weekLoading ? '…' : kcal}</Text>
              <Text style={[styles.metricSideLabel, styles.font]}>Kcal</Text>
            </View>

            {/* step ring */}
            <View style={styles.stepCircleWrapper}>
              <View style={styles.stepCircleOuter}>
                <View style={styles.stepCircleInnerRing} />
                <View style={styles.stepCircle}>
                  <Text style={[styles.stepValue, styles.font]}>{weekLoading ? '…' : stepsToday}</Text>
                  <Text style={[styles.stepLabel, styles.font]}>SCHRITTE</Text>
                </View>
              </View>
            </View>

            {/* distance */}
            <View style={[styles.metricSide, { alignItems: 'flex-start' }]}>
              <MaterialIcons name="place" size={24} color="#F54927" style={{ marginBottom: 4, alignSelf: 'center' }} />
              <Text style={[styles.metricSideValue, styles.font]}>{weekLoading ? '…' : distanceKm}</Text>
              <Text style={[styles.metricSideLabel, styles.font]}>km</Text>
            </View>
          </View>

          {/* EDIT BTN */}
          <TouchableOpacity style={styles.editBtn} onPress={() => setModalVisible(true)}>
            <Text style={[styles.editBtnText, styles.font]}>Schritte bearbeiten</Text>
          </TouchableOpacity>

          {/* WEEKLY SUMMARY */}
          <Text style={[styles.weeklyTitle, styles.font]}>
            Diese Woche: <Text style={{ color: '#5F764E' }}>{weeklyTotal} Schritte</Text>
          </Text>

          {/* WEEKLY BAR CHART */}
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
            <Text style={{ color: '#5F764E', fontWeight: '700' }}>Challenge </Text>Fortschritte
          </Text>

          <View style={styles.topScaleRow}>
            <Text style={[styles.scaleTick, styles.font]}>Start </Text>
            <Text style={[styles.scaleTick, styles.font]}>Ziel: {vm.challenge.distanceKm} km</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${timeProgressPct}%` }]} />
          </View>

          <Text style={[styles.progressNote, styles.font]}>
            <Text style={{ color: '#5F764E', fontWeight: '800' }}>{timeProgressPct}%</Text> der Challenge-Zeit sind vorbei.
            {Number.isFinite(daysLeft) ? (
              <Text>
                {' '}
                Noch <Text style={{ fontWeight: '900' }}>{daysLeft}</Text> Tage übrig.
              </Text>
            ) : null}
          </Text>

          {/* TEAM INFOS (Demo) */}
          <View style={styles.teamSectionHeader}>
            <Text style={[styles.teamTitle, styles.font]}>Team Infos</Text>
          </View>

          <Text style={[styles.teamSubtitle, styles.font]}>
            <Text style={{ color: '#7FA58C', fontWeight: '700' }}>Ranking </Text>
            der Challenge
          </Text>

          {[
            { name: 'Jessica Marie Müll', steps: '51.200', rankColor: '#C8A100' },
            { name: 'Leonardo da Vinci', steps: '30.000', rankColor: '#999999' },
            { name: 'Gustav Fröhlich', steps: '28.800', rankColor: '#C9716D' },
            { name: 'Bernadette Unförmlich', steps: '27.600' },
            { name: `${vm.user.name || 'Du'}`, steps: '6.400', isUser: true },
          ].map((u, idx) => (
            <View key={idx} style={[styles.rankRow, u.isUser && styles.rankRowMe]}>
              <Text style={[styles.rankBadge, styles.font, u.rankColor ? { color: u.rankColor } : null]}>
                {idx + 1}#
              </Text>
              <View style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.userName, styles.font]}>{u.name}</Text>
                  {u.isUser ? <Text style={[styles.youNote, styles.font]}>(Du)</Text> : null}
                </View>
                <Text style={[styles.userSteps, styles.font]}>{u.steps}</Text>
              </View>
            </View>
          ))}
        </View>

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
                    keyboardType="numeric"
                    value={stepInput}
                    onChangeText={setStepInput}
                  />
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={async () => {
                    const num = parseInt(stepInput, 10);
                    if (!isNaN(num) && num > 0) await applyStepDelta(num);
                    setModalVisible(false);
                    setStepInput('');
                  }}
                >
                  <Text style={[styles.font, styles.primaryBtnText]}>Hinzufügen</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={async () => {
                    const num = parseInt(stepInput, 10);
                    if (!isNaN(num) && num > 0) await applyStepDelta(-num);
                    setModalVisible(false);
                    setStepInput('');
                  }}
                >
                  <Text style={[styles.font, styles.secondaryBtnText]}>Entfernen</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.cancelGhost} onPress={() => setModalVisible(false)}>
                <Text style={[styles.font, styles.cancelGhostText]}>Abbrechen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL: Calendar */}
        <Modal animationType="fade" transparent visible={calendarOpen} onRequestClose={() => setCalendarOpen(false)}>
          <View style={styles.modalOverlay}>
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

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dayCellWrap,
                        isSame && !disabled && styles.daySelectedWrap,
                        disabled && { opacity: 0.35 },
                      ]}
                      onPress={() => !disabled && setCalendarPick(date)}
                      disabled={disabled}
                    >
                      <Text
                        style={[
                          styles.font,
                          styles.dayCellText,
                          !inMonth && styles.dayOutText,
                          isSame && !disabled && styles.daySelectedText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
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
          </View>
        </Modal>
      </ScrollView>
    </>
  );
};

export default Dashboard;
