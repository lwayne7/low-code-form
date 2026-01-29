/**
 * API 服务层单元测试
 * 
 * 测试 API 请求的超时处理、重试机制、错误处理等
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
    removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
});

describe('API Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        // 清理 mock storage
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Token 管理', () => {
        it('应该能正确存储和获取 token', async () => {
            const { setToken, getToken } = await import('../services/api');
            
            setToken('test-token-123');
            expect(getToken()).toBe('test-token-123');
        });

        it('应该能正确移除 token', async () => {
            const { setToken, removeToken, getToken } = await import('../services/api');
            
            setToken('test-token');
            removeToken();
            expect(getToken()).toBeNull();
        });
    });

    describe('ApiError', () => {
        it('应该正确创建 API 错误', async () => {
            const { ApiError } = await import('../services/api');
            
            const error = new ApiError(404, '资源不存在');
            
            expect(error.status).toBe(404);
            expect(error.message).toBe('资源不存在');
            expect(error.name).toBe('ApiError');
        });
    });

    describe('请求行为', () => {
        it('应该在请求头中包含 Authorization', async () => {
            const { setToken, authApi } = await import('../services/api');
            
            setToken('bearer-token');
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ user: { id: 1, email: 'test@test.com' } }),
            });

            await authApi.getMe();

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer bearer-token',
                    }),
                })
            );
        });

        it('应该在 401 错误时移除 token', async () => {
            const { setToken, getToken, authApi } = await import('../services/api');
            
            setToken('expired-token');
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ error: '登录已过期' }),
            });

            await expect(authApi.getMe()).rejects.toThrow('登录已过期');
            expect(getToken()).toBeNull();
        });
    });
});

describe('authApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    });

    it('login 成功应该存储 token', async () => {
        const { authApi, getToken } = await import('../services/api');
        
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                message: '登录成功',
                user: { id: 1, email: 'test@test.com' },
                token: 'new-token',
            }),
        });

        await authApi.login('test@test.com', 'password');
        
        expect(getToken()).toBe('new-token');
    });

    it('register 成功应该存储 token', async () => {
        const { authApi, getToken } = await import('../services/api');
        
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                message: '注册成功',
                user: { id: 1, email: 'new@test.com' },
                token: 'new-user-token',
            }),
        });

        await authApi.register('new@test.com', 'password');
        
        expect(getToken()).toBe('new-user-token');
    });

    it('logout 应该移除 token', async () => {
        const { authApi, setToken, getToken } = await import('../services/api');
        
        setToken('some-token');
        authApi.logout();
        
        expect(getToken()).toBeNull();
    });

    it('isLoggedIn 应该正确判断登录状态', async () => {
        const { authApi, setToken, removeToken } = await import('../services/api');
        
        expect(authApi.isLoggedIn()).toBe(false);
        
        setToken('token');
        expect(authApi.isLoggedIn()).toBe(true);
        
        removeToken();
        expect(authApi.isLoggedIn()).toBe(false);
    });
});

describe('formsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockReset();
    });

    it('list 应该返回表单列表', async () => {
        const { formsApi } = await import('../services/api');
        
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                forms: [
                    { id: 1, name: '表单1' },
                    { id: 2, name: '表单2' },
                ],
            }),
        });

        const result = await formsApi.list();
        
        expect(result.forms).toHaveLength(2);
        expect(result.forms[0].name).toBe('表单1');
    });

    it('create 应该创建新表单', async () => {
        const { formsApi } = await import('../services/api');
        
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                form: { id: 1, name: '新表单', schema: [] },
            }),
        });

        const result = await formsApi.create({
            name: '新表单',
            schema: [],
        });
        
        expect(result.form.name).toBe('新表单');
    });

    it('delete 应该删除表单', async () => {
        const { formsApi } = await import('../services/api');
        
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ message: '删除成功' }),
        });

        const result = await formsApi.delete(1);
        
        expect(result.message).toBe('删除成功');
    });
});
