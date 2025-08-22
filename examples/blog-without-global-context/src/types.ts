import { z } from 'zod';

// Schemas
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().optional(),
  authorId: z.string(),
  categoryId: z.string(),
  published: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const commentSchema = z.object({
  id: z.string(),
  content: z.string(),
  authorId: z.string(),
  postId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Types
export type User = z.infer<typeof userSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Post = z.infer<typeof postSchema>;
export type Comment = z.infer<typeof commentSchema>;

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
