import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const ChallengeCard = ({
  challenge,
  onUpdate,
  onDelete,
  onPress,
  showActions = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Safety: wenn keine Challenge -> nichts rendern
  if (!challenge) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Kein Datum';
    try {
      const date = new Date(dateString);
      if (date instanceof Date && !isNaN(date)) {
        return date.toLocaleDateString('de-DE');
      }
    } catch (e) {
      return 'Ungültiges Datum';
    }
    return 'Ungültiges Datum';
  };

  // ✅ Status-Icon-Logik inkl. closed
  const getStatusIcon = (stateRaw) => {
    const state = (stateRaw ?? '').toLowerCase();

    if (state === 'open') {
      return { name: 'lock-open', color: '#4CAF50', text: 'Offen' };
    }
    if (state === 'incoming') {
      return { name: 'schedule', color: '#FF9800', text: 'Bevorstehend' };
    }
    if (state === 'closed') {
      return { name: 'lock', color: '#F44336', text: 'Abgeschlossen' };
    }
    return { name: 'help-outline', color: '#999', text: 'Unbekannt' };
  };

  const status = getStatusIcon(challenge?.state);

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.info}
        onPress={() => {
          if (onPress) onPress(challenge);
        }}
      >
        <Text style={styles.title}>{challenge.name}</Text>

        <Text style={styles.details}>
          {challenge.startLocation || 'Start'} →{' '}
          {challenge.targetLocation || 'Ziel'}
        </Text>

        <Text style={styles.details}>{challenge.distance || 0} km</Text>

        <Text style={styles.details}>
          {formatDate(challenge.startDate)} – {formatDate(challenge.endDate)}
        </Text>

        {/* Status mit Icon */}
        <View style={styles.statusRow}>
          <MaterialIcons
            name={status.name}
            size={18}
            color={status.color}
          />
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.text}
          </Text>
        </View>
      </Pressable>

      {/* Edit / Delete nur, wenn showActions = true */}
      {showActions && (
        <View style={styles.buttonContainer}>
          <Pressable onPress={onUpdate} style={styles.updateButton}>
            <MaterialIcons name="edit" size={20} color="#fff" />
          </Pressable>

          <Pressable
            onPress={() => setModalVisible(true)}
            style={styles.deleteButton}
          >
            <MaterialIcons name="delete" size={20} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Delete-Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Möchten Sie diese Challenge wirklich löschen?
            </Text>

            <Pressable
              style={styles.actionButton}
              onPress={() => {
                setModalVisible(false);
                if (onDelete) onDelete();
              }}
            >
              <Text style={styles.actionText}>Challenge löschen</Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Abbrechen</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  info: {
    flexShrink: 1,
    flex: 1,
    marginRight: 8,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
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
    textAlign: 'center',
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
