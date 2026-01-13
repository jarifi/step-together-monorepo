//file: app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';
import Toast from 'react-native-toast-message';

import BottomBar from '../components/BottomBar';
import Sidebar from '../components/Sidebar';

import { UserProvider } from '../context/UserContext';
import { useColorScheme } from '../hooks/useColorScheme';
import { isLoggedIn } from '../lib/auth';

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const [authChecked, setAuthChecked] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);

  // animated push for content (TABLET ONLY)
  const contentLeft = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedIn = await isLoggedIn();

        if (!loggedIn && pathname !== '/login') {
          router.replace('/login');
        } else {
          const shouldShow = loggedIn && pathname !== '/login';
          setShowSidebar(shouldShow);

          if (!shouldShow) setSidebarOpen(false);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        router.replace('/login');
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, [pathname]);

  useEffect(() => {
    const target = showSidebar ? (isTablet ? sidebarWidth : 0) : 0;

    Animated.timing(contentLeft, {
      toValue: target,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [showSidebar, isTablet, sidebarWidth, contentLeft]);

  useEffect(() => {
    if (isTablet) setSidebarOpen(false);
  }, [isTablet]);

  const showPill = useMemo(() => {
    if (!showSidebar) return false;
    const onDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
    const onMyChallenge = pathname === '/myChallenge' || pathname.startsWith('/myChallenge/');
    return onDashboard || onMyChallenge;
  }, [showSidebar, pathname]);

  if (!authChecked) return null;

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

          <Animated.View style={[styles.contentWrap, { marginLeft: contentLeft }]}>
            <Stack initialRouteName="login">
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="dashboard" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>

            {showPill && <BottomBar pathname={pathname} />}
          </Animated.View>

          <StatusBar style="auto" />
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
});
