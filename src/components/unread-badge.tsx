import { Text, View } from 'react-native';
import { Check, CheckCheck } from 'lucide-react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

/** Contador verde de mensagens não lidas, como no WhatsApp. */
export function UnreadBadge({ count }: { count: number }) {
  const { t } = useI18n();
  if (count <= 0) return null;
  return (
    <Animated.View
      entering={ZoomIn.duration(240)}
      exiting={ZoomOut.duration(160)}
    >
      <View
        accessibilityLabel={t('messages.unread', { count })}
        className="h-[22px] min-w-[22px] items-center justify-center rounded-full bg-unread px-1.5"
      >
        <Text className="text-xs font-bold text-on-unread">
          {count > 99 ? '99+' : count}
        </Text>
      </View>
    </Animated.View>
  );
}

/** ✓ enviada / ✓✓ lida (na cor de destaque) para mensagens próprias. */
export function ReadReceipt({
  read,
  onBrand = false,
}: {
  read: boolean;
  onBrand?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const color = onBrand
    ? read
      ? '#7DD3FC'
      : 'rgba(255,255,255,0.75)'
    : read
      ? colors.accent
      : colors.muted;
  const Icon = read ? CheckCheck : Check;
  return (
    <Icon
      size={15}
      color={color}
      accessibilityLabel={read ? t('messages.read') : t('messages.sent')}
    />
  );
}
