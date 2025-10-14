import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
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
    const { user, setUser } = useUser();

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

        if (emailErrors.length > 0) {
            emailErrors.forEach((error, index) => {
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

        if (stepLengthErrors.length > 0) {
            stepLengthErrors.forEach((error, index) => {
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
            const updatedUser = await updateUser(Number(params.id), { name, email, stepLength });
            if (Number(params.id) === user.id) {
                setUser(updatedUser);
            }
            Toast.show({
                type: 'success',
                text1: 'Erfolg',
                text2: 'Benutzer erfolgreich aktualisiert!',
                position: 'top',
                topOffset: 100,
            });
            router.back();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.message || 'Benutzer konnte nicht aktualisiert werden',
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
                {/* Titel "Benutzer bearbeiten" über den Eingabefeldern */}
                <Text style={styles.title}>Benutzer bearbeiten</Text>
                
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