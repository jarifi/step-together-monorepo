import React, { createContext, useState, useContext } from 'react';

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
  setUser: () => {},
  token: null,
  setToken: () => {},
  userId: null,
  setUserId: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser, token, setToken, userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
