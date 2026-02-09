import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import {
  makeAbsoluteMediaUrl,
  updateUser,
  uploadMyProfilePicture,
} from '../../services/userService';

type UpdateUserPayload = {
  name: string;
  email: string;
  avatarUrl?: string;
  stepLength?: number | null;
  role?: string | null;
};

const pickAvatarFromUser = (u: any): string | null => {
  if (!u) return null;
  return (u.avatarUrl ?? u.avatar_url ?? u.avatar ?? null) as string | null;
};

const isPickedLocalUri = (uri: string) =>
  uri.startsWith('file://') || uri.startsWith('blob:') || uri.startsWith('data:');

const ProfileUpdateScreen: React.FC = () => {
  const { user, setUser, userId } = useUser();
  const router = useRouter();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [stepLength, setStepLength] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;

    setName(user.name ?? '');
    setEmail(user.email ?? '');
    setStepLength(
      user.stepLength != null && !isNaN(Number(user.stepLength))
        ? String(user.stepLength)
        : ''
    );
    setRole(user.role ?? '');

    const avatar = pickAvatarFromUser(user);
    if (avatar) setImageUri(avatar);
  }, [user]);

  const handlePickImage = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Zugriff benötigt',
        'Bitte erlaube den Zugriff auf deine Fotos, um ein Profilbild zu wählen.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri); 
    }
  };

  const handleUpdate = async (): Promise<void> => {
    if (!userId) {
      Alert.alert('Error', 'Kein Benutzer gefunden.');
      return;
    }

    let parsedStepLength: number | null = null;
    if (stepLength.trim().length > 0) {
      const num = Number(stepLength.replace(',', '.'));
      if (isNaN(num) || num <= 0) {
        Alert.alert('Fehler', 'Bitte eine gültige Schrittlänge eingeben.');
        return;
      }
      parsedStepLength = num;
    }

    setLoading(true);
    try {
      const payload: UpdateUserPayload = {
        name,
        email,
        stepLength: parsedStepLength,
        role: role || null,
      };

      if (imageUri) {
        if (isPickedLocalUri(imageUri)) {
          const up = await uploadMyProfilePicture(imageUri);
          if (!up?.path) throw new Error('Upload did not return a path');

          payload.avatarUrl = up.path;

          setImageUri(up.path);
        } else {
          payload.avatarUrl = imageUri;
        }
      }

      const updatedUser = await updateUser(userId, payload);
      setUser(updatedUser);

      const newAvatar = pickAvatarFromUser(updatedUser);
      if (newAvatar) setImageUri(newAvatar);

      Alert.alert('Success', 'Benutzer erfolgreich aktualisiert!');
      router.back();
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        'Error',
        error?.message ?? 'Benutzer konnte nicht aktualisiert werden'
      );
    } finally {
      setLoading(false);
    }
  };

  const initials =
    name
      ?.split(' ')
      .filter(Boolean)
      .map((x) => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '';

  const createdAtText =
    (user as any)?.createdAt != null
      ? new Date((user as any).createdAt).toLocaleDateString('de-AT')
      : undefined;

  const displayImageUri = useMemo(() => {
    if (!imageUri) return null;

    if (isPickedLocalUri(imageUri)) return imageUri;

    const abs = makeAbsoluteMediaUrl(imageUri) ?? imageUri;


    return abs;
  }, [imageUri]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <View style={styles.card}>
          {/* ========= USER-HEADER ========= */}
          <View style={styles.profileHeader}>
            <View style={styles.headerBand} />

            <Pressable style={styles.avatarCircle} onPress={handlePickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials || '??'}</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.changePhotoButton}
              onPress={handlePickImage}
              disabled={loading}
            >
              <Text style={styles.changePhotoText}>
                {imageUri ? 'Profilbild ändern' : 'Profilbild hinzufügen'}
              </Text>
            </Pressable>

            <Text style={styles.profileName}>{name || 'Dein Name'}</Text>

            <Text style={styles.subtitle}>{email || 'email@example.com'}</Text>
          </View>

          {/* ========= FORM ========= */}
          <View style={styles.formSection}>
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                editable={!loading}
                placeholder="Name"
                placeholderTextColor="#98A2B3"
              />
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>E-Mail</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="E-Mail"
                placeholderTextColor="#98A2B3"
              />
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Schrittlänge (Meter)</Text>
              <TextInput
                value={stepLength}
                onChangeText={setStepLength}
                style={styles.input}
                editable={!loading}
                keyboardType="decimal-pad"
                placeholder="z.B. 0.78"
                placeholderTextColor="#98A2B3"
              />
            </View>

            <Pressable
              style={[styles.passwordRow, loading && styles.disabledRow]}
              onPress={() => router.push('/settings/password')}
              disabled={loading}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.passwordLabel}>Passwort ändern</Text>
                <Text style={styles.passwordHint}>
                  Sicherheit deines Kontos verwalten
                </Text>
              </View>
              <Text style={styles.passwordChevron}>›</Text>
            </Pressable>

            <Pressable
              onPress={handleUpdate}
              disabled={loading}
              style={[styles.updateButton, loading && styles.disabledButton]}
            >
              <Text style={styles.updateText}>
                {loading ? 'Speichern…' : 'Änderungen speichern'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 18 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileUpdateScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f2f7f2ff',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 60,      
    paddingBottom: 34,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 7,
    borderWidth: 1,
    borderColor: '#EEF2EF',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 18,
    paddingTop: 10,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  headerBand: {
    position: 'absolute',
    top: -18,
    left: -16,
    right: -16,
    height: 140,
    backgroundColor: '#658869ff',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    opacity: 0.22,
  },
  avatarCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#DDE7DD',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 4,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1F2A22',
    letterSpacing: 1,
  },
  changePhotoButton: {
    marginTop: 25,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#344054',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F1A12',
    marginTop: 15,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#667085',
    fontWeight: '600',
  },
  metaLine: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  formSection: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#658869ff',
    gap: 14,
  },
  fieldWrapper: {},
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667085',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E6ECE8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    fontSize: 15,
    backgroundColor: '#FAFBFA',
    color: '#101828',
  },
  passwordRow: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#F6F7F8',
    borderWidth: 1,
    borderColor: '#EEF0F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabledRow: {
    opacity: 0.65,
  },
  passwordLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#101828',
  },
  passwordHint: {
    fontSize: 12,
    color: '#667085',
    marginTop: 2,
    fontWeight: '600',
  },
  passwordChevron: {
    fontSize: 24,
    color: '#98A2B3',
    marginLeft: 12,
    fontWeight: '900',
  },
  updateButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F6B45',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  updateText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  disabledButton: {
    opacity: 0.7,
  },
});
