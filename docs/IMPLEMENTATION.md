# Technical Implementation Guide

## 🏗️ Architecture Overview

This document contains the technical implementation details for developers working on the library itself, not for end users.

## 🔧 Build & Development Setup

### Prerequisites
- Node.js 18+
- Yarn package manager
- TypeScript 5+

### Development Commands
```bash
yarn install          # Install dependencies
yarn build            # Build library
yarn test             # Run test suite
yarn test:watch       # Watch mode for tests
yarn coverage         # Generate coverage report
yarn lint             # Lint code
yarn format           # Format code with Prettier
```

### Project Structure
```
src/
├── connectors/        # Data layer implementations
│   ├── FetchConnector.ts      # HTTP/REST connector
│   └── LocalStorageConnector.ts # Development connector
├── factory/           # API generation logic
│   └── createDomainApi.ts     # Core factory function
├── helpers/           # Utility functions
│   └── schemas.ts             # Schema helper functions
├── hooks/             # React hooks implementation
│   ├── useQuery.ts            # GET operations
│   └── useMutation.ts         # POST/PUT/DELETE operations
├── provider/          # React context provider
│   └── ApiClientProvider.tsx  # Global configuration
├── types/             # TypeScript definitions
└── test/              # Test suites
```

## 🔌 Connector System Implementation

### Interface Contract
```typescript
interface IConnector {
  get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>>;
  put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>>;
  delete<T>(endpoint: string): Promise<ApiResponse<T>>;
}
```

### LocalStorage Connector Details
- **Storage Key Pattern**: `api_cache_{endpoint}_{method}`
- **Data Structure**: JSON serialized with metadata
- **Simulation Logic**: Configurable delays and error rates
- **Persistence**: Browser localStorage API

### Fetch Connector Details
- **HTTP Methods**: Standard REST verbs
- **Error Handling**: HTTP status code mapping
- **Retry Logic**: Exponential backoff
- **Timeout Management**: Configurable per request

## 🏭 Factory Implementation

### Code Generation Process
1. **Schema Analysis**: Determines available operations based on provided schemas
2. **Hook Generation**: Creates React hooks for each operation
3. **Type Inference**: Generates TypeScript types from schemas
4. **Endpoint Mapping**: Maps operations to REST endpoints
5. **Validation Integration**: Adds runtime validation with TypeBox

### REST Endpoint Mapping
```typescript
const endpointMap = {
  list: { method: 'GET', path: '/{entity}' },
  byId: { method: 'GET', path: '/{entity}/{id}' },
  create: { method: 'POST', path: '/{entity}' },
  update: { method: 'PUT', path: '/{entity}/{id}' },
  delete: { method: 'DELETE', path: '/{entity}/{id}' }
};
```

## 🎣 Hook Implementation Details

### useQuery Hook
- **State Management**: Internal state for data, loading, error
- **Caching**: Simple in-memory cache with TTL
- **Refetch Logic**: Manual and automatic refresh capabilities
- **Error Boundaries**: Proper error propagation

### useMutation Hook
- **Optimistic Updates**: Optional optimistic UI updates
- **Error Recovery**: Rollback mechanisms
- **Loading States**: Fine-grained loading indicators
- **Side Effects**: Success/error callbacks

## 📊 Response Envelope System

### Success Response Structure
```typescript
interface SuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}
```

### Error Response Structure
```typescript
interface ErrorResponse {
  success: false;
  error?: { code: string };
  message?: string;
  type?: 'AUTH' | 'VALIDATION' | 'TRANSACTION' | 'NAVIGATION';
  validation?: Record<string, string>;
}
```

## 🛡️ Validation System

### Input Validation
- **Pre-request**: Validates data before sending to server
- **Schema-based**: Uses TypeBox schemas for validation
- **Error Messages**: Descriptive validation error messages

### Output Validation
- **Response Validation**: Validates server responses
- **Type Safety**: Ensures runtime type safety
- **Fallback Handling**: Graceful degradation for invalid data

## 🔄 Provider Context Implementation

### Context Structure
```typescript
interface ApiClientContext {
  connector: IConnector;
  config: ConnectorConfig;
}
```

### Configuration Management
- **Environment-based**: Different configs per environment
- **Runtime Override**: Dynamic configuration changes
- **Validation**: Config validation on provider mount

## 🧪 Testing Strategy

### Unit Tests
- **Connector Tests**: Mock HTTP requests and localStorage
- **Hook Tests**: React Testing Library with custom providers
- **Factory Tests**: Schema validation and code generation
- **Validation Tests**: Input/output validation scenarios

### Integration Tests
- **End-to-end**: Full workflow testing
- **Error Scenarios**: Network failures, validation errors
- **Performance**: Load testing with large datasets

### Test Utilities
```typescript
// Custom test provider wrapper
const createTestWrapper = (config?: Partial<ConnectorConfig>) => {
  return ({ children }: { children: React.ReactNode }) => (
    <ApiClientProvider connectorType="localStorage" config={config}>
      {children}
    </ApiClientProvider>
  );
};
```

## 🚀 Build Process

### TypeScript Compilation
- **Target**: ES2020 for modern browser support
- **Module**: ESM and CommonJS dual build
- **Declaration Files**: Full TypeScript definitions

### Bundle Configuration
- **Vite**: Modern build tool for development and production
- **Tree Shaking**: Dead code elimination
- **Code Splitting**: Separate chunks for connectors

### Distribution
- **NPM Package**: Published to npm registry
- **Versioning**: Semantic versioning
- **Changelog**: Automated changelog generation

## 🔧 Development Workflow

### Code Style
- **ESLint**: Strict linting rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality

### Git Workflow
- **Feature Branches**: All development in feature branches
- **Pull Requests**: Code review required
- **Conventional Commits**: Standardized commit messages

### Release Process
1. **Version Bump**: Update package.json version
2. **Build**: Generate production build
3. **Test**: Full test suite execution
4. **Publish**: NPM package publication
5. **Tag**: Git tag for release

## 📈 Performance Considerations

### Bundle Size
- **Tree Shaking**: Only import what you use
- **Dynamic Imports**: Lazy load connectors
- **Minimal Dependencies**: Keep external deps minimal

### Runtime Performance
- **Memoization**: Hook result caching
- **Debouncing**: Request debouncing for rapid calls
- **Connection Pooling**: HTTP connection reuse

### Memory Management
- **Cleanup**: Proper cleanup in useEffect
- **Weak References**: Avoid memory leaks
- **Cache Limits**: Bounded cache sizes

## 🐛 Debugging

### Development Tools
- **Console Logging**: Detailed request/response logs
- **Error Boundaries**: Graceful error handling
- **DevTools Integration**: React DevTools support

### Common Issues
- **CORS**: Cross-origin request configuration
- **Authentication**: Token management patterns
- **Rate Limiting**: Request throttling strategies

## 🔮 Future Enhancements

### Planned Features
- **GraphQL Connector**: GraphQL support
- **Offline Support**: Service worker integration
- **Real-time**: WebSocket connector
- **CLI Tools**: Code generation utilities

### Architecture Evolution
- **Plugin System**: Extensible architecture
- **Middleware**: Request/response middleware
- **Caching Strategies**: Advanced caching options
