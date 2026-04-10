import React, { useState } from 'react';
import { useFormData, z } from '@skylabs-digital/react-proto-kit';

const profileSchema = z.object({
  name: z.string().min(1, 'name required'),
  email: z.string().email('valid email required'),
  address: z.object({
    street: z.string().min(1, 'street required'),
    city: z.string().min(1, 'city required'),
  }),
});

type Profile = z.infer<typeof profileSchema>;

// Scenario exercises `useFormData` with nested paths so agents can fuzz
// dirty/reset/submit paths + nested field validation error surfacing.
export default function FormsScenario() {
  const [submitted, setSubmitted] = useState<Profile | null>(null);

  const form = useFormData<Profile>(profileSchema, {
    name: '',
    email: '',
    address: { street: '', city: '' },
  });

  const onSubmit = form.handleSubmit(async values => {
    setSubmitted(values);
  });

  return (
    <section style={{ padding: 16 }}>
      <h2>Forms scenario</h2>
      <form data-testid="forms-form" onSubmit={onSubmit}>
        <label style={row}>
          Name
          <input
            data-testid="forms-name-input"
            value={form.values.name ?? ''}
            onChange={e => form.handleChange('name', e.target.value)}
          />
        </label>
        {form.errors.name && (
          <p data-testid="forms-name-error" style={errorText}>
            {form.errors.name}
          </p>
        )}

        <label style={row}>
          Email
          <input
            data-testid="forms-email-input"
            value={form.values.email ?? ''}
            onChange={e => form.handleChange('email', e.target.value)}
          />
        </label>
        {form.errors.email && (
          <p data-testid="forms-email-error" style={errorText}>
            {form.errors.email}
          </p>
        )}

        <fieldset>
          <legend>Address (nested)</legend>
          <label style={row}>
            Street
            <input
              data-testid="forms-street-input"
              value={form.values.address?.street ?? ''}
              onChange={e => form.handleChange('address.street', e.target.value)}
            />
          </label>
          {form.errors['address.street'] && (
            <p data-testid="forms-street-error" style={errorText}>
              {form.errors['address.street']}
            </p>
          )}
          <label style={row}>
            City
            <input
              data-testid="forms-city-input"
              value={form.values.address?.city ?? ''}
              onChange={e => form.handleChange('address.city', e.target.value)}
            />
          </label>
          {form.errors['address.city'] && (
            <p data-testid="forms-city-error" style={errorText}>
              {form.errors['address.city']}
            </p>
          )}
        </fieldset>

        <div style={row}>
          <button data-testid="forms-submit-btn" type="submit">
            Submit
          </button>
          <button
            data-testid="forms-reset-btn"
            type="button"
            onClick={() => form.reset()}
          >
            Reset
          </button>
          <span data-testid="forms-dirty">dirty: {String(form.isDirty)}</span>
          <span data-testid="forms-valid">valid: {String(form.isValid)}</span>
        </div>
      </form>

      <h3>Submitted</h3>
      <pre data-testid="forms-submitted-json" style={codeBlock}>
        {JSON.stringify(submitted, null, 2)}
      </pre>
    </section>
  );
}

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  margin: '6px 0',
};
const errorText: React.CSSProperties = { color: '#991b1b', fontSize: 12, margin: 0 };
const codeBlock: React.CSSProperties = {
  background: '#0f172a',
  color: '#f8fafc',
  padding: 12,
  borderRadius: 6,
  fontSize: 12,
};
