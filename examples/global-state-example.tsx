import React from 'react';
import { z } from 'zod';
import { GlobalStateProvider, createDomainApi } from '../src/index';

// Define schemas
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const bookSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create APIs with global state
const usersApi = createDomainApi('users', userSchema, {
  globalState: true,
  optimistic: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes
});

const booksApi = createDomainApi('books', bookSchema, {
  globalState: true,
  invalidateRelated: ['users'], // Invalidate users when books change
  optimistic: true,
});

// Components
function UsersList() {
  const { data: users, loading } = usersApi.useList!();
  const { mutate: createUser } = usersApi.useCreate!();

  const handleCreateUser = async () => {
    await createUser({
      name: 'John Doe',
      email: 'john@example.com',
    });
    // Automatically updates all components using users
  };

  return (
    <div>
      <h2>Users ({users?.length || 0})</h2>
      {loading && <p>Loading...</p>}
      <ul>
        {users?.map(user => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
      <button onClick={handleCreateUser}>Add User</button>
    </div>
  );
}

function UserProfile({ userId }: { userId: string }) {
  const { data: user } = usersApi.useById!(userId);
  const { mutate: updateUser } = usersApi.useUpdate!(userId);

  const handleUpdate = async () => {
    await updateUser({ name: 'Updated Name' });
    // Automatically syncs with UsersList and other components
  };

  return (
    <div>
      <h3>Profile: {user?.name}</h3>
      <p>Email: {user?.email}</p>
      <button onClick={handleUpdate}>Update Name</button>
    </div>
  );
}

function BooksList() {
  const { data: books } = booksApi.useList!();
  const { mutate: createBook } = booksApi.useCreate!();

  const handleCreateBook = async () => {
    await createBook({
      title: 'New Book',
      author: 'Author Name',
      userId: 'user-1',
    });
    // Automatically invalidates users due to invalidateRelated config
  };

  return (
    <div>
      <h2>Books ({books?.length || 0})</h2>
      <ul>
        {books?.map(book => (
          <li key={book.id}>
            {book.title} by {book.author}
          </li>
        ))}
      </ul>
      <button onClick={handleCreateBook}>Add Book</button>
    </div>
  );
}

function UserCount() {
  const { data: users } = usersApi.useList!();

  return (
    <div>
      <strong>Total Users: {users?.length || 0}</strong>
      {/* Automatically updates when users are created/deleted */}
    </div>
  );
}

// Main App with GlobalStateProvider
export function GlobalStateExample() {
  return (
    <GlobalStateProvider>
      <div style={{ padding: '20px' }}>
        <h1>Global State Example</h1>
        <p>All components share state automatically!</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <UsersList />
            <UserCount />
          </div>

          <div>
            <UserProfile userId="user-1" />
            <BooksList />
          </div>
        </div>
      </div>
    </GlobalStateProvider>
  );
}

export default GlobalStateExample;
