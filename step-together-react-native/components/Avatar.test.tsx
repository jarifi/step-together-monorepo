import React from 'react';
import { render } from '@testing-library/react-native';
import Avatar from './Avatar';
import { Image as RNImage } from 'react-native';

jest.mock('../services/UserService', () => ({
    getDisplayAvatarUri: () => null,
}));

test('renders initials for name', () => {
    const { getByText } = render(
        <Avatar name="John Doe" />
    );

    expect(getByText('JD')).toBeTruthy(); 
});

test('renders single initial', () => {
    const { getByText } = render(
        <Avatar name="John" />
    );

    expect(getByText('J')).toBeTruthy();
});

test('renders ?? when no name', () => {
    const { getByText } = render(<Avatar />);
    expect(getByText('??')).toBeTruthy();
});

test('renders image when uri exists', () => {
    const { UNSAFE_getByType } = render(
        <Avatar user={{ avatarUri: 'https://example.com/avatar.png' }} />
    );

    const Image = UNSAFE_getByType(RNImage);
    expect(Image).toBeTruthy();
});