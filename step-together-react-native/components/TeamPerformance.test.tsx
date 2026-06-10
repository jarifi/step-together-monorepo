import React from "react";
import { render } from '@testing-library/react-native';
import TeamPerformance from "./TeamPerformance";

const mockMembers = [
    { id: 1, name: 'Alice', steps: 1000 },
    { id: 2, name: 'Bob', steps: 2000 },
];

test('renders team performance summary', async () => {
    const { getByText, findByText } = render(
        <TeamPerformance members={mockMembers} />
    );

    expect(getByText('Team-Leistung')).toBeTruthy();

    expect(await findByText(/3[\s.,\u00A0\u202F]?000 Schritte/)).toBeTruthy();
});

test('renders all team members', async () => {
    const { findByText } = render(
        <TeamPerformance members={mockMembers} />
    );

    expect(await findByText('Alice')).toBeTruthy();
    expect(await findByText('Bob')).toBeTruthy();
});

test('renders steps per member', async () => {
    const { findByText } = render(
        <TeamPerformance members={mockMembers} />
    );

    expect(await findByText(/1[\s.,\u00A0\u202F]?000 Schritte/)).toBeTruthy();
    expect(await findByText(/2[\s.,\u00A0\u202F]?000 Schritte/)).toBeTruthy();
});

test('renders member initials', () => {
    const { getByText } = render(
        <TeamPerformance members={mockMembers} />
    );

    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
});