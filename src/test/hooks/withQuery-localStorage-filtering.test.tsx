import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { z } from 'zod';
import { createDomainApi } from '../../factory/createDomainApi';
import { ApiClientProvider } from '../../provider/ApiClientProvider';
import { GlobalStateProvider } from '../../context/GlobalStateProvider';
import { installInMemoryLocalStorage } from '../utils/localStoragePolyfill';

const todoSchema = z.object({
  title: z.string(),
  status: z.enum(['pending', 'done']),
});

const todosApi = createDomainApi('todos', todoSchema, todoSchema);

const seed = {
  data: {
    todos: [
      { id: 't1', title: 'Buy milk', status: 'pending' },
      { id: 't2', title: 'Write tests', status: 'done' },
      { id: 't3', title: 'Ship v2', status: 'pending' },
    ],
  },
  behavior: {
    initializeEmpty: true,
    mergeStrategy: 'replace' as const,
  },
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ApiClientProvider connectorType="localStorage" config={{ seed }}>
      <GlobalStateProvider>{children}</GlobalStateProvider>
    </ApiClientProvider>
  );
}

describe('withQuery() against LocalStorageConnector', () => {
  let uninstall: () => void;

  beforeEach(() => {
    uninstall = installInMemoryLocalStorage();
    window.localStorage.clear();
  });

  afterEach(() => {
    uninstall();
  });

  it('filters the list to only matching records when using withQuery', async () => {
    const { result } = renderHook(() => todosApi.withQuery({ status: 'done' }).useList(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const items = result.current.data ?? [];
    // The scoped query asks for status=done — only 1 seed record matches.
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('t2');
    expect(items[0]?.status).toBe('done');
  });
});
