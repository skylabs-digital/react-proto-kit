import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useUrlTabs } from '../../navigation/useUrlTabs';
import { useUrlStepper } from '../../navigation/useUrlStepper';

describe('URL hooks rewrite URL to fallback on invalid value', () => {
  let warnSpy: MockInstance<Parameters<Console['warn']>, ReturnType<Console['warn']>>;
  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('useUrlTabs: invalid value → URL rewritten to default', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/?tab=nonexistent']}>{children}</MemoryRouter>
    );

    const { result } = renderHook(
      () => {
        const [tab] = useUrlTabs('tab', ['overview', 'details', 'history'], 'overview');
        const { search } = useLocation();
        return { tab, search };
      },
      { wrapper }
    );

    await waitFor(() => expect(result.current.tab).toBe('overview'));

    // State fell back — now assert URL is in sync.
    expect(result.current.search).not.toContain('nonexistent');
    // Either empty (tab omitted) or explicitly set to default.
    const ok =
      result.current.search === '' ||
      result.current.search === '?' ||
      result.current.search === '?tab=overview';
    expect(ok).toBe(true);
  });

  it('useUrlStepper: invalid value → URL rewritten to default', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/?step=ghost']}>{children}</MemoryRouter>
    );

    const { result } = renderHook(
      () => {
        const [step] = useUrlStepper('step', ['personal', 'address', 'review'], 'personal');
        const { search } = useLocation();
        return { step, search };
      },
      { wrapper }
    );

    await waitFor(() => expect(result.current.step).toBe('personal'));

    expect(result.current.search).not.toContain('ghost');
    const ok =
      result.current.search === '' ||
      result.current.search === '?' ||
      result.current.search === '?step=personal';
    expect(ok).toBe(true);
  });
});
