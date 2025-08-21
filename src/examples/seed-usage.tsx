import React from 'react';
import { z } from 'zod';
import { ApiClientProvider } from '../provider/ApiClientProvider';
import { createDomainApi } from '../factory/createDomainApi';

// Example schemas
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  category: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Seed data
const seedData = {
  users: [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ],
  products: [
    {
      id: '1',
      name: 'Laptop',
      price: 999.99,
      category: 'Electronics',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Coffee Mug',
      price: 15.99,
      category: 'Kitchen',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ],
};

// Example 1: LocalStorage with seed initialization
export const LocalStorageWithSeedExample: React.FC = () => {
  const config = {
    seed: {
      data: seedData,
      behavior: {
        initializeEmpty: true,
        mergeStrategy: 'replace' as const,
      },
    },
  };

  return (
    <ApiClientProvider connectorType="localStorage" config={config}>
      <LocalStorageContent />
    </ApiClientProvider>
  );
};

const LocalStorageContent: React.FC = () => {
  const userApi = createDomainApi({
    entity: 'users',
    schema: UserSchema,
  });

  const { data: users, loading } = userApi.useList!();

  return (
    <div>
      <h2>LocalStorage with Seed Data</h2>
      <p>This example initializes localStorage with seed data on first load.</p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {users?.map(user => (
            <li key={user.id}>
              {user.name} - {user.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Example 2: Fetch connector with 204 response handling
export const FetchWith204SeedExample: React.FC = () => {
  const config = {
    baseUrl: 'https://api.example.com',
    seed: {
      data: seedData,
      behavior: {
        useOnNoContent: true,
      },
    },
  };

  return (
    <ApiClientProvider connectorType="fetch" config={config}>
      <FetchContent />
    </ApiClientProvider>
  );
};

const FetchContent: React.FC = () => {
  const productApi = createDomainApi({
    entity: 'products',
    schema: ProductSchema,
  });

  const { data: products, loading } = productApi.useList!();

  return (
    <div>
      <h2>Fetch with 204 Seed Fallback</h2>
      <p>This example uses seed data when the API returns 204 No Content.</p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {products?.map(product => (
            <li key={product.id}>
              {product.name} - ${product.price} ({product.category})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Example 3: Different merge strategies
export const MergeStrategiesExample: React.FC = () => {
  // Replace strategy - completely replaces existing data
  const replaceConfig = {
    seed: {
      data: { users: [{ id: '999', name: 'Seed User', email: 'seed@example.com' }] },
      behavior: {
        initializeEmpty: true,
        mergeStrategy: 'replace' as const,
      },
    },
  };

  // Append strategy - adds seed data to existing data
  const appendConfig = {
    seed: {
      data: { users: [{ id: '888', name: 'Additional User', email: 'additional@example.com' }] },
      behavior: {
        initializeEmpty: true,
        mergeStrategy: 'append' as const,
      },
    },
  };

  // Merge strategy - only adds seed data if collection is empty
  const mergeConfig = {
    seed: {
      data: seedData,
      behavior: {
        initializeEmpty: true,
        mergeStrategy: 'merge' as const,
      },
    },
  };

  return (
    <div>
      <h2>Merge Strategy Examples</h2>
      <p>Different ways to handle seed data when existing data is present.</p>

      <div style={{ display: 'flex', gap: '20px' }}>
        <ApiClientProvider connectorType="localStorage" config={replaceConfig}>
          <div>
            <h3>Replace Strategy</h3>
            <p>Replaces all existing data</p>
          </div>
        </ApiClientProvider>

        <ApiClientProvider connectorType="localStorage" config={appendConfig}>
          <div>
            <h3>Append Strategy</h3>
            <p>Adds seed data to existing</p>
          </div>
        </ApiClientProvider>

        <ApiClientProvider connectorType="localStorage" config={mergeConfig}>
          <div>
            <h3>Merge Strategy</h3>
            <p>Only seeds empty collections</p>
          </div>
        </ApiClientProvider>
      </div>
    </div>
  );
};

// Example 4: Development vs Production configuration
export const EnvironmentConfigExample: React.FC = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const config = {
    baseUrl: isDevelopment ? 'http://localhost:3000' : 'https://api.production.com',
    ...(isDevelopment && {
      // Only use seed data in development
      seed: {
        data: seedData,
        behavior: {
          useOnNoContent: true,
          initializeEmpty: true,
          mergeStrategy: 'replace' as const,
        },
      },
    }),
  };

  const connectorType = isDevelopment ? 'localStorage' : 'fetch';

  return (
    <ApiClientProvider connectorType={connectorType} config={config}>
      <div>
        <h2>Environment-based Configuration</h2>
        <p>
          {isDevelopment
            ? 'Development: Using localStorage with seed data'
            : 'Production: Using fetch without seed data'}
        </p>
      </div>
    </ApiClientProvider>
  );
};

// Example 5: Conditional seed usage
export const ConditionalSeedExample: React.FC<{ useSeed: boolean }> = ({ useSeed }) => {
  const config = {
    baseUrl: 'https://api.example.com',
    ...(useSeed && {
      seed: {
        data: seedData,
        behavior: {
          useOnNoContent: true,
        },
      },
    }),
  };

  return (
    <ApiClientProvider connectorType="fetch" config={config}>
      <ConditionalSeedContent useSeed={useSeed} />
    </ApiClientProvider>
  );
};

const ConditionalSeedContent: React.FC<{ useSeed: boolean }> = ({ useSeed }) => {
  const userApi = createDomainApi({
    entity: 'users',
    schema: UserSchema,
  });

  const { data: users, loading, error } = userApi.useList!();

  return (
    <div>
      <h2>Conditional Seed Usage</h2>
      <p>Seed data is {useSeed ? 'enabled' : 'disabled'}</p>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {users && (
        <ul>
          {users.map(user => (
            <li key={user.id}>
              {user.name} - {user.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
