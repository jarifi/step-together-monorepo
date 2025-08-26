import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTeam } from "../../context/TeamContext";
import Toast from 'react-native-toast-message';
import { validateTeamName } from '../../lib/teamValidation';
import { updateTeam } from "../../services/teamService";

export default function UpdateTeamScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const { setTeam } = useTeam();

    useEffect(() => {
        if (params) {
            setName(params.name || '');
        };
    }, []);

    const handleUpdate = async () => {
        const nameErrors = validateTeamName(name);

        if (!name.trim) {
            setTimeout(() => {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Alle Felder sind Pflichtfelder!',
                    position: 'top',
                    visibilityTime: 2000,
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
                    });
                }, index * 2500);
            });
            return;
        }
        setLoading(true);
        try {
            await updateTeam(Number(params.id), { name });
            Toast.show({
                type: 'success',
                text1: 'Erfolg',
                text2: 'Benutzer erfolgreich erstellt!',
            });
            router.replace('/teams');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.message || 'Team konnte nicht erstellt werden!'
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
                placeholder="Name"
                style={styles.input}
                editable={!loading}
            />
            <Pressable
                onPress={handleUpdate}
                disabled={loading}
                style={[
                    styles.updateButton,
                    loading && styles.disabledButton,
                ]}
            >
                <Text style={styles.updateText}>
                    {loading ? 'Aktualisierung...' : 'Team aktualisieren'}
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