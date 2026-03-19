import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import BottomBar, { BOTTOMBAR_AIR, BOTTOMBAR_HEIGHT } from '../components/BottomBar';

import {
  dayLabelDe,
  mapHomeInitToDashboard,
  startOfWeek,
} from '../services/dto/dashboardDto';

import { getHomeInit, upsertStepsForDate } from '../services/dashboardService';
import styles from './styles/dashboardStyles';

const { width: screenWidth } = Dimensions.get('window');

const EMPTY_WEEK = [0, 0, 0, 0, 0, 0, 0];
const FIX_STEP_LENGTH_M = 0.78;

// timezone-safe ISO
const toIsoUtcMidnight = (d: Date) => {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
};

export default function PedometerScreen() {
  const router = useRouter();
  const pathname = usePathname();

  const [vm, setVm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [weekSteps, setWeekSteps] = useState<number[]>([...EMPTY_WEEK]);

  // PEDOMETER STATE
  const [isTracking, setIsTracking] = useState(false);
  const [sessionSteps, setSessionSteps] = useState(0);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState<boolean | null>(null);

  const subscriptionRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, []);

  // ========= INIT =========
  const loadInitial = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const available = await Pedometer.isAvailableAsync();
      if (isMountedRef.current) {
        setIsPedometerAvailable(available);
      }

      const raw = await getHomeInit();
      if (!isMountedRef.current) return;

      const mapped = mapHomeInitToDashboard(raw, startOfWeek(new Date()));
      console.log('Pedometer raw init:', raw);
      console.log('Pedometer mapped init:', mapped);

      setVm(mapped);

      const weekArr =
        Array.isArray(mapped?.steps_this_week) && mapped.steps_this_week.length > 0
          ? mapped.steps_this_week.map((s: any) => Number(s?.numberOfSteps ?? 0))
          : [...EMPTY_WEEK];

      setWeekSteps(weekArr);
    } catch (e: any) {
      console.warn('loadInitial failed:', e);

      if (!isMountedRef.current) return;

      setVm(null);
      setWeekSteps([...EMPTY_WEEK]);
      setErrorMsg(e?.message ?? 'Fehler beim Laden der Daten.');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  // ========= PEDOMETER =========
  const startTracking = async () => {
    try {
      const available = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(available);

      if (!available) {
        setErrorMsg('Pedometer ist auf diesem Gerät nicht verfügbar.');
        return;
      }

      if (!vm?.challenge?.id || vm?.challenge?.state !== 'open') {
        setErrorMsg('Du kannst nur Schritte tracken, wenn eine aktive Challenge vorhanden ist.');
        return;
      }

      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      setErrorMsg(null);
      setSessionSteps(0);
      setSessionStart(null);
      setIsTracking(true);

      subscriptionRef.current = Pedometer.watchStepCount((result) => {
        const total = Number(result?.steps ?? 0);

        setSessionStart((prev) => {
          const base = prev ?? total;
          const counted = total - base;
          setSessionSteps(counted > 0 ? counted : 0);
          return base;
        });
      });
    } catch (e: any) {
      console.warn('startTracking failed:', e);
      setIsTracking(false);
      setErrorMsg('Pedometer konnte nicht gestartet werden.');
    }
  };

  const stopTracking = async () => {
    try {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      setIsTracking(false);

      if (sessionSteps > 0) {
        await saveSteps(sessionSteps);
      }
    } catch (e) {
      console.warn('stopTracking failed:', e);
    } finally {
      setSessionSteps(0);
      setSessionStart(null);
    }
  };

  // ========= SAVE =========
  const saveSteps = async (stepsToAdd: number) => {
    if (!vm?.user?.id || !vm?.challenge?.id || !vm?.team?.id) return;

    const today = new Date();
    const idx = (today.getDay() + 6) % 7;

    const current = Number(weekSteps[idx] ?? 0);
    const next = current + Math.max(0, Math.floor(stepsToAdd));

    const updated = [...weekSteps];
    updated[idx] = next;
    setWeekSteps(updated);

    try {
      await upsertStepsForDate(vm.user.id, toIsoUtcMidnight(today), next, {
        challengeId: vm.challenge.id,
        teamId: vm.team.id,
      });
    } catch (e) {
      console.warn('saveSteps failed:', e);

      const rollback = [...weekSteps];
      rollback[idx] = current;
      setWeekSteps(rollback);
      setErrorMsg('Schritte konnten nicht gespeichert werden.');
    }
  };

  // ========= TODAY STEPS =========
  const stepsTodayStored = useMemo(() => {
    const today = new Date();
    const idx = (today.getDay() + 6) % 7;
    return Number(weekSteps[idx] ?? 0);
  }, [weekSteps]);

  const stepsTodayLive = useMemo(() => {
    return stepsTodayStored + (isTracking ? sessionSteps : 0);
  }, [stepsTodayStored, isTracking, sessionSteps]);

  // ========= METRICS =========
  const stepLength = vm?.user?.stepLength || FIX_STEP_LENGTH_M;
  const distanceKm = ((stepsTodayLive * stepLength) / 1000).toFixed(2);
  const kcal = (stepsTodayLive * 0.04).toFixed(0);

  const weeklyTotal = weekSteps.reduce((a, b) => a + Number(b || 0), 0);
  const weeklyMax = Math.max(1, ...weekSteps);

  const hasActiveChallenge =
    vm?.challenge?.id != null && vm?.challenge?.state === 'open';

  if (loading) {
    return (
      <>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#F5F7F4',
          }}
        >
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 12 }}>Lade Daten...</Text>
        </View>
        <BottomBar pathname={pathname} />
      </>
    );
  }

  if (!hasActiveChallenge) {
    return (
      <>
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
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                backgroundColor: '#e3efe6',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                alignSelf: 'center',
              }}
            >
              <Ionicons name="walk-outline" size={22} color="#2f5c3a" />
            </View>

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
              Keine aktive Challenge
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
              Du kannst den Schrittzähler nur verwenden, wenn eine Challenge aktiv ist.
              Schau dir die aktiven oder kommenden Challenges an.
            </Text>

            {errorMsg ? (
              <Text
                style={[
                  styles.font,
                  {
                    color: '#B91C1C',
                    textAlign: 'center',
                    marginBottom: 16,
                  },
                ]}
              >
                {errorMsg}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={() => router.push('/challenges/activeChallenges')}
              style={{
                backgroundColor: '#658869',
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
              onPress={loadInitial}
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
                Neu laden
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <BottomBar pathname={pathname} />
      </>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: BOTTOMBAR_HEIGHT + BOTTOMBAR_AIR + 40,
          paddingTop: 20,
        }}
      >
        <View style={styles.topSection}>
          <Text style={[styles.date, styles.font]}>
            {new Date().toLocaleDateString('de-DE')}
          </Text>

          <Text style={[styles.font, { textAlign: 'center', marginTop: 8 }]}>
            {vm?.user?.name ?? '—'}
          </Text>

          <View style={styles.hr} />

          <Text style={[styles.challengeRow, styles.font]}>
            {vm?.challenge?.startLocation ?? '—'} → {vm?.challenge?.targetLocation ?? '—'}
          </Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricSide}>
              <Ionicons name="flame" size={screenWidth < 380 ? 20 : 22} color="#E25822" />
              <Text>{kcal}</Text>
              <Text>Kcal</Text>
            </View>

            <View style={styles.stepCircleWrapper}>
              <View style={styles.stepCircleOuter}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepValue}>{stepsTodayLive}</Text>
                  <Text style={styles.stepLabel}>HEUTE</Text>
                </View>
              </View>
            </View>

            <View style={styles.metricSide}>
              <MaterialIcons name="place" size={screenWidth < 380 ? 20 : 22} color="#F54927" />
              <Text>{distanceKm}</Text>
              <Text>km</Text>
            </View>
          </View>

          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <Text>Session</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
              {sessionSteps}
            </Text>
          </View>

          {errorMsg ? (
            <Text style={{ marginTop: 12, textAlign: 'center', color: '#B91C1C' }}>
              {errorMsg}
            </Text>
          ) : null}

          {isPedometerAvailable === false ? (
            <Text style={{ marginTop: 12, textAlign: 'center', color: '#6B7280' }}>
              Pedometer ist auf diesem Gerät nicht verfügbar.
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.editBtn, (isTracking || isPedometerAvailable === false) && { opacity: 0.5 }]}
            disabled={isTracking || isPedometerAvailable === false}
            onPress={startTracking}
          >
            <Text style={styles.editBtnText}>Start</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.editBtn,
              { marginTop: 10, backgroundColor: '#B91C1C' },
              !isTracking && { opacity: 0.5 },
            ]}
            disabled={!isTracking}
            onPress={stopTracking}
          >
            <Text style={[styles.editBtnText, { color: '#fff' }]}>
              Stopp & speichern
            </Text>
          </TouchableOpacity>

          <Text style={styles.weeklyTitle}>
            Diese Woche: {weeklyTotal}
          </Text>

          <View style={styles.weekChart}>
            {weekSteps.map((value, i) => {
              const height = (Number(value ?? 0) / weeklyMax) * 120;
              return (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height }]} />
                  </View>
                  <Text>{dayLabelDe[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <BottomBar pathname={pathname} />
    </>
  );
}