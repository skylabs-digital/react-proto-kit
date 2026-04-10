# QA — agentic black-box harness

This directory is the QA harness for react-proto-kit. It is an **exploratory
LLM harness** for a library: agents drive a minimal Vite sandbox that mounts
the library's public APIs, explore behaviour, fuzz inputs, audit the
`ApiResponse<T>` contract, and **write Vitest regression tests** for every
bug or edge case they find. Findings that matter become permanent tests;
the base of tests stays in prompts so every run is repeatable.

The structure and agent-dispatch pattern follow the skylabs guide
`24-agentic-qa-blackbox-testing`, adapted from an HTTP-backed web app to a
React library.

## Layout

```
qa/
├── README.md                   ← you are here
├── sandbox/                    ← Vite app mounting every library feature
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx             ← routing + provider wiring
│       ├── connectors/
│       │   └── test-connector.ts   ← deterministic seed data
│       └── scenarios/
│           ├── mutations.tsx   ← /mutations
│           ├── queries.tsx     ← /queries
│           ├── orchestrator.tsx ← /orchestrator
│           ├── forms.tsx       ← /forms
│           ├── url-nav.tsx     ← /url-nav
│           └── cache.tsx       ← /cache
├── agents/                     ← one file per agent type
│   ├── qa-orchestrator.md
│   ├── qa-library-explorer.md
│   ├── qa-fuzzer.md
│   └── qa-contract-auditor.md
├── flows/                      ← per-flow markdown prompts
│   ├── smoke/
│   ├── mutations/
│   ├── queries/
│   ├── orchestrator/
│   ├── forms/
│   ├── url-nav/
│   ├── fuzz/
│   └── contract/
├── helpers/
│   ├── commands.md             ← bash policy
│   ├── sandbox.md              ← how to boot + drive the sandbox
│   ├── library-api.md          ← minimal public-API cheat sheet
│   └── patterns.md             ← result schema + test generation patterns
├── generated-tests/            ← output of agent runs (Vitest files)
│   └── .gitkeep
└── reports/
    └── .gitignore              ← ignores .tmp/
```

## Running a QA pass

From the repo root:

```bash
# 1. boot the sandbox (first time only)
cd qa/sandbox && yarn install && cd ../..

# 2. dispatch the orchestrator agent with a scope
claude -p "Read qa/agents/qa-orchestrator.md. scope=smoke"

# or scope to a specific category
claude -p "Read qa/agents/qa-orchestrator.md. scope=mutations"

# or one specific flow
claude -p "Read qa/agents/qa-orchestrator.md. scope=mutations/apiresponse-contract"
```

The orchestrator writes a report at
`qa/reports/YYYY-MM-DD-HH-MM-run.md` with per-flow results, findings by
severity, and a list of every test it generated under
`qa/generated-tests/`.

Generated tests run in the main Vitest suite — they are regular test files.
Rerun them at any time:

```bash
npx vitest run qa/generated-tests/
```

## Rules

- **The library is the system under test.** Agents read `src/` but never
  edit it. All writes happen inside `qa/`.
- **Every run is repeatable.** Flows are markdown prompts with explicit
  step lists, so a new agent session reproduces the same walk. Generated
  tests are the regression net.
- **No network access.** Everything runs against `LocalStorageConnector`
  with a deterministic seed.
- **Aggressive fail-loud.** If a flow finds a silent failure, the generated
  test asserts the *correct* behaviour so the bug shows up loudly next run.

## Philosophy

Why is this harness a good fit for a React library (instead of, say,
hand-written Playwright suites or a fuzz-only setup)?

- **Coverage of interaction space, not just API surface.** Unit tests cover
  what you can think of. LLM agents explore what you didn't.
- **Regression net grows organically.** Every finding becomes a test, so
  the second run is faster than the first, and every run beyond that only
  explores new territory.
- **Prompts are the stable artifact.** The tests are generated, but the
  flow prompts are hand-written and version-controlled. They describe
  intent, not implementation.
- **Humans stay in the loop.** The orchestrator report surfaces severity,
  evidence, and generated tests. Humans review and merge (or reject).

## When to run this

- **Before tagging a release.** Catch drift against v2.0.0 contract.
- **After library-wide refactors** (e.g., touching cache layer, orchestrator,
  mutation helpers).
- **When adding a new public API** — add a scenario route to the sandbox
  and a flow to `qa/flows/` alongside.

## What this harness does NOT replace

- **Unit tests** in `src/test/` — those cover implementation details the
  public surface does not expose.
- **Human code review** — the harness surfaces findings but never ships a
  fix. All fixes are human.
- **Integration tests against real backends** — this harness is fully
  offline by design.
