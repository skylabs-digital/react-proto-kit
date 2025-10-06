import {
  useSnackbarContext,
  ShowSnackbarOptions,
  SnackbarVariant,
  SnackbarAction,
} from './context/SnackbarContext';

export type { ShowSnackbarOptions, SnackbarVariant, SnackbarAction };

export interface UseSnackbarReturn {
  /**
   * Show a snackbar notification
   * @param options - Snackbar configuration
   * @returns Snackbar ID for manual dismissal
   */
  showSnackbar: (options: ShowSnackbarOptions) => string;

  /**
   * Hide a specific snackbar by ID
   * @param id - Snackbar ID returned from showSnackbar
   */
  hideSnackbar: (id: string) => void;

  /**
   * Hide all active snackbars
   */
  hideAll: () => void;
}

/**
 * Hook for imperative snackbar notifications
 * Provides methods to show/hide toast-style messages
 *
 * @example
 * ```tsx
 * const { showSnackbar } = useSnackbar();
 *
 * // Success notification
 * showSnackbar({
 *   message: 'Changes saved successfully!',
 *   variant: 'success',
 *   duration: 3000
 * });
 *
 * // Error with manual dismiss
 * const id = showSnackbar({
 *   message: 'Error occurred',
 *   variant: 'error',
 *   duration: null
 * });
 * // Later: hideSnackbar(id);
 *
 * // With action button
 * showSnackbar({
 *   message: 'Item deleted',
 *   variant: 'info',
 *   action: {
 *     label: 'Undo',
 *     onClick: () => console.log('Undo clicked')
 *   }
 * });
 * ```
 */
export function useSnackbar(): UseSnackbarReturn {
  const { showSnackbar, hideSnackbar, hideAll } = useSnackbarContext();

  return {
    showSnackbar,
    hideSnackbar,
    hideAll,
  };
}
