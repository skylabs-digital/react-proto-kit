import React from 'react';
import {
  useUrlParam,
  useUrlTabs,
  useUrlModal,
  useUrlDrawer,
  useUrlStepper,
} from '@skylabs-digital/react-proto-kit';

// Scenario for URL-driven UI primitives. Every piece of state is visible in
// location.search so agents can assert URL encoding + navigation semantics.
export default function UrlNavScenario() {
  const [q, setQ] = useUrlParam('q');
  const [tab, setTab] = useUrlTabs('tab', ['overview', 'details', 'history'], 'overview');
  const [modalOpen, setModalOpen] = useUrlModal('qa-modal');
  const [drawerOpen, setDrawerOpen] = useUrlDrawer('qa-drawer');
  const [step, stepperHelpers] = useUrlStepper(
    'step',
    ['personal', 'address', 'review'],
    'personal'
  );

  return (
    <section style={{ padding: 16 }}>
      <h2>URL nav scenario</h2>

      <section style={card}>
        <h3>useUrlParam</h3>
        <input
          data-testid="urlnav-q-input"
          value={q ?? ''}
          onChange={e => setQ(e.target.value || null)}
        />
        <p data-testid="urlnav-q-value">q = {q ?? '(none)'}</p>
      </section>

      <section style={card}>
        <h3>useUrlTabs</h3>
        {(['overview', 'details', 'history'] as const).map(t => (
          <button
            key={t}
            data-testid={`urlnav-tab-${t}`}
            onClick={() => setTab(t)}
            style={tab === t ? { fontWeight: 700 } : undefined}
          >
            {t}
          </button>
        ))}
        <p data-testid="urlnav-tab-active">tab = {tab}</p>
      </section>

      <section style={card}>
        <h3>useUrlModal</h3>
        <button data-testid="urlnav-modal-toggle" onClick={() => setModalOpen()}>
          toggle modal
        </button>
        <span data-testid="urlnav-modal-state">
          modalOpen = {String(modalOpen)}
        </span>
        {modalOpen && (
          <div data-testid="urlnav-modal-body" style={modalStyle}>
            modal body
            <button
              data-testid="urlnav-modal-close"
              onClick={() => setModalOpen(false)}
            >
              close
            </button>
          </div>
        )}
      </section>

      <section style={card}>
        <h3>useUrlDrawer</h3>
        <button data-testid="urlnav-drawer-toggle" onClick={() => setDrawerOpen()}>
          toggle drawer
        </button>
        <span data-testid="urlnav-drawer-state">
          drawerOpen = {String(drawerOpen)}
        </span>
      </section>

      <section style={card}>
        <h3>useUrlStepper</h3>
        <p data-testid="urlnav-stepper-current">step = {step}</p>
        <button
          data-testid="urlnav-stepper-prev"
          onClick={() => stepperHelpers.prev()}
          disabled={stepperHelpers.isFirst}
        >
          prev
        </button>
        <button
          data-testid="urlnav-stepper-next"
          onClick={() => stepperHelpers.next()}
          disabled={stepperHelpers.isLast}
        >
          next
        </button>
      </section>
    </section>
  );
}

const card: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 12,
  margin: '10px 0',
};
const modalStyle: React.CSSProperties = {
  padding: 12,
  border: '2px solid #2563eb',
  background: '#eff6ff',
  marginTop: 8,
};
