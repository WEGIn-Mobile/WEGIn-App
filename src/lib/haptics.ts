import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Feedback tátil leve para ações sociais. Falhas são ignoradas (web, emulador
// ou aparelho sem motor de vibração).
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

export function tapFeedback() {
  if (enabled)
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function selectionFeedback() {
  if (enabled) void Haptics.selectionAsync().catch(() => {});
}

export function successFeedback() {
  if (enabled)
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => {});
}
