import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useNavigation } from 'expo-router';
import {
  usePreventRemove,
  usePreventRemoveContext,
  useRoute,
  type NavigationAction,
} from '@react-navigation/native';
import { ImagePlus } from 'lucide-react-native';
import { getPost, editPost } from '@/api/posts';
import { errorMessage } from '@/api/api-fetch';
import { publishPost } from '@/services/PostService';
import { useSession } from '@/hooks/use-session';
import type { Post } from '@/types/post';
import { colors } from '@/styles/theme';
import { PostImage } from './post-image';
import {
  Button,
  ConfirmDialog,
  ErrorNotice,
  Field,
  Loading,
  Screen,
} from './common';

export function PostEditor({ postId }: { postId?: string }) {
  const { user } = useSession();
  const navigation = useNavigation();
  const route = useRoute();
  const { preventedRoutes } = usePreventRemoveContext();
  const [post, setPost] = useState<Post | null>(null);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(!!postId);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState(false);
  const [pendingAction, setPendingAction] = useState<NavigationAction | null>(
    null,
  );
  const [exitAction, setExitAction] = useState<NavigationAction | null>(null);
  const submitting = useRef(false);
  const leaving = useRef(false);
  const dirty = content !== (post?.content ?? '') || !!image;
  const exiting = saved || !!exitAction;
  const nativeRemovalPrevented = !!preventedRoutes[route.key]?.preventRemove;

  usePreventRemove(!!user && !exiting && (dirty || busy), ({ data }) => {
    if (!busy) setPendingAction(data.action);
  });

  useEffect(() => {
    if (!exiting || nativeRemovalPrevented) return;
    // The native stack must commit the released guard before removing this screen.
    const frame = requestAnimationFrame(() => {
      if (leaving.current) return;
      leaving.current = true;
      Keyboard.dismiss();
      if (exitAction) {
        navigation.dispatch(exitAction);
        return;
      }
      if (router.canGoBack()) router.back();
      else router.replace('/feed');
    });
    return () => cancelAnimationFrame(frame);
  }, [exiting, nativeRemovalPrevented, exitAction, navigation]);

  useEffect(() => {
    if (!postId) return;
    let active = true;
    setLoading(true);
    setError('');
    getPost(postId)
      .then((result) => {
        if (!active) return;
        if (result.authorId !== user?.id) {
          setError('Você só pode editar suas próprias publicações.');
          return;
        }
        setPost(result);
        setContent(result.content);
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [postId, user?.id, attempt]);

  async function pickImage() {
    if (picking) return;
    setPicking(true);
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (!result.canceled) {
        const selected = result.assets[0];
        if ((selected.fileSize ?? selected.file?.size ?? 0) > 5 * 1024 * 1024) {
          setError('Escolha uma foto de até 5 MB.');
        } else setImage(selected);
      }
    } catch {
      setError('Não foi possível abrir a galeria. Tente novamente.');
    } finally {
      setPicking(false);
    }
  }

  async function submit() {
    if (submitting.current || exiting || (postId && !post)) return;
    if (!postId && !image) {
      setError('Selecione uma foto para publicar.');
      return;
    }
    submitting.current = true;
    Keyboard.dismiss();
    setBusy(true);
    setError('');
    try {
      if (postId) await editPost(postId, content.trim());
      else if (image) await publishPost(image, content);
      setPendingAction(null);
      setSaved(true);
    } catch (cause) {
      submitting.current = false;
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (postId && !post)
    return (
      <Screen>
        <ErrorNotice
          message={error}
          onRetry={() => setAttempt((value) => value + 1)}
        />
      </Screen>
    );

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          <View className="gap-5">
            <Text className="text-base leading-6 text-slate-500">
              {postId
                ? 'Edite a legenda da sua foto.'
                : 'Compartilhe um momento com a comunidade.'}
            </Text>
            <View className="overflow-hidden rounded-2xl bg-slate-50">
              {post ? (
                <PostImage path={post.imageUrl} />
              ) : image ? (
                <Image
                  source={{ uri: image.uri }}
                  style={{ width: '100%', aspectRatio: 1 }}
                  contentFit="contain"
                  accessibilityLabel="Prévia da foto selecionada"
                />
              ) : (
                <View className="aspect-square items-center justify-center gap-4 border border-dashed border-slate-300 p-8">
                  <ImagePlus size={42} color={colors.brand} />
                  <Text className="text-lg font-semibold text-slate-800">
                    Uma foto, um momento
                  </Text>
                  <Text className="text-center text-slate-500">
                    Escolha uma imagem JPEG, PNG ou WebP de até 5 MB.
                  </Text>
                  <Button
                    title="Selecionar foto"
                    secondary
                    loading={picking}
                    onPress={pickImage}
                  />
                </View>
              )}
            </View>
            {!postId && image && (
              <Button
                title="Trocar foto"
                secondary
                disabled={busy}
                loading={picking}
                onPress={pickImage}
              />
            )}
            <Field
              label="Legenda (opcional)"
              placeholder="O que você quer compartilhar?"
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={255}
              editable={!busy && !exiting}
              textAlignVertical="top"
              style={{ minHeight: 110 }}
            />
            <Text className="text-right text-xs text-slate-500">
              {content.length}/255
            </Text>
            <ErrorNotice message={error} />
            <Button
              title={postId ? 'Salvar alterações' : 'Publicar'}
              loading={busy}
              disabled={exiting || picking || (postId ? !dirty : !image)}
              onPress={submit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <ConfirmDialog
        visible={!!pendingAction}
        title="Descartar alterações?"
        description="As alterações que você fez ainda não foram salvas."
        confirmLabel="Descartar"
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          setExitAction(pendingAction);
          setPendingAction(null);
        }}
      />
    </Screen>
  );
}
