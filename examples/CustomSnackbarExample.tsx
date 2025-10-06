import React from 'react';
import {
  SnackbarProvider,
  SnackbarContainer,
  useSnackbar,
  SnackbarItemProps,
} from '@skylabs-digital/react-proto-kit';

/**
 * Custom Snackbar Component Example
 * Demonstrates how to completely customize the snackbar appearance
 */
function CustomSnackbar({ snackbar, onClose, animate = true }: SnackbarItemProps) {
  const variantStyles = {
    success: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: '✓',
    },
    error: {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      icon: '✕',
    },
    warning: {
      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      icon: '⚠',
    },
    info: {
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      icon: 'ℹ',
    },
  };

  const style = variantStyles[snackbar.variant];

  return (
    <div
      style={{
        background: style.background,
        color: 'white',
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        marginBottom: '12px',
        minWidth: '320px',
        maxWidth: '500px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: animate ? 'slideIn 0.3s ease-out' : 'none',
      }}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
        }}
      >
        {style.icon}
      </div>

      {/* Message */}
      <div style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>{snackbar.message}</div>

      {/* Action Button */}
      {snackbar.action && (
        <button
          onClick={() => {
            snackbar.action?.onClick();
            onClose(snackbar.id);
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.3)',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
        >
          {snackbar.action.label}
        </button>
      )}

      {/* Close Button */}
      <button
        onClick={() => onClose(snackbar.id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          padding: '4px',
          lineHeight: '1',
          opacity: 0.8,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.8';
        }}
      >
        ×
      </button>
    </div>
  );
}

/**
 * Example App using Custom Snackbar
 */
export default function App() {
  return (
    <SnackbarProvider>
      {/* Use custom snackbar component */}
      <SnackbarContainer position="top-right" maxVisible={3} SnackbarComponent={CustomSnackbar} />

      <DemoComponent />
    </SnackbarProvider>
  );
}

function DemoComponent() {
  const { showSnackbar } = useSnackbar();

  return (
    <div style={{ padding: '40px' }}>
      <h1>Custom Snackbar Demo</h1>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={() =>
            showSnackbar({
              message: 'Successfully saved your changes!',
              variant: 'success',
              duration: 3000,
            })
          }
        >
          Success
        </button>

        <button
          onClick={() =>
            showSnackbar({
              message: 'Failed to connect to server',
              variant: 'error',
              duration: 4000,
            })
          }
        >
          Error
        </button>

        <button
          onClick={() =>
            showSnackbar({
              message: 'This action requires confirmation',
              variant: 'warning',
              duration: 5000,
              action: {
                label: 'Confirm',
                onClick: () => alert('Confirmed!'),
              },
            })
          }
        >
          Warning with Action
        </button>

        <button
          onClick={() =>
            showSnackbar({
              message: 'Check out our new features!',
              variant: 'info',
              duration: 3000,
            })
          }
        >
          Info
        </button>
      </div>
    </div>
  );
}
