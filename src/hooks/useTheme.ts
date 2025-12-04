/**
 * 主题切换 Hook
 * 支持 light / dark / auto（跟随系统）三种模式
 */

import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'lowcode-theme';

/**
 * 获取实际生效的主题（考虑 auto 模式和系统设置）
 */
const getEffectiveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
};

/**
 * 主题切换 Hook
 */
export function useTheme() {
  // 从 localStorage 读取保存的主题设置，默认为 auto
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'auto') {
      return saved;
    }
    return 'auto';
  });

  // 实际生效的主题
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => 
    getEffectiveTheme(themeMode)
  );

  // 应用主题到 DOM
  const applyTheme = useCallback((mode: ThemeMode) => {
    document.documentElement.setAttribute('data-theme', mode);
    setEffectiveTheme(getEffectiveTheme(mode));
  }, []);

  // 设置主题模式
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    applyTheme(mode);
  }, [applyTheme]);

  // 切换主题（循环切换 light -> dark -> auto）
  const toggleTheme = useCallback(() => {
    const nextMode: ThemeMode = 
      themeMode === 'light' ? 'dark' : 
      themeMode === 'dark' ? 'auto' : 'light';
    setThemeMode(nextMode);
  }, [themeMode, setThemeMode]);

  // 初始化时应用主题
  useEffect(() => {
    applyTheme(themeMode);
  }, []);

  // 监听系统主题变化（仅在 auto 模式下生效）
  useEffect(() => {
    if (themeMode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setEffectiveTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  return {
    /** 当前主题模式设置 */
    themeMode,
    /** 实际生效的主题 (light/dark) */
    effectiveTheme,
    /** 设置主题模式 */
    setThemeMode,
    /** 切换主题 (light -> dark -> auto 循环) */
    toggleTheme,
    /** 是否为深色模式 */
    isDark: effectiveTheme === 'dark',
  };
}
