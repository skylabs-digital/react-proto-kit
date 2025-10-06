import { useCallback, useEffect, useState } from 'react';

/**
 * Options for useUrlDrawer hook
 */
export interface UseUrlDrawerOptions {
  /**
   * Callback when drawer opens
   */
  onOpen?: () => void;
  /**
   * Callback when drawer closes
   */
  onClose?: () => void;
}

/**
 * Hook for managing drawer state in localStorage (no URL pollution)
 * Provides cross-tab sync and persistent state without affecting URL
 * @param key - The localStorage key suffix (will be prefixed with 'drawer_')
 * @param options - Configuration options
 * @returns Tuple of [isOpen, setOpen]
 */
export function useUrlDrawer(
  key: string,
  options: UseUrlDrawerOptions = {}
): readonly [boolean, (value?: boolean) => void] {
  const { onOpen, onClose } = options;
  const storageKey = `drawer_${key}`;

  // State for triggering re-renders
  const [_renderCount, setRenderCount] = useState(0);

  // Determine current state from localStorage
  const isOpen = typeof window !== 'undefined' && localStorage.getItem(storageKey) === 'true';

  const [prevOpen, setPrevOpen] = useState(isOpen);

  // Fire callbacks when state changes
  useEffect(() => {
    if (isOpen && !prevOpen) {
      onOpen?.();
    } else if (!isOpen && prevOpen) {
      onClose?.();
    }
    setPrevOpen(isOpen);
  }, [isOpen, prevOpen, onOpen, onClose]);

  // Listen for localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) {
        // Storage changed in another tab, trigger re-render
        setRenderCount(c => c + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  const setOpen = useCallback(
    (value?: boolean) => {
      const currentlyOpen = localStorage.getItem(storageKey) === 'true';
      const newValue = value !== undefined ? value : !currentlyOpen;

      if (newValue) {
        localStorage.setItem(storageKey, 'true');
      } else {
        localStorage.removeItem(storageKey);
      }

      // Update React state to trigger re-render
      setRenderCount(c => c + 1);
    },
    [storageKey]
  );

  return [isOpen, setOpen] as const;
}
