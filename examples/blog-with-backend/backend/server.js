import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3002; // Different port from todo backend

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
let posts = [
  {
    id: uuidv4(),
    title: 'Welcome to Our Blog',
    slug: 'welcome-to-our-blog',
    content: 'This is our first blog post! We\'re excited to share our thoughts and ideas with you.',
    excerpt: 'Welcome to our new blog platform where we share insights and stories.',
    authorId: 'author-1',
    categoryId: 'category-1',
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Getting Started with React',
    slug: 'getting-started-with-react',
    content: 'React is a powerful library for building user interfaces. In this post, we\'ll explore the basics of React development.',
    excerpt: 'Learn the fundamentals of React development in this comprehensive guide.',
    authorId: 'author-1',
    categoryId: 'category-2',
    published: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

let categories = [
  {
    id: 'category-1',
    name: 'General',
    slug: 'general',
    description: 'General blog posts and announcements',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'category-2',
    name: 'Technology',
    slug: 'technology',
    description: 'Posts about technology and programming',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

let users = [
  {
    id: 'author-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://via.placeholder.com/40',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

let comments = [
  {
    id: uuidv4(),
    content: 'Great post! Looking forward to more content.',
    authorId: 'author-1',
    postId: posts[0].id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Helper function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

// Posts endpoints
app.get('/posts', (req, res) => {
  console.log('📖 GET /posts - Fetching all posts');
  res.json(posts);
});

app.get('/posts/:id', (req, res) => {
  console.log(`📖 GET /posts/${req.params.id} - Fetching post`);
  const post = posts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

app.post('/posts', (req, res) => {
  console.log('📖 POST /posts - Creating new post:', req.body);
  const newPost = {
    id: uuidv4(),
    ...req.body,
    slug: req.body.slug || generateSlug(req.body.title),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  posts.push(newPost);
  res.status(201).json(newPost);
});

app.put('/posts/:id', (req, res) => {
  console.log(`📖 PUT /posts/${req.params.id} - Updating post:`, req.body);
  const index = posts.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  posts[index] = {
    ...posts[index],
    ...req.body,
    slug: req.body.slug || generateSlug(req.body.title || posts[index].title),
    updatedAt: new Date().toISOString(),
  };
  res.json(posts[index]);
});

app.delete('/posts/:id', (req, res) => {
  console.log(`📖 DELETE /posts/${req.params.id} - Deleting post`);
  const index = posts.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  posts.splice(index, 1);
  res.status(204).send();
});

// Categories endpoints
app.get('/categories', (req, res) => {
  console.log('📂 GET /categories - Fetching all categories');
  res.json(categories);
});

app.get('/categories/:id', (req, res) => {
  console.log(`📂 GET /categories/${req.params.id} - Fetching category`);
  const category = categories.find(c => c.id === req.params.id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json(category);
});

app.post('/categories', (req, res) => {
  console.log('📂 POST /categories - Creating new category:', req.body);
  const newCategory = {
    id: uuidv4(),
    ...req.body,
    slug: req.body.slug || generateSlug(req.body.name),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  categories.push(newCategory);
  res.status(201).json(newCategory);
});

app.put('/categories/:id', (req, res) => {
  console.log(`📂 PUT /categories/${req.params.id} - Updating category:`, req.body);
  const index = categories.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  categories[index] = {
    ...categories[index],
    ...req.body,
    slug: req.body.slug || generateSlug(req.body.name || categories[index].name),
    updatedAt: new Date().toISOString(),
  };
  res.json(categories[index]);
});

app.delete('/categories/:id', (req, res) => {
  console.log(`📂 DELETE /categories/${req.params.id} - Deleting category`);
  const index = categories.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  categories.splice(index, 1);
  res.status(204).send();
});

// Users endpoints
app.get('/users', (req, res) => {
  console.log('👤 GET /users - Fetching all users');
  res.json(users);
});

app.get('/users/:id', (req, res) => {
  console.log(`👤 GET /users/${req.params.id} - Fetching user`);
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Comments endpoints
app.get('/comments', (req, res) => {
  console.log('💬 GET /comments - Fetching all comments');
  res.json(comments);
});

app.get('/comments/:id', (req, res) => {
  console.log(`💬 GET /comments/${req.params.id} - Fetching comment`);
  const comment = comments.find(c => c.id === req.params.id);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  res.json(comment);
});

app.post('/comments', (req, res) => {
  console.log('💬 POST /comments - Creating new comment:', req.body);
  const newComment = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  comments.push(newComment);
  res.status(201).json(newComment);
});

app.put('/comments/:id', (req, res) => {
  console.log(`💬 PUT /comments/${req.params.id} - Updating comment:`, req.body);
  const index = comments.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  
  comments[index] = {
    ...comments[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  res.json(comments[index]);
});

app.delete('/comments/:id', (req, res) => {
  console.log(`💬 DELETE /comments/${req.params.id} - Deleting comment`);
  const index = comments.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  
  comments.splice(index, 1);
  res.status(204).send();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Blog backend is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Blog backend server running on http://localhost:${PORT}`);
  console.log(`📊 Initial data loaded:`);
  console.log(`   - ${posts.length} posts`);
  console.log(`   - ${categories.length} categories`);
  console.log(`   - ${users.length} users`);
  console.log(`   - ${comments.length} comments`);
});
