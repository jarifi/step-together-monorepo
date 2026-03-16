import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { deleteTeam, getTeamMembers, getTeams } from '../../services/teamService';

const { height: screenHeight } = Dimensions.get('window');

const COLORS = {
  bg: '#F5F7F4',
  surface: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  accent: '#55805c',
  accentSoft: 'rgba(85,128,92,0.12)',
};

const getInitials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const pickAvatarFromMember = (member) => {
  if (!member) return null;
  return member.avatarUrl ?? member.avatar_url ?? member.avatar ?? null;
};

export default function TeamsScreen() {
  const [teams, setTeams] = useState([]);
  const [skip, setSkip] = useState(0);
  const limit = 10;

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;

    const q = searchQuery.toLowerCase().trim();
    return teams.filter((team) => {
      const name = team?.name?.toLowerCase?.() ?? '';
      const id = team?.id?.toString?.() ?? '';
      const teamId = team?.teamId?.toString?.()?.toLowerCase?.() ?? '';
      const teamIdAlt = team?.team_id?.toString?.()?.toLowerCase?.() ?? '';
      const desc = team?.description?.toLowerCase?.() ?? '';

      return (
        name.includes(q) ||
        id.includes(q) ||
        teamId.includes(q) ||
        teamIdAlt.includes(q) ||
        desc.includes(q)
      );
    });
  }, [searchQuery, teams]);

  const enrichTeamsWithMembers = async (teamList) => {
    const enriched = await Promise.all(
      teamList.map(async (team) => {
        try {
          const members = await getTeamMembers(team.id);
          const safeMembers = Array.isArray(members) ? members : [];

          return {
            ...team,
            loadedMembers: safeMembers,
            loadedMemberCount: safeMembers.length,
          };
        } catch (error) {
          console.error(`Failed to load members for team ${team?.id}:`, error);
          return {
            ...team,
            loadedMembers: [],
            loadedMemberCount: 0,
          };
        }
      })
    );

    return enriched;
  };

  const loadTeams = async () => {
    if (loadingMore || !hasMore) return;

    const isInitial = teams.length === 0;
    if (isInitial) setLoadingInitial(true);
    else setLoadingMore(true);

    try {
      const data = await getTeams(skip, limit);
      const safe = Array.isArray(data) ? data : [];
      const enriched = await enrichTeamsWithMembers(safe);

      setTeams((prev) => [...prev, ...enriched]);
      setSkip((prev) => prev + safe.length);

      if (safe.length < limit) setHasMore(false);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      if (isInitial) setLoadingInitial(false);
      else setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setSkip(0);
      setTeams([]);
      setHasMore(true);
      setSearchQuery('');
      loadTeams();
    }, [])
  );

  if (loadingInitial && teams.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Lade Teams...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Alle Teams</Text>

          <View style={styles.searchWrap}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Teams suchen…"
              placeholderTextColor="#8A9590"
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />

            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                hitSlop={10}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </Pressable>
            )}
          </View>

          {searchQuery.trim() ? (
            <View style={styles.searchInfoPill}>
              <Text style={styles.searchInfoText}>
                {filteredTeams.length} von {teams.length} gefunden · „{searchQuery.trim()}“
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => router.push('/teams/create')}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.primaryBtnText}>+ Neues Team</Text>
          </Pressable>
        </View>

        <FlatList
          data={filteredTeams}
          keyExtractor={(item) => String(item?.id)}
          renderItem={({ item }) => {
            const members = Array.isArray(item?.loadedMembers)
              ? item.loadedMembers
              : [];

            const memberCount =
              item?.loadedMemberCount ??
              item?.memberCount ??
              item?.membersCount ??
              item?.member_count ??
              members.length ??
              0;

            const maxMembers =
              item?.maxMembers ??
              item?.max_members ??
              item?.teamSize ??
              item?.team_size ??
              memberCount;

            const teamCode = item?.teamId ?? item?.team_id ?? item?.id;

            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/teams/members',
                    params: { id: String(item.id), name: item.name },
                  })
                }
                style={({ pressed }) => [
                  styles.teamCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.teamCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamName}>{item?.name ?? 'Ohne Namen'}</Text>
                    <Text style={styles.teamId}>ID: {String(teamCode ?? '-')}</Text>
                  </View>

                  <View style={styles.countPill}>
                    <Text style={styles.countPillText}>
                      {memberCount}/{maxMembers}
                    </Text>
                  </View>
                </View>

                <View style={styles.membersRow}>
                  {members.length > 0 ? (
                    <>
                      <View style={styles.avatarStack}>
                        {members.slice(0, 5).map((member, index) => {
                          const avatarUrl = pickAvatarFromMember(member);
                          const initials = getInitials(member?.name ?? `U${member?.userId ?? ''}`);

                          return (
                            <View
                              key={String(member?.id ?? member?.userId ?? index)}
                              style={[
                                styles.memberAvatarWrap,
                                {
                                  marginLeft: index === 0 ? 0 : -10,
                                  zIndex: 10 - index,
                                },
                              ]}
                            >
                              {avatarUrl ? (
                                <Image
                                  source={{ uri: avatarUrl }}
                                  style={styles.memberAvatar}
                                />
                              ) : (
                                <View style={styles.memberAvatarFallback}>
                                  <Text style={styles.memberAvatarInitials}>
                                    {initials}
                                  </Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>

                      <Text style={styles.memberInfoText}>
                        {memberCount} Mitglied{memberCount === 1 ? '' : 'er'}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.noMembersText}>Keine Mitglieder im Team</Text>
                  )}
                </View>

                <View style={styles.teamActionsRow}>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/teams/update',
                        params: { id: item.id, name: item.name },
                      })
                    }
                    style={({ pressed }) => [
                      styles.smallSecondaryBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.smallSecondaryBtnText}>Bearbeiten</Text>
                  </Pressable>

                  <Pressable
                    onPress={async () => {
                      try {
                        await deleteTeam(item.id);
                        setTeams((prev) => prev.filter((t) => t.id !== item.id));
                      } catch (error) {
                        console.error('Delete failed:', error);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.smallDangerBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.smallDangerBtnText}>Löschen</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
          onEndReached={searchQuery.trim() ? undefined : loadTeams}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {searchQuery.trim() ? 'Keine Treffer' : 'Keine Teams'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? `Für „${searchQuery.trim()}“ wurde nichts gefunden.`
                  : 'Erstell dein erstes Team und leg los.'}
              </Text>

              {!searchQuery.trim() && (
                <Pressable
                  onPress={() => router.push('/teams/create')}
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryBtnText}>Team erstellen</Text>
                </Pressable>
              )}
            </View>
          }
          ListFooterComponent={
            loadingMore && !searchQuery.trim() ? (
              <ActivityIndicator style={{ marginVertical: 18 }} />
            ) : null
          }
          contentContainerStyle={{
            paddingBottom: 28,
            flexGrow: 1,
            minHeight: screenHeight - 180,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 56,
  },

  loadingWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.sub,
  },

  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.2,
  },

  searchWrap: {
    marginTop: 14,
    position: 'relative',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FBFCFB',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingRight: 44,
    fontSize: 15,
    color: COLORS.text,
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15,20,17,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: COLORS.sub,
    fontSize: 14,
    fontWeight: '900',
    marginTop: -1,
  },

  searchInfoPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(85,128,92,0.18)',
  },
  searchInfoText: {
    fontSize: 12,
    color: COLORS.sub,
    fontWeight: '700',
  },

  primaryBtn: {
    marginTop: 14,
    backgroundColor: COLORS.accent,
    paddingVertical: 13,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  secondaryBtn: {
    marginTop: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 14,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.sub,
    textAlign: 'center',
    maxWidth: 320,
  },

  teamCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },

  teamCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  teamName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },

  teamId: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.sub,
    fontWeight: '600',
  },

  countPill: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(85,128,92,0.18)',
  },

  countPillText: {
    color: COLORS.accent,
    fontWeight: '800',
    fontSize: 13,
  },

  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    minHeight: 44,
  },

  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  memberAvatarWrap: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#fff',
  },

  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
  },

  memberAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#DDE7DD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  memberAvatarInitials: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1F2A22',
  },

  memberInfoText: {
    marginLeft: 12,
    fontSize: 13,
    color: COLORS.sub,
    fontWeight: '700',
  },

  noMembersText: {
    fontSize: 13,
    color: COLORS.sub,
    fontWeight: '600',
  },

  teamActionsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },

  smallSecondaryBtn: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallSecondaryBtnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 13,
  },

  smallDangerBtn: {
    flex: 1,
    backgroundColor: 'rgba(217,45,32,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(217,45,32,0.18)',
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallDangerBtnText: {
    color: '#D92D20',
    fontWeight: '700',
    fontSize: 13,
  },
});