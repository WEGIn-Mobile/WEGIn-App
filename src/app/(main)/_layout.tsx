import { Pressable, Text } from 'react-native';
import { router, Tabs } from 'expo-router';
import { Home, Plus, Search, UserRound } from 'lucide-react-native';
import { colors } from '@/styles/theme';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          minHeight: 64,
          paddingTop: 4,
          borderTopColor: colors.border,
          backgroundColor: '#fff',
        },
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: '#fff' },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Início',
          headerTitle: () => (
            <Text className="text-2xl font-bold text-brand-500">
              WEG<Text className="text-slate-900">In</Text>
            </Text>
          ),
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Criar publicação"
              onPress={() => router.push('/post/create')}
              className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-brand-50"
            >
              <Plus size={25} color={colors.brand} />
            </Pressable>
          ),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Pesquisar',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Meu perfil',
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
