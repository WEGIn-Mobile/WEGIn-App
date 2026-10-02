import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Heart, MoreHorizontal, Pencil, Trash2 } from 'lucide-react-native';
import { deletePost, setPostLike } from '@/api/posts';
import { errorMessage } from '@/api/api-fetch';
import { useSession } from '@/hooks/use-session';
import { colors } from '@/styles/theme';
import type { Post } from '@/types/post';
import { Avatar } from './avatar';
import { PostImage } from './post-image';
import { ConfirmDialog, ErrorNotice } from './common';

export function PostCard({
  post,
  onDeleted,
}: {
  post: Post;
  onDeleted: (id: string) => void;
}) {
  const { user } = useSession();
  const [liked, setLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setLiked(post.isLiked);
    setLikes(post.likes);
  }, [post.isLiked, post.likes]);
  const own = user?.id === post.authorId;

  async function toggleLike() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await setPostLike(post.id, !liked);
      setLiked(!liked);
      setLikes((value) => value + (liked ? -1 : 1));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setDeleting(true);
    setError('');
    try {
      await deletePost(post.id);
      setConfirm(false);
      onDeleted(post.id);
    } catch (cause) {
      setConfirm(false);
      setError(errorMessage(cause));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View
      testID={`post-${post.id}`}
      className="mb-4 border-b border-slate-100 bg-white pb-4"
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${post.author.name}`}
          className="flex-1 flex-row items-center gap-3"
          onPress={() =>
            router.push({
              pathname: '/user/[id]',
              params: { id: post.authorId },
            })
          }
        >
          <Avatar user={post.author} />
          <View className="flex-1">
            <Text className="font-semibold text-slate-900">
              {post.author.name}
            </Text>
            <Text className="text-sm text-slate-500">
              @{post.author.username}
            </Text>
          </View>
        </Pressable>
        {own && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Opções da publicação"
            accessibilityState={{ expanded: menu }}
            onPress={() => setMenu(!menu)}
            className="h-11 w-11 items-center justify-center"
          >
            <MoreHorizontal color={colors.text} size={24} />
          </Pressable>
        )}
      </View>
      {menu && own && (
        <View className="mx-4 mb-3 flex-row gap-4 rounded-xl bg-slate-50 p-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMenu(false);
              router.push({ pathname: '/post/edit', params: { id: post.id } });
            }}
            className="min-h-11 flex-1 flex-row items-center justify-center gap-2"
          >
            <Pencil color={colors.brand} size={18} />
            <Text className="font-semibold text-brand-500">Editar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMenu(false);
              setConfirm(true);
            }}
            className="min-h-11 flex-1 flex-row items-center justify-center gap-2"
          >
            <Trash2 color={colors.danger} size={18} />
            <Text className="font-semibold text-red-600">Excluir</Text>
          </Pressable>
        </View>
      )}
      <PostImage key={post.imageUrl} path={post.imageUrl} />
      <View className="gap-2 px-4 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            liked ? 'Descurtir publicação' : 'Curtir publicação'
          }
          accessibilityState={{ selected: liked, disabled: busy }}
          disabled={busy}
          onPress={toggleLike}
          className="min-h-11 flex-row items-center gap-2 self-start pr-4"
        >
          <Heart
            size={25}
            color={liked ? colors.danger : colors.text}
            fill={liked ? colors.danger : 'transparent'}
          />
          <Text className="font-semibold text-slate-700">
            {likes} {likes === 1 ? 'curtida' : 'curtidas'}
          </Text>
        </Pressable>
        {!!post.content && (
          <Text className="leading-6 text-slate-800">
            <Text className="font-semibold">@{post.author.username} </Text>
            {post.content}
          </Text>
        )}
        <Text className="text-xs text-slate-500">
          {new Date(post.createdAt).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>
      <ErrorNotice message={error} />
      <ConfirmDialog
        visible={confirm}
        title="Excluir publicação?"
        description="A foto e a legenda serão removidas. Essa ação não pode ser desfeita."
        confirmLabel="Excluir publicação"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
      />
    </View>
  );
}
