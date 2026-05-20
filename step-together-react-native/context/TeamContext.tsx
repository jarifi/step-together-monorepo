import React, { createContext, useState, useContext } from 'react';

interface TeamContextProps {
  Team: any;
  setTeam: (Team: any) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  TeamId: string | null;
  setTeamId: (id: string | null) => void;
}

const TeamContext = createContext<TeamContextProps>({
  Team: null,
  setTeam: () => {},
  token: null,
  setToken: () => {},
  TeamId: null,
  setTeamId: () => {},
});

export const TeamProvider = ({ children }: { children: React.ReactNode }) => {
  const [Team, setTeam] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [TeamId, setTeamId] = useState<string | null>(null);

  return (
    <TeamContext.Provider value={{ Team, setTeam, token, setToken, TeamId, setTeamId }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => useContext(TeamContext);
