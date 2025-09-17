import { useRef, useEffect, useState } from 'react';
import { ApiClientProvider, createDomainApi, z } from '../../../src/index';
import { LocalStorageConnector } from '../../../src/connectors/LocalStorageConnector';

// Global request counter
let globalRequestCounter = 0;
const requestLog: string[] = [];

// Function to log requests
function logRequest(method: string, endpoint: string) {
  globalRequestCounter++;
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `#${globalRequestCounter} [${timestamp}] ${method} ${endpoint}`;
  requestLog.push(logEntry);
  console.log(`🌐 HTTP Request ${logEntry}`);

  // Keep only last 20 requests to avoid memory issues
  if (requestLog.length > 20) {
    requestLog.shift();
  }
}

// Custom connector that logs all requests
class LoggingLocalStorageConnector extends LocalStorageConnector {
  async get<T>(endpoint: string, params?: Record<string, any>) {
    logRequest('GET', endpoint);
    return super.get<T>(endpoint, params);
  }

  async post<T>(endpoint: string, data?: any) {
    logRequest('POST', endpoint);
    return super.post<T>(endpoint, data);
  }

  async put<T>(endpoint: string, data?: any) {
    logRequest('PUT', endpoint);
    return super.put<T>(endpoint, data);
  }

  async patch<T>(endpoint: string, data?: any) {
    logRequest('PATCH', endpoint);
    return super.patch<T>(endpoint, data);
  }

  async delete<T>(endpoint: string, data?: any) {
    logRequest('DELETE', endpoint);
    return super.delete<T>(endpoint, data);
  }
}

// Simple schemas
const userEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const userUpsertSchema = z.object({
  name: z.string(),
  email: z.string(),
});

// Create API
const userApi = createDomainApi('users', userEntitySchema, userUpsertSchema);

// Component to test useQuery with render counting
function UserById({ userId, externalCounter }: { userId: string; externalCounter: number }) {
  const renderCount = useRef(0);
  renderCount.current += 1;

  console.log(
    `🔄 UserById render #${renderCount.current} for userId: ${userId}, externalCounter: ${externalCounter}`
  );

  const { data: user, loading, error } = userApi.useById(userId);

  useEffect(() => {
    console.log(`📊 UserById useEffect triggered - render #${renderCount.current}`);
  });

  if (loading)
    return (
      <div>
        Loading user {userId}... (renders: {renderCount.current})
      </div>
    );
  if (error)
    return (
      <div>
        Error: {error.message} (renders: {renderCount.current})
      </div>
    );

  return (
    <div style={{ border: '1px solid blue', padding: '10px', margin: '10px' }}>
      <h3>User Details (renders: {renderCount.current})</h3>
      {user ? (
        <div>
          <p>
            <strong>ID:</strong> {user.id}
          </p>
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
        </div>
      ) : (
        <p>No user found</p>
      )}
    </div>
  );
}

// Component to test useList with render counting
function UserList({ externalCounter }: { externalCounter: number }) {
  const renderCount = useRef(0);
  renderCount.current += 1;

  console.log(`🔄 UserList render #${renderCount.current}, externalCounter: ${externalCounter}`);

  const { data: users, loading, error } = userApi.useList();

  useEffect(() => {
    console.log(`📊 UserList useEffect triggered - render #${renderCount.current}`);
  });

  if (loading) return <div>Loading users... (renders: {renderCount.current})</div>;
  if (error)
    return (
      <div>
        Error: {error.message} (renders: {renderCount.current})
      </div>
    );

  return (
    <div style={{ border: '1px solid green', padding: '10px', margin: '10px' }}>
      <h3>User List (renders: {renderCount.current})</h3>
      {users && users.length > 0 ? (
        <ul>
          {users.map(user => (
            <li key={user.id}>
              {user.name} - {user.email}
            </li>
          ))}
        </ul>
      ) : (
        <p>No users found</p>
      )}
    </div>
  );
}

// Control component without hooks to verify it's stable
function ControlComponent() {
  const renderCount = useRef(0);
  renderCount.current += 1;

  console.log(`🔄 ControlComponent render #${renderCount.current}`);

  useEffect(() => {
    console.log(`📊 ControlComponent useEffect triggered - render #${renderCount.current}`);
  });

  return (
    <div style={{ border: '1px solid gray', padding: '10px', margin: '10px' }}>
      <h3>Control Component (renders: {renderCount.current})</h3>
      <p>This component should be stable and not re-render constantly.</p>
    </div>
  );
}

// Request counter display component
function RequestCounter() {
  const [, forceUpdate] = useState({});

  // Force update every second to show current request count
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
      }}
    >
      <h3>HTTP Request Monitor</h3>
      <p>
        <strong>Total Requests:</strong> {globalRequestCounter}
      </p>
      <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '12px' }}>
        <strong>Recent Requests:</strong>
        {requestLog.length > 0 ? (
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            {requestLog.slice(-10).map((log, index) => (
              <li key={index}>{log}</li>
            ))}
          </ul>
        ) : (
          <p>No requests yet</p>
        )}
      </div>
    </div>
  );
}

function App() {
  const renderCount = useRef(0);
  renderCount.current += 1;

  // External factors that cause re-renders
  const [externalCounter, setExternalCounter] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState('1');

  console.log(`🔄 App render #${renderCount.current}`);

  useEffect(() => {
    console.log(`📊 App useEffect triggered - render #${renderCount.current}`);
  });

  // Timer que causa re-renders solo unas pocas veces al inicio
  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      if (count < 3) {
        setExternalCounter(prev => prev + 1);
        console.log(
          `🕐 External counter incremented (${count + 1}/3) - this should cause controlled re-renders`
        );
        count++;
      } else {
        clearInterval(interval);
        console.log('🛑 External counter timer stopped - should be stable now');
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Create custom connector instance with logging
  const customConnector = new LoggingLocalStorageConnector({
    simulateDelay: 100,
    seed: {
      data: {
        users: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
          {
            id: '3',
            name: 'Bob Johnson',
            email: 'bob@example.com',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
        ],
      },
      behavior: {
        initializeEmpty: true,
      },
    },
  });

  return (
    <ApiClientProvider connector={customConnector}>
      <div style={{ padding: '20px' }}>
        <h1>Debug Renders Example (App renders: {renderCount.current})</h1>
        <p>
          Open the console to see render counts and HTTP requests. If there are infinite renders,
          you'll see the numbers keep increasing along with constant HTTP requests.
        </p>

        <RequestCounter />

        {/* External render triggers */}
        <div
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#e8f4fd',
            border: '1px solid #0066cc',
          }}
        >
          <h3>External Render Triggers</h3>
          <p>
            <strong>External Counter:</strong> {externalCounter} (updates 3 times, then stops)
          </p>
          <p>
            <strong>Selected User ID:</strong> {selectedUserId}
          </p>

          <div style={{ marginTop: '10px' }}>
            <button onClick={() => setSelectedUserId('1')} style={{ marginRight: '5px' }}>
              Select User 1
            </button>
            <button onClick={() => setSelectedUserId('2')} style={{ marginRight: '5px' }}>
              Select User 2
            </button>
            <button onClick={() => setSelectedUserId('3')} style={{ marginRight: '5px' }}>
              Select User 3
            </button>
            <button
              onClick={() => setExternalCounter(prev => prev + 1)}
              style={{ marginLeft: '10px' }}
            >
              Force Counter Increment
            </button>
          </div>
        </div>

        <ControlComponent />

        <h2>Testing useQuery Hook</h2>
        <UserById userId={selectedUserId} externalCounter={externalCounter} />

        <h2>Testing useList Hook</h2>
        <UserList externalCounter={externalCounter} />

        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          <h3>Instructions:</h3>
          <ol>
            <li>Open browser console</li>
            <li>Watch for render count logs and HTTP request logs</li>
            <li>
              <strong>Expected behavior:</strong>
              <ul>
                <li>Control component should render once and stay stable</li>
                <li>
                  UserById and UserList should render a few times initially (loading → data) then
                  stabilize
                </li>
                <li>External counter increments 3 times (every 2 seconds), then stops</li>
                <li>After ~6 seconds, everything should be completely stable</li>
                <li>Clicking buttons should cause controlled re-renders</li>
              </ul>
            </li>
            <li>
              <strong>Bug symptoms:</strong>
              <ul>
                <li>If you see hundreds of renders in seconds, we have the infinite render bug</li>
                <li>
                  Render counts should increase gradually with external triggers, not constantly
                </li>
                <li>Console should not be spammed with render logs</li>
                <li>
                  HTTP requests should correlate with renders - if renders are infinite, requests
                  will be too
                </li>
              </ul>
            </li>
            <li>
              <strong>Test scenarios:</strong>
              <ul>
                <li>Let it run for 30 seconds and observe render patterns</li>
                <li>Click user selection buttons and observe controlled re-renders</li>
                <li>Force counter increment and observe the effect</li>
                <li>Watch the HTTP Request Monitor to see request patterns</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>
    </ApiClientProvider>
  );
}

export default App;
