import Constants from 'expo-constants';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken } from '../lib/auth';

interface UserContextProps {
  user: any;
  setUser: (user: any) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  userId: string | null;
  setUserId: (id: string | null) => void;
}

const UserContext = createContext<UserContextProps>({
  user: null,
  setUser: () => { },
  token: null,
  setToken: () => { },
  userId: null,
  setUserId: () => { },
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

  useEffect(() => {
    if (!token) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setUserId(data.id);
        } else {
          console.warn("Failed to fetch user profile");
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchUser();
  }, [token]);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await getToken();
      if (storedToken) {
        setToken(storedToken);
      }
    };
    loadToken();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, token, setToken, userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
