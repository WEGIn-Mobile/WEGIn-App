import { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { router, useNavigation } from 'expo-router';
import {
  usePreventRemove,
  usePreventRemoveContext,
  useRoute,
  type NavigationAction,
} from '@react-navigation/native';
import { useSession } from './use-session';

export function useEditorExit(dirty: boolean, busy: boolean) {
  const { user } = useSession();
  const navigation = useNavigation();
  const route = useRoute();
  const { preventedRoutes } = usePreventRemoveContext();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState<NavigationAction | null>(null);
  const [exit, setExit] = useState<NavigationAction | null>(null);
  const leaving = useRef(false);
  const exiting = saved || !!exit;
  const prevented = !!preventedRoutes[route.key]?.preventRemove;
  usePreventRemove(!!user && !exiting && (dirty || busy), ({ data }) => {
    if (!busy) setPending(data.action);
  });
  useEffect(() => {
    if (!exiting || prevented) return;
    const frame = requestAnimationFrame(() => {
      if (leaving.current) return;
      leaving.current = true;
      Keyboard.dismiss();
      if (exit) navigation.dispatch(exit);
      else if (router.canGoBack()) router.back();
      else router.replace('/profile');
    });
    return () => cancelAnimationFrame(frame);
  }, [exiting, prevented, exit, navigation]);
  return {
    exiting,
    pending,
    complete: () => {
      setPending(null);
      setSaved(true);
    },
    cancel: () => setPending(null),
    discard: () => {
      setExit(pending);
      setPending(null);
    },
  };
}
