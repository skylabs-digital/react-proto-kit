---
id: url-param-fuzz
type: fuzz
category: fuzz
priority: low
target: useUrlParam
iterations: 100
seed: 42
agent: qa-fuzzer
---

## Context

`useUrlParam` must encode/decode arbitrary string values without losing
characters, and accept `null` as a "remove" sentinel. Fuzz with strings
that break naive encoding:

- `?` `&` `=` `#` `%20` `%25`
- unicode RTL (`\u202e`)
- emoji (`🚀`)
- very long strings (10k chars)
- empty string

## Assertions

- [ ] setValue(x) then read → `x` (exact round-trip)
- [ ] setValue(null) → param removed
- [ ] URL never contains literal `undefined` or `[object Object]`
- [ ] no console warnings

## Test Generation

One Vitest per unique failing round-trip at
`qa/generated-tests/url-param-fuzz-{slug}.generated.test.tsx`.

## Result Schema

Standard.
