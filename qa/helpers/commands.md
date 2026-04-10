# Bash command policy for QA agents

QA agents operate in a narrow, reversible sandbox. The rules below are strict
— if a command is not explicitly allowed here, do not run it. Ask the user if
you think you need something new.

## Allowed

- `yarn dev`, `yarn build`, `yarn preview` **inside `qa/sandbox/`** only
- `yarn install` inside `qa/sandbox/` only
- `npx vitest run <path>` for executing generated tests under `qa/generated-tests/`
- `npx tsc --noEmit -p qa/sandbox/tsconfig.json` to type-check the sandbox
  (note: may report duplicate-csstype drift from nested `node_modules` — the
  authoritative validation is `yarn build`, which uses esbuild)
- `rm -rf qa/reports/.tmp` (only the tmp dir, never the parent)
- Read-only git: `git status`, `git diff`, `git log --oneline -20`
- File reads via the Read tool (no `cat`, no `less`, no `head`, no `tail`)

## Forbidden

- Any write outside `qa/` — the agents do not modify `src/`, `docs/`,
  `examples/`, or the repo root. If you find a library bug, file it in the
  report; do not patch it.
- `git add`, `git commit`, `git push`, `git reset`, `git checkout` — agents
  never touch git state.
- `npm install` / `yarn add` / `pnpm add` outside `qa/sandbox/` — no new deps
  at the repo root.
- `rm -rf` anywhere except `qa/reports/.tmp`.
- `sudo`, `chmod 777`, any privilege escalation.
- Outbound network access — the sandbox is local. Never `curl` external hosts,
  hit registry mirrors, or phone home.
- Editing `.claude/settings.json`, hooks, or any other agent infrastructure.
- Killing processes not spawned by the current agent session.

## How the agent should fail

If the sandbox fails to build, the agent reports the failure and stops. It
does **not** attempt to fix `src/` to make the build pass — the library source
is the system under test, not the target of edits.
