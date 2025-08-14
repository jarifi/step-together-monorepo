import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getHomeInit } from '../services/dashboardService';
import { mapHomeInitToDashboard, type HomeInitDto } from './dashboard/dashboardDto';

const Dashboard = () => {
  const [vm, setVm] = useState<HomeInitDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [stepInput, setStepInput] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // shown date above the welcome message
  const [displayDate, setDisplayDate] = useState(new Date());
  const currentDate = useMemo(
    () =>
      displayDate.toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [displayDate]
  );

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

  const [stepsToday, setStepsToday] = useState(227);

  const stepLengthMeters = vm?.user?.stepLength ?? 0;
  const distanceKm = useMemo(() => {
    const km = (stepsToday * stepLengthMeters) / 1000;
    return Math.round(km * 100) / 100;
  }, [stepsToday, stepLengthMeters]);

  const kcal = useMemo(() => {
    const k = stepsToday * 0.04;
    return Math.round(k * 100) / 100;
  }, [stepsToday]);

  const weeklySteps = vm?.steps_this_week ?? [0, 0, 0, 0, 0, 0, 0];
  const weeklyMax = Math.max(1, ...weeklySteps);
  const weeklyTotal = useMemo(() => weeklySteps.reduce((a, b) => a + b, 0), [weeklySteps]);

  // Challenge Prozent + Anzeige
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
            {weeklySteps.map((value, i) => {
              const height = (value / weeklyMax) * 120;
              return (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height }]} />
                  </View>
                  <Text style={[styles.dayLabel, styles.font]}>
                    {['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'][i]}
                  </Text>
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
                      setStepsToday(prev => prev + num);
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
                      setStepsToday(prev => Math.max(0, prev - num));
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F7F4',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 35,
  },

  /* top section blends in (no card visuals) */
  topSection: {
    backgroundColor: 'transparent',
    padding: 0,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  calIconBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#E8EFEA',
  },

  date: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2F3E34',
  },
  hr: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    marginTop: 25,
    marginBottom: 25,
  },
  challengeRow: {
    textAlign: 'center',
    fontSize: 18,
    color: '#2F3E34',
    marginBottom: 20,
  },
  challengeLabel: { color: '#7FA58C', fontWeight: '700' },
  challengeMeta: { color: '#6B7280' },

  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  metricSide: {
    width: 70,
    alignItems: 'center',
  },
  metricSideValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F3E34',
    lineHeight: 18,
    marginHorizontal: 18,
  },
  metricSideLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 24,
  },

  stepCircleWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleOuter: {
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: '#C5DECD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 12,
    borderColor: '#DFEBE2',
  },
  stepCircleInnerRing: {
    position: 'absolute',
    width: 134,
    height: 134,
    borderRadius: 999,
    borderWidth: 6,
    borderColor: '#E8EFEA',
  },
  stepCircle: {
    width: 135,
    height: 135,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2F3E34',
  },
  stepLabel: {
    marginTop: 2,
    fontSize: 11,
    letterSpacing: 1.2,
    color: '#6B7280',
  },

  editBtn: {
    alignSelf: 'center',
    backgroundColor: '#7FA58C',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginTop: 1,
  },
  editBtnText: { color: '#FFFFFF', fontSize: 16 },

  weeklyTitle: {
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 30,
    fontSize: 18,
    color: '#2F3E34',
  },

  /* bars — uniform color */
  weekChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 190,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 2,
    marginBottom: 80,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  barTrack: {
    width: 20,
    height: 170,
    borderRadius: 12,
    backgroundColor: '#E4EFE8',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#7EA88F',
  },
  dayLabel: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },

  /* progress card (scrolled area) */
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginTop: 8,

  },
  progressTitle: {
    textAlign: 'center',
    fontSize: 20,
    color: '#2F3E34',
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 30,
  },
  topScaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 6,
  },
  scaleTick: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#E5E5E5',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7FA58C',
    borderRadius: 999,
  },
  progressNote: {
    textAlign: 'center',
    fontSize: 18,
    color: '#2F3E34',
    marginTop: 20,
    marginBottom: 20,
  },

  teamSectionHeader: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#E6EAE5',
    marginTop: 10,
  },
  teamTitle: {
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 22,
    color: '#1F2937',
    marginBottom: 10,
    marginTop: 10,
  },
  teamSubtitle: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 20,
    marginBottom: 16,
  },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#F0F2EF',
    borderRadius: 12,
  },
  rankRowMe: {
    backgroundColor: '#D7E3DA',
  },
  rankBadge: {
    width: 34,
    fontSize: 19,
    fontWeight: '800',
    color: '#6B7280',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    marginRight: 25,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  youNote: { color: '#6B7280', fontSize: 18 },
  userName: {
    fontSize: 17,
    color: '#111827',
    fontWeight: '600',
  },
  userSteps: {
    fontSize: 15,
    color: '#7FA58C',
    fontWeight: '800',
    marginTop: 2,
  },

  /* font hook */
  font: {
    // fontFamily: 'VarelaRound_400Regular',
    fontFamily: 'Century Gothic',
  },

  /* modal (shared overlay) */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  /* steps modal */
  modalView: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: '800',
    color: '#5F764E',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#C7D6CD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#F9FBF9',
    color: '#2F3E34',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: '#7FA58C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  /* calendar modal card (clean, rounded, modern) */
  calendarCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2F3E34',
  },
  navPill: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#F2F5F3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  weekCell: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    color: '#7B8A80',
    fontWeight: '700',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 16,
  },
  dayCellWrap: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  daySelectedWrap: {
    backgroundColor: '#D7E3DA',
  },
  dayCellText: {
    fontSize: 16,
    color: '#2F3E34',
  },
  dayOutText: {
    color: '#AEB7B1',
  },
  daySelectedText: {
    fontWeight: '800',
  },

  applyBtn: {
    backgroundColor: '#415949',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  applyBtnText: {
    color: '#86AD8E',
    fontWeight: '800',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#E8EFEA',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#2F3E34',
    fontWeight: '700',
  },
});

export default Dashboard;
