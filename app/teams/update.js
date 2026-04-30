import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTeam } from '../../context/TeamContext';
import { validateTeamName } from '../../lib/teamValidation';
import { addTeamMember, getTeamMembers, removeTeamMember, updateTeam } from '../../services/teamService';
import { searchUsers } from '../../services/userService';

const COLORS = {
  bg: '#F5F7F4',
  surface: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  accent: '#55805c',
  accentSoft: 'rgba(85,128,92,0.12)',
  inputBg: '#FBFCFB',
  danger: '#D92D20',
};

export default function UpdateTeamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setTeam } = useTeam();

  const teamId = useMemo(() => {
    const raw = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params?.id]);

  const initialName = useMemo(() => {
    const raw = Array.isArray(params?.name) ? params.name[0] : params?.name;
    return (raw ?? '').toString();
  }, [params?.name]);

  // --- Name ---
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => { setName(initialName); }, [initialName]);

  const handleSave = async () => {
    if (!teamId) return;
    const trimmed = name.trim();
    const nameErrors = validateTeamName(trimmed);

    if (!trimmed) {
      Toast.show({ type: 'error', text1: 'Fehler', text2: 'Bitte einen Teamnamen eingeben.', position: 'top', topOffset: 100 });
      return;
    }
    if (nameErrors.length > 0) {
      nameErrors.forEach((err, i) =>
        setTimeout(() => Toast.show({ type: 'error', text1: 'Fehler', text2: err, position: 'top', topOffset: 100 }), i * 900)
      );
      return;
    }

    setSavingName(true);
    try {
      await updateTeam(teamId, { name: trimmed });
      for (const memberId of pendingRemovals) {
        await removeTeamMember(memberId);
      }
      for (const user of pendingAdditions) {
        await addTeamMember(teamId, user.id);
      }
      Toast.show({ type: 'success', text1: 'Team aktualisiert', position: 'top', topOffset: 100 });
      router.back();
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.message || 'Team konnte nicht aktualisiert werden.';
      Toast.show({ type: 'error', text1: 'Fehler', text2: String(msg), position: 'top', topOffset: 100 });
    } finally {
      setSavingName(false);
    }
  };

  // --- Members ---
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [pendingRemovals, setPendingRemovals] = useState(new Set());
  const [pendingAdditions, setPendingAdditions] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const searchTimeout = useRef(null);

  const loadMembers = async () => {
    if (!teamId) { setLoadingMembers(false); return; }
    try {
      const data = await getTeamMembers(teamId);
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    setLoadingMembers(true);
    loadMembers();
  }, [teamId]);

  const handleRemove = (member) => {
    if (member.pending) {
      setPendingAdditions((prev) => prev.filter((u) => u.id !== member.userId));
    } else {
      setPendingRemovals((prev) => new Set([...prev, member.id]));
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    clearTimeout(searchTimeout.current);
    if (!query.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(query.trim(), 0, 10);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleAdd = (user) => {
    setPendingAdditions((prev) => [...prev, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const displayedMembers = [
    ...members.filter((m) => !pendingRemovals.has(m.id)),
    ...pendingAdditions.map((u) => ({ id: `pending_${u.id}`, userId: u.id, name: u.name, pending: true })),
  ];

  const effectiveMemberUserIds = new Set([
    ...members.filter((m) => !pendingRemovals.has(m.id)).map((m) => m.userId ?? m.user_id),
    ...pendingAdditions.map((u) => u.id),
  ]);
  const filteredResults = searchResults.filter((u) => !effectiveMemberUserIds.has(u.id));

  return (
    <View style={styles.screen}>
      <FlatList
        data={displayedMembers}
        keyExtractor={(m) => String(m.id)}
        ListHeaderComponent={
          <View>
            <View style={styles.headerCard}>
              <Text style={styles.title}>Team bearbeiten</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>TEAM NAME</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="z.B. Step Squad"
                placeholderTextColor="#8A9590"
                style={styles.input}
                editable={!savingName}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>MITGLIED HINZUFÜGEN</Text>
              <View style={styles.searchWrap}>
                <TextInput
                  value={searchQuery}
                  onChangeText={handleSearch}
                  placeholder="Benutzer suchen…"
                  placeholderTextColor="#8A9590"
                  style={styles.searchInput}
                />
                {searching && (
                  <ActivityIndicator style={styles.searchSpinner} size="small" color={COLORS.accent} />
                )}
              </View>

              {filteredResults.map((user) => (
                <View key={String(user.id)} style={styles.resultRow}>
                  <View style={styles.resultIcon}>
                    <MaterialIcons name="person" size={18} color={COLORS.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{user.name ?? ('User #' + user.id)}</Text>
                    {user.email ? <Text style={styles.resultSub}>{user.email}</Text> : null}
                  </View>
                  <Pressable
                    onPress={() => handleAdd(user)}
                    style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
                  >
                    <MaterialIcons name="add" size={18} color="#fff" />
                  </Pressable>
                </View>
              ))}

              {searchQuery.trim() && !searching && filteredResults.length === 0 && (
                <Text style={styles.noResults}>Keine Benutzer gefunden.</Text>
              )}
            </View>

            <Text style={styles.listLabel}>
              {'MITGLIEDER (' + (loadingMembers ? '…' : displayedMembers.length) + ')'}
            </Text>

            {loadingMembers && (
              <ActivityIndicator style={{ marginVertical: 16 }} color={COLORS.accent} />
            )}
          </View>
        }
        renderItem={({ item: m }) => (
          <View style={styles.memberCard}>
            <View style={styles.iconWrapper}>
              <MaterialIcons name="person" size={20} color="#2f5c3a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{m.name ?? ('User #' + m.userId)}</Text>
              {m.joiningDate ? (
                <Text style={styles.memberSub}>
                  {'Mitglied seit ' + new Date(m.joiningDate).toLocaleDateString('de')}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => handleRemove(m)}
              style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
              hitSlop={8}
            >
              <MaterialIcons name="remove-circle-outline" size={22} color={COLORS.danger} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          !loadingMembers ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Noch keine Mitglieder im Team.</Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.back()}
          disabled={savingName}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed, savingName && styles.disabled]}
        >
          <Text style={styles.secondaryBtnText}>Abbrechen</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={savingName}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, savingName && styles.disabled]}
        >
          <Text style={styles.primaryBtnText}>
            {savingName ? 'Speichern…' : 'Speichern'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, paddingTop: 56 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,20,17,0.08)',
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
    alignItems: 'center',
  },

  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, letterSpacing: 0.2 },

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
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
  },
  buttonRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: COLORS.text, fontWeight: '600', fontSize: 15 },

  searchWrap: { position: 'relative', marginBottom: 4 },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
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
    padding: 13,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e3efe6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  memberSub: { fontSize: 12, color: COLORS.sub, marginTop: 2 },
  removeBtn: { padding: 4 },

  emptyWrap: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.sub },

  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.6 },
});
