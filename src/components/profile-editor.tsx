import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { ImagePickerAsset } from 'expo-image-picker';
import { errorMessage } from '@/api/api-fetch';
import { removeAvatar } from '@/api/users';
import { saveAvatar, saveProfile } from '@/services/UserService';
import {
  PhotoPermissionError,
  pickPostPhoto,
  requestPublicationPhotoPermissions,
  type PhotoPermissionIssue,
  type PostPhotoSource,
} from '@/services/PostPhotoService';
import { useSession } from '@/hooks/use-session';
import { useEditorExit } from '@/hooks/use-editor-exit';
import { Avatar } from './avatar';
import { FormScrollView } from './form-scroll-view';
import { PhotoPermissionNotice } from './photo-permission-notice';
import { Button, ConfirmDialog, ErrorNotice, Field, Screen } from './common';

export function ProfileEditor() {
  const session = useSession();
  const initial = useRef(session.user).current!;
  const [name, setName] = useState(initial.name);
  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio ?? '');
  const [photo, setPhoto] = useState<ImagePickerAsset | null>(null);
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [checking, setChecking] = useState(true);
  const [issues, setIssues] = useState<PhotoPermissionIssue[]>([]);
  const [error, setError] = useState('');
  const permissions = useRef<Promise<PhotoPermissionIssue[]> | null>(null);
  const locked = useRef(false);
  const dirty =
    name !== initial.name ||
    username !== initial.username ||
    bio !== (initial.bio ?? '') ||
    !!photo ||
    removing;
  const exit = useEditorExit(dirty, busy || picking);
  const disabled = busy || picking || checking || exit.exiting;
  useEffect(() => {
    let active = true;
    permissions.current ??= requestPublicationPhotoPermissions();
    permissions.current
      .then((result) => {
        if (active) setIssues(result);
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function pick(source: PostPhotoSource) {
    if (disabled || locked.current) return;
    locked.current = true;
    setPicking(true);
    setError('');
    try {
      const selected = await pickPostPhoto(source);
      setIssues((previous) =>
        previous.filter((issue) => issue.source !== source),
      );
      if (selected) {
        setPhoto(selected);
        setRemoving(false);
      }
    } catch (cause) {
      if (cause instanceof PhotoPermissionError)
        setIssues((previous) => [
          ...previous.filter((issue) => issue.source !== source),
          cause.issue,
        ]);
      else setError(errorMessage(cause));
    } finally {
      locked.current = false;
      setPicking(false);
    }
  }
  async function save() {
    if (disabled || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      session.updateUser(await saveProfile({ name, username, bio }));
      if (photo) session.updateUser(await saveAvatar(photo));
      else if (removing) session.updateUser(await removeAvatar());
      exit.complete();
    } catch (cause) {
      locked.current = false;
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  if (!session.user) return null;
  return (
    <Screen>
      <FormScrollView
        scrollToEndOnKeyboard
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <View className="gap-5">
          <View className="items-center gap-3">
            {photo ? (
              <Image
                source={{ uri: photo.uri }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
                accessibilityLabel="Prévia da foto de perfil"
              />
            ) : (
              <Avatar
                user={{
                  ...session.user!,
                  avatarUrl: removing ? null : session.user!.avatarUrl,
                }}
                large
              />
            )}
            <Text className="text-slate-500">
              Sua foto aparece nos posts e nas conversas.
            </Text>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Galeria"
                secondary
                disabled={disabled}
                onPress={() => void pick('library')}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Câmera"
                secondary
                disabled={disabled}
                onPress={() => void pick('camera')}
              />
            </View>
          </View>
          {(photo || session.user?.avatarUrl) && !removing && (
            <Button
              title="Remover foto"
              secondary
              disabled={disabled}
              onPress={() => {
                setPhoto(null);
                setRemoving(true);
              }}
            />
          )}
          <PhotoPermissionNotice
            issues={issues}
            disabled={disabled}
            onRetry={(source) => void pick(source)}
            onError={setError}
          />
          <Field
            label="Nome"
            defaultValue={initial.name}
            onChangeText={setName}
            maxLength={60}
            editable={!disabled}
          />
          <Field
            label="Nome de usuário"
            defaultValue={initial.username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={60}
            editable={!disabled}
          />
          <Field
            label="Bio"
            defaultValue={initial.bio ?? ''}
            onChangeText={setBio}
            placeholder="Conte um pouco sobre você"
            maxLength={160}
            multiline
            textAlignVertical="top"
            style={{ minHeight: 100 }}
            editable={!disabled}
          />
          <Text className="text-right text-xs text-slate-500">
            {bio.length}/160
          </Text>
          <ErrorNotice message={error} />
          <Button
            title="Salvar perfil"
            loading={busy}
            disabled={disabled || !dirty}
            onPress={() => void save()}
          />
        </View>
      </FormScrollView>
      <ConfirmDialog
        visible={!!exit.pending}
        title="Descartar alterações?"
        description="As alterações do perfil ainda não foram salvas."
        confirmLabel="Descartar"
        onConfirm={exit.discard}
        onCancel={exit.cancel}
      />
    </Screen>
  );
}
