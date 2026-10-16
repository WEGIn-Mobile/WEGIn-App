import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { deletePost, getComments } from '@/api/posts';
import { errorMessage } from '@/api/api-fetch';
import { publishComment } from '@/services/CommentService';
import { usePagedList } from '@/hooks/use-paged-list';
import { useSession } from '@/hooks/use-session';
import { useKeyboardInset } from '@/hooks/use-keyboard-inset';
import type { Post } from '@/types/post';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { Avatar } from './avatar';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorNotice,
  ListItemEntrance,
  Loading,
  Screen,
} from './common';
import { MessageComposer } from './message-composer';

const key = (item: Post) => item.id;
export function Comments({ postId }: { postId: string }) {
  const { user } = useSession();
  const { colors } = useTheme();
  const { t, formatDate } = useI18n();
  const fetchPage = useCallback(
    (skip: number, signal: AbortSignal) => getComments(postId, skip, signal),
    [postId],
  );
  const list = usePagedList(fetchPage, key);
  const { containerRef, keyboardInset, updateKeyboardInset } =
    useKeyboardInset();
  const [selected, setSelected] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const [error, setError] = useState('');
  async function remove() {
    if (!selected || deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setError('');
    try {
      await deletePost(selected.id);
      setSelected(null);
      await list.refresh();
    } catch (cause) {
      setError(errorMessage(cause));
      setSelected(null);
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }
  return (
    <Screen>
      <View
        ref={containerRef}
        collapsable={false}
        onLayout={updateKeyboardInset}
        style={{ flex: 1, paddingBottom: keyboardInset }}
      >
        <FlatList
          data={list.items}
          keyExtractor={key}
          refreshing={list.loading}
          onRefresh={() => void list.refresh()}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            <>
              <ErrorNotice
                message={list.error}
                onRetry={() => void list.refresh()}
              />
              <ErrorNotice message={error} />
            </>
          }
          renderItem={({ item, index }) => (
            <ListItemEntrance index={index}>
              <View className="flex-row gap-3 border-b border-line-soft px-4 py-4">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.viewProfileOf', {
                    name: item.author.name,
                  })}
                  onPress={() =>
                    router.push({
                      pathname: '/user/[id]',
                      params: { id: item.authorId },
                    })
                  }
                >
                  <Avatar user={item.author} />
                </Pressable>
                <View className="flex-1 gap-1">
                  <Text className="font-semibold text-fg">
                    @{item.author.username}
                  </Text>
                  <Text className="leading-6 text-fg-soft">{item.content}</Text>
                  <Text className="text-xs text-muted">
                    {formatDate(item.createdAt, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </Text>
                </View>
                {item.authorId === user?.id && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('comments.delete')}
                    className="h-11 w-11 items-center justify-center"
                    onPress={() => setSelected(item)}
                  >
                    <Trash2 size={18} color={colors.muted} />
                  </Pressable>
                )}
              </View>
            </ListItemEntrance>
          )}
          ListEmptyComponent={
            list.loading ? (
              <Loading />
            ) : !list.error ? (
              <EmptyState
                title={t('comments.emptyTitle')}
                description={t('comments.emptyDescription')}
              />
            ) : null
          }
          ListFooterComponent={
            list.hasMore ? (
              <View className="p-4">
                <Button
                  title={t('comments.loadMore')}
                  secondary
                  loading={list.loadingMore}
                  onPress={() => void list.loadMore()}
                />
              </View>
            ) : null
          }
        />
        <MessageComposer
          placeholder={t('comments.placeholder')}
          maxLength={255}
          onSend={async (text) => {
            await publishComment(postId, text);
            await list.refresh();
          }}
        />
      </View>
      <ConfirmDialog
        visible={!!selected}
        title={t('comments.deleteTitle')}
        description={t('comments.deleteDescription')}
        confirmLabel={t('comments.deleteConfirm')}
        loading={deleting}
        onConfirm={() => void remove()}
        onCancel={() => setSelected(null)}
      />
    </Screen>
  );
}
