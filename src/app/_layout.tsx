import './global.css';
import type { ReactNode } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { SessionProvider, useSession } from '@/hooks/use-session';
import { PreferencesProvider, usePreferences } from '@/hooks/use-preferences';
import { ThemeProvider, useTheme } from '@/hooks/use-theme';
import { UnreadProvider } from '@/hooks/use-unread';
import { I18nProvider, useI18n } from '@/i18n';
import { ErrorNotice, Loading, Screen } from '@/components/common';

function Navigation() {
  const session = useSession();
  const { colors } = useTheme();
  const { t } = useI18n();
  if (session.loading)
    return (
      <Screen top>
        <Loading label={t('common.opening')} />
      </Screen>
    );
  if (session.error)
    return (
      <Screen top>
        <ErrorNotice
          message={session.error}
          onRetry={() => void session.restore()}
        />
      </Screen>
    );
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.canvas },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.canvas },
        headerBackTitle: t('common.back'),
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!session.user}>
        <Stack.Screen
          name="(auth)"
          options={{ headerShown: false, animation: 'fade' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!!session.user}>
        <Stack.Screen
          name="(main)"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="user/[id]"
          options={{ title: t('screens.profile') }}
        />
        <Stack.Screen
          name="post/create"
          options={{
            title: t('screens.newPost'),
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="post/edit"
          options={{ title: t('screens.editPost') }}
        />
        <Stack.Screen name="post/[id]" options={{ title: t('screens.post') }} />
        <Stack.Screen
          name="post/comments"
          options={{ title: t('screens.comments') }}
        />
        <Stack.Screen
          name="profile/edit"
          options={{ title: t('screens.editProfile') }}
        />
        <Stack.Screen
          name="user/connections"
          options={{ title: t('screens.connections') }}
        />
        <Stack.Screen name="chat/[id]" options={{ title: t('screens.chat') }} />
        <Stack.Screen
          name="settings"
          options={{ title: t('screens.settings') }}
        />
      </Stack.Protected>
    </Stack>
  );
}

function ThemedNavigation({ children }: { children: ReactNode }) {
  const { colors, dark } = useTheme();
  const base = dark ? DarkTheme : DefaultTheme;
  return (
    <NavigationThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: colors.accent,
          background: colors.canvas,
          card: colors.canvas,
          text: colors.text,
          border: colors.line,
          notification: colors.unread,
        },
      }}
    >
      <StatusBar style={dark ? 'light' : 'dark'} />
      {children}
    </NavigationThemeProvider>
  );
}

function AppearanceProviders({ children }: { children: ReactNode }) {
  const { theme } = usePreferences();
  return (
    <GluestackUIProvider mode={theme}>
      <ThemeProvider>{children}</ThemeProvider>
    </GluestackUIProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PreferencesProvider>
          <AppearanceProviders>
            <I18nProvider>
              <SessionProvider>
                <UnreadProvider>
                  <ThemedNavigation>
                    <Navigation />
                  </ThemedNavigation>
                </UnreadProvider>
              </SessionProvider>
            </I18nProvider>
          </AppearanceProviders>
        </PreferencesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
