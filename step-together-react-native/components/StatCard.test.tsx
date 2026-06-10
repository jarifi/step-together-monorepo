import React from 'react';
import { render } from '@testing-library/react-native';
import StatCard from './StatCard';

test('renders value and label', () => {
    const { getByText } = render(
        <StatCard value='10' label='Points' />
    );

    expect(getByText('10')).toBeTruthy();
    expect(getByText('Points')).toBeTruthy();
});