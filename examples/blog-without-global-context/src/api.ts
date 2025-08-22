import { createDomainApi, z, ExtractEntityType, ExtractInputType } from '../../../src';

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

// Create APIs WITHOUT Global Context - each component manages its own state
export const usersApi = createDomainApi('users', userSchema);
export const categoriesApi = createDomainApi('categories', categorySchema);
export const postsApi = createDomainApi('posts', postSchema);
export const commentsApi = createDomainApi('comments', commentSchema);

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
