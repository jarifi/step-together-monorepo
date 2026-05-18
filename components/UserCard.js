import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from '../components/Avatar';

export default function UserCard({ user, onUpdate, onDelete, onVerify, onUnlock }) {
  const [modalVisible, setModalVisible] = useState(false);

  const name = user?.name ?? '—';
  const email = user?.email ?? '—';
  const userId = user?.id ?? '—';

  const isVerified = useMemo(() => Boolean(
    user?.isVerified ?? user?.is_verified ?? user?.verified ?? false
  ), [user]);

  const isLocked = useMemo(() => {
    const attempts = user?.failedLoginAttempts ?? user?.failed_login_attempts ?? 0;
    return attempts >= 3;
  }, [user]);

  const confirmDelete = () => {
    setModalVisible(false);
    onDelete?.();
  };

  return (
    <>
      <View style={[styles.card, isLocked && styles.cardLocked]}>

        {isLocked && (
          <View style={styles.lockedBanner}>
            <MaterialIcons name="lock" size={13} color="#92400E" />
            <Text style={styles.lockedBannerText}>Konto gesperrt</Text>
          </View>
        )}

        <View style={styles.header}>
          <Avatar user={user} name={name} size={50} />

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.email} numberOfLines={1}>{email}</Text>
            <Text style={styles.userId}>ID #{userId}</Text>
          </View>

          <View style={[styles.badge, isVerified ? styles.badgeVerified : styles.badgeUnverified]}>
            <MaterialIcons
              name={isVerified ? 'verified-user' : 'person-outline'}
              size={12}
              color={isVerified ? '#166534' : '#9B1C1C'}
            />
            <Text style={[styles.badgeText, isVerified ? styles.badgeTextVerified : styles.badgeTextUnverified]}>
              {isVerified ? 'Verifiziert' : 'Ausstehend'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.actions}>
          {isLocked && onUnlock && (
            <ActionButton
              icon="lock-open"
              label="Entsperren"
              color="#D97706"
              bg="rgba(217,119,6,0.10)"
              onPress={() => onUnlock(user)}
            />
          )}

          {!isVerified && onVerify && (
            <ActionButton
              icon="verified-user"
              label="Verifizieren"
              color="#166534"
              bg="rgba(22,101,52,0.09)"
              onPress={() => onVerify(user)}
            />
          )}

          {onUpdate && (
            <ActionButton
              icon="edit"
              label="Bearbeiten"
              color="#1D4ED8"
              bg="rgba(29,78,216,0.09)"
              onPress={onUpdate}
            />
          )}

          <ActionButton
            icon="delete-outline"
            label="Löschen"
            color="#B91C1C"
            bg="rgba(185,28,28,0.09)"
            onPress={() => setModalVisible(true)}
          />
        </View>
      </View>

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalIcon}>
              <MaterialIcons name="delete-forever" size={32} color="#B91C1C" />
            </View>
            <Text style={styles.modalTitle}>Benutzer löschen?</Text>
            <Text style={styles.modalSub}>
              <Text style={{ fontWeight: '700' }}>{name}</Text> wird unwiderruflich gelöscht.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.btnDanger, pressed && styles.btnPressed]}
              onPress={confirmDelete}
            >
              <Text style={styles.btnDangerText}>Ja, löschen</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.btnCancel, pressed && styles.btnPressed]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.btnCancelText}>Abbrechen</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function ActionButton({ icon, label, color, bg, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionBtn, { backgroundColor: bg }, pressed && styles.actionBtnPressed]}
      hitSlop={4}
    >
      <MaterialIcons name={icon} size={17} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15,20,17,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    overflow: 'hidden',
  },

  cardLocked: {
    borderColor: 'rgba(217,119,6,0.35)',
  },

  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(217,119,6,0.10)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217,119,6,0.15)',
  },

  lockedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.2,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F1411',
    marginBottom: 2,
  },

  email: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 4,
  },

  userId: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },

  badgeVerified: {
    backgroundColor: 'rgba(22,101,52,0.08)',
    borderColor: 'rgba(22,101,52,0.20)',
  },

  badgeUnverified: {
    backgroundColor: 'rgba(155,28,28,0.08)',
    borderColor: 'rgba(155,28,28,0.18)',
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  badgeTextVerified: {
    color: '#166534',
  },

  badgeTextUnverified: {
    color: '#9B1C1C',
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(15,20,17,0.06)',
    marginHorizontal: 16,
  },

  actions: {
    flexDirection: 'row',
    padding: 10,
    gap: 6,
    flexWrap: 'wrap',
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
  },

  actionBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },

  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: 'rgba(185,28,28,0.09)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F1411',
    marginBottom: 6,
  },

  modalSub: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 20,
  },

  btnDanger: {
    backgroundColor: '#B91C1C',
    paddingVertical: 13,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },

  btnDangerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  btnCancel: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 13,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },

  btnCancelText: {
    fontWeight: '700',
    color: '#374151',
    fontSize: 15,
  },

  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
