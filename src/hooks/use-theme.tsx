import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme } from 'nativewind';
import {
  palettes,
  themeVars,
  type ColorScheme,
  type Palette,
} from '@/styles/theme';

type Theme = { scheme: ColorScheme; colors: Palette; dark: boolean };
const ThemeContext = createContext<Theme>({
  scheme: 'light',
  colors: palettes.light,
  dark: false,
});

/**
 * Resolve o tema atual a partir do NativeWind (que segue o dispositivo quando a
 * preferência é "system") e aplica as variáveis de cor usadas pelas classes.
 * O GluestackUIProvider acima dele define a preferência com setColorScheme.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme } = useColorScheme();
  const scheme: ColorScheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = palettes[scheme];

  useEffect(() => {
    // Fundo da janela nativa: evita clarões brancos em transições no escuro.
    void SystemUI.setBackgroundColorAsync(colors.canvas).catch(() => {});
  }, [colors.canvas]);

  return (
    <ThemeContext.Provider value={{ scheme, colors, dark: scheme === 'dark' }}>
      <View
        style={[themeVars[scheme], { flex: 1, backgroundColor: colors.canvas }]}
      >
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
