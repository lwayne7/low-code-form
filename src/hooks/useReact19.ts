/**
 * React 19 新特性 Hooks
 *
 * 面试考点：
 * 1. useOptimistic - 乐观更新
 * 2. useFormStatus - 表单状态
 * 3. useActionState - 服务端 Action 状态
 * 4. use() - Promise 解包
 * 5. Server Actions 集成
 *
 * 注意：部分特性需要 React 19 支持
 */

import {
  useState,
  useCallback,
  useTransition,
  useSyncExternalStore,
  useEffect,
  useRef,
  use,
} from 'react';

// ============ useOptimistic 实现 ============

/**
 * useOptimistic Hook
 *
 * 允许你在异步操作进行时显示乐观的 UI 状态
 *
 * @example
 * ```tsx
 * function TodoList({ todos, addTodo }) {
 *   const [optimisticTodos, addOptimisticTodo] = useOptimistic(
 *     todos,
 *     (state, newTodo) => [...state, { ...newTodo, pending: true }]
 *   );
 *
 *   async function handleAdd(formData) {
 *     const newTodo = { id: Date.now(), text: formData.get('text') };
 *     addOptimisticTodo(newTodo);
 *     await addTodo(newTodo);
 *   }
 *
 *   return (
 *     <form action={handleAdd}>
 *       <input name="text" />
 *       <button>Add</button>
 *       <ul>
 *         {optimisticTodos.map(todo => (
 *           <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>
 *             {todo.text}
 *           </li>
 *         ))}
 *       </ul>
 *     </form>
 *   );
 * }
 * ```
 */
export function useOptimistic<TState, TAction>(
  passthrough: TState,
  reducer: (state: TState, action: TAction) => TState
): [TState, (action: TAction) => void] {
  const [optimisticState, setOptimisticState] = useState(passthrough);
  const [, startTransition] = useTransition();
  const pendingRef = useRef(false);
  const prevPassthroughRef = useRef(passthrough);

  // 同步真实状态 - 使用 useSyncExternalStore 模式避免渲染期间访问 ref
  useEffect(() => {
    // 只在真实值变化且没有待处理操作时同步
    if (prevPassthroughRef.current !== passthrough) {
      prevPassthroughRef.current = passthrough;
      if (!pendingRef.current) {
        // 使用 startTransition 避免级联渲染警告
        startTransition(() => {
          setOptimisticState(passthrough);
        });
      }
    }
  }, [passthrough, startTransition]);

  const addOptimistic = useCallback(
    (action: TAction) => {
      pendingRef.current = true;
      startTransition(() => {
        setOptimisticState((current) => reducer(current, action));
      });

      // 当 transition 完成时重置
      setTimeout(() => {
        pendingRef.current = false;
      }, 0);
    },
    [reducer]
  );

  return [optimisticState, addOptimistic];
}

// ============ useFormStatus 实现 ============

/**
 * 表单状态上下文
 */
interface FormStatusContext {
  pending: boolean;
  data: FormData | null;
  method: string | null;
  action: string | null;
}

const defaultFormStatus: FormStatusContext = {
  pending: false,
  data: null,
  method: null,
  action: null,
};

// 表单状态存储
let currentFormStatus = defaultFormStatus;
const formStatusListeners = new Set<() => void>();

// 用于更新表单状态（供 FormWrapper 使用）
export function setFormStatus(status: FormStatusContext) {
  currentFormStatus = status;
  formStatusListeners.forEach((listener) => listener());
}

/**
 * useFormStatus Hook
 *
 * 返回当前表单的提交状态
 *
 * @example
 * ```tsx
 * function SubmitButton() {
 *   const { pending } = useFormStatus();
 *   return (
 *     <button disabled={pending}>
 *       {pending ? 'Submitting...' : 'Submit'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useFormStatus(): FormStatusContext {
  return useSyncExternalStore(
    (callback) => {
      formStatusListeners.add(callback);
      return () => formStatusListeners.delete(callback);
    },
    () => currentFormStatus
  );
}

// ============ useActionState 实现 ============

type ActionFunction<TState, TPayload> = (
  prevState: TState,
  payload: TPayload
) => TState | Promise<TState>;

/**
 * useActionState Hook
 *
 * 管理服务端 Action 的状态
 *
 * @example
 * ```tsx
 * async function updateName(prevState, formData) {
 *   const name = formData.get('name');
 *   if (!name) {
 *     return { error: 'Name is required' };
 *   }
 *   await updateUserName(name);
 *   return { success: true };
 * }
 *
 * function UpdateNameForm() {
 *   const [state, formAction, isPending] = useActionState(updateName, {});
 *
 *   return (
 *     <form action={formAction}>
 *       <input name="name" />
 *       <button disabled={isPending}>Update</button>
 *       {state.error && <p>{state.error}</p>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useActionState<TState, TPayload>(
  action: ActionFunction<TState, TPayload>,
  initialState: TState
): [TState, (payload: TPayload) => void, boolean] {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();

  const formAction = useCallback(
    async (payload: TPayload) => {
      startTransition(async () => {
        try {
          const result = await action(state, payload);
          setState(result);
        } catch (error) {
          console.error('Action failed:', error);
        }
      });
    },
    [action, state]
  );

  return [state, formAction, isPending];
}

// ============ 增强型表单 Hook ============

interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Record<string, string>;
  onSubmit: (values: T) => Promise<void>;
}

/**
 * useForm Hook - 完整的表单管理
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   initialValues: { name: '', email: '' },
 *   validate: (values) => {
 *     const errors = {};
 *     if (!values.name) errors.name = 'Required';
 *     if (!values.email) errors.email = 'Required';
 *     return errors;
 *   },
 *   onSubmit: async (values) => {
 *     await api.submit(values);
 *   },
 * });
 *
 * return (
 *   <form onSubmit={form.handleSubmit}>
 *     <input {...form.register('name')} />
 *     {form.errors.name && <span>{form.errors.name}</span>}
 *     <button disabled={form.isSubmitting}>Submit</button>
 *   </form>
 * );
 * ```
 */
export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [state, setState] = useState<FormState<T>>({
    data: initialValues,
    errors: {},
    isSubmitting: false,
    isValid: true,
    isDirty: false,
  });

  // 使用乐观更新
  const [optimisticData, addOptimistic] = useOptimistic(
    state.data,
    (current, update: Partial<T>) => ({ ...current, ...update })
  );

  const setFieldValue = useCallback(
    (field: keyof T, value: unknown) => {
      addOptimistic({ [field]: value } as Partial<T>);
      setState((prev) => ({
        ...prev,
        data: { ...prev.data, [field]: value },
        isDirty: true,
      }));
    },
    [addOptimistic]
  );

  const setFieldError = useCallback((field: string, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
      isValid: false,
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: {},
      isValid: true,
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!validate) return true;

    const errors = validate(state.data);
    const isValid = Object.keys(errors).length === 0;

    setState((prev) => ({
      ...prev,
      errors,
      isValid,
    }));

    return isValid;
  }, [validate, state.data]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!validateForm()) return;

      setState((prev) => ({ ...prev, isSubmitting: true }));

      try {
        await onSubmit(state.data);
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          isDirty: false,
        }));
      } catch (error) {
        setState((prev) => ({ ...prev, isSubmitting: false }));
        throw error;
      }
    },
    [validateForm, onSubmit, state.data]
  );

  const register = useCallback(
    (field: keyof T) => ({
      name: field as string,
      value: optimisticData[field] as string,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      ) => {
        setFieldValue(field, e.target.value);
      },
      onBlur: () => {
        if (validate) {
          const errors = validate(state.data);
          if (errors[field as string]) {
            setFieldError(field as string, errors[field as string]);
          }
        }
      },
    }),
    [optimisticData, setFieldValue, validate, state.data, setFieldError]
  );

  const reset = useCallback(() => {
    setState({
      data: initialValues,
      errors: {},
      isSubmitting: false,
      isValid: true,
      isDirty: false,
    });
  }, [initialValues]);

  return {
    data: optimisticData,
    errors: state.errors,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    isDirty: state.isDirty,
    setFieldValue,
    setFieldError,
    clearErrors,
    validateForm,
    handleSubmit,
    register,
    reset,
  };
}

// ============ useDeferredValue 增强 ============

/**
 * useDeferredSearch - 搜索防抖
 *
 * 使用 useDeferredValue 的模式实现搜索防抖
 */
export function useDeferredSearch<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean
): {
  query: string;
  setQuery: (query: string) => void;
  results: T[];
  isPending: boolean;
} {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>(items);
  const [isPending, startTransition] = useTransition();

  const handleSearch = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      startTransition(() => {
        if (!newQuery.trim()) {
          setResults(items);
        } else {
          setResults(items.filter((item) => searchFn(item, newQuery)));
        }
      });
    },
    [items, searchFn]
  );

  return {
    query,
    setQuery: handleSearch,
    results,
    isPending,
  };
}

// ============ Suspense 资源 Hook ============

/**
 * 创建可被 Suspense 使用的资源
 */
export function createResource<T>(promise: Promise<T>): { read: () => T } {
  let status: 'pending' | 'success' | 'error' = 'pending';
  let result: T;
  let error: unknown;

  const suspender = promise.then(
    (r) => {
      status = 'success';
      result = r;
    },
    (e) => {
      status = 'error';
      error = e;
    }
  );

  return {
    read() {
      switch (status) {
        case 'pending':
          throw suspender;
        case 'error':
          throw error;
        case 'success':
          return result;
      }
    },
  };
}

/**
 * useResource Hook - 配合 Suspense 使用
 *
 * @example
 * ```tsx
 * const userResource = createResource(fetchUser(userId));
 *
 * function UserProfile() {
 *   const user = useResource(userResource);
 *   return <div>{user.name}</div>;
 * }
 *
 * <Suspense fallback={<Loading />}>
 *   <UserProfile />
 * </Suspense>
 * ```
 */
export function useResource<T>(resource: { read: () => T }): T {
  return resource.read();
}

/**
 * 使用 React 19 的 use() API 包装 Promise
 *
 * 注意：这是 React 19 的新 API
 */
export function usePromise<T>(promise: Promise<T>): T {
  return use(promise);
}
