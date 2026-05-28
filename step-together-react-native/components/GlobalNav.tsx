import { MaterialIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from './Avatar';
import { useUser } from '../context/UserContext';
import { removeTokens } from '../lib/auth';

export const GLOBAL_NAV_HEIGHT = 64;

type Props = { pathname: string };

const HOME_PATH = '/challenges/challengesDashboard';

export default function GlobalNav({ pathname }: Props) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 8) + 16;
  const { user, setUser, setToken, setUserId, pendingInviteCount } = useUser();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');

  const go = (path: string) => router.push(path as any);

  const handleLogout = async () => {
    await removeTokens();
    setUser(null);
    setToken(null);
    setUserId(null);
    router.replace('/login');
  };

  const profileActive = pathname === '/profileInfo';
  const notificationsActive = isActive('/notifications');
  const challengesActive = isActive('/challenges/hybridIndex') || isActive('/userHistory');

  // ── Home button animation ──
  const homeScale = useRef(new Animated.Value(1)).current;
  const homeRotate = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const onHomePressIn = () => {
    Animated.parallel([
      Animated.spring(homeScale, { toValue: 0.82, useNativeDriver: true, friction: 8, tension: 300 }),
      Animated.timing(homeRotate, { toValue: 1, duration: 110, useNativeDriver: true }),
    ]).start();
  };

  const onHomePressOut = () => {
    glowScale.setValue(0.9);
    glowOpacity.setValue(0.65);
    Animated.parallel([
      Animated.spring(homeScale, { toValue: 1, useNativeDriver: true, friction: 3, tension: 380 }),
      Animated.timing(homeRotate, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(glowScale, { toValue: 2.2, duration: 550, useNativeDriver: true }),
      Animated.timing(glowOpacity, { toValue: 0, duration: 550, useNativeDriver: true }),
    ]).start();
  };

  const homeSpin = homeRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '14deg'] });

  return (
    <>
      {/* Floating dynamic island pill nav */}
      <View style={[styles.wrap, { bottom: bottomOffset }]}>
        <View style={styles.bar}>
          {/* Profile avatar tab */}
          <Pressable style={styles.tab} onPress={() => go('/profileInfo')}>
            <View style={[styles.avatarRing, profileActive && styles.avatarRingActive]}>
              <Avatar user={user} size={32} showRing={false} />
            </View>
          </Pressable>

          {/* Notifications */}
          <Pressable style={styles.tab} onPress={() => go('/notifications')}>
            <View style={styles.iconWrap}>
              <MaterialIcons
                name="notifications"
                size={26}
                color={notificationsActive ? '#6B8F71' : '#9CA3AF'}
              />
              {pendingInviteCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pendingInviteCount > 9 ? '9+' : String(pendingInviteCount)}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>

          {/* Home center button */}
          <View style={styles.centerSlot}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.glowRing,
                { transform: [{ scale: glowScale }], opacity: glowOpacity },
              ]}
            />
            <Animated.View style={{ transform: [{ scale: homeScale }, { rotate: homeSpin }] }}>
              <Pressable
                style={styles.homeBtn}
                onPressIn={onHomePressIn}
                onPressOut={onHomePressOut}
                onPress={() => go(HOME_PATH)}
              >
                <MaterialIcons name="home" size={32} color="#fff" />
              </Pressable>
            </Animated.View>
          </View>

          {/* Challenges */}
          <Pressable style={styles.tab} onPress={() => go('/challenges/hybridIndex')}>
            <MaterialIcons
              name="flag"
              size={26}
              color={challengesActive ? '#6B8F71' : '#9CA3AF'}
            />
          </Pressable>

          {/* Logout */}
          <Pressable style={styles.tab} onPress={handleLogout}>
            <Feather name="log-out" size={24} color="#B91C1C" />
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.14,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 14 },
    }),
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: GLOBAL_NAV_HEIGHT,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  avatarRing: {
    borderRadius: 999,
    padding: 2,
    borderWidth: 2.5,
    borderColor: '#D1DDD3',
  },
  avatarRingActive: {
    borderColor: '#6B8F71',
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  centerSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  glowRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6B8F71',
  },
  homeBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6B8F71',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#6B8F71',
        shadowOpacity: 0.45,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 8 },
    }),
  },
  modalOverlay: {
    flex: 1,
  },
  settingsMenu: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 210,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 10 },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2F3E34',
  },
  menuLabelDanger: {
    fontSize: 15,
    fontWeight: '600',
    color: '#B91C1C',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
    marginVertical: 4,
  },
});
