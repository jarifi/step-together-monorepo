import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
  validateChallengeName,
  validateDate,
  validateDistance,
  validateLocation,
} from '../../lib/challengeValidation';
import { updateChallenge } from '../../services/challengeService';

const COLORS = {
  bg: '#F5F7F4',
  surface: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  accent: '#55805c',
  inputBg: '#FBFCFB',
  danger: '#B91C1C',
};

const toYmd = (v) => {
  if (!v) return '';
  const s = Array.isArray(v) ? v[0] : String(v);
  return s.includes('T') ? s.split('T')[0] : s;
};

// keep same convention as your Create screen (UTC midnight ISO)
const ymdToUtcMidnightIso = (ymd) => `${ymd}T00:00:00.000Z`;

// ---------- Kalender/Date helpers (timezone-safe) ----------
const stripTime = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const firstOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const lastOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const sameDay = (a, b) => stripTime(a).getTime() === stripTime(b).getTime();

// Format "YYYY-MM-DD" in LOCAL time (no UTC shift)
const formatLocalYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Parse "YYYY-MM-DD" as LOCAL date (avoid new Date("YYYY-MM-DD") UTC quirks)
const parseLocalYMD = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  // midday = extra-safe around DST boundaries
  return new Date(y, m - 1, d, 12, 0, 0, 0);
};

export default function UpdateChallengeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const challengeId = useMemo(() => {
    const raw = params?.id;
    const s = Array.isArray(raw) ? raw[0] : raw;
    return Number(s);
  }, [params?.id]);

  const [name, setName] = useState(Array.isArray(params.name) ? params.name[0] : params.name || '');
  const [startLocation, setStartLocation] = useState(
    Array.isArray(params.startLocation) ? params.startLocation[0] : params.startLocation || ''
  );
  const [targetLocation, setTargetLocation] = useState(
    Array.isArray(params.targetLocation) ? params.targetLocation[0] : params.targetLocation || ''
  );
  const [distance, setDistance] = useState(
    Array.isArray(params.distance) ? params.distance[0] : params.distance || ''
  );
  const [startDate, setStartDate] = useState(toYmd(params.startDate));
  const [endDate, setEndDate] = useState(toYmd(params.endDate));
  const [loading, setLoading] = useState(false);

  // ✅ Kalender State (wie Create)
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarType, setCalendarType] = useState('start'); // 'start' | 'end'
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarPick, setCalendarPick] = useState(new Date());

  const FieldLabel = ({ children }) => <Text style={styles.label}>{children}</Text>;

  const openCalendar = (type) => {
    setCalendarType(type);

    const current =
      type === 'start' && startDate
        ? parseLocalYMD(startDate) ?? new Date()
        : type === 'end' && endDate
          ? parseLocalYMD(endDate) ?? new Date()
          : new Date();

    setCalendarPick(current);
    setCalendarMonth(new Date(current.getFullYear(), current.getMonth(), 1));
    setCalendarOpen(true);
  };

  const applySelectedDate = () => {
    const formatted = formatLocalYMD(calendarPick);
    if (calendarType === 'start') setStartDate(formatted);
    else setEndDate(formatted);
    setCalendarOpen(false);
  };

  const calendarHeader = calendarMonth.toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  });

  const calendarGrid = (() => {
    const first = firstOfMonth(calendarMonth);
    const firstDayOfWeek = (first.getDay() + 6) % 7; // Monday=0
    const start = new Date(first);
    start.setDate(first.getDate() - firstDayOfWeek);

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const inMonth = date.getMonth() === calendarMonth.getMonth();
      let selectable = true;

      // For update we keep it permissive:
      // start: any day
      // end: must be >= selected startDate (if set)
      if (calendarType === 'end') {
        if (startDate) {
          const startObj = parseLocalYMD(startDate) ?? new Date();
          selectable = stripTime(date) >= stripTime(startObj);
        }
      }

      cells.push({ date, inMonth, selectable });
    }
    return cells;
  })();

  const canGoPrevMonth = () => true;
  const canGoNextMonth = () => true;

  const goPrevMonth = () =>
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  const goNextMonth = () =>
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));

  const handleUpdate = async () => {
    const nameErrors = validateChallengeName(name);
    const locationErrors = validateLocation(startLocation, targetLocation);
    const distanceErrors = validateDistance(distance);
    const dateErrors = validateDate(startDate, endDate);

    if (!name || !startLocation || !targetLocation || !distance || !startDate || !endDate) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Alle Felder sind Pflichtfelder!',
        position: 'top',
        visibilityTime: 2000,
        topOffset: 100,
      });
      return;
    }

    const allErrors = [...nameErrors, ...locationErrors, ...distanceErrors, ...dateErrors];
    if (allErrors.length > 0) {
      allErrors.forEach((error, index) => {
        setTimeout(() => {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error,
            position: 'top',
            visibilityTime: 2000,
            topOffset: 100,
          });
        }, index * 2500);
      });
      return;
    }

    const updatedChallengeData = {
      name,
      start_location: startLocation,
      target_location: targetLocation,
      distance: parseFloat(distance),
      start_date: ymdToUtcMidnightIso(startDate),
      end_date: ymdToUtcMidnightIso(endDate),
    };

    setLoading(true);
    try {
      await updateChallenge(challengeId, updatedChallengeData);
      Toast.show({
        type: 'success',
        text1: 'Erfolg',
        text2: 'Challenge erfolgreich aktualisiert!',
        position: 'top',
        topOffset: 100,
      });
      router.replace('/challenges');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Challenge konnte nicht aktualisiert werden!',
        position: 'top',
        topOffset: 100,
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.title}>Challenge bearbeiten</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <FieldLabel>Challenge Name</FieldLabel>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Challenge Name"
            placeholderTextColor="#8A9590"
            style={styles.input}
            editable={!loading}
          />

          <FieldLabel>Startort</FieldLabel>
          <TextInput
            value={startLocation}
            onChangeText={setStartLocation}
            placeholder="Start Location"
            placeholderTextColor="#8A9590"
            style={styles.input}
            editable={!loading}
          />

          <FieldLabel>Zielort</FieldLabel>
          <TextInput
            value={targetLocation}
            onChangeText={setTargetLocation}
            placeholder="Target Location"
            placeholderTextColor="#8A9590"
            style={styles.input}
            editable={!loading}
          />

          <FieldLabel>Distanz (km)</FieldLabel>
          <TextInput
            value={distance}
            onChangeText={setDistance}
            placeholder="Distance"
            placeholderTextColor="#8A9590"
            style={styles.input}
            keyboardType="numeric"
            editable={!loading}
          />

          {/* ✅ Date fields with calendar */}
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <FieldLabel>Startdatum</FieldLabel>
              <Pressable onPress={() => openCalendar('start')} style={styles.datePill}>
                <Text style={[styles.dateText, !startDate && { color: '#8A9590' }]}>
                  {startDate || 'Start-Datum auswählen'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={COLORS.accent} />
              </Pressable>
            </View>

            <View style={{ flex: 1 }}>
              <FieldLabel>Enddatum</FieldLabel>
              <Pressable onPress={() => openCalendar('end')} style={styles.datePill}>
                <Text style={[styles.dateText, !endDate && { color: '#8A9590' }]}>
                  {endDate || 'End-Datum auswählen'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={COLORS.accent} />
              </Pressable>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => router.back()}
              disabled={loading}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.pressed,
                loading && styles.disabled,
              ]}
            >
              <Text style={styles.secondaryBtnText}>Abbrechen</Text>
            </Pressable>

            <Pressable
              onPress={handleUpdate}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
                loading && styles.disabled,
              ]}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.primaryBtnText}>Aktualisieren…</Text>
                </View>
              ) : (
                <Text style={styles.primaryBtnText}>Aktualisieren</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* ✅ Kalender Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={calendarOpen}
        onRequestClose={() => setCalendarOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCalendarOpen(false)}>
          <Pressable style={styles.calendarCard} onPress={() => {}}>
            <View style={styles.calHeader}>
              <Pressable
                onPress={goPrevMonth}
                style={[styles.navPill, !canGoPrevMonth() && { opacity: 0.35 }]}
                disabled={!canGoPrevMonth()}
              >
                <Ionicons name="chevron-back" size={18} color={COLORS.text} />
              </Pressable>

              <Text style={styles.calHeaderTitle}>{calendarHeader}</Text>

              <Pressable
                onPress={goNextMonth}
                style={[styles.navPill, !canGoNextMonth() && { opacity: 0.35 }]}
                disabled={!canGoNextMonth()}
              >
                <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
                <Text key={d} style={styles.weekCell}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {calendarGrid.map(({ date, inMonth, selectable }, idx) => {
                const isSelected = sameDay(date, calendarPick);
                const isToday = sameDay(date, new Date());
                const disabled = !selectable;

                return (
                  <Pressable
                    key={`${date.getTime()}-${idx}`}
                    style={[styles.dayCellWrap, disabled && { opacity: 0.35 }]}
                    onPress={() => !disabled && setCalendarPick(date)}
                    disabled={disabled}
                  >
                    <View
                      style={[
                        styles.dayCellInner,
                        !inMonth && styles.dayOutWrap,
                        isToday && styles.dayTodayWrap,
                        isSelected && styles.daySelectedWrap,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          !inMonth && styles.dayOutText,
                          isSelected && styles.daySelectedText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.applyBtn} onPress={applySelectedDate}>
              <Text style={styles.applyBtnText}>Übernehmen</Text>
            </Pressable>

            <Pressable style={styles.cancelBtn} onPress={() => setCalendarOpen(false)}>
              <Text style={styles.cancelBtnText}>Abbrechen</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 28,
  },

  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    position: 'relative',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingHorizontal: 56,
  },

  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },

  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.sub,
    marginBottom: 8,
    marginLeft: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 14,
  },

  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },

  datePill: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    flexShrink: 1,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 15,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },

  // Calendar modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    backgroundColor: 'white',
    borderRadius: 22,
    padding: 16,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navPill: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(15,20,17,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '800',
    color: COLORS.sub,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellWrap: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
  },
  dayCellInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(15,20,17,0.06)',
  },
  dayCellText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '800',
  },
  dayOutWrap: {
    backgroundColor: 'rgba(15,20,17,0.02)',
  },
  dayOutText: {
    color: 'rgba(15,20,17,0.25)',
  },
  dayTodayWrap: {
    borderColor: 'rgba(85,128,92,0.30)',
    backgroundColor: 'rgba(85,128,92,0.06)',
  },
  daySelectedWrap: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  daySelectedText: {
    color: '#fff',
  },

  applyBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 13,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 14,
  },
  applyBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
  },
  cancelBtn: {
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 14,
  },
});
