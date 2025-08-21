import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const ChallengeCard = ({ challenge, onUpdate, onDelete }) => {
    const [modalVisible, setModalVisible] = useState(false);

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

            <View style={styles.info}>
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

            <View style={styles.buttonContainer}>
                <Pressable onPress={onUpdate} style={styles.updateButton}>
                    <MaterialIcons name='edit' size={20} color="#fff" />
                </Pressable>

                <Pressable onPress={() => setModalVisible(true)} style={styles.deleteButton}>
                    <MaterialIcons name='delete' size={20} color="#fff" />
                </Pressable>
            </View>

            <Modal
                animationType='fade'
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Möchten Sie diese Challenge wirklich löschen?</Text>

                        <Pressable style={styles.actionButton} onPress={() => { setModalVisible(false); onDelete?.(); }}>
                            <Text style={styles.actionText}>Challenge löschen</Text>
                        </Pressable>

                        <Pressable style={styles.cancelButton} onPress={() => { setModalVisible(false) }}>
                            <Text style={styles.cancelText}>Abbrechen</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View >
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
    deleteButton: {
        width: 40,
        height: 40,
        backgroundColor: '#444',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    deleteText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 15,
    },
    actionButton: {
        backgroundColor: 'red',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
        marginBottom: 10,
        width: '100%',
        alignItems: 'center',
    },
    actionText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#ccc',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
        width: '100%',
        alignItems: 'center',
    },
    cancelText: {
        fontWeight: 'bold',
        color: '#333',
    },
});

export default ChallengeCard;