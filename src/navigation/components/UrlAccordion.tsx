import React from 'react';
import { useUrlAccordion } from '../useUrlAccordion';

export interface UrlAccordionProps {
  param: string;
  id: string;
  multiple?: boolean;
  children: React.ReactNode | ((isExpanded: boolean) => React.ReactNode);
  defaultExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

/**
 * Accordion component with URL state management
 * Does NOT add to navigation stack
 *
 * @example
 * ```tsx
 * <UrlAccordion param="section" id="details">
 *   <AccordionDetails />
 * </UrlAccordion>
 *
 * // With render function
 * <UrlAccordion param="section" id="details">
 *   {(isExpanded) => (
 *     <>
 *       <button>Toggle {isExpanded ? '▼' : '▶'}</button>
 *       {isExpanded && <Details />}
 *     </>
 *   )}
 * </UrlAccordion>
 * ```
 */
export function UrlAccordion({
  param,
  id,
  multiple = false,
  children,
  defaultExpanded = false,
  className = '',
  headerClassName = '',
  contentClassName = '',
}: UrlAccordionProps) {
  const [expanded, helpers] = multiple
    ? useUrlAccordion(param, { multiple: true })
    : useUrlAccordion(param, { multiple: false });

  // Determine if this section is expanded
  const isExpanded = expanded
    ? Array.isArray(expanded)
      ? expanded.includes(id)
      : expanded === id
    : defaultExpanded;

  // Render function mode
  if (typeof children === 'function') {
    return <div className={className}>{children(isExpanded)}</div>;
  }

  // Default rendering with toggle button
  return (
    <div className={`url-accordion ${className}`}>
      <button
        className={`url-accordion-header ${headerClassName}`}
        onClick={() => helpers.toggle(id)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '12px',
          border: 'none',
          backgroundColor: '#f0f0f0',
          cursor: 'pointer',
        }}
      >
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>
      {isExpanded && (
        <div className={`url-accordion-content ${contentClassName}`} style={{ padding: '12px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
