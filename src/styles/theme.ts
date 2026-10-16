import { vars } from 'nativewind';

export type ColorScheme = 'light' | 'dark';
export type ThemePreference = ColorScheme | 'system';

export type Palette = {
  /** Fundo das telas. */
  canvas: string;
  /** Campos, cartões e áreas destacadas. */
  surface: string;
  /** Balões recebidos e áreas com mais contraste. */
  surfaceStrong: string;
  line: string;
  lineSoft: string;
  /** Texto principal. */
  text: string;
  textSoft: string;
  muted: string;
  /** Preenchimento de botões e balões próprios. */
  brand: string;
  brandSoft: string;
  /** Texto e ícones na cor da marca sobre o fundo da tela. */
  accent: string;
  onBrand: string;
  danger: string;
  dangerSoft: string;
  dangerText: string;
  like: string;
  unread: string;
  onUnread: string;
  overlay: string;
};

export const palettes: Record<ColorScheme, Palette> = {
  light: {
    canvas: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceStrong: '#F1F5F9',
    line: '#E2E8F0',
    lineSoft: '#F1F5F9',
    text: '#0F172A',
    textSoft: '#334155',
    muted: '#64748B',
    brand: '#005CA9',
    brandSoft: '#EAF3FC',
    accent: '#005CA9',
    onBrand: '#FFFFFF',
    danger: '#DC2626',
    dangerSoft: '#FEF2F2',
    dangerText: '#B91C1C',
    like: '#E11D48',
    unread: '#1DAA61',
    onUnread: '#FFFFFF',
    overlay: '#000000',
  },
  dark: {
    canvas: '#0B1120',
    surface: '#111A2E',
    surfaceStrong: '#1A2540',
    line: '#26324A',
    lineSoft: '#172036',
    text: '#F1F5F9',
    textSoft: '#CBD5E1',
    muted: '#94A3B8',
    brand: '#1F6FC0',
    brandSoft: '#13263F',
    accent: '#6CB2F5',
    onBrand: '#FFFFFF',
    danger: '#DC2626',
    dangerSoft: '#2A1418',
    dangerText: '#FCA5A5',
    like: '#FB7185',
    unread: '#21C063',
    onUnread: '#0B1120',
    overlay: '#000000',
  },
};

const tokenNames: Record<keyof Palette, string> = {
  canvas: 'canvas',
  surface: 'surface',
  surfaceStrong: 'surface-strong',
  line: 'line',
  lineSoft: 'line-soft',
  text: 'fg',
  textSoft: 'fg-soft',
  muted: 'muted',
  brand: 'brand',
  brandSoft: 'brand-soft',
  accent: 'accent',
  onBrand: 'on-brand',
  danger: 'danger',
  dangerSoft: 'danger-soft',
  dangerText: 'danger-fg',
  like: 'like',
  unread: 'unread',
  onUnread: 'on-unread',
  overlay: 'overlay',
};

function channels(hex: string) {
  const value = parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}

function toVars(palette: Palette) {
  return vars(
    Object.fromEntries(
      (Object.keys(tokenNames) as (keyof Palette)[]).map((name) => [
        `--wg-${tokenNames[name]}`,
        channels(palette[name]),
      ]),
    ),
  );
}

// Aplicadas na raiz do app; as classes do NativeWind (tailwind.config.js)
// leem estas variáveis, então o mesmo className funciona nos dois temas.
export const themeVars: Record<ColorScheme, ReturnType<typeof vars>> = {
  light: toVars(palettes.light),
  dark: toVars(palettes.dark),
};
