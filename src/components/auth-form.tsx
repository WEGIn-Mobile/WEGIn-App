import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useSession } from '@/hooks/use-session';
import { errorMessage } from '@/api/api-fetch';
import { validateAuthInput } from '@/services/AuthService';
import { colors } from '@/styles/theme';
import { Button, ErrorNotice, Field, Screen } from './common';

export function AuthForm({ registering = false }: { registering?: boolean }) {
  const { signIn } = useSession();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (busy) return;
    const input = {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password,
    };
    const validation = validateAuthInput(input, registering, confirmation);
    setError(validation);
    if (validation) return;
    setBusy(true);
    try {
      await signIn(input, registering);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen top>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View className="mb-9 gap-3">
            <Text className="text-4xl font-bold tracking-tight text-brand-500">
              WEG<Text className="text-slate-900">In</Text>
            </Text>
            <Text className="text-2xl font-bold text-slate-900">
              {registering
                ? 'Faça parte da comunidade'
                : 'Bom ter você por aqui'}
            </Text>
            <Text className="text-base leading-6 text-slate-500">
              {registering
                ? 'Crie sua conta com o email da WEG.'
                : 'Entre para acompanhar e compartilhar momentos.'}
            </Text>
          </View>
          <View className="gap-4">
            {registering && (
              <>
                <Field
                  label="Nome"
                  placeholder="Como você se chama?"
                  value={name}
                  onChangeText={setName}
                  maxLength={60}
                  autoComplete="name"
                  editable={!busy}
                />
                <Field
                  label="Nome de usuário"
                  placeholder="seu.usuario"
                  value={username}
                  onChangeText={setUsername}
                  maxLength={60}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                />
              </>
            )}
            <Field
              label="Email corporativo"
              placeholder="voce@weg.net"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />
            <View className="gap-2">
              <Field
                label="Senha"
                placeholder={
                  registering ? 'Crie uma senha segura' : 'Sua senha'
                }
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!visible}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={registering ? 'new-password' : 'current-password'}
                editable={!busy}
                onSubmitEditing={registering ? undefined : submit}
                returnKeyType={registering ? 'next' : 'go'}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
                onPress={() => setVisible(!visible)}
                className="min-h-11 flex-row items-center gap-2 self-end"
              >
                {visible ? (
                  <EyeOff size={18} color={colors.muted} />
                ) : (
                  <Eye size={18} color={colors.muted} />
                )}
                <Text className="text-sm text-slate-500">
                  {visible ? 'Ocultar senha' : 'Mostrar senha'}
                </Text>
              </Pressable>
            </View>
            {registering && (
              <>
                <Text className="text-sm leading-5 text-slate-500">
                  Use ao menos 8 caracteres, com maiúscula, minúscula, número e
                  símbolo.
                </Text>
                <Field
                  label="Confirmar senha"
                  placeholder="Repita sua senha"
                  value={confirmation}
                  onChangeText={setConfirmation}
                  secureTextEntry={!visible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  editable={!busy}
                  returnKeyType="go"
                  onSubmitEditing={submit}
                />
              </>
            )}
            <ErrorNotice message={error} />
            <Button
              title={registering ? 'Criar conta' : 'Entrar'}
              loading={busy}
              onPress={submit}
            />
          </View>
          <View className="mt-5 flex-row flex-wrap items-center justify-center gap-1">
            <Text className="text-slate-500">
              {registering ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}
            </Text>
            <Link href={registering ? '/login' : '/register'} replace asChild>
              <Pressable
                disabled={busy}
                accessibilityRole="link"
                className="min-h-11 justify-center px-2"
              >
                <Text className="font-semibold text-brand-500">
                  {registering ? 'Entrar' : 'Cadastre-se'}
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
