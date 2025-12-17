import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getChallengeHistory } from './../services/challengeService.js';

export default function ChallengeHistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const data = await getChallengeHistory();
          setHistory(data ?? []);
        } catch (err) {
          console.error('Failed to load challenge history:', err);
          setHistory([]);
        } finally {
          setLoading(false);
        }
      };

      load();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Lade Verlauf…</Text>
      </View>
    );
  }

  const hasHistory = history.length > 0;

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={[styles.content, styles.headerCard]}>
        <Text style={styles.title}>Challenge History</Text>
        <Text style={styles.sub}>
          Hier siehst du alle Challenges, an denen du bereits teilgenommen hast.
        </Text>
      </View>

      {!hasHistory && (
        <View style={[styles.content, styles.emptyCard]}>
          <Text style={styles.emptyEmoji}>🏁</Text>
          <Text style={styles.emptyTitle}>Noch keine Challenges</Text>
          <Text style={styles.emptyText}>
            Du hast bisher an keiner Challenge teilgenommen.
          </Text>

          <Pressable
            onPress={() => router.push('/challenges')}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Zu den Challenges</Text>
          </Pressable>
        </View>
      )}

      {hasHistory && (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const endLabel = item.endDate
              ? new Date(item.endDate).toLocaleDateString()
              : '-';

            return (
              <View style={styles.content}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/allChallenges/details',
                      params: { id: item.id.toString() },
                    })
                  }
                  android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>

                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>{item.state}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardLine} numberOfLines={2}>
                    {item.startLocation} <Text style={styles.dim}>→</Text>{' '}
                    {item.targetLocation}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Distanz</Text>
                      <Text style={styles.metaValue}>{item.distance} km</Text>
                    </View>

                    <View style={styles.metaDivider} />

                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Beendet</Text>
                      <Text style={styles.metaValue}>{endLabel}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardLink}>Teams & Ranking anzeigen ›</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const COLORS = {
  bg: '#F4F7F4',
  card: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  dim: '#7B877F',
  border: 'rgba(15,20,17,0.10)',
  accent: '#2E6B4F',
  accentSoft: '#E7F3EC',
};

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  android: { elevation: 2 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 60,
  },

  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },

  // ---------------- LOADING ----------------
  loadingWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#666',
  },

  // ---------------- HEADER ----------------
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    ...shadow,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 6,
  },

  sub: {
    fontSize: 15,
    color: '#555',
    lineHeight: 20,
    textAlign: 'center',
  },

  // ---------------- LIST ----------------
  listContent: {
    paddingTop: 6,
    paddingBottom: 24,
    gap: 12,
  },

  // ---------------- EMPTY ----------------
  emptyCard: {
    marginTop: 4,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...shadow,
  },

  emptyEmoji: {
    fontSize: 26,
    marginBottom: 8,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },

  // ---------------- BUTTON ----------------
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 220,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  // ---------------- CARD ----------------
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...shadow,
  },
  cardPressed: {
    opacity: 0.98,
    transform: [{ scale: 0.995 }],
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },

  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },

  // ---------------- STATUS ----------------
  statusPill: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(46,107,79,0.18)',
  },
  statusText: {
    color: COLORS.accent,
    fontWeight: '600',
    fontSize: 12,
  },

  // ---------------- TEXT ----------------
  cardLine: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  dim: {
    color: '#777',
  },

  // ---------------- META ----------------
  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(15,20,17,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(15,20,17,0.06)',
  },

  metaItem: {
    flex: 1,
  },

  metaLabel: {
    fontSize: 11,
    color: '#777',
    marginBottom: 2,
  },

  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
  },

  metaDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(15,20,17,0.08)',
    marginHorizontal: 10,
  },

  // ---------------- LINK ----------------
  cardLink: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
});
