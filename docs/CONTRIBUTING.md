# Contributing to React Proto Kit

Thank you for your interest in contributing to React Proto Kit! This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful, inclusive, and constructive in all interactions.

### Our Standards

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get started
- **Be constructive**: Provide helpful feedback and suggestions
- **Be collaborative**: Work together towards common goals

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- Yarn >= 1.22.0 (recommended) or npm >= 8.0.0
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/react-proto-kit.git
cd react-proto-kit
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/skylabs-digital/react-proto-kit.git
```

## Development Setup

1. Install dependencies:

```bash
yarn install
```

2. Run tests to ensure everything is working:

```bash
yarn test
```

3. Start the development server:

```bash
yarn dev
```

4. Run examples to test your changes:

```bash
cd examples/todo-with-backend
yarn install
yarn dev
```

## Project Structure

```
react-proto-kit/
├── src/                          # Main source code
│   ├── connectors/              # HTTP and storage connectors
│   ├── context/                 # React context providers
│   ├── factory/                 # Core API factory
│   ├── forms/                   # Form utilities
│   ├── hooks/                   # React hooks
│   ├── navigation/              # URL state management
│   ├── provider/                # Main providers
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Utility functions
├── examples/                     # Example applications
│   ├── todo-with-backend/       # Full-stack example
│   ├── todo-with-global-context/ # Global state example
│   └── blog-with-backend/       # Complex nested resources
├── docs/                        # Documentation
├── dist/                        # Built package (generated)
└── tests/                       # Test files
```

### Key Files

- `src/index.ts` - Main package exports
- `src/factory/createDomainApi.ts` - Core API factory function
- `src/types/index.ts` - Main type definitions
- `package.json` - Package configuration and dependencies
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Build configuration

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements

Examples:
- `feature/add-pagination-support`
- `fix/memory-leak-in-global-state`
- `docs/update-api-reference`

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

Examples:
```
feat(api): add support for nested query parameters
fix(hooks): resolve memory leak in useList hook
docs(readme): update installation instructions
```

### Making Changes

1. Create a new branch from `main`:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following our coding standards
3. Add or update tests as needed
4. Update documentation if necessary
5. Run the full test suite:

```bash
yarn ci
```

6. Commit your changes:

```bash
git add .
git commit -m "feat: add your feature description"
```

7. Push to your fork:

```bash
git push origin feature/your-feature-name
```

## Testing

We maintain high test coverage and require tests for all new features.

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run tests with UI
yarn test:ui
```

### Test Structure

Tests are located in `src/test/` and follow this structure:

```
src/test/
├── factory/
│   └── createDomainApi.test.ts
├── hooks/
│   ├── useList.test.ts
│   └── useQuery.test.ts
├── connectors/
│   ├── FetchConnector.test.ts
│   └── LocalStorageConnector.test.ts
└── utils/
    └── testUtils.ts
```

### Writing Tests

Use the existing test utilities and patterns:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../utils/testUtils';
import { createDomainApi } from '../../factory/createDomainApi';

describe('createDomainApi', () => {
  it('should create API with correct methods', () => {
    const api = createDomainApi('users', userSchema, userSchema);
    
    expect(api.useList).toBeDefined();
    expect(api.useQuery).toBeDefined();
    expect(api.useCreate).toBeDefined();
    expect(api.useUpdate).toBeDefined();
    expect(api.usePatch).toBeDefined();
    expect(api.useDelete).toBeDefined();
  });

  it('should handle list queries correctly', async () => {
    const api = createDomainApi('users', userSchema, userSchema);
    
    const { result } = renderHook(() => api.useList(), {
      wrapper: createTestWrapper()
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

### Test Guidelines

1. **Unit Tests**: Test individual functions and hooks in isolation
2. **Integration Tests**: Test API interactions and data flow
3. **Type Tests**: Ensure TypeScript types work correctly
4. **Error Handling**: Test error scenarios and edge cases
5. **Performance**: Test for memory leaks and performance regressions

## Documentation

### Updating Documentation

Documentation is located in the `docs/` directory and the main `README.md`.

When making changes:

1. Update relevant documentation files
2. Add examples for new features
3. Update API reference if needed
4. Ensure code examples are working

### Documentation Standards

- Use clear, concise language
- Provide working code examples
- Include TypeScript types in examples
- Add links between related sections
- Keep examples up-to-date with the latest API

### Building Documentation

Documentation is built automatically, but you can preview changes:

```bash
# Start documentation server (if available)
yarn docs:dev
```

## Pull Request Process

### Before Submitting

1. Ensure all tests pass: `yarn ci`
2. Update documentation as needed
3. Add changelog entry if applicable
4. Rebase your branch on the latest `main`

### PR Template

When creating a pull request, use this template:

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Updated existing tests

## Documentation
- [ ] Updated README if needed
- [ ] Updated API documentation
- [ ] Added/updated code examples

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] No console.log statements left in code
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: Maintainers review code for quality and standards
3. **Testing**: Changes are tested in various scenarios
4. **Documentation**: Ensure documentation is updated and accurate

### Addressing Feedback

- Respond to all review comments
- Make requested changes in new commits
- Ask for clarification if feedback is unclear
- Be open to suggestions and improvements

## Release Process

Releases are handled by maintainers using semantic versioning:

- **Patch** (1.0.x): Bug fixes and minor improvements
- **Minor** (1.x.0): New features that are backward compatible
- **Major** (x.0.0): Breaking changes

### Changelog

We maintain a changelog following [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [1.2.0] - 2023-12-01

### Added
- New feature for nested query parameters
- Support for custom connectors

### Fixed
- Memory leak in global state management
- Type inference issues with complex schemas

### Changed
- Improved error handling in fetch connector

### Deprecated
- Old API method (will be removed in v2.0.0)
```

## Development Tips

### IDE Setup

Recommended VS Code extensions:

- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Jest Runner
- GitLens

### Debugging

1. **Console Logging**: Use the built-in debug utilities:

```tsx
import { configureDebugLogging } from '@skylabs-digital/react-proto-kit';
configureDebugLogging(true, '[DEBUG]');
```

2. **React DevTools**: Install React DevTools for debugging components
3. **Network Tab**: Monitor API requests in browser dev tools

### Performance

- Use React DevTools Profiler to identify performance issues
- Monitor bundle size with `yarn build` and analyze output
- Test with large datasets to ensure scalability

### Common Issues

1. **Type Errors**: Ensure schemas are properly typed
2. **Memory Leaks**: Clean up subscriptions and listeners
3. **Stale Closures**: Use useCallback and useMemo appropriately
4. **Test Flakiness**: Ensure proper cleanup in tests

## Getting Help

- **Issues**: Create an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Discord**: Join our Discord server for real-time help (if available)
- **Email**: Contact maintainers directly for security issues

## Recognition

Contributors are recognized in:

- GitHub contributors list
- Release notes for significant contributions
- Special mentions in documentation

Thank you for contributing to React Proto Kit! Your efforts help make this tool better for everyone.
