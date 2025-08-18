import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createTeam } from '../../services/teamService';

export default function CreateTeamScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        setLoading(true);
        try {
            await createTeam({ name });
            Alert.alert('Success', 'Team erfolgreich erstellt!');
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Team konnte nicht erstellt werden');
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
                placeholder="Team Name"
                style={styles.input}
                editable={!loading}
            />
            <Pressable
                onPress={handleCreate}
                disabled={loading}
                style={[styles.createButton, loading && styles.disabledButton]}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Erstelle...' : 'Team erstellen'}
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