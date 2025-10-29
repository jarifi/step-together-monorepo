import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
    validateChallengeName,
    validateDate,
    validateDistance,
    validateLocation
} from '../../lib/challengeValidation';
import { createChallenge } from '../../services/challengeService';

// Hilfsfunktionen für den Kalender
const stripTime = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const firstOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

const lastOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const sameDay = (a, b) => {
    return stripTime(a).getTime() === stripTime(b).getTime();
};

export default function CreateChallengeScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [startLocation, setStartLocation] = useState('');
    const [targetLocation, setTargetLocation] = useState('');
    const [distance, setDistance] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [state, setState] = useState('incoming');
    const [loading, setLoading] = useState(false);

    // Kalender State
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

        if (nameErrors.length > 0 || locationErrors.length > 0 || distanceErrors.length > 0 || dateErrors.length > 0) {
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
            start_date: `${startDate}T00:00:00.000Z`,
            end_date: `${endDate}T00:00:00.000Z`,
            creator_id: parseInt(userId || '0', 10),
            team_id: parseInt(teamId, 10),
            state,
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

    // Kalender-Funktionen
    const openCalendar = (type) => {
        setCalendarType(type);
        const currentDate = type === 'start' && startDate
            ? new Date(startDate)
            : type === 'end' && endDate
                ? new Date(endDate)
                : new Date();

        setCalendarPick(currentDate);
        setCalendarMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
        setCalendarOpen(true);
    };

    const applySelectedDate = () => {
        const formatted = calendarPick.toISOString().split('T')[0];
        if (calendarType === 'start') {
            setStartDate(formatted);
        } else {
            setEndDate(formatted);
        }
        setCalendarOpen(false);
    };

    const calendarHeader = calendarMonth.toLocaleDateString('de-DE', {
        month: 'long',
        year: 'numeric'
    });

    // Korrigierte calendarGrid Funktion
    const calendarGrid = (() => {
        const first = firstOfMonth(calendarMonth);
        const firstDayOfWeek = (first.getDay() + 6) % 7; // Montag = 0
        const start = new Date(first);
        start.setDate(first.getDate() - firstDayOfWeek);

        const cells = [];

        for (let i = 0; i < 42; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);

            const inMonth = date.getMonth() === calendarMonth.getMonth();
            let selectable = true;

            // Validierungslogik
            if (calendarType === 'start') {
                // Start-Datum: nur heutiges Datum und zukünftige Daten
                selectable = stripTime(date) >= stripTime(new Date());
            } else if (calendarType === 'end') {
                // End-Datum: nur Daten nach dem Start-Datum (falls vorhanden)
                if (startDate) {
                    const startDateObj = new Date(startDate);
                    selectable = stripTime(date) >= stripTime(startDateObj);
                } else {
                    // Wenn kein Start-Datum ausgewählt, nur heutiges Datum und zukünftige Daten
                    selectable = stripTime(date) >= stripTime(new Date());
                }
            }

            cells.push({
                date,
                inMonth,
                selectable
            });
        }
        return cells;
    })();

    const canGoPrevMonth = () => {
        if (calendarType === 'start') {
            const prevMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
            return lastOfMonth(prevMonth) >= stripTime(new Date());
        }
        return true;
    };

    const canGoNextMonth = () => {
        return true;
    };

    const goPrevMonth = () => {
        if (canGoPrevMonth()) {
            setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
        }
    };

    const goNextMonth = () => {
        if (canGoNextMonth()) {
            setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Challenge erstellen</Text>

                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Challenge Name"
                        style={styles.input}
                        editable={!loading}
                    />
                    <TextInput
                        value={startLocation}
                        onChangeText={setStartLocation}
                        placeholder="Startort"
                        style={styles.input}
                        editable={!loading}
                    />
                    <TextInput
                        value={targetLocation}
                        onChangeText={setTargetLocation}
                        placeholder="Zielort"
                        style={styles.input}
                        editable={!loading}
                    />
                    <TextInput
                        value={distance}
                        onChangeText={setDistance}
                        placeholder="Distanz (in km)"
                        style={styles.input}
                        keyboardType="numeric"
                        editable={!loading}
                    />

                    {/* Start-Datum */}
                    <View style={styles.dateRow}>
                        <Pressable
                            onPress={() => openCalendar('start')}
                            style={[styles.input, styles.dateInput]}
                        >
                            <Text style={{ color: startDate ? '#000' : '#aaa' }}>
                                {startDate ? startDate : 'Start-Datum auswählen'}
                            </Text>
                        </Pressable>
                        <TouchableOpacity
                            style={styles.calendarIconContainer}
                            onPress={() => openCalendar('start')}
                        >
                            <Ionicons
                                name="calendar-outline"
                                size={24}
                                color="#6B8F71"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* End-Datum */}
                    <View style={styles.dateRow}>
                        <Pressable
                            onPress={() => openCalendar('end')}
                            style={[styles.input, styles.dateInput]}
                        >
                            <Text style={{ color: endDate ? '#000' : '#aaa' }}>
                                {endDate ? endDate : 'End-Datum auswählen'}
                            </Text>
                        </Pressable>
                        <TouchableOpacity
                            style={styles.calendarIconContainer}
                            onPress={() => openCalendar('end')}
                        >
                            <Ionicons
                                name="calendar-outline"
                                size={24}
                                color="#6B8F71"
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.pickerWrapper}>
                        <Text style={styles.pickerLabel}>Status:</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={state}
                                onValueChange={setState}
                                style={styles.picker}
                                dropdownIconColor="#6B8F71"
                                enabled={!loading}
                            >
                                <Picker.Item label="Incoming" value="incoming" />
                                <Picker.Item label="Open" value="open" />
                                <Picker.Item label="Closed" value="closed" />
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <Pressable
                            onPress={() => router.back()}
                            disabled={loading}
                            style={[styles.cancelButton, loading && styles.disabledButton]}
                        >
                            <Text style={styles.cancelButtonText}>Abbrechen</Text>
                        </Pressable>

                        <Pressable
                            onPress={handleCreate}
                            disabled={loading}
                            style={[styles.createButton, loading && styles.disabledButton]}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Erstelle...' : 'Erstellen'}
                            </Text>
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
                                <Ionicons name="chevron-back" size={18} />
                            </TouchableOpacity>
                            <Text style={[styles.calHeaderTitle]}>{calendarHeader}</Text>
                            <TouchableOpacity
                                onPress={goNextMonth}
                                style={[styles.navPill, !canGoNextMonth() && { opacity: 0.35 }]}
                                disabled={!canGoNextMonth()}
                            >
                                <Ionicons name="chevron-forward" size={18} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.weekRow}>
                            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
                                <Text key={d} style={[styles.weekCell]}>
                                    {d}
                                </Text>
                            ))}
                        </View>

                        <View style={styles.grid}>
                            {calendarGrid.map(({ date, inMonth, selectable }, idx) => {
                                const isSame = sameDay(date, calendarPick);
                                const disabled = !selectable;
                                const isToday = sameDay(date, new Date());

                                return (
                                    <TouchableOpacity
                                        key={`${date.toISOString()}-${idx}`}
                                        style={[
                                            styles.dayCellWrap,
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
                                                    !inMonth && styles.dayOutText,
                                                    isSame && !disabled && styles.daySelectedText,
                                                    isToday && !isSame && styles.dayTodayText,
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
                            onPress={applySelectedDate}
                        >
                            <Text style={[styles.applyBtnText]}>Übernehmen</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setCalendarOpen(false)}
                        >
                            <Text style={[styles.cancelBtnText]}>Abbrechen</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
        paddingTop: 60,
    },
    formContainer: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#333',
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 16,
        marginBottom: 20,
        borderRadius: 6,
        fontSize: 16,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 20,
    },
    dateInput: {
        flex: 1,
    },
    calendarIconContainer: {
        position: 'absolute',
        right: 16,
        //top: 0,
        //bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: '100%',
    },
    pickerWrapper: {
        marginBottom: 20,
    },
    pickerLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginLeft: 4,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        backgroundColor: '#fff',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        marginBottom: 40,
    },
    createButton: {
        flex: 1,
        padding: 16,
        backgroundColor: '#6B8F71',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 16,
    },
    disabledButton: {
        backgroundColor: '#aaa',
        borderColor: '#aaa',
        opacity: 0.6,
    },
    // Kalender Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    calendarCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    calHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    navPill: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    calHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    weekRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekCell: {
        flex: 1,
        textAlign: 'center',
        fontWeight: '600',
        color: '#666',
        fontSize: 14,
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
        borderRadius: 8,
    },
    dayCellText: {
        fontSize: 14,
        color: '#333',
    },
    dayOutText: {
        color: '#ccc',
    },
    dayTodayWrap: {
        backgroundColor: '#f0f9ff',
    },
    dayTodayText: {
        color: '#6B8F71',
        fontWeight: 'bold',
    },
    daySelectedWrap: {
        backgroundColor: '#6B8F71',
    },
    daySelectedText: {
        color: 'white',
        fontWeight: 'bold',
    },
    applyBtn: {
        backgroundColor: '#6B8F71',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    applyBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelBtn: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelBtnText: {
        color: '#666',
        fontSize: 16,
    },
});