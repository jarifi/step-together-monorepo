// file: hooks/useLogin.ts
import { useMutation } from '@tanstack/react-query';
import { createAuthClient, LoginSuccess } from '../services/authClient';

type UseLoginParams = {
  baseUrl: string | undefined;
  fetchFn?: typeof fetch;
};

type LoginVars = { email: string; password: string };

export function useLogin({ baseUrl, fetchFn }: UseLoginParams) {
  const client = createAuthClient({ baseUrl, fetchFn });

  return useMutation<LoginSuccess, Error, LoginVars>({
    mutationKey: ['auth', 'login'],
    mutationFn: ({ email, password }) => client.login(email, password),
  });
}
