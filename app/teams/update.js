import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { updateTeam } from "../../services/teamService";
import { useTeam } from "../../context/TeamContext";

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
        setLoading(true);
        try {
            const updatedTeam = await updateTeam(Number(params.id), { name });

            setTeam(updatedTeam);

            Alert.alert('Success', 'Team erfolgreich aktualisiert!');
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Team konnte nicht aktualisiert werden');
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
        backgroundColor: 'green',
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