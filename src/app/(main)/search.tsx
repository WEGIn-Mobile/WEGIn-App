import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { searchUsers } from '@/api/users';
import { errorMessage } from '@/api/api-fetch';
import type { UserSummary } from '@/types/user';
import { colors } from '@/styles/theme';
import { Avatar } from '@/components/avatar';
import {
  Button,
  EmptyState,
  ErrorNotice,
  Loading,
  Screen,
} from '@/components/common';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const input = useRef<TextInput>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const request = useRef<AbortController | null>(null);
  const offset = useRef(0);
  const term = query.trim();

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
        offset.current = more
          ? offset.current + page.items.length
          : page.items.length;
        setUsers((previous) =>
          more ? [...previous, ...page.items] : page.items,
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
    [term],
  );

  useEffect(() => {
    request.current?.abort();
    request.current = null;
    setUsers([]);
    setHasMore(false);
    setError('');
    setLoading(term.length >= 2);
    const timer = setTimeout(() => {
      void load();
    }, 400);
    return () => {
      clearTimeout(timer);
      request.current?.abort();
      request.current = null;
    };
  }, [load, term]);

  return (
    <Screen>
      <View className="px-4 pb-3 pt-2">
        <View className="min-h-12 flex-row items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3">
          <Search size={20} color={colors.muted} />
          <TextInput
            ref={input}
            accessibilityLabel="Pesquisar por nome ou usuário"
            placeholder="Nome ou @usuário"
            placeholderTextColor={colors.muted}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            maxLength={60}
            className="min-h-12 flex-1 text-base text-slate-900"
          />
          {!!query && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpar pesquisa"
              onPress={() => {
                input.current?.clear();
                setQuery('');
              }}
              className="h-11 w-11 items-center justify-center"
            >
              <X size={20} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>
      <FlatList
        data={users}
        keyExtractor={(user) => user.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <ErrorNotice message={error} onRetry={() => void load()} />
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
            <View className="flex-1">
              <Text className="font-semibold text-slate-900">{item.name}</Text>
              <Text className="text-sm text-slate-500">@{item.username}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <Loading label="Pesquisando..." />
          ) : !error ? (
            <EmptyState
              title={
                term.length < 2
                  ? 'Encontre pessoas da WEG'
                  : 'Nenhum usuário encontrado'
              }
              description={
                term.length < 2
                  ? 'Digite pelo menos 2 caracteres do nome ou nome de usuário.'
                  : 'Tente pesquisar com outro nome.'
              }
            />
          ) : null
        }
        ListFooterComponent={
          hasMore ? (
            <View className="p-4">
              <Button
                title="Carregar mais"
                secondary
                loading={loading}
                onPress={() => void load(true)}
              />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
