import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { validateChallengeName, validateDate, validateDistance, validateLocation } from '../../lib/challengeValidation';
import { createChallenge } from '../../services/challengeService';

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
    
    const handleCreate = async () => {
        const nameErrors = validateChallengeName(name);
        const locationErrors = validateLocation(startLocation, targetLocation);
        const distanceErrors = validateDistance(distance);
        const dateErrors = validateDate(startDate, endDate);
        const userId = await AsyncStorage.getItem('userId');
        const teamId = '1';


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

        const newChallengeData = {
            name,
            start_location: startLocation,
            target_location: targetLocation,
            distance: parseFloat(distance),
            start_date: `${startDate}T00:00:00.000Z`,
            end_date: `${endDate}T00:00:00.000Z`,
            creator_id: parseInt(userId, 10),
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
                topOffset: 100, // Unter dem Header anzeigen
            });
            router.replace('/challenges');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.message || 'Challenge konnte nicht erstellt werden!',
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
                placeholder="Distanz"
                style={styles.input}
                keyboardType="numeric"
                editable={!loading}
            />
            <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="Start-Datum (YYYY-MM-DD)"
                style={styles.input}
                editable={!loading}
            />
            <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="End-Datum (YYYY-MM-DD)"
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
                onPress={handleCreate}
                disabled={loading}
                style={[styles.createButton, loading && styles.disabledButton]}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Erstelle...' : 'Challenge erstellen'}
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
    createButton: {
        padding: 12,
        backgroundColor: '#6B8F71',
        borderRadius: 6,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#aaa',
    },
});