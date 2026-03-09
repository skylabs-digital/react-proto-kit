# Coding Style — react-proto-kit

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files TS/TSX | camelCase (hooks) or PascalCase (components/classes) | `useCreateMutation.ts`, `FetchConnector.ts` |
| Interfaces | PascalCase (no `I` prefix) | `ErrorResponse`, `ConnectorConfig` |
| Types | PascalCase | `CrudOperation`, `RefetchBehavior` |
| Functions/methods | camelCase | `executeRequest()`, `buildUrl()` |
| Variables | camelCase | `cacheKey`, `entityState` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_CACHE_TIME` |
| Zod schemas | camelCase + `Schema` suffix | `todoSchema`, `userUpsertSchema` |
| Directories | kebab-case or camelCase (match existing) | `connectors/`, `navigation/` |
| Exported factories | camelCase with `create` prefix | `createDomainApi`, `createReadOnlyApi` |
| Hook files | camelCase with `use` prefix | `useList.ts`, `useFormData.ts` |

## Do's ✅

- Always use `yarn` (never `npm`)
- Always run `yarn ci` before pushing
- Use TypeScript strict mode — no `@ts-ignore`
- Export new public API members from `src/index.ts`
- Write tests for new features in `src/test/`
- Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- Keep backward compatibility — `data` fields optional, new params with defaults
- Destructure props in function signatures
- Use `ErrorResponse` interface for all error objects (never plain `Error`)

## Don'ts ❌

- NEVER use `npm` commands
- NEVER use `console.log` in library source code (use `configureDebugLogging`)
- NEVER use `any` without justification — prefer `unknown` or proper types
- NEVER add comments or documentation unless asked
- NEVER delete or weaken existing tests
- NEVER change exports in `src/index.ts` without considering it a potential breaking change
- NEVER import from `dist/` — always from `src/`
- NEVER hardcode URLs or environment values

## Import Order

```typescript
// 1. React and external libs
import { useState, useCallback } from 'react';
import { z } from 'zod';

// 2. Internal absolute imports (types, interfaces)
import { ErrorResponse, ApiResponse } from '../types';

// 3. Relative imports
import { useApiClient } from '../provider/ApiClientProvider';
```
