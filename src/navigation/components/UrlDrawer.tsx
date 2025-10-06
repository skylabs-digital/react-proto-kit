import React from 'react';
import { useUrlDrawer } from '../useUrlDrawer';

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

export interface UrlDrawerProps {
  param: string;
  children: React.ReactNode;
  position?: DrawerPosition;
  onOpen?: () => void;
  onClose?: () => void;
  animate?: boolean;
  unmountOnClose?: boolean;
  className?: string;
  overlayClassName?: string;
}

/**
 * Drawer component with localStorage state management (no URL pollution)
 * Provides cross-tab sync and persistent state without affecting URL
 * Renders inline (does not use portal)
 *
 * @example
 * ```tsx
 * <UrlDrawer param="filters" position="left">
 *   <FiltersPanel />
 * </UrlDrawer>
 *
 * <UrlDrawer param="sidebar" position="left" unmountOnClose>
 *   <Sidebar />
 * </UrlDrawer>
 * ```
 */
export function UrlDrawer({
  param,
  children,
  position = 'right',
  onOpen,
  onClose,
  animate = true,
  unmountOnClose = false,
  className = '',
  overlayClassName = '',
}: UrlDrawerProps) {
  const [isOpen, setOpen] = useUrlDrawer(param, { onOpen, onClose });

  // Don't render if closed and unmountOnClose is true
  if (!isOpen && unmountOnClose) {
    return null;
  }

  const getDrawerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      backgroundColor: 'white',
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
      transition: animate ? 'transform 0.3s ease-in-out' : 'none',
      zIndex: 999,
    };

    switch (position) {
      case 'left':
        return {
          ...baseStyle,
          top: 0,
          left: 0,
          bottom: 0,
          width: '300px',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        };
      case 'right':
        return {
          ...baseStyle,
          top: 0,
          right: 0,
          bottom: 0,
          width: '300px',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        };
      case 'top':
        return {
          ...baseStyle,
          top: 0,
          left: 0,
          right: 0,
          height: '300px',
          transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
        };
      case 'bottom':
        return {
          ...baseStyle,
          bottom: 0,
          left: 0,
          right: 0,
          height: '300px',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        };
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className={`url-drawer-overlay ${overlayClassName}`}
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 998,
          }}
        />
      )}

      {/* Drawer */}
      <div className={`url-drawer url-drawer-${position} ${className}`} style={getDrawerStyle()}>
        {children}
      </div>
    </>
  );
}
