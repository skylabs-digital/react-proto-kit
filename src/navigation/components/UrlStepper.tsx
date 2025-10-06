import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUrlStepper, StepperHelpers } from '../useUrlStepper';

export interface UrlStepperProps<T extends string> {
  param: string;
  value?: T;
  steps?: readonly T[];
  defaultStep?: T;
  children: React.ReactNode | ((currentStep: T, helpers: StepperHelpers<T>) => React.ReactNode);
  unmountOnHide?: boolean;
  className?: string;
}

/**
 * Stepper component with URL state management
 *
 * @example
 * ```tsx
 * // Simple usage
 * <UrlStepper param="step" value="payment">
 *   <PaymentStep />
 * </UrlStepper>
 *
 * // With render function
 * <UrlStepper param="step" steps={['info', 'payment', 'confirm']}>
 *   {(currentStep, helpers) => (
 *     <>
 *       {currentStep === 'info' && <InfoStep />}
 *       {currentStep === 'payment' && <PaymentStep />}
 *       <button onClick={helpers.next}>Next</button>
 *     </>
 *   )}
 * </UrlStepper>
 * ```
 */
export function UrlStepper<T extends string>({
  param,
  value,
  steps,
  defaultStep,
  children,
  unmountOnHide = false,
  className = '',
}: UrlStepperProps<T>) {
  const [searchParams] = useSearchParams();

  // If steps provided, use the hook
  const [currentStep, helpers] = steps
    ? useUrlStepper(param, steps, defaultStep)
    : [undefined, {} as StepperHelpers<T>];

  // Render function mode
  if (typeof children === 'function') {
    if (!currentStep) {
      console.warn('[UrlStepper] Render function mode requires steps prop');
      return null;
    }
    return <div className={className}>{children(currentStep, helpers)}</div>;
  }

  // Value-based rendering mode
  if (value !== undefined) {
    // Determine if this step is active
    const isActive = useMemo(() => {
      if (currentStep !== undefined) {
        return currentStep === value;
      }
      // Fallback: read from URL params directly when steps not provided
      const urlValue = searchParams.get(param);
      return urlValue ? urlValue === value : value === defaultStep;
    }, [currentStep, searchParams, param, value, defaultStep]);

    if (!isActive && unmountOnHide) {
      return null;
    }

    return (
      <div className={className} style={{ display: isActive ? 'block' : 'none' }}>
        {children}
      </div>
    );
  }

  // No value or steps - just render children
  return <div className={className}>{children}</div>;
}
