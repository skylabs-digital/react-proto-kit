import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUrlTabs } from '../useUrlTabs';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(BrowserRouter, null, children);

describe('useUrlTabs', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('should return first tab as default', () => {
    const { result } = renderHook(
      () => useUrlTabs('tab', ['profile', 'settings', 'billing'] as const),
      { wrapper }
    );
    expect(result.current[0]).toBe('profile');
  });

  it('should return specified default tab', () => {
    const { result } = renderHook(
      () => useUrlTabs('tab', ['profile', 'settings', 'billing'] as const, 'settings'),
      { wrapper }
    );
    expect(result.current[0]).toBe('settings');
  });

  it('should read tab from URL', () => {
    window.history.pushState({}, '', '/?tab=billing');
    const { result } = renderHook(
      () => useUrlTabs('tab', ['profile', 'settings', 'billing'] as const),
      { wrapper }
    );
    expect(result.current[0]).toBe('billing');
  });

  it('should set tab in URL', () => {
    const { result } = renderHook(
      () => useUrlTabs('tab', ['profile', 'settings', 'billing'] as const),
      { wrapper }
    );

    act(() => {
      result.current[1]('settings');
    });

    expect(window.location.search).toContain('tab=settings');
    expect(result.current[0]).toBe('settings');
  });

  it('should use default when invalid tab in URL', () => {
    window.history.pushState({}, '', '/?tab=invalid');
    const { result } = renderHook(
      () => useUrlTabs('tab', ['profile', 'settings', 'billing'] as const),
      { wrapper }
    );
    expect(result.current[0]).toBe('profile');
  });

  it('should not set invalid tab', () => {
    const { result } = renderHook(
      () => useUrlTabs('tab', ['profile', 'settings', 'billing'] as const),
      { wrapper }
    );

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      // @ts-expect-error - Testing runtime validation
      result.current[1]('invalid');
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(window.location.search).not.toContain('tab=invalid');

    consoleSpy.mockRestore();
  });
});
