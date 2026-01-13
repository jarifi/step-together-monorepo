import { createAuthClient } from '../../services/authClient';

describe('authClient.login', () => {
  const baseUrl = 'http://10.12.100.58:3000/api/v1';

  test('succeeds with valid credentials and returns tokens', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({
        accessToken: 'a',
        refreshToken: 'r',
        userId: 123,
        role: 'user',
        teamId: null,
        activeChallengeId: null,
      }),
    });

    const client = createAuthClient({ baseUrl, fetchFn });
    const result = await client.login('a@b.com', 'pw');

    expect(fetchFn).toHaveBeenCalledWith(
      `${baseUrl}/auth/login`,
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.accessToken).toBe('a');
    expect(result.userId).toBe(123);
  });

  test('maps server detail errors into message', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: false,
      headers: { get: () => 'application/json' },
      json: async () => ({
        detail: [
          { loc: ['body', 'email'], msg: 'Invalid email' },
          { loc: ['body', 'password'], msg: 'Invalid password' },
        ],
      }),
    });

    const client = createAuthClient({ baseUrl, fetchFn });
    await expect(client.login('x', 'y')).rejects.toThrow('Bitte gültige E-Mail eingeben');
  });

  test('throws generic error on invalid shape', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ foo: 'bar' }),
    });

    const client = createAuthClient({ baseUrl, fetchFn });
    await expect(client.login('x@x.com', 'y')).rejects.toThrow('Login fehlgeschlagen');
  });
});
