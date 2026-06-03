import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getChallengeById,
  getChallengeInvites,
  getChallengeTeams,
} from '../../services/challengeService';
import { getDisplayAvatarUri, getMe, getUserById } from '../../services/userService';

const C = {
  bg: '#F2F5F3',
  surface: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  primary: '#1E5C3A',
  primaryLight: 'rgba(30,92,58,0.10)',
};

type InviteStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

interface StatusConfig {
  icon: string;
  color: string;
  label: string;
}

const STATUS_CONFIG: Record<InviteStatus, StatusConfig> = {
  pending:   { icon: 'time-outline',           color: '#F59E0B', label: 'Ausstehend'  },
  accepted:  { icon: 'checkmark-circle',        color: '#22C55E', label: 'Angenommen'  },
  declined:  { icon: 'close-circle',            color: '#EF4444', label: 'Abgelehnt'   },
  cancelled: { icon: 'remove-circle-outline',   color: '#9CA3AF', label: 'Abgebrochen' },
};

interface User {
  id?: number | string;
  name?: string;
  username?: string;
  email?: string;
}

interface Invite {
  id?: number | string;
  status?: string;
  inviteeUserId?: number | string;
  invitee_user_id?: number | string;
  inviteeId?: number | string;
  invitee_id?: number | string;
}

interface InviteRowData {
  invite: Invite;
  user: User | null;
}

interface TeamData {
  id: number | string;
  name?: string;
  totalSteps?: number;
}

interface Challenge {
  id?: number | string;
  name?: string;
  distance?: number;
  state?: string;
  mode?: string;
  startLocation?: string;
  start_location?: string;
  targetLocation?: string;
  target_location?: string;
  creator_id?: number | string;
  creatorId?: number | string;
}

function getInitials(user: User | null | undefined): string {
  const s = user?.name ?? user?.username ?? user?.email ?? '?';
  return s.slice(0, 2).toUpperCase();
}

function InviteRow({ invite, user }: { invite: Invite; user: User | null }) {
  const avatarUri = getDisplayAvatarUri(user);
  const status = ((invite?.status ?? 'pending').toLowerCase()) as InviteStatus;
  const cfg: StatusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const displayName = user?.name ?? user?.username ?? user?.email ?? `User ${invite?.inviteeUserId}`;
  const subtitle = user?.email ?? '';

  return (
    <View style={styles.inviteRow}>
      <View style={styles.inviteLeft}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{getInitials(user)}</Text>
          </View>
        )}
        <View style={styles.inviteInfo}>
          <Text style={styles.inviteName} numberOfLines={1}>{displayName}</Text>
          {!!subtitle && (
            <Text style={styles.inviteSub} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: cfg.color + '22' }]}>
        <Ionicons name={cfg.icon as any} size={15} color={cfg.color} />
        <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </View>
  );
}

export default function ChallengeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [inviteRows, setInviteRows] = useState<InviteRowData[]>([]);
  const [invitesError, setInvitesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const challengeId = Array.isArray(id) ? id[0] : id;

    const load = async () => {
      setLoading(true);
      try {
        const [challengeData, me] = await Promise.all([getChallengeById(challengeId), getMe()]);
        setChallenge(challengeData);
        setCurrentUserId(me?.id ?? null);

        if (challengeData?.mode === 'individual') {
          try {
            const invites: Invite[] = await getChallengeInvites(challengeId);
            const rows: InviteRowData[] = await Promise.all(
              invites.map(async (invite) => {
                const userId =
                  invite?.inviteeUserId ??
                  invite?.invitee_user_id ??
                  invite?.inviteeId ??
                  invite?.invitee_id;
                const user = await getUserById(userId);
                return { invite, user };
              })
            );
            setInviteRows(rows);
          } catch (err: unknown) {
            console.error('Failed to load invites:', err);
            const e = err as { status?: number; message?: string };
            setInvitesError(
              `Einladungen konnten nicht geladen werden (${e?.status ?? '?'}: ${e?.message ?? 'Fehler'})`
            );
          }
        } else {
          const teamsData = await getChallengeTeams(challengeId);
          setTeams(teamsData ?? []);
        }
      } catch (err) {
        console.error('Failed to load challenge details:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const sortedTeams = useMemo<TeamData[]>(() => {
    if (!Array.isArray(teams)) return [];
    return [...teams].sort((a, b) => {
      const diff = (b.totalSteps ?? 0) - (a.totalSteps ?? 0);
      return diff !== 0 ? diff : (a.name ?? '').localeCompare(b.name ?? '');
    });
  }, [teams]);

  const stepsToKm = (steps: number): string => (steps * 0.0008).toFixed(2);

  const state = String(challenge?.state ?? '').trim().toLowerCase();
  const isUpcoming = ['upcoming', 'not_started', 'scheduled', 'future'].includes(state);
  const isClosed   = ['closed', 'finished', 'ended'].includes(state);
  const isRunning  = ['open', 'running', 'active'].includes(state);
  const leadingTeam = sortedTeams[0] ?? null;
  const isIndividual = challenge?.mode === 'individual';

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Lade Details...</Text>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.screen}>
        <View style={styles.navBar}>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
        </View>
        <Text style={styles.errorText}>Challenge wurde nicht gefunden.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* NAV */}
      <View style={styles.navBar}>
        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
      </View>

      {/* HERO CARD */}
      <View style={styles.heroCard}>
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>
            {isIndividual ? 'Individuell' : 'Team'}
          </Text>
        </View>
        <Text style={styles.heroTitle}>{challenge.name}</Text>
        <View style={styles.heroMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="walk-outline" size={16} color={C.primary} />
            <Text style={styles.metaText}>{challenge.distance} km</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <Ionicons
              name="ellipse"
              size={10}
              color={isRunning ? '#22C55E' : isClosed ? '#9CA3AF' : '#F59E0B'}
            />
            <Text style={[styles.metaText, {
              color: isRunning ? '#22C55E' : isClosed ? '#9CA3AF' : '#F59E0B',
            }]}>
              {challenge.state}
            </Text>
          </View>
        </View>

        {(challenge.startLocation ?? challenge.start_location) ? (
          <View style={styles.routeRow}>
            <View style={styles.routeItem}>
              <Ionicons name="location-outline" size={14} color={C.sub} />
              <Text style={styles.routeText} numberOfLines={1}>
                {challenge.startLocation ?? challenge.start_location}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={13} color={C.sub} />
            <View style={styles.routeItem}>
              <Ionicons name="flag-outline" size={14} color={C.sub} />
              <Text style={styles.routeText} numberOfLines={1}>
                {challenge.targetLocation ?? challenge.target_location}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* INDIVIDUAL — INVITED USERS */}
      {isIndividual && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {currentUserId === (challenge?.creator_id ?? challenge?.creatorId)
              ? 'Eingeladene Teilnehmer'
              : 'Teilnehmer'}
          </Text>
          {invitesError ? (
            <Text style={styles.errorNote}>{invitesError}</Text>
          ) : inviteRows.length === 0 ? (
            <Text style={styles.emptyText}>Noch keine Einladungen verschickt.</Text>
          ) : (
            inviteRows.map(({ invite, user }, i) => (
              <InviteRow
                key={invite?.id ?? invite?.inviteeUserId ?? i}
                invite={invite}
                user={user}
              />
            ))
          )}
        </View>
      )}

      {/* TEAM — LEADING / WINNER */}
      {!isIndividual && isRunning && leadingTeam && (
        <View style={[styles.card, styles.highlightCard]}>
          <Text style={styles.highlightLabel}>Führendes Team</Text>
          <Text style={styles.highlightName}>{leadingTeam.name}</Text>
          <Text style={styles.highlightSub}>
            {(leadingTeam.totalSteps ?? 0).toLocaleString()} Schritte · {stepsToKm(leadingTeam.totalSteps ?? 0)} km
          </Text>
        </View>
      )}

      {!isIndividual && isClosed && leadingTeam && (
        <View style={[styles.card, styles.highlightCard]}>
          <Ionicons name="trophy" size={26} color="#F59E0B" style={{ marginBottom: 6 }} />
          <Text style={styles.highlightLabel}>Gewinner-Team</Text>
          <Text style={styles.highlightName}>{leadingTeam.name}</Text>
          <Text style={styles.highlightSub}>
            {(leadingTeam.totalSteps ?? 0).toLocaleString()} Schritte · {stepsToKm(leadingTeam.totalSteps ?? 0)} km
          </Text>
        </View>
      )}

      {!isIndividual && isUpcoming && (
        <View style={[styles.card, styles.infoPill]}>
          <Ionicons name="time-outline" size={20} color="#F59E0B" />
          <Text style={styles.infoText}>
            Das führende Team wird angezeigt, sobald die Challenge gestartet ist.
          </Text>
        </View>
      )}

      {/* TEAM — RANKING LIST */}
      {!isIndividual && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Teilnehmende Teams</Text>
          {sortedTeams.length === 0 ? (
            <Text style={styles.emptyText}>Es nehmen aktuell noch keine Teams teil.</Text>
          ) : (
            sortedTeams.map((item, index) => {
              const teamKm = parseFloat(stepsToKm(item.totalSteps ?? 0));
              const hasFinished = teamKm >= (challenge.distance ?? 0);

              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.teamRow,
                    index === sortedTeams.length - 1 && { borderBottomWidth: 0 },
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/teams/members',
                      params: {
                        id: item.id.toString(),
                        name: item.name,
                        totalSteps: (item.totalSteps ?? 0).toString(),
                      },
                    })
                  }
                >
                  <View style={styles.teamRank}>
                    <Text style={styles.rankNum}>{index + 1}</Text>
                  </View>
                  <View style={styles.teamInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.teamName}>{item.name}</Text>
                      {hasFinished && (
                        <Ionicons name="checkmark-circle" size={15} color="#22C55E" />
                      )}
                    </View>
                    <Text style={styles.teamSteps}>
                      {(item.totalSteps ?? 0).toLocaleString()} Schritte · {stepsToKm(item.totalSteps ?? 0)} km
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={C.sub} />
                </Pressable>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  loadingWrap: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: C.sub,
  },

  navBar: {
    marginTop: 54,
    marginBottom: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pressed: { opacity: 0.7 },

  heroCard: {
    backgroundColor: C.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  modeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.primaryLight,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    marginBottom: 10,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 14,
    color: C.sub,
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.border,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  routeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeText: {
    fontSize: 13,
    color: C.sub,
    flex: 1,
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 14,
    color: C.sub,
    textAlign: 'center',
    paddingVertical: 14,
  },
  errorNote: {
    fontSize: 13,
    color: '#EF4444',
    paddingVertical: 12,
    lineHeight: 18,
  },

  highlightCard: {
    alignItems: 'center',
    backgroundColor: C.primaryLight,
    borderColor: 'rgba(30,92,58,0.18)',
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  highlightName: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
  },
  highlightSub: {
    fontSize: 14,
    color: C.sub,
  },

  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.20)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: C.sub,
    lineHeight: 18,
  },

  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  inviteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarFallback: {
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '700',
    color: C.primary,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteName: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  inviteSub: {
    fontSize: 13,
    color: C.sub,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    marginLeft: 8,
    flexShrink: 0,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  rowPressed: {
    opacity: 0.75,
  },
  teamRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankNum: {
    fontSize: 13,
    fontWeight: '800',
    color: C.primary,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  teamSteps: {
    fontSize: 13,
    color: C.sub,
    marginTop: 2,
  },

  errorText: {
    fontSize: 16,
    color: '#c00',
    textAlign: 'center',
    marginTop: 40,
  },
});
