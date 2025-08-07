import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Button, Alert } from 'react-native';
import { getToken, getUserId, removeToken } from '../lib/auth';
import { router } from 'expo-router';
import WelcomeCard from '../components/WelcomeCard';
import StatCard from '../components/StatCard';
import ChallengeBox from '../components/ChallengeBox';
import WeeklyStepsChart from '../components/WeeklyStepsChart';
import TeamPerformance from '../components/TeamPerformance';
import { useUser } from '../context/UserContext';

import Constants from 'expo-constants';
import React from 'react';
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

console.log("ARIFI " + API_BASE_URL);

interface SchrittLog {
  datum: string;
  anzahlSchritte: number;
}

interface TeamMemberView {
  id: number;
  name: string;
  steps: number;
}

export default function HomeScreen() {
  const { setUser } = useUser();
  const [user, setUserLocal] = useState<any>(null);
  const [stepsToday, setStepsToday] = useState(0);
  const [distanceToday, setDistanceToday] = useState(0);
  const [weeklySteps, setWeeklySteps] = useState<number[]>([]);
  const [challenge, setChallenge] = useState<any>(null);
  const [teamPerformance, setTeamPerformance] = useState<TeamMemberView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const token = await getToken();
        const userId = await getUserId();

        if (!token || !userId) return;
        const headers = { Authorization: `Bearer ${token}` };
        const userRes = await fetch(`${API_BASE_URL}/users/${userId}`, { headers });
        const userData = await userRes.json();
        setUser(userData); // Context
        setUserLocal(userData); // Lokaler State

        // Rest deiner Logik (Logs, Challenge, Team ...) bleibt unverändert
        const logsRes = await fetch(`${API_BASE_URL}/step_logs/user/${userId}`, { headers });
        const logs: SchrittLog[] = await logsRes.json();

        const todayStr = today.toISOString().split('T')[0];
        const todayLog = logs.find((l) => {
          const [datePart] = l.datum.split(',');
          const [day, month, year] = datePart.trim().split('.').map(Number);
          const logDate = new Date(year, month - 1, day);
          return logDate.toISOString().split('T')[0] === todayStr;
        });
        const steps = todayLog?.anzahlSchritte ?? 0;
        setStepsToday(steps);
        setDistanceToday(steps * userData.schrittlaenge / 1000);
        setStepsToday(Math.round(steps));

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const recentLogs = logs.filter((entry) => {
          const [datePart] = entry.datum.split(',');
          const [day, month, year] = datePart.trim().split('.').map(Number);
          const entryDate = new Date(year, month - 1, day);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate >= sevenDaysAgo && entryDate <= today;
        });

        const stepsByDay: number[] = [0, 0, 0, 0, 0, 0, 0];
        recentLogs.forEach((entry) => {
          const [datePart] = entry.datum.split(',');
          const [day, month, year] = datePart.trim().split('.').map(Number);
          const date = new Date(year, month - 1, day);
          const dayOfWeek = date.getDay();
          const index = (dayOfWeek + 6) % 7;
          stepsByDay[index] += entry.anzahlSchritte;
        });

        setWeeklySteps(stepsByDay);

        const progressRes = await fetch(`${API_BASE_URL}/challenge-progress/user/${userId}`, { headers }); //OK
        const progress = await progressRes.json();
        if (progress.length > 0) {
          const challengeId = progress[0].challengeId;
          const challengeRes = await fetch(`${API_BASE_URL}/challenges/${challengeId}`, { headers });  //OK
          const challengeData = await challengeRes.json();
          setChallenge({ ...challengeData, fortschrittKm: progress[0].gelaufeneStrecke });
        }

        const teamMemberRes = await fetch(`${API_BASE_URL}/team-members/${userId}`, { headers }); //OK
        const teamData = await teamMemberRes.json();
        const teamId = teamData.teamId;
        const allMembersRes = await fetch(`${API_BASE_URL}/team-members/team/${teamId}`, { headers });
        const members = await allMembersRes.json();

        const memberStats: TeamMemberView[] = await Promise.all(
          members.map(async (m: any): Promise<TeamMemberView> => {
            const userRes = await fetch(`${API_BASE_URL}/users/${m.userId}`, { headers }); //OK
            const u = await userRes.json();
            const logsRes = await fetch(`${API_BASE_URL}/step_logs/user/${m.userId}`, { headers });
            const logs: SchrittLog[] = await logsRes.json();
            const total = logs.reduce((sum: number, l) => sum + l.anzahlSchritte, 0);

            return { id: u.id, name: u.name, steps: total };
          })
        );
        setTeamPerformance(memberStats);
      } catch (err) {
        console.error('Fehler beim Laden:', err);
        Alert.alert('Fehler', 'Dashboard konnte nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);



  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#1b5e20" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <WelcomeCard name={user?.name} />
      <View style={styles.cardRow}>
        <StatCard value={stepsToday.toString()} label="Schritte heute" />
        <StatCard value={distanceToday.toFixed(2) + ' km'} label="Distanz" />
      </View>
      {challenge && <ChallengeBox challenge={challenge} />}
      <WeeklyStepsChart steps={weeklySteps} />
      <TeamPerformance members={teamPerformance} />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  logoutBtn: { marginTop: 30 },
});



