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

        const formattedStartDate = `${startDate} 00:00:00.000`;
        const formattedEndDate = `${endDate} 00:00:00.000`;

        const updatedChallengeData = {
            name,
            start_location: startLocation,
            target_location: targetLocation,
            distance: parseFloat(distance),
            start_date: formattedStartDate,
            end_date: formattedEndDate,
        };
        setLoading(true);
        try {
            await updateChallenge(Number(params.id), updatedChallengeData);
            Toast.show({
                type: 'success',
                text1: 'Erfolg',
                text2: 'Challenge erfolgreich aktualisiert!',
                position: 'top',
                topOffset: 100,
            });
            router.replace('/allChallenges');
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

    const handleCancel = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <View style={styles.formContainer}>
                {/* Titel "Challenge bearbeiten" über den Eingabefeldern */}
                <Text style={styles.title}>Challenge bearbeiten</Text>
                
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
            
                
                <View style={styles.buttonContainer}>
                    <Pressable
                        onPress={handleCancel}
                        disabled={loading}
                        style={[styles.cancelButton, loading && styles.disabledButton]}
                    >
                        <Text style={styles.cancelButtonText}>Abbrechen</Text>
                    </Pressable>
                    
                    <Pressable
                        onPress={handleUpdate}
                        disabled={loading}
                        style={[styles.updateButton, loading && styles.disabledButton]}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Aktualisierung...' : 'Aktualisieren'}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 40,
    },
    formContainer: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'left',
        marginBottom: 20,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 14,
        marginBottom: 16,
        borderRadius: 6,
        fontSize: 16,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        marginBottom: 16,
    },
    picker: {
        height: 50,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },
    updateButton: {
        flex: 1,
        padding: 14,
        backgroundColor: '#6B8F71',
        borderRadius: 6,
        alignItems: 'center',
    },
    cancelButton: {
        flex: 1,
        padding: 14,
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