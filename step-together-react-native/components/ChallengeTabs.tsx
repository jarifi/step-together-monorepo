import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  active: 'overview' | 'ranking';
  overviewPath: string;
  rankingPath: string;
};

export default function ChallengeTabs({ active, overviewPath, rankingPath }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      <View style={styles.row}>
        <Pressable
          style={[styles.tab, active === 'overview' && styles.tabActive]}
          onPress={() => router.push(overviewPath as any)}
        >
          <MaterialIcons
            name="bar-chart"
            size={18}
            color={active === 'overview' ? '#6B8F71' : '#9CA3AF'}
          />
          <Text style={[styles.label, active === 'overview' && styles.labelActive]}>
            Übersicht
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, active === 'ranking' && styles.tabActive]}
          onPress={() => router.push(rankingPath as any)}
        >
          <MaterialIcons
            name="emoji-events"
            size={18}
            color={active === 'ranking' ? '#6B8F71' : '#9CA3AF'}
          />
          <Text style={[styles.label, active === 'ranking' && styles.labelActive]}>
            Ranking
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#F5F7F4',
    paddingHorizontal: 18,
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: 'rgba(107,143,113,0.12)',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  labelActive: {
    color: '#6B8F71',
  },
});
