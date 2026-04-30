import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const TEAM_COLOR = '#55805c';
const IND_COLOR = '#D4650A';

const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 5 } },
  android: { elevation: 4 },
  default: {},
});

const fmt = (s) => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? '—' : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' });
};

const getStatus = (stateRaw) => {
  const state = (stateRaw ?? '').toLowerCase();
  if (state === 'open') return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', text: 'Aktiv' };
  if (state === 'incoming') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', text: 'Bevorstehend' };
  if (state === 'closed') return { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', text: 'Beendet' };
  return { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', text: 'Unbekannt' };
};

const ChallengeCard = ({
  challenge,
  onUpdate,
  onDelete,
  onPress,
  showActions = false,
  onAccept,
  onDecline,
  isPending,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const status = useMemo(() => getStatus(challenge?.state), [challenge?.state]);

  if (!challenge) return null;

  const isInd = challenge?.mode === 'individual';
  const color = isInd ? IND_COLOR : TEAM_COLOR;
  const softBg = isInd ? 'rgba(212,101,10,0.06)' : 'rgba(85,128,92,0.06)';

  return (
    <View style={styles.card}>

      {/* Colored top accent bar */}
      <View style={[styles.accentBar, { backgroundColor: color }]} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: softBg }]}>
        <View style={styles.headerTop}>
          <View style={[styles.modeBadge, { backgroundColor: color + '20', borderColor: color + '35' }]}>
            <MaterialIcons name={isInd ? 'person' : 'group'} size={12} color={color} />
            <Text style={[styles.modeBadgeText, { color }]}>{isInd ? 'Individuell' : 'Team'}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>
        <Text style={styles.name} numberOfLines={2}>{challenge.name}</Text>
      </View>

      {/* Info rows */}
      <View style={styles.infoBlock}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <MaterialIcons name="place" size={14} color={color} />
          </View>
          <Text style={styles.infoText} numberOfLines={1}>
            {challenge.startLocation || '—'}
            <Text style={styles.infoArrow}>  →  </Text>
            {challenge.targetLocation || '—'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <MaterialIcons name="event" size={14} color={color} />
          </View>
          <Text style={styles.infoText}>
            {fmt(challenge.startDate)} – {fmt(challenge.endDate)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <MaterialIcons name="straighten" size={14} color={color} />
          </View>
          <Text style={styles.infoText}>{challenge.distance ?? 0} km</Text>
        </View>
      </View>

      {/* Footer / Actions */}
      {(isPending || onPress || showActions) && (
        <View style={styles.footer}>
          {isPending ? (
            <>
              <Pressable onPress={onDecline} style={({ pressed }) => [styles.btnOutline, pressed && styles.pressed]}>
                <Text style={styles.btnOutlineText}>Ablehnen</Text>
              </Pressable>
              <Pressable onPress={onAccept} style={({ pressed }) => [styles.btnSolid, { backgroundColor: color }, pressed && styles.pressed]}>
                <Text style={styles.btnSolidText}>Annehmen</Text>
              </Pressable>
            </>
          ) : (
            <>
              {showActions && (
                <>
                  <Pressable onPress={onUpdate} hitSlop={8} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                    <MaterialIcons name="edit" size={18} color="#64748b" />
                  </Pressable>
                  <Pressable onPress={() => setModalVisible(true)} hitSlop={8} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                    <MaterialIcons name="delete-outline" size={18} color="#f87171" />
                  </Pressable>
                </>
              )}
              {onPress && (
                <Pressable onPress={() => onPress(challenge)} style={({ pressed }) => [styles.btnSolid, { backgroundColor: color, marginLeft: 'auto' }, pressed && styles.pressed]}>
                  <Text style={styles.btnSolidText}>Öffnen</Text>
                  <MaterialIcons name="arrow-forward" size={14} color="#fff" />
                </Pressable>
              )}
            </>
          )}
        </View>
      )}

      {/* Delete modal */}
      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalIconWrap}>
              <MaterialIcons name="delete-outline" size={26} color="#f87171" />
            </View>
            <Text style={styles.modalTitle}>Challenge löschen?</Text>
            <Text style={styles.modalSub}>Diese Aktion kann nicht rückgängig gemacht werden.</Text>
            <Pressable style={({ pressed }) => [styles.btnDanger, pressed && { opacity: 0.85 }]} onPress={() => { setModalVisible(false); onDelete?.(); }}>
              <Text style={styles.btnDangerText}>Löschen</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.btnOutline, { width: '100%', justifyContent: 'center' }, pressed && { opacity: 0.85 }]} onPress={() => setModalVisible(false)}>
              <Text style={styles.btnOutlineText}>Abbrechen</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
    ...shadow,
  },

  accentBar: {
    height: 4,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  modeBadgeText: { fontSize: 12, fontWeight: '700' },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },

  name: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 23,
    letterSpacing: 0.1,
  },

  infoBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
    fontWeight: '500',
  },
  infoArrow: {
    color: '#cbd5e1',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 11,
  },
  btnSolidText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
  },
  btnOutlineText: { color: '#64748b', fontWeight: '600', fontSize: 13 },

  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    width: '88%',
    alignItems: 'center',
    gap: 10,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(248,113,113,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  modalSub: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 4 },
  btnDanger: {
    backgroundColor: '#ef4444',
    paddingVertical: 13,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  btnDangerText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default ChallengeCard;
