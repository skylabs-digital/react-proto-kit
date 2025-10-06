import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUrlModal } from '../useUrlModal';
import { useUrlModalsContext } from '../context/UrlModalsContext';

export interface UrlModalProps {
  modalId: string;
  children: React.ReactNode;
  portal?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  animate?: boolean;
  unmountOnClose?: boolean;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
  overlayClassName?: string;
}

/**
 * Modal component with URL state management
 * Uses standardized ?modal=<modalId> param to ensure only one modal is open at a time
 * Auto-detects if UrlModalsContainer is available
 *
 * @example
 * ```tsx
 * <UrlModal modalId="editUser">
 *   <EditUserModal />
 * </UrlModal>
 * ```
 */
export function UrlModal({
  modalId,
  children,
  portal,
  onOpen,
  onClose,
  animate = true,
  unmountOnClose = true,
  closeOnEscape = true,
  closeOnBackdrop = true,
  className = '',
  overlayClassName = '',
}: UrlModalProps) {
  const hasContainer = useUrlModalsContext();
  const [isOpen, setOpen] = useUrlModal(modalId, { onOpen, onClose });

  // Auto-detect portal usage
  const shouldUsePortal = portal ?? hasContainer;

  // Warn if portal=true but no container
  useEffect(() => {
    if (shouldUsePortal && !hasContainer) {
      console.warn(
        `[UrlModal] Modal "${modalId}" has portal=true but <UrlModalsContainer /> was not found. ` +
          `Add <UrlModalsContainer /> to your root or set portal={false}.`
      );
    }
  }, [shouldUsePortal, hasContainer, modalId]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, setOpen]);

  // Don't render if closed and unmountOnClose is true
  if (!isOpen && unmountOnClose) {
    return null;
  }

  const modalContent = (
    <div
      className={`url-modal-overlay ${overlayClassName} ${isOpen ? 'open' : 'closed'} ${animate ? 'animated' : ''}`}
      onClick={closeOnBackdrop ? () => setOpen(false) : undefined}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: isOpen ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className={`url-modal-content ${className}`}
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );

  // Render via portal if available and enabled
  if (shouldUsePortal && hasContainer) {
    const portalContainer = document.getElementById('url-modals-portal');
    if (portalContainer) {
      return createPortal(modalContent, portalContainer);
    }
  }

  // Fallback to inline rendering
  return modalContent;
}
