/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FAFAF7',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    primary: '#F2672A',
    primaryText: '#ffffff',
    border: '#E0E1E6',
    success: '#26890C',
    danger: '#E21B3C',
  },
  dark: {
    text: '#ffffff',
    background: '#0B0B0C',
    backgroundElement: '#1A1B1E',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: '#FF7A3D',
    primaryText: '#ffffff',
    border: '#2E3135',
    success: '#4CAF50',
    danger: '#FF5A6E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 72 }) ?? 0;
export const MaxContentWidth = 800;

export const KindColors = {
  teoria: '#1368CE',
  psicotecnicos: '#8E44AD',
  fisico: '#26890C',
} as const;

/** Colores de las cuatro respuestas del test, al estilo de los concursos. */
export const AnswerColors = ['#E21B3C', '#1368CE', '#D89E00', '#26890C'] as const;
export const AnswerShapes = ['▲', '◆', '●', '■'] as const;
