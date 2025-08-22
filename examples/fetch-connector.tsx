import React from 'react';
import { ApiClientProvider, createEntitySchema, createCrudApi, z } from '../src/index';

// API Schema for external service
const PostSchema = createEntitySchema({
  title: z.string(),
  body: z.string(),
  userId: z.number(),
});

// Create API for external service
const postApi = createCrudApi('posts', PostSchema);

function PostList() {
  const { data: posts, loading, error, refetch } = postApi.useList!({ limit: 5 });
  const createPost = postApi.useCreate!();

  const handleCreate = async () => {
    try {
      await createPost.mutate({
        title: 'My New Post',
        body: 'This is the content of my new post.',
        userId: 1,
      });
      refetch(); // Refresh the list
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  if (loading) return <div>Loading posts...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Posts from External API</h2>
      <button onClick={handleCreate} disabled={createPost.loading}>
        {createPost.loading ? 'Creating...' : 'Create Post'}
      </button>
      <button onClick={refetch} style={{ marginLeft: '10px' }}>
        Refresh
      </button>

      <div style={{ marginTop: '20px' }}>
        {posts?.map(post => (
          <div
            key={post.id}
            style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}
          >
            <h3>{post.title}</h3>
            <p>{post.body}</p>
            <small>User ID: {post.userId}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostDetail({ postId }: { postId: string }) {
  const { data: post, loading, error } = postApi.useById!(postId);
  const updatePost = postApi.useUpdate!(postId);
  const deletePost = postApi.useDelete!(postId);

  const handleUpdate = async () => {
    if (!post) return;

    try {
      await updatePost.mutate({
        title: post.title + ' (Updated)',
        body: post.body + '\n\nThis post has been updated.',
      });
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost.mutate();
      alert('Post deleted successfully!');
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (loading) return <div>Loading post...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <div style={{ border: '2px solid #007bff', padding: '20px', margin: '20px 0' }}>
      <h3>Post Detail</h3>
      <h4>{post.title}</h4>
      <p>{post.body}</p>
      <p>
        <strong>User ID:</strong> {post.userId}
      </p>
      <p>
        <strong>Created:</strong> {new Date(post.createdAt).toLocaleDateString()}
      </p>

      <div style={{ marginTop: '15px' }}>
        <button
          onClick={handleUpdate}
          disabled={updatePost.loading}
          style={{ marginRight: '10px' }}
        >
          {updatePost.loading ? 'Updating...' : 'Update Post'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deletePost.loading}
          style={{ backgroundColor: '#dc3545', color: 'white' }}
        >
          {deletePost.loading ? 'Deleting...' : 'Delete Post'}
        </button>
      </div>
    </div>
  );
}

// Example with real API (JSONPlaceholder)
export function FetchConnectorExample() {
  return (
    <ApiClientProvider
      connectorType="fetch"
      config={{
        baseUrl: 'https://jsonplaceholder.typicode.com',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
        retries: 2,
      }}
    >
      <div>
        <h1>Fetch Connector Example</h1>
        <p>This example connects to JSONPlaceholder API</p>
        <PostList />
        <PostDetail postId="1" />
      </div>
    </ApiClientProvider>
  );
}
