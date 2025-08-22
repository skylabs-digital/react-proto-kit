// Debug logging utility for API calls
interface DebugConfig {
  enabled: boolean;
  prefix?: string;
}

class DebugLogger {
  private config: DebugConfig = {
    enabled: false,
    prefix: '[API-CLIENT]',
  };

  private isTestEnvironment(): boolean {
    return (
      typeof process !== 'undefined' &&
      (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true')
    );
  }

  configure(config: Partial<DebugConfig>) {
    this.config = { ...this.config, ...config };
  }

  logRequest(method: string, endpoint: string, data?: any) {
    if (!this.config.enabled || this.isTestEnvironment()) return;

    const timestamp = new Date().toISOString();
    console.group(`${this.config.prefix} ${method} ${endpoint}`);
    console.log(`🕐 ${timestamp}`);
    console.log(`📤 Request:`, { method, endpoint, data });
    console.groupEnd();
  }

  logResponse(method: string, endpoint: string, response: any, duration?: number) {
    if (!this.config.enabled || this.isTestEnvironment()) return;

    const timestamp = new Date().toISOString();
    const status = response.success ? '✅' : '❌';
    const durationText = duration ? ` (${duration}ms)` : '';

    console.group(`${this.config.prefix} ${method} ${endpoint} ${status}${durationText}`);
    console.log(`🕐 ${timestamp}`);
    console.log(`📥 Response:`, response);
    console.groupEnd();
  }

  logError(method: string, endpoint: string, error: any) {
    if (!this.config.enabled || this.isTestEnvironment()) return;

    const timestamp = new Date().toISOString();
    console.group(`${this.config.prefix} ${method} ${endpoint} ❌ ERROR`);
    console.log(`🕐 ${timestamp}`);
    console.error(`💥 Error:`, error);
    console.groupEnd();
  }

  logCacheHit(entity: string, key: string) {
    if (!this.config.enabled || this.isTestEnvironment()) return;

    console.log(`${this.config.prefix} 🎯 Cache HIT: ${entity}/${key}`);
  }

  logCacheMiss(entity: string, key: string) {
    if (!this.config.enabled || this.isTestEnvironment()) return;

    console.log(`${this.config.prefix} 🔍 Cache MISS: ${entity}/${key}`);
  }

  logInvalidation(entity: string, relatedEntities?: string[]) {
    if (!this.config.enabled || this.isTestEnvironment()) return;

    const related = relatedEntities?.length ? ` + ${relatedEntities.join(', ')}` : '';
    console.log(`${this.config.prefix} 🔄 Invalidating: ${entity}${related}`);
  }

  logValidationError(input: any, validationError: any, formattedErrors: any) {
    if (!this.config.enabled || this.isTestEnvironment()) return;

    console.group('🚫 Validation Error');
    console.error('Input data:', input);
    console.error('Schema validation failed:', validationError.issues);
    console.error('Formatted errors:', formattedErrors);
    console.groupEnd();
  }

  logMutationError(error: any, input: any) {
    if (!this.config.enabled || this.isTestEnvironment()) return;

    console.group('❌ Mutation Error');
    console.error('Error details:', error);
    console.error('Input data:', input);
    console.groupEnd();
  }
}

// Global debug logger instance
export const debugLogger = new DebugLogger();

// Configuration function for easy setup
export function configureDebugLogging(enabled: boolean, prefix?: string) {
  debugLogger.configure({ enabled, prefix });
}
