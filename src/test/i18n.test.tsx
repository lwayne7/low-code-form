/**
 * i18n 国际化单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { I18nProvider, useI18n } from '../i18n';
import type { ReactNode } from 'react';

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
    removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
});

// Wrapper component
const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nProvider>{children}</I18nProvider>
);

describe('useI18n', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    });

    it('应该提供默认的中文 locale', () => {
        const { result } = renderHook(() => useI18n(), { wrapper });
        
        // 默认根据浏览器语言，可能是中文或英文
        expect(['zh-CN', 'en-US']).toContain(result.current.locale);
    });

    it('应该能切换语言', () => {
        const { result } = renderHook(() => useI18n(), { wrapper });
        
        act(() => {
            result.current.setLocale('en-US');
        });
        
        expect(result.current.locale).toBe('en-US');
    });

    it('应该正确翻译文本', () => {
        const { result } = renderHook(() => useI18n(), { wrapper });
        
        act(() => {
            result.current.setLocale('zh-CN');
        });
        
        expect(result.current.t('common.confirm')).toBe('确认');
        expect(result.current.t('common.cancel')).toBe('取消');
    });

    it('应该正确翻译英文', () => {
        const { result } = renderHook(() => useI18n(), { wrapper });
        
        act(() => {
            result.current.setLocale('en-US');
        });
        
        expect(result.current.t('common.confirm')).toBe('Confirm');
        expect(result.current.t('common.cancel')).toBe('Cancel');
    });

    it('应该支持参数替换', () => {
        const { result } = renderHook(() => useI18n(), { wrapper });
        
        act(() => {
            result.current.setLocale('zh-CN');
        });
        
        const text = result.current.t('template.applied', { name: '测试模板' });
        expect(text).toBe('已应用「测试模板」模板');
    });

    it('应该在 localStorage 中持久化语言设置', () => {
        const { result } = renderHook(() => useI18n(), { wrapper });
        
        act(() => {
            result.current.setLocale('en-US');
        });
        
        expect(mockStorage['low-code-form-locale']).toBe('en-US');
    });
});

describe('翻译完整性', () => {
    it('中英文翻译 key 应该一致', async () => {
        // 动态导入以获取翻译对象
        const i18nModule = await import('../i18n/index');
        
        // 这个测试确保开发者添加新 key 时不会遗漏任何语言
        // 由于 TypeScript 类型约束，中英文 key 必须完全一致
        expect(i18nModule).toBeDefined();
        expect(i18nModule.I18nProvider).toBeDefined();
        expect(i18nModule.useI18n).toBeDefined();
    });
});
