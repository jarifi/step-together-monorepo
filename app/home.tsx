import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { getHomeInit, getWeekSteps } from '../services/dashboardService';
import { mapHomeInitToDashboard, type HomeInitDto } from './dashboard/dashboardDto';
import styles from './styles/dashboardStyles';


const dayLabelDe = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];
const dayOrderEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const startOfWeek = (d: Date) => {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (copy.getDay() + 6) % 7; // 0=Mo..6=So
  copy.setDate(copy.getDate() - dow);
  copy.setHours(0, 0, 0, 0);
  return copy;
};
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const toISO = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD

const Dashboard = () => {
  const [vm, setVm] = useState<HomeInitDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [stepInput, setStepInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); // (wird für Add/Remove benutzt)

  const [weekSteps, setWeekSteps] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [displayDate, setDisplayDate] = useState(new Date());
  const [weekLoading, setWeekLoading] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(startOfWeek(new Date()));

  const currentDate = useMemo(
    () =>
      displayDate.toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [displayDate]
  );

  // Helper: Date -> Index 0..6 (Mo..So); robust für ISO "YYYY-MM-DD" & "dd.mm.yyyy"
  const getIndexForDate = (dateStr?: string) => {
    const fallback = () => (new Date().getDay() + 6) % 7; // 0=Mo..6=So
    if (!dateStr) return fallback();

    const iso = /^\d{4}-\d{2}-\d{2}$/;
    let d: Date | null = null;

    if (iso.test(dateStr)) {
      d = new Date(dateStr + 'T00:00:00');
    } else {
      const m = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (m) {
        const [, dd, mm, yyyy] = m;
        d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      } else {
        const tmp = new Date(dateStr);
        d = isNaN(tmp.getTime()) ? null : tmp;
      }
    }
    if (!d || isNaN(d.getTime())) return fallback();
    return (d.getDay() + 6) % 7; // 0=Mo..6=So
  };

  // calendar modal
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [calendarPick, setCalendarPick] = useState<Date>(new Date());

  const calendarHeader = useMemo(
    () => calendarMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
    [calendarMonth]
  );

  const calendarGrid = useMemo(() => {
    const firstOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const firstWeekday = ((firstOfMonth.getDay() + 6) % 7) + 1; // 1=Mon..7=Sun
    const start = new Date(firstOfMonth);
    start.setDate(firstOfMonth.getDate() - (firstWeekday - 1)); // back to Monday

    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push({
        date: d,
        inMonth: d.getMonth() === calendarMonth.getMonth(),
      });
    }
    return cells;
  }, [calendarMonth]);

  const goPrevMonth = () =>
    setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goNextMonth = () =>
    setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const raw = await getHomeInit();
        const mapped = mapHomeInitToDashboard(raw);
        setVm(mapped);
      } catch (e: any) {
        setErrorMsg(e?.message ?? 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const mapWeekObjectsToArray = (weekObjs: any[]) => {
    const byDay: Record<string, number> = {};
    for (const item of weekObjs ?? []) {
      const k = String(item?.dayOfWeek ?? '');
      const n = Number.isFinite(+item?.numberOfSteps) ? +item.numberOfSteps : 0;
      byDay[k] = (byDay[k] ?? 0) + n;
    }
    return dayOrderEn.map(d => byDay[d] ?? 0);
  };

  // Heute/Selected-Day Kennzahl
  const [stepsToday, setStepsToday] = useState(0);

  const loadWeekFor = async (pivot: Date) => {
    const weekStart = startOfWeek(pivot);
    const weekStartISO = toISO(weekStart);

    // Falls dieselbe Woche wie schon geladen – kein Netzcall
    if (sameDay(weekStart, selectedWeekStart) && vm?.steps_this_week?.length && weekSteps.some(x => x > 0)) {
      // trotzdem den Tag neu setzen (falls nur Day gewechselt)
      const idx = (pivot.getDay() + 6) % 7;
      setStepsToday(weekSteps[idx] ?? 0);
      return;
    }

    setWeekLoading(true);
    try {
      let weekObjs: any[] = [];

      // ✅ FIX: API mit weekStartISO aufrufen
      const apiWeek = await getWeekSteps();

      if (Array.isArray(apiWeek) && apiWeek.length) {
        weekObjs = apiWeek;
      } else {
        // Fallback: wenn keine API oder leere Antwort, nimm die "aktuelle Woche" vom Home-Init,
        // aber nur, wenn das pivot in der *aktuellen* Woche liegt.
        const nowWeekStart = startOfWeek(new Date());
        if (sameDay(nowWeekStart, weekStart) && Array.isArray(vm?.steps_this_week)) {
          weekObjs = vm!.steps_this_week as any[];
        } else {
          weekObjs = []; // keine Daten verfügbar
        }
      }

      const arr = mapWeekObjectsToArray(weekObjs);
      setWeekSteps(arr);
      setSelectedWeekStart(weekStart);

      // Steps für den ausgewählten Tag (der in der geladenen Woche liegt)
      const idx = (pivot.getDay() + 6) % 7;
      setStepsToday(arr[idx] ?? 0);
    } finally {
      setWeekLoading(false);
    }
  };

  useEffect(() => {
    if (!vm) return;
    loadWeekFor(displayDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayDate, vm?.user?.id]); // vm user id als einfache “loaded”-Wache

  // Kennzahlen aus State
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7F4' }}>
        <ActivityIndicator size="large" />
        <Text style={[styles.font, { marginTop: 12, color: '#2F3E34' }]}>Lade Daten...</Text>
      </View>
    );
  }

  if (errorMsg || !vm) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7F4', padding: 24 }}>
        <Text style={[styles.font, { color: '#B91C1C', fontSize: 16, textAlign: 'center' }]}>
          Ups, konnte Home-Daten nicht laden.
        </Text>
        {errorMsg ? (
          <Text style={[styles.font, { color: '#6B7280', marginTop: 6, textAlign: 'center' }]}>{String(errorMsg)}</Text>
        ) : null}
        <TouchableOpacity
          onPress={() => {
            // quick retry
            setLoading(true);
            setErrorMsg(null);
            getHomeInit()
              .then((raw) => setVm(mapHomeInitToDashboard(raw)))
              .catch((e) => setErrorMsg(e?.message ?? 'Unbekannter Fehler'))
              .finally(() => setLoading(false));
          }}
          style={{ marginTop: 16, backgroundColor: '#7FA58C', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 }}
        >
          <Text style={[styles.font, { color: '#fff', fontWeight: '700' }]}>Erneut versuchen</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
                setCalendarPick(displayDate);
                setCalendarMonth(displayDate);
                setCalendarOpen(true);
              }}
              style={[styles.calIconBtn, { marginLeft: 10 }]}
            >
              <Ionicons name="calendar-outline" size={22} color="#2F3E34" />
            </TouchableOpacity>
          </View>

          {/* Optional: Lade-Note bei Wochenwechsel */}
          {/* {weekLoading ? (
            <Text style={[styles.font, { textAlign:'center', color:'#6B7280', marginTop:6 }]}>
              Woche wird geladen…
            </Text>
          ) : null} */}

          {/* Optional: Username */}
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
              <Text style={[styles.metricSideValue, styles.font]}>{kcal}</Text>
              <Text style={[styles.metricSideLabel, styles.font]}>Kcal</Text>
            </View>

            {/* step ring */}
            <View style={styles.stepCircleWrapper}>
              <View style={styles.stepCircleOuter}>
                <View style={styles.stepCircleInnerRing} />
                <View style={styles.stepCircle}>
                  <Text style={[styles.stepValue, styles.font]}>{stepsToday}</Text>
                  <Text style={[styles.stepLabel, styles.font]}>SCHRITTE</Text>
                </View>
              </View>
            </View>

            {/* distance */}
            <View style={[styles.metricSide, { alignItems: 'flex-start' }]}>
              <MaterialIcons name="place" size={24} color="#F54927" style={{ marginBottom: 4, alignSelf: 'center' }} />
              <Text style={[styles.metricSideValue, styles.font]}>{distanceKm}</Text>
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

          {/* obere Skala */}
          <View style={styles.topScaleRow}>
            <Text style={[styles.scaleTick, styles.font]}>Start </Text>
            <Text style={[styles.scaleTick, styles.font]}>Ziel: {vm.challenge.distanceKm} km</Text>
          </View>

          {/* Fortschritt nach Zeit (timeProgress) */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${timeProgressPct}%` }]} />
          </View>

          <Text style={[styles.progressNote, styles.font]}>
            <Text style={{ color: '#5F764E', fontWeight: '800' }}>{timeProgressPct}%</Text> der Challenge-Zeit sind vorbei.
            {Number.isFinite(daysLeft) ? (
              <Text> Noch <Text style={{ fontWeight: '900' }}>{daysLeft}</Text> Tage übrig.</Text>
            ) : null}
          </Text>

          {/* TEAM INFOS (noch Demo-Daten) */}
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
            <View
              key={idx}
              style={[
                styles.rankRow,
                u.isUser && styles.rankRowMe,
              ]}
            >
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
        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <Text style={[styles.modalTitle, styles.font]}>Schritte Verwalten</Text>

              <TextInput
                style={[styles.input, styles.font]}
                placeholder="Anzahl Schritte"
                placeholderTextColor="#7FA58C"
                keyboardType="numeric"
                value={stepInput}
                onChangeText={setStepInput}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#7FA58C' }]}
                  onPress={() => {
                    const num = parseInt(stepInput, 10);
                    if (!isNaN(num)) {
                      // ✅ Nutze ausgewählten Tag oder displayDate als Basis
                      const baseISO = selectedDate || toISO(displayDate);
                      const idx = getIndexForDate(baseISO);

                      setWeekSteps(prev => {
                        const copy = [...prev];
                        copy[idx] += num;
                        return copy;
                      });

                      // wenn es der aktuell angezeigte Tag ist, Ring syncen
                      const currentIdx = (displayDate.getDay() + 6) % 7;
                      if (idx === currentIdx) {
                        setStepsToday(prev => prev + num);
                      }
                    }
                    setModalVisible(false);
                    setStepInput('');
                    setSelectedDate('');
                  }}
                >
                  <Text style={[styles.font, { color: '#FFFFFF', fontWeight: '700' }]}>
                    Hinzufügen
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#7FA58C' }]}
                  onPress={() => {
                    const num = parseInt(stepInput, 10);
                    if (!isNaN(num)) {
                      const baseISO = selectedDate || toISO(displayDate);
                      const idx = getIndexForDate(baseISO);

                      setWeekSteps(prev => {
                        const copy = [...prev];
                        copy[idx] = Math.max(0, copy[idx] - num);
                        return copy;
                      });

                      const currentIdx = (displayDate.getDay() + 6) % 7;
                      if (idx === currentIdx) {
                        setStepsToday(prev => Math.max(0, prev - num));
                      }
                    }
                    setModalVisible(false);
                    setStepInput('');
                    setSelectedDate('');
                  }}
                >
                  <Text style={[styles.font, { color: '#FFFFFF', fontWeight: '700' }]}>
                    Entfernen
                  </Text>
                </TouchableOpacity>
              </View>

              <Pressable style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Text style={[styles.font, { color: '#fff', fontWeight: '700' }]}>Schließen</Text>
              </Pressable>
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
          <View style={styles.modalOverlay}>
            <View style={styles.calendarCard}>
              <View style={styles.calHeader}>
                <TouchableOpacity onPress={goPrevMonth} style={styles.navPill}>
                  <Ionicons name="chevron-back" size={18} />
                </TouchableOpacity>
                <Text style={[styles.font, styles.calHeaderTitle]}>{calendarHeader}</Text>
                <TouchableOpacity onPress={goNextMonth} style={styles.navPill}>
                  <Ionicons name="chevron-forward" size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.weekRow}>
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
                  <Text key={d} style={[styles.font, styles.weekCell]}>{d}</Text>
                ))}
              </View>

              <View style={styles.grid}>
                {calendarGrid.map(({ date, inMonth }, idx) => {
                  const isSameDay =
                    date.getFullYear() === calendarPick.getFullYear() &&
                    date.getMonth() === calendarPick.getMonth() &&
                    date.getDate() === calendarPick.getDate();

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dayCellWrap,
                        isSameDay && styles.daySelectedWrap,
                      ]}
                      onPress={() => setCalendarPick(date)}
                      disabled={!inMonth}
                    >
                      <Text
                        style={[
                          styles.font,
                          styles.dayCellText,
                          !inMonth && styles.dayOutText,
                          isSameDay && styles.daySelectedText,
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
                  setDisplayDate(calendarPick);
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