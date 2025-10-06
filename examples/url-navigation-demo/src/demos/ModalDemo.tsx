import React, { useState } from 'react';
import { useUrlModal, UrlModal } from '@skylabs-digital/react-proto-kit';

export default function ModalDemo() {
  const [isBasicOpen, setBasicOpen] = useUrlModal('basicModal');
  const [isFormOpen, setFormOpen] = useUrlModal('formModal', {
    onOpen: () => console.log('Form modal opened!'),
    onClose: () => console.log('Form modal closed!'),
  });

  return (
    <div className="demo-section">
      <h2>🪟 Modal Demo</h2>
      <div className="card">
        <h3>Features</h3>
        <ul>
          <li>✅ Opens modal with ?modal=&lt;id&gt; (only one at a time)</li>
          <li>✅ Browser back button closes modal</li>
          <li>✅ Refresh preserves modal state</li>
          <li>✅ Portal rendering for correct z-index</li>
          <li>✅ Optional callbacks (onOpen, onClose)</li>
          <li>✅ Automatically closes other modals when opening a new one</li>
        </ul>
      </div>

      <div className="button-group">
        <button className="primary" onClick={() => setBasicOpen(true)}>
          Open Basic Modal (?modal=basicModal)
        </button>
        <button className="primary" onClick={() => setFormOpen(true)}>
          Open Form Modal (?modal=formModal)
        </button>
      </div>

      {/* Basic Modal */}
      <UrlModal modalId="basicModal">
        <div className="modal-header">
          <h3>Basic Modal</h3>
          <button className="close-btn" onClick={() => setBasicOpen(false)}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>
            This is a basic modal. Notice the URL has <code>?modal=basicModal</code> parameter.
          </p>
          <p>Try pressing the browser back button to close it!</p>
          <p>
            <strong>Try opening the Form Modal</strong> - it will automatically close this one!
          </p>
        </div>
        <div className="modal-footer">
          <button className="secondary" onClick={() => setBasicOpen(false)}>
            Close
          </button>
        </div>
      </UrlModal>

      {/* Form Modal */}
      <UrlModal modalId="formModal">
        <FormModalContent onClose={() => setFormOpen(false)} />
      </UrlModal>
    </div>
  );
}

function FormModalContent({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Form submitted!\nName: ${name}\nEmail: ${email}`);
    onClose();
  };

  return (
    <>
      <div className="modal-header">
        <h3>Form Modal with Callbacks</h3>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="modal-body">
        <form onSubmit={handleSubmit}>
          <div className="filter-group">
            <label>Name:</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="filter-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary">
              Submit
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
