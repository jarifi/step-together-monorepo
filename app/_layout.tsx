import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { UserProvider } from '../context/UserContext';
import { useColorScheme } from '../hooks/useColorScheme';
import { isLoggedIn } from '../lib/auth';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = await isLoggedIn();



      setAuthChecked(true);
    };
    checkAuth();
  }, [pathname]);

  if (!authChecked) return null;

  return (
    <UserProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
