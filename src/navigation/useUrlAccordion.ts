import { useCallback, useMemo } from 'react';
import { replaceInStack } from './utils/navigationHelpers';
import { useSearchParams } from 'react-router-dom';

export interface AccordionHelpersSingle {
  expand: (id: string) => void;
  collapse: () => void;
  toggle: (id: string) => void;
}

export interface AccordionHelpersMultiple {
  expand: (id: string) => void;
  collapse: (id: string) => void;
  expandAll: (ids: string[]) => void;
  collapseAll: () => void;
  toggle: (id: string) => void;
}

// Single mode overload
export function useUrlAccordion(
  param: string,
  options?: { multiple?: false }
): readonly [string | undefined, AccordionHelpersSingle];

// Multiple mode overload
export function useUrlAccordion(
  param: string,
  options: { multiple: true }
): readonly [string[] | undefined, AccordionHelpersMultiple];

/**
 * Hook for managing accordion state via URL params
 *
 * Note: Accordion does NOT add to navigation stack (uses replaceState)
 *
 * @param param - URL parameter name
 * @param options - Configuration options
 * @returns [expanded, helpers] tuple
 *
 * @example
 * ```tsx
 * // Single mode (only one section open at a time)
 * const [expanded, helpers] = useUrlAccordion('section');
 * helpers.expand('section1');  // Opens section1
 * helpers.collapse();          // Closes all
 *
 * // Multiple mode (multiple sections open)
 * const [expanded, helpers] = useUrlAccordion('sections', { multiple: true });
 * helpers.expand('section1');      // Adds section1
 * helpers.collapse('section1');    // Removes section1
 * helpers.expandAll(['s1', 's2']); // Opens multiple
 * helpers.collapseAll();           // Closes all
 * ```
 */
export function useUrlAccordion(
  param: string,
  options: { multiple?: boolean } = {}
): readonly [string | string[] | undefined, AccordionHelpersSingle | AccordionHelpersMultiple] {
  const [searchParams] = useSearchParams();
  const { multiple = false } = options;

  const expanded = useMemo(() => {
    const value = searchParams.get(param);

    if (!value) return undefined;

    if (multiple) {
      return value.split(',').filter(Boolean);
    }

    return value;
  }, [searchParams, param, multiple]);

  // Single mode helpers
  const expandSingle = useCallback(
    (id: string) => {
      replaceInStack(param, id); // Replace state, don't add to stack
    },
    [param]
  );

  const collapseSingle = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete(param);
    const url =
      window.location.pathname +
      (params.toString() ? `?${params.toString()}` : '') +
      window.location.hash;
    window.history.replaceState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [param]);

  const toggleSingle = useCallback(
    (id: string) => {
      if (expanded === id) {
        collapseSingle();
      } else {
        expandSingle(id);
      }
    },
    [expanded, expandSingle, collapseSingle]
  );

  // Multiple mode helpers
  const expandMultiple = useCallback(
    (id: string) => {
      const current = Array.isArray(expanded) ? expanded : [];
      if (!current.includes(id)) {
        const newExpanded = [...current, id];
        replaceInStack(param, newExpanded.join(','));
      }
    },
    [param, expanded]
  );

  const collapseMultiple = useCallback(
    (id: string) => {
      const current = Array.isArray(expanded) ? expanded : [];
      const newExpanded = current.filter(item => item !== id);

      if (newExpanded.length === 0) {
        collapseSingle();
      } else {
        replaceInStack(param, newExpanded.join(','));
      }
    },
    [param, expanded, collapseSingle]
  );

  const expandAll = useCallback(
    (ids: string[]) => {
      replaceInStack(param, ids.join(','));
    },
    [param]
  );

  const collapseAll = useCallback(() => {
    collapseSingle();
  }, [collapseSingle]);

  const toggleMultiple = useCallback(
    (id: string) => {
      const current = Array.isArray(expanded) ? expanded : [];
      if (current.includes(id)) {
        collapseMultiple(id);
      } else {
        expandMultiple(id);
      }
    },
    [expanded, expandMultiple, collapseMultiple]
  );

  if (multiple) {
    const helpers: AccordionHelpersMultiple = {
      expand: expandMultiple,
      collapse: collapseMultiple,
      expandAll,
      collapseAll,
      toggle: toggleMultiple,
    };
    return [expanded as string[] | undefined, helpers] as const;
  }

  const helpers: AccordionHelpersSingle = {
    expand: expandSingle,
    collapse: collapseSingle,
    toggle: toggleSingle,
  };
  return [expanded as string | undefined, helpers] as const;
}
