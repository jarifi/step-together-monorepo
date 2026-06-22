import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import ChallengeTabs from '../../../components/ChallengeTabs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import Avatar from '../../../components/Avatar';
import { LeafletOSMMap } from '../../../components/LeafletOSMMap';
import { getChallengeById, getChallengeParticipants } from '../../../services/challengeService';
import { getHomeInit } from '../../../services/dashboardService';
import { mapHomeInitToDashboard } from '../../../services/dto/dashboardDto';
import styles from '../../styles/dashboardStyles';

const FIX_STEP_LENGTH_M = 0.78;

// ===== Time helpers (days + hours + minutes) =====
const parseMaybeDate = (v: any): Date | null => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
};

const formatTimeLeftDe = (msLeft: number) => {
    const clamped = Math.max(0, msLeft);

    const totalMinutes = Math.floor(clamped / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? 'Tag' : 'Tage'}`);
    if (hours > 0 || days > 0) parts.push(`${hours} Std`);
    parts.push(`${minutes} Min`);

    return parts.join(' ');
};

const firstParam = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');

const toMaybeNumber = (value: string | string[] | undefined): number | null => {
    const raw = firstParam(value).trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
};

const buildRankings = (
    rawRank: any[],
    userId: number | null | undefined,
    fallbackStepLengthM?: number | null
) => {
    const fallback =
        Number(fallbackStepLengthM) > 0 ? Number(fallbackStepLengthM) : FIX_STEP_LENGTH_M;

    const normalized = rawRank.map((r: any) => {
        const slRaw =
            r?.stepLength ??
            r?.user?.stepLength ??
            r?.step_length ??
            r?.user_step_length ??
            null;

        const sl = Number(slRaw);

        return {
            userId: (r?.userId ?? r?.user?.id ?? r?.id) ?? null,
            name: String(r?.name ?? r?.user?.name ?? '—'),
            steps: Number(r?.totalSteps ?? r?.numberOfSteps ?? r?.steps ?? 0),
            stepLength: Number.isFinite(sl) && sl > 0 ? sl : fallback,
            email: r?.email ?? r?.user?.email ?? null,
            userRaw: r?.user ? { ...r, ...r.user } : r,
        };
    });

    normalized.sort((a: any, b: any) => b.steps - a.steps);

    return normalized.map((r: any, i: number) => ({
        ...r,
        isUser: userId != null && r.userId === userId,
        rankColor: i === 0 ? '#C8A100' : i === 1 ? '#999999' : i === 2 ? '#C9716D' : null,
    }));
};

const challengeIndividualDashboardDetailsScreen: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const selectedChallengeId = useMemo(
        () => toMaybeNumber(params?.id as string | string[] | undefined),
        [params?.id]
    );
    const [vm, setVm] = useState<any>(null);
    const [rankings, setRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [rankingLoading, setRankingLoading] = useState(false);
    const [rankingError, setRankingError] = useState<string | null>(null);

    const [nowMs, setNowMs] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNowMs(Date.now()), 60_000);
        return () => clearInterval(id);
    }, []);

    const fmt = useMemo(() => new Intl.NumberFormat('de-DE'), []);
    const fmt1 = useMemo(() => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }), []);

    const challengeDistanceKm = useMemo(() => {
        const ch = vm?.challenge;
        const d = ch?.distanceKm ?? ch?.distance ?? 0;
        return Number(d || 0);
    }, [vm]);

    const myStepLengthM = useMemo(() => {
        const raw = vm?.user?.stepLength ?? vm?.user?.step_length ?? vm?.user_step_length ?? null;
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [vm]);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMsg(null);
            setRankingError(null);

            const raw = await getHomeInit();

            let mapped: any = null;
            try {
                mapped = mapHomeInitToDashboard(raw, new Date()) as any;
            } catch (mapErr: any) {
                console.error('mapHomeInitToDashboard error', mapErr);
                setVm({ challenge: null, team: null, user: null });
                setRankings([]);
                setRankingLoading(false);
                setRankingError(null);
                setErrorMsg(null);
                return;
            }

            if (!mapped) {
                setVm({ challenge: null, team: null, user: null });
                setRankings([]);
                setRankingLoading(false);
                setRankingError(null);
                setErrorMsg(null);
                return;
            }

            let vmToUse = mapped;
            if (selectedChallengeId != null) {
                try {
                    const selected = await getChallengeById(selectedChallengeId);
                    const selectedStart = selected?.startDate ?? selected?.start_date ?? null;
                    const selectedEnd = selected?.endDate ?? selected?.end_date ?? null;

                    vmToUse = {
                        ...mapped,
                        challenge: {
                            ...mapped?.challenge,
                            id: selectedChallengeId,
                            name: selected?.name ?? mapped?.challenge?.name,
                            startLocation:
                                selected?.startLocation ??
                                selected?.start_location ??
                                mapped?.challenge?.startLocation,
                            targetLocation:
                                selected?.targetLocation ??
                                selected?.target_location ??
                                mapped?.challenge?.targetLocation,
                            distanceKm: Number(selected?.distanceKm ?? selected?.distance ?? mapped?.challenge?.distanceKm ?? 0),
                            distance: Number(selected?.distanceKm ?? selected?.distance ?? mapped?.challenge?.distanceKm ?? 0),
                            startDate: selectedStart ? new Date(selectedStart) : mapped?.challenge?.startDate,
                            endDate: selectedEnd ? new Date(selectedEnd) : mapped?.challenge?.endDate,
                            state: String(selected?.state ?? mapped?.challenge?.state ?? ''),
                        },
                    };
                } catch (err) {
                    console.warn('Failed to load selected challenge in details, fallback to mapped challenge:', err);
                }
            }

            setVm(vmToUse);

            if (vmToUse?.challenge?.id != null) {
                setRankingLoading(true);
                try {
                    const challengeId = vmToUse.challenge.id;

                    const rawRank = await getChallengeParticipants(challengeId);

                    const fallbackRaw =
                        vmToUse?.user?.stepLength ??
                        vmToUse?.user?.step_length ??
                        vmToUse?.user_step_length ??
                        null;

                    const fallbackN = Number(fallbackRaw);
                    const fallbackStepLength = Number.isFinite(fallbackN) && fallbackN > 0 ? fallbackN : null;

                    setRankings(buildRankings(rawRank, vmToUse.user?.id, fallbackStepLength));
                } catch (err: any) {
                    setRankingError(err?.message ?? 'Fehler beim Laden der Teilnehmerliste.');
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

            const msg = String(e?.message ?? '');
            if (msg.includes('Cannot read properties of null') && msg.includes("reading 'id'")) {
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
    }, [selectedChallengeId]);

    useFocusEffect(
        useCallback(() => {
            loadData();
            return undefined;
        }, [loadData])
    );

    const [distanceKmDone, distancePct] = useMemo(() => {
        const targetKm = Number(challengeDistanceKm || 0);
        if (!rankings.length || !targetKm) return [0, 0];

        const fallback = Number(myStepLengthM) > 0 ? Number(myStepLengthM) : FIX_STEP_LENGTH_M;

        const kmSum = rankings.reduce((sum, r) => {
            const steps = Number(r?.steps || 0);
            const lenRaw = Number(r?.stepLength || 0);
            const len = lenRaw > 0 ? lenRaw : fallback;
            return sum + (steps * len) / 1000;
        }, 0);

        const pct = Math.max(0, Math.min(100, (kmSum / Math.max(1, targetKm)) * 100));
        return [Number.isFinite(kmSum) ? kmSum : 0, Math.round(pct)];
    }, [rankings, challengeDistanceKm, myStepLengthM]);

    const timeLeftText = useMemo(() => {
        const ch = vm?.challenge;

        // Prefer real end-date fields if your backend provides them
        const end =
            parseMaybeDate(ch?.endsAt ?? ch?.endDate ?? ch?.end_at ?? ch?.end_date) ?? null;

        // Fallback: build an approximate end-date from daysLeft
        let endFallback: Date | null = null;
        if (!end && typeof ch?.daysLeft === 'number') {
            endFallback = new Date(nowMs + Math.max(0, ch.daysLeft) * 24 * 60 * 60 * 1000);
        }

        const endDate = end ?? endFallback;
        if (!endDate) return null;

        const msLeft = endDate.getTime() - nowMs;
        return formatTimeLeftDe(msLeft);
    }, [vm, nowMs]);

    const hasRanking = !rankingLoading && !rankingError && rankings.length > 0;
    const noRanking = !rankingLoading && !rankingError && rankings.length === 0;

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
                <Text style={[styles.font, { marginTop: 12, color: '#2F3E34' }]}>Lade Challenge...</Text>
            </View>
        );
    }

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
                <Text style={[styles.font, { color: '#B91C1C', fontSize: 16, textAlign: 'center' }]}>
                    Ups, konnte Challenge-Daten nicht laden.
                </Text>
                <Text style={[styles.font, { color: '#6B7280', marginTop: 6, textAlign: 'center' }]}>
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
    const overviewPath = vm?.challenge?.id ? `/challenges/dashboard/challengeIndividualDashboard?id=${vm.challenge.id}` : '/challenges/dashboard/challengeIndividualDashboard';
    const rankingPath = vm?.challenge?.id ? `/challenges/dashboard/challengeIndividualDashboardDetails?id=${vm.challenge.id}` : '/challenges/dashboard/challengeIndividualDashboardDetails';

    return (
        <View style={{ flex: 1 }}>
        <ChallengeTabs active="ranking" overviewPath={overviewPath} rankingPath={rankingPath} />
        <ScrollView style={[styles.container, { paddingTop: 0 }]} contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}>
            <View style={styles.progressCard}>
                <View style={{ marginBottom: 12 }}>
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
                        Individual Challenge{' '}
                        <Text style={{ color: '#6e865cff', fontWeight: '800' }}>{vm?.team?.name}</Text>
                    </Text>

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

                <View style={styles.topScaleRow}>
                    <Text style={[styles.scaleTick, styles.font]}>Start</Text>
                    <Text style={[styles.scaleTick, styles.font]}>Ziel: {challengeDistanceKm} km</Text>
                </View>

                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${distancePct}%` }]} />
                </View>

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

                <LeafletOSMMap start={startLocation} end={targetLocation} />

                <Text style={[styles.progressNote, styles.font]}>
                    <Text style={{ color: '#5F764E', fontWeight: '800' }}>
                        {distancePct}%
                    </Text>{' '}
                    der Strecke geschafft.
                    {'\n'}
                    ({fmt1.format(distanceKmDone)} / {challengeDistanceKm} km)

                    {timeLeftText && (
                        <>
                            {'\n'}
                            Noch <Text style={{ fontWeight: '900' }}>{timeLeftText}</Text> übrig.
                        </>
                    )}
                </Text>

                <View style={styles.teamSectionHeader}>
                    <Text style={[styles.teamSubtitle, styles.font]}>
                        <Text style={{ color: '#7FA58C', fontWeight: '700' }}>Teilnehmer </Text>
                        Ranking
                    </Text>
                </View>

                {rankingLoading && (
                    <View style={{ paddingVertical: 8 }}>
                        <ActivityIndicator />
                    </View>
                )}

                {rankingError && !rankingLoading && (
                    <Text style={[styles.font, { color: '#B91C1C', marginVertical: 6, textAlign: 'center' }]}>
                        {rankingError}
                    </Text>
                )}

                {noRanking && (
                    <Text style={[styles.font, { color: '#6B7280', marginVertical: 6, textAlign: 'center' }]}>
                        Noch keine Ranking-Daten vorhanden.
                    </Text>
                )}

                {hasRanking &&
                    rankings.map((u, idx) => (
                        <View key={`${u.userId ?? 'x'}-${idx}`} style={[styles.rankRow, u.isUser && styles.rankRowMe]}>
                            <Text
                                style={[
                                    styles.rankBadge,
                                    styles.font,
                                    u.rankColor ? { color: u.rankColor } : null,
                                ]}
                            >
                                {idx + 1}#
                            </Text>

                            <View style={{ marginRight: 25 }}>
                                <Avatar user={u.userRaw} name={u.name} size={54} />
                            </View>

                            <View style={{ flex: 1 }}>
                                <View style={styles.rowBetween}>
                                    <Text style={[styles.userName, styles.font]} numberOfLines={1}>
                                        {u.name}
                                    </Text>
                                    {u.isUser ? <Text style={[styles.youNote, styles.font]}>(Du)</Text> : null}
                                </View>
                                <Text style={[styles.userSteps, styles.font]}>{fmt.format(u.steps)}</Text>
                            </View>
                        </View>
                    ))}
            </View>
        </ScrollView>
        </View>
    );
};

export default challengeIndividualDashboardDetailsScreen;