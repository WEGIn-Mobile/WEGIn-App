import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { getProfile } from '@/services/UserService';
import { errorMessage } from '@/api/api-fetch';
import { getFollowing, setFollowing } from '@/api/follows';
import { usePosts } from '@/hooks/use-posts';
import { useSession } from '@/hooks/use-session';
import type { User } from '@/types/user';
import { colors } from '@/styles/theme';
import { Avatar } from './avatar';
import { PostImage } from './post-image';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorNotice,
  Loading,
  Screen,
} from './common';

export function Profile({ userId }: { userId: string }) {
  const session = useSession();
  const own = session.user?.id === userId;
  const [profile, setProfile] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [following, setFollowingState] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
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

  async function toggleFollow() {
    if (followingRequest.current || !profile || own) return;
    followingRequest.current = true;
    setFollowBusy(true);
    setError('');
    try {
      const result = await setFollowing(userId, !following);
      setFollowingState(result.following);
      setProfile((previous) =>
        previous
          ? {
              ...previous,
              followers: Math.max(
                0,
                previous.followers + (result.following ? 1 : -1),
              ),
            }
          : previous,
      );
    } catch (cause) {
      await loadProfile();
      setError(errorMessage(cause));
    } finally {
      followingRequest.current = false;
      setFollowBusy(false);
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
                <View className="gap-5 px-5 py-6">
                  <View className="flex-row items-center justify-between">
                    <Avatar user={profile} large />
                    <View className="flex-row gap-6">
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Ver seguidores"
                        className="items-center"
                        onPress={() =>
                          router.push({
                            pathname: '/user/connections',
                            params: { id: userId, kind: 'followers' },
                          })
                        }
                      >
                        <Text className="text-lg font-bold text-slate-900">
                          {profile.followers}
                        </Text>
                        <Text className="text-xs text-slate-500">
                          Seguidores
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Ver quem este perfil segue"
                        className="items-center"
                        onPress={() =>
                          router.push({
                            pathname: '/user/connections',
                            params: { id: userId, kind: 'following' },
                          })
                        }
                      >
                        <Text className="text-lg font-bold text-slate-900">
                          {profile.following}
                        </Text>
                        <Text className="text-xs text-slate-500">Seguindo</Text>
                      </Pressable>
                    </View>
                    {own && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Sair da conta"
                        className="h-11 w-11 items-center justify-center"
                        onPress={() => setConfirmLogout(true)}
                      >
                        <LogOut color={colors.muted} size={22} />
                      </Pressable>
                    )}
                  </View>
                  <View className="gap-1">
                    <Text className="text-xl font-bold text-slate-900">
                      {profile.name}
                    </Text>
                    <Text className="text-slate-500">@{profile.username}</Text>
                  </View>
                  {!!profile.bio && (
                    <Text className="leading-6 text-slate-700">
                      {profile.bio}
                    </Text>
                  )}
                  {own ? (
                    <View className="gap-3">
                      <Button
                        title="Editar perfil"
                        secondary
                        onPress={() => router.push('/profile/edit')}
                      />
                      <Button
                        title="Nova publicação"
                        onPress={() => router.push('/post/create')}
                      />
                    </View>
                  ) : (
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Button
                          title={following ? 'Seguindo' : 'Seguir'}
                          secondary={following}
                          loading={followBusy}
                          disabled={loading}
                          onPress={() => void toggleFollow()}
                        />
                      </View>
                      <View className="flex-1">
                        <Button
                          title="Mensagem"
                          secondary
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
                  <Text className="mt-2 font-semibold text-slate-900">
                    Publicações
                  </Text>
                </View>
              )
            )}
            <ErrorNotice message={error} onRetry={() => void loadProfile()} />
            <ErrorNotice
              message={list.error}
              onRetry={() => void list.refresh()}
            />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.content || 'Abrir publicação'}
            style={{ flex: 1, maxWidth: '33.333%', padding: 2 }}
            onPress={() =>
              router.push({ pathname: '/post/[id]', params: { id: item.id } })
            }
          >
            <PostImage path={item.imageUrl} thumbnail />
          </Pressable>
        )}
        ListEmptyComponent={
          !loading && !list.loading && !error && !list.error ? (
            <EmptyState
              title="Nenhuma publicação ainda"
              description={
                own
                  ? 'Compartilhe uma foto para começar.'
                  : 'As fotos deste perfil aparecerão aqui.'
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
                title="Carregar mais"
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
        title="Sair da conta?"
        description="Você poderá entrar novamente com seu email e senha."
        confirmLabel="Sair"
        loading={loggingOut}
        onConfirm={logout}
        onCancel={() => setConfirmLogout(false)}
      />
    </Screen>
  );
}
