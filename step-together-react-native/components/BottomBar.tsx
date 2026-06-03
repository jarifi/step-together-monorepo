import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const BOTTOMBAR_HEIGHT = 54;
export const BOTTOMBAR_AIR = 14;

const COLORS = {
  pill: 'rgba(255,255,255,0.92)',
  pillBorder: 'rgba(15,20,17,0.10)',
  text: '#0F1411',
  accent: '#55805c',
  accentSoft: 'rgba(85,128,92,0.14)',
};

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  android: { elevation: 6 },
});

type Props = {
  pathname: string;
  overviewPath?: string;
  challengePath?: string;
};

let rememberedOverviewPath = '/challenges/dashboard/challengesDashboard';
let rememberedChallengePath = '/challenges/dashboard/challengeTeamDashboardDetails';

export default function BottomBar({ pathname, overviewPath, challengePath }: Props) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (overviewPath) {
      rememberedOverviewPath = overviewPath;
    }
    if (challengePath) {
      rememberedChallengePath = challengePath;
    }
  }, [challengePath, overviewPath]);

  const effectiveOverviewPath = overviewPath ?? rememberedOverviewPath;
  const effectiveChallengePath = challengePath ?? rememberedChallengePath;

  const tabs = useMemo(
    () => [
      { key: 'dashboard', label: 'Übersicht', icon: 'heart', path: effectiveOverviewPath },
      { key: 'challenge', label: 'Details', icon: 'people', path: effectiveChallengePath },
    ],
    [effectiveChallengePath, effectiveOverviewPath]
  );

  const isActive = (path: string) => {
    if (pathname === path) return true;
    if (path !== '/' && pathname.startsWith(path + '/')) return true;
    return false;
  };

  const bottomOffset = Math.max(insets.bottom, 10) + BOTTOMBAR_AIR;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: bottomOffset }]}>
      <View style={[styles.pill, shadow]}>
        {tabs.map((t, idx) => {
          const active = isActive(t.path);

          return (
            <Pressable
              key={t.key}
              onPress={() => router.push(t.path as any)}
              style={({ pressed }) => [
                styles.pillItem,
                idx === 0 ? { marginRight: 6 } : null,
                active && styles.pillItemActive,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Ionicons
                name={(active ? t.icon : `${t.icon}-outline`) as any}
                size={18}
                color={active ? COLORS.accent : 'rgba(15,20,17,0.45)'}
              />
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    height: BOTTOMBAR_HEIGHT,
    width: '100%',
    backgroundColor: COLORS.pill,
    borderWidth: 1,
    borderColor: COLORS.pillBorder,
    borderRadius: 999,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillItem: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pillItemActive: { backgroundColor: COLORS.accentSoft },
  pillText: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(15,20,17,0.55)',
  },
  pillTextActive: { color: COLORS.accent },
});
