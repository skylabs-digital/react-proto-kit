import React from 'react';
import { useUrlAccordion, UrlAccordion } from '@skylabs-digital/react-proto-kit';

export default function AccordionDemo() {
  const [expandedMultiple, helpersMultiple] = useUrlAccordion('sections', { multiple: true });

  return (
    <div className="demo-section">
      <h2>📋 Accordion Demo</h2>
      <div className="card">
        <h3>Features</h3>
        <ul>
          <li>✅ Single or multiple mode</li>
          <li>✅ Does NOT add to navigation stack (uses replaceState)</li>
          <li>✅ Expand/collapse/toggle helpers</li>
          <li>✅ Custom render functions</li>
          <li>✅ Persists in URL on refresh</li>
        </ul>
      </div>

      <h3 style={{ marginBottom: '15px' }}>Multiple Mode (can open several)</h3>
      <div style={{ marginBottom: '20px' }}>
        <div className="button-group">
          <button
            className="outline"
            onClick={() => helpersMultiple.expandAll(['faq1', 'faq2', 'faq3'])}
          >
            Expand All
          </button>
          <button className="outline" onClick={helpersMultiple.collapseAll}>
            Collapse All
          </button>
        </div>
      </div>

      <UrlAccordion param="sections" id="faq1" multiple>
        {isExpanded => (
          <>
            <button
              className="url-accordion-header"
              onClick={() => helpersMultiple.toggle('faq1')}
            >
              <span>{isExpanded ? '▼' : '▶'}</span>
              <strong>What is React Proto Kit?</strong>
            </button>
            {isExpanded && (
              <div className="url-accordion-content">
                <p>
                  React Proto Kit is a comprehensive library for building data-driven React
                  applications with CRUD operations, forms, and now URL-based navigation
                  components.
                </p>
              </div>
            )}
          </>
        )}
      </UrlAccordion>

      <UrlAccordion param="sections" id="faq2" multiple>
        {isExpanded => (
          <>
            <button
              className="url-accordion-header"
              onClick={() => helpersMultiple.toggle('faq2')}
            >
              <span>{isExpanded ? '▼' : '▶'}</span>
              <strong>How does URL navigation work?</strong>
            </button>
            {isExpanded && (
              <div className="url-accordion-content">
                <p>
                  URL navigation components sync UI state (modals, tabs, drawers) with URL search
                  parameters. This makes state shareable via links and persistent across page
                  refreshes.
                </p>
              </div>
            )}
          </>
        )}
      </UrlAccordion>

      <UrlAccordion param="sections" id="faq3" multiple>
        {isExpanded => (
          <>
            <button
              className="url-accordion-header"
              onClick={() => helpersMultiple.toggle('faq3')}
            >
              <span>{isExpanded ? '▼' : '▶'}</span>
              <strong>Why doesn't accordion add to navigation stack?</strong>
            </button>
            {isExpanded && (
              <div className="url-accordion-content">
                <p>
                  Accordions are UI state, not navigation. Using replaceState instead of pushState
                  means the browser back button won't step through every accordion
                  expand/collapse action, which would be annoying UX.
                </p>
              </div>
            )}
          </>
        )}
      </UrlAccordion>

      <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
        <strong>Currently expanded:</strong>{' '}
        {expandedMultiple && expandedMultiple.length > 0
          ? expandedMultiple.join(', ')
          : 'None'}
      </div>
    </div>
  );
}
