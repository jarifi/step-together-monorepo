import React, { createContext, useState, useContext } from 'react';

interface Challenge {
    id: string;
    name: string;
    start_location: string;
    target_location: string;
    distance: number;
    start_date: string;
    end_date: string;
}

interface ChallengeContextProps {
    challenge: Challenge | null;
    setChallenge: (challenge: Challenge | null) => void;
    token: string | null;
    setToken: (token: string | null) => void;
    challengeId: string | null;
    setChallengeId: (id: string | null) => void;
}

const ChallengeContext = createContext<ChallengeContextProps>({
    challenge: null,
    setChallenge: () => {},
    token: null,
    setToken: () => {},
    challengeId: null,
    setChallengeId: () => {},
});

export const ChallengeProvider = ({ children }: { children: React.ReactNode }) => {
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [challengeId, setChallengeId] = useState<string | null>(null);

    return (
        <ChallengeContext.Provider value={{ challenge, setChallenge, token, setToken, challengeId, setChallengeId }}>
            {children}
        </ChallengeContext.Provider>
    );
};

export const useChallenge = () => useContext(ChallengeContext);