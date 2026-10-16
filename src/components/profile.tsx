import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  ImagePlus,
  LogOut,
  MessageCircle,
  Pencil,
  Settings,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { getProfile } from '@/services/UserService';
import { errorMessage } from '@/api/api-fetch';
import { getFollowing, setFollowing } from '@/api/follows';
import { usePosts } from '@/hooks/use-posts';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import type { User } from '@/types/user';
import { Avatar } from './avatar';
import { PostImage } from './post-image';
import { FollowButton } from './follow-button';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorNotice,
  Loading,
  PressableScale,
  Screen,
} from './common';

function Counter({
  value,
  label,
  accessibilityLabel,
  onPress,
}: {
  value: number;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="items-center rounded-lg px-1 active:opacity-60"
      onPress={onPress}
    >
      {/* A troca de chave anima o número quando ele muda (ex.: ao seguir). */}
      <Animated.View key={value} entering={FadeInUp.duration(220)}>
        <Text className="text-lg font-bold text-fg">{value}</Text>
      </Animated.View>
      <Text className="text-xs text-muted">{label}</Text>
    </Pressable>
  );
}

export function Profile({ userId }: { userId: string }) {
  const session = useSession();
  const { colors } = useTheme();
  const { t } = useI18n();
  const own = session.user?.id === userId;
  const [profile, setProfile] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [following, setFollowingState] = useState(false);
  const followingRequest = useRef(false);
  const list = usePosts(userId);

  const loadProfile = useCallback(
    async (isActive: () => boolean = () => true) => {
      setError('');
      setLoading(true);
      try {
        const [result, follows] = await Promise.all([
          getProfile(userId),
          own ? Promise.resolve([]) : getFollowing(),
        ]);
        if (isActive()) {
          setProfile(result);
          setFollowingState(follows.some((person) => person.id === userId));
        }
      } catch (cause) {
        if (isActive()) setError(errorMessage(cause));
      } finally {
        if (isActive()) setLoading(false);
      }
    },
    [userId, own],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadProfile(() => active);
      return () => {
        active = false;
      };
    }, [loadProfile]),
  );

  async function logout() {
    setLoggingOut(true);
    try {
      await session.signOut();
    } catch (cause) {
      setError(errorMessage(cause));
      setConfirmLogout(false);
    } finally {
      setLoggingOut(false);
    }
  }

  function adjustFollowers(delta: number) {
    setProfile((previous) =>
      previous
        ? { ...previous, followers: Math.max(0, previous.followers + delta) }
        : previous,
    );
  }

  // Troca o estado na hora para o botão responder ao toque; desfaz se falhar.
  async function toggleFollow() {
    if (followingRequest.current || !profile || own) return;
    followingRequest.current = true;
    const next = !following;
    setFollowingState(next);
    adjustFollowers(next ? 1 : -1);
    setError('');
    if (next) successFeedback();
    else tapFeedback();
    try {
      const result = await setFollowing(userId, next);
      if (result.following !== next) {
        setFollowingState(result.following);
        adjustFollowers(result.following ? 1 : -1);
      }
    } catch (cause) {
      await loadProfile();
      setError(errorMessage(cause));
    } finally {
      followingRequest.current = false;
    }
  }

  return (
    <Screen>
      <FlatList
        data={profile ? list.posts : []}
        keyExtractor={(post) => post.id}
        numColumns={3}
        refreshing={loading || list.loading}
        onRefresh={() => {
          void loadProfile();
          void list.refresh();
        }}
        ListHeaderComponent={
          <View>
            {loading && !profile ? (
              <Loading />
            ) : (
              profile && (
                <Animated.View entering={FadeIn.duration(250)}>
                  <View className="gap-5 px-5 py-6">
                    <View className="flex-row items-center justify-between">
                      <Avatar user={profile} large />
                      <View className="flex-row gap-6">
                        <Counter
                          value={profile.followers}
                          label={t('profile.followers')}
                          accessibilityLabel={t('profile.viewFollowers')}
                          onPress={() =>
                            router.push({
                              pathname: '/user/connections',
                              params: { id: userId, kind: 'followers' },
                            })
                          }
                        />
                        <Counter
                          value={profile.following}
                          label={t('profile.following')}
                          accessibilityLabel={t('profile.viewFollowing')}
                          onPress={() =>
                            router.push({
                              pathname: '/user/connections',
                              params: { id: userId, kind: 'following' },
                            })
                          }
                        />
                      </View>
                      {own && (
                        <View className="flex-row">
                          <PressableScale
                            accessibilityRole="button"
                            accessibilityLabel={t('profile.settings')}
                            scaleTo={0.85}
                            className="h-11 w-11 items-center justify-center"
                            onPress={() => router.push('/settings')}
                          >
                            <Settings color={colors.muted} size={22} />
                          </PressableScale>
                          <PressableScale
                            accessibilityRole="button"
                            accessibilityLabel={t('profile.logout')}
                            scaleTo={0.85}
                            className="h-11 w-11 items-center justify-center"
                            onPress={() => setConfirmLogout(true)}
                          >
                            <LogOut color={colors.muted} size={22} />
                          </PressableScale>
                        </View>
                      )}
                    </View>
                    <View className="gap-1">
                      <Text className="text-xl font-bold text-fg">
                        {profile.name}
                      </Text>
                      <Text className="text-muted">@{profile.username}</Text>
                    </View>
                    {!!profile.bio && (
                      <Text className="leading-6 text-fg-soft">
                        {profile.bio}
                      </Text>
                    )}
                    {own ? (
                      <View className="flex-row gap-3">
                        <View className="flex-1">
                          <Button
                            title={t('profile.editProfile')}
                            secondary
                            icon={<Pencil size={18} color={colors.accent} />}
                            onPress={() => router.push('/profile/edit')}
                          />
                        </View>
                        <View className="flex-1">
                          <Button
                            title={t('profile.newPost')}
                            icon={
                              <ImagePlus size={18} color={colors.onBrand} />
                            }
                            onPress={() => router.push('/post/create')}
                          />
                        </View>
                      </View>
                    ) : (
                      <View className="flex-row gap-3">
                        <View className="flex-1">
                          <FollowButton
                            following={following}
                            disabled={loading}
                            onPress={() => void toggleFollow()}
                          />
                        </View>
                        <View className="flex-1">
                          <Button
                            title={t('profile.message')}
                            secondary
                            icon={
                              <MessageCircle size={18} color={colors.accent} />
                            }
                            onPress={() =>
                              router.push({
                                pathname: '/chat/[id]',
                                params: { id: userId },
                              })
                            }
                          />
                        </View>
                      </View>
                    )}
                    <Text className="mt-2 font-semibold text-fg">
                      {t('profile.posts')}
                    </Text>
                  </View>
                </Animated.View>
              )
            )}
            <ErrorNotice message={error} onRetry={() => void loadProfile()} />
            <ErrorNotice
              message={list.error}
              onRetry={() => void list.refresh()}
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeIn.duration(260).delay(index < 12 ? index * 30 : 0)}
            style={{ flex: 1, maxWidth: '33.333%', padding: 2 }}
          >
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={item.content || t('post.open')}
              scaleTo={0.95}
              onPress={() =>
                router.push({ pathname: '/post/[id]', params: { id: item.id } })
              }
            >
              <PostImage path={item.imageUrl} thumbnail />
            </PressableScale>
          </Animated.View>
        )}
        ListEmptyComponent={
          !loading && !list.loading && !error && !list.error ? (
            <EmptyState
              icon={<ImagePlus size={28} color={colors.accent} />}
              title={t('profile.emptyTitle')}
              description={
                own ? t('profile.emptyOwn') : t('profile.emptyOther')
              }
            />
          ) : list.loading && !!profile ? (
            <Loading />
          ) : null
        }
        ListFooterComponent={
          list.hasMore && profile ? (
            <View className="p-4">
              <Button
                title={t('common.loadMore')}
                secondary
                loading={list.loadingMore}
                onPress={() => void list.loadMore()}
              />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
      <ConfirmDialog
        visible={confirmLogout}
        title={t('profile.logoutTitle')}
        description={t('profile.logoutDescription')}
        confirmLabel={t('profile.logoutConfirm')}
        loading={loggingOut}
        onConfirm={logout}
        onCancel={() => setConfirmLogout(false)}
      />
    </Screen>
  );
}
