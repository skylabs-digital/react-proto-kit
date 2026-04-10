import { InvalidationManager } from '../../context/InvalidationManager';

describe('InvalidationManager', () => {
  let manager: InvalidationManager;

  beforeEach(() => {
    manager = new InvalidationManager();
  });

  it('should add invalidation rules', () => {
    const rule = {
      entity: 'users',
      invalidates: ['books', 'posts'],
    };

    manager.addRule(rule);

    const targets = manager.getInvalidationTargets('users');
    expect(targets).toEqual(['users', 'books', 'posts']);
  });

  it('should return only entity if no rule exists', () => {
    const targets = manager.getInvalidationTargets('nonexistent');
    expect(targets).toEqual(['nonexistent']);
  });

  it('should notify subscribers when entity is invalidated', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const unsubscribe1 = manager.subscribe('users', callback1);
    manager.subscribe('posts', callback2);

    manager.addRule({
      entity: 'users',
      invalidates: ['posts'],
    });

    manager.invalidate('users');

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);

    // Unsubscribe one callback
    unsubscribe1();
    manager.invalidate('users');

    expect(callback1).toHaveBeenCalledTimes(1); // Still 1
    expect(callback2).toHaveBeenCalledTimes(2); // Called again
  });

  it('should invalidate related entities', () => {
    const usersCallback = vi.fn();
    const booksCallback = vi.fn();
    const postsCallback = vi.fn();

    manager.subscribe('users', usersCallback);
    manager.subscribe('books', booksCallback);
    manager.subscribe('posts', postsCallback);

    manager.addRule({
      entity: 'users',
      invalidates: ['books'],
    });

    const invalidated = manager.invalidate('users');

    expect(invalidated).toEqual(['users', 'books']);
    expect(usersCallback).toHaveBeenCalledTimes(1);
    expect(booksCallback).toHaveBeenCalledTimes(1);
    expect(postsCallback).toHaveBeenCalledTimes(0); // Not related
  });

  it('should handle conditional invalidation', () => {
    const callback = vi.fn();
    manager.subscribe('users', callback);

    manager.addRule({
      entity: 'users',
      invalidates: ['books'],
      condition: data => data?.shouldInvalidate === true,
    });

    // Should not invalidate
    manager.invalidate('users', { shouldInvalidate: false });
    expect(callback).toHaveBeenCalledTimes(0);

    // Should invalidate
    manager.invalidate('users', { shouldInvalidate: true });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple subscribers for same entity', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    manager.subscribe('users', callback1);
    manager.subscribe('users', callback2);
    manager.subscribe('books', callback3);

    manager.addRule({
      entity: 'users',
      invalidates: [],
    });

    manager.invalidate('users');

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(0);
  });

  it('should clean up subscriptions properly', () => {
    const callback = vi.fn();
    const unsubscribe = manager.subscribe('users', callback);

    manager.addRule({
      entity: 'users',
      invalidates: [],
    });

    manager.invalidate('users');
    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();
    manager.invalidate('users');
    expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
  });

  it('should handle empty invalidates array', () => {
    const callback = vi.fn();
    manager.subscribe('users', callback);

    manager.addRule({
      entity: 'users',
      invalidates: [],
    });

    const invalidated = manager.invalidate('users');

    expect(invalidated).toEqual(['users']);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('returns an empty list when a condition blocks invalidation of related entities', () => {
    const usersCb = vi.fn();
    const booksCb = vi.fn();

    manager.subscribe('users', usersCb);
    manager.subscribe('books', booksCb);

    manager.addRule({
      entity: 'users',
      invalidates: ['books'],
      condition: data => data?.shouldInvalidate === true,
    });

    const result = manager.invalidate('users', { shouldInvalidate: false });

    expect(result).toEqual([]);
    expect(usersCb).not.toHaveBeenCalled();
    expect(booksCb).not.toHaveBeenCalled();
  });

  it('invalidate with no rule still notifies direct subscribers of the entity', () => {
    const cb = vi.fn();
    manager.subscribe('standalone', cb);

    const result = manager.invalidate('standalone');

    expect(result).toEqual(['standalone']);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  describe('invalidateAll', () => {
    it('notifies every subscribed entity regardless of rules', () => {
      const usersCb = vi.fn();
      const booksCb = vi.fn();
      const postsCb = vi.fn();

      manager.subscribe('users', usersCb);
      manager.subscribe('books', booksCb);
      manager.subscribe('posts', postsCb);

      const result = manager.invalidateAll();

      expect(result).toEqual(expect.arrayContaining(['users', 'books', 'posts']));
      expect(result).toHaveLength(3);
      expect(usersCb).toHaveBeenCalledTimes(1);
      expect(booksCb).toHaveBeenCalledTimes(1);
      expect(postsCb).toHaveBeenCalledTimes(1);
    });

    it('returns an empty list when there are no subscribers', () => {
      const result = manager.invalidateAll();
      expect(result).toEqual([]);
    });

    it('skips unsubscribed callbacks', () => {
      const cb = vi.fn();
      const unsubscribe = manager.subscribe('users', cb);
      unsubscribe();

      manager.invalidateAll();
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('allows re-adding a rule for an existing entity (overwrite)', () => {
      manager.addRule({ entity: 'users', invalidates: ['books'] });
      manager.addRule({ entity: 'users', invalidates: ['posts'] });

      const targets = manager.getInvalidationTargets('users');
      expect(targets).toEqual(['users', 'posts']);
    });

    it('passes the invalidate data through to the rule condition unchanged', () => {
      const condition = vi.fn((data: any) => data?.flag === true);
      manager.addRule({
        entity: 'users',
        invalidates: [],
        condition,
      });

      const payload = { flag: true, extra: 'preserved' };
      manager.invalidate('users', payload);

      expect(condition).toHaveBeenCalledWith(payload);
    });

    it('does not throw when invalidating an entity with no subscribers and no rule', () => {
      expect(() => manager.invalidate('ghost')).not.toThrow();
    });
  });
});
