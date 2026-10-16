import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { UserCheck, UserPlus } from 'lucide-react-native';
import Animated, {
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { PressableScale } from './common';

/** Botão Seguir/Seguindo com troca animada de estado. */
export function FollowButton({
  following,
  disabled,
  onPress,
}: {
  following: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const pulse = useSharedValue(1);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    pulse.value = withSequence(
      withSpring(1.06, { damping: 8, stiffness: 320 }),
      withSpring(1, { damping: 10, stiffness: 220 }),
    );
  }, [following, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const Icon = following ? UserCheck : UserPlus;
  return (
    <Animated.View style={pulseStyle}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={
          following ? t('profile.unfollowA11y') : t('profile.follow')
        }
        accessibilityState={{ selected: following, disabled }}
        disabled={disabled}
        onPress={onPress}
        className={`min-h-12 flex-row items-center justify-center gap-2 rounded-xl px-4 py-3 ${following ? 'border border-line bg-canvas' : 'bg-brand-500'} ${disabled ? 'opacity-50' : ''}`}
      >
        <Animated.View key={String(following)} entering={ZoomIn.duration(220)}>
          <View>
            <Icon
              size={18}
              color={following ? colors.accent : colors.onBrand}
            />
          </View>
        </Animated.View>
        <Text
          className={`text-base font-semibold ${following ? 'text-accent' : 'text-on-brand'}`}
        >
          {following ? t('profile.following') : t('profile.follow')}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}
