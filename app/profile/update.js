import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useUser } from "../../context/UserContext";
import { updateUser } from "../../services/userService";

export default function ProfileUpdateScreen() {
    const { user, setUser, userId } = useUser();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const updatedUser = await updateUser(userId, { name, email });

            setUser(updatedUser);

            Alert.alert('Success', 'Benutzer erfolgreich aktualisiert!');
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Benutzer konnte nicht aktualisiert werden');
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
            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
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
                    {loading ? 'Aktualisierung...' : 'Benutzer aktualisieren'}
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