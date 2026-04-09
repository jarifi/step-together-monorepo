import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { createChallenge } from '../../services/challengeService';
import { getAllTeams } from '../../services/teamService';

const COLORS = {
  bg: '#F5F7F4',
  surface: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  accent: '#55805c',
  accentSoft: 'rgba(85,128,92,0.10)',
  accentBorder: 'rgba(85,128,92,0.20)',
  inputBg: '#FBFCFB',
};

const stripTime = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const firstOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const lastOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const sameDay = (a, b) => stripTime(a).getTime() === stripTime(b).getTime();

const formatLocalYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseLocalYMD = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
};

const isValidHHMM = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(t ?? '').trim());

const localDateTimeToUtcIso = (ymd, hhmm) => {
  const [y, m, d] = String(ymd).split('-').map(Number);
  const [hh, mm] = String(hhmm).split(':').map(Number);
  const local = new Date(y, m - 1, d, hh, mm, 0, 0);
  return local.toISOString();
};

export default function CreateChallengeScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [distance, setDistance] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  const [loading, setLoading] = useState(false);

  const [availableTeams, setAvailableTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarType, setCalendarType] = useState('start');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarPick, setCalendarPick] = useState(new Date());

  const FieldLabel = ({ children }) => <Text style={styles.label}>{children}</Text>;

  const showError = (msg) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: String(msg),
      position: 'top',
      visibilityTime: 2000,
      topOffset: 100,
    });
  };

  useEffect(() => {
    let mounted = true;

    const loadTeams = async () => {
      try {
        setTeamsLoading(true);
        const data = await getAllTeams(100);

        if (!mounted) return;

        const mapped = (Array.isArray(data) ? data : [])
          .map((team) => ({
            id: Number(team.id),
            name: team.name ?? `Team ${team.id}`,
          }))
          .filter((team) => team.id)
          .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));

        setAvailableTeams(mapped);
      } catch (error) {
        console.error('Error loading teams:', error);
        if (mounted) showError('Teams konnten nicht geladen werden.');
      } finally {
        if (mounted) setTeamsLoading(false);
      }
    };

    loadTeams();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedTeams = useMemo(() => {
    return availableTeams.filter((team) => selectedTeamIds.includes(team.id));
  }, [availableTeams, selectedTeamIds]);

  const filteredTeamResults = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();

    const sorted = [...availableTeams].sort((a, b) => {
      const aSelected = selectedTeamIds.includes(a.id) ? 1 : 0;
      const bSelected = selectedTeamIds.includes(b.id) ? 1 : 0;

      if (aSelected !== bSelected) return bSelected - aSelected;
      return a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });
    });

    if (!q) return sorted;

    return sorted.filter((team) => {
      const name = String(team.name ?? '').toLowerCase();
      const id = String(team.id ?? '');
      return name.includes(q) || id.includes(q);
    });
  }, [availableTeams, selectedTeamIds, teamSearch]);

  const toggleTeam = (teamId) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const handleCreate = async () => {
    const nameErrors = validateChallengeName(name);
    const locationErrors = validateLocation(startLocation, targetLocation);
    const distanceErrors = validateDistance(distance);
    const dateErrors = validateDate(startDate, endDate);

    const userId = await AsyncStorage.getItem('userId');

    if (
      !name ||
      !startLocation ||
      !targetLocation ||
      !distance ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime
    ) {
      showError('Alle Felder sind Pflichtfelder!');
      return;
    }

    if (!isValidHHMM(startTime) || !isValidHHMM(endTime)) {
      showError('Bitte Zeiten im Format HH:mm eingeben.');
      return;
    }

    const startIso = localDateTimeToUtcIso(startDate, startTime);
    const endIso = localDateTimeToUtcIso(endDate, endTime);

    if (new Date(endIso).getTime() < new Date(startIso).getTime()) {
      showError('Ende darf nicht vor Start liegen.');
      return;
    }

    const allErrors = [...nameErrors, ...locationErrors, ...distanceErrors, ...dateErrors].filter(
      Boolean
    );

    if (allErrors.length > 0) {
      allErrors.forEach((error, i) => {
        setTimeout(() => showError(error), i * 900);
      });
      return;
    }

    const newChallengeData = {
      name,
      start_location: startLocation,
      target_location: targetLocation,
      distance: parseFloat(distance),
      start_date: startIso,
      end_date: endIso,
      creator_id: parseInt(userId || '0', 10),
      ...(selectedTeamIds.length > 0 ? { team_ids: selectedTeamIds } : {}),
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
      showError(error?.message || 'Challenge konnte nicht erstellt werden!');
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
          const startDateObj = parseLocalYMD(startDate) ?? new Date();
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

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerCard}>
          <Text style={styles.title}>Challenge erstellen</Text>
        </View>

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

          <FieldLabel>Teams</FieldLabel>
          <Pressable
            onPress={() => setTeamModalOpen(true)}
            style={styles.selectorPill}
            disabled={loading || teamsLoading}
          >
            <View style={styles.selectorLeft}>
              <Ionicons name="people-outline" size={18} color={COLORS.accent} />
              <Text style={[styles.selectorText, selectedTeams.length === 0 && styles.placeholderText]}>
                {teamsLoading
                  ? 'Teams werden geladen...'
                  : selectedTeams.length > 0
                    ? `${selectedTeams.length} Teams ausgewählt`
                    : 'Teams auswählen'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.sub} />
          </Pressable>

          {selectedTeams.length > 0 && (
            <View style={styles.chipsWrap}>
              {selectedTeams.map((team) => (
                <View key={team.id} style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>
                    {team.name}
                  </Text>
                  <Pressable onPress={() => toggleTeam(team.id)} hitSlop={8} disabled={loading}>
                    <Ionicons name="close" size={15} color={COLORS.text} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <FieldLabel>Startdatum</FieldLabel>
              <Pressable onPress={() => openCalendar('start')} style={styles.datePill}>
                <View style={styles.datePillLeft}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.accent} />
                  <Text style={[styles.dateText, !startDate && styles.placeholderText]}>
                    {startDate || 'Auswählen'}
                  </Text>
                </View>
              </Pressable>
            </View>

            <View style={{ flex: 1 }}>
              <FieldLabel>Enddatum</FieldLabel>
              <Pressable onPress={() => openCalendar('end')} style={styles.datePill}>
                <View style={styles.datePillLeft}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.accent} />
                  <Text style={[styles.dateText, !endDate && styles.placeholderText]}>
                    {endDate || 'Auswählen'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <FieldLabel>Startzeit</FieldLabel>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:mm"
                placeholderTextColor="#8A9590"
                style={styles.input}
                editable={!loading}
              />
            </View>

            <View style={{ flex: 1 }}>
              <FieldLabel>Endzeit</FieldLabel>
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                placeholder="HH:mm"
                placeholderTextColor="#8A9590"
                style={styles.input}
                editable={!loading}
              />
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
              onPress={handleCreate}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
                loading && styles.disabled,
              ]}
            >
              {loading ? (
                <View style={styles.loadingBtnContent}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.primaryBtnText}>Erstelle…</Text>
                </View>
              ) : (
                <Text style={styles.primaryBtnText}>Erstellen</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={teamModalOpen}
        onRequestClose={() => setTeamModalOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setTeamModalOpen(false)}>
          <Pressable style={styles.teamModalCard} onPress={() => {}}>
            <View style={styles.modalTopRow}>
              <Text style={styles.teamModalTitle}>Teams auswählen</Text>
              <Pressable onPress={() => setTeamModalOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </Pressable>
            </View>

            <View style={styles.searchBoxWrap}>
              <Ionicons name="search-outline" size={18} color={COLORS.sub} />
              <TextInput
                value={teamSearch}
                onChangeText={setTeamSearch}
                placeholder="Team suchen…"
                placeholderTextColor="#8A9590"
                style={styles.searchInput}
              />
              {teamSearch.trim().length > 0 && (
                <Pressable onPress={() => setTeamSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={COLORS.sub} />
                </Pressable>
              )}
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {teamsLoading ? (
                <View style={styles.modalCenterState}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                  <Text style={styles.stateText}>Teams werden geladen...</Text>
                </View>
              ) : filteredTeamResults.length === 0 ? (
                <View style={styles.modalCenterState}>
                  <Text style={styles.stateText}>Keine Teams gefunden.</Text>
                </View>
              ) : (
                filteredTeamResults.map((team) => {
                  const selected = selectedTeamIds.includes(team.id);

                  return (
                    <Pressable
                      key={team.id}
                      style={[styles.teamRow, selected && styles.teamRowSelected]}
                      onPress={() => toggleTeam(team.id)}
                    >
                      <Text style={styles.teamRowText}>{team.name}</Text>
                      <Ionicons
                        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={selected ? COLORS.accent : COLORS.sub}
                      />
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <Pressable style={styles.applyBtn} onPress={() => setTeamModalOpen(false)}>
              <Text style={styles.applyBtnText}>Fertig</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

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
                style={[styles.navPill, !canGoPrevMonth() && styles.navDisabled]}
                disabled={!canGoPrevMonth()}
              >
                <Ionicons name="chevron-back" size={18} color={COLORS.text} />
              </Pressable>

              <Text style={styles.calHeaderTitle}>{calendarHeader}</Text>

              <Pressable onPress={goNextMonth} style={styles.navPill}>
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
                    style={[styles.dayCellWrap, disabled && styles.dayDisabled]}
                    onPress={() => !disabled && setCalendarPick(date)}
                    disabled={disabled}
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

  selectorPill: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  selectorText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '700',
    flexShrink: 1,
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    maxWidth: '100%',
  },
  chipText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 13,
    maxWidth: 180,
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
  },
  datePillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
  },
  placeholderText: {
    color: '#8A9590',
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
  loadingBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  teamModalCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  teamModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },

  searchBoxWrap: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    borderRadius: 18,
    paddingHorizontal: 12,
    minHeight: 46,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 10,
  },

  modalCenterState: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stateText: {
    color: COLORS.sub,
    fontSize: 14,
    fontWeight: '600',
  },

  teamRow: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: COLORS.inputBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  teamRowSelected: {
    borderColor: 'rgba(85,128,92,0.35)',
    backgroundColor: 'rgba(85,128,92,0.08)',
  },
  teamRowText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    paddingRight: 8,
  },

  calendarCard: {
    backgroundColor: '#fff',
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
  navDisabled: {
    opacity: 0.35,
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
  dayDisabled: {
    opacity: 0.35,
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
    color: '#fff',
    fontWeight: '800',
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