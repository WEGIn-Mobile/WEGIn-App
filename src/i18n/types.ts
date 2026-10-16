import type { pt } from './locales/pt';

export type Dictionary = typeof pt;

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

type StripPlural<K extends string> = K extends `${infer Base}_one`
  ? Base
  : K extends `${infer Base}_other`
    ? Base
    : K;

/** Chaves aceitas por `t`, com plurais referenciados sem o sufixo. */
export type TranslationKey = StripPlural<Leaves<Dictionary>>;
export type TranslationParams = Record<string, string | number>;
