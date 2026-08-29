import { AccentColor, UserSettings } from '../types';

export interface AccentThemeConfig {
  id: AccentColor;
  label: string;
  sublabel: string;
  previewHex: string;
  gradient: string;
  primaryColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  buttonBg: string;
  buttonText: string;
  cardGlow: string;
  ringColor: string;
}

export const ACCENT_THEMES: Record<AccentColor, AccentThemeConfig> = {
  amber: {
    id: 'amber',
    label: 'Amber Gold',
    sublabel: 'Warm, iconic & energizing (Default)',
    previewHex: '#F59E0B',
    gradient: 'from-amber-500 via-orange-500 to-amber-600',
    primaryColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/30',
    buttonBg: 'bg-amber-500 hover:bg-amber-400',
    buttonText: 'text-zinc-950',
    cardGlow: 'shadow-amber-500/10',
    ringColor: 'ring-amber-500',
  },
  blue: {
    id: 'blue',
    label: 'Ocean Blue',
    sublabel: 'Crisp, calm & scientific',
    previewHex: '#3B82F6',
    gradient: 'from-blue-500 via-cyan-500 to-blue-600',
    primaryColor: 'text-blue-400',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/30',
    buttonBg: 'bg-blue-500 hover:bg-blue-400',
    buttonText: 'text-white',
    cardGlow: 'shadow-blue-500/10',
    ringColor: 'ring-blue-500',
  },
  indigo: {
    id: 'indigo',
    label: 'Royal Indigo',
    sublabel: 'Deep focus, modern & elegant',
    previewHex: '#6366F1',
    gradient: 'from-indigo-500 via-purple-500 to-indigo-600',
    primaryColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10',
    badgeText: 'text-indigo-300',
    badgeBorder: 'border-indigo-500/30',
    buttonBg: 'bg-indigo-500 hover:bg-indigo-400',
    buttonText: 'text-white',
    cardGlow: 'shadow-indigo-500/10',
    ringColor: 'ring-indigo-500',
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald Green',
    sublabel: 'Fresh, balanced & high-contrast',
    previewHex: '#10B981',
    gradient: 'from-emerald-500 via-teal-500 to-emerald-600',
    primaryColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/30',
    buttonBg: 'bg-emerald-500 hover:bg-emerald-400',
    buttonText: 'text-zinc-950',
    cardGlow: 'shadow-emerald-500/10',
    ringColor: 'ring-emerald-500',
  },
  rose: {
    id: 'rose',
    label: 'Rose Pink',
    sublabel: 'Vibrant, bright & creative',
    previewHex: '#F43F5E',
    gradient: 'from-rose-500 via-pink-500 to-rose-600',
    primaryColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/30',
    buttonBg: 'bg-rose-500 hover:bg-rose-400',
    buttonText: 'text-white',
    cardGlow: 'shadow-rose-500/10',
    ringColor: 'ring-rose-500',
  },
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  colorMode: 'dark',
  accentColor: 'amber',
  speechRate: 0.95,
  speechPitch: 1.05,
  defaultSpeechLang: 'en-IN',
  showCelebrationConfetti: true,
  soundEffects: true,
};

export function loadStoredUserSettings(): UserSettings {
  try {
    const stored = localStorage.getItem('eduspark_user_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_USER_SETTINGS,
        ...parsed,
        colorMode: parsed.colorMode === 'light' ? 'light' : 'dark',
      };
    }
    // Check legacy theme mode & accent color keys if any
    const legacyMode = localStorage.getItem('eduspark_theme_mode');
    const legacyAccent = localStorage.getItem('eduspark_accent_color');
    return {
      ...DEFAULT_USER_SETTINGS,
      colorMode: legacyMode === 'light' ? 'light' : 'dark',
      accentColor:
        legacyAccent &&
        (legacyAccent === 'amber' ||
          legacyAccent === 'blue' ||
          legacyAccent === 'indigo' ||
          legacyAccent === 'emerald' ||
          legacyAccent === 'rose')
          ? (legacyAccent as AccentColor)
          : 'amber',
    };
  } catch (e) {
    console.warn('Could not read user settings from storage:', e);
  }
  return DEFAULT_USER_SETTINGS;
}

export function saveUserSettings(settings: UserSettings): void {
  try {
    localStorage.setItem('eduspark_user_settings', JSON.stringify(settings));
    localStorage.setItem('eduspark_theme_mode', settings.colorMode || 'dark');
    localStorage.setItem('eduspark_accent_color', settings.accentColor);
  } catch (e) {
    console.warn('Could not save user settings:', e);
  }
  applyThemeToDOM(settings);
}

export function applyAccentToDOM(accent: AccentColor): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-accent', accent);
  }
}

export function applyThemeToDOM(settings: UserSettings | { colorMode?: 'dark' | 'light'; accentColor?: AccentColor }): void {
  if (typeof document !== 'undefined') {
    const colorMode = settings.colorMode === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', colorMode);
    document.documentElement.classList.toggle('light-theme', colorMode === 'light');
    document.documentElement.classList.toggle('dark-theme', colorMode === 'dark');
    
    if (settings.accentColor) {
      document.documentElement.setAttribute('data-accent', settings.accentColor);
    }
  }
}
