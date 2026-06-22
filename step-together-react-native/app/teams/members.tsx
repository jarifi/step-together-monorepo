import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Avatar from '../../components/Avatar';
import { getTeamMembers, removeTeamMember } from '../../services/teamService';

type TeamMembersSearchParams = {
    id?: string | string[];
    name?: string | string[];
    isAdmin?: string | string[];
};

type Member = {
    id?: number | string | null;
    userId?: number | string | null;
    name?: string | null;
    joiningDate?: string | null;
    [key: string]: unknown;
};

const COLORS = {
    bg: '#F5F7F4',
    surface: '#FFFFFF',
    text: '#0F1411',
    sub: '#55605A',
    border: 'rgba(15,20,17,0.10)',
    accent: '#55805c',
    accentSoft: 'rgba(85,128,92,0.12)',
    danger: '#D92D20',
    dangerSoft: 'rgba(217,45,32,0.10)',
    dangerBorder: 'rgba(217,45,32,0.18)',
} as const;

export default function TeamMembersScreen() {
    const { id, name, isAdmin } = useLocalSearchParams<TeamMembersSearchParams>();
    const router = useRouter();
    const admin = isAdmin === '1' || isAdmin === 'true';

    const teamId = Array.isArray(id) ? id[0] : id;
    const teamName = Array.isArray(name) ? name[0] : name ?? 'Team';

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<number | string | null>(null);

    const loadMembers = async () => {
        if (!teamId) {
            setLoading(false);
            return;
        }

        try {
            const data = await getTeamMembers(teamId);
            setMembers(Array.isArray(data) ? (data as Member[]) : []);
        } catch (err) {
            console.error('Fehler beim Laden der Teammitglieder:', err);
            setMembers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        void loadMembers();
    }, [teamId]);

    const handleRemove = async (member: Member) => {
        const memberId = member.id ?? member.userId;
        if (!memberId) return;

        setRemoving(memberId);

        try {
            await removeTeamMember(memberId);
            setMembers((prev) => prev.filter((m) => m.id !== memberId && m.userId !== memberId));
            Toast.show({
                type: 'success',
                text1: 'Mitglied entfernt',
                position: 'top',
                topOffset: 100,
            });
        } catch {
            Toast.show({
                type: 'error',
                text1: 'Fehler',
                text2: 'Konnte Mitglied nicht entfernen.',
                position: 'top',
                topOffset: 100,
            });
        } finally {
            setRemoving(null);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <FlatList
                data={members}
                keyExtractor={(m) => String(m.id ?? m.userId ?? '')}
                ListHeaderComponent={
                    <View>
                        <View style={styles.headerCard}>
                            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
                                <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
                            </Pressable>
                            <Text style={styles.title}>{teamName}</Text>
                            <Text style={styles.sub}>
                                {members.length} Mitglied{members.length !== 1 ? 'er' : ''}
                            </Text>
                        </View>

                        {members.length > 0 && <Text style={styles.listLabel}>MITGLIEDER</Text>}
                    </View>
                }
                renderItem={({ item: m }) => (
                    <View style={styles.memberCard}>
                        <Avatar user={m} name={m.name ?? ''} size={38} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.memberName}>{m.name ?? `User #${m.userId ?? m.id}`}</Text>
                            {m.joiningDate ? (
                                <Text style={styles.memberSub}>
                                    Mitglied seit {new Date(m.joiningDate).toLocaleDateString('de')}
                                </Text>
                            ) : null}
                        </View>
                        {admin && (
                            <Pressable
                                onPress={() => handleRemove(m)}
                                disabled={removing === (m.id ?? m.userId)}
                                style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
                                hitSlop={8}
                            >
                                {removing === (m.userId ?? m.id) ? (
                                    <ActivityIndicator size="small" color={COLORS.danger} />
                                ) : (
                                    <MaterialIcons name="remove-circle-outline" size={22} color={COLORS.danger} />
                                )}
                            </Pressable>
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                        <Text style={styles.emptyText}>Dieses Team hat noch keine Mitglieder.</Text>
                    </View>
                }
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg, paddingTop: 56 },
    loadingWrap: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },

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
        alignItems: 'center',
    },
    backBtn: { position: 'absolute', left: 16, top: 16 },
    title: { fontSize: 20, fontWeight: '800', color: COLORS.text, letterSpacing: 0.2 },
    sub: { marginTop: 4, fontSize: 13, color: COLORS.sub, fontWeight: '600' },

    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.sub,
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    searchWrap: { position: 'relative', marginBottom: 8 },
    searchInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#FBFCFB',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
        paddingRight: 40,
        fontSize: 15,
        color: COLORS.text,
    },
    searchSpinner: { position: 'absolute', right: 12, top: 10 },

    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: 10,
    },
    resultIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
    resultSub: { fontSize: 12, color: COLORS.sub, marginTop: 1 },
    addBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noResults: { fontSize: 13, color: COLORS.sub, textAlign: 'center', paddingVertical: 8 },

    listLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.sub,
        letterSpacing: 0.8,
        marginBottom: 10,
        marginLeft: 4,
    },

    memberCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    iconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#e3efe6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
    memberSub: { fontSize: 12, color: COLORS.sub, marginTop: 2 },
    removeBtn: { padding: 4 },

    emptyWrap: { paddingVertical: 32, alignItems: 'center' },
    emptyText: { fontSize: 14, color: COLORS.sub, textAlign: 'center' },

    pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
});