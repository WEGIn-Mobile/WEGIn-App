import { useRef } from 'react';
import {
  Keyboard,
  ScrollView,
  TextInput,
  View,
  type ScrollViewProps,
} from 'react-native';
import { useKeyboardInset } from '@/hooks/use-keyboard-inset';

export function FormScrollView({
  style,
  onLayout,
  scrollToEndOnKeyboard = false,
  ...props
}: ScrollViewProps & { scrollToEndOnKeyboard?: boolean }) {
  const { containerRef, keyboardInset, updateKeyboardInset } = useKeyboardInset();
  const scrollRef = useRef<ScrollView>(null);
  return (
    <View
      ref={containerRef}
      collapsable={false}
      onLayout={updateKeyboardInset}
      style={{ flex: 1, paddingBottom: keyboardInset }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        {...props}
        ref={scrollRef}
        style={[{ flex: 1 }, style]}
        onLayout={(event) => {
          if (
            scrollToEndOnKeyboard &&
            Keyboard.isVisible() &&
            TextInput.State.currentlyFocusedInput()
          ) {
            scrollRef.current?.scrollToEnd({ animated: true });
          }
          onLayout?.(event);
        }}
      />
    </View>
  );
}
