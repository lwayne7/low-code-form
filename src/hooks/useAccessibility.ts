import { useCallback, useEffect, useRef } from 'react';

/**
 * 无障碍支持相关 Hooks
 * 
 * 这些 Hooks 帮助实现 WCAG 2.1 无障碍标准
 */

interface UseFocusTrapOptions {
  enabled?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
  returnFocusOnDeactivate?: boolean;
}

/**
 * 焦点陷阱 Hook
 * 
 * 用于 Modal、Drawer 等场景，确保键盘焦点不会逃出容器
 * 
 * @example
 * ```tsx
 * function Modal({ isOpen }) {
 *   const containerRef = useFocusTrap<HTMLDivElement>({ enabled: isOpen });
 *   return <div ref={containerRef}>...</div>;
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement>(options: UseFocusTrapOptions = {}) {
  const { enabled = true, initialFocusRef, returnFocusOnDeactivate = true } = options;
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // 保存当前焦点元素
    previousActiveElement.current = document.activeElement;

    // 设置初始焦点
    const container = containerRef.current;
    const focusableElements = getFocusableElements(container);

    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      container.focus();
    }

    // 处理 Tab 键导航
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: 向前导航
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: 向后导航
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      
      // 恢复焦点
      if (returnFocusOnDeactivate && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [enabled, initialFocusRef, returnFocusOnDeactivate]);

  return containerRef;
}

/**
 * 获取容器内所有可聚焦元素
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
    .filter((element) => {
      // 过滤不可见元素
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

interface UseArrowNavigationOptions {
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  onSelect?: (index: number) => void;
}

/**
 * 箭头键导航 Hook
 * 
 * 用于列表、菜单等场景的键盘导航
 * 
 * @example
 * ```tsx
 * function Menu() {
 *   const { currentIndex, handleKeyDown } = useArrowNavigation({
 *     itemCount: menuItems.length,
 *     orientation: 'vertical',
 *   });
 *   return <ul onKeyDown={handleKeyDown}>...</ul>;
 * }
 * ```
 */
export function useArrowNavigation(
  itemCount: number,
  options: UseArrowNavigationOptions = {}
) {
  const { orientation = 'vertical', loop = true, onSelect } = options;
  const currentIndexRef = useRef(0);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const { key } = event;
      let newIndex = currentIndexRef.current;
      let handled = false;

      const prevKeys = orientation === 'horizontal' ? ['ArrowLeft'] : 
                       orientation === 'vertical' ? ['ArrowUp'] : 
                       ['ArrowLeft', 'ArrowUp'];
      const nextKeys = orientation === 'horizontal' ? ['ArrowRight'] : 
                       orientation === 'vertical' ? ['ArrowDown'] : 
                       ['ArrowRight', 'ArrowDown'];

      if (prevKeys.includes(key)) {
        newIndex = currentIndexRef.current - 1;
        if (newIndex < 0) {
          newIndex = loop ? itemCount - 1 : 0;
        }
        handled = true;
      } else if (nextKeys.includes(key)) {
        newIndex = currentIndexRef.current + 1;
        if (newIndex >= itemCount) {
          newIndex = loop ? 0 : itemCount - 1;
        }
        handled = true;
      } else if (key === 'Home') {
        newIndex = 0;
        handled = true;
      } else if (key === 'End') {
        newIndex = itemCount - 1;
        handled = true;
      } else if (key === 'Enter' || key === ' ') {
        onSelect?.(currentIndexRef.current);
        handled = true;
      }

      if (handled) {
        event.preventDefault();
        currentIndexRef.current = newIndex;
      }

      return { newIndex, handled };
    },
    [itemCount, orientation, loop, onSelect]
  );

  const setCurrentIndex = useCallback((index: number) => {
    currentIndexRef.current = Math.max(0, Math.min(index, itemCount - 1));
  }, [itemCount]);

  return {
    currentIndex: currentIndexRef.current,
    setCurrentIndex,
    handleKeyDown,
  };
}

/**
 * 屏幕阅读器通知 Hook
 * 
 * 用于向屏幕阅读器用户发送实时通知
 */
export function useAnnounce() {
  const announceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 创建一个隐藏的 live region
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', 'status');
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(announcer);
    announceRef.current = announcer;

    return () => {
      if (announceRef.current) {
        document.body.removeChild(announceRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceRef.current) return;
    
    announceRef.current.setAttribute('aria-live', priority);
    announceRef.current.textContent = '';
    
    // 使用 setTimeout 确保屏幕阅读器能检测到内容变化
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = message;
      }
    }, 100);
  }, []);

  return announce;
}

/**
 * 键盘快捷键可见性 Hook
 * 
 * 检测用户是否正在使用键盘导航，用于显示焦点样式
 */
export function useKeyboardNavigation() {
  const isKeyboardNavigating = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        isKeyboardNavigating.current = true;
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      isKeyboardNavigating.current = false;
      document.body.classList.remove('keyboard-navigation');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardNavigating;
}
