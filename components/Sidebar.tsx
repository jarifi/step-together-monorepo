// file: components/Sidebar.tsx
import { MaterialIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { Link, router, usePathname } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { removeTokens } from '../lib/auth';

const screenWidth = Dimensions.get('window').width;

export default function Sidebar() {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;

  const { user, setUser, setToken, setUserId } = useUser();
  const pathname = usePathname();

  const toggleSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? -screenWidth : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: -screenWidth,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await removeTokens();
    setUser(null);
    setToken(null);
    setUserId(null);
    router.replace('/login');
    closeSidebar();
  };

  const initials = user?.name
    ? user.name
      .split(' ')
      .filter(Boolean)
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    : 'U';

  const displayName = user?.name || 'Nutzer nicht gefunden';
  const displayEmail = user?.email || 'Profil bearbeiten';

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Pressable onPress={toggleSidebar} style={styles.burgerBtn}>
          <Text style={{ color: 'white', fontSize: 35 }}>☰</Text>
        </Pressable>
      </View>

      {isOpen && <Pressable style={styles.overlay} onPress={closeSidebar} />}

      <Animated.View
        style={[
          styles.sidebar,
          { left: slideAnim, paddingTop: insets.top + 20 },
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
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitials}>{initials}</Text>
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{displayEmail}</Text>
            </View>
          </Pressable>
        ) : (
          <Text style={{ color: '#2F3E34', marginBottom: 20 }}>
            Kein User geladen
          </Text>
        )}

        <View style={styles.linkContainer}>
          {/* Dashboard */}
          {renderNavLink('/dashboard', 'Dashboard', 'dashboard', MaterialIcons)}

          <View style={styles.separator} />

          {/* Meine Challenge */}
          {renderNavLink(
            '/myChallenge',
            'Meine Challenge',
            'emoji-events',
            MaterialIcons
          )}

          {/* Meine Historie */}
          {renderNavLink(
            '/userHistory',
            'Meine Historie',
            'restore',
            MaterialIcons
          )}

          {/* Laufende Challenges */}
          {renderNavLink('/challenges', 'Challenges', 'flag', MaterialIcons)}

          <View style={styles.separator} />

          {/* Admin Bereich*/}
          {renderNavLink(
            '/admin',
            'Admin Bereich',
            'groups',
            MaterialIcons
          )}

          {/* Einstellungen */}
          {renderNavLink(
            '/settings/settings',
            'Einstellungen',
            'settings',
            MaterialIcons
          )}

          <Pressable style={styles.navLink} onPress={handleLogout}>
            <View style={[styles.navInner, styles.navDanger]}>
              <Feather
                name="log-out"
                size={20}
                color="#B91C1C"
                style={styles.navIcon}
              />
              <Text style={styles.navDangerText}>Logout</Text>
            </View>
          </Pressable>

        </View>
      </Animated.View>
    </>
  );

  /** Helper function to avoid repeating code */
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
            size={screenWidth < 380 ? 22 : 24}
            color={active ? '#F7F8F5' : '#4B5563'}
            style={styles.navIcon}
          />
        }
        active={active}
        onNavigate={closeSidebar}
      />
    );
  }
}

/** NavLink component */
interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  style?: object;
  active?: boolean;
  onNavigate: () => void;
}

function NavLink({ href, label, icon, style, active, onNavigate }: NavLinkProps) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.navLink} onPress={onNavigate}>
        <View
          style={[
            styles.navInner,
            active ? styles.navLinkActive : styles.navLinkInactive,
          ]}
        >
          {icon}
          <Text
            style={[
              styles.navLinkText,
              active ? styles.navLinkTextActive : null,
              style,
            ]}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

/** Styles */
const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#6B8F71',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  burgerBtn: {
    backgroundColor: '#6B8F71',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
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
    width: screenWidth * 0.75,
    backgroundColor: '#F7F8F5',
    padding: 20,
    zIndex: 999,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  profileContainer: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 15, borderRadius: 18, backgroundColor: '#EAF1E6' },
  profileCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#6B8F71', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F7F8F5' },
  profileInitials: { color: '#FFFFFF', fontWeight: '800', fontSize: 18, letterSpacing: 0.5 },
  profileName: { color: '#2F3E34', fontWeight: '700', fontSize: 16 },
  profileEmail: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  linkContainer: { flex: 1, paddingTop: 2 },
  navLink: { marginVertical: 1, borderRadius: 16 },
  navInner: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  navLinkInactive: {},
  navLinkActive: { backgroundColor: '#6B8F71' },
  navIcon: { marginRight: 10 },
  navLinkText: {
    color: '#2F3E34',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  navLinkTextActive: { color: '#F7F8F5' },
  navDanger: { backgroundColor: '#F5DCDC' },
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
});
