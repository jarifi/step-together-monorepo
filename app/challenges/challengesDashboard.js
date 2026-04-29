import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  acceptChallengeInvite,
  declineChallengeInvite,
  getChallengeById,
  getChallengeTeams,
  getMyActiveChallenges,
  getMyInvites,
} from '../../services/challengeService';

const TEAM = '#1B7A42';
const IND = '#D4650A';
const BG = '#EDEEED';
const CARD = '#FFFFFF';
const TEXT = '#111714';
const SUB = '#576058';
const MUTED = '#9AA49C';
const BORD = 'rgba(0,0,0,0.07)';

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 3 },
  default: {},
});

const asArray = (x) => {
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.content)) return x.content;
  if (Array.isArray(x?.data)) return x.data;
  if (Array.isArray(x?.challenges)) return x.challenges;
  if (Array.isArray(x?.teams)) return x.teams;
  if (Array.isArray(x?.items)) return x.items;
  return [];
};

const sameId = (a, b) => Number(a) === Number(b);

const fmt = (s) => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? '—' : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
};

function resolveMode(item) {
  const raw = String(item?.mode ?? item?.challenge_mode ?? item?.type ?? '')
    .toLowerCase()
    .trim();

  if (['individual', 'individuell', 'solo'].includes(raw)) return 'individual';
  if (raw === 'team') return 'team';

  if (item?.inviteStatus === 'accepted' || item?.inviteStatus === 'pending') {
    return 'individual';
  }

  if (item?.teamCount > 0 || (Array.isArray(item?.teamIds) && item.teamIds.length > 0)) {
    return 'team';
  }

  return 'team';
}

function ChallengeCard({ item, onPress, onAccept, onDecline }) {
  const mode = resolveMode(item);
  const isInd = mode === 'individual';
  const isPend = isInd && item?.inviteStatus === 'pending';

  const color = isInd ? IND : TEAM;
  const soft = isInd ? 'rgba(212,101,10,0.07)' : 'rgba(27,122,66,0.07)';
  const label = isInd ? 'Individuell' : 'Team';
  const mIcon = isInd ? 'person' : 'group';

  const dist = item?.distance ?? item?.distanceKm ?? 0;
  const from = item?.startLocation ?? '—';
  const to = item?.targetLocation ?? '—';
  const d1 = fmt(item?.startDate);
  const d2 = fmt(item?.endDate);

  return (
    <Pressable
      onPress={isPend ? undefined : onPress}
      style={({ pressed }) => [styles.card, !isPend && pressed && styles.cardTap]}
    >
      <View style={[styles.stripe, { backgroundColor: color }]} />

      <View style={styles.cardInner}>
        <View style={[styles.cardTop, { backgroundColor: soft }]}>
          <View style={styles.cardTopRow}>
            <View style={[styles.modeBadge, { backgroundColor: color }]}>
              <MaterialIcons name={mIcon} size={11} color="#fff" />
              <Text style={styles.modeTxt}>{label}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {isPend && (
                <View style={styles.invBadge}>
                  <Ionicons name="notifications" size={11} color="#92400E" />
                </View>
              )}
              <Text style={[styles.kmTxt, { color }]}>{dist} km</Text>
            </View>
          </View>

          <Text style={styles.name} numberOfLines={2}>
            {item?.name ?? '—'}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={styles.routeTxt} numberOfLines={1}>{from}</Text>
            <Ionicons name="arrow-forward" size={12} color={MUTED} style={{ marginHorizontal: 4 }} />
            <MaterialIcons name="flag" size={13} color={color} />
            <Text style={styles.routeTxt} numberOfLines={1}>{to}</Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={13} color={MUTED} />
              <Text style={styles.dateTxt}>{d1} – {d2}</Text>
            </View>

            {!isPend && (
              <View style={[styles.goBtn, { backgroundColor: color }]}>
                <Ionicons name="chevron-forward" size={15} color="#fff" />
              </View>
            )}
          </View>

          {isPend && (
            <View style={styles.pendBtns}>
              <Pressable
                onPress={onDecline}
                style={({ pressed }) => [styles.btnNo, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.btnNoTxt}>Ablehnen</Text>
              </Pressable>

              <Pressable
                onPress={onAccept}
                style={({ pressed }) => [
                  styles.btnYes,
                  { backgroundColor: color },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="checkmark" size={14} color="#fff" />
                <Text style={styles.btnYesTxt}>Annehmen</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function AllChallengesScreen() {
  const [challenges, setChallenges] = useState([]);
  const [loadingInitial, setLoadingInit] = useState(true);

  const router = useRouter();

  const visible = useMemo(
    () => challenges.filter((c) => {
      const s = String(c?.state ?? '').toLowerCase();
      return s === 'open' || s === 'active';
    }),
    [challenges]
  );

  const loadChallenges = useCallback(async () => {
    setLoadingInit(true);
    try {
        const [rawChallenges, rawInvites] = await Promise.all([
        getMyActiveChallenges(),
        getMyInvites(),
      ]);

      const activeList = asArray(rawChallenges);
      const invites = asArray(rawInvites);
      const activeIds = new Set(activeList.map((c) => Number(c.id)));

      // Pending-Einladungen die noch nicht in der aktiven Liste sind nachladen
      const pendingExtras = await Promise.all(
        invites
          .filter((i) => i.status === 'pending' && !activeIds.has(Number(i.challengeId ?? i.challenge_id)))
          .map(async (i) => {
            try { return await getChallengeById(i.challengeId ?? i.challenge_id); } catch { return null; }
          })
      );

      const safe = [...activeList, ...pendingExtras.filter(Boolean)];

      const enriched = await Promise.all(
        safe.map(async (ch) => {
          const inv = invites.find((i) => sameId(i.challengeId ?? i.challenge_id, ch.id));
          try {
            const teams = asArray(await getChallengeTeams(ch.id));
            const teamIds = teams
              .map((t) => Number(t.id ?? t.teamId ?? t.team_id ?? t.team?.id ?? 0))
              .filter(Boolean);
            return {
              ...ch,
              teamCount: teamIds.length,
              teamIds,
              inviteStatus: inv?.status ?? ch.inviteStatus ?? null,
              inviteId: inv?.id ?? null,
            };
          } catch {
            return {
              ...ch,
              teamCount: 0,
              teamIds: [],
              inviteStatus: inv?.status ?? ch.inviteStatus ?? null,
              inviteId: inv?.id ?? null,
            };
          }
        })
      );

      setChallenges(enriched.filter((c) => c.inviteStatus !== 'declined'));
    } catch (e) {
      console.error('Failed to load challenges:', e);
      setChallenges([]);
    } finally {
      setLoadingInit(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChallenges();
      return () => {};
    }, [loadChallenges])
  );

  const handleAccept = async (cId, iId) => {
    try {
      await acceptChallengeInvite(cId, iId);
      loadChallenges();
    } catch (e) {
      console.error('[accept failed]', e);
    }
  };

  const handleDecline = async (cId, iId) => {
    try {
      await declineChallengeInvite(cId, iId);
      loadChallenges();
    } catch (e) {
      console.error('[decline failed]', e);
    }
  };

  const handlePress = (item) => {
    const mode = resolveMode(item);

    const params = {
      id: String(item.id),
      name: item?.name ?? '',
      startLocation: item?.startLocation ?? '',
      targetLocation: item?.targetLocation ?? '',
      distance: String(item?.distance ?? item?.distanceKm ?? 0),
      startDate: item?.startDate ?? '',
      endDate: item?.endDate ?? '',
      state: item?.state ?? '',
    };

    router.push({
      pathname:
        mode === 'individual'
          ? '/challenges/challengeIndividualDashboard'
          : '/challenges/challengeTeamDashboard',
      params,
    });
  };

  if (loadingInitial) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={TEAM} />
        <Text style={styles.splashTxt}>Lade Challenges…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={visible}
        keyExtractor={(it) => String(it?.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={styles.heroWrap}>
            <View style={styles.hero}>
              <View style={[styles.accentLine, { backgroundColor: TEAM }]} />

              <View style={styles.heroTopRow}>
                <View style={styles.heroTexts}>
                  <Text style={styles.heroTitle}>Laufende Challenges</Text>
                  <Text style={styles.heroSub}>
                    Challenges, an denen du aktiv teilnimmst.
                  </Text>
                </View>

                {visible.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={[styles.countNum, { color: TEAM }]}>{visible.length}</Text>
                    <Text style={styles.countSub}>aktiv</Text>
                  </View>
                )}
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: TEAM }]} />
                  <Text style={styles.legendTxt}>Team</Text>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: IND }]} />
                  <Text style={styles.legendTxt}>Individuell</Text>
                </View>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ChallengeCard
            item={item}
            onPress={() => handlePress(item)}
            onAccept={() => handleAccept(item.id, item.inviteId)}
            onDecline={() => handleDecline(item.id, item.inviteId)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyCircle, { backgroundColor: `${TEAM}12`, borderColor: `${TEAM}25` }]}>
              <Ionicons name="flag-outline" size={28} color={TEAM} />
            </View>

            <Text style={styles.emptyTitle}>Keine aktiven Challenges</Text>
            <Text style={styles.emptySub}>
              Du nimmst aktuell an keiner Challenge teil.
            </Text>

            <Pressable
              onPress={() => router.push('/CreateHybridChallenge')}
              style={({ pressed }) => [
                styles.createBtn,
                { backgroundColor: TEAM },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.createTxt}>Challenge erstellen</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  splash: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  splashTxt: { fontSize: 14, color: SUB },

  list: { paddingBottom: 40 },

  heroWrap: { paddingHorizontal: 16, paddingTop: 68, paddingBottom: 20 },
  hero: {
    backgroundColor: CARD,
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: BORD,
    ...shadow,
  },
  accentLine: { width: 140, height: 4, borderRadius: 4, marginBottom: 16 },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroTexts: { flex: 1, marginRight: 12 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: TEXT, marginBottom: 6 },
  heroSub: { fontSize: 15, color: MUTED, lineHeight: 21 },
  countBadge: {
    alignItems: 'center',
    backgroundColor: `${TEAM}10`,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: `${TEAM}25`,
  },
  countNum: { fontSize: 22, fontWeight: '900' },
  countSub: { fontSize: 10, fontWeight: '600', color: MUTED, marginTop: 1 },
  heroDivider: { height: 1, backgroundColor: BORD, marginBottom: 14 },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendTxt: { fontSize: 13, fontWeight: '600', color: SUB },

  card: {
    marginHorizontal: 16,
    borderRadius: 18,
    backgroundColor: CARD,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORD,
    flexDirection: 'row',
    ...shadow,
  },
  cardTap: { opacity: 0.9, transform: [{ scale: 0.983 }] },

  stripe: { width: 5 },
  cardInner: { flex: 1 },

  cardTop: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 13,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  modeTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },

  invBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234,179,8,0.13)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: 'rgba(234,179,8,0.25)',
  },
  invTxt: { fontSize: 11, fontWeight: '700', color: '#92400E' },

  kmTxt: { fontSize: 13, fontWeight: '800' },

  name: { fontSize: 16, fontWeight: '700', color: TEXT, lineHeight: 21 },

  cardBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: BORD,
    gap: 10,
  },

  routeRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  routeTxt: { fontSize: 12, color: SUB, flexShrink: 1, fontWeight: '500' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateTxt: { fontSize: 12, color: MUTED, fontWeight: '500' },
  goBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pendBtns: { flexDirection: 'row', gap: 8 },
  btnNo: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: BORD,
  },
  btnNoTxt: { fontSize: 13, fontWeight: '700', color: SUB },
  btnYes: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  btnYesTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },

  empty: { marginTop: 60, alignItems: 'center', paddingHorizontal: 32 },
  emptyCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: SUB,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 220,
    marginBottom: 24,
  },
  createBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...shadow,
  },
  createTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});