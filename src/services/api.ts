/**
 * API 服务层
 * 封装与后端的所有 HTTP 请求
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 配置常量
const REQUEST_TIMEOUT = 15000; // 15秒超时
const MAX_RETRIES = 2; // 最大重试次数

// Token 管理
const TOKEN_KEY = 'low_code_form_token';

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

// 通用请求方法
async function request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 0
): Promise<T> {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // 处理网络响应
        if (!response.ok) {
            // Token 过期塨理
            if (response.status === 401) {
                removeToken();
                throw new ApiError(401, '登录已过期，请重新登录');
            }

            const data = await response.json().catch(() => ({}));
            throw new ApiError(response.status, data.error || '请求失败');
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);

        // 处理超时
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new ApiError(408, '请求超时，请检查网络连接');
        }

        // 处理网络错误并重试
        if (error instanceof TypeError && error.message.includes('fetch')) {
            if (retries < MAX_RETRIES) {
                // 指数退避重试
                await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
                return request<T>(endpoint, options, retries + 1);
            }
            throw new ApiError(0, '网络连接失败，请检查网络设置');
        }

        throw error;
    }
}

// API 错误类
export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

// ============ Auth API ============

export interface User {
    id: number;
    email: string;
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
}

export const authApi = {
    // 注册
    async register(email: string, password: string): Promise<AuthResponse> {
        const data = await request<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        setToken(data.token);
        return data;
    },

    // 登录
    async login(email: string, password: string): Promise<AuthResponse> {
        const data = await request<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        setToken(data.token);
        return data;
    },

    // 登出
    logout(): void {
        removeToken();
    },

    // 获取当前用户
    async getMe(): Promise<{ user: User }> {
        return request('/auth/me');
    },

    // 删除账号
    async deleteAccount(): Promise<{ message: string }> {
        const result = await request<{ message: string }>('/auth/account', {
            method: 'DELETE',
        });
        removeToken();
        return result;
    },

    // 检查是否已登录
    isLoggedIn(): boolean {
        return !!getToken();
    },
};

// ============ Forms API ============

export interface FormData {
    id: number;
    userId: number;
    name: string;
    description: string | null;
    schema: unknown;
    createdAt: string;
    updatedAt: string;
}

export interface FormListItem {
    id: number;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export const formsApi = {
    // 获取表单列表
    async list(): Promise<{ forms: FormListItem[] }> {
        return request('/forms');
    },

    // 获取单个表单
    async get(id: number): Promise<{ form: FormData }> {
        return request(`/forms/${id}`);
    },

    // 创建表单
    async create(data: { name: string; description?: string; schema: unknown }): Promise<{ form: FormData }> {
        return request('/forms', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // 更新表单
    async update(
        id: number,
        data: { name?: string; description?: string; schema?: unknown }
    ): Promise<{ form: FormData }> {
        return request(`/forms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // 删除表单
    async delete(id: number): Promise<{ message: string }> {
        return request(`/forms/${id}`, {
            method: 'DELETE',
        });
    },

    // 提交表单数据
    async submit(formId: number, data: unknown): Promise<{ submission: unknown }> {
        return request(`/forms/${formId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ data }),
        });
    },

    // 获取表单提交列表
    async getSubmissions(formId: number): Promise<{ submissions: unknown[] }> {
        return request(`/forms/${formId}/submissions`);
    },
};

// 导出默认 API 对象
export default {
    auth: authApi,
    forms: formsApi,
};
