import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';
import { Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { errorMessage } from '@/api/api-fetch';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { ErrorNotice, PressableScale } from './common';

export function MessageComposer({
  placeholder,
  maxLength,
  onSend,
  disabled = false,
}: {
  placeholder: string;
  maxLength: number;
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useI18n();
  const input = useRef<TextInput>(null);
  const sending = useRef(false);
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const blocked = busy || disabled || !content.trim();
  // O botão "acende" com uma pequena mola quando há texto para enviar.
  const ready = useSharedValue(blocked ? 0 : 1);
  useEffect(() => {
    ready.value = withSpring(blocked ? 0 : 1, { damping: 14, stiffness: 220 });
  }, [blocked, ready]);
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + ready.value * 0.6,
    transform: [{ scale: 0.88 + ready.value * 0.12 }],
  }));
  async function send() {
    if (sending.current || disabled || !content.trim()) return;
    sending.current = true;
    setBusy(true);
    setError('');
    try {
      await onSend(content);
      input.current?.clear();
      setContent('');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  return (
    <View
      className="border-t border-line-soft bg-canvas"
      style={{ paddingBottom: insets.bottom }}
    >
      <ErrorNotice message={error} />
      <View className="flex-row items-end gap-3 px-4 py-3">
        <TextInput
          ref={input}
          accessibilityLabel={placeholder}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          selectionColor={colors.accent}
          onChangeText={setContent}
          multiline
          maxLength={maxLength}
          editable={!busy && !disabled}
          className="min-h-12 flex-1 rounded-3xl border border-line bg-surface px-4 py-3 text-base text-fg"
          style={{ maxHeight: 120 }}
        />
        <Animated.View style={buttonStyle}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t('common.send')}
            accessibilityState={{ disabled: blocked, busy }}
            disabled={blocked}
            scaleTo={0.85}
            onPress={() => void send()}
            className="h-12 w-12 items-center justify-center rounded-full bg-brand-500"
          >
            {busy ? (
              <ActivityIndicator color={colors.onBrand} />
            ) : (
              <Send size={21} color={colors.onBrand} />
            )}
          </PressableScale>
        </Animated.View>
      </View>
    </View>
  );
}
