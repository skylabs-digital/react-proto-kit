import React from 'react';
import { useDataOrchestrator } from '../hooks/useDataOrchestrator';
import { useDataOrchestratorContext } from '../context/DataOrchestratorContext';
import {
  DataOrchestratorConfig,
  RequiredOptionalConfig,
  UseDataOrchestratorOptions,
  DataOrchestratorErrorProps,
  ErrorResponse,
} from '../types';

/**
 * Configuration for withDataOrchestrator HOC
 */
interface WithDataOrchestratorConfig<T extends DataOrchestratorConfig | RequiredOptionalConfig> {
  hooks: T;
  loader?: React.ReactNode;
  errorComponent?: React.ComponentType<DataOrchestratorErrorProps>;
  options?: UseDataOrchestratorOptions;
}

/**
 * Default full-screen loader component
 */
function DefaultLoader() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 9999,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            margin: '0 auto 16px',
            borderRadius: '50%',
            border: '6px solid rgba(0,0,0,0.1)',
            borderTopColor: 'rgba(0,0,0,0.65)',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin { 
            from { transform: rotate(0deg); } 
            to { transform: rotate(360deg); } 
          }
        `}</style>
        <div style={{ fontWeight: 500 }}>Loading...</div>
      </div>
    </div>
  );
}

/**
 * Default full-screen error component
 */
function DefaultErrorComponent({ errors, retry }: DataOrchestratorErrorProps) {
  const errorEntries = Object.entries(errors);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 9999,
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: '100%',
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 12,
          boxShadow: '0 8px 25px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)',
          padding: 20,
        }}
      >
        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>Something went wrong</h2>
        <p style={{ margin: '0 0 12px 0', color: '#444' }}>
          An error occurred while loading required resources.
        </p>
        <ul style={{ paddingLeft: 18, margin: '0 0 16px 0', fontSize: '0.9rem' }}>
          {errorEntries.map(([key, error]) => (
            <li key={key} style={{ marginBottom: 4 }}>
              <code style={{ backgroundColor: '#f5f5f5', padding: '2px 4px', borderRadius: 3 }}>
                {key}
              </code>
              : {error.message || 'Unknown error'}
            </li>
          ))}
        </ul>
        {retry && (
          <button
            onClick={retry}
            style={{
              border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              background: '#111',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * HOC that wraps a component with data orchestration
 * Only renders the component when all required resources are loaded
 *
 * The returned component doesn't require the props that will be injected by the orchestrator
 */
export function withDataOrchestrator<
  T extends DataOrchestratorConfig | RequiredOptionalConfig,
  P extends Record<string, any> = Record<string, any>,
>(
  Component: React.ComponentType<P>,
  config: WithDataOrchestratorConfig<T>
): React.ComponentType<Partial<P>> {
  const { hooks, loader, errorComponent: ErrorComponent, options } = config;

  return function WithDataOrchestratorWrapper(props: Partial<P>) {
    const context = useDataOrchestratorContext();
    const result = useDataOrchestrator(hooks as any, options);

    const { isLoading, hasErrors, errors, retryAll, data } = result;

    // Determine which loader to use
    const LoaderComponent =
      loader !== undefined ? (
        <>{loader}</>
      ) : context?.defaultLoader !== undefined ? (
        <>{context.defaultLoader}</>
      ) : (
        <DefaultLoader />
      );

    // Determine which error component to use
    const ErrorComponentToUse =
      ErrorComponent || context?.defaultErrorComponent || DefaultErrorComponent;

    // Show loader on first load
    if (isLoading) {
      return <>{LoaderComponent}</>;
    }

    // Show error if required resources failed
    if (hasErrors) {
      // Filter out undefined errors
      const definedErrors = Object.entries(errors).reduce(
        (acc, [key, error]) => {
          if (error) {
            acc[key] = error;
          }
          return acc;
        },
        {} as Record<string, ErrorResponse>
      );
      return <ErrorComponentToUse errors={definedErrors} retry={retryAll} />;
    }

    // All required resources loaded - render component with data as props
    return <Component {...(props as P)} {...(data as any)} />;
  };
}
