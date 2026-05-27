import { MaterialIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { getUserRole, removeTokens } from '../lib/auth';

export const GLOBAL_NAV_HEIGHT = 64;

type Props = { pathname: string };

const LEFT_TABS = [
  { key: 'history', icon: 'restore', path: '/userHistory' },
  { key: 'notifications', icon: 'notifications', path: '/notifications' },
] as const;

const RIGHT_TABS = [
  { key: 'challenges', icon: 'flag', path: '/challenges/hybridIndex' },
  { key: 'settings', icon: 'settings', path: '__settings__' },
] as const;

const HOME_PATH = '/challenges/challengesDashboard';

export default function GlobalNav({ pathname }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  const { setUser, setToken, setUserId } = useUser();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    getUserRole().then(setUserRole);
  }, []);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');

  const go = (path: string) => router.push(path as any);

  const handleLogout = async () => {
    setSettingsOpen(false);
    await removeTokens();
    setUser(null);
    setToken(null);
    setUserId(null);
    router.replace('/login');
  };

  return (
    <>
      {/* Settings popup */}
      <Modal
        visible={settingsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSettingsOpen(false)}>
          <View style={[styles.settingsMenu, { bottom: GLOBAL_NAV_HEIGHT + bottomPad + 8 }]}>
            {userRole === 'admin' && (
              <Pressable style={styles.menuItem} onPress={() => { setSettingsOpen(false); go('/admin'); }}>
                <MaterialIcons name="groups" size={20} color="#2F3E34" />
                <Text style={styles.menuLabel}>Admin Bereich</Text>
              </Pressable>
            )}
            <Pressable style={styles.menuItem} onPress={() => { setSettingsOpen(false); go('/settings/settings'); }}>
              <MaterialIcons name="settings" size={20} color="#2F3E34" />
              <Text style={styles.menuLabel}>Einstellungen</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setSettingsOpen(false); go('/help/start'); }}>
              <MaterialIcons name="info" size={20} color="#2F3E34" />
              <Text style={styles.menuLabel}>Hilfe & Support</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <Feather name="log-out" size={20} color="#B91C1C" />
              <Text style={styles.menuLabelDanger}>Logout</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Bottom bar */}
      <View style={[styles.wrap, { paddingBottom: bottomPad }]}>
        <View style={styles.bar}>
          {LEFT_TABS.map((item) => {
            const active = isActive(item.path);
            return (
              <Pressable key={item.key} style={styles.tab} onPress={() => go(item.path)}>
                <MaterialIcons name={item.icon as any} size={26} color={active ? '#6B8F71' : '#9CA3AF'} />
              </Pressable>
            );
          })}

          <View style={styles.centerSlot}>
            <Pressable style={styles.homeBtn} onPress={() => go(HOME_PATH)}>
              <MaterialIcons name="home" size={32} color="#fff" />
            </Pressable>
          </View>

          {RIGHT_TABS.map((item) => {
            const isSettings = item.path === '__settings__';
            const active = isSettings ? settingsOpen : isActive(item.path);
            return (
              <Pressable
                key={item.key}
                style={styles.tab}
                onPress={() => isSettings ? setSettingsOpen(true) : go(item.path)}
              >
                <MaterialIcons name={item.icon as any} size={26} color={active ? '#6B8F71' : '#9CA3AF'} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 8 },
    }),
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: GLOBAL_NAV_HEIGHT,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  labelActive: {
    color: '#6B8F71',
  },
  centerSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
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
