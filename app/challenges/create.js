import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
  validateChallengeName,
  validateDate,
  validateDistance,
  validateLocation,
} from '../../lib/challengeValidation';
import { createChallenge } from '../../services/challengeService';

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

// For backend: create a UTC ISO at 00:00:00Z for that LOCAL calendar day
const ymdToUtcMidnightIso = (ymd) => `${ymd}T00:00:00.000Z`;

// ====== UI tokens ======
const COLORS = {
  bg: '#F5F7F4',
  surface: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  accent: '#55805c',
  accentSoft: 'rgba(85,128,92,0.12)',
  inputBg: '#FBFCFB',
};

export default function CreateChallengeScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [distance, setDistance] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarType, setCalendarType] = useState('start');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarPick, setCalendarPick] = useState(new Date());

  const handleCreate = async () => {
    const nameErrors = validateChallengeName(name);
    const locationErrors = validateLocation(startLocation, targetLocation);
    const distanceErrors = validateDistance(distance);
    const dateErrors = validateDate(startDate, endDate);

    const userId = await AsyncStorage.getItem('userId');
    const teamId = '1';

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

    if (
      nameErrors.length > 0 ||
      locationErrors.length > 0 ||
      distanceErrors.length > 0 ||
      dateErrors.length > 0
    ) {
      const allErrors = [...nameErrors, ...locationErrors, ...distanceErrors, ...dateErrors];
      allErrors.forEach((error, i) => {
        setTimeout(() => {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error,
            position: 'top',
            visibilityTime: 2000,
            topOffset: 100,
          });
        }, i * 2500);
      });
      return;
    }

    const newChallengeData = {
      name,
      start_location: startLocation,
      target_location: targetLocation,
      distance: parseFloat(distance),
      start_date: ymdToUtcMidnightIso(startDate),
      end_date: ymdToUtcMidnightIso(endDate),
      creator_id: parseInt(userId || '0', 10),
      team_id: parseInt(teamId, 10),
    };

    setLoading(true);
    try {
      await createChallenge(newChallengeData);
      Toast.show({
        type: 'success',
        text1: 'Erfolg',
        text2: 'Challenge erfolgreich erstellt!',
        position: 'top',
        topOffset: 100,
      });
      router.replace('/challenges');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Challenge konnte nicht erstellt werden!',
        position: 'top',
        topOffset: 100,
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Kalender-Funktionen ----------
  const openCalendar = (type) => {
    setCalendarType(type);

    const currentDate =
      type === 'start' && startDate
        ? parseLocalYMD(startDate) ?? new Date()
        : type === 'end' && endDate
          ? parseLocalYMD(endDate) ?? new Date()
          : new Date();

    setCalendarPick(currentDate);
    setCalendarMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    setCalendarOpen(true);
  };

  const applySelectedDate = () => {
    const formatted = formatLocalYMD(calendarPick);
    if (calendarType === 'start') setStartDate(formatted);
    else setEndDate(formatted);
    setCalendarOpen(false);
  };

  const calendarHeader = useMemo(
    () =>
      calendarMonth.toLocaleDateString('de-DE', {
        month: 'long',
        year: 'numeric',
      }),
    [calendarMonth]
  );

  const calendarGrid = useMemo(() => {
    const first = firstOfMonth(calendarMonth);
    const firstDayOfWeek = (first.getDay() + 6) % 7; 
    const start = new Date(first);
    start.setDate(first.getDate() - firstDayOfWeek);

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const inMonth = date.getMonth() === calendarMonth.getMonth();
      let selectable = true;

      if (calendarType === 'start') {
        selectable = stripTime(date) >= stripTime(new Date());
      } else if (calendarType === 'end') {
        if (startDate) {
          const startDateObj = parseLocalYMD(startDate) ?? new Date(startDate);
          selectable = stripTime(date) >= stripTime(startDateObj);
        } else {
          selectable = stripTime(date) >= stripTime(new Date());
        }
      }

      cells.push({ date, inMonth, selectable });
    }
    return cells;
  }, [calendarMonth, calendarType, startDate]);

  const canGoPrevMonth = () => {
    if (calendarType === 'start') {
      const prevMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
      return lastOfMonth(prevMonth) >= stripTime(new Date());
    }
    return true;
  };

  const goPrevMonth = () => {
    if (canGoPrevMonth()) {
      setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
    }
  };

  const goNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const FieldLabel = ({ children }) => <Text style={styles.label}>{children}</Text>;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header card */}
        <View style={styles.headerCard}>
          <Text style={styles.title}>Challenge erstellen</Text>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          <FieldLabel>Challenge Name</FieldLabel>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholderTextColor="#8A9590"
            style={styles.input}
            editable={!loading}
          />

          <FieldLabel>Startort</FieldLabel>
          <TextInput
            value={startLocation}
            onChangeText={setStartLocation}
            placeholderTextColor="#8A9590"
            style={styles.input}
            editable={!loading}
          />

          <FieldLabel>Zielort</FieldLabel>
          <TextInput
            value={targetLocation}
            onChangeText={setTargetLocation}
            placeholderTextColor="#8A9590"
            style={styles.input}
            editable={!loading}
          />

          <FieldLabel>Distanz (km)</FieldLabel>
          <TextInput
            value={distance}
            onChangeText={setDistance}
            placeholderTextColor="#8A9590"
            style={styles.input}
            keyboardType="numeric"
            editable={!loading}
          />

          {/* Dates */}
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <FieldLabel>Start</FieldLabel>
              <Pressable onPress={() => openCalendar('start')} style={styles.datePill}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.accent} />
                <Text style={[styles.dateText, !startDate && { color: '#8A9590' }]}>
                  {startDate || 'Start-Datum'}
                </Text>
              </Pressable>
            </View>

            <View style={{ flex: 1 }}>
              <FieldLabel>Ende</FieldLabel>
              <Pressable onPress={() => openCalendar('end')} style={styles.datePill}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.accent} />
                <Text style={[styles.dateText, !endDate && { color: '#8A9590' }]}>
                  {endDate || 'End-Datum'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Buttons */}
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
              onPress={handleCreate}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
                loading && styles.disabled,
              ]}
            >
              <Text style={styles.primaryBtnText}>{loading ? 'Erstelle…' : 'Erstellen'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Kalender Modal */}
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
                style={[styles.navPill, !canGoPrevMonth() && { opacity: 0.35 }]}
                disabled={!canGoPrevMonth()}
              >
                <Ionicons name="chevron-back" size={18} color={COLORS.text} />
              </TouchableOpacity>

              <Text style={styles.calHeaderTitle}>{calendarHeader}</Text>

              <TouchableOpacity onPress={goNextMonth} style={styles.navPill}>
                <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
              </TouchableOpacity>
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
                const disabled = !selectable;
                const isToday = sameDay(date, new Date());

                return (
                  <TouchableOpacity
                    key={`${date.getTime()}-${idx}`}
                    style={[styles.dayCellWrap, disabled && { opacity: 0.35 }]}
                    onPress={() => !disabled && setCalendarPick(date)}
                    disabled={disabled}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.dayCellInner,
                        !inMonth && styles.dayCellInnerOutMonth,
                        isToday && !isSelected && styles.dayCellInnerToday,
                        isSelected && !disabled && styles.dayCellInnerSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          !inMonth && styles.dayOutText,
                          isToday && !isSelected && styles.dayTodayText,
                          isSelected && !disabled && styles.daySelectedText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Pressable
              style={({ pressed }) => [styles.applyBtn, pressed && styles.pressed]}
              onPress={applySelectedDate}
            >
              <Text style={styles.applyBtnText}>Übernehmen</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
              onPress={() => setCalendarOpen(false)}
            >
              <Text style={styles.cancelBtnText}>Abbrechen</Text>
            </Pressable>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
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
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(15,20,17,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 2,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
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

  // Kalender Styles
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
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
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
    fontWeight: '900',
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
  dayCellInnerOutMonth: {
    backgroundColor: 'rgba(15,20,17,0.02)',
  },
  dayCellInnerToday: {
    borderColor: 'rgba(85,128,92,0.30)',
    backgroundColor: 'rgba(85,128,92,0.06)',
  },
  dayCellInnerSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  dayCellText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '800',
  },
  dayOutText: {
    color: 'rgba(15,20,17,0.25)',
  },
  dayTodayText: {
    color: COLORS.accent,
  },
  daySelectedText: {
    color: '#fff',
  },

  applyBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 14,
  },
  applyBtnText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 15,
  },
  cancelBtn: {
    paddingVertical: 13,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F9FAFB',
  },
  cancelBtnText: {
    color: COLORS.sub,
    fontSize: 14,
    fontWeight: '800',
  },
});
