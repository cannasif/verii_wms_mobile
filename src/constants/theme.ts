export type ThemeMode = 'dark' | 'light';

export const darkColors = {
  background: '#071224',
  backgroundSecondary: '#0b1830',
  surface: 'rgba(11, 24, 48, 0.82)',
  surfaceStrong: '#10213e',
  card: '#0d1b34',
  border: 'rgba(128, 176, 255, 0.14)',
  text: '#f7fbff',
  textSecondary: '#a9bdd9',
  textMuted: '#70819d',
  inputPlaceholder: '#8fa6c7',
  primary: '#38bdf8',
  primaryStrong: '#0ea5e9',
  accent: '#f97316',
  success: '#34d399',
  danger: '#fb7185',
  nav: '#08101f',
  navBorder: 'rgba(56, 189, 248, 0.18)',
  glow: 'rgba(56, 189, 248, 0.22)',
} as const;

export const lightColors = {
  background: '#f4f8fd',
  backgroundSecondary: '#e7eef8',
  surface: 'rgba(255, 255, 255, 0.92)',
  surfaceStrong: '#ffffff',
  card: '#ffffff',
  border: 'rgba(15, 23, 42, 0.10)',
  text: '#10213e',
  textSecondary: '#4f6480',
  textMuted: '#7b8ea8',
  inputPlaceholder: '#7f96b2',
  primary: '#0284c7',
  primaryStrong: '#0369a1',
  accent: '#ea580c',
  success: '#059669',
  danger: '#e11d48',
  nav: '#ffffff',
  navBorder: 'rgba(2, 132, 199, 0.18)',
  glow: 'rgba(2, 132, 199, 0.18)',
} as const;

export const darkGradients = {
  primary: ['#0ea5e9', '#2563eb', '#f97316'] as const,
  surface: ['rgba(13,27,52,0.98)', 'rgba(8,16,31,0.96)'] as const,
  hero: ['rgba(14,165,233,0.16)', 'rgba(37,99,235,0.04)', 'rgba(249,115,22,0.12)'] as const,
} as const;

export const lightGradients = {
  primary: ['#38bdf8', '#0ea5e9', '#f97316'] as const,
  surface: ['rgba(255,255,255,0.98)', 'rgba(240,247,255,0.96)'] as const,
  hero: ['rgba(56,189,248,0.18)', 'rgba(14,165,233,0.04)', 'rgba(249,115,22,0.10)'] as const,
} as const;

export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const RADII = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;

export const LAYOUT = {
  screenPadding: 24,
  screenBottomPadding: 160,
  inputHeight: 48,
  buttonHeight: 56,
} as const;

export function createTheme(mode: ThemeMode) {
  const colors = mode === 'light' ? lightColors : darkColors;
  const gradients = mode === 'light' ? lightGradients : darkGradients;

  return {
    mode,
    colors,
    gradients,
    spacing: SPACING,
    radii: RADII,
    layout: LAYOUT,
  } as const;
}

export type AppTheme = ReturnType<typeof createTheme>;

export const COLORS = darkColors;
export const GRADIENTS = darkGradients;
