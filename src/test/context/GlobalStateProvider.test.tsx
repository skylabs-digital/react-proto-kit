import { renderHook, act } from '@testing-library/react';
import { GlobalStateProvider, useEntityState } from '../../context/GlobalStateProvider';
import React from 'react';

describe('GlobalStateProvider', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GlobalStateProvider>{children}</GlobalStateProvider>
  );

  it('should provide entity state context', () => {
    const { result } = renderHook(() => useEntityState('users'), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current!.data).toEqual({});
    expect(result.current!.lists).toEqual({});
    expect(result.current!.loading).toEqual({});
    expect(result.current!.errors).toEqual({});
    expect(result.current!.actions).toBeDefined();
  });

  it('should handle state updates', () => {
    const { result } = renderHook(() => useEntityState('users'), { wrapper });

    act(() => {
      result.current!.actions.setData('user-1', { id: 'user-1', name: 'John' });
    });

    expect(result.current!.data['user-1']).toEqual({
      id: 'user-1',
      name: 'John',
    });
  });
});
