// file: components/Avatar.tsx
import React, { useMemo, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { getDisplayAvatarUri } from '../services/userService';

type Props = {
  user?: any;
  name?: string;
  size?: number;
  showRing?: boolean;
};

const getInitials = (name?: string) => {
  if (!name?.trim()) return '??';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function Avatar({ user, name, size = 52, showRing = true }: Props) {
  const displayName = (name ?? user?.name ?? '').toString();
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const uri = useMemo(() => {
    const u = user ?? {};

    const raw =
      u?.avatarUrl ??
      u?.avatar_url ??
      u?.avatar ??             
      u?.avatarURI ??
      u?.avatarUri ??
      u?.profilePicture ??
      u?.profile_picture ??
      u?.profile_picture_url ??
      u?.profilePictureUrl ??
      u?.picture ??
      u?.pictureUrl ??
      u?.image ??
      u?.imageUrl ??
      u?.photo ??
      u?.photoUrl ??
      u?.user?.avatarUrl ??
      u?.user?.avatar_url ??
      u?.user?.avatar ??
      u?.user?.profile_picture ??
      null;

    const helper = getDisplayAvatarUri({ ...u, avatar: raw }) || getDisplayAvatarUri(u);
    if (helper) return helper;

    const s = raw == null ? '' : String(raw).trim();
    if (!s) return null;
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    return null;
  }, [user]);

  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;

  const ringPad = 3;
  const inner = size;
  const outer = showRing ? size + ringPad * 2 : size;

  return (
    <View
      style={
        showRing
          ? {
              width: outer,
              height: outer,
              borderRadius: 999,
              padding: ringPad,
              backgroundColor: 'rgba(127,165,140,0.35)',
              alignItems: 'center',
              justifyContent: 'center',
            }
          : { width: inner, height: inner }
      }
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: 999,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#E6EFE9',
          borderWidth: 1,
          borderColor: 'rgba(15,20,17,0.08)',
        }}
      >
        {showImage ? (
          <Image
            source={{ uri: uri! }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <Text
            style={{
              fontSize: Math.max(12, Math.round(size * 0.32)),
              fontWeight: '900',
              color: '#2F3E34',
              letterSpacing: 0.8,
            }}
          >
            {initials}
          </Text>
        )}
      </View>
    </View>
  );
}
