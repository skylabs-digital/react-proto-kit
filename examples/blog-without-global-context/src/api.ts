import { createDomainApi } from '../../../src';
import { userSchema, categorySchema, postSchema, commentSchema } from './types';

// Create APIs WITHOUT Global Context - each component manages its own state
export const usersApi = createDomainApi('users', userSchema);

export const categoriesApi = createDomainApi('categories', categorySchema);

export const postsApi = createDomainApi('posts', postSchema);

export const commentsApi = createDomainApi('comments', commentSchema);
