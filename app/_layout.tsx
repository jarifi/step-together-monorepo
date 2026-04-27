//file: app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

import BottomBar from '../components/BottomBar';
import Sidebar from '../components/Sidebar';

import { UserProvider } from '../context/UserContext';
import { useColorScheme } from '../hooks/useColorScheme';
import { isLoggedIn } from '../lib/auth';

const queryClient = new QueryClient();
const PHONE_HEADER_HEIGHT = 72;
const PUBLIC_ROUTES = ['/', '/login', '/register', '/welcome', '/verifyInfo'];

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const [authChecked, setAuthChecked] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);

  const contentLeft = useRef(new Animated.Value(0)).current;
  const redirectingRef = useRef(false);
  const mountedRef = useRef(true);

  const isPublicRoute = useMemo(() => {
    return PUBLIC_ROUTES.includes(pathname);
  }, [pathname]);

  useEffect(() => {
    mountedRef.current = true;

    const checkAuth = async () => {
      try {
        const loggedIn = await isLoggedIn();

        if (!mountedRef.current) return;

        // unauthenticated users may only see public routes
        if (!loggedIn && !isPublicRoute) {
          if (!redirectingRef.current) {
            redirectingRef.current = true;
            router.replace('/');
          }
          return;
        }

        // reset redirect lock once we are on a valid route
        redirectingRef.current = false;

        const shouldShow = loggedIn && !isPublicRoute;
        setShowSidebar(shouldShow);

        if (!shouldShow) {
          setSidebarOpen(false);
        }
      } catch (err) {
        console.error('Auth check failed:', err);

        if (!redirectingRef.current) {
          redirectingRef.current = true;
          router.replace('/');
        }
      } finally {
        if (mountedRef.current) {
          setAuthChecked(true);
        }
      }
    };

    checkAuth();

    return () => {
      mountedRef.current = false;
    };
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

  const showPill = useMemo(() => {
    if (!showSidebar) return false;
    const onDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
    const onMyChallenge = pathname === '/challenges/challengeTeamDashboardDetails' || pathname.startsWith('/challenges/challengeTeamDashboardDetails/');
    return onDashboard || onMyChallenge;
  }, [showSidebar, pathname]);

  const contentTopPadding = useMemo(() => {
    return showSidebar && !isTablet ? PHONE_HEADER_HEIGHT : 0;
  }, [showSidebar, isTablet]);

  if (!authChecked) {
    return (
      <UserProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <View style={styles.loadingScreen}>
              <ActivityIndicator size="large" color="#698059ff" />
              <Text style={styles.loadingText}>Step Together</Text>
            </View>
            <StatusBar style="light" />
            <Toast />
          </ThemeProvider>
        </QueryClientProvider>
      </UserProvider>
    );
  }

  return (
    <UserProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {showSidebar && (
            <Sidebar
              isOpen={isTablet ? true : sidebarOpen}
              onToggle={() => setSidebarOpen((v) => !v)}
              onWidthChange={setSidebarWidth}
            />
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
              <Stack.Screen name="challenges/adminCreate" options={{ headerShown: false }} />


            </Stack>

            {showPill && <BottomBar pathname={pathname} />}
          </Animated.View>

          <StatusBar style="light" />
          <Toast />
        </ThemeProvider>
      </QueryClientProvider>
    </UserProvider>
  );
}

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
});