import React from 'react';
import { z } from 'zod';
import { ApiClientProvider } from '../provider/ApiClientProvider';
import { createDomainApi } from '../factory/createDomainApi';
import { createDevSeedConfig } from '../helpers/seedHelpers';

// Simple test schema
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Test seed data
const testSeedData = {
  users: [
    {
      id: '1',
      name: 'Test User 1',
      email: 'test1@example.com',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Test User 2',
      email: 'test2@example.com',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ],
};

// Test component
const TestContent: React.FC = () => {
  const userApi = createDomainApi({
    entity: 'users',
    schema: UserSchema,
  });

  const { data: users, loading, error } = userApi.useList!();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Seed Test Results</h2>
      <p>Found {users?.length || 0} users from seed data:</p>
      <ul>
        {users?.map(user => (
          <li key={user.id}>
            {user.name} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  );
};

// Main test component
export const SimpleSeedTest: React.FC = () => {
  const config = {
    seed: createDevSeedConfig(testSeedData),
  };

  return (
    <ApiClientProvider connectorType="localStorage" config={config}>
      <TestContent />
    </ApiClientProvider>
  );
};

export default SimpleSeedTest;
