import Constants from 'expo-constants';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getAccessToken, refreshAccessToken } from '../lib/auth';

export default function Index() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAccessToken();
      if (token) {
        setDestination('/challenges/dashboard/challengesDashboard');
        return;
      }

      const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;
      const refreshed = await refreshAccessToken(apiBaseUrl!);
      setDestination(
        refreshed ? '/challenges/dashboard/challengesDashboard' : '/welcome'
      );
    };

    checkAuth();
  }, []);

  if (!destination) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#698059ff" />
      </View>
    );
  }

  return <Redirect href={destination as any} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#313633c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
