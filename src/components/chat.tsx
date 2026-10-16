import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, FlatList, Pressable, Text, View } from 'react-native';
import { Ban } from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  deleteMessage,
  getMessages,
  markConversationRead,
} from '@/api/messages';
import { fetchProfile } from '@/api/users';
import { errorMessage } from '@/api/api-fetch';
import { sendMessage } from '@/services/MessageService';
import { usePagedList } from '@/hooks/use-paged-list';
import { useKeyboardInset } from '@/hooks/use-keyboard-inset';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { useUnread } from '@/hooks/use-unread';
import { useI18n } from '@/i18n';
import { successFeedback } from '@/lib/haptics';
import type { Message } from '@/types/message';
import type { User } from '@/types/user';
import { Avatar } from './avatar';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorNotice,
  Loading,
  Screen,
} from './common';
import { MessageComposer } from './message-composer';
import { ReadReceipt } from './unread-badge';

const key = (message: Message) => message.id;
export function Chat({ userId }: { userId: string }) {
  const { user } = useSession();
  const { colors } = useTheme();
  const { t, formatDate } = useI18n();
  const unread = useUnread();
  const refreshUnread = unread.refresh;
  const [mountedAt] = useState(() => Date.now());
  const [profile, setProfile] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [readError, setReadError] = useState('');
  const deletionLock = useRef(false);
  const deletedMessages = useRef(new Map<string, string>());
  const reconcile = useCallback((message: Message) => {
    const deletedAt = deletedMessages.current.get(message.id);
    return deletedAt ? { ...message, deletedAt, content: '' } : message;
  }, []);
  const view = useRef<FlatList<Message>>(null);
  const { containerRef, keyboardInset, updateKeyboardInset } =
    useKeyboardInset();
  const fetchPage = useCallback(
    async (skip: number, signal: AbortSignal) => {
      const page = await getMessages(userId, skip, signal);
      if (!signal.aborted)
        for (const message of page.deletedMessages ?? []) {
          if (message.deletedAt)
            deletedMessages.current.set(message.id, message.deletedAt);
        }
      const items = [...page.items].reverse();
      const incoming = items.find(
        (item) =>
          item.receiverId === user?.id &&
          item.readAt === null &&
          !item.deletedAt,
      );
      if (skip === 0 && !incoming && !signal.aborted) setReadError('');
      if (
        skip === 0 &&
        incoming &&
        !signal.aborted &&
        AppState.currentState === 'active'
      ) {
        try {
          await markConversationRead(userId, incoming.id, signal);
          if (!signal.aborted) {
            setReadError('');
            refreshUnread();
          }
          const readAt = new Date().toISOString();
          return {
            ...page,
            items: items.map((item) =>
              item.receiverId === user?.id && !item.readAt
                ? { ...item, readAt }
                : item,
            ),
          };
        } catch (cause) {
          if (!signal.aborted) setReadError(errorMessage(cause));
        }
      }
      return { ...page, items };
    },
    [userId, user?.id, refreshUnread],
  );
  const list = usePagedList(fetchPage, key, {
    pollMs: 7000,
    keepOnRefresh: true,
    reconcile,
  });
  async function remove() {
    if (!selected || deletionLock.current) return;
    deletionLock.current = true;
    setDeleting(true);
    setActionError('');
    try {
      const deleted = await deleteMessage(selected.id);
      list.replace(deleted);
      setSelected(null);
      await list.refresh();
    } catch (cause) {
      setSelected(null);
      setActionError(errorMessage(cause));
    } finally {
      deletionLock.current = false;
      setDeleting(false);
    }
  }
  useEffect(() => {
    let active = true;
    setError('');
    fetchProfile(userId)
      .then((result) => {
        if (active) setProfile(result);
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [userId, attempt]);
  return (
    <Screen>
      <Stack.Screen
        options={{
          title: profile?.name ?? t('screens.chat'),
          headerTitle: () =>
            profile ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.viewProfileOf', {
                  name: profile.name,
                })}
                className="flex-row items-center gap-3"
                onPress={() =>
                  router.push({
                    pathname: '/user/[id]',
                    params: { id: userId },
                  })
                }
              >
                <Avatar user={profile} />
                <View>
                  <Text className="font-semibold text-fg">{profile.name}</Text>
                  <Text className="text-xs text-muted">
                    {t('chat.viewProfile')}
                  </Text>
                </View>
              </Pressable>
            ) : (
              <Text className="font-semibold text-fg">{t('screens.chat')}</Text>
            ),
        }}
      />
      <View
        ref={containerRef}
        collapsable={false}
        onLayout={updateKeyboardInset}
        style={{ flex: 1, paddingBottom: keyboardInset }}
      >
        <ErrorNotice
          message={error}
          onRetry={() => setAttempt((value) => value + 1)}
        />
        <ErrorNotice message={list.error} onRetry={() => void list.refresh()} />
        <ErrorNotice message={actionError} />
        <ErrorNotice message={readError} onRetry={() => void list.refresh()} />
        {list.loading && !list.items.length ? (
          <View className="flex-1 justify-center">
            <Loading label={t('chat.loading')} />
          </View>
        ) : !list.items.length ? (
          <View className="flex-1 justify-center">
            {!list.error && (
              <EmptyState
                title={t('chat.emptyTitle')}
                description={t('chat.emptyDescription')}
              />
            )}
          </View>
        ) : (
          <FlatList
            ref={view}
            data={list.items}
            keyExtractor={key}
            inverted
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            renderItem={({ item }) => {
              const own = item.senderId === user?.id;
              const canDelete = own && !item.deletedAt;
              const fresh = new Date(item.createdAt).getTime() > mountedAt;
              return (
                <Animated.View
                  entering={
                    fresh ? FadeInDown.duration(260) : FadeIn.duration(180)
                  }
                  style={{
                    alignSelf: own ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    marginBottom: 10,
                  }}
                >
                  <Pressable
                    disabled={!canDelete || deleting}
                    delayLongPress={450}
                    onLongPress={() => setSelected(item)}
                    accessibilityRole={canDelete ? 'button' : undefined}
                    accessibilityLabel={
                      item.deletedAt ? t('messages.deleted') : item.content
                    }
                    accessibilityHint={
                      canDelete ? t('chat.holdToDelete') : undefined
                    }
                    accessibilityActions={
                      canDelete
                        ? [{ name: 'delete', label: t('chat.deleteAction') }]
                        : undefined
                    }
                    onAccessibilityAction={({ nativeEvent }) => {
                      if (
                        nativeEvent.actionName === 'delete' &&
                        canDelete &&
                        !deleting
                      )
                        setSelected(item);
                    }}
                    className={`rounded-2xl px-4 py-3 ${own && !item.deletedAt ? 'rounded-br-md bg-brand-500' : `bg-surface-strong ${own ? 'rounded-br-md' : 'rounded-bl-md'}`}`}
                  >
                    {item.deletedAt ? (
                      <View className="flex-row items-center gap-2">
                        <Ban size={16} color={colors.muted} />
                        <Text className="italic leading-6 text-muted">
                          {t('messages.deleted')}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        selectable={!own}
                        className={`text-base leading-6 ${own ? 'text-on-brand' : 'text-fg'}`}
                      >
                        {item.content}
                      </Text>
                    )}
                    <View className="mt-1 flex-row items-center justify-end gap-1">
                      <Text
                        className={`text-xs ${own && !item.deletedAt ? 'text-on-brand/80' : 'text-muted'}`}
                      >
                        {formatDate(item.createdAt, {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      {own && !item.deletedAt && (
                        <ReadReceipt read={!!item.readAt} onBrand />
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            }}
            ListFooterComponent={
              list.hasMore ? (
                <View className="py-3">
                  <Button
                    title={t('chat.older')}
                    secondary
                    loading={list.loadingMore}
                    onPress={() => void list.loadMore()}
                  />
                </View>
              ) : null
            }
          />
        )}
        <MessageComposer
          placeholder={t('chat.placeholder')}
          maxLength={1000}
          disabled={!profile || !user || userId === user.id}
          onSend={async (text) => {
            await sendMessage(userId, user!.id, text);
            successFeedback();
            await list.refresh();
            view.current?.scrollToOffset({ offset: 0, animated: true });
          }}
        />
      </View>
      <ConfirmDialog
        visible={!!selected}
        title={t('chat.deleteTitle')}
        description={t('chat.deleteDescription')}
        confirmLabel={t('chat.deleteAction')}
        loading={deleting}
        onConfirm={() => void remove()}
        onCancel={() => setSelected(null)}
      />
    </Screen>
  );
}
