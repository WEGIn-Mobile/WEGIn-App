import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/theme';

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
      className="flex-1 bg-white"
    >
      <View className="mx-auto w-full max-w-2xl flex-1">{children}</View>
    </SafeAreaView>
  );
}

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  secondary = false,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
}) {
  const blocked = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      className={`min-h-12 flex-row items-center justify-center rounded-xl px-4 py-3 ${secondary ? 'border border-slate-200 bg-white' : danger ? 'bg-red-600' : 'bg-brand-500'} ${blocked ? 'opacity-50' : 'active:opacity-75'}`}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.brand : '#fff'} />
      ) : (
        <Text
          className={`text-base font-semibold ${secondary ? 'text-brand-500' : 'text-white'}`}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-slate-700">{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
      />
    </View>
  );
}

export function Loading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <View className="items-center gap-3 py-12">
      <ActivityIndicator color={colors.brand} />
      <Text className="text-slate-500">{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View className="items-center gap-3 px-6 py-12">
      <Text className="text-center text-lg font-semibold text-slate-900">
        {title}
      </Text>
      {description && (
        <Text className="text-center leading-6 text-slate-500">
          {description}
        </Text>
      )}
      {action}
    </View>
  );
}

export function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  if (!message) return null;
  return (
    <View
      accessibilityRole="alert"
      className="mx-4 my-3 gap-3 rounded-xl bg-red-50 p-4"
    >
      <Text className="leading-5 text-red-700">{message}</Text>
      {onRetry && (
        <Button title="Tentar novamente" secondary onPress={onRetry} />
      )}
    </View>
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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View
          accessibilityViewIsModal
          className="w-full max-w-sm gap-4 rounded-2xl bg-white p-6"
        >
          <Text className="text-xl font-bold text-slate-900">{title}</Text>
          <Text className="leading-6 text-slate-600">{description}</Text>
          <Button
            title={confirmLabel}
            danger
            loading={loading}
            onPress={onConfirm}
          />
          <Button
            title="Cancelar"
            secondary
            disabled={loading}
            onPress={onCancel}
          />
        </View>
      </View>
    </Modal>
  );
}
