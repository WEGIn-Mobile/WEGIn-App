import './global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { SessionProvider, useSession } from '@/hooks/use-session';
import { ErrorNotice, Loading, Screen } from '@/components/common';
import { colors } from '@/styles/theme';

function Navigation() {
  const session = useSession();
  if (session.loading)
    return (
      <Screen top>
        <Loading label="Abrindo WEGIn..." />
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
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#fff' },
        headerBackTitle: 'Voltar',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!session.user}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!session.user}>
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen name="user/[id]" options={{ title: 'Perfil' }} />
        <Stack.Screen
          name="post/create"
          options={{ title: 'Nova publicação' }}
        />
        <Stack.Screen
          name="post/edit"
          options={{ title: 'Editar publicação' }}
        />
        <Stack.Screen name="post/[id]" options={{ title: 'Publicação' }} />
        <Stack.Screen name="post/comments" options={{ title: 'Comentários' }} />
        <Stack.Screen
          name="profile/edit"
          options={{ title: 'Editar perfil' }}
        />
        <Stack.Screen name="user/connections" options={{ title: 'Conexões' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Conversa' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GluestackUIProvider mode="light">
          <SessionProvider>
            <StatusBar style="dark" />
            <Navigation />
          </SessionProvider>
        </GluestackUIProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
