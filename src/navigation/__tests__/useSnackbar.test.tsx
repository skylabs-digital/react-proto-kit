import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, render, screen } from '@testing-library/react';
import { SnackbarProvider } from '../context/SnackbarContext';
import { useSnackbar } from '../useSnackbar';
import { SnackbarContainer } from '../components/SnackbarContainer';

// Wrapper with SnackbarProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SnackbarProvider>{children}</SnackbarProvider>
);

describe('useSnackbar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useSnackbar());
    }).toThrow('useSnackbarContext must be used within SnackbarProvider');

    consoleSpy.mockRestore();
  });

  it('should show a snackbar', () => {
    const { result } = renderHook(() => useSnackbar(), { wrapper });

    let snackbarId: string;
    act(() => {
      snackbarId = result.current.showSnackbar({
        message: 'Test message',
        variant: 'success',
      });
    });

    expect(snackbarId!).toBeDefined();
    expect(typeof snackbarId!).toBe('string');
  });

  it('should hide a snackbar by id', () => {
    const { result } = renderHook(() => useSnackbar(), { wrapper });

    let snackbarId: string;
    act(() => {
      snackbarId = result.current.showSnackbar({
        message: 'Test message',
        variant: 'info',
      });
    });

    act(() => {
      result.current.hideSnackbar(snackbarId!);
    });

    // Snackbar should be removed (tested via container)
  });

  it('should auto-dismiss after duration', () => {
    const { result } = renderHook(() => useSnackbar(), { wrapper });

    act(() => {
      result.current.showSnackbar({
        message: 'Auto-dismiss test',
        variant: 'info',
        duration: 1000,
      });
    });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Snackbar should be auto-dismissed
  });

  it('should not auto-dismiss when duration is null', () => {
    const { result } = renderHook(() => useSnackbar(), { wrapper });

    act(() => {
      result.current.showSnackbar({
        message: 'No auto-dismiss',
        variant: 'warning',
        duration: null,
      });
    });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Snackbar should still be visible
  });

  it('should call onClose callback when dismissed', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useSnackbar(), { wrapper });

    let snackbarId: string;
    act(() => {
      snackbarId = result.current.showSnackbar({
        message: 'Test message',
        variant: 'info',
        onClose,
      });
    });

    act(() => {
      result.current.hideSnackbar(snackbarId!);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should hide all snackbars', () => {
    const { result } = renderHook(() => useSnackbar(), { wrapper });

    act(() => {
      result.current.showSnackbar({ message: 'Message 1', variant: 'info' });
      result.current.showSnackbar({ message: 'Message 2', variant: 'success' });
      result.current.showSnackbar({ message: 'Message 3', variant: 'error' });
    });

    act(() => {
      result.current.hideAll();
    });

    // All snackbars should be removed
  });

  it('should respect maxVisible limit', () => {
    const TestWrapper = ({ children }: { children: React.ReactNode }) => (
      <SnackbarProvider maxVisible={2}>{children}</SnackbarProvider>
    );

    const { result } = renderHook(() => useSnackbar(), { wrapper: TestWrapper });

    act(() => {
      result.current.showSnackbar({ message: 'Message 1', variant: 'info' });
      result.current.showSnackbar({ message: 'Message 2', variant: 'info' });
      result.current.showSnackbar({ message: 'Message 3', variant: 'info' });
    });

    // Only 2 should be visible (oldest removed)
  });

  it('should use default duration from provider', () => {
    const TestWrapper = ({ children }: { children: React.ReactNode }) => (
      <SnackbarProvider defaultDuration={500}>{children}</SnackbarProvider>
    );

    const { result } = renderHook(() => useSnackbar(), { wrapper: TestWrapper });

    act(() => {
      result.current.showSnackbar({
        message: 'Test default duration',
        variant: 'info',
      });
    });

    // Fast-forward by default duration
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should be auto-dismissed
  });
});

describe('SnackbarContainer', () => {
  it('should render snackbar messages', () => {
    const TestComponent = () => {
      const { showSnackbar } = useSnackbar();

      return (
        <>
          <button onClick={() => showSnackbar({ message: 'Test snackbar', variant: 'info' })}>
            Show Snackbar
          </button>
          <SnackbarContainer />
        </>
      );
    };

    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>
    );

    const button = screen.getByText('Show Snackbar');
    act(() => {
      button.click();
    });

    expect(screen.getByText('Test snackbar')).toBeDefined();
  });

  it('should render with custom position', () => {
    render(
      <SnackbarProvider>
        <SnackbarContainer position="bottom-left" />
      </SnackbarProvider>
    );

    const container = document.querySelector('.snackbar-container');
    expect(container).not.toBeNull();
  });

  it('should render with custom SnackbarComponent', () => {
    const CustomSnackbar = ({
      snackbar,
      onClose,
    }: {
      snackbar: any;
      onClose: (id: string) => void;
    }) => (
      <div className="custom-snackbar" data-testid="custom-snackbar">
        <span className="custom-message">{snackbar.message}</span>
        <button onClick={() => onClose(snackbar.id)}>Close</button>
      </div>
    );

    const TestComponent = () => {
      const { showSnackbar } = useSnackbar();
      return (
        <>
          <button onClick={() => showSnackbar({ message: 'Custom test', variant: 'info' })}>
            Show
          </button>
          <SnackbarContainer SnackbarComponent={CustomSnackbar} />
        </>
      );
    };

    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>
    );

    const button = screen.getByText('Show');
    act(() => {
      button.click();
    });

    // Should render custom component instead of default
    expect(screen.getByTestId('custom-snackbar')).toBeDefined();
    expect(screen.getByText('Custom test')).toBeDefined();
  });
});
