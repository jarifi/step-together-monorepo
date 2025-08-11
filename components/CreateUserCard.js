import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function CreateUserCard({ onPress }) {
    return (
        <Pressable onPress={onPress} style={styles.card}>
            <View>
                <Text style={styles.createText}>+ Benutzer erstellen</Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        // mimic your UserCard styles exactly here
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: 'green',
    },
});