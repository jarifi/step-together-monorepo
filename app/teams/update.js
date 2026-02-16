import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTeam } from '../../context/TeamContext';
import { validateTeamName } from '../../lib/teamValidation';
import { updateTeam } from '../../services/teamService';

const COLORS = {
  bg: '#F5F7F4',
  surface: '#FFFFFF',
  text: '#0F1411',
  sub: '#55605A',
  border: 'rgba(15,20,17,0.10)',
  accent: '#55805c',
  inputBg: '#FBFCFB',
};

export default function UpdateTeamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setTeam } = useTeam();

  const teamId = useMemo(() => {
    const raw = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params?.id]);

  const initialName = useMemo(() => {
    const raw = Array.isArray(params?.name) ? params.name[0] : params?.name;
    return (raw ?? '').toString();
  }, [params?.name]);

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleUpdate = async () => {
    if (!teamId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Team-ID fehlt. Bitte erneut öffnen.',
        position: 'top',
        topOffset: 100,
      });
      return;
    }

    const trimmed = name.trim();
    const nameErrors = validateTeamName(trimmed);

    if (!trimmed) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Bitte einen Teamnamen eingeben.',
        position: 'top',
        topOffset: 100,
      });
      return;
    }

    if (nameErrors.length > 0) {
      nameErrors.forEach((err, i) => {
        setTimeout(() => {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: err,
            position: 'top',
            topOffset: 100,
          });
        }, i * 900);
      });
      return;
    }

    setLoading(true);
    try {
      await updateTeam(teamId, { name: trimmed });

      Toast.show({
        type: 'success',
        text1: 'Erfolg',
        text2: 'Team erfolgreich aktualisiert!',
        position: 'top',
        topOffset: 100,
      });

      router.replace('/teams');
    } catch (error) {
      const apiMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Team konnte nicht aktualisiert werden!';

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: String(apiMsg),
        position: 'top',
        topOffset: 100,
      });

      console.error('Update team failed:', error?.response?.data ?? error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header Card */}
      <View style={styles.headerCard}>

        <Text style={styles.title}>Team bearbeiten</Text>
      </View>

      {/* Form Card */}
      <View style={styles.formCard}>
        <Text style={styles.label}>TEAM NAME</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="z.B. Step Squad"
          placeholderTextColor="#8A9590"
          style={styles.input}
          editable={!loading}
          returnKeyType="done"
          onSubmitEditing={handleUpdate}
        />

        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => router.back()}
            disabled={loading}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}
          >
            <Text style={styles.secondaryBtnText}>Abbrechen</Text>
          </Pressable>

          <Pressable
            onPress={handleUpdate}
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Aktualisiere…' : 'Aktualisieren'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 56,
  },

  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    position: 'relative',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingHorizontal: 56,
  },

  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.sub,
    marginBottom: 8,
    marginLeft: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 14,
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryBtnText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 15,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  disabled: {
    opacity: 0.6,
  },
});
