/**
 * 云端同步状态管理
 */
import { create } from 'zustand';
import { formsApi, type FormListItem } from './api';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface CloudState {
    syncStatus: SyncStatus;
    error: string | null;
    cloudForms: FormListItem[];
    currentFormId: number | null;

    // Actions
    saveToCloud: (name: string, schema: unknown, description?: string) => Promise<number | null>;
    updateInCloud: (id: number, data: { name?: string; schema?: unknown; description?: string }) => Promise<boolean>;
    loadFromCloud: (id: number) => Promise<unknown | null>;
    deleteFromCloud: (id: number) => Promise<boolean>;
    fetchFormList: () => Promise<void>;
    setCurrentFormId: (id: number | null) => void;
    clearError: () => void;
}

export const useCloudStore = create<CloudState>((set, get) => ({
    syncStatus: 'idle',
    error: null,
    cloudForms: [],
    currentFormId: null,

    saveToCloud: async (name, schema, description) => {
        set({ syncStatus: 'syncing', error: null });
        try {
            const { form } = await formsApi.create({ name, schema, description });
            set({ syncStatus: 'synced', currentFormId: form.id });
            // 刷新列表
            get().fetchFormList();
            return form.id;
        } catch (err) {
            set({ syncStatus: 'error', error: (err as Error).message });
            return null;
        }
    },

    updateInCloud: async (id, data) => {
        set({ syncStatus: 'syncing', error: null });
        try {
            await formsApi.update(id, data);
            set({ syncStatus: 'synced' });
            get().fetchFormList();
            return true;
        } catch (err) {
            set({ syncStatus: 'error', error: (err as Error).message });
            return false;
        }
    },

    loadFromCloud: async (id) => {
        set({ syncStatus: 'syncing', error: null });
        try {
            const { form } = await formsApi.get(id);
            set({ syncStatus: 'synced', currentFormId: id });
            return form.schema;
        } catch (err) {
            set({ syncStatus: 'error', error: (err as Error).message });
            return null;
        }
    },

    deleteFromCloud: async (id) => {
        set({ syncStatus: 'syncing', error: null });
        try {
            await formsApi.delete(id);
            set({ syncStatus: 'idle', currentFormId: null });
            get().fetchFormList();
            return true;
        } catch (err) {
            set({ syncStatus: 'error', error: (err as Error).message });
            return false;
        }
    },

    fetchFormList: async () => {
        try {
            const { forms } = await formsApi.list();
            set({ cloudForms: forms });
        } catch (err) {
            console.error('Failed to fetch form list:', err);
        }
    },

    setCurrentFormId: (id) => set({ currentFormId: id }),

    clearError: () => set({ error: null, syncStatus: 'idle' }),
}));
