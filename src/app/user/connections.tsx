import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { getFollowers, getFollowing } from '@/api/follows';
import { usePagedList } from '@/hooks/use-paged-list';
import type { UserSummary } from '@/types/user';
import { Avatar } from '@/components/avatar';
import { useI18n } from '@/i18n';
import {
  EmptyState,
  ErrorNotice,
  ListItemEntrance,
  Loading,
  Screen,
} from '@/components/common';

const key = (user: UserSummary) => user.id;
export default function ConnectionsScreen() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind: string }>();
  const followers = kind !== 'following';
  const { t } = useI18n();
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
        options={{
          title: followers ? t('profile.followers') : t('profile.following'),
        }}
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
        renderItem={({ item, index }) => (
          <ListItemEntrance index={index}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.viewProfileOf', {
                name: item.name,
              })}
              onPress={() =>
                router.push({ pathname: '/user/[id]', params: { id: item.id } })
              }
              className="flex-row items-center gap-3 border-b border-line-soft px-5 py-4 active:bg-surface"
            >
              <Avatar user={item} />
              <View>
                <Text className="font-semibold text-fg">{item.name}</Text>
                <Text className="text-muted">@{item.username}</Text>
              </View>
            </Pressable>
          </ListItemEntrance>
        )}
        ListEmptyComponent={
          list.loading ? (
            <Loading />
          ) : !list.error ? (
            <EmptyState
              title={
                followers ? t('profile.noFollowers') : t('profile.noFollowing')
              }
            />
          ) : null
        }
      />
    </Screen>
  );
}
