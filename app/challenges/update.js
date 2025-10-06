import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { validateChallengeName, validateDate, validateDistance, validateLocation } from '../../lib/challengeValidation';
import { updateChallenge } from '../../services/challengeService';

export default function UpdateChallengeScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [name, setName] = useState(params.name || '');
    const [startLocation, setStartLocation] = useState(params.startLocation || '');
    const [targetLocation, setTargetLocation] = useState(params.targetLocation || '');
    const [distance, setDistance] = useState(params.distance || '');
    const [startDate, setStartDate] = useState(params.startDate ? params.startDate.split('T')[0] : '');
    const [endDate, setEndDate] = useState(params.endDate ? params.endDate.split('T')[0] : '');
    const [state, setState] = useState(params.state || '');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        const nameErrors = validateChallengeName(name);
        const locationErrors = validateLocation(startLocation, targetLocation);
        const distanceErrors = validateDistance(distance);
        const dateErrors = validateDate(startDate, endDate);


        if (!name || !startLocation || !targetLocation || !distance || !startDate || !endDate) {
            setTimeout(() => {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Alle Felder sind Pflichtfelder!',
                    position: 'top',
                    visibilityTime: 2000,
                    topOffset: 100, // Unter dem Header anzeigen
                });
            });
            return;
        }

        if (nameErrors.length > 0) {
            nameErrors.forEach((error, index) => {
                setTimeout(() => {
                    Toast.show({
                        type: 'error',
                        text1: "Error",
                        text2: error,
                        position: 'top',
                        visibilityTime: 2000,
                        topOffset: 100, // Unter dem Header anzeigen
                    });
                }, index * 2500);
            });
            return;
        }
        if (locationErrors.length > 0) {
            locationErrors.forEach((error, index) => {
                setTimeout(() => {
                    Toast.show({
                        type: 'error',
                        text1: "Error",
                        text2: error,
                        position: 'top',
                        visibilityTime: 2000,
                        topOffset: 100, // Unter dem Header anzeigen
                    });
                }, index * 2500);
            });
            return;
        }

        if (distanceErrors.length > 0) {
            distanceErrors.forEach((error, index) => {
                setTimeout(() => {
                    Toast.show({
                        type: 'error',
                        text1: "Error",
                        text2: error,
                        position: 'top',
                        visibilityTime: 2000,
                        topOffset: 100, // Unter dem Header anzeigen
                    });
                }, index * 2500);
            });
            return;
        }

        if (dateErrors.length > 0) {
            dateErrors.forEach((error, index) => {
                setTimeout(() => {
                    Toast.show({
                        type: 'error',
                        text1: "Error",
                        text2: error,
                        position: 'top',
                        visibilityTime: 2000,
                        topOffset: 100, // Unter dem Header anzeigen
                    });
                }, index * 2500);
            });
            return;
        }

        const formattedStartDate = `${startDate} 00:00:00.000`;
        const formattedEndDate = `${endDate} 00:00:00.000`;

        const updatedChallengeData = {
            name,
            start_location: startLocation,
            target_location: targetLocation,
            distance: parseFloat(distance),
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            state: state,
        };
        setLoading(true);
        try {
            await updateChallenge(Number(params.id), updatedChallengeData);
            Toast.show({
                type: 'success',
                text1: 'Erfolg',
                text2: 'Challenge erfolgreich aktualisiert! ', //Korrigierte Nachricht
                position: 'top',
                topOffset: 100, // Unter dem Header anzeigen
            });
            router.replace('/challenges');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.message || 'Challenge konnte nicht aktualisiert werden!',
                position: 'top',
                topOffset: 100, // Unter dem Header anzeigen
            });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
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
                placeholder="Start Location"
                style={styles.input}
                editable={!loading}
            />
            <TextInput
                value={targetLocation}
                onChangeText={setTargetLocation}
                placeholder="Target Location"
                style={styles.input}
                editable={!loading}
            />
            <TextInput
                value={distance}
                onChangeText={setDistance}
                placeholder="Distance"
                style={styles.input}
                keyboardType="numeric"
                editable={!loading}
            />
            <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="Start Date (YYYY-MM-DD)"
                style={styles.input}
                editable={!loading}
            />
            <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="End Date (YYYY-MM-DD)"
                style={styles.input}
                editable={!loading}
            />
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={state}
                    onValueChange={(itemValue, itemIndex) => setState(itemValue)}
                    style={styles.picker}
                    enabled={!loading}
                >
                    <Picker.Item label="incoming" value="incoming" />
                    <Picker.Item label="open" value="open" />
                    <Picker.Item label="closed" value="closed" />
                </Picker>
            </View>
            <Pressable
                onPress={handleUpdate}
                disabled={loading}
                style={[
                    styles.updateButton,
                    loading && styles.disabledButton,
                ]}
            >
                <Text style={styles.updateText}>
                    {loading ? 'Aktualisierung...' : 'Challenge aktualisieren'}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        flex: 1,
        backgroundColor: '#fff',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        marginBottom: 12,
        borderRadius: 6,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        marginBottom: 12,
    },
    picker: {
        height: 50,
    },
    updateButton: {
        padding: 12,
        backgroundColor: '#6B8F71',
        borderRadius: 6,
        alignItems: 'center',
    },
    updateText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#aaa',
    },
});