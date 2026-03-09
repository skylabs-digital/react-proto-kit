---
description: Onboard a new developer or AI agent to the react-proto-kit project
---

1. Usa el tool `get_workflow` del MCP skylabs-mcp con `name: "sl-onboarding"` para obtener el workflow completo.
2. Seguí todos los pasos del workflow retornado al pie de la letra.
3. Contexto clave de este proyecto:
   - **Tipo:** Librería npm pública (`@skylabs-digital/react-proto-kit`)
   - **Stack:** React + TypeScript + Zod + Vite
   - **Tests:** Vitest (273 tests)
   - **CI/CD:** GitHub Actions → semantic-release → npm publish
   - **No hay:** backend, deploy a infra, Docker, DB
