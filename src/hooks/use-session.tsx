import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { login, register } from '@/api/auth';
import {
  ApiError,
  errorMessage,
  setUnauthorizedHandler,
} from '@/api/api-fetch';
import { getMeProfile } from '@/services/UserService';
import {
  getAccessToken,
  removeAccessToken,
  saveAccessToken,
} from '@/lib/secure-storage';
import type { CurrentUser } from '@/types/user';
import type { RegisterInput } from '@/types/api';

type Session = {
  user: CurrentUser | null;
  token: string | null;
  loading: boolean;
  error: string;
  restore: () => Promise<void>;
  signIn: (input: RegisterInput, registering: boolean) => Promise<void>;
  signOut: () => Promise<void>;
};
const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const signOut = useCallback(async () => {
    await removeAccessToken();
    setUser(null);
    setToken(null);
    setError('');
  }, []);

  const restore = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const savedToken = await getAccessToken();
      if (savedToken) {
        const profile = await getMeProfile();
        setToken(savedToken);
        setUser(profile);
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) await signOut();
      else setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    void restore();
    return () => setUnauthorizedHandler();
  }, [restore, signOut]);

  async function signIn(input: RegisterInput, registering: boolean) {
    const result = registering
      ? await register(input)
      : await login({
          email: input.email,
          password: input.password,
        });
    const accessToken = result.data.access_token;
    await saveAccessToken(accessToken);
    try {
      const profile = await getMeProfile();
      setToken(accessToken);
      setUser(profile);
    } catch (cause) {
      await signOut();
      throw cause;
    }
  }

  return (
    <SessionContext.Provider
      value={{ user, token, loading, error, restore, signIn, signOut }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session)
    throw new Error('useSession deve estar dentro de SessionProvider.');
  return session;
}
