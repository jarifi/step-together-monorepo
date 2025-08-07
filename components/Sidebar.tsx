import React, { useState } from 'react';
import { View, Text,StyleSheet, Animated, Dimensions, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useUser } from '../context/UserContext';
import { removeToken } from '../lib/auth';
import { router } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-screenWidth));

  const { user } = useUser();

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

  const initials = user?.name ? user.name.split(" ").map((n: any[]) => n[0]).join("").toUpperCase() : "U";

  return (
    <>
      <View style={styles.headerContainer}>
        <Pressable  onPress={toggleSidebar} style={styles.burgerBtn}>
          <Text style={{ color: 'white', fontSize: 24 }}>☰</Text>
        </Pressable >
      </View>

      {/* Overlay zum Schließen */}
      {isOpen && (
        <Pressable style={styles.overlay} onPress={closeSidebar} />
      )}

      <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
        {user ? (
          <View style={styles.profileContainer}>
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitials}>{initials}</Text>
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>
          </View>
        ) : (
          <Text style={{ color: '#064e3b', marginBottom: 20 }}>Kein User geladen</Text>
        )}

        <View style={styles.linkContainer}>
          <NavLink href="/home" label="Home" onNavigate={closeSidebar} />
          <NavLink href="/progress" label="Mein Fortschritt" onNavigate={closeSidebar} />
          <NavLink href="/steps" label="Meine Schritte" onNavigate={closeSidebar} />
          <NavLink href="/team" label="Mein Team" onNavigate={closeSidebar} />
          <View style={styles.separator} />
          <NavLink href="/teams" label="Alle Teams" onNavigate={closeSidebar} />
          <NavLink href="/challenges" label="Alle Challenges" onNavigate={closeSidebar} />
          <View style={styles.separator} />
          <NavLink href="/settings" label="Einstellungen" onNavigate={closeSidebar} />
          <Pressable  style={styles.navLink} onPress={handleLogout}>
            <Text style={[styles.navLinkText, { color: '#f87171' }]}>Logout</Text>
          </Pressable >
          <NavLink href="/admin" label="Admin-Bereich" onNavigate={closeSidebar} />
        </View>
      </Animated.View>
    </>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  style?: object;
  onNavigate: () => void;
}

function NavLink({ href, label, style, onNavigate }: NavLinkProps) {
  return (
    <Link href={href} asChild>
      <Pressable  style={styles.navLink} onPress={onNavigate}>
        <Text style={[styles.navLinkText, style]}>{label}</Text>
      </Pressable >
    </Link>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#166534',
  },
  burgerBtn: {
    backgroundColor: '#166534',
    padding: 10,
    borderRadius: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 30,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: screenWidth * 0.7,
    backgroundColor: '#bbf7d0',
    padding: 20,
    zIndex: 40,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  profileName: {
    color: '#064e3b',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileEmail: {
    color: '#4b5563',
    fontSize: 12,
  },
  linkContainer: {
    flex: 1,
  },
  navLink: {
    paddingVertical: 10,
  },
  navLinkText: {
    color: '#064e3b',
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#86efac',
    marginVertical: 10,
  },
});
