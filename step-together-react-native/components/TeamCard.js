import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const BTN = 38;
const R = 12;

export default function TeamCard({ team, onPress, onUpdate, onDelete }) {
  const [modalVisible, setModalVisible] = useState(false);

  if (!team) return null;

  return (
    <>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressedCard]}
      >
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {team.name}
          </Text>

          {!!team.description && (
            <View style={styles.metaRow}>
              <MaterialIcons name="notes" size={16} color="#6B7280" />
              <Text style={styles.metaText} numberOfLines={2}>
                {team.description}
              </Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Team-ID: {team.id}</Text>
          </View>
        </View>

        <View style={styles.buttonStack}>
          {onUpdate && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onUpdate();
              }}
              style={({ pressed }) => [styles.iconButton, styles.updateButton, pressed && styles.pressedBtn]}
              hitSlop={8}
            >
              <MaterialIcons name="edit" size={20} color="#fff" />
            </Pressable>
          )}

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              setModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.iconButton,
              styles.deleteButton,
              onUpdate ? styles.stackSpace : null,
              pressed && styles.pressedBtn,
            ]}
            hitSlop={8}
          >
            <MaterialIcons name="delete" size={20} color="#fff" />
          </Pressable>
        </View>
      </Pressable>

      {/* DELETE MODAL */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Möchten Sie dieses Team wirklich löschen?</Text>

            <Pressable
              style={({ pressed }) => [styles.modalDanger, pressed && styles.modalPressed]}
              onPress={() => {
                setModalVisible(false);
                onDelete?.();
              }}
            >
              <Text style={styles.modalDangerText}>Team löschen</Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
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

  pressedCard: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },

  info: {
    flex: 1,
    paddingRight: 10,
  },

  name: {
    fontSize: 18,
    fontWeight: '700',
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

  updateButton: {
    backgroundColor: '#5B8EDB', 
  },

  deleteButton: {
    backgroundColor: '#E57373', 
  },

  pressedBtn: {
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
