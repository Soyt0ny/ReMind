import { THEME } from './Theme';

/**
 * ReMind UI Design System
 * Based on the Next.js / Tailwind configuration for total visual consistency.
 */
export const DESIGN_SYSTEM = {
  colors: {
    primary:    'hsl(210, 84%, 50%)',   // #137FEC
    background: 'hsl(210, 10%, 97%)',  // #F3F4F6
    foreground: 'hsl(218, 25%, 14%)',  // #1A1F26
    card:       '#FFFFFF',
    muted:      'hsl(210, 15%, 94%)',
    mutedForeground: 'hsl(218, 12%, 48%)',
    destructive: 'hsl(0, 72%, 51%)',
    border:     'hsl(210, 15%, 87%)',
    overlay:    'rgba(0, 0, 0, 0.55)',
  },
  radius: {
    base: 12,
    large: 24,
    full: 9999,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '900' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 30,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    small: {
      fontSize: 14,
      fontWeight: '500' as const,
    }
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    }
  }
};
