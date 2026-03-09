---
description: Comprehensive pre-PR workflow that runs all checks and provides PR analysis
---

1. Usa el tool `get_workflow` del MCP skylabs-mcp con `name: "sl-pre-pr"` para obtener el workflow completo.
2. Seguí todos los pasos del workflow retornado al pie de la letra.
3. En este proyecto, el comando de validación completa es `yarn ci` (lint + type-check + test + build).
