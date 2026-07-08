/**
 * SAMPA brand theme for the mobile app.
 *
 * Mirrors the website's Tailwind tokens (see the web repo `tailwind.config.js`)
 * so the app and site read as one brand:
 *   primary/teal #26A69A · accent/purple #9C27B0 · slate text #1E2A38 · soft white #F8F9FA.
 *
 * Colors.light / Colors.dark must expose the SAME keys — `ThemeColor` is their
 * intersection and `useTheme()` indexes into whichever scheme is active.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Raw brand constants (use these directly for fixed, non-theme-aware accents).
export const Brand = {
  teal: '#26A69A',
  tealDark: '#1E8C82',
  tealBright: '#34C5B8',
  purple: '#9C27B0',
  purpleBright: '#C56BDA',
  slate: '#1E2A38',
  softWhite: '#F8F9FA',
} as const;

export const Colors = {
  light: {
    text: '#1E2A38', // slate
    textSecondary: '#5B6B7B',
    background: '#F8F9FA', // soft white
    backgroundElement: '#FFFFFF', // cards
    backgroundSelected: '#E6F5F3', // teal tint
    border: '#E4E9EE',
    tint: '#26A69A', // primary teal — active tab / links
    accent: '#9C27B0', // purple
  },
  dark: {
    text: '#F4F6F8',
    textSecondary: '#9AAAB8',
    background: '#10161D',
    backgroundElement: '#1A222C',
    backgroundSelected: '#16302D',
    border: '#26313D',
    tint: '#34C5B8', // brighter teal reads better on dark
    accent: '#C56BDA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Font family names loaded via `useFonts` in the root layout (see src/app/_layout.tsx).
// These come from the @expo-google-fonts/* packages and work on iOS, Android, and web.
export const Fonts = {
  sans: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  // `rounded` kept for compatibility with template components; maps to Inter.
  rounded: 'Inter_500Medium',
  serif: 'PlayfairDisplay_600SemiBold', // headlines / drama
  serifBold: 'PlayfairDisplay_700Bold',
  mono: 'IBMPlexMono_500Medium', // data / small labels
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
