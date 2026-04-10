import React from 'react';
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
const EMPTY_STEPS: readonly string[] = [];

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

  // Always call useUrlStepper unconditionally to satisfy Rules of Hooks. When
  // the caller doesn't pass `steps`, fall back to an empty list — the hook
  // still runs but returns an undefined `currentStep` and inert helpers.
  const stepperResult = useUrlStepper(param, (steps ?? EMPTY_STEPS) as readonly T[], defaultStep);
  const currentStep = steps ? stepperResult[0] : undefined;
  const helpers = steps ? stepperResult[1] : ({} as StepperHelpers<T>);

  if (typeof children === 'function') {
    if (!currentStep) {
      console.warn('[UrlStepper] Render function mode requires steps prop');
      return null;
    }
    return <div className={className}>{children(currentStep, helpers)}</div>;
  }

  if (value !== undefined) {
    const urlValue = searchParams.get(param);
    const isActive =
      currentStep !== undefined
        ? currentStep === value
        : urlValue
          ? urlValue === value
          : value === defaultStep;

    if (!isActive && unmountOnHide) {
      return null;
    }

    return (
      <div className={className} style={{ display: isActive ? 'block' : 'none' }}>
        {children}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}
