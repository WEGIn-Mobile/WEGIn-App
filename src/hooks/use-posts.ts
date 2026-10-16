import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getPosts } from '@/api/posts';
import { errorMessage } from '@/api/api-fetch';
import type { Post } from '@/types/post';

export function usePosts(userId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const offset = useRef(0);
  const request = useRef<AbortController | null>(null);

  const load = useCallback(
    async (more = false) => {
      if (more && request.current) return;
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      if (more) setLoadingMore(true);
      else {
        setLoading(true);
        setLoadingMore(false);
      }
      setError('');
      try {
        const page = await getPosts(
          more ? offset.current : 0,
          userId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        offset.current = more
          ? offset.current + page.items.length
          : page.items.length;
        setPosts((previous) =>
          more
            ? [
                ...previous,
                ...page.items.filter(
                  (post) => !previous.some((item) => item.id === post.id),
                ),
              ]
            : page.items,
        );
        setHasMore(page.items.length === page.pagination.take);
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
    [userId],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        request.current?.abort();
        request.current = null;
      };
    }, [load]),
  );

  return {
    posts,
    loading,
    loadingMore,
    error,
    hasMore,
    refresh: () => load(),
    loadMore: () => load(true),
    remove: (id: string) => {
      if (posts.some((post) => post.id === id))
        offset.current = Math.max(0, offset.current - 1);
      setPosts((previous) => previous.filter((post) => post.id !== id));
    },
  };
}
