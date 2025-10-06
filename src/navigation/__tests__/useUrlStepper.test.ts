import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUrlStepper } from '../useUrlStepper';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(BrowserRouter, null, children);

const steps = ['cart', 'shipping', 'payment', 'confirm'] as const;

describe('useUrlStepper', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('should start at first step', () => {
    const { result } = renderHook(() => useUrlStepper('step', steps), { wrapper });
    expect(result.current[0]).toBe('cart');
    expect(result.current[1].currentIndex).toBe(0);
    expect(result.current[1].isFirst).toBe(true);
    expect(result.current[1].isLast).toBe(false);
  });

  it('should go to next step', () => {
    const { result } = renderHook(() => useUrlStepper('step', steps), { wrapper });

    act(() => {
      result.current[1].next();
    });

    expect(result.current[0]).toBe('shipping');
    expect(result.current[1].currentIndex).toBe(1);
  });

  it('should go to previous step', () => {
    window.history.pushState({}, '', '/?step=payment');
    const { result } = renderHook(() => useUrlStepper('step', steps), { wrapper });

    act(() => {
      result.current[1].prev();
    });

    expect(result.current[0]).toBe('shipping');
  });

  it('should go to specific step', () => {
    const { result } = renderHook(() => useUrlStepper('step', steps), { wrapper });

    act(() => {
      result.current[1].goTo('confirm');
    });

    expect(result.current[0]).toBe('confirm');
    expect(result.current[1].isLast).toBe(true);
  });

  it('should reset to first step', () => {
    window.history.pushState({}, '', '/?step=confirm');
    const { result } = renderHook(() => useUrlStepper('step', steps), { wrapper });

    act(() => {
      result.current[1].reset();
    });

    expect(result.current[0]).toBe('cart');
    expect(result.current[1].isFirst).toBe(true);
  });

  it('should not go beyond last step', () => {
    window.history.pushState({}, '', '/?step=confirm');
    const { result } = renderHook(() => useUrlStepper('step', steps), { wrapper });

    const currentStep = result.current[0];

    act(() => {
      result.current[1].next();
    });

    // Should stay at confirm
    expect(result.current[0]).toBe(currentStep);
  });

  it('should not go before first step', () => {
    const { result } = renderHook(() => useUrlStepper('step', steps), { wrapper });

    act(() => {
      result.current[1].prev();
    });

    // Should stay at cart
    expect(result.current[0]).toBe('cart');
  });

  it('should have correct totalSteps', () => {
    const { result } = renderHook(() => useUrlStepper('step', steps), { wrapper });
    expect(result.current[1].totalSteps).toBe(4);
  });
});
