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
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { deletePost, setPostLike } from '@/api/posts';
import { errorMessage } from '@/api/api-fetch';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { tapFeedback } from '@/lib/haptics';
import type { Post } from '@/types/post';
import { Avatar } from './avatar';
import { PostImage } from './post-image';
import { ConfirmDialog, ErrorNotice, PressableScale } from './common';

export function PostCard({
  post,
  onDeleted,
}: {
  post: Post;
  onDeleted: (id: string) => void;
}) {
  const { user } = useSession();
  const { colors } = useTheme();
  const { t, formatDate } = useI18n();
  const [liked, setLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const liking = useRef(false);
  const scale = useSharedValue(1);
  const burstScale = useSharedValue(0);
  const burstOpacity = useSharedValue(0);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const burstStyle = useAnimatedStyle(() => ({
    opacity: burstOpacity.value,
    transform: [{ scale: burstScale.value }],
  }));
  useEffect(() => {
    setLiked(post.isLiked);
    setLikes(post.likes);
  }, [post.isLiked, post.likes]);
  const own = user?.id === post.authorId;

  function burst() {
    burstScale.value = 0.3;
    burstOpacity.value = 1;
    burstScale.value = withSpring(1, { damping: 9, stiffness: 180 });
    burstOpacity.value = withDelay(450, withTiming(0, { duration: 250 }));
  }

  // Atualiza na hora e desfaz se a API recusar: a curtida responde ao toque.
  async function toggleLike() {
    if (liking.current) return;
    liking.current = true;
    const next = !liked;
    setLiked(next);
    setLikes((value) => Math.max(0, value + (next ? 1 : -1)));
    setError('');
    tapFeedback();
    scale.value = withSequence(
      withSpring(next ? 1.35 : 0.8, { damping: 6, stiffness: 300 }),
      withSpring(1, { damping: 8, stiffness: 200 }),
    );
    try {
      await setPostLike(post.id, next);
    } catch (cause) {
      setLiked(!next);
      setLikes((value) => Math.max(0, value + (next ? -1 : 1)));
      setError(errorMessage(cause));
    } finally {
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
      className="mb-4 border-b border-line-soft bg-canvas pb-4"
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.viewProfileOf', {
            name: post.author.name,
          })}
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
            <Text className="font-semibold text-fg">{post.author.name}</Text>
            <Text className="text-sm text-muted">@{post.author.username}</Text>
          </View>
        </Pressable>
        {own && (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t('post.options')}
            accessibilityState={{ expanded: menu }}
            scaleTo={0.85}
            onPress={() => setMenu(!menu)}
            className="h-11 w-11 items-center justify-center"
          >
            <MoreHorizontal color={colors.text} size={24} />
          </PressableScale>
        )}
      </View>
      {menu && own && (
        <Animated.View
          entering={FadeInDown.duration(180)}
          exiting={FadeOutUp.duration(140)}
        >
          <View className="mx-4 mb-3 flex-row gap-4 rounded-xl bg-surface p-3">
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMenu(false);
                router.push({
                  pathname: '/post/edit',
                  params: { id: post.id },
                });
              }}
              className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-lg active:bg-surface-strong"
            >
              <Pencil color={colors.accent} size={18} />
              <Text className="font-semibold text-accent">
                {t('post.edit')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMenu(false);
                setConfirm(true);
              }}
              className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-lg active:bg-surface-strong"
            >
              <Trash2 color={colors.dangerText} size={18} />
              <Text className="font-semibold text-danger-fg">
                {t('post.delete')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
      <GestureDetector
        gesture={Gesture.Tap()
          .numberOfTaps(2)
          .runOnJS(true)
          .onEnd((_event, success) => {
            if (!success) return;
            burst();
            if (!liked) void toggleLike();
          })}
      >
        <View collapsable={false}>
          <PostImage key={post.imageUrl} path={post.imageUrl} />
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                alignItems: 'center',
                justifyContent: 'center',
              },
              burstStyle,
            ]}
          >
            <Heart size={96} color="#FFFFFF" fill="#FFFFFF" />
          </Animated.View>
        </View>
      </GestureDetector>
      <View className="gap-2 px-4 pt-2">
        <View className="flex-row items-center gap-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={liked ? t('post.unlike') : t('post.like')}
            accessibilityState={{ selected: liked }}
            onPress={toggleLike}
            className="min-h-11 flex-row items-center gap-2 self-start pr-4"
          >
            <Animated.View style={heartStyle}>
              <Heart
                size={25}
                color={liked ? colors.like : colors.text}
                fill={liked ? colors.like : 'transparent'}
              />
            </Animated.View>
            <Animated.View key={likes} entering={FadeInUp.duration(200)}>
              <Text className="font-semibold text-fg-soft">
                {t('post.likes', { count: likes })}
              </Text>
            </Animated.View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('post.commentsA11y', {
              count: post.comments,
            })}
            className="min-h-11 flex-row items-center gap-2"
            onPress={() =>
              router.push({
                pathname: '/post/comments',
                params: { id: post.id },
              })
            }
          >
            <MessageCircle size={24} color={colors.text} />
            <Text className="font-semibold text-fg-soft">{post.comments}</Text>
          </Pressable>
        </View>
        {!!post.content && (
          <Text className="leading-6 text-fg">
            <Text className="font-semibold">@{post.author.username} </Text>
            {post.content}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('post.openComments')}
          onPress={() =>
            router.push({ pathname: '/post/comments', params: { id: post.id } })
          }
          className="min-h-11 justify-center"
        >
          <Text className="text-muted">
            {post.comments
              ? t('post.viewComments', { count: post.comments })
              : t('post.addComment')}
          </Text>
        </Pressable>
        <Text className="text-xs text-muted">
          {formatDate(post.createdAt, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>
      <ErrorNotice message={error} />
      <ConfirmDialog
        visible={confirm}
        title={t('post.deleteTitle')}
        description={t('post.deleteDescription')}
        confirmLabel={t('post.deleteConfirm')}
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
      />
    </View>
  );
}
