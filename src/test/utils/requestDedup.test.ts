import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dedupeRequest, __clearPendingRequests } from '../../utils/requestDedup';

describe('dedupeRequest', () => {
  beforeEach(() => {
    __clearPendingRequests();
  });

  it('returns the fetcher result on a single call', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok');
    const result = await dedupeRequest('k1', fetcher);
    expect(result).toBe('ok');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('shares the same inflight promise for concurrent callers with the same key', async () => {
    let resolveInner: (value: string) => void = () => {};
    const fetcher = vi.fn().mockImplementation(
      () =>
        new Promise<string>(resolve => {
          resolveInner = resolve;
        })
    );

    const p1 = dedupeRequest('k1', fetcher);
    const p2 = dedupeRequest('k1', fetcher);
    const p3 = dedupeRequest('k1', fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);

    resolveInner('shared');

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    expect(r1).toBe('shared');
    expect(r2).toBe('shared');
    expect(r3).toBe('shared');
  });

  it('does not share inflight promises across different keys', async () => {
    const fetcher = vi.fn().mockImplementation((async () => 'val') as () => Promise<string>);
    await Promise.all([
      dedupeRequest('k1', fetcher),
      dedupeRequest('k2', fetcher),
      dedupeRequest('k3', fetcher),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('clears the inflight slot after the fetcher resolves so a second call re-fetches', async () => {
    const fetcher = vi.fn<[], Promise<number>>().mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    const first = await dedupeRequest('k1', fetcher);
    const second = await dedupeRequest('k1', fetcher);

    expect(first).toBe(1);
    expect(second).toBe(2);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('clears the inflight slot after the fetcher rejects', async () => {
    const fetcher = vi
      .fn<[], Promise<string>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('ok');

    await expect(dedupeRequest('k1', fetcher)).rejects.toThrow('boom');
    const retry = await dedupeRequest('k1', fetcher);
    expect(retry).toBe('ok');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('propagates the rejection to every concurrent caller sharing the inflight promise', async () => {
    let rejectInner: (error: Error) => void = () => {};
    const fetcher = vi.fn().mockImplementation(
      () =>
        new Promise<string>((_, reject) => {
          rejectInner = reject;
        })
    );

    const p1 = dedupeRequest('k1', fetcher);
    const p2 = dedupeRequest('k1', fetcher);

    rejectInner(new Error('shared failure'));

    await expect(p1).rejects.toThrow('shared failure');
    await expect(p2).rejects.toThrow('shared failure');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('__clearPendingRequests wipes inflight state so the next call re-executes', async () => {
    let resolveInner: (value: string) => void = () => {};
    const fetcher = vi.fn().mockImplementation(
      () =>
        new Promise<string>(resolve => {
          resolveInner = resolve;
        })
    );

    const p1 = dedupeRequest('k1', fetcher);
    __clearPendingRequests();
    const p2 = dedupeRequest('k1', fetcher);

    // Two distinct fetcher invocations because we cleared between calls
    expect(fetcher).toHaveBeenCalledTimes(2);

    // Resolve both (the first promise captured a closure we lost; call again)
    resolveInner('A');
    // second promise also needs resolution — re-assign
    // Note: mockImplementation's factory runs on each call, so the second
    // invocation created its own Promise, which the last resolveInner points to.
    await expect(p2).resolves.toBe('A');
    // p1 still dangles but tests run isolated, so we just acknowledge it.
    await expect(
      Promise.race([p1, new Promise(r => setTimeout(() => r('pending'), 10))])
    ).resolves.toBe('pending');
  });
});
