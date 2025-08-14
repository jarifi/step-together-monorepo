import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Toast, { ErrorToast } from "react-native-toast-message";
import { useUser } from "../../context/UserContext";
import { validateEmail, validateName, validateStepLength } from "../../lib/userValidation";
import { updateUser } from "../../services/userService";

export default function UpdateUserScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [stepLength, setStepLength] = useState('');
    const [loading, setLoading] = useState(false);
    const { setUser } = useUser();

    // Toast animations
    const visibilityTime = 2000;
    const animationTime = 400;
    const totalToastTime = visibilityTime + animationTime;

    useEffect(() => {
        if (params) {
            setName(params.name || '');
            setEmail(params.email || '');
            setStepLength(params.stepLength || '');
        }
    }, []);

    const handleUpdate = async () => {
        const emailErrors = validateEmail(email);
        const nameErrors = validateName(name);
        const stepLengthErrors = validateStepLength(stepLength);

        if (!email || !name || !stepLength) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Alle Felder sind Pflichtfelder!',
            });
            return;
        }

        if (emailErrors.length > 0) {
            emailErrors.forEach((error, index) => {
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

        if (stepLengthErrors.length > 0) {
            stepLengthErrors.forEach((error, index) => {
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
            const updatedUser = await updateUser(Number(params.id), { name, email, stepLength });
            setUser(updatedUser);
            Toast.show({
                type: 'success',
                text1: 'Erfolg',
                text2: 'Benutzer erfolgreich aktualisiert!'
            });
            router.back();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: ErrorToast.message || 'Benutzer konnte nicht aktualisiert werden'
            })
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
                placeholder="Vor- und Nachname"
                style={styles.input}
                editable={!loading}
            />
            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="E-Mail"
                style={styles.input}
                editable={!loading}
            />
            <TextInput
                value={stepLength}
                onChangeText={setStepLength}
                placeholder="Schrittlänge"
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