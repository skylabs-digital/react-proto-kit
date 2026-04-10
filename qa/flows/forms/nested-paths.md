---
id: forms-nested-paths
type: library
category: forms
priority: high
start_route: /forms
agent: qa-library-explorer
---

## Context

`useFormData` supports dotted paths for nested fields
(`form.handleChange('address.street', value)`). Validation errors should
surface at the exact nested key and not collapse into a parent-level error.

## Helpers

- qa/helpers/sandbox.md

## Steps

1. Navigate to `/forms`, clear localStorage, reload.
2. Submit the empty form by clicking `[data-testid="forms-submit-btn"]`.
3. Confirm `forms-name-error`, `forms-email-error`, `forms-street-error`,
   `forms-city-error` are all visible.
4. Type `Ada` into `forms-name-input`. `forms-name-error` should clear.
5. Type `not-an-email` into `forms-email-input`. `forms-email-error` should
   still be visible (invalid email).
6. Type `ada@example.com`. `forms-email-error` should clear.
7. Fill street and city. Assert all errors are gone and `forms-valid` shows
   `valid: true`.
8. Click submit. Confirm `forms-submitted-json` contains the full nested
   object.
9. Click reset. Confirm `forms-dirty` returns to `dirty: false` and inputs
   are empty.

## Assertions

- [ ] nested field errors surface at `address.street` / `address.city`
- [ ] clearing an invalid field clears only its own error
- [ ] submitted payload has the full nested shape
- [ ] reset restores clean state

## Test Generation

Vitest with the profile schema asserting `form.errors['address.street']`
updates independently of top-level errors.

## Result Schema

Standard.
