import { MaterialIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { Link, router, usePathname } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '../components/Avatar';
import { useUser } from '../context/UserContext';
import { getUserRole, removeTokens } from '../lib/auth';

type SidebarProps = {
  isOpen?: boolean;
  onToggle?: () => void;
  onWidthChange?: React.Dispatch<React.SetStateAction<number>>;
};

export default function Sidebar({
  isOpen: isOpenExternal,
  onToggle,
  onWidthChange,
}: SidebarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const SIDEBAR_WIDTH = useMemo(() => {
    if (isTablet) return Math.min(340, Math.round(width * 0.33));
    return Math.round(width * 0.78);
  }, [isTablet, width]);

  useEffect(() => {
    onWidthChange?.(SIDEBAR_WIDTH);
  }, [SIDEBAR_WIDTH, onWidthChange]);

  const { user, setUser, setToken, setUserId, pendingInviteCount } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);

  const [isOpenLocal, setIsOpenLocal] = useState(false);
  const isOpen = isTablet ? true : isOpenExternal ?? isOpenLocal;

  const slideAnim = useRef(new Animated.Value(isTablet ? 0 : -SIDEBAR_WIDTH)).current;

  useEffect(() => {
    const loadRole = async () => {
      const role = await getUserRole();
      setUserRole(role);
    };
    loadRole();
  }, []);

  useEffect(() => {
    if (isTablet) {
      slideAnim.setValue(0);
      return;
    }

    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [SIDEBAR_WIDTH, isOpen, slideAnim, isTablet]);

  const topInset = useMemo(() => {
    if (insets.top && insets.top > 0) return insets.top;
    if (Platform.OS === 'android') return StatusBar.currentHeight ?? 0;
    return 20;
  }, [insets.top]);


  const closeSidebar = () => {
    if (isTablet) return;
    if (onToggle) return isOpen && onToggle();
    setIsOpenLocal(false);
  };

  const handleLogout = async () => {
    await removeTokens();
    setUser(null);
    setToken(null);
    setUserId(null);
    router.replace('/login');
    closeSidebar();
  };

  const displayName = user?.name || 'Nutzer nicht gefunden';
  const displayEmail = user?.email || 'Profil bearbeiten';

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  function renderNavLink(
    href: string,
    label: string,
    iconName: string,
    IconComponent: typeof MaterialIcons | typeof Feather
  ) {
    const active = isActive(href);
    return (
      <NavLink
        href={href}
        label={label}
        icon={
          <IconComponent
            name={iconName as any}
            size={width < 380 ? 22 : 24}
            color={active ? '#F7F8F5' : '#4B5563'}
            style={styles.navIcon}
          />
        }
        active={active}
        onNavigate={closeSidebar}
      />
    );
  }

  return (
    <>
      {!isTablet && isOpen && <Pressable style={styles.overlay} onPress={closeSidebar} />}

      <Animated.View
        style={[
          styles.sidebar,
          {
            width: SIDEBAR_WIDTH,
            paddingTop: topInset + 20,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {user ? (
          <Pressable
            style={styles.profileContainer}
            onPress={() => {
              closeSidebar();
              router.push('/profileInfo');
            }}
          >
            <View style={styles.profileAvatarWrap}>
              <Avatar user={user} name={user?.name} size={52} showRing={false} />
            </View>

            <View style={{ marginLeft: 12 }}>
              <Text style={styles.profileName} numberOfLines={1}>
                {displayName}
              </Text>
            </View>
          </Pressable>
        ) : (
          <Text style={{ color: '#2F3E34', marginBottom: 20 }}>Kein User geladen</Text>
        )}

        <View style={styles.linkContainer}>
          {renderNavLink('/challenges/challengesDashboard', 'Dashboard', 'dashboard', MaterialIcons)}
          {(() => {
            const active = isActive('/notifications');
            const iconSize = width < 380 ? 22 : 24;
            return (
              <Link href="/notifications" asChild>
                <Pressable style={styles.navLink} onPress={closeSidebar}>
                  <View style={[styles.navInner, active ? styles.navLinkActive : styles.navLinkInactive]}>
                    <View style={styles.badgeIconWrap}>
                      <MaterialIcons
                        name="notifications"
                        size={iconSize}
                        color={active ? '#F7F8F5' : '#4B5563'}
                      />
                      {pendingInviteCount > 0 && (
                        <View style={styles.badgeCircle}>
                          <Text style={styles.badgeCircleTxt}>
                            {pendingInviteCount > 9 ? '9+' : String(pendingInviteCount)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.navLinkText, active && styles.navLinkTextActive]}>
                      Benachrichtigungen
                    </Text>
                  </View>
                </Pressable>
              </Link>
            );
          })()}

          <View style={styles.separator} />

          {renderNavLink('/userHistory', 'Verlauf', 'restore', MaterialIcons)}
          {renderNavLink('/challenges/hybridIndex', 'Challenge Verwaltung', 'person', MaterialIcons)}

          <View style={styles.separator} />

          {userRole === 'admin' && renderNavLink('/admin', 'Admin Bereich', 'groups', MaterialIcons)}

          {renderNavLink('/settings/settings', 'Einstellungen', 'settings', MaterialIcons)}

          {renderNavLink('/help/start', 'Hilfe & Support', 'info', MaterialIcons)}

          <Pressable style={styles.navLink} onPress={handleLogout}>
            <View style={[styles.navInner, styles.navDanger]}>
              <Feather name="log-out" size={20} color="#B91C1C" style={styles.navIcon} />
              <Text style={styles.navDangerText}>Logout</Text>
            </View>
          </Pressable>
        </View>
      </Animated.View>
    </>
  );
}

/* NavLink */
interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onNavigate: () => void;
}

function NavLink({ href, label, icon, active, onNavigate }: NavLinkProps) {
  return (
    <Link href={href as any} asChild>
      <Pressable style={styles.navLink} onPress={onNavigate}>
        <View style={[styles.navInner, active ? styles.navLinkActive : styles.navLinkInactive]}>
          {icon}
          <Text style={[styles.navLinkText, active && styles.navLinkTextActive]}>{label}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

/* Styles */
const styles = StyleSheet.create({
  edgeTab: {
    position: 'absolute',
    left: 0,
    zIndex: 50,
    backgroundColor: 'rgba(107, 143, 113, 0.45)',
    paddingVertical: 18,
    paddingHorizontal: 7,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 2, height: 0 },
      },
      android: { elevation: 5 },
    }),
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 30,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#F7F8F5',
    padding: 20,
    zIndex: 999,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 8,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 15,
    borderRadius: 18,
    backgroundColor: '#EAF1E6',
  },
  profileAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6B8F71',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileName: {
    color: '#2F3E34',
    fontWeight: '700',
    fontSize: 16,
  },
  profileEmail: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  linkContainer: {
    flex: 1,
    paddingTop: 2,
  },
  navLink: {
    marginVertical: 1,
    borderRadius: 16,
  },
  navInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  navLinkActive: {
    backgroundColor: '#6B8F71',
  },
  navLinkInactive: {
    backgroundColor: 'transparent',
  },
  navLinkText: {
    color: '#2F3E34',
    fontSize: 16,
    fontWeight: '600',
  },
  navLinkTextActive: {
    color: '#F7F8F5',
  },
  navIcon: {
    marginRight: 10,
  },
  navDanger: {
    backgroundColor: '#F5DCDC',
  },
  navDangerText: {
    color: '#B91C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#DDE5D2',
    marginVertical: 12,
    borderRadius: 1,
  },
  badgeIconWrap: {
    position: 'relative',
    width: 24,
    height: 24,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCircle: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: '#F7F8F5',
  },
  badgeCircleTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 11,
  },
});
