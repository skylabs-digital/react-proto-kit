import { useCallback, useMemo } from 'react';
import { pushToStack } from './utils/navigationHelpers';
import { useSearchParams } from 'react-router-dom';

export interface StepperHelpers<T extends string> {
  next: () => void;
  prev: () => void;
  goTo: (step: T) => void;
  reset: () => void;
  isFirst: boolean;
  isLast: boolean;
  currentIndex: number;
  totalSteps: number;
}

/**
 * Hook for managing wizard/stepper state via URL params
 *
 * @param param - URL parameter name
 * @param steps - Array of step values
 * @param defaultStep - Default step (optional, uses first step if not provided)
 * @returns [currentStep, helpers] tuple
 *
 * @example
 * ```tsx
 * const [step, helpers] = useUrlStepper(
 *   'step',
 *   ['cart', 'shipping', 'payment', 'confirm']
 * );
 *
 * helpers.next();      // Go to next step
 * helpers.prev();      // Go to previous step
 * helpers.goTo('payment'); // Go to specific step
 * helpers.isFirst;     // true if on first step
 * helpers.isLast;      // true if on last step
 * ```
 */
export function useUrlStepper<T extends string = string>(
  param: string,
  steps: readonly T[],
  defaultStep?: T
): readonly [T, StepperHelpers<T>] {
  const [searchParams] = useSearchParams();

  const currentStep = useMemo(() => {
    const urlValue = searchParams.get(param);
    const defaultValue = defaultStep || steps[0];

    if (!urlValue) {
      return defaultValue;
    }

    // Validate that the value is a valid step
    if (steps.includes(urlValue as T)) {
      return urlValue as T;
    }

    // Invalid value - warn in development and use default
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[useUrlStepper] Invalid step "${urlValue}" for param "${param}". ` +
          `Valid steps: ${steps.join(', ')}. Using default: ${defaultValue}`
      );
    }

    return defaultValue;
  }, [searchParams, param, steps, defaultStep]);

  const currentIndex = steps.indexOf(currentStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;

  const next = useCallback(() => {
    if (!isLast) {
      pushToStack(param, steps[currentIndex + 1]);
    }
  }, [param, steps, currentIndex, isLast]);

  const prev = useCallback(() => {
    if (!isFirst) {
      pushToStack(param, steps[currentIndex - 1]);
    }
  }, [param, steps, currentIndex, isFirst]);

  const goTo = useCallback(
    (step: T) => {
      if (!steps.includes(step)) {
        console.error(
          `[useUrlStepper] Cannot go to invalid step "${step}" for param "${param}". ` +
            `Valid steps: ${steps.join(', ')}`
        );
        return;
      }

      pushToStack(param, step);
    },
    [param, steps]
  );

  const reset = useCallback(() => {
    pushToStack(param, steps[0]);
  }, [param, steps]);

  const helpers: StepperHelpers<T> = useMemo(
    () => ({
      next,
      prev,
      goTo,
      reset,
      isFirst,
      isLast,
      currentIndex,
      totalSteps: steps.length,
    }),
    [next, prev, goTo, reset, isFirst, isLast, currentIndex, steps.length]
  );

  return [currentStep, helpers] as const;
}
