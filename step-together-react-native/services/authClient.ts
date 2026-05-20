// file: services/authClient.ts
export type LoginSuccess = {
  accessToken: string;
  refreshToken: string;
  userId: string | number;
  role?: string;
  teamId?: string | number | null;
  activeChallengeId?: string | number | null;
};

export type AuthClientDeps = {
  baseUrl: string | undefined;
  fetchFn?: typeof fetch;
};

export function createAuthClient({ baseUrl, fetchFn = fetch }: AuthClientDeps) {
  if (!baseUrl) {
    throw new Error('API base URL is not configured');
  }

  const postJson = async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetchFn(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : {};

    if (!res.ok) {
      let message = 'Login fehlgeschlagen';
      if (isJson && Array.isArray((data as any).detail)) {
        message = (data as any).detail
          .map((d: any) => {
            const field = d.loc?.[1];
            if (field === 'email') return 'Bitte gültige E-Mail eingeben';
            if (field === 'password') return 'Bitte gültiges Passwort eingeben';
            return d.msg;
          })
          .join('\n');
      } else if (isJson && (data as any).detail) {
        message = (data as any).detail;
      }
      throw new Error(message);
    }

    return data as T;
  };

  return {
    async login(email: string, password: string): Promise<LoginSuccess> {
      const data = await postJson<LoginSuccess>('/auth/login', { email, password });
      if (!data?.accessToken || !data?.refreshToken || data.userId === undefined || data.userId === null) {
        throw new Error('Login fehlgeschlagen');
      }
      return data;
    },
  };
}

export const isValidEmail = (value: string) => /.+@.+\..+/.test(value.trim());
