import React from 'react';
import { UrlModalsContext } from '../context/UrlModalsContext';

export interface UrlModalsContainerProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Container for rendering modals via portal
 * Must be placed in root/layout of your app
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <div>
 *       <UrlModalsContainer />
 *       <Routes />
 *     </div>
 *   );
 * }
 * ```
 */
export function UrlModalsContainer({ className, children }: UrlModalsContainerProps) {
  return (
    <UrlModalsContext.Provider value={true}>
      <div id="url-modals-portal" className={className}>
        {children}
      </div>
    </UrlModalsContext.Provider>
  );
}
