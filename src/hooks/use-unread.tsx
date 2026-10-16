import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { ApiError } from '@/api/api-fetch';
import { getUnreadCount } from '@/api/messages';
import { useSession } from './use-session';

type Unread = {
  /** Conversas com mensagens recebidas e não lidas (badge da aba). */
  conversations: number;
  refresh: () => void;
};

const POLL_MS = 20000;
const UnreadContext = createContext<Unread>({
  conversations: 0,
  refresh: () => {},
});

export function UnreadProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const [conversations, setConversations] = useState(0);
  const request = useRef<AbortController | null>(null);
  const unsupported = useRef(false);

  const refresh = useCallback(() => {
    if (!user || unsupported.current) return;
    // A leitura de uma conversa invalida a contagem que estiver em andamento.
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    getUnreadCount(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setConversations(result.conversations);
      })
      .catch((cause) => {
        // Uma API sem o endpoint não deve gerar erros repetidos na interface.
        if (cause instanceof ApiError && cause.code === 'UNSUPPORTED_ENDPOINT')
          unsupported.current = true;
      })
      .finally(() => {
        if (request.current === controller) request.current = null;
      });
  }, [user]);

  useEffect(() => {
    if (!user) {
      setConversations(0);
      return;
    }
    refresh();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') refresh();
    }, POLL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
      request.current?.abort();
      request.current = null;
    };
  }, [user, refresh]);

  return (
    <UnreadContext.Provider value={{ conversations, refresh }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  return useContext(UnreadContext);
}
