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
});
