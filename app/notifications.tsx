import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useUser } from '../context/UserContext';
import {
  acceptChallengeInvite,
  declineChallengeInvite,
  getChallengeById,
  getChallengeParticipants,
  getChallengeTeams,
  getMyActiveChallenges,
  getMyInvites,
} from '../services/challengeService';

const TEAM = '#1B7A42';
const IND = '#D4650A';
const BG = '#F2F5F3';
const CARD = '#FFFFFF';
const TEXT = '#111714';
const SUB = '#576058';
const MUTED = '#9AA49C';
const BORD = 'rgba(0,0,0,0.07)';

const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  android: { elevation: 3 },
  default: {},
});

const asArray = (x: any): any[] => {
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.content)) return x.content;
  if (Array.isArray(x?.data)) return x.data;
  if (Array.isArray(x?.items)) return x.items;
  return [];
};

function resolveMode(item: any) {
  const raw = String(item?.mode ?? item?.challenge_mode ?? item?.type ?? '').toLowerCase().trim();
  if (['individual', 'individuell', 'solo'].includes(raw)) return 'individual';
  if (raw === 'team') return 'team';
  if (item?.inviteStatus === 'accepted' || item?.inviteStatus === 'pending') return 'individual';
  if (item?.teamCount > 0 || (Array.isArray(item?.teamIds) && item.teamIds.length > 0)) return 'team';
  return 'team';
}

function getStartDate(item: any): string {
  return item?.startDate ?? item?.start_date ?? '';
}

function fmtDate(s: string) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
}

function startsInLabel(dateStr: string) {
  if (!dateStr) return '';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (days < 0) return 'Bereits gestartet';
  if (days === 0) return 'Beginnt heute';
  if (days === 1) return 'Beginnt morgen';
  return `Beginnt in ${days} Tagen (${fmtDate(dateStr)})`;
}

function getMonthKey(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key: string) {
  const [year, month] = key.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('de-DE', {
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

interface NotifChallenge {
  id: any;
  name: string;
  distance: number;
  startDate: string;
  start_date?: string;
  endDate?: string;
  startLocation: string;
  targetLocation: string;
  inviteStatus: string | null;
  inviteId: any;
  inviterName?: string;
  teamCount: number;
  teamIds: number[];
  participantCount?: number;
  mode?: string;
  state?: string;
}

function ChallengeNotifCard({
  item,
  onAccept,
  onDecline,
  onPress,
}: {
  item: NotifChallenge;
  onAccept: () => void;
  onDecline: () => void;
  onPress: () => void;
}) {
  const mode = resolveMode(item);
  const isInd = mode === 'individual';
  const isPending = item.inviteStatus === 'pending';
  const color = isInd ? IND : TEAM;
  const softBg = isInd ? 'rgba(212,101,10,0.06)' : 'rgba(27,122,66,0.06)';
  const modeLabel = isInd ? 'Individuell' : 'Team';
  const dist = item?.distance ?? 0;
  const startDate = getStartDate(item);
  const count = isInd ? item.participantCount : item.teamCount;
  const countLabel = isInd ? 'Teilnehmer' : (count === 1 ? 'Team' : 'Teams');
  const countIcon = isInd ? 'person' : 'group';

  return (
    <Pressable
      onPress={isPending ? undefined : onPress}
      style={({ pressed }) => [styles.notifCard, { borderLeftColor: color, borderLeftWidth: 4 }, !isPending && pressed && { opacity: 0.88 }]}
    >
      <View style={[styles.notifCardHeader, { backgroundColor: softBg }]}>
        <View style={[styles.modeBadge, { backgroundColor: color }]}>
          <MaterialIcons name={isInd ? 'person' : 'group'} size={11} color="#fff" />
          <Text style={styles.modeBadgeTxt}>{modeLabel}</Text>
        </View>
        {isPending && (
          <View style={styles.pendingBadge}>
            <Ionicons name="notifications" size={11} color="#92400E" />
            <Text style={styles.pendingBadgeTxt}>Einladung ausstehend</Text>
          </View>
        )}
        <Text style={[styles.distTxt, { color }]}>{dist} km</Text>
      </View>

      <View style={styles.notifCardBody}>
        <Text style={styles.challengeName} numberOfLines={2}>{item.name ?? '—'}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="map-outline" size={13} color={MUTED} />
          <Text style={styles.infoTxt} numberOfLines={1}>
            {item.startLocation ?? '—'} → {item.targetLocation ?? '—'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={13} color={MUTED} />
          <Text style={[styles.infoTxt, { fontWeight: '600', color: SUB }]}>
            {startsInLabel(startDate)}
          </Text>
        </View>

        {count != null && (
          <View style={styles.infoRow}>
            <MaterialIcons name={countIcon as any} size={13} color={color} />
            <Text style={[styles.infoTxt, { color, fontWeight: '600' }]}>{count} {countLabel}</Text>
          </View>
        )}

        {isPending && item.inviterName && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={13} color={MUTED} />
            <Text style={styles.infoTxt}>
              Eingeladen von{' '}
              <Text style={{ fontWeight: '700', color: TEXT }}>{item.inviterName}</Text>
            </Text>
          </View>
        )}
      </View>

      {isPending && (
        <View style={styles.actionRow}>
          <Pressable
            onPress={onDecline}
            style={({ pressed }) => [styles.btnDecline, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.btnDeclineTxt}>Ablehnen</Text>
          </Pressable>
          <Pressable
            onPress={onAccept}
            style={({ pressed }) => [styles.btnAccept, { backgroundColor: color }, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="checkmark" size={14} color="#fff" />
            <Text style={styles.btnAcceptTxt}>Annehmen</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { setPendingInviteCount } = useUser();

  const router = useRouter();
  const [challenges, setChallenges] = useState<NotifChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [rawActive, rawInvites] = await Promise.all([
        getMyActiveChallenges(),
        getMyInvites(),
      ]);

      const activeList = asArray(rawActive);
      const invites = asArray(rawInvites);
      const activeIds = new Set(activeList.map((c: any) => Number(c.id)));

      // Include pending AND accepted invites for challenges not yet in the active list
      // (e.g. accepted challenge with future start date that isn't "active" yet)
      const unlistedInvites = invites.filter(
        (i: any) =>
          (i.status === 'pending' || i.status === 'accepted') &&
          !activeIds.has(Number(i.challengeId ?? i.challenge_id))
      );

      const fetchedChallenges = await Promise.all(
        unlistedInvites.map(async (i: any) => {
          try {
            return await getChallengeById(i.challengeId ?? i.challenge_id);
          } catch {
            return null;
          }
        })
      );

      const allChallenges = [...activeList, ...fetchedChallenges.filter(Boolean)];

      const enriched: NotifChallenge[] = await Promise.all(
        allChallenges.map(async (ch: any) => {
          const inv = invites.find(
            (i: any) => Number(i.challengeId ?? i.challenge_id) === Number(ch.id)
          );
          const base = {
            inviteStatus: inv?.status ?? ch.inviteStatus ?? null,
            inviteId: inv?.id ?? null,
            inviterName: inv?.inviterName ?? inv?.inviter_name ?? inv?.inviter?.name ?? undefined,
          };
          const mode = resolveMode(ch);
          try {
            if (mode === 'individual') {
              const participants = asArray(await getChallengeParticipants(ch.id));
              return { ...ch, ...base, participantCount: participants.length, teamCount: 0, teamIds: [] };
            } else {
              const teams = asArray(await getChallengeTeams(ch.id));
              const teamIds = teams.map((t: any) => Number(t.id ?? t.teamId ?? t.team_id ?? 0)).filter(Boolean);
              return { ...ch, ...base, teamCount: teamIds.length, teamIds };
            }
          } catch {
            return { ...ch, ...base, teamCount: 0, teamIds: [], participantCount: 0 };
          }
        })
      );

      const filtered = enriched.filter((c) => c.inviteStatus !== 'declined');
      setChallenges(filtered);

      // Keep sidebar badge in sync
      const pendingCount = invites.filter((i: any) => i.status === 'pending').length;
      setPendingInviteCount(pendingCount);
    } catch (e) {
      console.error('Benachrichtigungen laden fehlgeschlagen:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setPendingInviteCount]);

  const handleAccept = async (challengeId: any, inviteId: any) => {
    try {
      await acceptChallengeInvite(challengeId, inviteId);
      loadData(true);
    } catch (e) {
      console.error('Annehmen fehlgeschlagen:', e);
    }
  };

  const handleDecline = async (challengeId: any, inviteId: any) => {
    try {
      await declineChallengeInvite(challengeId, inviteId);
      loadData(true);
    } catch (e) {
      console.error('Ablehnen fehlgeschlagen:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const monthSections = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Build month→challenges map; pin already-started challenges to current month
    const map: Record<string, NotifChallenge[]> = {};
    challenges.forEach((c) => {
      let key = getMonthKey(getStartDate(c));
      if (!key || key < currentMonthKey) key = currentMonthKey;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });

    // Always show at least the next 3 months
    const monthKeySet = new Set<string>(Object.keys(map));
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      monthKeySet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    return [...monthKeySet]
      .sort()
      .map((key) => ({ key, label: getMonthLabel(key), challenges: map[key] ?? [] }));
  }, [challenges]);

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={TEAM} />
        <Text style={styles.splashTxt}>Lade Benachrichtigungen…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadData(true); }}
          tintColor={TEAM}
        />
      }
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Benachrichtigungen</Text>
        <Text style={styles.pageSub}>Kommende Challenges & Einladungen</Text>
      </View>

      {monthSections.map(({ key, label, challenges: sectionChallenges }) => (
        <View key={key} style={styles.monthSection}>
          <View style={styles.monthHeaderRow}>
            <Text style={styles.monthLabel}>{label}</Text>
            <View style={styles.monthDivider} />
          </View>

          {sectionChallenges.length === 0 ? (
            <View style={styles.emptyMonth}>
              <Ionicons name="calendar-outline" size={15} color={MUTED} />
              <Text style={styles.emptyMonthTxt}>Keine Challenge geplant</Text>
            </View>
          ) : (
            sectionChallenges.map((item) => (
              <ChallengeNotifCard
                key={String(item.id)}
                item={item}
                onAccept={() => handleAccept(item.id, item.inviteId)}
                onDecline={() => handleDecline(item.id, item.inviteId)}
                onPress={() => router.push({
                  pathname: '/challenges/details',
                  params: { id: String(item.id) },
                })}
              />
            ))
          )}
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingTop: 68, paddingHorizontal: 16 },

  splash: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', gap: 12 },
  splashTxt: { fontSize: 14, color: SUB },

  pageHeader: { marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: TEXT, marginBottom: 4 },
  pageSub: { fontSize: 14, color: MUTED },

  monthSection: { marginBottom: 28 },
  monthHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  monthLabel: { fontSize: 17, fontWeight: '800', color: TEXT, flexShrink: 0 },
  monthDivider: { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 1 },

  emptyMonth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORD,
    borderStyle: 'dashed',
  },
  emptyMonthTxt: { fontSize: 13, color: MUTED, fontStyle: 'italic' },

  notifCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORD,
    marginBottom: 12,
    ...shadow,
  },
  notifCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  modeBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234,179,8,0.13)',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(234,179,8,0.25)',
  },
  pendingBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  distTxt: { marginLeft: 'auto' as any, fontSize: 13, fontWeight: '800' },

  notifCardBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: BORD,
    gap: 7,
  },
  challengeName: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  infoTxt: { fontSize: 13, color: SUB, flex: 1 },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  btnDecline: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: BORD,
  },
  btnDeclineTxt: { fontSize: 13, fontWeight: '700', color: SUB },
  btnAccept: {
    flex: 2,
    paddingVertical: 9,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  btnAcceptTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
