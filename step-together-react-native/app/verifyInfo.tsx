import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
    Image,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const COLORS = {
  bg: '#313633c7',
  card: 'rgba(94, 103, 81, 0.83)',
  cardBorder: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  sub: 'rgba(255,255,255,0.82)',
  accent: '#698059ff',
};

export default function VerifyInfoScreen() {
  return (
    <SafeAreaView style={styles.background}>
      <View style={styles.container}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle-outline" size={54} color="#fff" />
          </View>

          <Text style={styles.title}>
            Danke für deine Registrierung!
          </Text>

          <Text style={styles.text}>
            Dein soeben erstelltes Konto wird innerhalb von 1 bis 3 Tagen überprüft.
          </Text>

          <Text style={styles.text}>
            Dies dient unserer Sicherheit, damit nicht jede Person Zugriff auf die Plattform erhält.
          </Text>

          <Text style={styles.text}>
            Bitte habe etwas Geduld und warte, bis dein Konto freigeschaltet wurde.
          </Text>

          <Text style={styles.text}>
            Falls dein Konto nach 3 Tagen noch immer nicht verifiziert wurde, kontaktiere bitte den Support unter:
          </Text>

          <Text style={styles.mail}>Support@step-together.at</Text>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => router.replace('/')}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryBtnText}>Zur Startseite</Text>
            </Pressable>

            <Pressable
              onPress={() => router.replace('/login')}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryBtnText}>Login</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  logo: {
    width: 240,
    height: 130,
    marginBottom: 20,
  },

  card: {
    width: '100%',
    maxWidth: 460,
    padding: 24,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },

  iconWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },

  title: {
    fontSize: 24,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 18,
    fontWeight: '700',
    lineHeight: 32,
  },

  text: {
    fontSize: 15,
    color: COLORS.sub,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },

  mail: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    textDecorationLine: 'underline',
    marginTop: 4,
    marginBottom: 20,
  },

  buttonRow: {
    flexDirection: 'row',
    marginTop: 6,
  },

  primaryBtn: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  secondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  secondaryBtnText: {
    fontWeight: '700',
    color: '#fff',
    fontSize: 15,
  },

  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});