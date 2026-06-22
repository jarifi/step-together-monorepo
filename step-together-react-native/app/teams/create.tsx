import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Image,
    ImageStyle,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { validateTeamName } from '../../lib/teamValidation';
import { addTeamMember, createTeam } from '../../services/teamService';
import { getUsers, searchUsers } from '../../services/userService';

type User = {
    id: number | string | null;
    userId?: number | string | null;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    avatar_url?: string | null;
    avatar?: string | null;
};

type NormalizedUser = {
    id: number | string | null;
    name: string;
    email?: string | null;
    avatarUrl: string | null;
    avatar_url?: string | null;
    avatar?: string | null;
};

type Style = {
    screen: ViewStyle;
    content: ViewStyle;
    headerCard: ViewStyle;
    title: TextStyle;
    formCard: ViewStyle;
    label: TextStyle;
    input: TextStyle;
    readonlyField: ViewStyle;
    readonlyText: TextStyle;
    sizeRow: ViewStyle;
    sizeChip: ViewStyle;
    sizeChipActive: ViewStyle;
    sizeChipText: TextStyle;
    sizeChipTextActive: TextStyle;
    counterBox: ViewStyle;
    counterText: TextStyle;
    searchRow: ViewStyle;
    searchInput: TextStyle;
    sectionTitle: TextStyle;
    userList: ViewStyle;
    emptyText: TextStyle;
    userRow: ViewStyle;
    userInfo: ViewStyle;
    avatarFallback: ViewStyle;
    avatarImage: ImageStyle;
    avatarInitials: TextStyle;
    userName: TextStyle;
    userId: TextStyle;
    addBtn: ViewStyle;
    removeBtn: ViewStyle;
    buttonRow: ViewStyle;
    primaryBtn: ViewStyle;
    primaryBtnText: TextStyle;
    secondaryBtn: ViewStyle;
    moreText: TextStyle;
    secondaryBtnText: TextStyle;
    pressed: ViewStyle;
    disabled: ViewStyle;
};

const COLORS = {
    bg: '#F5F7F4',
    surface: '#FFFFFF',
    text: '#0F1411',
    sub: '#55605A',
    border: 'rgba(15,20,17,0.10)',
    accent: '#55805c',
    inputBg: '#FBFCFB',
    muted: '#EEF2EE',
    danger: '#D92D20',
} as const;

const buildTeamId = (name: string) => {
    const cleaned = String(name || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6);

    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    return cleaned ? `${cleaned}-${randomPart}` : `TEAM-${randomPart}`;
};

const getInitials = (name: string | null | undefined) =>
    String(name || '')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

const pickAvatarFromUser = (user: User | NormalizedUser | null | undefined) => {
    if (!user) return null;
    return user.avatarUrl ?? user.avatar_url ?? user.avatar ?? null;
};

const normalizeUser = (user: User): NormalizedUser => ({
    ...user,
    id: user?.id ?? user?.userId ?? null,
    name:
        user?.name ||
        `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() ||
        'Unbekannt',
    avatarUrl: pickAvatarFromUser(user),
});

const UserAvatar = ({ user }: { user: NormalizedUser }) => {
    const avatarUrl = pickAvatarFromUser(user);

    if (avatarUrl) {
        return <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />;
    }

    return (
        <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
        </View>
    );
};

const UserRow = ({
    user,
    onPress,
    isAdd,
}: {
    user: NormalizedUser;
    onPress: () => void;
    isAdd: boolean;
}) => {
    return (
        <View style={styles.userRow}>
            <View style={styles.userInfo}>
                <UserAvatar user={user} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{user?.name}</Text>
                    <Text style={styles.userId}>
                        {user?.email ? user.email : `ID: ${String(user?.id ?? '-')}`}
                    </Text>
                </View>
            </View>

            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    isAdd ? styles.addBtn : styles.removeBtn,
                    pressed && styles.pressed,
                ]}
            >
                <Ionicons
                    name={isAdd ? 'add' : 'remove'}
                    size={18}
                    color="#fff"
                />
            </Pressable>
        </View>
    );
};

export default function CreateTeamScreen() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<NormalizedUser[]>([]);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<NormalizedUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [teamSizeMode, setTeamSizeMode] = useState<'2' | '3' | '5' | 'custom'>('3');
    const [customSize, setCustomSize] = useState('4');
    const [selectedUsers, setSelectedUsers] = useState<NormalizedUser[]>([]);

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const teamId = useMemo(() => buildTeamId(name), [name]);

    const maxMembers = useMemo(() => {
        if (teamSizeMode === 'custom') {
            const parsed = Number(customSize);
            if (!Number.isFinite(parsed)) return 0;
            return Math.min(Math.max(parsed, 1), 10);
        }
        return Number(teamSizeMode);
    }, [teamSizeMode, customSize]);

    const refreshUsers = useCallback(async () => {
        try {
            const data = await getUsers(0, 100);
            const safe = Array.isArray(data) ? data.map(normalizeUser) : [];
            setUsers(safe);
        } catch (error) {
            console.error('Failed to load users:', error);
            setUsers([]);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshUsers();
        }, [refreshUsers])
    );

    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        const q = search.trim();

        if (!q) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        const lower = q.toLowerCase();
        const localResults = users.filter((user) => {
            const userName = user?.name?.toLowerCase?.() ?? '';
            const email = user?.email?.toLowerCase?.() ?? '';
            const id = String(user?.id ?? '').toLowerCase();
            return userName.includes(lower) || email.includes(lower) || id.includes(lower);
        });

        if (localResults.length > 0) {
            setSearchResults(localResults);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const results = await searchUsers(q);
                const safe = Array.isArray(results) ? results.map(normalizeUser) : [];
                setSearchResults(safe);
            } catch (error) {
                console.error('User search failed:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [search, users]);

    const availableUsers = useMemo(() => {
        const selectedIds = new Set(selectedUsers.map((u) => String(u.id)));
        const source = search.trim() ? searchResults : users;

        return source.filter((user) => !selectedIds.has(String(user.id)));
    }, [users, searchResults, search, selectedUsers]);

    const visibleAvailableUsers = useMemo(() => availableUsers.slice(0, 5), [availableUsers]);

    const handleAddUser = (user: NormalizedUser) => {
        if (selectedUsers.length >= maxMembers) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: `Maximal ${maxMembers} Benutzer erlaubt.`,
                position: 'top',
                topOffset: 100,
            });
            return;
        }

        setSelectedUsers((prev) => {
            if (prev.some((u) => String(u.id) === String(user.id))) return prev;
            return [...prev, user];
        });
    };

    const handleRemoveUser = (userId: number | string | null) => {
        setSelectedUsers((prev) => prev.filter((u) => String(u.id) !== String(userId)));
    };

    const handleCreate = async () => {
        const trimmedName = name.trim();
        const nameErrors = validateTeamName(trimmedName);

        if (!trimmedName) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Bitte einen Teamnamen eingeben.',
                position: 'top',
                topOffset: 100,
            });
            return;
        }

        if (teamSizeMode === 'custom') {
            const parsed = Number(customSize);

            if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Custom Teamgröße muss zwischen 1 und 10 liegen.',
                    position: 'top',
                    topOffset: 100,
                });
                return;
            }
        }

        if (nameErrors.length > 0) {
            nameErrors.forEach((error, index) => {
                setTimeout(() => {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: error,
                        position: 'top',
                        topOffset: 100,
                    });
                }, index * 900);
            });
            return;
        }

        if (selectedUsers.length > maxMembers) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: `Es dürfen maximal ${maxMembers} Benutzer im Team sein.`,
                position: 'top',
                topOffset: 100,
            });
            return;
        }

        const memberIds = selectedUsers
            .map((u) => {
                const numericId = Number(u.id);
                return Number.isFinite(numericId) ? numericId : u.id;
            })
            .filter((id) => id !== null && id !== undefined && id !== '');

        setLoading(true);
        try {
            const createdTeam = await createTeam({
                name: trimmedName,
                teamId,
                maxMembers,
            });

            if (createdTeam?.id && memberIds.length > 0) {
                await Promise.allSettled(
                    memberIds.map((userId) => addTeamMember(createdTeam.id, userId))
                );
            }

            Toast.show({
                type: 'success',
                text1: 'Erfolg',
                text2: 'Team erfolgreich erstellt!',
                position: 'top',
                topOffset: 100,
            });

            router.replace('/teams');
        } catch (error: unknown) {
            const apiMsg =
                typeof error === 'object' && error !== null && 'response' in error
                    ? ((error as any).response?.data?.detail || (error as any).response?.data?.message)
                    : (error as Error).message;

            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: String(apiMsg || 'Team konnte nicht erstellt werden!'),
                position: 'top',
                topOffset: 100,
            });

            console.error('Create team failed:',
                typeof error === 'object' && error !== null ? (error as any).response?.data ?? error : error);
            console.log('Sent memberIds:', memberIds);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.headerCard}>
                <Text style={styles.title}>Team erstellen</Text>
            </View>

            <View style={styles.formCard}>
                <Text style={styles.label}>TEAM NAME</Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    editable={!loading}
                    returnKeyType="done"
                />

                <Text style={styles.label}>TEAM ID</Text>
                <View style={styles.readonlyField}>
                    <Text style={styles.readonlyText}>{teamId}</Text>
                </View>

                <Text style={styles.label}>MAXIMALE TEAMGRÖSSE</Text>
                <View style={styles.sizeRow}>
                    {['2', '3', '5', 'custom'].map((option) => {
                        const active = teamSizeMode === option;
                        return (
                            <Pressable
                                key={option}
                                onPress={() => setTeamSizeMode(option as '2' | '3' | '5' | 'custom')}
                                style={({ pressed }) => [
                                    styles.sizeChip,
                                    active && styles.sizeChipActive,
                                    pressed && styles.pressed,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.sizeChipText,
                                        active && styles.sizeChipTextActive,
                                    ]}
                                >
                                    {option === 'custom' ? 'Custom' : option}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {teamSizeMode === 'custom' && (
                    <>
                        <Text style={styles.label}>CUSTOM (MAX 10)</Text>
                        <TextInput
                            value={customSize}
                            onChangeText={(text) => {
                                const cleaned = text.replace(/[^\d]/g, '').slice(0, 2);
                                setCustomSize(cleaned);
                            }}
                            style={styles.input}
                            editable={!loading}
                            keyboardType="number-pad"
                            placeholder="1 - 10"
                            placeholderTextColor="#9AA4A0"
                        />
                    </>
                )}

                <View style={styles.counterBox}>
                    <Text style={styles.counterText}>
                        Ausgewählt: {selectedUsers.length} / {maxMembers}
                    </Text>
                </View>

                <Text style={styles.label}>BENUTZER SUCHEN</Text>
                <View style={styles.searchRow}>
                    <Ionicons name="search-outline" size={18} color={COLORS.sub} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        style={styles.searchInput}
                        editable={!loading}
                        placeholder="Name oder E-Mail suchen"
                        placeholderTextColor="#9AA4A0"
                    />
                </View>

                <Text style={styles.sectionTitle}>Gefundene Benutzer</Text>
                <View style={styles.userList}>
                    {isSearching ? (
                        <Text style={styles.emptyText}>Suche...</Text>
                    ) : visibleAvailableUsers.length > 0 ? (
                        <>
                            {visibleAvailableUsers.map((user) => (
                                <UserRow
                                    key={String(user.id)}
                                    user={user}
                                    onPress={() => handleAddUser(user)}
                                    isAdd
                                />
                            ))}

                            {availableUsers.length > 5 && (
                                <Text style={styles.moreText}>
                                    Es werden nur die ersten 5 Benutzer angezeigt.
                                </Text>
                            )}
                        </>
                    ) : (
                        <Text style={styles.emptyText}>Keine Benutzer gefunden.</Text>
                    )}
                </View>

                <Text style={styles.sectionTitle}>Ausgewählte Benutzer</Text>
                <View style={styles.userList}>
                    {selectedUsers.length > 0 ? (
                        selectedUsers.map((user) => (
                            <UserRow
                                key={String(user.id)}
                                user={user}
                                onPress={() => handleRemoveUser(user.id)}
                                isAdd={false}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Noch keine Benutzer ausgewählt.</Text>
                    )}
                </View>

                <View style={styles.buttonRow}>
                    <Pressable
                        onPress={() => router.back()}
                        disabled={loading}
                        style={({ pressed }) => [
                            styles.secondaryBtn,
                            pressed && styles.pressed,
                            loading && styles.disabled,
                        ]}
                    >
                        <Text style={styles.secondaryBtnText}>Abbrechen</Text>
                    </Pressable>

                    <Pressable
                        onPress={handleCreate}
                        disabled={loading}
                        style={({ pressed }) => [
                            styles.primaryBtn,
                            pressed && styles.pressed,
                            loading && styles.disabled,
                        ]}
                    >
                        <Text style={styles.primaryBtnText}>
                            {loading ? 'Erstelle…' : 'Erstellen'}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create<Style>({
    screen: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    content: {
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 120,
    },

    headerCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 14,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 4,
    },

    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        letterSpacing: 0.2,
        textAlign: 'center',
        paddingHorizontal: 56,
    },

    formCard: {
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

    label: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.sub,
        marginBottom: 8,
        marginLeft: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },

    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.inputBg,
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 14,
        fontSize: 15,
        color: COLORS.text,
        marginBottom: 14,
    },

    readonlyField: {
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#F1F3F1',
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 14,
    },

    readonlyText: {
        fontSize: 15,
        color: '#7A857F',
        fontWeight: '600',
    },

    sizeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14,
    },

    sizeChip: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#F9FAFB',
    },

    sizeChipActive: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },

    sizeChipText: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 14,
    },

    sizeChipTextActive: {
        color: '#fff',
    },

    counterBox: {
        backgroundColor: COLORS.muted,
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 14,
    },

    counterText: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 14,
    },

    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.inputBg,
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 14,
    },

    searchInput: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
    },

    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 10,
        marginLeft: 2,
    },

    userList: {
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#FCFDFC',
        borderRadius: 18,
        padding: 10,
        marginBottom: 14,
        gap: 10,
    },

    emptyText: {
        color: COLORS.sub,
        fontSize: 14,
        paddingVertical: 8,
        textAlign: 'center',
    },

    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 6,
    },

    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    avatarFallback: {
        width: 42,
        height: 42,
        borderRadius: 999,
        backgroundColor: '#DDE7DD',
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatarImage: {
        width: 42,
        height: 42,
        borderRadius: 999,
    },

    avatarInitials: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1F2A22',
    },

    userName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },

    userId: {
        fontSize: 12,
        color: COLORS.sub,
        marginTop: 2,
    },

    addBtn: {
        width: 34,
        height: 34,
        borderRadius: 999,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },

    removeBtn: {
        width: 34,
        height: 34,
        borderRadius: 999,
        backgroundColor: COLORS.danger,
        alignItems: 'center',
        justifyContent: 'center',
    },

    buttonRow: {
        flexDirection: 'row',
        marginTop: 6,
    },

    primaryBtn: {
        flex: 1,
        marginLeft: 12,
        backgroundColor: COLORS.accent,
        paddingVertical: 14,
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
        fontWeight: '600',
        fontSize: 15,
        letterSpacing: 0.2,
    },

    secondaryBtn: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 14,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },

    moreText: {
        marginTop: 8,
        fontSize: 12,
        color: COLORS.sub,
        textAlign: 'center',
    },

    secondaryBtnText: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 15,
    },

    pressed: {
        opacity: 0.85,
        transform: [{ scale: 0.99 }],
    },

    disabled: {
        opacity: 0.6,
    },
});
