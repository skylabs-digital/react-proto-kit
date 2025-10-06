import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUrlParam } from '../useUrlParam';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(BrowserRouter, null, children);

describe('useUrlParam', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('should return undefined when param is not in URL', () => {
    const { result } = renderHook(() => useUrlParam('test'), { wrapper });
    expect(result.current[0]).toBeUndefined();
  });

  it('should set param in URL', () => {
    const { result } = renderHook(() => useUrlParam('test'), { wrapper });

    act(() => {
      result.current[1]('value1');
    });

    expect(window.location.search).toContain('test=value1');
  });

  it('should remove param when set to null', () => {
    window.history.pushState({}, '', '/?test=value1');
    const { result } = renderHook(() => useUrlParam('test'), { wrapper });

    act(() => {
      result.current[1](null);
    });

    expect(window.location.search).not.toContain('test');
  });

  it('should handle multiple values', () => {
    const { result } = renderHook(() => useUrlParam('tags', String, { multiple: true }), {
      wrapper,
    });

    act(() => {
      result.current[1](['tag1', 'tag2']);
    });

    // URL encoding will encode the comma as %2C
    expect(window.location.search).toMatch(/tags=tag1.*tag2/);
  });

  it('should transform values', () => {
    window.history.pushState({}, '', '/?page=5');
    const { result } = renderHook(() => useUrlParam('page', Number), { wrapper });

    expect(result.current[0]).toBe(5);
    expect(typeof result.current[0]).toBe('number');
  });
});
