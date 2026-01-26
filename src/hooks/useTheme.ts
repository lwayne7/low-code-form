/**
 * 主题切换 Hook
 * 支持 light / dark / auto（跟随系统）三种模式
 *
 * 🔧 修复：原实现每次调用都会创建独立 state，导致多处使用时主题不同步。
 * 现在改为使用全局 Zustand store 作为单一数据源。
 */

import { useThemeStore, type ThemeMode } from '../themeStore';

export type { ThemeMode };

export function useTheme() {
  const themeMode = useThemeStore((state) => state.themeMode);
  const effectiveTheme = useThemeStore((state) => state.effectiveTheme);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

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
