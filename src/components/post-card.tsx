import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
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
  const liking = useRef(false);
  const scale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  useEffect(() => {
    setLiked(post.isLiked);
    setLikes(post.likes);
  }, [post.isLiked, post.likes]);
  const own = user?.id === post.authorId;

  async function toggleLike() {
    if (liking.current) return;
    liking.current = true;
    setBusy(true);
    setError('');
    try {
      await setPostLike(post.id, !liked);
      setLiked(!liked);
      setLikes((value) => value + (liked ? -1 : 1));
      scale.value = withSequence(withSpring(1.3), withSpring(1));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
      liking.current = false;
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
      <GestureDetector
        gesture={Gesture.Tap()
          .numberOfTaps(2)
          .runOnJS(true)
          .onEnd((_event, success) => {
            if (success && !liked) void toggleLike();
          })}
      >
        <View collapsable={false}>
          <PostImage key={post.imageUrl} path={post.imageUrl} />
        </View>
      </GestureDetector>
      <View className="gap-2 px-4 pt-2">
        <View className="flex-row items-center gap-4">
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
            <Animated.View style={heartStyle}>
              <Heart
                size={25}
                color={liked ? colors.danger : colors.text}
                fill={liked ? colors.danger : 'transparent'}
              />
            </Animated.View>
            <Text className="font-semibold text-slate-700">
              {likes} {likes === 1 ? 'curtida' : 'curtidas'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver ${post.comments} comentários`}
            className="min-h-11 flex-row items-center gap-2"
            onPress={() =>
              router.push({
                pathname: '/post/comments',
                params: { id: post.id },
              })
            }
          >
            <MessageCircle size={24} color={colors.text} />
            <Text className="font-semibold text-slate-700">
              {post.comments}
            </Text>
          </Pressable>
        </View>
        {!!post.content && (
          <Text className="leading-6 text-slate-800">
            <Text className="font-semibold">@{post.author.username} </Text>
            {post.content}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir comentários"
          onPress={() =>
            router.push({ pathname: '/post/comments', params: { id: post.id } })
          }
          className="min-h-11 justify-center"
        >
          <Text className="text-slate-500">
            {post.comments
              ? `Ver todos os ${post.comments} comentários`
              : 'Adicionar comentário...'}
          </Text>
        </Pressable>
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
