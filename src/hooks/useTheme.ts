/**
 * 主题切换 Hook
 * 支持浅色/深色/跟随系统三种模式
 */
import { useEffect, useMemo } from 'react';
import { useStore } from '../store';
import type { ThemeMode } from '../store';

// 监听系统主题变化
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export function useTheme() {
  const themeMode = useStore((state) => state.themeMode);
  const setThemeMode = useStore((state) => state.setThemeMode);

  // 计算实际主题（system 模式需要根据系统设置判断）
  const actualTheme = useMemo(() => {
    if (themeMode === 'system') {
      return getSystemTheme();
    }
    return themeMode;
  }, [themeMode]);

  // 应用主题到 DOM
  useEffect(() => {
    const root = document.documentElement;
    
    // 移除旧的主题类
    root.classList.remove('theme-light', 'theme-dark');
    
    // 添加新的主题类
    root.classList.add(`theme-${actualTheme}`);
    
    // 设置 color-scheme 以便浏览器原生组件（如滚动条）也能适配
    root.style.colorScheme = actualTheme;
    
    // 设置 data 属性，方便 CSS 选择器使用
    root.dataset.theme = actualTheme;
  }, [actualTheme]);

  // 监听系统主题变化（仅在 system 模式下有效）
  useEffect(() => {
    if (themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // 触发重新计算 actualTheme
      // 由于 themeMode 没变，我们需要手动触发更新
      const root = document.documentElement;
      const newTheme = getSystemTheme();
      root.classList.remove('theme-light', 'theme-dark');
      root.classList.add(`theme-${newTheme}`);
      root.style.colorScheme = newTheme;
      root.dataset.theme = newTheme;
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // 切换主题的便捷方法
  const toggleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  // 直接切换浅色/深色
  const toggleLightDark = () => {
    if (actualTheme === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode('light');
    }
  };

  return {
    themeMode,       // 当前设置的模式 (light/dark/system)
    actualTheme,     // 实际应用的主题 (light/dark)
    setThemeMode,    // 设置主题模式
    toggleTheme,     // 循环切换 light -> dark -> system
    toggleLightDark, // 直接切换浅色/深色
    isDark: actualTheme === 'dark',
    isLight: actualTheme === 'light',
    isSystem: themeMode === 'system',
  };
}
