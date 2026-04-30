// file: context/UserContext.tsx

import Constants from 'expo-constants';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken, refreshAccessToken } from "../lib/auth";

interface UserContextProps {
  user: any;
  setUser: (u: any) => void;
  token: string | null;
  setToken: (t: string | null) => void;
  userId: string | null;
  setUserId: (i: string | null) => void;
  pendingInviteCount: number;
  setPendingInviteCount: (n: number) => void;
}

const UserContext = createContext<UserContextProps>({
  user: null,
  setUser: () => { },
  token: null,
  setToken: () => { },
  userId: null,
  setUserId: () => { },
  pendingInviteCount: 0,
  setPendingInviteCount: () => { },
});

export const UserProvider = ({ children }: { children: any }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingInviteCount, setPendingInviteCount] = useState<number>(0);

  const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

  // --------------------
  // FIX 1: Load token ONCE and never overwrite login token
  // --------------------
  useEffect(() => {
    if (token !== null) return; // ← prevents old token override

    const load = async () => {
      let storedToken = await getAccessToken();

      if (!storedToken) {
        storedToken = await refreshAccessToken(API_BASE_URL!);
      }

      if (storedToken) {
        setToken(storedToken);
      }
    };

    load();
  }, [token]);

  // --------------------
  // Fetch user profile AFTER token is available
  // --------------------
  useEffect(() => {
    if (!token) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          // Preserve activeChallenges from existing user if not in response
          const currentActiveChallenges = user?.activeChallenges;
          setUser({
            ...data,
            activeChallenges: data.activeChallenges ?? currentActiveChallenges,
          });
          setUserId(String(data.id));
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, [token]);

  return (
    <UserContext.Provider value={{ user, setUser, token, setToken, userId, setUserId, pendingInviteCount, setPendingInviteCount }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
