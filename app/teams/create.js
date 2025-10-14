import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { validateTeamName } from '../../lib/teamValidation';
import { createTeam } from '../../services/teamService';

export default function CreateTeamScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        const nameErrors = validateTeamName(name);

        if (!name.trim()) {
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
        setLoading(true);
        try {
            await createTeam({ name });
            Toast.show({
                type: 'success',
                text1: 'Erfolg',
                text2: 'Team erfolgreich erstellt! ',
                position: 'top',
                topOffset: 100,
            });
            router.replace('/teams');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.message || 'Team konnte nicht erstellt werden!',
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
            <View style={styles.formContainer}>
                {/* Titel "Team erstellen" über dem Eingabefeld */}
                <Text style={styles.title}>Team erstellen</Text>
                
                <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Team Name"
                    style={styles.input}
                    editable={!loading}
                />
                
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 40, // Verkleinert von 60 auf 40
    },
    formContainer: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'left',
        marginBottom: 20, // Verkleinert von 30 auf 20
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 14, // Verkleinert von 16 auf 14
        marginBottom: 16, // Verkleinert von 20 auf 16
        borderRadius: 6,
        fontSize: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10, // Verkleinert von 12 auf 10
        marginTop: 16, // Verkleinert von 20 auf 16
    },
    createButton: {
        flex: 1,
        padding: 14, // Verkleinert von 16 auf 14
        backgroundColor: '#6B8F71',
        borderRadius: 6,
        alignItems: 'center',
    },
    cancelButton: {
        flex: 1,
        padding: 14, // Verkleinert von 16 auf 14
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