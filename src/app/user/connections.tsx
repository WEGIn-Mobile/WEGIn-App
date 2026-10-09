import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { getFollowers, getFollowing } from '@/api/follows';
import { usePagedList } from '@/hooks/use-paged-list';
import type { UserSummary } from '@/types/user';
import { Avatar } from '@/components/avatar';
import { EmptyState, ErrorNotice, Loading, Screen } from '@/components/common';

const key = (user: UserSummary) => user.id;
export default function ConnectionsScreen() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind: string }>();
  const followers = kind !== 'following';
  const fetchPage = useCallback(
    async (_skip: number, signal: AbortSignal) => {
      const items = await (followers
        ? getFollowers(id, signal)
        : getFollowing(id, signal));
      // The existing API returns the complete relationship list, without pagination.
      return { items, pagination: { skip: 0, take: items.length + 1 } };
    },
    [id, followers],
  );
  const list = usePagedList(fetchPage, key);
  return (
    <Screen>
      <Stack.Screen
        options={{ title: followers ? 'Seguidores' : 'Seguindo' }}
      />
      <FlatList
        data={list.items}
        keyExtractor={key}
        refreshing={list.loading}
        onRefresh={() => void list.refresh()}
        ListHeaderComponent={
          <ErrorNotice
            message={list.error}
            onRetry={() => void list.refresh()}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${item.name}`}
            onPress={() =>
              router.push({ pathname: '/user/[id]', params: { id: item.id } })
            }
            className="flex-row items-center gap-3 border-b border-slate-100 px-5 py-4"
          >
            <Avatar user={item} />
            <View>
              <Text className="font-semibold text-slate-900">{item.name}</Text>
              <Text className="text-slate-500">@{item.username}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          list.loading ? (
            <Loading />
          ) : !list.error ? (
            <EmptyState
              title={
                followers
                  ? 'Nenhum seguidor ainda'
                  : 'Nenhum perfil seguido ainda'
              }
            />
          ) : null
        }
      />
    </Screen>
  );
}
