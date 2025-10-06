import { useCallback, useMemo } from 'react';
import { pushToStack } from './utils/navigationHelpers';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook for managing tab state via URL params with validation
 *
 * @param param - URL parameter name
 * @param allowedValues - Array of allowed tab values
 * @param defaultValue - Default tab (optional, uses first value if not provided)
 * @returns [activeTab, setTab] tuple
 *
 * @example
 * ```tsx
 * type Tab = 'profile' | 'settings' | 'billing';
 * const [activeTab, setTab] = useUrlTabs<Tab>(
 *   'tab',
 *   ['profile', 'settings', 'billing'],
 *   'profile'
 * );
 *
 * setTab('settings'); // Sets ?tab=settings
 * ```
 */
export function useUrlTabs<T extends string = string>(
  param: string,
  allowedValues: readonly T[],
  defaultValue?: T
): readonly [T, (value: T) => void] {
  const [searchParams] = useSearchParams();

  const activeTab = useMemo(() => {
    const urlValue = searchParams.get(param);
    const defaultTab = defaultValue || allowedValues[0];

    if (!urlValue) {
      return defaultTab;
    }

    // Validate that the value is allowed
    if (allowedValues.includes(urlValue as T)) {
      return urlValue as T;
    }

    // Invalid value - warn in development and use default
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[useUrlTabs] Invalid value "${urlValue}" for param "${param}". ` +
          `Allowed values: ${allowedValues.join(', ')}. Using default: ${defaultTab}`
      );
    }

    return defaultTab;
  }, [searchParams, param, allowedValues, defaultValue]);

  const setTab = useCallback(
    (value: T) => {
      if (!allowedValues.includes(value)) {
        console.error(
          `[useUrlTabs] Cannot set invalid value "${value}" for param "${param}". ` +
            `Allowed values: ${allowedValues.join(', ')}`
        );
        return;
      }

      pushToStack(param, value);
    },
    [param, allowedValues]
  );

  return [activeTab, setTab] as const;
}
