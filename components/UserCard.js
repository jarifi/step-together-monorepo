import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from '../components/Avatar';

export default function UserCard({ user, onUpdate, onDelete }) {
  const [modalVisible, setModalVisible] = useState(false);

  const name = user?.name ?? '—';
  const email = user?.email ?? '—';

  const openDelete = () => setModalVisible(true);
  const closeDelete = () => setModalVisible(false);

  const confirmDelete = () => {
    closeDelete();
    onDelete?.();
  };

  return (
    <View style={styles.card}>
      <Avatar user={user} name={name} size={44} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {email}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {onUpdate ? (
          <Pressable onPress={onUpdate} style={styles.iconButtonGreen} android_ripple={{ borderless: true }}>
            <MaterialIcons name="edit" size={20} color="#fff" />
          </Pressable>
        ) : null}

        <Pressable onPress={openDelete} style={styles.iconButtonDark} android_ripple={{ borderless: true }}>
          <MaterialIcons name="delete" size={20} color="#fff" />
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={closeDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Möchten Sie diesen Benutzer wirklich löschen?
            </Text>

            <Pressable style={styles.actionButton} onPress={confirmDelete}>
              <Text style={styles.actionText}>Benutzer löschen</Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={closeDelete}>
              <Text style={styles.cancelText}>Abbrechen</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
  },
  name: {
    fontWeight: '800',
    color: '#111827',
  },
  email: {
    color: '#6B7280',
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  iconButtonGreen: {
    width: 40,
    height: 40,
    backgroundColor: '#6B8F71',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconButtonDark: {
    width: 40,
    height: 40,
    backgroundColor: '#444',
    borderRadius: 10,
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
    borderRadius: 12,
    padding: 20,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 14,
    textAlign: 'center',
    color: '#111827',
  },
  actionButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: '800',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: '800',
    color: '#111827',
  },
});
