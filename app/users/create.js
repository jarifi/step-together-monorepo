import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Toast from 'react-native-toast-message';
import { validateEmail, validatePassword } from "../../lib/userValidation";
import { createUser } from "../../services/userService";

export default function CreateUserScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [stepLength, setStepLength] = useState('');
    const [loading, setLoading] = useState(false);

    //Toast aniamtions 
    const visibilityTime = 2000;
    const animationTime = 400;
    const totalToastTime = visibilityTime + animationTime;

    const handleCreate = async () => {
        const emailErrors = validateEmail(email);
        
        if (emailErrors.length > 0) {
            emailErrors.forEach((error, index) => {
                setTimeout(() => {
                    Toast.show({
                        type: 'error',
                        text1: error,
                        position: 'top',
                        visibilityTime: 2000,
                    });
                }, index * 2500);
            });
            return;
        }

        if (!email || !password || !passwordConfirm || !name || !stepLength) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'All fields are required',
            });
            return;
        }

        if (password !== passwordConfirm) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Passwords do not match',
            });
            return;
        }

        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            passwordErrors.forEach((error, index) => {
                setTimeout(() => {
                    Toast.show({
                        type: 'error',
                        text1: error,
                        position: 'top',
                        visibilityTime,
                    });
                }, index * totalToastTime);
            });
            return;
        }

        setLoading(true);
        try {
            await createUser({ email, password, passwordConfirm, name, stepLength: parseFloat(stepLength) });
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'User created succesfully',
            });
            router.replace('/users');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: ErrorToast.message || 'Could not create user',
            });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="E-Mail"
                style={styles.input}
                keyboardType="email-address"
                editable={!loading}
            />
            <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Passwort"
                style={styles.input}
                secureTextEntry
                editable={!loading}
            />
            <TextInput
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                placeholder="Passwort bestätigen"
                style={styles.input}
                secureTextEntry
                editable={!loading}
            />
            <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Name"
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
                onPress={handleCreate}
                disabled={loading}
                style={[
                    styles.createButton,
                    loading && styles.disabledButton,
                ]}
            >
                <Text style={styles.createText}>
                    {loading ? 'Erstellen...' : 'Benutzer erstellen'}
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
        backgroundColor: 'green',
        borderRadius: 6,
        alignItems: 'center',
    },
    createText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#aaa',
    },
});