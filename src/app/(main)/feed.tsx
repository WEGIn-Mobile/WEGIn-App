import { useRef } from 'react';
import { FlatList, View } from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { router } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { usePosts } from '@/hooks/use-posts';
import { PostCard } from '@/components/post-card';
import type { Post } from '@/types/post';
import {
  Button,
  EmptyState,
  ErrorNotice,
  ListItemEntrance,
  Loading,
  Screen,
} from '@/components/common';

export default function FeedScreen() {
  const listRef = useRef<FlatList<Post>>(null);
  useScrollToTop(listRef);
  const list = usePosts();
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <Screen>
      <FlatList
        ref={listRef}
        data={list.posts}
        keyExtractor={(post) => post.id}
        refreshing={list.loading}
        onRefresh={() => void list.refresh()}
        renderItem={({ item, index }) => (
          <ListItemEntrance index={index}>
            <PostCard post={item} onDeleted={list.remove} />
          </ListItemEntrance>
        )}
        ListHeaderComponent={
          <ErrorNotice
            message={list.error}
            onRetry={() => void list.refresh()}
          />
        }
        ListEmptyComponent={
          list.loading ? (
            <Loading />
          ) : !list.error ? (
            <EmptyState
              icon={<Camera size={28} color={colors.accent} />}
              title={t('feed.emptyTitle')}
              description={t('feed.emptyDescription')}
              action={
                <Button
                  title={t('feed.publishPhoto')}
                  onPress={() => router.push('/post/create')}
                />
              }
            />
          ) : null
        }
        ListFooterComponent={
          list.hasMore ? (
            <View className="p-4">
              <Button
                title={t('common.loadMore')}
                secondary
                loading={list.loadingMore}
                onPress={() => void list.loadMore()}
              />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </Screen>
  );
}
