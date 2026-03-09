# 📚 React Proto Kit — Documentation

> Complete guide to building full-stack React apps at prototype speed.

---

## �️ Documentation Index

### 📘 Core Guides

| Guide | Description |
|-------|-------------|
| 🏠 [Main README](../README.md) | Quick start, installation, features overview |
| 📘 [API Reference](./API_REFERENCE.md) | Complete API docs for all hooks, factories, and types |
| 🛡️ [Error Handling](./ERROR_HANDLING.md) | Structured `ErrorResponse`, custom error codes, `data` field |
| 📝 [Forms Guide](./FORMS.md) | `useFormData`, `createFormHandler`, validation patterns |
| ⚡ [Global Context Guide](./GLOBAL_CONTEXT_GUIDE.md) | `GlobalStateProvider`, caching, real-time sync |
| 🎭 [Data Orchestrator](./DATA_ORCHESTRATOR.md) | Aggregate multiple APIs, `stale-while-revalidate`, auto-refetch |
| 🎨 [UI Components](./UI_COMPONENTS.md) | Modal, Drawer, Tabs, Stepper, Accordion, Snackbar |
| 🚀 [Advanced Usage](./ADVANCED_USAGE.md) | Complex patterns, performance, testing strategies |

### 🏗️ Architecture & Design

| Guide | Description |
|-------|-------------|
| 🏗️ [Architecture](./ARCHITECTURE.md) | Internal design, data flow, connector pattern |
| 📡 [RFC: Single Record API](./RFC_SINGLE_RECORD_API.md) | Design spec for `createSingleRecordApi` |
| 🔄 [RFC: Data Orchestrator Refetch](./RFC_WITH_DATA_ORCHESTRATOR_REFETCH.md) | Design spec for refetch behaviors |
| 🔗 [RFC: URL Navigation](./RFC_URL_NAVIGATION.md) | Design spec for URL-driven UI components |
| 📋 [RFC: Page Data Wrapper](./RFC_PAGE_DATA_WRAPPER.md) | Design spec for page-level data orchestration |

### 🛠️ Development

| Guide | Description |
|-------|-------------|
| 🤝 [Contributing](./CONTRIBUTING.md) | Setup, PR process, testing guidelines |
| 📋 [Migration Guide](./MIGRATION_GUIDE.md) | Upgrading between versions |

---

## 🚀 Quick Navigation

### 🆕 New to React Proto Kit?

1. Start with the [Main README](../README.md) → Quick Start
2. Explore the [Examples](../examples/) — 9 working demos
3. Read the [API Reference](./API_REFERENCE.md) for detailed usage
4. Check the [Forms Guide](./FORMS.md) for form handling

### 🧑‍💻 Building a Production App?

1. [Advanced Usage](./ADVANCED_USAGE.md) — production patterns and optimization
2. [Error Handling](./ERROR_HANDLING.md) — structured errors for robust UX
3. [Global Context](./GLOBAL_CONTEXT_GUIDE.md) — centralized state management
4. [Data Orchestrator](./DATA_ORCHESTRATOR.md) — aggregate multiple API calls
5. [Architecture](./ARCHITECTURE.md) — understand how it all fits together

### 🤝 Contributing?

1. [Contributing Guide](./CONTRIBUTING.md) — development setup
2. [Architecture](./ARCHITECTURE.md) — internal design decisions
3. [Migration Guide](./MIGRATION_GUIDE.md) — breaking change tracking

---

## � Search by Topic

### API Factories
- [`createDomainApi`](./API_REFERENCE.md#createdomainapi) — Full CRUD API factory
- [`createSingleRecordApi`](./API_REFERENCE.md#createsinglerecordapi) — Single record endpoints (settings, profile)
- [`createReadOnlyApi`](../README.md#-read-only-apis) — Read-only list endpoints
- [`createSingleRecordReadOnlyApi`](./API_REFERENCE.md#createsinglerecordreadonlyapi) — Read-only single record

### Hooks
- **Query**: `useList`, `useQuery` / `useById`, `useRecord`
- **Mutations**: `useCreate`, `useUpdate`, `usePatch`, `useDelete`, `useReset`
- **Forms**: [`useFormData`](./FORMS.md), [`createFormHandler`](./FORMS.md)
- **URL State**: `useUrlParam`, `useUrlTabs`, `useUrlModal`, `useUrlDrawer`, `useUrlStepper`, `useUrlAccordion`
- **Orchestration**: [`useDataOrchestrator`](./DATA_ORCHESTRATOR.md), [`withDataOrchestrator`](./DATA_ORCHESTRATOR.md)
- **Notifications**: [`useSnackbar`](./UI_COMPONENTS.md)

### Error Handling
- [ErrorResponse interface](./ERROR_HANDLING.md#errorresponse-interface)
- [Catching errors with try/catch](./ERROR_HANDLING.md#-catching-errors-with-trycatch)
- [Validation errors](./ERROR_HANDLING.md#-validation-errors)
- [Backend contract](./ERROR_HANDLING.md#backend-contract)

### Type Safety
- [`ExtractEntityType<T>`](./API_REFERENCE.md#type-utilities) — complete entity type
- [`ExtractInputType<T>`](./API_REFERENCE.md#type-utilities) — input type for mutations
- [Schema patterns](./ADVANCED_USAGE.md#complex-schema-patterns) — complex schemas

### State Management
- [Global State](./GLOBAL_CONTEXT_GUIDE.md) — centralized state
- [Caching](./GLOBAL_CONTEXT_GUIDE.md#caching-strategy) — cache management
- [Optimistic Updates](./GLOBAL_CONTEXT_GUIDE.md#optimistic-updates) — instant feedback

---

## 📖 Documentation Structure

```
docs/
├── README.md                                # This file — documentation index
├── API_REFERENCE.md                         # Complete API documentation
├── ERROR_HANDLING.md                        # 🆕 Error handling guide
├── FORMS.md                                 # Form handling and validation
├── GLOBAL_CONTEXT_GUIDE.md                  # State management guide
├── DATA_ORCHESTRATOR.md                     # Data orchestration guide
├── UI_COMPONENTS.md                         # UI components guide
├── ADVANCED_USAGE.md                        # Advanced patterns
├── ARCHITECTURE.md                          # Internal architecture
├── CONTRIBUTING.md                          # Contribution guidelines
├── MIGRATION_GUIDE.md                       # Migration and upgrade guide
├── RFC_SINGLE_RECORD_API.md                 # RFC: Single record API
├── RFC_WITH_DATA_ORCHESTRATOR_REFETCH.md    # RFC: Refetch behaviors
├── RFC_URL_NAVIGATION.md                    # RFC: URL navigation
└── RFC_PAGE_DATA_WRAPPER.md                 # RFC: Page data wrapper
```

---

## 📄 License

This documentation is part of React Proto Kit and is licensed under the MIT License.

---

**Ready to build?** Start with the [Quick Start Guide](../README.md#-quick-start) or dive into the [API Reference](./API_REFERENCE.md) 🚀
