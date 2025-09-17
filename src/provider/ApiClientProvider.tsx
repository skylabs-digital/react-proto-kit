import React, { createContext, useContext, ReactNode } from 'react';
import { ConnectorType, ConnectorConfig, IConnector } from '../types';
import { LocalStorageConnector } from '../connectors/LocalStorageConnector';
import { FetchConnector } from '../connectors/FetchConnector';

interface ApiClientContextValue {
  connector: IConnector;
  config: ConnectorConfig;
}

const ApiClientContext = createContext<ApiClientContextValue | null>(null);

interface ApiClientProviderProps {
  children: ReactNode;
  connectorType?: ConnectorType;
  config?: ConnectorConfig;
  connector?: IConnector;
}

export const ApiClientProvider: React.FC<ApiClientProviderProps> = ({
  children,
  connectorType,
  config = {},
  connector: providedConnector,
}) => {
  const connector = React.useMemo(() => {
    // If a connector is provided directly, use it
    if (providedConnector) {
      return providedConnector;
    }

    // Otherwise, create one based on connectorType
    if (!connectorType) {
      throw new Error('Either connectorType or connector must be provided');
    }

    switch (connectorType) {
      case 'localStorage':
        return new LocalStorageConnector(config);
      case 'fetch':
        return new FetchConnector(config);
      default:
        throw new Error(`Unsupported connector type: ${connectorType}`);
    }
  }, [connectorType, config, providedConnector]);

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
