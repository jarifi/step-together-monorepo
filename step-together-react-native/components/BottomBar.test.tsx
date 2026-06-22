import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BottomBar from './BottomBar';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

beforeEach(() => {
  jest.clearAllMocks(); // reset between tests
});

test('renders tab labels', () => {
  const { getByText } = render(
    <BottomBar pathname="/challenges/challengesDashboard" />
  );

  expect(getByText('Übersicht')).toBeTruthy();
  expect(getByText('Details')).toBeTruthy();
});

test('marks overview as active when pathname matches', () => {
  const { getByText } = render(
    <BottomBar pathname="/challenges/challengesDashboard" />
  );

  const overview = getByText('Übersicht');

  expect(overview.props.style).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ color: '#55805c' }),
    ])
  );
});

test('navigates when tab is pressed', () => {
  const { getByText } = render(
    <BottomBar pathname="/something-else" />
  );

  fireEvent.press(getByText('Details'));

  expect(router.push).toHaveBeenCalled();
});

test('uses custom paths', () => {
  const { getByText } = render(
    <BottomBar
      pathname="/custom"
      overviewPath="/custom-overview"
      challengePath="/custom-details"
    />
  );

  fireEvent.press(getByText('Details'));

  expect(router.push).toHaveBeenCalledWith('/custom-details');
});