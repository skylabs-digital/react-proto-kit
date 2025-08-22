import React from 'react';
import { ApiClientProvider } from '../../provider/ApiClientProvider';
import { GlobalStateProvider } from '../../context/GlobalStateProvider';

interface TestWrapperConfig {
  connectorType: 'localStorage';
  config?: {
    seed?: {
      data: Record<string, any>;
      behavior: {
        initializeEmpty: boolean;
        mergeStrategy: 'replace' | 'merge';
      };
    };
  };
}

export const createTestWrapper = (config: TestWrapperConfig) => {
  return ({ children }: { children: React.ReactNode }) => (
    <ApiClientProvider connectorType={config.connectorType} config={config.config}>
      <GlobalStateProvider>{children}</GlobalStateProvider>
    </ApiClientProvider>
  );
};
