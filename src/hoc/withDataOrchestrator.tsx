import React from 'react';
import { useDataOrchestrator } from '../hooks/useDataOrchestrator';
import { useDataOrchestratorContext } from '../context/DataOrchestratorContext';
import { RefetchBehaviorProvider } from '../context/RefetchBehaviorContext';
import {
  DataOrchestratorConfig,
  RequiredOptionalConfig,
  UseDataOrchestratorOptions,
  DataOrchestratorErrorProps,
  ErrorResponse,
  OrchestratorControls,
  QueryHookFactory,
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
 * Injects data props and an `orchestrator` prop with refetch capabilities
 *
 * @template TData - Shape of data being orchestrated (for type inference)
 * @template TProps - Additional props the component accepts
 * @template TConfig - DataOrchestratorConfig type
 *
 * @example
 * ```tsx
 * interface PageData {
 *   user: User;
 *   posts: Post[];
 * }
 *
 * const Component = ({ user, posts, orchestrator }: WithOrchestratorProps<PageData>) => {
 *   return (
 *     <div>
 *       <button onClick={orchestrator.retryAll}>Refresh</button>
 *       {orchestrator.loading.posts && <Spinner />}
 *     </div>
 *   );
 * };
 *
 * export const Page = withDataOrchestrator<PageData>(Component, {
 *   hooks: {
 *     user: () => userApi.useQuery(userId),
 *     posts: () => postsApi.useList()
 *   }
 * });
 * ```
 *
 * @example With URL search params
 * ```tsx
 * // Component that filters based on URL params
 * function TodoList() {
 *   const [status] = useUrlParam('status');
 *   const [category] = useUrlParam('category');
 *
 *   // This component will auto-reset when status or category change
 *   return withDataOrchestrator<TodoData>(TodoListContent, {
 *     hooks: {
 *       todos: () => todosApi.withQuery({ status, category }).useList()
 *     },
 *     options: {
 *       watchSearchParams: ['status', 'category'] // Auto-reset on change!
 *     }
 *   });
 * }
 * ```
 */
export function withDataOrchestrator<
  TData extends Record<string, any> = Record<string, any>,
  TProps extends Record<string, any> = Record<string, any>,
  TConfig extends DataOrchestratorConfig | RequiredOptionalConfig = DataOrchestratorConfig,
>(
  Component: React.ComponentType<
    TProps &
      TData & {
        orchestrator: OrchestratorControls<{
          [K in keyof TData]: QueryHookFactory<TData[K]>;
        }>;
      }
  >,
  config: WithDataOrchestratorConfig<TConfig>
): React.ComponentType<TProps> {
  const { hooks, loader, errorComponent: ErrorComponent, options } = config;

  return function WithDataOrchestratorWrapper(props: TProps) {
    const context = useDataOrchestratorContext();

    // watchSearchParams is now handled inside useDataOrchestrator; we just
    // forward the options through. refetchBehavior is still handled here via
    // the Context wrapper below because Context must envelop the component
    // tree, not the hook invocation scope.
    const result = useDataOrchestrator(hooks as any, options);

    const {
      isLoading,
      isFetching,
      hasErrors,
      errors,
      retry,
      retryAll,
      refetch,
      loadingStates,
      data,
    } = result;

    // Build orchestrator controls object. We cast to the derived
    // OrchestratorControls<TData-derived-config> type because the relationship
    // between the runtime `hooks` config and the TData type parameter is a
    // convention honored by the consumer (e.g. withDataOrchestrator<PageData>),
    // not something TypeScript can infer from the erased runtime structure.
    const orchestrator = {
      retry,
      retryAll,
      refetch,
      loading: loadingStates,
      errors,
      isFetching,
      isLoading,
    } as OrchestratorControls<{
      [K in keyof TData]: QueryHookFactory<TData[K]>;
    }>;

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

    // All required resources loaded - render component with data + orchestrator
    // Wrap with RefetchBehaviorProvider to pass behavior down to hooks
    const refetchBehavior = options?.refetchBehavior || 'stale-while-revalidate';

    return (
      <RefetchBehaviorProvider behavior={refetchBehavior}>
        <Component {...(props as TProps)} {...(data as TData)} orchestrator={orchestrator} />
      </RefetchBehaviorProvider>
    );
  };
}
