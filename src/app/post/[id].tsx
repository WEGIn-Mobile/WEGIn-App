import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getPost } from '@/api/posts';
import { errorMessage } from '@/api/api-fetch';
import type { Post } from '@/types/post';
import { PostCard } from '@/components/post-card';
import { ErrorNotice, Loading, Screen } from '@/components/common';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(
    async (isActive: () => boolean = () => true) => {
      setError('');
      setLoading(true);
      try {
        const result = await getPost(id);
        if (isActive()) setPost(result);
      } catch (cause) {
        if (isActive()) setError(errorMessage(cause));
      } finally {
        if (isActive()) setLoading(false);
      }
    },
    [id],
  );
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void load(() => active);
      return () => {
        active = false;
      };
    }, [load]),
  );

  return (
    <Screen>
      <ScrollView>
        <ErrorNotice message={error} onRetry={() => void load()} />
        {loading ? (
          <Loading />
        ) : (
          !error &&
          post && (
            <PostCard
              post={post}
              onDeleted={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/feed');
              }}
            />
          )
        )}
      </ScrollView>
    </Screen>
  );
}
