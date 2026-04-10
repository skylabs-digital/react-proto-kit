import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { z } from 'zod';
import { createDomainApi } from '../../factory/createDomainApi';
import { createSingleRecordApi } from '../../factory/createSingleRecordApi';
import { ApiClientProvider } from '../../provider/ApiClientProvider';
import { GlobalStateProvider } from '../../context/GlobalStateProvider';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();

const mockConnector = {
  get: mockGet,
  post: mockPost,
  put: mockPut,
  patch: mockPatch,
  delete: mockDelete,
};

const createWrapper =
  () =>
  ({ children }: { children: React.ReactNode }) => (
    <ApiClientProvider connector={mockConnector as any}>
      <GlobalStateProvider>{children}</GlobalStateProvider>
    </ApiClientProvider>
  );

const todoSchema = z.object({ title: z.string() });

describe('createDomainApi withQuery propagation to mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('withQuery propagates params to useCreate', async () => {
    mockPost.mockResolvedValue({ success: true, data: { id: '1', title: 'new' } });
    const api = createDomainApi('todos', todoSchema, todoSchema);

    const { result } = renderHook(
      () => api.withQuery({ status: 'active', tenant: 'acme' }).useCreate(),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.mutate({ title: 'new' });
    });

    expect(mockPost).toHaveBeenCalledWith('todos', expect.objectContaining({ title: 'new' }), {
      status: 'active',
      tenant: 'acme',
    });
  });

  it('withQuery propagates params to useUpdate', async () => {
    mockPut.mockResolvedValue({ success: true, data: { id: '1', title: 'updated' } });
    const api = createDomainApi('todos', todoSchema, todoSchema);

    const { result } = renderHook(() => api.withQuery({ v: '2' }).useUpdate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutate('1', { title: 'updated' });
    });

    expect(mockPut).toHaveBeenCalledWith('todos/1', expect.objectContaining({ title: 'updated' }), {
      v: '2',
    });
  });

  it('withQuery propagates params to usePatch', async () => {
    mockPatch.mockResolvedValue({ success: true, data: { id: '1', title: 'patched' } });
    const api = createDomainApi('todos', todoSchema, todoSchema);

    const { result } = renderHook(() => api.withQuery({ reason: 'test' }).usePatch(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutate('1', { title: 'patched' });
    });

    expect(mockPatch).toHaveBeenCalledWith('todos/1', { title: 'patched' }, { reason: 'test' });
  });

  it('withQuery propagates params to useDelete', async () => {
    mockDelete.mockResolvedValue({ success: true, data: undefined });
    const api = createDomainApi('todos', todoSchema, todoSchema);

    const { result } = renderHook(() => api.withQuery({ cascade: 'true' }).useDelete(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutate('1');
    });

    expect(mockDelete).toHaveBeenCalledWith('todos/1', undefined, { cascade: 'true' });
  });

  it('withQuery propagates params to useList', async () => {
    mockGet.mockResolvedValue({ success: true, data: [] });
    const api = createDomainApi('todos', todoSchema, todoSchema);

    const { result } = renderHook(() => api.withQuery({ status: 'done' }).useList(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // useList merges list params with queryParams before calling get; the
    // important assertion is that `status` reached the connector.
    expect(mockGet).toHaveBeenCalled();
    const callArgs = mockGet.mock.calls[0];
    expect(callArgs[0]).toBe('todos');
    expect(callArgs[1]).toMatchObject({ status: 'done' });
  });

  it('withParams and withQuery chain and both flow to mutations', async () => {
    mockPut.mockResolvedValue({ success: true, data: { id: '42', title: 'edited' } });
    const api = createDomainApi('users/:userId/todos', todoSchema, todoSchema);

    const { result } = renderHook(
      () => api.withParams({ userId: '7' }).withQuery({ audit: 'true' }).useUpdate(),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.mutate('42', { title: 'edited' });
    });

    expect(mockPut).toHaveBeenCalledWith(
      'users/7/todos/42',
      expect.objectContaining({ title: 'edited' }),
      { audit: 'true' }
    );
  });

  it('static queryParams from config merge with withQuery and reach mutations', async () => {
    mockPost.mockResolvedValue({ success: true, data: { id: '1', title: 'a' } });
    const api = createDomainApi('todos', todoSchema, todoSchema, {
      queryParams: { static: { v: '2' }, dynamic: ['status'] },
    });

    const { result } = renderHook(() => api.withQuery({ status: 'active' }).useCreate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutate({ title: 'a' });
    });

    expect(mockPost).toHaveBeenCalledWith('todos', expect.any(Object), {
      v: '2',
      status: 'active',
    });
  });
});

describe('createSingleRecordApi withQuery propagation to mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('withQuery propagates params to useUpdate', async () => {
    mockPut.mockResolvedValue({ success: true, data: { theme: 'dark' } });
    const settingsSchema = z.object({ theme: z.string() });
    const api = createSingleRecordApi('users/:userId/settings', settingsSchema, settingsSchema);

    const { result } = renderHook(
      () => api.withParams({ userId: '1' }).withQuery({ v: '2' }).useUpdate(),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.mutate({ theme: 'dark' });
    });

    expect(mockPut).toHaveBeenCalledWith('users/1/settings', { theme: 'dark' }, { v: '2' });
  });

  it('withQuery propagates params to usePatch', async () => {
    mockPatch.mockResolvedValue({ success: true, data: { theme: 'light' } });
    const settingsSchema = z.object({ theme: z.string() });
    const api = createSingleRecordApi('users/:userId/settings', settingsSchema, settingsSchema);

    const { result } = renderHook(
      () => api.withParams({ userId: '1' }).withQuery({ v: '2' }).usePatch(),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.mutate({ theme: 'light' });
    });

    expect(mockPatch).toHaveBeenCalledWith('users/1/settings', { theme: 'light' }, { v: '2' });
  });
});
