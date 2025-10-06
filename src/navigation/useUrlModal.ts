import { useCallback, useEffect, useRef, useState } from 'react';
import { pushToStack, removeParam } from './utils/navigationHelpers';
import { useSearchParams } from 'react-router-dom';

const MODAL_PARAM = 'modal';

export interface UseUrlModalOptions {
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Hook for managing modal state via URL params
 * Uses standardized "modal" param to ensure only one modal is open at a time
 *
 * @param modalId - Unique identifier for this modal
 * @param options - Optional callbacks
 * @returns [isOpen, setOpen] tuple
 *
 * @example
 * ```tsx
 * const [isOpen, setOpen] = useUrlModal('editUser');
 *
 * setOpen(true);   // Adds ?modal=editUser to URL (closes other modals)
 * setOpen(false);  // Removes ?modal from URL
 * setOpen();       // Toggles modal state
 * ```
 */
export function useUrlModal(
  modalId: string,
  options: UseUrlModalOptions = {}
): readonly [boolean, (value?: boolean) => void] {
  const [searchParams] = useSearchParams();
  const { onOpen, onClose } = options;

  // Use refs to avoid dependency issues
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);

  // Update refs when callbacks change
  useEffect(() => {
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
  }, [onOpen, onClose]);

  // Track current state - modal is open if ?modal=<modalId>
  const currentModalId = searchParams.get(MODAL_PARAM);
  const isOpen = currentModalId === modalId;
  const [prevOpen, setPrevOpen] = useState(isOpen);

  // Fire callbacks when state changes
  useEffect(() => {
    if (isOpen && !prevOpen) {
      onOpenRef.current?.();
    } else if (!isOpen && prevOpen) {
      onCloseRef.current?.();
    }
    setPrevOpen(isOpen);
  }, [isOpen, prevOpen]);

  const setOpen = useCallback(
    (value?: boolean) => {
      const currentlyOpen = currentModalId === modalId;

      // If no value provided, toggle
      const newValue = value !== undefined ? value : !currentlyOpen;

      if (newValue && !currentlyOpen) {
        // Open modal - set ?modal=<modalId> (replaces any other modal)
        pushToStack(MODAL_PARAM, modalId);
      } else if (!newValue && currentlyOpen) {
        // Close modal - remove ?modal param
        removeParam(MODAL_PARAM, true);
      }
    },
    [modalId, currentModalId]
  );

  return [isOpen, setOpen] as const;
}
