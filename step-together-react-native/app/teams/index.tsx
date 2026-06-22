import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { deleteTeam, getTeamMembers, getTeams } from '../../services/teamService';

type Team = {
    id?: number | string | null;
    name?: string | null;
    teamId?: string | number | null;
    team_id?: string | number | null;
    description?: string | null;
    loadedMembers?: unknown[];
    loadedMemberCount?: number | null;
    memberCount?: number | null;
    membersCount?: number | null;
    member_count?: number | null;
    maxMembers?: number | null;
    max_members?: number | null;
    teamSize?: number | null;
    team_size?: number | null;
};

const { height: screenHeight } = Dimensions.get('window');

const COLORS = {
    bg: '#F5F7F4',
    surface: '#FFFFFF',
    text: '#0F1411',
    sub: '#55605A',
    border: 'rgba(15,20,17,0.10)',
    accent: '#55805c',
    accentSoft: 'rgba(85,128,92,0.12)',
} as const;

const getInitials = (name?: string | null) =>
    String(name || '')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

export default function TeamsScreen() {
    const [teams, setTeams] = useState<Team[]>([]);
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

    const enrichTeamsWithMembers = async (teamList: Team[]) => {
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

    const handleEndReached = () => {
        if (!searchQuery.trim()) {
            void loadTeams();
        }
    };

    useFocusEffect(
        useCallback(() => {
            setSkip(0);
            setTeams([]);
            setHasMore(true);
            setSearchQuery('');
            void loadTeams();
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
                                {filteredTeams.length} von {teams.length} gefunden · „{searchQuery.trim()}"
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
                        const members = Array.isArray(item?.loadedMembers) ? item.loadedMembers : [];

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
                                style={({ pressed }) => [styles.teamCard, pressed && styles.pressed]}
                            >
                                <View style={styles.cardAccent} />

                                <View style={styles.teamCardTop}>
                                    <View style={styles.teamIconWrap}>
                                        <Ionicons name="people" size={20} color={COLORS.accent} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.teamName} numberOfLines={1}>
                                            {item?.name ?? 'Ohne Namen'}
                                        </Text>
                                        <View style={styles.teamMetaRow}>
                                            <Text style={styles.teamId}>ID {String(teamCode ?? '-')}</Text>
                                            <View style={styles.countPill}>
                                                <Ionicons name="person" size={11} color={COLORS.accent} />
                                                <Text style={styles.countPillText}>
                                                    {memberCount} {memberCount === 1 ? 'Mitglied' : 'Mitglieder'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.teamActionsRow}>
                                    <Pressable
                                        onPress={() =>
                                            router.push({
                                                pathname: '/teams/update',
                                                params: { id: item.id, name: item.name },
                                            })
                                        }
                                        style={({ pressed }) => [styles.smallSecondaryBtn, pressed && styles.pressed]}
                                    >
                                        <Ionicons name="pencil-outline" size={14} color={COLORS.text} />
                                        <Text style={styles.smallSecondaryBtnText}>Bearbeiten</Text>
                                    </Pressable>

                                    <Pressable
                                        onPress={async () => {
                                            try {
                                                if (item.id != null) {
                                                    await deleteTeam(item.id);
                                                }
                                                setTeams((prev) => prev.filter((t) => t.id !== item.id));
                                            } catch (error) {
                                                console.error('Delete failed:', error);
                                            }
                                        }}
                                        style={({ pressed }) => [styles.smallDangerBtn, pressed && styles.pressed]}
                                    >
                                        <Ionicons name="trash-outline" size={14} color="#D92D20" />
                                        <Text style={styles.smallDangerBtnText}>Löschen</Text>
                                    </Pressable>
                                </View>
                            </Pressable>
                        );
                    }}
                    onEndReached={searchQuery.trim() ? undefined : handleEndReached}
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
                        paddingBottom: 100,
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
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
        overflow: 'hidden',
    },

    cardAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: COLORS.accent,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
    },

    teamCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingLeft: 4,
    },

    teamIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },

    teamName: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: 0.1,
    },

    teamMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
        flexWrap: 'wrap',
    },

    teamId: {
        fontSize: 12,
        color: COLORS.sub,
        fontWeight: '600',
    },

    countPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.accentSoft,
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'rgba(85,128,92,0.18)',
    },

    countPillText: {
        color: COLORS.accent,
        fontWeight: '800',
        fontSize: 12,
    },

    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 12,
        marginLeft: 4,
    },

    teamActionsRow: {
        flexDirection: 'row',
        gap: 8,
        paddingLeft: 4,
    },

    smallSecondaryBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        backgroundColor: '#F4F6F4',
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 10,
        borderRadius: 12,
    },

    smallSecondaryBtnText: {
        color: COLORS.text,
        fontWeight: '700',
        fontSize: 13,
    },

    smallDangerBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        backgroundColor: 'rgba(217,45,32,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(217,45,32,0.16)',
        paddingVertical: 10,
        borderRadius: 12,
    },

    smallDangerBtnText: {
        color: '#D92D20',
        fontWeight: '700',
        fontSize: 13,
    },
});
