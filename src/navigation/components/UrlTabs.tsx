import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUrlTabs } from '../useUrlTabs';

export interface UrlTabsProps<T extends string> {
  param: string;
  value?: T;
  allowedValues?: readonly T[];
  defaultValue?: T;
  children: React.ReactNode | ((activeTab: T) => React.ReactNode);
  unmountOnHide?: boolean;
  className?: string;
}

/**
 * Tabs component with URL state management
 *
 * @example
 * ```tsx
 * // Simple usage
 * <UrlTabs param="tab" value="profile">
 *   <ProfileContent />
 * </UrlTabs>
 *
 * // With render function
 * <UrlTabs param="tab" allowedValues={['profile', 'settings']}>
 *   {(activeTab) => (
 *     activeTab === 'profile' ? <Profile /> : <Settings />
 *   )}
 * </UrlTabs>
 * ```
 */
export function UrlTabs<T extends string>({
  param,
  value,
  allowedValues,
  defaultValue,
  children,
  unmountOnHide = false,
  className = '',
}: UrlTabsProps<T>) {
  const [searchParams] = useSearchParams();

  // If allowedValues provided, use the hook
  const [activeTab] = allowedValues ? useUrlTabs(param, allowedValues, defaultValue) : [undefined];

  // Render function mode
  if (typeof children === 'function') {
    if (!activeTab) {
      console.warn('[UrlTabs] Render function mode requires allowedValues prop');
      return null;
    }
    return <div className={className}>{children(activeTab)}</div>;
  }

  // Value-based rendering mode
  if (value !== undefined) {
    // Determine if this tab is active
    const isActive = useMemo(() => {
      if (activeTab !== undefined) {
        return activeTab === value;
      }
      // Fallback: read from URL params directly when allowedValues not provided
      const urlValue = searchParams.get(param);
      return urlValue ? urlValue === value : value === defaultValue;
    }, [activeTab, searchParams, param, value, defaultValue]);

    if (!isActive && unmountOnHide) {
      return null;
    }

    return (
      <div className={className} style={{ display: isActive ? 'block' : 'none' }}>
        {children}
      </div>
    );
  }

  // No value or allowedValues - just render children
  return <div className={className}>{children}</div>;
}
