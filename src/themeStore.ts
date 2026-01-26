import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'auto';
type EffectiveTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'lowcode-theme';

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'light' || value === 'dark' || value === 'auto';

const getSystemPrefersDark = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getEffectiveTheme = (mode: ThemeMode): EffectiveTheme => {
  if (mode === 'auto') return getSystemPrefersDark() ? 'dark' : 'light';
  return mode;
};

const applyThemeModeToDom = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', mode);
};

const readStoredThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'auto';
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(saved) ? saved : 'auto';
  } catch {
    return 'auto';
  }
};

interface ThemeState {
  themeMode: ThemeMode;
  effectiveTheme: EffectiveTheme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  /** @internal */
  _syncThemeMode: (mode: ThemeMode) => void;
  /** @internal */
  _syncEffectiveTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialMode = readStoredThemeMode();

  applyThemeModeToDom(initialMode);

  const setThemeMode = (mode: ThemeMode) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch {
        // ignore
      }
    }

    applyThemeModeToDom(mode);
    set({ themeMode: mode, effectiveTheme: getEffectiveTheme(mode) });
  };

  const syncThemeMode = (mode: ThemeMode) => {
    applyThemeModeToDom(mode);
    set({ themeMode: mode, effectiveTheme: getEffectiveTheme(mode) });
  };

  return {
    themeMode: initialMode,
    effectiveTheme: getEffectiveTheme(initialMode),
    setThemeMode,
    toggleTheme: () => {
      const current = get().themeMode;
      const next: ThemeMode =
        current === 'light' ? 'dark' : current === 'dark' ? 'auto' : 'light';
      setThemeMode(next);
    },
    _syncThemeMode: syncThemeMode,
    _syncEffectiveTheme: () => set({ effectiveTheme: getEffectiveTheme(get().themeMode) }),
  };
});

let hasSetupThemeListeners = false;

const setupThemeListeners = () => {
  if (hasSetupThemeListeners) return;
  if (typeof window === 'undefined') return;
  hasSetupThemeListeners = true;

  // 同步系统主题变化（仅 auto 模式需要）
  if (typeof window.matchMedia === 'function') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const state = useThemeStore.getState();
      if (state.themeMode !== 'auto') return;
      state._syncEffectiveTheme();
    };

    mediaQuery.addEventListener('change', handleChange);
  }

  // 跨标签页同步主题设置
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    if (!isThemeMode(event.newValue)) return;
    useThemeStore.getState()._syncThemeMode(event.newValue);
  });
};

setupThemeListeners();

