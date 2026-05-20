import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { useLogin } from '../../hooks/useLogin';

function createWrapper() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    // eslint-disable-next-line react/display-name
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

describe('useLogin', () => {
    const baseUrl = 'http://10.12.100.58:3000/api/v1';

    test('mutateAsync resolves with tokens', async () => {
        const fetchFn = jest.fn().mockResolvedValue({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({ accessToken: 'a', refreshToken: 'r', userId: 1 }),
        });
        const wrapper = createWrapper();
        const { result } = renderHook(() => useLogin({ baseUrl, fetchFn }), { wrapper });

        const data = await result.current.mutateAsync({ email: 'a@b.com', password: 'pw' });
        expect(data.accessToken).toBe('a');
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    test('mutateAsync rejects on server error', async () => {
        const fetchFn = jest.fn().mockResolvedValue({
            ok: false,
            headers: { get: () => 'application/json' },
            json: async () => ({ detail: 'Bad creds' }),
        });
        const wrapper = createWrapper();
        const { result } = renderHook(() => useLogin({ baseUrl, fetchFn }), { wrapper });

        await expect(
            result.current.mutateAsync({ email: 'a@b.com', password: 'bad' })
        ).rejects.toThrow('Bad creds');
        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});
