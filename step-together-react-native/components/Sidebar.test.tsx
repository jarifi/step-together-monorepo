import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Sidebar from './Sidebar';
import { router, usePathname } from 'expo-router';
import { useUser } from '../context/UserContext';
import { getUserRole, removeTokens } from '../lib/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as RN from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

jest.mock('expo-router', () => {
  const React = require('react');

  return {
    router: {
      push: jest.fn(),
      replace: jest.fn(),
    },
    usePathname: jest.fn(),
    Link: ({ href, children }: any) => {
      return React.cloneElement(children, {
        onPress: () => require('expo-router').router.push(href),
      });
    },
  };
});

jest.mock('../lib/auth', () => ({
    getUserRole: jest.fn(),
    removeTokens: jest.fn(),
}));

jest.mock('../context/UserContext', () => ({
    useUser: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0 }),
}));

jest.spyOn(RN, 'useWindowDimensions').mockReturnValue({
    width: 400,
    height: 800,
    scale: 1,
    fontScale: 1,
});

jest.mock('@expo/vector-icons', () => ({
    MaterialIcons: () => null,
}));

jest.mock('@expo/vector-icons/Feather', () => () => null);

jest.mock('../components/Avatar', () => () => null);

const mockSetUser = jest.fn();
const mockSetToken = jest.fn();
const mockSetUserId = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();

    (usePathname as jest.Mock).mockReturnValue('/challenges/challengesDashboard');

    (useUser as jest.Mock).mockReturnValue({
        user: { name: 'Max', email: 'test@test.com' },
        setUser: mockSetUser,
        setToken: mockSetToken,
        setUserId: mockSetUserId,
        pendingInviteCount: 2,
    });

    (getUserRole as jest.Mock).mockResolvedValue('user');
});

test('renders dashboard link', async () => {
    const { findByText } = render(<Sidebar />);

    expect(await findByText('Dashboard')).toBeTruthy();
});

test('shows notification badge', async () => {
    const { findByText } = render(<Sidebar />);

    expect(await findByText('2')).toBeTruthy();
});

test('navigates to settings', async () => {
    const { findByText } = render(<Sidebar />);

    const btn = await findByText('Einstellungen');

    fireEvent.press(btn);

    expect(router.push).toHaveBeenCalled();
});

test('logs out user', async () => {
    const { findByText } = render(<Sidebar />);

    const logoutBtn = await findByText('Logout');
    fireEvent.press(logoutBtn);

    await waitFor(() => {
        expect(removeTokens).toHaveBeenCalled();
    });

    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(mockSetToken).toHaveBeenCalledWith(null);
    expect(mockSetUserId).toHaveBeenCalledWith(null);

    expect(router.replace).toHaveBeenCalledWith('/login');
});

test('shows admin link for admin users', async () => {
    (getUserRole as jest.Mock).mockResolvedValue('admin');

    const { findByText } = render(<Sidebar />);

    expect(await findByText('Admin Bereich')).toBeTruthy();
});