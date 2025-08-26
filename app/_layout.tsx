import { Stack, router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import Sidebar from "../components/Sidebar";
import { isLoggedIn } from '../lib/auth';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from '../context/UserContext';
import { useColorScheme } from '../hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();

  const [authChecked, setAuthChecked] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = await isLoggedIn();

      if (!loggedIn && pathname !== '/login') {
        router.replace('/login');
      } else {
        setShowSidebar(loggedIn && pathname !== '/login');
      }

      setAuthChecked(true);
    };
    checkAuth();
  }, [pathname]);

  if (!authChecked) return null;

  return (
    <UserProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {showSidebar && <Sidebar />}
        <Stack initialRouteName="login">
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
        <Toast />
      </ThemeProvider>
    </UserProvider>
  );
}
