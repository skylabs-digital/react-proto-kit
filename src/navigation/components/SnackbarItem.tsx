import { useEffect, useState } from 'react';
import type { Snackbar } from '../context/SnackbarContext';

export interface SnackbarItemProps {
  snackbar: Snackbar;
  onClose: (id: string) => void;
  animate?: boolean;
}

/**
 * Individual snackbar notification item
 * Handles rendering, animations, and close actions
 */
export function SnackbarItem({ snackbar, onClose, animate = true }: SnackbarItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    if (animate) {
      setIsVisible(false);
      // Wait for exit animation
      setTimeout(() => onClose(snackbar.id), 300);
    } else {
      onClose(snackbar.id);
    }
  };

  const handleActionClick = () => {
    if (snackbar.action) {
      snackbar.action.onClick();
      handleClose();
    }
  };

  const variantColors = {
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
  };

  const backgroundColor = variantColors[snackbar.variant];

  return (
    <div
      className="snackbar-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor,
        color: 'white',
        padding: '12px 16px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        marginBottom: '8px',
        minWidth: '300px',
        maxWidth: '500px',
        transition: animate ? 'all 0.3s ease-in-out' : 'none',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      }}
    >
      <div style={{ flex: 1, marginRight: '12px' }}>{snackbar.message}</div>

      {snackbar.action && (
        <button
          onClick={handleActionClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            fontSize: '14px',
            marginRight: '8px',
            padding: '4px 8px',
          }}
        >
          {snackbar.action.label}
        </button>
      )}

      <button
        onClick={handleClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0',
          lineHeight: '1',
          width: '20px',
          height: '20px',
        }}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
