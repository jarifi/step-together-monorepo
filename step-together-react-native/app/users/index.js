import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import UserCard from '../../components/UserCard';
import { deleteUser, getUsers, searchUsers, unlockUser, verifyUser } from '../../services/userService';

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

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [skip, setSkip] = useState(0);
  const limit = 10;

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [verifiedFilter, setVerifiedFilter] = useState('all');
  // 'all' | 'verified' | 'unverified'

  const searchTimeoutRef = useRef(null);
  const router = useRouter();

  const isUserVerified = useCallback((user) => {
    return (
      user?.isVerified === true ||
      user?.is_verified === true ||
      user?.verified === true
    );
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let baseUsers = users;

    if (q) {
      if (searchResults.length > 0) {
        baseUsers = searchResults;
      } else {
        baseUsers = users.filter((user) => {
          const name = user?.name?.toLowerCase?.() ?? '';
          const email = user?.email?.toLowerCase?.() ?? '';
          const id = user?.id?.toString?.() ?? '';
          return name.includes(q) || email.includes(q) || id.includes(q);
        });
      }
    }

    if (verifiedFilter === 'verified') {
      return baseUsers.filter((user) => isUserVerified(user));
    }

    if (verifiedFilter === 'unverified') {
      return baseUsers.filter((user) => !isUserVerified(user));
    }

    return baseUsers;
  }, [searchQuery, users, searchResults, verifiedFilter, isUserVerified]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const q = searchQuery.trim();

    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const lower = q.toLowerCase();
    const localResults = users.filter((user) => {
      const name = user?.name?.toLowerCase?.() ?? '';
      const email = user?.email?.toLowerCase?.() ?? '';
      const id = user?.id?.toString?.() ?? '';
      return name.includes(lower) || email.includes(lower) || id.includes(q);
    });

    if (localResults.length > 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(q);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, users]);

  const refreshUsers = async () => {
    setLoadingInitial(true);
    setHasMore(true);
    setSkip(0);

    try {
      const data = await getUsers(0, limit);
      const safe = Array.isArray(data) ? data : [];

      setUsers(safe);
      setSkip(safe.length);
      setHasMore(safe.length >= limit);
    } catch (err) {
      console.error('Failed to refresh users:', err);
      setUsers([]);
      setHasMore(false);
    } finally {
      setLoadingInitial(false);
    }
  };

  const loadUsers = async () => {
    if (loadingMore || loadingInitial || !hasMore || searchQuery.trim()) return;

    setLoadingMore(true);

    try {
      const data = await getUsers(skip, limit);
      const safe = Array.isArray(data) ? data : [];

      setUsers((prev) => [...prev, ...safe]);
      setSkip((prev) => prev + safe.length);

      if (safe.length < limit) setHasMore(false);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleVerifyUser = async (user) => {
    try {
      const result = await verifyUser(user.id);
      const verifiedValue = result?.isVerified ?? true;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                isVerified: verifiedValue,
                is_verified: verifiedValue,
                verified: verifiedValue,
              }
            : u
        )
      );

      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                isVerified: verifiedValue,
                is_verified: verifiedValue,
                verified: verifiedValue,
              }
            : u
        )
      );

      Alert.alert('Erfolg', 'Benutzer wurde verifiziert.');
    } catch (error) {
      console.error('Verify failed:', error);
      Alert.alert('Fehler', 'Benutzer konnte nicht verifiziert werden.');
    }
  };

  const handleUnlockUser = async (user) => {
    try {
      await unlockUser(user.id);
      const update = (list) =>
        list.map((u) =>
          u.id === user.id
            ? { ...u, failedLoginAttempts: 0, failed_login_attempts: 0 }
            : u
        );
      setUsers(update);
      setSearchResults(update);
      Alert.alert('Erfolg', 'Konto wurde entsperrt.');
    } catch (error) {
      console.error('Unlock failed:', error);
      Alert.alert('Fehler', 'Konto konnte nicht entsperrt werden.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      setSearchQuery('');
      setSearchResults([]);
      setVerifiedFilter('all');
      refreshUsers();
    }, [])
  );

  if (loadingInitial && users.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Lade Benutzer...</Text>
      </View>
    );
  }

  const showSearchInfo = searchQuery.trim().length > 0 || verifiedFilter !== 'all';

  const filterLabel =
    verifiedFilter === 'verified'
      ? 'nur verifiziert'
      : verifiedFilter === 'unverified'
        ? 'nur nicht verifiziert'
        : '';

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Alle Benutzer</Text>

          <View style={styles.searchWrap}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Benutzer suchen…"
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

          <View style={styles.filterRow}>
            {[
              { key: 'all', label: 'Alle' },
              { key: 'verified', label: 'Verifiziert' },
              { key: 'unverified', label: 'Nicht verifiziert' },
            ].map((item) => {
              const active = verifiedFilter === item.key;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => setVerifiedFilter(item.key)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    active && styles.filterChipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {showSearchInfo ? (
            <View style={styles.searchInfoPill}>
              <Text style={styles.searchInfoText}>
                {isSearching
                  ? 'Suche in der Datenbank…'
                  : `${filteredUsers.length} Ergebnis(se)${
                      searchQuery.trim() ? ` · „${searchQuery.trim()}“` : ''
                    }${filterLabel ? ` · ${filterLabel}` : ''}`}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => router.push('/users/create')}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.primaryBtnText}>+ Neuer Benutzer</Text>
          </Pressable>
        </View>

        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => String(item?.id)}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              onVerify={handleVerifyUser}
              onUnlock={handleUnlockUser}
              onUpdate={() =>
                router.push({
                  pathname: '/users/update',
                  params: {
                    id: item.id,
                    name: item.name,
                    email: item.email,
                    stepLength: item.stepLength,
                  },
                })
              }
              onDelete={async () => {
                try {
                  await deleteUser(item.id);
                  setUsers((prev) => prev.filter((u) => u.id !== item.id));
                  setSearchResults((prev) => prev.filter((u) => u.id !== item.id));
                } catch (error) {
                  console.error('Delete failed:', error);
                }
              }}
            />
          )}
          onEndReached={searchQuery.trim() ? undefined : loadUsers}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {searchQuery.trim() || verifiedFilter !== 'all' ? 'Keine Treffer' : 'Keine Benutzer'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery.trim() || verifiedFilter !== 'all'
                  ? 'Für die aktuelle Suche bzw. den aktuellen Filter wurde nichts gefunden.'
                  : 'Erstell deinen ersten Benutzer.'}
              </Text>

              {!searchQuery.trim() && verifiedFilter === 'all' && (
                <Pressable
                  onPress={() => router.push('/users/create')}
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryBtnText}>Benutzer erstellen</Text>
                </Pressable>
              )}
            </View>
          }
          ListFooterComponent={
            (loadingMore && !searchQuery.trim()) || isSearching ? (
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

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accent,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.sub,
  },
  filterChipTextActive: {
    color: COLORS.accent,
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
});