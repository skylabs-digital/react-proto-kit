import {
  ApiClientProvider,
  createEntitySchema,
  createCrudApi,
  createReadOnlyApi,
  createCustomApi,
  z,
} from '../index';

// Multiple domain schemas
const UserSchema = createEntitySchema({
  name: z.string(),
  email: z.email(),
  role: z.enum(['admin', 'user']),
});

const OrderSchema = createEntitySchema({
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

const AnalyticsSchema = createEntitySchema({
  metric: z.string(),
  value: z.number(),
  date: z.string(),
});

// Different API patterns
const userApi = createCrudApi('users', UserSchema);
const orderApi = createCrudApi('orders', OrderSchema);
const analyticsApi = createReadOnlyApi('analytics', AnalyticsSchema); // Read-only
const reportsApi = createCustomApi('reports', AnalyticsSchema, ['list']); // Custom operations

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

  // Reports (custom API)
  const { data: reports } = reportsApi.useList!();

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

      {/* Reports Section */}
      <div>
        <h2>Reports</h2>
        <ul>
          {reports?.slice(0, 3).map(report => (
            <li key={report.id}>
              {report.metric}: {report.value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Order detail with multiple operations
function OrderDetail({ orderId }: { orderId: string }) {
  const { data: order, loading } = orderApi.useById!(orderId);
  const updateOrder = orderApi.useUpdate!(orderId);
  const deleteOrder = orderApi.useDelete!(orderId);

  const handleStatusChange = async (status: 'pending' | 'completed' | 'cancelled') => {
    try {
      await updateOrder.mutate({ status });
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
          onClick={() => deleteOrder.mutate()}
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
