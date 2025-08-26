import Feather from '@expo/vector-icons/Feather';
import { Link, router, usePathname } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useUser } from '../context/UserContext';
import { removeToken } from '../lib/auth';

const screenWidth = Dimensions.get('window').width;

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-screenWidth));

  const { user } = useUser();
  const pathname = usePathname();

  const toggleSidebar = () => {
    if (!isOpen) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -screenWidth,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
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
    await removeToken();
    router.replace('/login');
    closeSidebar();
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : 'U';

  // Helper to decide active state
  const isActive = (href: string) => {
    // treat exact match or "startsWith" as active (covers /teams and /teams/1 etc.)
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <View style={styles.headerContainer}>
        <Pressable onPress={toggleSidebar} style={styles.burgerBtn}>
          <Text style={{ color: 'white', fontSize: 22 }}>☰</Text>
        </Pressable>
      </View>

      {isOpen && <Pressable style={styles.overlay} onPress={closeSidebar} />}

      <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
        {user ? (
          <Pressable
            style={styles.profileContainer}
            onPress={() => {
              closeSidebar();
              router.push('/profile/update');
            }}
          >
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitials}>{initials}</Text>
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>
          </Pressable>
        ) : (
          <Text style={{ color: '#2F3E34', marginBottom: 20 }}>Kein User geladen</Text>
        )}

        <View style={styles.linkContainer}>
          <NavLink
            href="/dashboard"
            label="Dashboard"
            icon="home"
            active={isActive('/dashboard')}
            onNavigate={closeSidebar}
          />
          <NavLink
            href="/progress"
            label="Mein Fortschritt"
            icon="bar-chart-2"
            active={isActive('/progress')}
            onNavigate={closeSidebar}
          />
          <NavLink
            href="/steps"
            label="Meine Schritte"
            icon="activity"
            active={isActive('/steps')}
            onNavigate={closeSidebar}
          />
          <NavLink
            href="/team"
            label="Mein Team"
            icon="users"
            active={isActive('/team')}
            onNavigate={closeSidebar}
          />

          <View style={styles.separator} />

          <NavLink
            href="/teams"
            label="Alle Teams"
            icon="users"
            active={isActive('/teams')}
            onNavigate={closeSidebar}
          />
          <NavLink
            href="/challenges"
            label="Alle Challenges"
            icon="flag"
            active={isActive('/challenges')}
            onNavigate={closeSidebar}
          />
          <NavLink
            href="/users"
            label="Alle Benutzer"
            icon="user"
            active={isActive('/users')}
            onNavigate={closeSidebar}
          />

          <View style={styles.separator} />

          <NavLink
            href="/settings"
            label="Einstellungen"
            icon="settings"
            active={isActive('/settings')}
            onNavigate={closeSidebar}
          />

          <Pressable style={styles.navLink} onPress={handleLogout}>
            <View style={[styles.navInner, styles.navDanger]}>
              <Feather name="log-out" size={20} color="#B91C1C" style={styles.navIcon} />
              <Text style={styles.navDangerText}>Logout</Text>
            </View>
          </Pressable>

          <NavLink
            href="/admin"
            label="Admin-Bereich"
            icon="shield"
            active={isActive('/admin')}
            onNavigate={closeSidebar}
          />
        </View>
      </Animated.View>
    </>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
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
          <Feather
            name={icon}
            size={20}
            color={active ? '#F7F8F5' : '#4B5563'}
            style={styles.navIcon}
          />
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

const styles = StyleSheet.create({
  // HEADER
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
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

  // OVERLAY
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 30,
  },

  // SIDEBAR
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: screenWidth * 0.75,          // keep at 75%
    backgroundColor: '#F7F8F5',         // off-white canvas
    padding: 20,
    zIndex: 40,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,


    // depth for the curved look
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  // PROFILE
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 22,
    borderRadius: 18,
    backgroundColor: '#EAF1E6', // very light sage
  },
  profileCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6B8F71', // deep sage
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F7F8F5',
  },
  profileInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.5,
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

  // LINKS
  linkContainer: {
    flex: 1,
    paddingTop: 4,
  },
  navLink: {
    marginVertical: 8,
    borderRadius: 16,
  },
  navInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  navLinkInactive: {
  },
  navLinkActive: {
    backgroundColor: '#6B8F71', // darker sage for selection (e.g., /teams)
  },
  navIcon: {
    marginRight: 10,
  },
  navLinkText: {
    color: '#2F3E34',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,

  },
  navLinkTextActive: {
    color: '#F7F8F5',
  },

  // Danger / Logout
  navDanger: {
    backgroundColor: '#F5DCDC',
  },
  navDangerText: {
    color: '#B91C1C',
    fontSize: 16,
    fontWeight: '700',
  },

  // DIVIDERS
  separator: {
    height: 1,
    backgroundColor: '#DDE5D2',
    marginVertical: 12,
    borderRadius: 1,
  },
});
