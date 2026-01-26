import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { LeafletOSMMap } from '../components/LeafletOSMMap';
import { getHomeInit } from '../services/dashboardService';
import { mapHomeInitToDashboard } from '../services/dto/dashboardDto';
import { getTeamRanking } from '../services/teamService';
import styles from './styles/dashboardStyles';

const FIX_STEP_LENGTH_M = 0.78;

const buildRankings = (rawRank: any[], userId: number | null | undefined) => {
  const normalized = rawRank.map((r: any) => {
    const slRaw =
      r?.stepLength ??
      r?.user?.stepLength ??
      r?.step_length ??
      r?.user_step_length ??
      0;

    const sl = Number(slRaw);

    return {
      userId: (r?.userId ?? r?.user?.id ?? r?.id) ?? null,
      name: String(r?.name ?? r?.user?.name ?? '—'),
      steps: Number(r?.numberOfSteps ?? r?.steps ?? 0),
      stepLength: Number.isFinite(sl) && sl > 0 ? sl : FIX_STEP_LENGTH_M,
    };
  });

  normalized.sort((a: any, b: any) => b.steps - a.steps);

  return normalized.map((r: any, i: number) => ({
    ...r,
    isUser: userId != null && r.userId === userId,
    rankColor: i === 0 ? '#C8A100' : i === 1 ? '#999999' : i === 2 ? '#C9716D' : null,
  }));
};

const MyChallenge: React.FC = () => {
  const router = useRouter();
  const [vm, setVm] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState<string | null>(null);

  const fmt = useMemo(() => new Intl.NumberFormat('de-DE'), []);
  const fmt1 = useMemo(() => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }), []);

  const challengeDistanceKm = useMemo(() => {
    const ch = vm?.challenge;
    const d = ch?.distanceKm ?? ch?.distance ?? 0;
    return Number(d || 0);
  }, [vm]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setRankingError(null);

      const raw = await getHomeInit();

      // Mapper can throw if backend returns challenge=null and mapper reads challenge.id
      let mapped: any = null;
      try {
        mapped = mapHomeInitToDashboard(raw, new Date()) as any;
      } catch (mapErr: any) {
        console.error('mapHomeInitToDashboard error', mapErr);

        // "No challenge" should not be treated as a hard error; fall back to safe vm
        setVm({ challenge: null, team: null, user: null });
        setRankings([]);
        setRankingLoading(false);
        setRankingError(null);
        setErrorMsg(null);
        return;
      }

      // If mapper returns nothing, treat as "no challenge", not as an error screen
      if (!mapped) {
        setVm({ challenge: null, team: null, user: null });
        setRankings([]);
        setRankingLoading(false);
        setRankingError(null);
        setErrorMsg(null);
        return;
      }

      setVm(mapped);

      // Only load ranking if we truly have both IDs
      if (mapped?.team?.id != null && mapped?.challenge?.id != null) {
        setRankingLoading(true);
        try {
          const rawRank = await getTeamRanking(mapped.team.id, mapped.challenge.id);
          setRankings(buildRankings(rawRank, mapped.user?.id));
        } catch (err: any) {
          console.error('TeamRanking error', err);
          setRankingError(err?.message ?? 'Fehler beim Laden des Team-Rankings.');
          setRankings([]);
        } finally {
          setRankingLoading(false);
        }
      } else {
        setRankings([]);
        setRankingLoading(false);
      }
    } catch (e: any) {
      console.error('ChallengeScreen loadData error', e);

      // If the error is specifically about missing challenge.id, show "no challenge" UI instead
      const msg = String(e?.message ?? '');
      if (msg.includes("Cannot read properties of null") && msg.includes("reading 'id'")) {
        setVm({ challenge: null, team: null, user: null });
        setErrorMsg(null);
        setRankings([]);
        setRankingLoading(false);
        setRankingError(null);
        return;
      }

      setErrorMsg(e?.message ?? 'Unbekannter Fehler beim Laden der Challenge-Daten.');
      setVm(null);
      setRankings([]);
      setRankingLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      return undefined;
    }, [loadData])
  );

  const [distanceKmDone, distancePct] = useMemo(() => {
    const targetKm = Number(challengeDistanceKm || 0);
    if (!rankings.length || !targetKm) return [0, 0];

    const kmSum = rankings.reduce((sum, r) => {
      const steps = Number(r?.steps || 0);
      const len = Number(r?.stepLength || 0) > 0 ? Number(r.stepLength) : FIX_STEP_LENGTH_M;
      return sum + (steps * len) / 1000;
    }, 0);

    const pct = Math.max(0, Math.min(100, (kmSum / Math.max(1, targetKm)) * 100));
    return [Number.isFinite(kmSum) ? kmSum : 0, Math.round(pct)];
  }, [rankings, challengeDistanceKm]);

  const daysLeft =
    typeof vm?.challenge?.daysLeft === 'number'
      ? Math.max(0, vm.challenge.daysLeft)
      : undefined;

  const hasRanking = !rankingLoading && !rankingError && rankings.length > 0;
  const noRanking = !rankingLoading && !rankingError && rankings.length === 0;

  // ===== Render Guards =====
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5F7F4',
        }}
      >
        <ActivityIndicator size="large" />
        <Text style={[styles.font, { marginTop: 12, color: '#2F3E34' }]}>
          Lade Challenge...
        </Text>
      </View>
    );
  }

  // Only show the red error screen when we *really* have an error.
  // "No challenge" should go to the card below.
  if (errorMsg && !vm) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5F7F4',
          padding: 24,
        }}
      >
        <Text
          style={[
            styles.font,
            { color: '#B91C1C', fontSize: 16, textAlign: 'center' },
          ]}
        >
          Ups, konnte Challenge-Daten nicht laden.
        </Text>
        <Text
          style={[
            styles.font,
            { color: '#6B7280', marginTop: 6, textAlign: 'center' },
          ]}
        >
          {String(errorMsg)}
        </Text>
      </View>
    );
  }

  const hasActiveChallenge = vm?.challenge?.id != null && vm?.challenge?.state === 'open';

  if (!hasActiveChallenge) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#F5F7F4',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: '#FFFFFF',
            borderRadius: 26,
            paddingVertical: 26,
            paddingHorizontal: 22,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 10 },
            elevation: 5,
          }}
        >
          <Text
            style={[
              styles.font,
              {
                fontSize: 18,
                fontWeight: '800',
                color: '#111',
                marginBottom: 6,
                textAlign: 'center',
              },
            ]}
          >
            Keine offene Challenge
          </Text>

          <Text
            style={[
              styles.font,
              {
                fontSize: 14,
                color: '#6B7280',
                lineHeight: 20,
                marginBottom: 22,
                textAlign: 'center',
              },
            ]}
          >
            Sieht so aus als hättest du keine offene Challenge. Schau dir die kommenden hier an.
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/challenges/activeChallenge')}
            activeOpacity={0.9}
            style={{
              backgroundColor: '#658869ff',
              paddingVertical: 14,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={[styles.font, { color: '#fff', fontWeight: '800', fontSize: 15 }]}>
              Zu den Challenges
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/userHistory')}
            activeOpacity={0.85}
            style={{
              paddingVertical: 12,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#D1D5DB',
              backgroundColor: '#F9FAFB',
            }}
          >
            <Text style={[styles.font, { color: '#374151', fontWeight: '700', fontSize: 14 }]}>
              Meine Challenge-Historie
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const startLocation = vm?.challenge?.startLocation || '—';
  const targetLocation = vm?.challenge?.targetLocation || '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }}>
      {/* CHALLENGE PROGRESS */}
      <View style={styles.progressCard}>
        <View style={{ marginBottom: 12 }}>
          {/* Team-Zeile */}
          <Text
            style={[
              styles.font,
              {
                fontSize: 25,
                fontWeight: '600',
                textAlign: 'center',
                color: '#4B5C50',
                marginTop: 2,
              },
            ]}
          >
            Team{' '}
            <Text style={{ color: '#6e865cff', fontWeight: '800' }}>
              {vm?.team?.name}
            </Text>
          </Text>

          {/* Challenge-Name */}
          <Text
            style={[
              styles.font,
              {
                fontSize: 18,
                fontWeight: '700',
                textAlign: 'center',
                color: '#2F3E34',
                marginTop: 12,
              },
            ]}
          >
            Challenge:{' '} {vm?.challenge?.name}
          </Text>
        </View>

        {/* Skala + Fortschritt */}
        <View style={styles.topScaleRow}>
          <Text style={[styles.scaleTick, styles.font]}>Start</Text>
          <Text style={[styles.scaleTick, styles.font]}>
            Ziel: {challengeDistanceKm} km
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${distancePct}%` }]} />
        </View>

        {/* Route darunter */}
        <Text
          style={[
            styles.font,
            {
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: 8,
              marginTop: 6,
              color: '#2F3E34',
            },
          ]}
        >
          {startLocation} → {targetLocation}
        </Text>

        {/* Map */}
        <LeafletOSMMap start={startLocation} end={targetLocation} />

        {/* Fortschritts-Text */}
        <Text style={[styles.progressNote, styles.font]}>
          <Text style={{ color: '#5F764E', fontWeight: '800' }}>
            {distancePct}%
          </Text>{' '}
          der Strecke geschafft. ({fmt1.format(distanceKmDone)} /{' '}
          {challengeDistanceKm} km)
          {typeof daysLeft === 'number' && (
            <>
              {'\n'}
              Noch <Text style={{ fontWeight: '900' }}>{daysLeft}</Text> Tage übrig.
            </>
          )}
        </Text>

        {/* TEAM RANKING */}
        <View style={styles.teamSectionHeader}>
          <Text style={[styles.teamSubtitle, styles.font]}>
            <Text style={{ color: '#7FA58C', fontWeight: '700' }}>
              Team-Mitglieder{' '}
            </Text>
            Ranking
          </Text>
        </View>

        {rankingLoading && (
          <View style={{ paddingVertical: 8 }}>
            <ActivityIndicator />
          </View>
        )}

        {rankingError && !rankingLoading && (
          <Text
            style={[
              styles.font,
              { color: '#B91C1C', marginVertical: 6, textAlign: 'center' },
            ]}
          >
            {rankingError}
          </Text>
        )}

        {noRanking && (
          <Text
            style={[
              styles.font,
              { color: '#6B7280', marginVertical: 6, textAlign: 'center' },
            ]}
          >
            Noch keine Ranking-Daten vorhanden.
          </Text>
        )}

        {hasRanking &&
          rankings.map((u, idx) => (
            <View
              key={`${u.userId ?? 'x'}-${idx}`}
              style={[styles.rankRow, u.isUser && styles.rankRowMe]}
            >
              <Text
                style={[
                  styles.rankBadge,
                  styles.font,
                  u.rankColor ? { color: u.rankColor } : null,
                ]}
              >
                {idx + 1}#
              </Text>
              <View style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.userName, styles.font]} numberOfLines={1}>
                    {u.name}
                  </Text>
                  {u.isUser ? (
                    <Text style={[styles.youNote, styles.font]}>(Du)</Text>
                  ) : null}
                </View>
                <Text style={[styles.userSteps, styles.font]}>
                  {fmt.format(u.steps)}
                </Text>
              </View>
            </View>
          ))}
      </View>
    </ScrollView>
  );
};

export default MyChallenge;
