import React from "react";
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import GlobalNav from "./GlobalNav";
import { router } from 'expo-router';
import { removeTokens } from "../lib/auth";
import { useUser } from "../context/UserContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { Button } from "@react-navigation/elements";

jest.mock('expo-router', () => ({
    router: {
        push: jest.fn(),
        replace: jest.fn(),
    },
}));

jest.mock('../lib/auth', () => ({
    removeTokens: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ bottom: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
    MaterialIcons: () => null,
}));

jest.mock('@expo/vector-icons/Feather', () => () => null);

jest.mock('./Avatar', () => () => null);

jest.mock('../context/userContext', () => ({
    useUser: jest.fn(),
}));

const mockSetUser = jest.fn();
const mockSetToken = jest.fn();
const mockSetUserId = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();

    (useUser as jest.Mock).mockReturnValue({
        user: { name: 'Test' },
        setUser: mockSetUser,
        setToken: mockSetToken,
        setUserId: mockSetUserId,
        pendingInviteCount: 3,
    });
});

test('navigates to profile', () => {
    const { getByTestId } = render(<GlobalNav pathname="/" />);

    fireEvent.press(getByTestId('nav-profile'));

    expect(router.push).toHaveBeenCalledWith('/profileInfo');
});

test('navigates to notifications', () => {
    const { getByTestId } = render(<GlobalNav pathname="/" />);

    fireEvent.press(getByTestId('nav-notifications'));

    expect(router.push).toHaveBeenCalledWith('/notifications');
});

test('navigates to home', () => {
    const { getByTestId } = render(<GlobalNav pathname="/" />);

    fireEvent.press(getByTestId('nav-home'));

    expect(router.push).toHaveBeenCalledWith('/challenges/challengesDashboard');
});

test('navigates to challenges', () => {
    const { getByTestId } = render(<GlobalNav pathname="/" />);

    fireEvent.press(getByTestId('nav-challenges'));

    expect(router.push).toHaveBeenLastCalledWith('/challenges/hybridIndex');
});

test('logs out correctly', async () => {
    const { getByTestId } = render(<GlobalNav pathname="/" />);

    fireEvent.press(getByTestId('nav-logout'));

    await waitFor(() => {
        expect(removeTokens).toHaveBeenCalled();
    });

    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(mockSetToken).toHaveBeenCalledWith(null);
    expect(mockSetUserId).toHaveBeenCalledWith(null);

    expect(router.replace).toHaveBeenCalledWith('/login');
});

test('shows badge when pending invites exist', () => {
    const { getByText } = render(<GlobalNav pathname="/" />);

    expect(getByText('3')).toBeTruthy();
});

test('does not show badge when no invites', () => {
    (useUser as jest.Mock).mockReturnValue({
        user: {},
        setUser: jest.fn(),
        setToken: jest.fn(),
        setUserId: jest.fn(),
        pendingInviteCount: 0,
    });

    const { queryByText } = render(<GlobalNav pathname="/" />);

    expect(queryByText('0')).toBeNull();
});