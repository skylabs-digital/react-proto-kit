import {
  createDomainApi,
  configureDebugLogging,
  ExtractEntityType,
  ExtractInputType,
  z,
} from '../../../src';

// Business Schemas (without id, createdAt, updatedAt - these are added by the library)
export const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
});

export const postSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().optional(),
  authorId: z.string(),
  categoryId: z.string(),
  published: z.boolean(),
});

export const commentSchema = z.object({
  content: z.string(),
  authorId: z.string(),
  postId: z.string(),
});

// Enable debug logging for backend communication
configureDebugLogging(true, '[BLOG-BACKEND]');

// Create APIs with FetchConnector
export const usersApi = createDomainApi('users', userSchema, {
  optimistic: true,
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

export const categoriesApi = createDomainApi('categories', categorySchema, {
  optimistic: true,
  cacheTime: 15 * 60 * 1000, // 15 minutes (categories change less frequently)
});

export const postsApi = createDomainApi('posts', postSchema, {
  optimistic: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes
});

export const commentsApi = createDomainApi('comments', commentSchema, {
  optimistic: true,
  cacheTime: 3 * 60 * 1000, // 3 minutes (comments are more dynamic)
});

// Types - using library helpers to extract complete entity types
export type User = ExtractEntityType<typeof usersApi>;
export type Category = ExtractEntityType<typeof categoriesApi>;
export type Post = ExtractEntityType<typeof postsApi>;
export type Comment = ExtractEntityType<typeof commentsApi>;

// Input types for creation (without id, createdAt, updatedAt)
export type UserInput = ExtractInputType<typeof usersApi>;
export type CategoryInput = ExtractInputType<typeof categoriesApi>;
export type PostInput = ExtractInputType<typeof postsApi>;
export type CommentInput = ExtractInputType<typeof commentsApi>;

// Extended types with relations
export type PostWithRelations = Post & {
  author?: User;
  category?: Category;
  comments?: Comment[];
  commentCount?: number;
};

export type CommentWithAuthor = Comment & {
  author?: User;
};
