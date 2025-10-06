import React, { useState } from 'react';
import { useSnackbar } from '@skylabs-digital/react-proto-kit';

export default function SnackbarDemo() {
  const { showSnackbar, hideAll } = useSnackbar();
  const [lastId, setLastId] = useState<string | null>(null);

  const handleShowSuccess = () => {
    showSnackbar({
      message: 'Operation completed successfully!',
      variant: 'success',
      duration: 3000,
    });
  };

  const handleShowError = () => {
    showSnackbar({
      message: 'An error occurred while processing your request',
      variant: 'error',
      duration: 5000,
    });
  };

  const handleShowWarning = () => {
    showSnackbar({
      message: 'Warning: This action cannot be undone',
      variant: 'warning',
      duration: 4000,
    });
  };

  const handleShowInfo = () => {
    showSnackbar({
      message: 'Here is some useful information for you',
      variant: 'info',
      duration: 3000,
    });
  };

  const handleShowWithAction = () => {
    showSnackbar({
      message: 'Item deleted successfully',
      variant: 'info',
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          showSnackbar({
            message: 'Deletion cancelled',
            variant: 'success',
            duration: 2000,
          });
        },
      },
    });
  };

  const handleShowPersistent = () => {
    const id = showSnackbar({
      message: 'This message will not auto-dismiss. Close it manually.',
      variant: 'warning',
      duration: null, // No auto-dismiss
    });
    setLastId(id);
  };

  const handleShowMultiple = () => {
    showSnackbar({
      message: 'First notification',
      variant: 'info',
      duration: 4000,
    });

    setTimeout(() => {
      showSnackbar({
        message: 'Second notification',
        variant: 'success',
        duration: 4000,
      });
    }, 500);

    setTimeout(() => {
      showSnackbar({
        message: 'Third notification',
        variant: 'warning',
        duration: 4000,
      });
    }, 1000);
  };

  const handleShowWithCallback = () => {
    showSnackbar({
      message: 'This snackbar has a close callback',
      variant: 'info',
      duration: 3000,
      onClose: () => {
        console.log('Snackbar closed!');
        showSnackbar({
          message: 'Previous snackbar was closed',
          variant: 'success',
          duration: 2000,
        });
      },
    });
  };

  return (
    <div className="demo-section">
      <h2>🔔 Snackbar Demo</h2>

      <div className="card">
        <h3>Features</h3>
        <ul>
          <li>✅ Ephemeral notifications (React state only)</li>
          <li>✅ Auto-dismiss with configurable timeout</li>
          <li>✅ Queue system for multiple notifications</li>
          <li>✅ Variant styles (success, error, warning, info)</li>
          <li>✅ Optional action buttons (undo, etc.)</li>
          <li>✅ Manual dismiss or persistent messages</li>
          <li>✅ Portal rendering for proper z-index</li>
        </ul>
      </div>

      <div className="card">
        <h3>Basic Variants</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="success" onClick={handleShowSuccess}>
            Show Success
          </button>
          <button className="danger" onClick={handleShowError}>
            Show Error
          </button>
          <button className="warning" onClick={handleShowWarning}>
            Show Warning
          </button>
          <button className="info" onClick={handleShowInfo}>
            Show Info
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Advanced Features</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="primary" onClick={handleShowWithAction}>
            With Action Button
          </button>
          <button className="secondary" onClick={handleShowPersistent}>
            Persistent (No Auto-dismiss)
          </button>
          <button className="primary" onClick={handleShowMultiple}>
            Show Multiple (Queue)
          </button>
          <button className="secondary" onClick={handleShowWithCallback}>
            With Close Callback
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Controls</h3>
        <button className="danger" onClick={hideAll}>
          Hide All Snackbars
        </button>
        {lastId && (
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Last persistent snackbar ID: {lastId.substring(0, 20)}...
          </p>
        )}
      </div>

      <div className="card">
        <h3>Integration Example</h3>
        <pre
          style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '4px',
            overflow: 'auto',
          }}
        >
          {`// Setup (App.tsx)
<SnackbarProvider>
  <SnackbarContainer position="top-right" maxVisible={3} />
  <App />
</SnackbarProvider>

// Usage in component
const { showSnackbar } = useSnackbar();

const mutation = todosApi.useCreate({
  onSuccess: () => {
    showSnackbar({
      message: 'Todo created!',
      variant: 'success',
      duration: 3000
    });
  },
  onError: (e) => {
    showSnackbar({
      message: e.message,
      variant: 'error',
      duration: 5000
    });
  }
});`}
        </pre>
      </div>

      <div className="card">
        <h3>Technical Details</h3>
        <ul>
          <li>
            <strong>Storage:</strong> React state (ephemeral, no persistence)
          </li>
          <li>
            <strong>Auto-dismiss:</strong> Configurable per snackbar (default 4000ms)
          </li>
          <li>
            <strong>Queue:</strong> Respects maxVisible limit, removes oldest when exceeded
          </li>
          <li>
            <strong>Portal:</strong> Always renders via createPortal to document.body
          </li>
          <li>
            <strong>API:</strong> Imperative (showSnackbar, hideSnackbar, hideAll)
          </li>
          <li>
            <strong>Position:</strong> Configurable on container (top/bottom, left/center/right)
          </li>
        </ul>
      </div>

      <div className="card">
        <h3>Customization</h3>
        <p>
          You can completely customize the snackbar appearance by providing your own{' '}
          <code>SnackbarComponent</code> prop:
        </p>
        <pre
          style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '13px',
          }}
        >
          {`import { SnackbarItemProps } from '@skylabs-digital/react-proto-kit';

function CustomSnackbar({ snackbar, onClose }: SnackbarItemProps) {
  return (
    <div style={{ /* your custom styles */ }}>
      <span>{snackbar.message}</span>
      {snackbar.action && (
        <button onClick={() => {
          snackbar.action.onClick();
          onClose(snackbar.id);
        }}>
          {snackbar.action.label}
        </button>
      )}
      <button onClick={() => onClose(snackbar.id)}>×</button>
    </div>
  );
}

// Use custom component
<SnackbarContainer SnackbarComponent={CustomSnackbar} />`}
        </pre>
      </div>
    </div>
  );
}
