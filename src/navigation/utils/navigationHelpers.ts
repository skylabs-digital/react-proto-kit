/**
 * Navigation helpers for managing URL search params with history
 */
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Validates a URL search param against an allowed list. Returns the current
 * value (or `defaultValue` if missing/invalid) and, as a side effect, rewrites
 * the URL (via `replace`) to drop any invalid value. Warns once per
 * (param, value) pair in non-production builds.
 */
export function useValidatedSearchParam<T extends string>(
  param: string,
  allowedValues: readonly T[],
  defaultValue: T,
  hookName: string
): T {
  const [searchParams, setSearchParams] = useSearchParams();
  const warnedRef = useRef<string | null>(null);

  const urlValue = searchParams.get(param);
  const isValid = !!urlValue && allowedValues.includes(urlValue as T);
  const isInvalid = !!urlValue && !isValid;
  const current = isValid ? (urlValue as T) : defaultValue;

  useEffect(() => {
    if (!isInvalid || !urlValue) return;

    const warnKey = `${param}:${urlValue}`;
    if (process.env.NODE_ENV !== 'production' && warnedRef.current !== warnKey) {
      warnedRef.current = warnKey;
      console.warn(
        `[${hookName}] Invalid value "${urlValue}" for param "${param}". ` +
          `Allowed values: ${allowedValues.join(', ')}. Using default: ${defaultValue}`
      );
    }

    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.delete(param);
        return next;
      },
      { replace: true }
    );
  }, [isInvalid, urlValue, param, allowedValues, defaultValue, hookName, setSearchParams]);

  return current;
}

/**
 * Adds a param to URL and pushes to navigation stack
 * Browser back button will remove the param
 */
export function pushToStack(param: string, value?: string) {
  const params = new URLSearchParams(window.location.search);

  if (value !== undefined && value !== '') {
    params.set(param, value);
  } else {
    params.set(param, '');
  }

  const url = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  window.history.pushState({}, '', url);

  // Trigger popstate to notify react-router
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Replaces param in URL without adding to navigation stack
 * Browser back button will NOT remove the param
 */
export function replaceInStack(param: string, value?: string) {
  const params = new URLSearchParams(window.location.search);

  if (value !== undefined && value !== '') {
    params.set(param, value);
  } else {
    params.set(param, '');
  }

  const url = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  window.history.replaceState({}, '', url);

  // Trigger popstate to notify react-router
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Removes a param from URL
 * @param param - Parameter name to remove
 * @param useStack - If true, pushes to history stack (default: true)
 */
export function removeParam(param: string, useStack = true) {
  const params = new URLSearchParams(window.location.search);
  params.delete(param);

  const url =
    window.location.pathname +
    (params.toString() ? `?${params.toString()}` : '') +
    window.location.hash;

  const method = useStack ? 'pushState' : 'replaceState';
  window.history[method]({}, '', url);

  // Trigger popstate to notify react-router
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Checks if a param exists in current URL
 */
export function hasParam(param: string): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has(param);
}

/**
 * Gets param value from URL
 */
export function getParam(param: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}
