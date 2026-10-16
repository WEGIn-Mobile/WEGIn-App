import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import { Search, X } from 'lucide-react-native';
import { searchUsers } from '@/api/users';
import { errorMessage } from '@/api/api-fetch';
import type { UserSummary } from '@/types/user';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { Avatar } from '@/components/avatar';
import {
  Button,
  EmptyState,
  ErrorNotice,
  ListItemEntrance,
  Loading,
  Screen,
} from '@/components/common';

export default function SearchScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const input = useRef<TextInput>(null);
  const listRef = useRef<FlatList<UserSummary>>(null);
  useScrollToTop(listRef);
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
        <View
          className={`min-h-12 flex-row items-center gap-3 rounded-xl border bg-surface px-3 ${focused ? 'border-accent' : 'border-line'}`}
        >
          <Search size={20} color={colors.muted} />
          <TextInput
            ref={input}
            accessibilityLabel={t('search.label')}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.muted}
            selectionColor={colors.accent}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            maxLength={60}
            className="min-h-12 flex-1 text-base text-fg"
          />
          {!!query && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('search.clear')}
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
        ref={listRef}
        data={users}
        keyExtractor={(user) => user.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <ErrorNotice message={error} onRetry={() => void load()} />
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
              <View className="flex-1">
                <Text className="font-semibold text-fg">{item.name}</Text>
                <Text className="text-sm text-muted">@{item.username}</Text>
              </View>
            </Pressable>
          </ListItemEntrance>
        )}
        ListEmptyComponent={
          loading ? (
            <Loading label={t('search.searching')} />
          ) : !error ? (
            <EmptyState
              icon={<Search size={28} color={colors.accent} />}
              title={
                term.length < 2 ? t('search.introTitle') : t('search.noneTitle')
              }
              description={
                term.length < 2
                  ? t('search.introDescription')
                  : t('search.noneDescription')
              }
            />
          ) : null
        }
        ListFooterComponent={
          hasMore ? (
            <View className="p-4">
              <Button
                title={t('common.loadMore')}
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
