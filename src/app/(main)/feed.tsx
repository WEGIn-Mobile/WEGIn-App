import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { usePosts } from '@/hooks/use-posts';
import { PostCard } from '@/components/post-card';
import {
  Button,
  EmptyState,
  ErrorNotice,
  Loading,
  Screen,
} from '@/components/common';

export default function FeedScreen() {
  const list = usePosts();
  return (
    <Screen>
      <FlatList
        data={list.posts}
        keyExtractor={(post) => post.id}
        refreshing={list.loading}
        onRefresh={() => void list.refresh()}
        renderItem={({ item }) => (
          <PostCard post={item} onDeleted={list.remove} />
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
              title="Vamos começar?"
              description="As fotos da comunidade aparecerão aqui."
              action={
                <Button
                  title="Publicar uma foto"
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
                title="Carregar mais"
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
