import React, { createContext, useContext } from 'react';
import { DataOrchestratorProviderProps, DataOrchestratorErrorProps } from '../types';

interface DataOrchestratorContextValue {
  defaultLoader?: React.ReactNode;
  defaultErrorComponent?: React.ComponentType<DataOrchestratorErrorProps>;
  mode?: 'fullscreen' | 'passive';
}

const DataOrchestratorContext = createContext<DataOrchestratorContextValue | undefined>(undefined);

export function DataOrchestratorProvider({
  children,
  defaultLoader,
  defaultErrorComponent,
  mode = 'fullscreen',
}: DataOrchestratorProviderProps) {
  const value = React.useMemo(
    () => ({
      defaultLoader,
      defaultErrorComponent,
      mode,
    }),
    [defaultLoader, defaultErrorComponent, mode]
  );

  return (
    <DataOrchestratorContext.Provider value={value}>{children}</DataOrchestratorContext.Provider>
  );
}

export function useDataOrchestratorContext() {
  return useContext(DataOrchestratorContext);
}
