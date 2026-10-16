import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { router, Tabs } from 'expo-router';
import {
  Home,
  MessageCircle,
  Plus,
  Search,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { PressableScale } from '@/components/common';
import { useTheme } from '@/hooks/use-theme';
import { useUnread } from '@/hooks/use-unread';
import { useI18n } from '@/i18n';
import { selectionFeedback } from '@/lib/haptics';

function TabIcon({
  icon: Icon,
  color,
  size,
  focused,
}: {
  icon: LucideIcon;
  color: string;
  size: number;
  focused: boolean;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (focused) scale.value = withSequence(withSpring(1.18), withSpring(1));
  }, [focused, scale]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={style}>
      <Icon color={color} size={size} strokeWidth={focused ? 2.4 : 2} />
    </Animated.View>
  );
}

export default function MainLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const unread = useUnread();
  const badge =
    unread.conversations > 0
      ? unread.conversations > 99
        ? '99+'
        : unread.conversations
      : undefined;
  return (
    <Tabs
      screenListeners={{ tabPress: () => selectionFeedback() }}
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          minHeight: 64,
          paddingTop: 4,
          borderTopColor: colors.line,
          backgroundColor: colors.canvas,
        },
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.canvas },
        sceneStyle: { backgroundColor: colors.canvas },
        animation: 'fade',
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: t('tabs.feed'),
          headerTitle: () => (
            <Text className="text-2xl font-bold text-accent">
              WEG<Text className="text-fg">In</Text>
            </Text>
          ),
          headerRight: () => (
            <View className="mr-3 flex-row gap-2">
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={t('tabs.createPost')}
                scaleTo={0.88}
                onPress={() => router.push('/post/create')}
                className="h-11 w-11 items-center justify-center rounded-full bg-brand-50"
              >
                <Plus size={25} color={colors.accent} />
              </PressableScale>
            </View>
          ),
          tabBarIcon: (props) => <TabIcon icon={Home} {...props} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: (props) => <TabIcon icon={Search} {...props} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarBadge: badge,
          tabBarBadgeStyle: {
            backgroundColor: colors.unread,
            color: colors.onUnread,
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarAccessibilityLabel: badge
            ? `${t('tabs.messages')}, ${t('messages.unread', { count: unread.conversations })}`
            : undefined,
          tabBarIcon: (props) => <TabIcon icon={MessageCircle} {...props} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: (props) => <TabIcon icon={UserRound} {...props} />,
        }}
      />
    </Tabs>
  );
}
