import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createChallenge } from '../../services/ChallengeService';

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
        setLoading(true);
        try {
            const userId = await AsyncStorage.getItem('userId');
            const teamId = '1';

            if (!name || !startLocation || !targetLocation || !distance || !startDate || !endDate) {
                Alert.alert('Error', 'Please fill in all fields');
                setLoading(false);
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

            await createChallenge(newChallengeData);
            Alert.alert('Success', 'Challenge erfolgreich erstellt!');
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Challenge konnte nicht erstellt werden');
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