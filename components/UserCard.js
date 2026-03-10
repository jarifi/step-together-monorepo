import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from '../components/Avatar';

const BTN = 38;
const R = 12;

export default function UserCard({ user, onUpdate, onDelete, onVerify }) {
  const [modalVisible, setModalVisible] = useState(false);

  const name = user?.name ?? '—';
  const email = user?.email ?? '—';
  const userId = user?.id ?? '—';

  const isVerified = useMemo(() => {
    return Boolean(
      user?.is_verified ??
      user?.isVerified ??
      user?.verified ??
      false
    );
  }, [user]);

  const openDelete = () => setModalVisible(true);
  const closeDelete = () => setModalVisible(false);

  const confirmDelete = () => {
    closeDelete();
    onDelete?.();
  };

  return (
    <>
      <View style={styles.card}>
        <Avatar user={user} name={name} size={44} />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>

          <Text style={styles.email} numberOfLines={2}>
            {email}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>User ID: {userId}</Text>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                isVerified ? styles.verifiedBadge : styles.unverifiedBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isVerified ? styles.verifiedText : styles.unverifiedText,
                ]}
              >
                {isVerified ? 'Verifiziert' : 'Nicht verifiziert'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonStack}>
          {!isVerified && onVerify && (
            <Pressable
              onPress={() => onVerify?.(user)}
              style={({ pressed }) => [
                styles.iconButton,
                styles.verifyButton,
                pressed && styles.pressedBtn,
              ]}
              hitSlop={8}
            >
              <MaterialIcons name="verified-user" size={20} color="#fff" />
            </Pressable>
          )}

          {onUpdate && (
            <Pressable
              onPress={onUpdate}
              style={({ pressed }) => [
                styles.iconButton,
                styles.updateButton,
                (!isVerified && onVerify) ? styles.stackSpace : null,
                pressed && styles.pressedBtn,
              ]}
              hitSlop={8}
            >
              <MaterialIcons name="edit" size={20} color="#fff" />
            </Pressable>
          )}

          <Pressable
            onPress={openDelete}
            style={({ pressed }) => [
              styles.iconButton,
              styles.deleteButton,
              (onUpdate || (!isVerified && onVerify)) ? styles.stackSpace : null,
              pressed && styles.pressedBtn,
            ]}
            hitSlop={8}
          >
            <MaterialIcons name="delete" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={closeDelete}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Möchten Sie diesen Benutzer wirklich löschen?
            </Text>

            <Pressable
              style={({ pressed }) => [styles.modalDanger, pressed && styles.modalPressed]}
              onPress={confirmDelete}
            >
              <Text style={styles.modalDangerText}>Benutzer löschen</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modalCancel, pressed && styles.modalPressed]}
              onPress={closeDelete}
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
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15,20,17,0.08)',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    alignItems: 'center',
  },

  info: {
    flex: 1,
    paddingRight: 10,
    marginLeft: 12,
  },

  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101613',
    marginBottom: 4,
  },

  email: {
    fontSize: 13.5,
    color: '#4B5563',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  metaText: {
    fontSize: 13,
    color: '#4B5563',
  },

  statusRow: {
    marginTop: 10,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },

  verifiedBadge: {
    backgroundColor: 'rgba(47,107,69,0.10)',
    borderColor: 'rgba(47,107,69,0.20)',
  },

  unverifiedBadge: {
    backgroundColor: 'rgba(229,115,115,0.10)',
    borderColor: 'rgba(229,115,115,0.20)',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  verifiedText: {
    color: '#2F6B45',
  },

  unverifiedText: {
    color: '#C05757',
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

  verifyButton: {
    backgroundColor: '#2F6B45',
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
    fontWeight: '600',
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