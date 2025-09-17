import React from 'react';
import {
  ApiClientProvider,
  createEntitySchema,
  createDomainApi,
  createReadOnlyApi,
  z,
} from '../src/index';

// Entity schemas (with id, createdAt, updatedAt)
const UserEntitySchema = createEntitySchema({
  name: z.string(),
  email: z.email(),
  role: z.enum(['admin', 'user']),
});

const OrderEntitySchema = createEntitySchema({
  userId: z.string(),
  total: z.number(),
  status: z.enum(['pending', 'completed', 'cancelled']),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number(),
      price: z.number(),
    })
  ),
});

const AnalyticsEntitySchema = createEntitySchema({
  metric: z.string(),
  value: z.number(),
  date: z.string(),
});

// Upsert schemas (without id, createdAt, updatedAt)
const UserUpsertSchema = z.object({
  name: z.string(),
  email: z.email(),
  role: z.enum(['admin', 'user']),
});

const OrderUpsertSchema = z.object({
  userId: z.string(),
  total: z.number(),
  status: z.enum(['pending', 'completed', 'cancelled']),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number(),
      price: z.number(),
    })
  ),
});

// Different API patterns
const userApi = createDomainApi('users', UserEntitySchema, UserUpsertSchema);
const orderApi = createDomainApi('orders', OrderEntitySchema, OrderUpsertSchema);
const analyticsApi = createReadOnlyApi('analytics', AnalyticsEntitySchema); // Read-only

// Multi-domain component
function Dashboard() {
  // Users management
  const { data: users } = userApi.useList!({ limit: 5 });
  const createUser = userApi.useCreate!();

  // Orders tracking
  const { data: orders } = orderApi.useList!({
    filters: { status: 'pending' },
    limit: 10,
  });

  // Analytics (read-only)
  const { data: analytics } = analyticsApi.useList!();

  // Analytics queries
  const { data: analyticsQuery } = analyticsApi.useQuery!('latest');

  const handleCreateUser = async () => {
    try {
      await createUser.mutate({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      {/* Users Section */}
      <div>
        <h2>Users ({users?.length || 0})</h2>
        <button onClick={handleCreateUser} disabled={createUser.loading}>
          Add User
        </button>
        <ul>
          {users?.map(user => (
            <li key={user.id}>
              {user.name} ({user.role})
            </li>
          ))}
        </ul>
      </div>

      {/* Orders Section */}
      <div>
        <h2>Pending Orders ({orders?.length || 0})</h2>
        <ul>
          {orders?.map(order => (
            <li key={order.id}>
              Order #{order.id.slice(-6)} - ${order.total}
            </li>
          ))}
        </ul>
      </div>

      {/* Analytics Section */}
      <div>
        <h2>Analytics</h2>
        <ul>
          {analytics?.slice(0, 5).map(metric => (
            <li key={metric.id}>
              {metric.metric}: {metric.value}
            </li>
          ))}
        </ul>
      </div>

      {/* Analytics Detail */}
      <div>
        <h2>Latest Analytics</h2>
        {analyticsQuery && (
          <div>
            <p>
              {analyticsQuery.metric}: {analyticsQuery.value}
            </p>
            <p>Date: {analyticsQuery.date}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Order detail with multiple operations
function OrderDetail({ orderId }: { orderId: string }) {
  const { data: order, loading } = orderApi.useQuery!(orderId);
  const updateOrder = orderApi.useUpdate!();
  const deleteOrder = orderApi.useDelete!();

  const handleStatusChange = async (status: 'pending' | 'completed' | 'cancelled') => {
    try {
      await updateOrder.mutate(orderId, {
        userId: order!.userId,
        total: order!.total,
        status,
        items: order!.items,
      });
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  if (loading) return <div>Loading order...</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div>
      <h3>Order #{order.id.slice(-6)}</h3>
      <p>Status: {order.status}</p>
      <p>Total: ${order.total}</p>

      <h4>Items:</h4>
      <ul>
        {order.items.map((item, index) => (
          <li key={index}>
            Product {item.productId}: {item.quantity} x ${item.price}
          </li>
        ))}
      </ul>

      <div>
        <button onClick={() => handleStatusChange('completed')} disabled={updateOrder.loading}>
          Mark Completed
        </button>
        <button onClick={() => handleStatusChange('cancelled')} disabled={updateOrder.loading}>
          Cancel Order
        </button>
        <button
          onClick={() => deleteOrder.mutate(orderId)}
          disabled={deleteOrder.loading}
          style={{ marginLeft: '10px', color: 'red' }}
        >
          Delete Order
        </button>
      </div>
    </div>
  );
}

// App with advanced configuration
export function AdvancedUsageExample() {
  return (
    <ApiClientProvider
      connectorType="localStorage"
      config={{
        simulateDelay: 500,
        errorRate: 0.1, // 10% error rate for testing
        pagination: {
          defaultLimit: 20,
          maxLimit: 100,
        },
      }}
    >
      <div>
        <h1>Advanced Multi-Domain Example</h1>
        <Dashboard />
        <hr />
        <OrderDetail orderId="sample-order-id" />
      </div>
    </ApiClientProvider>
  );
}
