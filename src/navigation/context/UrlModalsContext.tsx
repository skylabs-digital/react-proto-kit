import { createContext, useContext } from 'react';

/**
 * Context to detect if UrlModalsContainer is present in the tree
 */
export const UrlModalsContext = createContext<boolean>(false);

/**
 * Hook to check if UrlModalsContainer is available
 */
export function useUrlModalsContext(): boolean {
  return useContext(UrlModalsContext);
}
