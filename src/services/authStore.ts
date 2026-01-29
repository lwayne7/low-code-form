/**
 * 用户认证状态管理
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type User } from './api';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    deleteAccount: () => Promise<boolean>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const { user } = await authApi.login(email, password);
                    set({ user, isLoading: false });
                    return true;
                } catch (err) {
                    set({ error: (err as Error).message, isLoading: false });
                    return false;
                }
            },

            register: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const { user } = await authApi.register(email, password);
                    set({ user, isLoading: false });
                    return true;
                } catch (err) {
                    set({ error: (err as Error).message, isLoading: false });
                    return false;
                }
            },

            logout: () => {
                authApi.logout();
                set({ user: null, error: null });
            },

            deleteAccount: async () => {
                set({ isLoading: true, error: null });
                try {
                    await authApi.deleteAccount();
                    set({ user: null, isLoading: false });
                    return true;
                } catch (err) {
                    set({ error: (err as Error).message, isLoading: false });
                    return false;
                }
            },

            checkAuth: async () => {
                if (!authApi.isLoggedIn()) {
                    set({ user: null });
                    return;
                }

                set({ isLoading: true });
                try {
                    const { user } = await authApi.getMe();
                    set({ user, isLoading: false });
                } catch {
                    authApi.logout();
                    set({ user: null, isLoading: false });
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'low-code-form-auth',
            partialize: (state) => ({ user: state.user }),
        }
    )
);
