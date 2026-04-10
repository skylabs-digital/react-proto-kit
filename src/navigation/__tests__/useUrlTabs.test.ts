import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
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
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(
      () => useUrlTabs('tab', ['profile', 'settings', 'billing'] as const),
      { wrapper }
    );
    expect(result.current[0]).toBe('profile');
    consoleSpy.mockRestore();
  });

  it('rewrites URL to drop invalid value', async () => {
    window.history.pushState({}, '', '/?tab=nonexistent&other=keep');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(
      () => useUrlTabs('tab', ['profile', 'settings', 'billing'] as const),
      { wrapper }
    );

    expect(result.current[0]).toBe('profile');

    await waitFor(() => {
      expect(window.location.search).not.toContain('nonexistent');
    });
    expect(window.location.search).not.toContain('tab=');
    expect(window.location.search).toContain('other=keep');

    consoleSpy.mockRestore();
  });

  it('warns only once per invalid (param, value) pair under StrictMode', () => {
    window.history.pushState({}, '', '/?tab=bogus');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const strictWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(BrowserRouter, null, children)
      );

    renderHook(() => useUrlTabs('tab', ['profile', 'settings', 'billing'] as const), {
      wrapper: strictWrapper,
    });

    const bogusWarns = consoleSpy.mock.calls.filter(call =>
      String(call[0] ?? '').includes('bogus')
    );
    expect(bogusWarns.length).toBe(1);

    consoleSpy.mockRestore();
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
