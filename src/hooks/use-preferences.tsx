import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getPreference, setPreference } from '@/lib/preferences-storage';
import type { ThemePreference } from '@/styles/theme';
import type { LanguagePreference } from '@/i18n';

type Preferences = {
  theme: ThemePreference;
  language: LanguagePreference;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: LanguagePreference) => void;
};

const themes: ThemePreference[] = ['system', 'light', 'dark'];
const languages: LanguagePreference[] = ['system', 'pt', 'en', 'es'];
const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [language, setLanguageState] = useState<LanguagePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getPreference('pref_theme'), getPreference('pref_language')])
      .then(([savedTheme, savedLanguage]) => {
        if (!active) return;
        const nextTheme = themes.find((item) => item === savedTheme);
        const nextLanguage = languages.find((item) => item === savedLanguage);
        if (nextTheme) setThemeState(nextTheme);
        if (nextLanguage) setLanguageState(nextLanguage);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Evita mostrar o tema/idioma do dispositivo antes da escolha salva.
  if (!ready) return null;

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        language,
        setTheme: (value) => {
          setThemeState(value);
          void setPreference('pref_theme', value);
        },
        setLanguage: (value) => {
          setLanguageState(value);
          void setPreference('pref_language', value);
        },
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const preferences = useContext(PreferencesContext);
  if (!preferences)
    throw new Error('usePreferences deve estar dentro de PreferencesProvider.');
  return preferences;
}
