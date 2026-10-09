import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, type KeyboardEvent, type View } from 'react-native';

export function useKeyboardInset() {
  const containerRef = useRef<View>(null);
  const keyboardFrame = useRef(Keyboard.metrics());
  const mounted = useRef(true);
  const [keyboardInset, setKeyboardInset] = useState(0);

  const updateKeyboardInset = useCallback(() => {
    const frame = keyboardFrame.current;
    if (!frame) {
      setKeyboardInset(0);
      return;
    }
    // pageY shares the keyboard's screen coordinates; measureInWindow on Android
    // subtracts the visible window's status-bar inset even in edge-to-edge mode.
    containerRef.current?.measure((_x, _y, _width, height, _pageX, pageY) => {
      // A pending measurement must not restore padding after hiding or leaving.
      if (!mounted.current || keyboardFrame.current !== frame) return;
      setKeyboardInset(Math.max(0, pageY + height - frame.screenY));
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    const show = (event: KeyboardEvent) => {
      keyboardFrame.current = event.endCoordinates;
      if (event.duration > 0) Keyboard.scheduleLayoutAnimation(event);
      updateKeyboardInset();
    };
    const hide = () => {
      keyboardFrame.current = undefined;
      setKeyboardInset(0);
    };
    const subscriptions = [
      Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow',
        show,
      ),
      Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        hide,
      ),
    ];
    updateKeyboardInset();
    return () => {
      mounted.current = false;
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [updateKeyboardInset]);

  return { containerRef, keyboardInset, updateKeyboardInset };
}
