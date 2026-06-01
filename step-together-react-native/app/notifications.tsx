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

type TabKey = 'invites' | 'upcoming';

const TEAM = '#1B7A42';
const IND = '#D4650A';
const BG = '#F2F5F3';
const CARD = '#FFFFFF';
const TEXT = '#111714';
const SUB = '#576058';
const MUTED = '#9AA49C';
const BORD = 'rgba(0,0,0,0.07)';

const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
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
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

function getCountdownInfo(dateStr: string, endDateStr?: string) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  if (isNaN(d.getTime())) return null;
  const days = Math.round((d.getTime() - now.getTime()) / 86400000);

  if (endDateStr) {
    const end = new Date(endDateStr);
    end.setHours(0, 0, 0, 0);
    if (!isNaN(end.getTime()) && end < now) {
      return { days, label: 'Beendet', pillBg: 'rgba(0,0,0,0.05)', pillColor: MUTED, icon: 'checkmark-done-outline' as const, isEnded: true };
    }
  }

  if (days < 0)  return { days, label: 'Läuft',          pillBg: 'rgba(27,122,66,0.10)',  pillColor: TEAM,      icon: 'play-circle-outline' as const,    isEnded: false };
  if (days === 0) return { days, label: 'Heute!',         pillBg: 'rgba(220,38,38,0.10)',  pillColor: '#DC2626', icon: 'flash' as const,                  isEnded: false };
  if (days === 1) return { days, label: 'Morgen',         pillBg: 'rgba(234,88,12,0.10)',  pillColor: '#EA580C', icon: 'time' as const,                   isEnded: false };
  if (days <= 6)  return { days, label: `${days} Tage`,   pillBg: 'rgba(202,138,4,0.10)',  pillColor: '#CA8A04', icon: 'time-outline' as const,           isEnded: false };
  if (days <= 30) return { days, label: `${days} Tage`,   pillBg: 'rgba(27,122,66,0.10)',  pillColor: TEAM,      icon: 'calendar-outline' as const,       isEnded: false };
  return           { days, label: `${days} Tage`,         pillBg: 'rgba(0,0,0,0.05)',      pillColor: SUB,       icon: 'calendar-outline' as const,       isEnded: false };
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
  const endDate = item.endDate ?? (item as any).end_date ?? '';
  const count = isInd ? item.participantCount : item.teamCount;
  const countLabel = isInd ? 'Teilnehmer' : (count === 1 ? 'Team' : 'Teams');
  const countIcon = isInd ? 'person' : 'group';
  const cd = getCountdownInfo(startDate, endDate);
  const isEnded = cd?.isEnded ?? false;

  return (
    <Pressable
      onPress={isPending ? undefined : onPress}
      style={({ pressed }) => [
        styles.notifCard,
        { borderLeftColor: isEnded ? MUTED : color, borderLeftWidth: 4 },
        isEnded && styles.notifCardEnded,
        !isPending && pressed && { opacity: 0.88 },
      ]}
    >
      {/* ── Header ── */}
      <View style={[styles.cardHeader, { backgroundColor: isEnded ? 'rgba(0,0,0,0.025)' : softBg }]}>
        <View style={[styles.modeBadge, { backgroundColor: isEnded ? MUTED : color }]}>
          <MaterialIcons name={isInd ? 'person' : 'group'} size={11} color="#fff" />
          <Text style={styles.modeBadgeTxt}>{modeLabel}</Text>
        </View>

        {isPending && (
          <View style={styles.pendingBadge}>
            <Ionicons name="notifications" size={11} color="#92400E" />
            <Text style={styles.pendingBadgeTxt}>Einladung</Text>
          </View>
        )}
        {isEnded && (
          <View style={styles.endedBadge}>
            <Ionicons name="checkmark-done" size={11} color={MUTED} />
            <Text style={styles.endedBadgeTxt}>Beendet</Text>
          </View>
        )}

        <Text style={[styles.distTxt, { color: isEnded ? MUTED : color }]}>{dist} km</Text>
      </View>

      {/* ── Body ── */}
      <View style={styles.cardBody}>
        {/* Route */}
        <View style={styles.routeRow}>
          <Ionicons name="location-outline" size={12} color={MUTED} />
          <Text style={styles.routeTxt} numberOfLines={1}>{item.startLocation ?? '—'}</Text>
          <Ionicons name="arrow-forward" size={11} color={MUTED} />
          <Text style={styles.routeTxt} numberOfLines={1}>{item.targetLocation ?? '—'}</Text>
        </View>

        {/* Challenge name */}
        <Text style={[styles.challengeName, isEnded && { color: MUTED }]} numberOfLines={2}>
          {item.name ?? '—'}
        </Text>

        {/* Date bar */}
        {cd && (
          <View style={[styles.dateBar, { borderColor: isEnded ? 'rgba(0,0,0,0.05)' : `${cd.pillColor}22` }]}>
            <View style={styles.dateBarLeft}>
              <View style={styles.dateItem}>
                <Text style={styles.dateMeta}>Start</Text>
                <Text style={[styles.dateVal, isEnded && { color: MUTED }]}>{fmtDate(startDate)}</Text>
              </View>
              {!!endDate && (
                <>
                  <View style={styles.dateBarSep}>
                    <View style={[styles.dateBarLine, { backgroundColor: isEnded ? BORD : `${cd.pillColor}33` }]} />
                    <Ionicons name="arrow-forward" size={9} color={MUTED} />
                    <View style={[styles.dateBarLine, { backgroundColor: isEnded ? BORD : `${cd.pillColor}33` }]} />
                  </View>
                  <View style={styles.dateItem}>
                    <Text style={styles.dateMeta}>Ende</Text>
                    <Text style={[styles.dateVal, isEnded && { color: MUTED }]}>{fmtDate(endDate)}</Text>
                  </View>
                </>
              )}
            </View>

            <View style={[styles.countdownChip, { backgroundColor: cd.pillBg }]}>
              <Ionicons name={cd.icon} size={12} color={cd.pillColor} />
              <Text style={[styles.countdownChipTxt, { color: cd.pillColor }]}>{cd.label}</Text>
            </View>
          </View>
        )}

        {/* Count */}
        {count != null && (
          <View style={styles.infoRow}>
            <MaterialIcons name={countIcon as any} size={13} color={isEnded ? MUTED : color} />
            <Text style={[styles.infoTxt, { color: isEnded ? MUTED : color, fontWeight: '600' }]}>
              {count} {countLabel}
            </Text>
          </View>
        )}

        {/* Inviter */}
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

      {/* ── Actions ── */}
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
  const [tab, setTab] = useState<TabKey>('invites');

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

  const pendingInvites = useMemo(() =>
    [...challenges.filter((c) => c.inviteStatus === 'pending')]
      .sort((a, b) => (Number(b.inviteId) || 0) - (Number(a.inviteId) || 0)),
    [challenges]
  );

  const monthSections = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const map: Record<string, NotifChallenge[]> = {};
    challenges.filter((c) => c.inviteStatus !== 'pending').forEach((c) => {
      let key = getMonthKey(getStartDate(c));
      if (!key || key < currentMonthKey) key = currentMonthKey;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });

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
        <View style={styles.pageAccent} />
        <Text style={styles.pageTitle}>Benachrichtigungen</Text>
        <Text style={styles.pageSub}>Challenges & Einladungen im Überblick</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabsWrap}>
        <View style={styles.tabsPill}>
          <Pressable
            onPress={() => setTab('invites')}
            style={[styles.tabBtn, tab === 'invites' && styles.tabBtnActive]}
          >
            <View style={styles.tabBtnInner}>
              <Text style={[styles.tabText, tab === 'invites' && styles.tabTextActive]}>
                Einladungen
              </Text>
              {pendingInvites.length > 0 && (
                <View style={[styles.tabBadge, tab === 'invites' && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeTxt, tab === 'invites' && styles.tabBadgeTxtActive]}>
                    {pendingInvites.length}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
          <Pressable
            onPress={() => setTab('upcoming')}
            style={[styles.tabBtn, tab === 'upcoming' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>
              Kalender
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Einladungen tab */}
      {tab === 'invites' && (
        <View>
          {pendingInvites.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="mail-open-outline" size={32} color={MUTED} />
              <Text style={styles.emptyTitle}>Keine Einladungen</Text>
              <Text style={styles.emptyText}>Du hast aktuell keine ausstehenden Einladungen.</Text>
            </View>
          ) : (
            pendingInvites.map((item) => (
              <ChallengeNotifCard
                key={String(item.id)}
                item={item}
                onAccept={() => handleAccept(item.id, item.inviteId)}
                onDecline={() => handleDecline(item.id, item.inviteId)}
                onPress={() => {}}
              />
            ))
          )}
        </View>
      )}

      {/* Kalender tab */}
      {tab === 'upcoming' && (
        <View>
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
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingTop: 64, paddingHorizontal: 16, paddingBottom: 100 },

  splash: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', gap: 12 },
  splashTxt: { fontSize: 14, color: SUB },

  pageHeader: { marginBottom: 24, alignItems: 'center' },
  pageAccent: { width: 36, height: 4, borderRadius: 4, backgroundColor: TEAM, marginBottom: 12 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: TEXT, marginBottom: 4, textAlign: 'center' },
  pageSub: { fontSize: 14, color: MUTED, textAlign: 'center' },

  // ── Tabs ──
  tabsWrap: { marginBottom: 20 },
  tabsPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORD,
    ...shadow,
  },
  tabBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabText: { fontSize: 13, fontWeight: '700', color: SUB },
  tabTextActive: { color: TEXT },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: { backgroundColor: TEAM },
  tabBadgeTxt: { fontSize: 11, fontWeight: '800', color: SUB },
  tabBadgeTxtActive: { color: '#fff' },

  // ── Month sections ──
  monthSection: { marginBottom: 28 },
  monthHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  monthLabel: { fontSize: 16, fontWeight: '800', color: TEXT, flexShrink: 0 },
  monthDivider: { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.09)', borderRadius: 1 },

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

  // ── Card ──
  notifCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORD,
    marginBottom: 12,
    ...shadow,
  },
  notifCardEnded: { opacity: 0.6 },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 7,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
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

  endedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  endedBadgeTxt: { fontSize: 11, fontWeight: '600', color: MUTED },

  distTxt: { marginLeft: 'auto' as any, fontSize: 13, fontWeight: '800' },

  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: BORD,
    gap: 8,
  },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  routeTxt: { fontSize: 12, color: MUTED, flexShrink: 1 },

  challengeName: { fontSize: 17, fontWeight: '800', color: TEXT, lineHeight: 22 },

  // Date bar
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.025)',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  dateBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateItem: { gap: 1 },
  dateMeta: { fontSize: 10, fontWeight: '600', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.4 },
  dateVal: { fontSize: 13, fontWeight: '700', color: TEXT },
  dateBarSep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateBarLine: { width: 10, height: 1 },

  countdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  countdownChipTxt: { fontSize: 12, fontWeight: '800' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  infoTxt: { fontSize: 13, color: SUB, flex: 1 },

  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  btnDecline: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: BORD,
  },
  btnDeclineTxt: { fontSize: 13, fontWeight: '700', color: SUB },
  btnAccept: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  btnAcceptTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Empty states
  emptyCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 32,
    borderWidth: 1,
    borderColor: BORD,
    alignItems: 'center',
    gap: 8,
    ...shadow,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: TEXT, marginTop: 6 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 19 },
});
