import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import { Ban, MessageCircle, Search } from 'lucide-react-native';
import { getConversations } from '@/api/messages';
import { usePagedList } from '@/hooks/use-paged-list';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { useUnread } from '@/hooks/use-unread';
import { useUserSearch } from '@/hooks/use-user-search';
import { useI18n } from '@/i18n';
import type { Conversation } from '@/types/message';
import type { UserSummary } from '@/types/user';
import { Avatar } from '@/components/avatar';
import { ReadReceipt, UnreadBadge } from '@/components/unread-badge';
import {
  Button,
  EmptyState,
  ErrorNotice,
  ListItemEntrance,
  Loading,
  Screen,
} from '@/components/common';

type Row = {
  user: UserSummary;
  lastMessage: Conversation['lastMessage'] | null;
  unreadCount: number;
};

const key = (item: Conversation) => item.user.id;
export default function MessagesScreen() {
  const { user } = useSession();
  const { colors } = useTheme();
  const { t, formatConversationTime } = useI18n();
  const unread = useUnread();
  const fetchPage = useCallback(
    (skip: number, signal: AbortSignal) => getConversations(skip, signal),
    [],
  );
  const list = usePagedList(fetchPage, key, { pollMs: 15000 });
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const term = query.trim();
  const search = useUserSearch(term, user?.id);
  const searchingUsers = !!term;
  const rows: Row[] = searchingUsers
    ? search.users.map((person) => ({
        user: person,
        lastMessage: null,
        unreadCount: 0,
      }))
    : list.items;

  // Mantém o badge da aba em sincronia quando a lista revela novas mensagens.
  const totalUnread = list.items.reduce(
    (total, item) => total + (item.unreadCount ?? 0),
    0,
  );
  const previousUnread = useRef(totalUnread);
  const listRef = useRef<FlatList<Row>>(null);
  useScrollToTop(listRef);
  const { refresh: refreshUnread } = unread;
  useEffect(() => {
    if (previousUnread.current !== totalUnread) refreshUnread();
    previousUnread.current = totalUnread;
  }, [totalUnread, refreshUnread]);

  function preview(item: Row) {
    const last = item.lastMessage;
    if (!last)
      return <Text className="text-sm text-muted">@{item.user.username}</Text>;
    const own = last.senderId === user?.id;
    const hasUnread = item.unreadCount > 0;
    return (
      <View className="flex-row items-center gap-1">
        {own && !last.deletedAt && <ReadReceipt read={!!last.readAt} />}
        {last.deletedAt && <Ban size={14} color={colors.muted} />}
        <Text
          numberOfLines={1}
          className={`flex-1 text-sm ${last.deletedAt ? 'italic text-muted' : hasUnread ? 'font-semibold text-fg' : 'text-muted'}`}
        >
          {last.deletedAt
            ? t('messages.deleted')
            : `${own ? t('messages.you') : ''}${last.content}`}
        </Text>
      </View>
    );
  }

  return (
    <Screen>
      <View className="px-4 py-3">
        <View
          className={`min-h-12 flex-row items-center gap-3 rounded-xl border bg-surface px-3 ${focused ? 'border-accent' : 'border-line'}`}
        >
          <Search size={20} color={colors.muted} />
          <TextInput
            accessibilityLabel={t('messages.searchLabel')}
            placeholder={t('messages.searchPlaceholder')}
            placeholderTextColor={colors.muted}
            selectionColor={colors.accent}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={60}
            autoCapitalize="none"
            className="min-h-12 flex-1 text-base text-fg"
          />
        </View>
      </View>
      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={(item) => item.user.id}
        refreshing={!searchingUsers && list.loading}
        onRefresh={() => {
          void list.refresh();
          unread.refresh();
        }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <ErrorNotice
            message={searchingUsers ? search.error : list.error}
            onRetry={() =>
              void (searchingUsers ? search.refresh() : list.refresh())
            }
          />
        }
        renderItem={({ item, index }) => {
          const hasUnread = item.unreadCount > 0;
          return (
            <ListItemEntrance index={index}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('messages.chatWith', { name: item.user.name })}${hasUnread ? `, ${t('messages.unread', { count: item.unreadCount })}` : ''}`}
                onPress={() =>
                  router.push({
                    pathname: '/chat/[id]',
                    params: { id: item.user.id },
                  })
                }
                className="flex-row items-center gap-3 border-b border-line-soft px-5 py-4 active:bg-surface"
              >
                <Avatar user={item.user} />
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <Text
                      numberOfLines={1}
                      className={`flex-1 text-fg ${hasUnread ? 'font-bold' : 'font-semibold'}`}
                    >
                      {item.user.name}
                    </Text>
                    {item.lastMessage && (
                      <Text
                        className={`text-xs ${hasUnread ? 'font-semibold text-unread' : 'text-muted'}`}
                      >
                        {formatConversationTime(item.lastMessage.createdAt)}
                      </Text>
                    )}
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1">{preview(item)}</View>
                    <UnreadBadge count={item.unreadCount} />
                  </View>
                </View>
              </Pressable>
            </ListItemEntrance>
          );
        }}
        ListEmptyComponent={
          (searchingUsers ? search.loading : list.loading) ? (
            <Loading />
          ) : !(searchingUsers ? search.error : list.error) ? (
            <EmptyState
              icon={<MessageCircle size={28} color={colors.accent} />}
              title={
                searchingUsers
                  ? term.length < 2
                    ? t('messages.typeMore')
                    : t('messages.noProfiles')
                  : t('messages.emptyTitle')
              }
              description={t('messages.emptyDescription')}
            />
          ) : null
        }
        ListFooterComponent={
          (searchingUsers ? search.hasMore : list.hasMore) ? (
            <View className="p-4">
              <Button
                title={t('common.loadMore')}
                secondary
                loading={searchingUsers ? search.loading : list.loadingMore}
                onPress={() =>
                  void (searchingUsers ? search.loadMore() : list.loadMore())
                }
              />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
