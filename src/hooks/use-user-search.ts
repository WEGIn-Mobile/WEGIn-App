import { useCallback, useEffect, useRef, useState } from 'react';
import { searchUsers } from '@/api/users';
import { errorMessage } from '@/api/api-fetch';
import type { UserSummary } from '@/types/user';

export function useUserSearch(term: string, excludedUserId?: string) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const offset = useRef(0);
  const request = useRef<AbortController | null>(null);
  const load = useCallback(
    async (more = false) => {
      if (term.length < 2 || (more && request.current)) return;
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      setLoading(true);
      setError('');
      try {
        const page = await searchUsers(
          term,
          more ? offset.current : 0,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        offset.current = (more ? offset.current : 0) + page.items.length;
        const found = page.items.filter((item) => item.id !== excludedUserId);
        setUsers((previous) =>
          more
            ? [
                ...previous,
                ...found.filter(
                  (item) => !previous.some((entry) => entry.id === item.id),
                ),
              ]
            : found,
        );
        setHasMore(page.items.length === page.pagination.take);
      } catch (cause) {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      } finally {
        if (request.current === controller) {
          request.current = null;
          setLoading(false);
        }
      }
    },
    [term, excludedUserId],
  );
  useEffect(() => {
    request.current?.abort();
    request.current = null;
    offset.current = 0;
    setUsers([]);
    setError('');
    setHasMore(false);
    setLoading(term.length >= 2);
    const timer = setTimeout(() => void load(), 400);
    return () => {
      clearTimeout(timer);
      request.current?.abort();
      request.current = null;
    };
  }, [load, term]);
  return {
    users,
    loading,
    error,
    hasMore,
    refresh: () => load(),
    loadMore: () => load(true),
  };
}
