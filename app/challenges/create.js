import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
                    topOffset: 100,
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
                        topOffset: 100,
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
                        topOffset: 100,
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
                        topOffset: 100,
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
                        topOffset: 100,
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
                text2: 'Challenge erfolgreich erstellt! ',
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

    return (
        <View style={styles.container}>
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formContainer}>
                    {/* Titel "Challenge erstellen" über den Eingabefeldern */}
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
                            <Picker.Item label="Incoming" value="incoming" />
                            <Picker.Item label="Open" value="open" />
                            <Picker.Item label="Closed" value="closed" />
                        </Picker>
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
        paddingTop: 60, // Abstand oben
    },
    formContainer: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'left',
        marginBottom: 30,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 16,
        marginBottom: 20,
        borderRadius: 6,
        fontSize: 16,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        marginBottom: 20,
    },
    picker: {
        height: 50,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        marginBottom: 40, // Extra Abstand unten für besseres Scrollen
    },
    createButton: {
        flex: 1,
        padding: 16,
        backgroundColor: '#6B8F71',
        borderRadius: 6,
        alignItems: 'center',
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        alignItems: 'center',
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
    },
});