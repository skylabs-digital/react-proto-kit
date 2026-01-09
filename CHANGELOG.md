# [1.34.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.33.0...v1.34.0) (2026-01-09)


### Features

* add overloaded createDomainApi with separate entity and upsert schemas ([c76033f](https://github.com/skylabs-digital/react-proto-kit/commit/c76033fd42f7e93ef9710226b1938701f27cf2d8))

# [1.33.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.32.2...v1.33.0) (2026-01-05)


### Features

* add comprehensive documentation for single record API factories ([378577b](https://github.com/skylabs-digital/react-proto-kit/commit/378577b26c2c676e906e096790263b7bf8977e93))

## [1.32.2](https://github.com/skylabs-digital/react-proto-kit/compare/v1.32.1...v1.32.2) (2026-01-04)


### Bug Fixes

* normalize baseUrl with trailing slash to ensure proper URL resolution in FetchConnector ([4a73a41](https://github.com/skylabs-digital/react-proto-kit/commit/4a73a419ba743f80f090022b69cfd0b7f08f5d1e))

## [1.32.1](https://github.com/skylabs-digital/react-proto-kit/compare/v1.32.0...v1.32.1) (2025-12-27)


### Bug Fixes

* enable useUrlDrawer localStorage tests with mock implementation ([589bf1c](https://github.com/skylabs-digital/react-proto-kit/commit/589bf1cbc644cfba3e90fad38ff1de7aafb62f97))

# [1.32.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.31.1...v1.32.0) (2025-12-19)


### Features

* add support for nested field paths in useFormData hook ([481ecd9](https://github.com/skylabs-digital/react-proto-kit/commit/481ecd938e41f7a720592637eb63c2648ea8b21b))

## [1.31.1](https://github.com/skylabs-digital/react-proto-kit/compare/v1.31.0...v1.31.1) (2025-12-15)


### Bug Fixes

* clear default general error when all field errors are resolved ([3934e6a](https://github.com/skylabs-digital/react-proto-kit/commit/3934e6aae081db827d9d702508b92114ae5669b2))

# [1.31.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.30.1...v1.31.0) (2025-12-15)


### Features

* add dirty field as alias for isDirty in useFormData hook ([162363f](https://github.com/skylabs-digital/react-proto-kit/commit/162363f89291cde017448e841aafb9b755e1c3b7))

## [1.30.1](https://github.com/skylabs-digital/react-proto-kit/compare/v1.30.0...v1.30.1) (2025-12-15)


### Bug Fixes

* remove initialValues from useFormData reset dependency array to prevent stale closures ([e171580](https://github.com/skylabs-digital/react-proto-kit/commit/e1715809f5fdda47c628c5c41afef18db8572588))
* upgrade Node.js to 22.14.0 and pin semantic-release dependencies to prevent version conflicts ([7f4fb6f](https://github.com/skylabs-digital/react-proto-kit/commit/7f4fb6f03e0321532ad7e2cbc68fc3b72d4900e6))

# [1.30.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.29.0...v1.30.0) (2025-12-05)


### Features

* update React peer dependency to v19 and simplify FetchInstance interface ([58c8889](https://github.com/skylabs-digital/react-proto-kit/commit/58c8889e817c58b184b7a6f66acd157fc5336c6d))

# [1.29.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.28.0...v1.29.0) (2025-10-07)


### Bug Fixes

* fix code formatting and whitespace in useById and useList hooks ([5aca880](https://github.com/skylabs-digital/react-proto-kit/commit/5aca880b690fbcfc0d51751eaa6f18fb5110e164))


### Features

* implement stale-while-revalidate data fetching behavior for smoother UI transitions ([c926c8f](https://github.com/skylabs-digital/react-proto-kit/commit/c926c8fbeee1a8579dc7315548eb6adbab11fe05))

# [1.28.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.27.0...v1.28.0) (2025-10-07)


### Features

* update data orchestrator example to use withQuery() for params injection ([002a967](https://github.com/skylabs-digital/react-proto-kit/commit/002a967143d34685f5ad80b7d334d893bc5162e0))

# [1.27.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.26.0...v1.27.0) (2025-10-07)


### Features

* add URL param auto-reset support to data orchestrator and tabs components ([98a524e](https://github.com/skylabs-digital/react-proto-kit/commit/98a524ed7f644dcf8752c423c6a8dd4b79f5cd42))

# [1.26.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.25.1...v1.26.0) (2025-10-07)


### Features

* add HOC pattern with refetch capabilities to data orchestrator ([28bc34d](https://github.com/skylabs-digital/react-proto-kit/commit/28bc34d515d6c97e2e5ff9ce192f5c568d7581ac))

## [1.25.1](https://github.com/skylabs-digital/react-proto-kit/compare/v1.25.0...v1.25.1) (2025-10-07)


### Bug Fixes

* update external dependencies from react-dom to react-router-dom ([5645a44](https://github.com/skylabs-digital/react-proto-kit/commit/5645a44bf0e99a405a745bca8ee8f73a865c9f0c))

# [1.25.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.24.1...v1.25.0) (2025-10-07)


### Features

* add UI components section with snackbar notifications docs and examples ([ef78341](https://github.com/skylabs-digital/react-proto-kit/commit/ef78341618e927c849343d290426c669f4a920bf))

# [1.12.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.11.1...v1.12.0) (2025-09-18)


### Bug Fixes

* initialize loading state to true by default in data fetching hooks ([b82032f](https://github.com/skylabs-digital/react-proto-kit/commit/b82032ff1558147de5fe9fa189ec237c2f665e6e))
* prevent duplicate fetches in useById and useList hooks using ref flags ([b419123](https://github.com/skylabs-digital/react-proto-kit/commit/b419123067da47e7836dec46d3ff9c7966f087af))


### Features

* add nested comments API with CRUD operations and query params support ([58a8d48](https://github.com/skylabs-digital/react-proto-kit/commit/58a8d48b3f5dd6f3a30fa2ed93acd3e33d680e80))
* add PATCH support and upsertSchema for partial resource updates ([2854147](https://github.com/skylabs-digital/react-proto-kit/commit/2854147ba47ea495b690f0022c68570d00f1f535))
* add product and todo testing components with useById mutation examples ([c2983ce](https://github.com/skylabs-digital/react-proto-kit/commit/c2983ce2a19cb4737035ccb090573e0546e05c64))
* add separate entity and upsert schemas with default value support ([4482ffb](https://github.com/skylabs-digital/react-proto-kit/commit/4482ffb35749cc2ea5b4938f189053d4c41386dc))
* add support for nested routes in local storage connector with path params ([41dae70](https://github.com/skylabs-digital/react-proto-kit/commit/41dae7065a313e5e57d89b8a38ef0456d559c505))
* add support for static and dynamic query parameters in API requests ([9e8dd0a](https://github.com/skylabs-digital/react-proto-kit/commit/9e8dd0a86525b0a666043d5fda3f0527fd9530f3))

# [1.12.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.11.1...v1.12.0) (2025-09-17)


### Bug Fixes

* initialize loading state to true by default in data fetching hooks ([b82032f](https://github.com/skylabs-digital/react-proto-kit/commit/b82032ff1558147de5fe9fa189ec237c2f665e6e))
* prevent duplicate fetches in useById and useList hooks using ref flags ([b419123](https://github.com/skylabs-digital/react-proto-kit/commit/b419123067da47e7836dec46d3ff9c7966f087af))


### Features

* add nested comments API with CRUD operations and query params support ([58a8d48](https://github.com/skylabs-digital/react-proto-kit/commit/58a8d48b3f5dd6f3a30fa2ed93acd3e33d680e80))
* add PATCH support and upsertSchema for partial resource updates ([2854147](https://github.com/skylabs-digital/react-proto-kit/commit/2854147ba47ea495b690f0022c68570d00f1f535))
* add separate entity and upsert schemas with default value support ([4482ffb](https://github.com/skylabs-digital/react-proto-kit/commit/4482ffb35749cc2ea5b4938f189053d4c41386dc))
* add support for nested routes in local storage connector with path params ([41dae70](https://github.com/skylabs-digital/react-proto-kit/commit/41dae7065a313e5e57d89b8a38ef0456d559c505))
* add support for static and dynamic query parameters in API requests ([9e8dd0a](https://github.com/skylabs-digital/react-proto-kit/commit/9e8dd0a86525b0a666043d5fda3f0527fd9530f3))

# [1.5.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.4.0...v1.5.0) (2025-09-17)


### Bug Fixes

* initialize loading state to true by default in data fetching hooks ([b82032f](https://github.com/skylabs-digital/react-proto-kit/commit/b82032ff1558147de5fe9fa189ec237c2f665e6e))
* prevent duplicate fetches in useById and useList hooks using ref flags ([b419123](https://github.com/skylabs-digital/react-proto-kit/commit/b419123067da47e7836dec46d3ff9c7966f087af))


### Features

* add nested comments API with CRUD operations and query params support ([58a8d48](https://github.com/skylabs-digital/react-proto-kit/commit/58a8d48b3f5dd6f3a30fa2ed93acd3e33d680e80))
* add PATCH support and upsertSchema for partial resource updates ([2854147](https://github.com/skylabs-digital/react-proto-kit/commit/2854147ba47ea495b690f0022c68570d00f1f535))
* add separate entity and upsert schemas with default value support ([4482ffb](https://github.com/skylabs-digital/react-proto-kit/commit/4482ffb35749cc2ea5b4938f189053d4c41386dc))
* add support for nested routes in local storage connector with path params ([41dae70](https://github.com/skylabs-digital/react-proto-kit/commit/41dae7065a313e5e57d89b8a38ef0456d559c505))
* add support for static and dynamic query parameters in API requests ([9e8dd0a](https://github.com/skylabs-digital/react-proto-kit/commit/9e8dd0a86525b0a666043d5fda3f0527fd9530f3))

# [1.5.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.4.0...v1.5.0) (2025-09-17)


### Bug Fixes

* initialize loading state to true by default in data fetching hooks ([b82032f](https://github.com/skylabs-digital/react-proto-kit/commit/b82032ff1558147de5fe9fa189ec237c2f665e6e))


### Features

* add nested comments API with CRUD operations and query params support ([58a8d48](https://github.com/skylabs-digital/react-proto-kit/commit/58a8d48b3f5dd6f3a30fa2ed93acd3e33d680e80))
* add PATCH support and upsertSchema for partial resource updates ([2854147](https://github.com/skylabs-digital/react-proto-kit/commit/2854147ba47ea495b690f0022c68570d00f1f535))
* add separate entity and upsert schemas with default value support ([4482ffb](https://github.com/skylabs-digital/react-proto-kit/commit/4482ffb35749cc2ea5b4938f189053d4c41386dc))
* add support for nested routes in local storage connector with path params ([41dae70](https://github.com/skylabs-digital/react-proto-kit/commit/41dae7065a313e5e57d89b8a38ef0456d559c505))
* add support for static and dynamic query parameters in API requests ([9e8dd0a](https://github.com/skylabs-digital/react-proto-kit/commit/9e8dd0a86525b0a666043d5fda3f0527fd9530f3))

# [1.5.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.4.0...v1.5.0) (2025-09-17)


### Bug Fixes

* initialize loading state to true by default in data fetching hooks ([b82032f](https://github.com/skylabs-digital/react-proto-kit/commit/b82032ff1558147de5fe9fa189ec237c2f665e6e))


### Features

* add nested comments API with CRUD operations and query params support ([58a8d48](https://github.com/skylabs-digital/react-proto-kit/commit/58a8d48b3f5dd6f3a30fa2ed93acd3e33d680e80))
* add PATCH support and upsertSchema for partial resource updates ([2854147](https://github.com/skylabs-digital/react-proto-kit/commit/2854147ba47ea495b690f0022c68570d00f1f535))
* add separate entity and upsert schemas with default value support ([4482ffb](https://github.com/skylabs-digital/react-proto-kit/commit/4482ffb35749cc2ea5b4938f189053d4c41386dc))
* add support for nested routes in local storage connector with path params ([41dae70](https://github.com/skylabs-digital/react-proto-kit/commit/41dae7065a313e5e57d89b8a38ef0456d559c505))
* add support for static and dynamic query parameters in API requests ([9e8dd0a](https://github.com/skylabs-digital/react-proto-kit/commit/9e8dd0a86525b0a666043d5fda3f0527fd9530f3))

# [1.4.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.3.0...v1.4.0) (2025-08-22)


### Features

* add blog example with backend server and dynamic ID support ([b8f2d06](https://github.com/skylabs-digital/react-proto-kit/commit/b8f2d06600a849213c35d33ea0b314794c0fa135))
* add debug logging and improve optimistic updates in global state management ([fe3f85a](https://github.com/skylabs-digital/react-proto-kit/commit/fe3f85a9564975789ab73727baee6cd81870db6e))
* add global state context with invalidation and optimistic updates ([266967a](https://github.com/skylabs-digital/react-proto-kit/commit/266967aa3ec61ccd72d3876af7bc556591f0fbcf))
* add todo-with-backend example using Express and FetchConnector ([ad7c7bc](https://github.com/skylabs-digital/react-proto-kit/commit/ad7c7bc05550bd0afa633521952a6b4b09fd4a3d))

# [1.3.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.2.0...v1.3.0) (2025-08-21)


### Features

* add forms module with validation and URL state management ([09369d5](https://github.com/skylabs-digital/react-proto-kit/commit/09369d51524c3a1881f03d50602bb01c2a5cb972))

# [1.2.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.1.0...v1.2.0) (2025-08-21)


### Features

* trigger release for npm organization ([3227c93](https://github.com/skylabs-digital/react-proto-kit/commit/3227c930ca2069ee9a9f3715f12bc343f93e32d5))

# [1.1.0](https://github.com/skylabs-digital/react-proto-kit/compare/v1.0.0...v1.1.0) (2025-08-21)


### Features

* add seed data functionality with mock data generation and environment-aware configuration ([561eb9b](https://github.com/skylabs-digital/react-proto-kit/commit/561eb9b1145f856a4700bca1d78477a31c6847e3))
* add seed data functionality with mock data generation and environment-aware configuration ([237a92b](https://github.com/skylabs-digital/react-proto-kit/commit/237a92b8750ecb8714660bedb8662c13a62d71db))

# 1.0.0 (2025-08-21)


### Bug Fixes

* correct repository URLs to skylabs-digital organization ([8401f24](https://github.com/skylabs-digital/react-proto-kit/commit/8401f247b37807f0026102ffec6e811657fd9004))


### Features

* initial implementation of react-proto-kit library ([378de15](https://github.com/skylabs-digital/react-proto-kit/commit/378de1562c76292c0ea2e842d17e139acaae8c6f))
* migrate from TypeBox to Zod with validation support ([ffc76dd](https://github.com/skylabs-digital/react-proto-kit/commit/ffc76dd4d8c17cf854dd236ee7cb09aced0a313f))
