import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { getConversations } from '@/api/messages';
import { usePagedList } from '@/hooks/use-paged-list';
import { useSession } from '@/hooks/use-session';
import { useUserSearch } from '@/hooks/use-user-search';
import type { Conversation } from '@/types/message';
import type { UserSummary } from '@/types/user';
import { Avatar } from '@/components/avatar';
import {
  Button,
  EmptyState,
  ErrorNotice,
  Loading,
  Screen,
} from '@/components/common';
import { colors } from '@/styles/theme';

const key = (item: Conversation) => item.user.id;
export default function MessagesScreen() {
  const { user } = useSession();
  const fetchPage = useCallback(
    (skip: number, signal: AbortSignal) => getConversations(skip, signal),
    [],
  );
  const list = usePagedList(fetchPage, key, { pollMs: 15000 });
  const [query, setQuery] = useState('');
  const term = query.trim();
  const search = useUserSearch(term, user?.id);
  const searchingUsers = !!term;
  const rows: {
    user: UserSummary;
    lastMessage: Conversation['lastMessage'] | null;
    unreadCount: number;
  }[] = searchingUsers
    ? search.users.map((person) => ({
        user: person,
        lastMessage: null,
        unreadCount: 0,
      }))
    : list.items;
  return (
    <Screen>
      <View className="px-4 py-3">
        <TextInput
          accessibilityLabel="Procurar usuário para conversar"
          placeholder="Procurar usuário"
          placeholderTextColor={colors.muted}
          onChangeText={setQuery}
          maxLength={60}
          autoCapitalize="none"
          className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
        />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.user.id}
        refreshing={!searchingUsers && list.loading}
        onRefresh={() => void list.refresh()}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <ErrorNotice
            message={searchingUsers ? search.error : list.error}
            onRetry={() =>
              void (searchingUsers ? search.refresh() : list.refresh())
            }
          />
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Conversar com ${item.user.name}${item.unreadCount > 0 ? `, ${item.unreadCount} mensagens não lidas` : ''}`}
            onPress={() =>
              router.push({
                pathname: '/chat/[id]',
                params: { id: item.user.id },
              })
            }
            className="flex-row items-center gap-3 border-b border-slate-100 px-5 py-4"
          >
            <Avatar user={item.user} />
            <View className="flex-1 gap-1">
              <Text
                className={`text-slate-900 ${item.unreadCount > 0 ? 'font-bold' : 'font-semibold'}`}
              >
                {item.user.name}
              </Text>
              <Text numberOfLines={1} className="text-sm text-slate-500">
                {item.lastMessage?.deletedAt
                  ? 'Mensagem excluída pelo usuário'
                  : item.lastMessage
                    ? `${item.lastMessage.senderId === user?.id ? 'Você: ' : ''}${item.lastMessage.content}`
                    : `@${item.user.username}`}
              </Text>
            </View>
            {item.lastMessage && (
              <View className="items-end gap-2">
                <Text className="text-xs text-slate-400">
                  {new Date(item.lastMessage.createdAt).toLocaleDateString(
                    'pt-BR',
                    { day: '2-digit', month: '2-digit' },
                  )}
                </Text>
                {item.unreadCount > 0 && (
                  <View
                    accessibilityLabel="Mensagens não lidas"
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: colors.unread,
                    }}
                  />
                )}
              </View>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          (searchingUsers ? search.loading : list.loading) ? (
            <Loading />
          ) : !(searchingUsers ? search.error : list.error) ? (
            <EmptyState
              title={
                searchingUsers
                  ? term.length < 2
                    ? 'Digite pelo menos 2 caracteres'
                    : 'Nenhum perfil encontrado'
                  : 'Suas conversas começam aqui'
              }
              description="Procure alguém para enviar uma mensagem."
            />
          ) : null
        }
        ListFooterComponent={
          (searchingUsers ? search.hasMore : list.hasMore) ? (
            <View className="p-4">
              <Button
                title="Carregar mais"
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
