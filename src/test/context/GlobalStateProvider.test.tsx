import { render, act, renderHook } from '@testing-library/react';
import {
  GlobalStateProvider,
  useGlobalState,
  useEntityState,
} from '../../context/GlobalStateProvider';

describe('GlobalStateProvider', () => {
  it('should provide global state context', () => {
    const TestComponent = () => {
      const { state } = useGlobalState();
      return <div data-testid="state">{JSON.stringify(state)}</div>;
    };

    const { getByTestId } = render(
      <GlobalStateProvider>
        <TestComponent />
      </GlobalStateProvider>
    );

    const stateElement = getByTestId('state');
    expect(JSON.parse(stateElement.textContent || '{}')).toEqual({ entities: {} });
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useGlobalState());
    }).toThrow('useGlobalState must be used within a GlobalStateProvider');

    consoleSpy.mockRestore();
  });

  it('should handle SET_ENTITY_DATA action', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalStateProvider>{children}</GlobalStateProvider>
    );

    const { result } = renderHook(() => useGlobalState(), { wrapper });

    act(() => {
      result.current.dispatch({
        type: 'SET_ENTITY_DATA',
        entity: 'users',
        id: 'user-1',
        data: { id: 'user-1', name: 'John' },
      });
    });

    expect(result.current.state.entities.users?.data['user-1']).toEqual({
      id: 'user-1',
      name: 'John',
    });
  });

  it('should handle SET_ENTITY_LIST action', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalStateProvider>{children}</GlobalStateProvider>
    );

    const { result } = renderHook(() => useGlobalState(), { wrapper });

    act(() => {
      result.current.dispatch({
        type: 'SET_ENTITY_LIST',
        entity: 'users',
        key: 'all',
        data: [{ id: 'user-1', name: 'John' }],
      });
    });

    expect(result.current.state.entities.users?.lists['all']).toEqual([
      { id: 'user-1', name: 'John' },
    ]);
  });

  it('should handle optimistic updates', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalStateProvider>{children}</GlobalStateProvider>
    );

    const { result } = renderHook(() => useGlobalState(), { wrapper });

    act(() => {
      result.current.dispatch({
        type: 'OPTIMISTIC_UPDATE',
        entity: 'users',
        id: 'user-1',
        data: { name: 'John' },
        tempId: 'temp-123',
      });
    });

    expect(result.current.state.entities.users?.data['temp-123']).toEqual({
      name: 'John',
      _optimistic: true,
      _tempId: 'temp-123',
    });
  });

  it('should rollback optimistic updates', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalStateProvider>{children}</GlobalStateProvider>
    );

    const { result } = renderHook(() => useGlobalState(), { wrapper });

    // Add optimistic update
    act(() => {
      result.current.dispatch({
        type: 'OPTIMISTIC_UPDATE',
        entity: 'users',
        id: 'user-1',
        data: { name: 'John' },
        tempId: 'temp-123',
      });
    });

    // Rollback
    act(() => {
      result.current.dispatch({
        type: 'ROLLBACK_OPTIMISTIC',
        entity: 'users',
        tempId: 'temp-123',
      });
    });

    expect(result.current.state.entities.users?.data['temp-123']).toBeUndefined();
  });

  it('should confirm optimistic updates', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalStateProvider>{children}</GlobalStateProvider>
    );

    const { result } = renderHook(() => useGlobalState(), { wrapper });

    // Add optimistic update
    act(() => {
      result.current.dispatch({
        type: 'OPTIMISTIC_UPDATE',
        entity: 'users',
        id: 'user-1',
        data: { name: 'John' },
        tempId: 'temp-123',
      });
    });

    // Confirm with real data
    act(() => {
      result.current.dispatch({
        type: 'CONFIRM_OPTIMISTIC',
        entity: 'users',
        tempId: 'temp-123',
        realData: { id: 'user-1', name: 'John Doe' },
      });
    });

    expect(result.current.state.entities.users?.data['temp-123']).toBeUndefined();
    expect(result.current.state.entities.users?.data['user-1']).toEqual({
      id: 'user-1',
      name: 'John Doe',
    });
  });
});

describe('useEntityState', () => {
  it('should provide entity-specific state and actions', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalStateProvider>{children}</GlobalStateProvider>
    );

    const { result } = renderHook(() => useEntityState('users'), { wrapper });

    expect(result.current.data).toEqual({});
    expect(result.current.lists).toEqual({});
    expect(result.current.loading).toEqual({});
    expect(result.current.errors).toEqual({});
    expect(result.current.actions).toBeDefined();
  });

  it('should provide entity actions', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlobalStateProvider>{children}</GlobalStateProvider>
    );

    const { result } = renderHook(() => useEntityState('users'), { wrapper });

    act(() => {
      result.current.actions.setData('user-1', { id: 'user-1', name: 'John' });
    });

    expect(result.current.data['user-1']).toEqual({
      id: 'user-1',
      name: 'John',
    });
  });
});
