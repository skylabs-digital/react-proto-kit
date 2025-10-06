import React from 'react';
import { createPortal } from 'react-dom';
import { useSnackbarContext } from '../context/SnackbarContext';
import { SnackbarItem, SnackbarItemProps } from './SnackbarItem';

export type SnackbarPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

export interface SnackbarContainerProps {
  position?: SnackbarPosition;
  className?: string;
  animate?: boolean;
  /**
   * Custom snackbar component to render instead of the default SnackbarItem
   * Receives the same props as SnackbarItem
   * @example
   * ```tsx
   * <SnackbarContainer
   *   SnackbarComponent={CustomSnackbar}
   * />
   * ```
   */
  SnackbarComponent?: React.ComponentType<SnackbarItemProps>;
}

/**
 * Container for rendering snackbar notifications
 * Uses portal to render at document.body level for proper z-index
 *
 * @example
 * ```tsx
 * // In your app root
 * <SnackbarProvider>
 *   <SnackbarContainer position="top-right" />
 *   <App />
 * </SnackbarProvider>
 * ```
 */
export function SnackbarContainer({
  position = 'top-right',
  className = '',
  animate = true,
  SnackbarComponent = SnackbarItem,
}: SnackbarContainerProps) {
  const { snackbars, hideSnackbar } = useSnackbarContext();

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyle, top: '16px', right: '16px' };
      case 'top-left':
        return { ...baseStyle, top: '16px', left: '16px' };
      case 'top-center':
        return { ...baseStyle, top: '16px', left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-right':
        return { ...baseStyle, bottom: '16px', right: '16px' };
      case 'bottom-left':
        return { ...baseStyle, bottom: '16px', left: '16px' };
      case 'bottom-center':
        return { ...baseStyle, bottom: '16px', left: '50%', transform: 'translateX(-50%)' };
    }
  };

  const content = (
    <div className={`snackbar-container ${className}`} style={getPositionStyles()}>
      {snackbars.map(snackbar => (
        <SnackbarComponent
          key={snackbar.id}
          snackbar={snackbar}
          onClose={hideSnackbar}
          animate={animate}
        />
      ))}
    </div>
  );

  // Render via portal to document.body
  return createPortal(content, document.body);
}
