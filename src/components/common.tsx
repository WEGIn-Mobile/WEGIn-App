import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { useTheme } from '@/hooks/use-theme';

export function Screen({
  children,
  top = false,
}: {
  children: ReactNode;
  top?: boolean;
}) {
  return (
    <SafeAreaView
      edges={top ? ['top', 'bottom', 'left', 'right'] : ['left', 'right']}
      className="flex-1 bg-canvas"
    >
      <View className="mx-auto w-full max-w-2xl flex-1">{children}</View>
    </SafeAreaView>
  );
}

const pressSpring = { damping: 15, stiffness: 320, mass: 0.6 };

/**
 * Pressable que encolhe levemente ao toque. O className fica no Pressable
 * interno; `style` posiciona o contêiner animado.
 */
export function PressableScale({
  children,
  style,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  ...props
}: Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  className?: string;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        {...props}
        onPressIn={(event) => {
          scale.value = withSpring(scaleTo, pressSpring);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.value = withSpring(1, pressSpring);
          onPressOut?.(event);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  secondary = false,
  danger = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
  icon?: ReactNode;
}) {
  const { colors } = useTheme();
  const blocked = disabled || loading;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      className={`min-h-12 flex-row items-center justify-center gap-2 rounded-xl px-4 py-3 ${secondary ? 'border border-line bg-canvas' : danger ? 'bg-danger' : 'bg-brand-500'} ${blocked ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.accent : colors.onBrand} />
      ) : (
        <>
          {icon}
          <Text
            className={`text-base font-semibold ${secondary ? 'text-accent' : 'text-on-brand'}`}
          >
            {title}
          </Text>
        </>
      )}
    </PressableScale>
  );
}

// Let the native keyboard own text composition (accents, suggestions and cursor).
export function Field({
  label,
  onFocus,
  onBlur,
  ...props
}: Omit<TextInputProps, 'value'> & { label: string }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-fg-soft">{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={`min-h-12 rounded-xl border bg-surface px-4 py-3 text-base text-fg ${focused ? 'border-accent' : 'border-line'}`}
      />
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <View className="items-center gap-3 py-12">
        <ActivityIndicator color={colors.accent} />
        <Text className="text-muted">{label ?? t('common.loading')}</Text>
      </View>
    </Animated.View>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(320)}>
      <View className="items-center gap-3 px-6 py-12">
        {icon && (
          <View className="mb-1 h-16 w-16 items-center justify-center rounded-full bg-brand-50">
            {icon}
          </View>
        )}
        <Text className="text-center text-lg font-semibold text-fg">
          {title}
        </Text>
        {description && (
          <Text className="text-center leading-6 text-muted">
            {description}
          </Text>
        )}
        {action}
      </View>
    </Animated.View>
  );
}

export function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useI18n();
  if (!message) return null;
  return (
    <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut}>
      <View
        accessibilityRole="alert"
        className="mx-4 my-3 gap-3 rounded-xl bg-danger-soft p-4"
      >
        <Text className="leading-5 text-danger-fg">{message}</Text>
        {onRetry && (
          <Button title={t('common.retry')} secondary onPress={onRetry} />
        )}
      </View>
    </Animated.View>
  );
}

/** Entrada suave dos itens de lista; só os primeiros itens recebem atraso. */
export function ListItemEntrance({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(index < 8 ? index * 45 : 0)}
    >
      {children}
    </Animated.View>
  );
}

export function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={loading ? undefined : onCancel}
    >
      <View className="flex-1 items-center justify-center bg-overlay/50 px-6">
        <Animated.View
          entering={ZoomIn.duration(220)}
          style={{ width: '100%', maxWidth: 384 }}
        >
          <View
            accessibilityViewIsModal
            className="w-full gap-4 rounded-2xl bg-canvas p-6"
          >
            <Text className="text-xl font-bold text-fg">{title}</Text>
            <Text className="leading-6 text-fg-soft">{description}</Text>
            <Button
              title={confirmLabel}
              danger
              loading={loading}
              onPress={onConfirm}
            />
            <Button
              title={t('common.cancel')}
              secondary
              disabled={loading}
              onPress={onCancel}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
