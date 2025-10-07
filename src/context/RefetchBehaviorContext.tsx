import React, { createContext, useContext } from 'react';
import { RefetchBehavior } from '../types';

const RefetchBehaviorContext = createContext<RefetchBehavior>('stale-while-revalidate');

export function RefetchBehaviorProvider({
  children,
  behavior,
}: {
  children: React.ReactNode;
  behavior: RefetchBehavior;
}) {
  return (
    <RefetchBehaviorContext.Provider value={behavior}>{children}</RefetchBehaviorContext.Provider>
  );
}

export function useRefetchBehavior(): RefetchBehavior {
  return useContext(RefetchBehaviorContext);
}
