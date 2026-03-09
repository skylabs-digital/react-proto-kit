# 📋 Plan de Estandarización — react-proto-kit

> **Tipo de proyecto:** Librería npm pública (`@skylabs-digital/react-proto-kit`)
> **No aplica:** Docker, deploy a infra, backend, backoffice, monorepo workspaces, Bruno smoke tests
> **Aplica:** CI/CD para npm publish, testing, coding style, feature design process, Windsurf workflows

---

## 📊 Evaluación Inicial

### ✅ Cumple

| Área | Detalle |
|------|---------|
| TypeScript strict | `strict: true`, `noUnusedLocals`, `noUnusedParameters` |
| Yarn | Yarn 1.22 como package manager |
| ESLint | Flat config con TypeScript + Prettier + React |
| Prettier | `.prettierrc.cjs` con estilo Skylabs |
| Commitlint | Conventional commits con `@commitlint/config-conventional` |
| Semantic Release | Auto-versioning + CHANGELOG + npm publish + GitHub release |
| Husky pre-push | lint → type-check → test → build |
| Husky commit-msg | commitlint validation |
| Testing | 273 tests con Vitest, coverage con `@vitest/coverage-v8` |
| Build | Vite + vite-plugin-dts, ESM + CJS output |
| lint-staged config | Configurado en `package.json` (eslint --fix + prettier --write) |
| Documentación | README completo + 15 docs en `docs/` |
| Examples | 9 ejemplos funcionales |

### ❌ Falta

| Área | Impacto | Prioridad |
|------|---------|-----------|
| `.windsurf/workflows/` | Sin slash commands para MCP | 🔴 Alta |
| `.windsurf/rules/` | Sin reglas de proyecto para agentes AI | 🔴 Alta |
| `.github/workflows/ci.yml` | PRs no ejecutan checks automáticamente (solo release) | 🔴 Alta |
| `.husky/pre-commit` | lint-staged configurado pero hook no creado | 🟡 Media |
| `docs/rfcs/` | Sin proceso de diseño de features | 🟡 Media |
| `docs/knowledge-base/` | Sin documentación funcional estructurada | 🟢 Baja |

### ⚠️ No Aplica (proyecto de librería)

- Dockerfile / docker-compose
- Deploy a infra (QA, production)
- Bruno smoke tests
- Backend/frontend/backoffice structure
- Monorepo workspaces
- Health endpoint
- `.env.example`
- Redis/Postgres services

---

## 🚀 Plan de Acción

### Fase 1: Windsurf Workflows + Rules (`.windsurf/`)

- [x] Crear `.windsurf/workflows/` con slash commands relevantes
- [x] Crear `.windsurf/rules/` con reglas del proyecto

**Workflows a incluir (adaptados a librería):**
- `sl-feature.md` — implementar features
- `sl-design-feature.md` — diseñar features con RFC
- `sl-code-review.md` — code review
- `sl-coding-style-review.md` — style review
- `sl-generate-tests.md` — generar tests
- `sl-pre-pr.md` — pre-PR checks
- `sl-troubleshoot.md` — troubleshooting
- `sl-onboarding.md` — onboarding

**Workflows excluidos (no aplican a librería):**
- ~~sl-add-api~~ (es la librería misma)
- ~~sl-add-component~~ (no es una app)
- ~~sl-db-change~~ (no hay DB)
- ~~sl-generate-e2e~~ (no hay E2E browser)
- ~~sl-new-project~~ (ya existe)
- ~~sl-validate-pipeline~~ (no hay deploy a infra)
- ~~sl-security-review~~ (no hay backend)
- ~~sl-run-tests~~ (single package, `yarn test` basta)

### Fase 2: CI Pipeline (`.github/workflows/ci.yml`)

- [x] Crear workflow CI separado para PRs
- Triggers: `push` a `main`/`dev`, `pull_request` a `main`/`dev`
- Steps: checkout → install → type-check → lint → format:check → test:coverage → build

### Fase 3: Husky pre-commit

- [x] Crear `.husky/pre-commit` que ejecute `lint-staged`

### Fase 4: Feature Design Process

- [x] Crear `docs/rfcs/` con `_template.md`
- [x] Crear `docs/knowledge-base/` con README

### Fase 5: Validación

- [ ] Verificar `yarn ci` pasa
- [ ] Verificar estructura final

---

## ✅ Checklist Final

- [x] `.windsurf/workflows/` con slash commands relevantes
- [x] `.windsurf/rules/` con reglas del proyecto
- [x] `.github/workflows/ci.yml` para PRs
- [x] `.husky/pre-commit` con lint-staged
- [x] `docs/rfcs/_template.md`
- [x] `docs/knowledge-base/README.md`
- [ ] `yarn ci` pasa exitosamente
- [ ] Estructura verificada
