---
id: zod-schema-fuzz
type: fuzz
category: fuzz
priority: medium
target: createDomainApi
iterations: 50
seed: 1337
agent: qa-fuzzer
---

## Context

Fuzz the create + update path of `createDomainApi` with adversarial inputs
drawn from the string/number generators in `qa/agents/qa-fuzzer.md`. The
library must:
- never throw (every call resolves to an `ApiResponse`)
- return `success: false` with `error.code: 'VALIDATION'` on Zod failure
- return `success: true` on well-formed input

## Generators

Target schema:
```ts
z.object({
  title: z.string().min(1).max(200),
  status: z.enum(['pending', 'done']),
  priority: z.number().int().min(0).max(10),
})
```

Inputs to draw per iteration (uniform over the space):
- title: empty, 1-char, 100-char, 1000-char, unicode, control chars
- status: valid enum, invalid strings, numbers
- priority: valid ints, out-of-range, NaN, Infinity, negative, string-digits

## Assertions

- [ ] every iteration returns a well-formed `ApiResponse`
- [ ] every invalid input yields `{ success: false, error: { code: 'VALIDATION' } }`
- [ ] every valid input yields `{ success: true, data }`
- [ ] no iteration throws

## Test Generation

Emit a permanent Vitest for every unique failing input at
`qa/generated-tests/zod-schema-fuzz-{slug}.generated.test.tsx`.

## Result Schema

Standard.
