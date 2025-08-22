import { createDomainApi } from '../../../src';
import { userSchema, categorySchema, postSchema, commentSchema } from './types';

// Create APIs with Global Context and intelligent invalidation
export const usersApi = createDomainApi('users', userSchema, {
  globalState: true,
  optimistic: true,
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

export const categoriesApi = createDomainApi('categories', categorySchema, {
  globalState: true,
  optimistic: true,
  cacheTime: 15 * 60 * 1000, // 15 minutes (categories change less frequently)
});

export const postsApi = createDomainApi('posts', postSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['comments'], // When posts change, invalidate comments
  cacheTime: 5 * 60 * 1000, // 5 minutes
});

export const commentsApi = createDomainApi('comments', commentSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['posts'], // When comments change, invalidate posts (for comment counts)
  cacheTime: 3 * 60 * 1000, // 3 minutes (comments are more dynamic)
});
