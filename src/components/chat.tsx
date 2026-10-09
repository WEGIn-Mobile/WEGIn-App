import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, FlatList, Pressable, Text, View } from 'react-native';
import { Ban } from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
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
import { colors } from '@/styles/theme';
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

const key = (message: Message) => message.id;
export function Chat({ userId }: { userId: string }) {
  const { user } = useSession();
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
    return deletedAt
      ? { ...message, deletedAt, content: 'Mensagem excluída pelo usuário' }
      : message;
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
    [userId, user?.id],
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
          title: profile?.name ?? 'Conversa',
          headerTitle: () =>
            profile ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ver perfil de ${profile.name}`}
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
                  <Text className="font-semibold text-slate-900">
                    {profile.name}
                  </Text>
                  <Text className="text-xs text-slate-500">Ver perfil</Text>
                </View>
              </Pressable>
            ) : (
              <Text>Conversa</Text>
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
            <Loading label="Carregando mensagens..." />
          </View>
        ) : !list.items.length ? (
          <View className="flex-1 justify-center">
            {!list.error && (
              <EmptyState
                title="Comece a conversa"
                description="Envie uma mensagem privada para este perfil."
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
              return (
                <Animated.View
                  entering={FadeIn.duration(180)}
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
                      item.deletedAt
                        ? 'Mensagem excluída pelo usuário'
                        : item.content
                    }
                    accessibilityHint={
                      canDelete ? 'Segure para excluir esta mensagem.' : undefined
                    }
                    accessibilityActions={
                      canDelete
                        ? [{ name: 'delete', label: 'Excluir mensagem' }]
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
                    className={`rounded-2xl px-4 py-3 ${own && !item.deletedAt ? 'bg-brand-500' : 'bg-slate-100'}`}
                  >
                    {item.deletedAt ? (
                      <View className="flex-row items-center gap-2">
                        <Ban size={16} color={colors.muted} />
                        <Text className="italic leading-6 text-slate-500">
                          Mensagem excluída pelo usuário
                        </Text>
                      </View>
                    ) : (
                      <Text
                        selectable={!own}
                        className={`text-base leading-6 ${own ? 'text-white' : 'text-slate-800'}`}
                      >
                        {item.content}
                      </Text>
                    )}
                    <Text
                      className={`mt-1 text-right text-xs ${own && !item.deletedAt ? 'text-white/80' : 'text-slate-500'}`}
                    >
                      {new Date(item.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            }}
            ListFooterComponent={
              list.hasMore ? (
                <View className="py-3">
                  <Button
                    title="Mensagens anteriores"
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
          placeholder="Mensagem..."
          maxLength={1000}
          disabled={!profile || !user || userId === user.id}
          onSend={async (text) => {
            await sendMessage(userId, user!.id, text);
            await list.refresh();
            view.current?.scrollToOffset({ offset: 0, animated: true });
          }}
        />
      </View>
      <ConfirmDialog
        visible={!!selected}
        title="Excluir mensagem?"
        description="A mensagem será substituída por um aviso de exclusão para os dois perfis."
        confirmLabel="Excluir mensagem"
        loading={deleting}
        onConfirm={() => void remove()}
        onCancel={() => setSelected(null)}
      />
    </Screen>
  );
}
