import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ChallengeTabs from './ChallengeTabs';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

jest.mock('expo-router', () => ({
    router: {
        push: jest.fn(),
    },
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
    MaterialIcons: () => null,
}));

beforeEach(() => {
    jest.clearAllMocks();
});

test('renders both tab labels', () => {
    const { getByText } = render(
        <ChallengeTabs
        active='overview'
        overviewPath='/overview'
        rankingPath='/ranking'
        />
    );

    expect(getByText('Übersicht')).toBeTruthy();
    expect(getByText('Ranking')).toBeTruthy();
});

test('marks overview tab as active', () => {
    const { getByText } = render(
        <ChallengeTabs
            active='overview'
            overviewPath='/overview'
            rankingPath='/ranking'
        />
    );

    const overview = getByText('Übersicht');

    expect(overview.props.style).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ color: '#6B8F71'}),
        ])
    );
});

test('navigates to overview when passed', () => {
    const { getByText } = render(
        <ChallengeTabs
        active='ranking'
        overviewPath='/overview'
        rankingPath='ranking'
        />
    );

    fireEvent.press(getByText('Übersicht'));

    expect(router.push).toHaveBeenCalledWith('/overview');
});

test('navigates to ranking when pressed', () => {
    const { getByText } = render(
        <ChallengeTabs
        active='overview'
        overviewPath='/overview'
        rankingPath='/ranking'
        />
    );

    fireEvent.press(getByText('Ranking'));

    expect(router.push).toHaveBeenCalledWith('/ranking');
});