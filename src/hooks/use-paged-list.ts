import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { errorMessage } from '@/api/api-fetch';
import type { Page } from '@/types/api';

export function usePagedList<T>(
  fetchPage: (skip: number, signal: AbortSignal) => Promise<Page<T>>,
  key: (item: T) => string,
  {
    pollMs = 0,
    keepOnRefresh = false,
    reconcile,
  }: {
    pollMs?: number;
    keepOnRefresh?: boolean;
    reconcile?: (item: T) => T;
  } = {},
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const request = useRef<AbortController | null>(null);
  const offset = useRef(0);
  const current = useRef<T[]>([]);
  const load = useCallback(
    async (more = false, quiet = false) => {
      if ((more || quiet) && request.current) return;
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      if (more) setLoadingMore(true);
      else if (!quiet) {
        setLoading(true);
        setLoadingMore(false);
      }
      if (!quiet) setError('');
      try {
        let page = await fetchPage(
          more ? offset.current : 0,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        const incoming = [...page.items];
        if (keepOnRefresh && !more && current.current.length) {
          const previousIds = new Set(current.current.map(key));
          // After a long pause, fetch the gap before joining the cached history.
          while (
            page.items.length === page.pagination.take &&
            !page.items.some((item) => previousIds.has(key(item)))
          ) {
            page = await fetchPage(incoming.length, controller.signal);
            if (controller.signal.aborted) return;
            incoming.push(...page.items);
          }
        }
        const combined = more
          ? [...current.current, ...incoming]
          : keepOnRefresh
            ? [...incoming, ...current.current]
            : incoming;
        const seen = new Set<string>();
        const next = combined
          .filter((item) => {
            const id = key(item);
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          })
          .map((item) => (reconcile ? reconcile(item) : item));
        current.current = next;
        offset.current = next.length;
        setItems(next);
        if (more || !keepOnRefresh || next.length <= page.pagination.take)
          setHasMore(page.items.length === page.pagination.take);
        setError('');
      } catch (cause) {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      } finally {
        if (request.current === controller) {
          request.current = null;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [fetchPage, key, keepOnRefresh, reconcile],
  );

  useFocusEffect(
    useCallback(() => {
      current.current = [];
      offset.current = 0;
      setItems([]);
      setHasMore(false);
      void load();
      const timer = pollMs
        ? setInterval(() => {
            if (AppState.currentState === 'active') void load(false, true);
          }, pollMs)
        : undefined;
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active' && pollMs) void load(false, true);
      });
      return () => {
        clearInterval(timer);
        subscription.remove();
        request.current?.abort();
        request.current = null;
      };
    }, [load, pollMs]),
  );

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh: () => load(),
    loadMore: () => load(true),
    replace: (item: T) => {
      const next = current.current.map((previous) =>
        key(previous) === key(item) ? item : previous,
      );
      current.current = next;
      setItems(next);
    },
  };
}
