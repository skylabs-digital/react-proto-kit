import { useCallback } from 'react';
import { pushToStack, useValidatedSearchParam } from './utils/navigationHelpers';

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
  const defaultTab = defaultValue || allowedValues[0];
  const activeTab = useValidatedSearchParam(param, allowedValues, defaultTab, 'useUrlTabs');

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
