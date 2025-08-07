import { useEffect, useState } from 'react';
import { Stack, usePathname, router } from 'expo-router';
import { isLoggedIn } from '../lib/auth';
import Sidebar from "../components/Sidebar";

import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from '../hooks/useColorScheme';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from '../context/UserContext';

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
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </UserProvider>
  );
}
