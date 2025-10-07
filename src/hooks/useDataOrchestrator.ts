import { useEffect, useMemo, useRef } from 'react';
import {
  DataOrchestratorConfig,
  RequiredOptionalConfig,
  UseDataOrchestratorOptions,
  UseDataOrchestratorResult,
  UseDataOrchestratorResultWithOptional,
  ErrorResponse,
} from '../types';

/**
 * Internal state for tracking resource status
 */
interface ResourceState {
  data: any;
  loading: boolean;
  error: ErrorResponse | null;
  refetch?: () => Promise<void> | void;
  hasSettled: boolean; // Track if resource has completed its first load
}

/**
 * Check if config is RequiredOptionalConfig
 */
function isRequiredOptionalConfig(config: any): config is RequiredOptionalConfig {
  return config && (config.required || config.optional);
}

/**
 * Hook to orchestrate multiple data fetching hooks
 * Combines loading/error states and provides retry functionality
 */
export function useDataOrchestrator<T extends DataOrchestratorConfig>(
  config: T | null,
  options?: UseDataOrchestratorOptions
): UseDataOrchestratorResult<T>;

export function useDataOrchestrator<T extends RequiredOptionalConfig>(
  config: T,
  options?: UseDataOrchestratorOptions
): UseDataOrchestratorResultWithOptional<T>;

export function useDataOrchestrator<T extends DataOrchestratorConfig | RequiredOptionalConfig>(
  config: T | null,
  options?: UseDataOrchestratorOptions
): any {
  const { resetKey, onError } = options || {};

  // Track which resources have settled (completed first load)
  const hasSettledRef = useRef<Record<string, boolean>>({});

  // Reset tracking when resetKey changes
  const prevResetKey = useRef(resetKey);
  useEffect(() => {
    if (prevResetKey.current !== resetKey && prevResetKey.current !== undefined) {
      hasSettledRef.current = {};
      // Hooks will automatically refetch when their deps change
    }
    prevResetKey.current = resetKey;
  }, [resetKey]);

  // Determine if we have required/optional structure
  const isRequiredOptional = config && isRequiredOptionalConfig(config);

  // Flatten config to a single object for processing
  const flatConfig = useMemo(() => {
    if (!config) return {};
    if (isRequiredOptional) {
      return {
        ...config.required,
        ...config.optional,
      };
    }
    return config;
  }, [config, isRequiredOptional]);

  // Determine which keys are required
  const requiredKeys = useMemo(() => {
    if (!config) return new Set<string>();
    if (isRequiredOptional) {
      return new Set(Object.keys(config.required || {}));
    }
    // By default, all resources are required
    return new Set(Object.keys(flatConfig));
  }, [config, isRequiredOptional, flatConfig]);

  // Invoke all hooks and collect their states
  // IMPORTANT: Hooks must be called at the top level, not inside useMemo or other callbacks
  const resourceStates: Record<string, ResourceState> = {};

  Object.keys(flatConfig).forEach(key => {
    const hookFactory = (flatConfig as Record<string, any>)[key];
    if (typeof hookFactory === 'function') {
      try {
        // Call hook directly at top level
        const result = hookFactory();
        const hasSettled = hasSettledRef.current[key] || false;

        resourceStates[key] = {
          data: result.data ?? null,
          loading: result.loading || false,
          error: result.error || null,
          refetch: result.refetch,
          hasSettled,
        };

        // Update settled status after this render if not loading
        if (!result.loading && !hasSettled) {
          // Mark as settled in next tick to avoid state mutation during render
          Promise.resolve().then(() => {
            hasSettledRef.current[key] = true;
          });
        }
      } catch (error) {
        console.error(`[useDataOrchestrator] Error invoking hook for "${key}":`, error);
        resourceStates[key] = {
          data: null,
          loading: false,
          error: {
            success: false,
            message: error instanceof Error ? error.message : String(error),
          },
          hasSettled: true,
        };
      }
    }
  });

  // Compute aggregated states
  const { isLoading, isFetching, hasErrors, data, loadingStates, errors } = useMemo(() => {
    const dataObj: Record<string, any> = {};
    const loadingObj: Record<string, boolean> = {};
    const errorsObj: Record<string, ErrorResponse> = {};

    let anyRequiredLoading = false;
    let anyFetching = false;
    let anyRequiredError = false;

    Object.entries(resourceStates).forEach(([key, state]) => {
      // Data
      dataObj[key] = state.data;

      // Loading states
      loadingObj[key] = state.loading;

      // Errors
      if (state.error) {
        errorsObj[key] = state.error;

        if (requiredKeys.has(key)) {
          anyRequiredError = true;
        }
      }

      // isLoading: only true for initial load of required resources
      if (requiredKeys.has(key) && state.loading && !state.hasSettled) {
        anyRequiredLoading = true;
      }

      // isFetching: true for any loading (initial or refetch)
      if (state.loading) {
        anyFetching = true;
      }
    });

    return {
      isLoading: anyRequiredLoading,
      isFetching: anyFetching,
      hasErrors: anyRequiredError,
      data: dataObj,
      loadingStates: loadingObj,
      errors: errorsObj,
    };
  }, [resourceStates, requiredKeys]);

  // Notify errors
  const errorsSignature = Object.keys(errors)
    .sort()
    .map(k => `${k}:${errors[k]?.message || ''}`)
    .join('|');

  useEffect(() => {
    if (Object.keys(errors).length > 0 && onError) {
      onError(errors);
    }
  }, [errorsSignature, onError, errors]);

  // Retry functions
  const retry = (key: string) => {
    const state = resourceStates[key];
    if (state && typeof state.refetch === 'function') {
      state.refetch();
    } else {
      console.warn(`[useDataOrchestrator] Cannot retry "${key}": refetch function not available`);
    }
  };

  const retryAll = () => {
    Object.keys(resourceStates).forEach(key => {
      const state = resourceStates[key];
      if (typeof state.refetch === 'function') {
        state.refetch();
      }
    });
  };

  // Build refetch object (legacy)
  const refetch = useMemo(() => {
    const refetchObj: Record<string, () => Promise<void>> = {};
    Object.keys(resourceStates).forEach(key => {
      refetchObj[key] = async () => {
        const state = resourceStates[key];
        if (typeof state.refetch === 'function') {
          await state.refetch();
        }
      };
    });
    return refetchObj;
  }, [resourceStates]);

  return {
    data,
    isLoading,
    isFetching,
    hasErrors,
    loadingStates,
    errors,
    retry,
    retryAll,
    refetch,
  };
}
