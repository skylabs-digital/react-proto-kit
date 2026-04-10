import React from 'react';
import { BrowserRouter, Link, Route, Routes, NavLink } from 'react-router-dom';
import {
  ApiClientProvider,
  GlobalStateProvider,
  createDevSeedConfig,
} from '@skylabs-digital/react-proto-kit';

import MutationsScenario from './scenarios/mutations';
import QueriesScenario from './scenarios/queries';
import OrchestratorScenario from './scenarios/orchestrator';
import FormsScenario from './scenarios/forms';
import UrlNavScenario from './scenarios/url-nav';
import CacheScenario from './scenarios/cache';
import { seedData } from './connectors/test-connector';

// Seed for a deterministic LocalStorageConnector so every scenario has known
// starting state. Agents can reset the sandbox by clearing localStorage.
// NOTE: createFallbackSeedConfig sets initializeEmpty:false — only useful with
// the fetch connector. For localStorage we need createDevSeedConfig.
const seedConfig = createDevSeedConfig(seedData);

const routes: Array<{ path: string; label: string; id: string }> = [
  { path: '/mutations', label: 'Mutations', id: 'nav-mutations' },
  { path: '/queries', label: 'Queries', id: 'nav-queries' },
  { path: '/orchestrator', label: 'Orchestrator', id: 'nav-orchestrator' },
  { path: '/forms', label: 'Forms', id: 'nav-forms' },
  { path: '/url-nav', label: 'URL Nav', id: 'nav-url-nav' },
  { path: '/cache', label: 'Cache', id: 'nav-cache' },
];

function Home() {
  return (
    <div style={{ padding: 16 }}>
      <h2>QA Sandbox</h2>
      <p>Select a scenario:</p>
      <ul>
        {routes.map(r => (
          <li key={r.path}>
            <Link to={r.path} data-testid={r.id}>
              {r.label}
            </Link>
          </li>
        ))}
      </ul>
      <p style={{ color: '#6b7280', fontSize: 12 }}>
        LocalStorage is pre-seeded via <code>createFallbackSeedConfig</code>.
        Clear <code>localStorage</code> to reset.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ApiClientProvider connectorType="localStorage" config={{ seed: seedConfig }}>
        <GlobalStateProvider>
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              minHeight: '100vh',
            }}
          >
            <nav
              data-testid="nav-root"
              style={{
                display: 'flex',
                gap: 12,
                padding: 12,
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb',
              }}
            >
              <Link to="/" data-testid="nav-home" style={{ fontWeight: 700 }}>
                QA
              </Link>
              {routes.map(r => (
                <NavLink
                  key={r.path}
                  to={r.path}
                  data-testid={r.id}
                  style={({ isActive }) => ({
                    color: isActive ? '#2563eb' : '#374151',
                    textDecoration: 'none',
                  })}
                >
                  {r.label}
                </NavLink>
              ))}
            </nav>
            <main data-testid="scenario-root">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/mutations" element={<MutationsScenario />} />
                <Route path="/queries" element={<QueriesScenario />} />
                <Route path="/orchestrator" element={<OrchestratorScenario />} />
                <Route path="/forms" element={<FormsScenario />} />
                <Route path="/url-nav/*" element={<UrlNavScenario />} />
                <Route path="/cache" element={<CacheScenario />} />
              </Routes>
            </main>
          </div>
        </GlobalStateProvider>
      </ApiClientProvider>
    </BrowserRouter>
  );
}
