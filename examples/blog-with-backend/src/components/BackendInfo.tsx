import React from 'react';

export function BackendInfo() {
  return (
    <div className="backend-info">
      <h4>🚀 Connected to Express Backend</h4>
      <p>
        This blog platform uses the FetchConnector to communicate with an Express.js backend running
        on port 3002. All blog data (posts, categories, comments) is stored in memory on the server
        and synced automatically across all components using Global Context.
      </p>
      <div className="backend-features">
        <h5>Backend Features:</h5>
        <ul>
          <li>✅ Full CRUD operations for posts, categories, and comments</li>
          <li>✅ Automatic slug generation from titles</li>
          <li>✅ Real-time synchronization across all components</li>
          <li>✅ Optimistic updates with automatic rollback on errors</li>
          <li>✅ Intelligent cache invalidation between related entities</li>
        </ul>
      </div>
    </div>
  );
}
