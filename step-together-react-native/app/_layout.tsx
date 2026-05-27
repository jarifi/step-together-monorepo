import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import GlobalNav from '../components/GlobalNav';
import Sidebar from '../components/Sidebar';
import { UserProvider, useUser } from '../context/UserContext';
import { useColorScheme } from '../hooks/useColorScheme';
import { isLoggedIn } from '../lib/auth';
import {
  getChallengeById,
  getMyInvites,
} from '../services/challengeService';

const queryClient = new QueryClient();
const PHONE_HEADER_HEIGHT = 0;
const PUBLIC_ROUTES = ['/', '/login', '/register', '/welcome', '/verifyInfo'];
const SHOWN_POPUP_KEY = 'shown_invite_popup_ids';

const asArray = (x: any): any[] => {
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.content)) return x.content;
  if (Array.isArray(x?.data)) return x.data;
  if (Array.isArray(x?.items)) return x.items;
  return [];
};

export default function RootLayout() {
  return (
    <UserProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </UserProvider>
  );
}

function AppContent() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { setPendingInviteCount, token } = useUser();

  const isTablet = width >= 768;

  const [authChecked, setAuthChecked] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);

  const contentLeft = useRef(new Animated.Value(0)).current;
  const redirectingRef = useRef(false);
  const mountedRef = useRef(true);

  const [inviteAlert, setInviteAlert] = useState<{
    challenge: any;
    inviteId: any;
    inviterName?: string;
  } | null>(null);
  const alertSlide = useRef(new Animated.Value(-220)).current;
  const inviteAlertRef = useRef(inviteAlert);
  inviteAlertRef.current = inviteAlert;

  const isPublicRoute = useMemo(() => PUBLIC_ROUTES.includes(pathname), [pathname]);

  useEffect(() => {
    mountedRef.current = true;

    const checkAuth = async () => {
      try {
        const loggedIn = await isLoggedIn();
        if (!mountedRef.current) return;

        if (!loggedIn && !isPublicRoute) {
          if (!redirectingRef.current) {
            redirectingRef.current = true;
            router.replace('/');
          }
          return;
        }

        redirectingRef.current = false;
        const shouldShow = loggedIn && !isPublicRoute;
        setShowSidebar(shouldShow);
        if (!shouldShow) setSidebarOpen(false);
      } catch (err) {
        console.error('Auth check failed:', err);
        if (!redirectingRef.current) {
          redirectingRef.current = true;
          router.replace('/');
        }
      } finally {
        if (mountedRef.current) setAuthChecked(true);
      }
    };

    checkAuth();
    return () => { mountedRef.current = false; };
  }, [pathname, isPublicRoute]);

  useEffect(() => {
    if (!authChecked) return;
    const target = showSidebar ? (isTablet ? sidebarWidth : 0) : 0;
    Animated.timing(contentLeft, {
      toValue: target,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [authChecked, showSidebar, isTablet, sidebarWidth, contentLeft]);

  useEffect(() => {
    if (isTablet) setSidebarOpen(false);
  }, [isTablet]);

const contentTopPadding = useMemo(
    () => (showSidebar && !isTablet ? PHONE_HEADER_HEIGHT : 0),
    [showSidebar, isTablet]
  );

  const showAlert = useCallback(
    (challenge: any, inviteId: any, inviterName?: string) => {
      setInviteAlert({ challenge, inviteId, inviterName });
      alertSlide.setValue(-220);
      Animated.spring(alertSlide, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }).start();
    },
    [alertSlide]
  );

  const hideAlert = useCallback(() => {
    Animated.timing(alertSlide, {
      toValue: -220,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setInviteAlert(null));
  }, [alertSlide]);

  // ✅ auto dismiss
  useEffect(() => {
    if (!inviteAlert) return;
    const timer = setTimeout(() => hideAlert(), 3000);
    return () => clearTimeout(timer);
  }, [inviteAlert, hideAlert]);

  // Keep refs to the latest callbacks so the interval never needs to be
  // recreated when they change identity between renders.
  const showAlertRef = useRef(showAlert);
  showAlertRef.current = showAlert;
  const setPendingRef = useRef(setPendingInviteCount);
  setPendingRef.current = setPendingInviteCount;

  // The check function lives in a ref so setInterval captures a stable pointer.
  // Re-assigning every render ensures it always closes over fresh values.
  const checkRef = useRef(async () => { });
  checkRef.current = async () => {
    if (!token) {
      setPendingRef.current(0);
      return;
    }

    if (inviteAlertRef.current) return;
    try {
      const data = await getMyInvites();
      const pending = asArray(data).filter((i: any) => i.status === 'pending');
      setPendingRef.current(pending.length);
      if (pending.length === 0) return;

      const raw = await AsyncStorage.getItem(SHOWN_POPUP_KEY);
      const shown = new Set<string>(raw ? JSON.parse(raw) : []);
      const newInvite = pending.find((i: any) => !shown.has(String(i.id)));
      if (!newInvite) return;

      shown.add(String(newInvite.id));
      await AsyncStorage.setItem(SHOWN_POPUP_KEY, JSON.stringify([...shown]));

      const challenge = await getChallengeById(newInvite.challengeId ?? newInvite.challenge_id);
      showAlertRef.current(
        challenge,
        newInvite.id,
        newInvite.inviterName ?? newInvite.inviter_name ?? newInvite.inviter?.name
      );
    } catch { }
  };

  // Fire immediately whenever the user navigates to a new screen
  useEffect(() => {
    if (!showSidebar || !token) return;
    checkRef.current();
  }, [pathname, showSidebar, token]);

  // Poll every 15 s — only depends on showSidebar so the interval is never
  // accidentally reset by a render or function-reference change.
  useEffect(() => {
    if (!showSidebar || !token) return;
    const id = setInterval(() => checkRef.current(), 15000);
    return () => clearInterval(id);
  }, [showSidebar, token]);

  if (!authChecked) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#698059ff" />
          <Text style={styles.loadingText}>Step Together</Text>
        </View>
        <StatusBar style="dark" />
        <Toast />
      </ThemeProvider>
    );
  }

  const alertTop = showSidebar && !isTablet ? PHONE_HEADER_HEIGHT + 8 : insets.top + 8;
  const alertLeft = isTablet ? sidebarWidth + 12 : 12;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {showSidebar && (
        <Sidebar
          isOpen={isTablet ? true : sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
          onWidthChange={setSidebarWidth}
        />
      )}

      {inviteAlert && (
        <Animated.View
          style={[
            styles.alertBanner,
            { top: alertTop, left: alertLeft, transform: [{ translateY: alertSlide }] },
          ]}
        >
          <Pressable
            style={styles.alertTouchable}
            onPress={() => { hideAlert(); router.push('/notifications'); }}
          >
            <View style={styles.alertIconWrap}>
              <Ionicons name="notifications" size={20} color="#92400E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>
                {inviteAlert.inviterName
                  ? `${inviteAlert.inviterName} hat dich zu einer Challenge eingeladen. Bist du dabei?`
                  : 'Du wurdest zu einer Challenge eingeladen. Bist du dabei?'}
              </Text>
              <Text style={styles.alertSub} numberOfLines={1}>
                {inviteAlert.challenge?.name
                  ? `${inviteAlert.challenge.name} · `
                  : ''}
                <Text style={styles.alertLink}>Klick für mehr Infos</Text>
              </Text>
            </View>
          </Pressable>
          <Pressable onPress={hideAlert} style={styles.alertCloseBtn} hitSlop={10}>
            <Ionicons name="close" size={16} color="#576058" />
          </Pressable>
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.contentWrap,
          {
            marginLeft: contentLeft,
            paddingTop: contentTopPadding,
          },
        ]}
      >
        <Stack initialRouteName="index">
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="users/update" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="teams/index" options={{ headerShown: false }} />
          <Stack.Screen name="teams/create" options={{ headerShown: false }} />
          <Stack.Screen name="teams/members" options={{ headerShown: false }} />
          <Stack.Screen name="users/index" options={{ headerShown: false }} />
          <Stack.Screen name="challenges/challengeTeamDashboardDetails" options={{ headerShown: false }} />
          <Stack.Screen name="challenges/challengeIndividualDashboardDetails" options={{ headerShown: false }} />
          <Stack.Screen name="challenges/index" options={{ headerShown: false }} />
          <Stack.Screen name="challenges/adminCreate" options={{ headerShown: false }} />
          <Stack.Screen name="challenges/hybridIndex" options={{ headerShown: false }} />
          <Stack.Screen name="challenges/challengesDashboard" options={{ headerShown: false }} />
          <Stack.Screen name="challenges/create" options={{ headerShown: false }} />
          <Stack.Screen name="challenges/update" options={{ headerShown: false }} />
          <Stack.Screen name="challenges/details" options={{ headerShown: false }} />
          <Stack.Screen name="challenges/challengeTeamDashboard" options={{ headerShown: false }} />
          <Stack.Screen name="challenges/challengeIndividualDashboard" options={{ headerShown: false }} />
          <Stack.Screen name="challenges/activeChallenges" options={{ headerShown: false }} />
          <Stack.Screen name="userHistory" options={{ headerShown: false }} />
          <Stack.Screen name="profileInfo" options={{ headerShown: false }} />
          <Stack.Screen name="settings/settings" options={{ headerShown: false }} />
          <Stack.Screen name="settings/profile" options={{ headerShown: false }} />
          <Stack.Screen name="settings/password" options={{ headerShown: false }} />
          <Stack.Screen name="settings/userDelete" options={{ headerShown: false }} />
          <Stack.Screen name="users/create" options={{ headerShown: false }} />
          <Stack.Screen name="help/start" options={{ headerShown: false }} />
          <Stack.Screen name="help/help" options={{ headerShown: false }} />
          <Stack.Screen name="help/about" options={{ headerShown: false }} />
          <Stack.Screen name="help/contact" options={{ headerShown: false }} />
          <Stack.Screen name="help/privacy" options={{ headerShown: false }} />
          <Stack.Screen name="help/terms" options={{ headerShown: false }} />
          <Stack.Screen name="teams/update" options={{ headerShown: false }} />
          <Stack.Screen name="verifyInfo" options={{ headerShown: false }} />
          <Stack.Screen name="CreateHybridChallenge" options={{ headerShown: false }} />
          <Stack.Screen name="hybridUpdate" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
        </Stack>

        {showSidebar && !isTablet && <GlobalNav pathname={pathname} />}
      </Animated.View>

      <StatusBar style="dark" />
      <Toast />
    </ThemeProvider>
  );
}

// styles unchanged

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#313633c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  alertBanner: {
    position: 'absolute',
    right: 12,
    zIndex: 1100,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(234,179,8,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 8 },
    }),
  },
  alertTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  alertIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(234,179,8,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111714',
    lineHeight: 18,
  },
  alertSub: {
    fontSize: 12,
    color: '#576058',
    marginTop: 3,
  },
  alertLink: {
    fontSize: 12,
    color: '#1B7A42',
    fontWeight: '700',
  },
  alertCloseBtn: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
});
