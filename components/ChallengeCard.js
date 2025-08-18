import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const ChallengeCard = ({ challenge, onUpdate }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'No Date';
        try {
            const date = new Date(dateString);
            if (date instanceof Date && !isNaN(date)) {
                return date.toLocaleDateString();
            }
        } catch (e) {
            return 'Invalid Date';
        }
        return 'Invalid Date';
    };

    return (
        <View style={styles.card}>
            <View>
                <Text style={styles.title}>{challenge.name}</Text>
                <Text style={styles.details}>
                    {challenge.startLocation || 'Start Location'} to {challenge.targetLocation || 'Target Location'}
                </Text>
                <Text style={styles.details}>{challenge.distance || 0} km</Text>
                <Text style={styles.details}>
                    {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
                </Text>
                <Text style={styles.details}>Status: {challenge.state || 'N/A'}</Text>
            </View>
            <Pressable onPress={onUpdate} style={styles.updateButton}>
                <Text style={styles.buttonText}>✎</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        marginBottom: 12,
        borderRadius: 8,
        elevation: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    details: {
        fontSize: 14,
        color: '#555',
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    updateButton: {
        width: 40,
        height: 40,
        backgroundColor: '#6B8F71',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ChallengeCard;