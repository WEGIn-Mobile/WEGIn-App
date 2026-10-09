import { useRef, useState } from 'react';
import { Pressable, TextInput, View, ActivityIndicator } from 'react-native';
import { Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/styles/theme';
import { errorMessage } from '@/api/api-fetch';
import { ErrorNotice } from './common';

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
  const input = useRef<TextInput>(null);
  const sending = useRef(false);
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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
      className="border-t border-slate-100 bg-white"
      style={{ paddingBottom: insets.bottom }}
    >
      <ErrorNotice message={error} />
      <View className="flex-row items-end gap-3 px-4 py-3">
        <TextInput
          ref={input}
          accessibilityLabel={placeholder}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          onChangeText={setContent}
          multiline
          maxLength={maxLength}
          editable={!busy && !disabled}
          className="min-h-12 flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
          style={{ maxHeight: 120 }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar"
          accessibilityState={{
            disabled: busy || disabled || !content.trim(),
            busy,
          }}
          disabled={busy || disabled || !content.trim()}
          onPress={() => void send()}
          className={`h-12 w-12 items-center justify-center rounded-full bg-brand-500 ${busy || disabled || !content.trim() ? 'opacity-40' : ''}`}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Send size={21} color="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  );
}
