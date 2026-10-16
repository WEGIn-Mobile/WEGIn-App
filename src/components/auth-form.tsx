import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useSession } from '@/hooks/use-session';
import { errorMessage } from '@/api/api-fetch';
import { validateAuthInput } from '@/services/AuthService';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, ErrorNotice, Field, Screen } from './common';
import { FormScrollView } from './form-scroll-view';

export function AuthForm({ registering = false }: { registering?: boolean }) {
  const { signIn } = useSession();
  const { colors } = useTheme();
  const { t } = useI18n();
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
      <FormScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <View className="mb-9 gap-3">
            <Text className="text-4xl font-bold tracking-tight text-accent">
              WEG<Text className="text-fg">In</Text>
            </Text>
            <Text className="text-2xl font-bold text-fg">
              {registering ? t('auth.titleRegister') : t('auth.titleLogin')}
            </Text>
            <Text className="text-base leading-6 text-muted">
              {registering
                ? t('auth.subtitleRegister')
                : t('auth.subtitleLogin')}
            </Text>
          </View>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View className="gap-4">
            {registering && (
              <>
                <Field
                  label={t('auth.name')}
                  placeholder={t('auth.namePlaceholder')}
                  onChangeText={setName}
                  maxLength={60}
                  autoComplete="name"
                  editable={!busy}
                />
                <Field
                  label={t('auth.username')}
                  placeholder={t('auth.usernamePlaceholder')}
                  onChangeText={setUsername}
                  maxLength={60}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                />
              </>
            )}
            <Field
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />
            <View className="gap-2">
              <Field
                label={t('auth.password')}
                placeholder={
                  registering
                    ? t('auth.passwordPlaceholderRegister')
                    : t('auth.passwordPlaceholderLogin')
                }
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
                accessibilityLabel={
                  visible ? t('auth.hidePassword') : t('auth.showPassword')
                }
                onPress={() => setVisible(!visible)}
                className="min-h-11 flex-row items-center gap-2 self-end"
              >
                {visible ? (
                  <EyeOff size={18} color={colors.muted} />
                ) : (
                  <Eye size={18} color={colors.muted} />
                )}
                <Text className="text-sm text-muted">
                  {visible ? t('auth.hidePassword') : t('auth.showPassword')}
                </Text>
              </Pressable>
            </View>
            {registering && (
              <>
                <Text className="text-sm leading-5 text-muted">
                  {t('auth.passwordHint')}
                </Text>
                <Field
                  label={t('auth.confirmPassword')}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
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
              title={
                registering ? t('auth.submitRegister') : t('auth.submitLogin')
              }
              loading={busy}
              onPress={submit}
            />
          </View>
        </Animated.View>
        <View className="mt-5 flex-row flex-wrap items-center justify-center gap-1">
          <Text className="text-muted">
            {registering ? t('auth.haveAccount') : t('auth.noAccount')}
          </Text>
          <Link href={registering ? '/login' : '/register'} replace asChild>
            <Pressable
              disabled={busy}
              accessibilityRole="link"
              className="min-h-11 justify-center px-2"
            >
              <Text className="font-semibold text-accent">
                {registering ? t('auth.linkLogin') : t('auth.linkRegister')}
              </Text>
            </Pressable>
          </Link>
        </View>
      </FormScrollView>
    </Screen>
  );
}
