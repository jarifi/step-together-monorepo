import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const BTN = 38;
const R = 12;

const ChallengeCard = ({
  challenge,
  onUpdate,
  onDelete,
  onPress,
  showActions = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Kein Datum';
    try {
      const date = new Date(dateString);
      if (!isNaN(date)) {
        return date.toLocaleString('de-DE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch (_e) {
      return 'Ungültiges Datum';
    }
    return 'Ungültiges Datum';
  };

  const getStatus = (stateRaw) => {
    const state = (stateRaw ?? '').toLowerCase();
    if (state === 'open') return { icon: 'lock-open', color: '#2E7D32', text: 'Offen' };
    if (state === 'incoming') return { icon: 'schedule', color: '#EF6C00', text: 'Bevorstehend' };
    if (state === 'closed') return { icon: 'lock', color: '#C62828', text: 'Abgeschlossen' };
    return { icon: 'help-outline', color: '#6B7280', text: 'Unbekannt' };
  };

  const status = useMemo(() => getStatus(challenge?.state), [challenge?.state]);

  if (!challenge) return null;

  return (
    <View style={styles.card}>
      {/* LEFT */}
      <View style={styles.info}>
        {/* Title can wrap (2 lines) */}
        <Text style={styles.title} numberOfLines={2}>
          {challenge.name}
        </Text>

        <View style={styles.metaRow}>
          <MaterialIcons name="place" size={16} color="#6B7280" />
          <Text style={styles.metaText} numberOfLines={2}>
            {challenge.startLocation || 'Start'} → {challenge.targetLocation || 'Ziel'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <MaterialIcons name="straighten" size={16} color="#6B7280" />
          <Text style={styles.metaText}>{challenge.distance || 0} km</Text>
        </View>

        <View style={styles.metaRow}>
          <MaterialIcons name="event" size={16} color="#6B7280" />
          <Text style={styles.metaText} numberOfLines={2}>
            {formatDateTime(challenge.startDate)} – {formatDateTime(challenge.endDate)}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { borderColor: `${status.color}33`, backgroundColor: `${status.color}14` }]}>
            <MaterialIcons name={status.icon} size={16} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonStack}>
        {onPress && (
          <Pressable
            onPress={() => onPress(challenge)}
            style={({ pressed }) => [styles.iconButton, styles.infoButton, pressed && styles.pressed]}
            hitSlop={8}
          >
            <MaterialIcons name="info-outline" size={20} color="#fff" />
          </Pressable>
        )}

        {showActions && (
          <>
            <Pressable
              onPress={onUpdate}
              style={({ pressed }) => [styles.iconButton, styles.updateButton, styles.stackSpace, pressed && styles.pressed]}
              hitSlop={8}
            >
              <MaterialIcons name="edit" size={20} color="#fff" />
            </Pressable>

            <Pressable
              onPress={() => setModalVisible(true)}
              style={({ pressed }) => [styles.iconButton, styles.deleteButton, styles.stackSpace, pressed && styles.pressed]}
              hitSlop={8}
            >
              <MaterialIcons name="delete" size={20} color="#fff" />
            </Pressable>
          </>
        )}
      </View>

      {/* DELETE MODAL */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Möchten Sie diese Challenge wirklich löschen?</Text>

            <Pressable
              style={({ pressed }) => [styles.modalDanger, pressed && styles.modalPressed]}
              onPress={() => {
                setModalVisible(false);
                if (onDelete) onDelete();
              }}
            >
              <Text style={styles.modalDangerText}>Challenge löschen</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modalCancel, pressed && styles.modalPressed]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Abbrechen</Text>
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
    padding: 14,
    backgroundColor: '#fff',
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15,20,17,0.08)',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    alignItems: 'flex-start',
  },

  info: {
    flex: 1,
    paddingRight: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101613',
    marginBottom: 8,
    lineHeight: 22,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },

  metaText: {
    fontSize: 13.5,
    color: '#4B5563',
    flex: 1,
    marginLeft: 6,
    lineHeight: 18,
  },

  statusRow: {
    marginTop: 8,
  },

  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },

  statusText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },

  buttonStack: {
    alignItems: 'center',
    paddingLeft: 8,
    paddingTop: 2,
  },

  stackSpace: {
    marginTop: 8,
  },

  iconButton: {
    width: BTN,
    height: BTN,
    borderRadius: R,
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoButton: {
    backgroundColor: '#6FAF78',
  },

  updateButton: {
    backgroundColor: '#5B8EDB', 
  },

  deleteButton: {
    backgroundColor: '#E57373', 
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    width: '88%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,20,17,0.08)',
  },

  modalTitle: {
    fontWeight: '500',
    fontSize: 16,
    marginBottom: 14,
    textAlign: 'center',
    color: '#111827',
  },

  modalDanger: {
    backgroundColor: '#E53935',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },

  modalDangerText: {
    color: '#fff',
    fontWeight: '600',
  },

  modalCancel: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },

  modalCancelText: {
    fontWeight: '600',
    color: '#111827',
  },

  modalPressed: {
    opacity: 0.9,
  },
});

export default ChallengeCard;
