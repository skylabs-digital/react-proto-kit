import React, { createContext, useContext, ReactNode } from 'react';
import { ConnectorType, ConnectorConfig, IConnector } from '../types';
import { LocalStorageConnector } from '../connectors/LocalStorageConnector';
import { FetchConnector } from '../connectors/FetchConnector';

// Global connector instance for schema registration
let globalConnectorInstance: IConnector | null = null;

interface ApiClientContextValue {
  connector: IConnector;
  config: ConnectorConfig;
}

const ApiClientContext = createContext<ApiClientContextValue | null>(null);

interface ApiClientProviderProps {
  children: ReactNode;
  connectorType: ConnectorType;
  config?: ConnectorConfig;
}

export const ApiClientProvider: React.FC<ApiClientProviderProps> = ({
  children,
  connectorType,
  config = {},
}) => {
  const connector = React.useMemo(() => {
    let connectorInstance: IConnector;
    switch (connectorType) {
      case 'localStorage':
        connectorInstance = new LocalStorageConnector(config);
        break;
      case 'fetch':
        connectorInstance = new FetchConnector(config);
        break;
      default:
        throw new Error(`Unsupported connector type: ${connectorType}`);
    }

    // Set global instance for schema registration
    globalConnectorInstance = connectorInstance;
    return connectorInstance;
  }, [connectorType, config]);

  const contextValue = React.useMemo(
    () => ({
      connector,
      config,
    }),
    [connector, config]
  );

  return <ApiClientContext.Provider value={contextValue}>{children}</ApiClientContext.Provider>;
};

export const useApiClient = (): ApiClientContextValue => {
  const context = useContext(ApiClientContext);
  if (!context) {
    throw new Error('useApiClient must be used within an ApiClientProvider');
  }
  return context;
};

// Export function to get global connector for schema registration
export const getGlobalConnector = (): IConnector | null => {
  return globalConnectorInstance;
};
