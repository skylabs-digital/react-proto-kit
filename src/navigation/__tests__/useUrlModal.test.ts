import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUrlModal } from '../useUrlModal';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(BrowserRouter, null, children);

describe('useUrlModal', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('should return false when modal is closed', () => {
    const { result } = renderHook(() => useUrlModal('editUser'), { wrapper });
    expect(result.current[0]).toBe(false);
  });

  it('should return true when ?modal=<modalId> is in URL', () => {
    window.history.pushState({}, '', '/?modal=editUser');
    const { result } = renderHook(() => useUrlModal('editUser'), { wrapper });
    expect(result.current[0]).toBe(true);
  });

  it('should open modal with ?modal=<modalId>', () => {
    const { result } = renderHook(() => useUrlModal('editUser'), { wrapper });

    act(() => {
      result.current[1](true);
    });

    expect(window.location.search).toBe('?modal=editUser');
    expect(result.current[0]).toBe(true);
  });

  it('should close modal by removing ?modal param', () => {
    window.history.pushState({}, '', '/?modal=editUser');
    const { result } = renderHook(() => useUrlModal('editUser'), { wrapper });

    act(() => {
      result.current[1](false);
    });

    expect(window.location.search).toBe('');
  });

  it('should toggle modal', () => {
    const { result } = renderHook(() => useUrlModal('editUser'), { wrapper });

    // Toggle to open
    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe(true);

    // Toggle to close
    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe(false);
  });

  it('should call onOpen callback', async () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() => useUrlModal('test', { onOpen }), { wrapper });

    act(() => {
      result.current[1](true);
    });

    // Wait for useEffect to trigger callback
    await waitFor(() => {
      expect(onOpen).toHaveBeenCalled();
    });
  });

  it('should call onClose callback', async () => {
    window.history.pushState({}, '', '/?modal=test');
    const onClose = vi.fn();
    const { result } = renderHook(() => useUrlModal('test', { onClose }), { wrapper });

    act(() => {
      result.current[1](false);
    });

    // Wait for useEffect to trigger callback
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should ensure only one modal is open at a time', () => {
    const { result: result1 } = renderHook(() => useUrlModal('editUser'), { wrapper });
    const { result: result2 } = renderHook(() => useUrlModal('createUser'), { wrapper });

    // Open first modal
    act(() => {
      result1.current[1](true);
    });

    expect(window.location.search).toBe('?modal=editUser');
    expect(result1.current[0]).toBe(true);
    expect(result2.current[0]).toBe(false);

    // Open second modal - should close first
    act(() => {
      result2.current[1](true);
    });

    expect(window.location.search).toBe('?modal=createUser');
    expect(result1.current[0]).toBe(false);
    expect(result2.current[0]).toBe(true);
  });
});
