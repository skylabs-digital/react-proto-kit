import React from 'react';
import { useUrlTabs, UrlTabs } from '@skylabs-digital/react-proto-kit';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'billing';

export default function TabsDemo() {
  const [activeTab, setTab] = useUrlTabs<SettingsTab>(
    'tab',
    ['profile', 'security', 'notifications', 'billing'],
    'profile'
  );

  return (
    <div className="demo-section">
      <h2>📑 Tabs Demo</h2>
      <div className="card">
        <h3>Features</h3>
        <ul>
          <li>✅ Type-safe tab values</li>
          <li>✅ URL param reflects active tab</li>
          <li>✅ Browser back navigates between tabs</li>
          <li>✅ Validation of allowed values</li>
          <li>✅ Default tab support</li>
        </ul>
      </div>

      <nav>
        <button
          className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setTab('profile')}
        >
          👤 Profile
        </button>
        <button
          className={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setTab('security')}
        >
          🔒 Security
        </button>
        <button
          className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setTab('notifications')}
        >
          🔔 Notifications
        </button>
        <button
          className={`nav-link ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setTab('billing')}
        >
          💳 Billing
        </button>
      </nav>

      <UrlTabs
        param="tab"
        value="profile"
        allowedValues={['profile', 'security', 'notifications', 'billing']}
        defaultValue="profile"
      >
        <div className="card">
          <h3>👤 Profile Settings</h3>
          <p>Manage your personal information and preferences.</p>
          <ul>
            <li>Update your name and email</li>
            <li>Change profile picture</li>
            <li>Set your timezone</li>
          </ul>
        </div>
      </UrlTabs>

      <UrlTabs
        param="tab"
        value="security"
        allowedValues={['profile', 'security', 'notifications', 'billing']}
        defaultValue="profile"
      >
        <div className="card">
          <h3>🔒 Security Settings</h3>
          <p>Keep your account secure with these options.</p>
          <ul>
            <li>Change password</li>
            <li>Enable two-factor authentication</li>
            <li>Manage active sessions</li>
          </ul>
        </div>
      </UrlTabs>

      <UrlTabs
        param="tab"
        value="notifications"
        allowedValues={['profile', 'security', 'notifications', 'billing']}
        defaultValue="profile"
      >
        <div className="card">
          <h3>🔔 Notification Preferences</h3>
          <p>Control how and when you receive notifications.</p>
          <ul>
            <li>Email notifications</li>
            <li>Push notifications</li>
            <li>SMS alerts</li>
          </ul>
        </div>
      </UrlTabs>

      <UrlTabs
        param="tab"
        value="billing"
        allowedValues={['profile', 'security', 'notifications', 'billing']}
        defaultValue="profile"
      >
        <div className="card">
          <h3>💳 Billing Information</h3>
          <p>Manage your payment methods and billing history.</p>
          <ul>
            <li>Payment methods</li>
            <li>Billing history</li>
            <li>Invoices</li>
          </ul>
        </div>
      </UrlTabs>
    </div>
  );
}
