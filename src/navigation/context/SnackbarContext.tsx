import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type SnackbarVariant = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarAction {
  label: string;
  onClick: () => void;
}

export interface ShowSnackbarOptions {
  message: string;
  variant?: SnackbarVariant;
  duration?: number | null;
  onClose?: () => void;
  action?: SnackbarAction;
}

export interface Snackbar extends ShowSnackbarOptions {
  id: string;
  variant: SnackbarVariant;
}

export interface SnackbarContextValue {
  snackbars: Snackbar[];
  showSnackbar: (options: ShowSnackbarOptions) => string;
  hideSnackbar: (id: string) => void;
  hideAll: () => void;
  defaultDuration: number;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export interface SnackbarProviderProps {
  children: React.ReactNode;
  defaultDuration?: number;
  maxVisible?: number;
}

let snackbarIdCounter = 0;
const generateId = () => `snackbar-${Date.now()}-${++snackbarIdCounter}`;

/**
 * Provider for snackbar notifications with auto-dismiss and queue management
 */
export function SnackbarProvider({
  children,
  defaultDuration = 4000,
  maxVisible = 3,
}: SnackbarProviderProps) {
  const [snackbars, setSnackbars] = useState<Snackbar[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const hideSnackbar = useCallback((id: string) => {
    setSnackbars(prev => {
      const snackbar = prev.find(s => s.id === id);
      if (snackbar?.onClose) {
        snackbar.onClose();
      }
      return prev.filter(s => s.id !== id);
    });

    // Clear timer if exists
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showSnackbar = useCallback(
    (options: ShowSnackbarOptions): string => {
      const id = generateId();
      const variant = options.variant || 'info';
      const duration = options.duration !== undefined ? options.duration : defaultDuration;

      const snackbar: Snackbar = {
        ...options,
        id,
        variant,
        duration,
      };

      setSnackbars(prev => {
        // If we've reached max, remove oldest
        if (prev.length >= maxVisible) {
          const oldest = prev[0];
          hideSnackbar(oldest.id);
        }
        return [...prev, snackbar];
      });

      // Setup auto-dismiss timer
      if (duration !== null && duration > 0) {
        const timer = setTimeout(() => {
          hideSnackbar(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [defaultDuration, maxVisible, hideSnackbar]
  );

  const hideAll = useCallback(() => {
    snackbars.forEach(s => {
      if (s.onClose) {
        s.onClose();
      }
    });
    setSnackbars([]);

    // Clear all timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
  }, [snackbars]);

  const value: SnackbarContextValue = {
    snackbars,
    showSnackbar,
    hideSnackbar,
    hideAll,
    defaultDuration,
  };

  return <SnackbarContext.Provider value={value}>{children}</SnackbarContext.Provider>;
}

/**
 * Hook to access snackbar context
 * Must be used within SnackbarProvider
 */
export function useSnackbarContext(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbarContext must be used within SnackbarProvider');
  }
  return context;
}
