import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, useSearchParams } from 'react-router-dom';
import { withDataOrchestrator } from '../withDataOrchestrator';

// Mock hook factory
const createMockHook = (data: any, loading = false) => {
  return vi.fn(() => ({
    data,
    loading,
    error: null,
    refetch: vi.fn(),
  }));
};

describe('withDataOrchestrator - watchSearchParams', () => {
  it('should reset orchestrator when watched search params change', async () => {
    // Track how many times hook is called
    let callCount = 0;
    const mockHook = vi.fn(() => {
      callCount++;
      return {
        data: [`data-${callCount}`],
        loading: false,
        error: null,
        refetch: vi.fn(),
      };
    });

    interface TestData {
      items: string[];
    }

    function TestComponent({ items }: TestData & { orchestrator: any }) {
      return <div data-testid="items">{items.join(',')}</div>;
    }

    function TestWrapper() {
      const [searchParams, setSearchParams] = useSearchParams();
      const status = searchParams.get('status') || 'default';

      const WrappedComponent = withDataOrchestrator<TestData>(TestComponent, {
        hooks: {
          items: mockHook,
        },
        options: {
          watchSearchParams: ['status'],
        },
      });

      return (
        <div>
          <button onClick={() => setSearchParams({ status: 'active' })}>Change Status</button>
          <div data-testid="status">{status}</div>
          <WrappedComponent />
        </div>
      );
    }

    render(
      <BrowserRouter>
        <TestWrapper />
      </BrowserRouter>
    );

    // Initial render
    await waitFor(() => {
      const itemsEl = screen.getByTestId('items');
      expect(itemsEl.textContent).toBe('data-1');
    });
    expect(callCount).toBe(1);

    // Change search param
    screen.getByText('Change Status').click();

    await waitFor(() => {
      const statusEl = screen.getByTestId('status');
      expect(statusEl.textContent).toBe('active');
    });

    // Hook should be called again due to reset
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(1);
    });
  });

  it('should combine watchSearchParams with existing resetKey', async () => {
    const mockHook = createMockHook(['test-data']);

    interface TestData {
      items: string[];
    }

    function TestComponent({ items }: TestData & { orchestrator: any }) {
      return <div>{items.join(',')}</div>;
    }

    function TestWrapper() {
      const WrappedComponent = withDataOrchestrator<TestData>(TestComponent, {
        hooks: {
          items: mockHook,
        },
        options: {
          resetKey: 'manual-key',
          watchSearchParams: ['filter'],
        },
      });

      return <WrappedComponent />;
    }

    render(
      <MemoryRouter initialEntries={['/?filter=test']}>
        <TestWrapper />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockHook).toHaveBeenCalled();
    });
  });

  it('should not reset when non-watched params change', async () => {
    const mockHook = vi.fn(() => ({
      data: ['test-data'],
      loading: false,
      error: null,
      refetch: vi.fn(),
    }));

    interface TestData {
      items: string[];
    }

    function TestComponent({ items, orchestrator }: TestData & { orchestrator: any }) {
      return (
        <div>
          <div data-testid="items">{items.join(',')}</div>
          <div data-testid="is-loading">{orchestrator.isLoading ? 'loading' : 'not-loading'}</div>
        </div>
      );
    }

    function TestWrapper() {
      const [, setSearchParams] = useSearchParams();

      const WrappedComponent = withDataOrchestrator<TestData>(TestComponent, {
        hooks: {
          items: mockHook,
        },
        options: {
          watchSearchParams: ['status'], // Only watching 'status'
        },
      });

      return (
        <div>
          <button onClick={() => setSearchParams({ other: 'value' })}>Change Other</button>
          <WrappedComponent />
        </div>
      );
    }

    render(
      <BrowserRouter>
        <TestWrapper />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      const itemsEl = screen.getByTestId('items');
      expect(itemsEl.textContent).toBe('test-data');
    });

    // Verify not loading initially
    expect(screen.getByTestId('is-loading').textContent).toBe('not-loading');

    // Change non-watched param
    screen.getByText('Change Other').click();

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should still NOT be loading (no reset happened)
    expect(screen.getByTestId('is-loading').textContent).toBe('not-loading');
  });

  it('should work without watchSearchParams option', async () => {
    const mockHook = createMockHook(['test-data']);

    interface TestData {
      items: string[];
    }

    function TestComponent({ items }: TestData & { orchestrator: any }) {
      return <div data-testid="items">{items.join(',')}</div>;
    }

    const WrappedComponent = withDataOrchestrator<TestData>(TestComponent, {
      hooks: {
        items: mockHook,
      },
      // No options at all
    });

    render(
      <BrowserRouter>
        <WrappedComponent />
      </BrowserRouter>
    );

    await waitFor(() => {
      const itemsEl = screen.getByTestId('items');
      expect(itemsEl.textContent).toBe('test-data');
    });
    expect(mockHook).toHaveBeenCalled();
  });
});
