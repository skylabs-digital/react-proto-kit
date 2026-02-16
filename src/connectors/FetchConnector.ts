import { IConnector, ApiResponse, ConnectorConfig, RequestConfig } from '../types';
import { debugLogger } from '../utils/debug';

export class FetchConnector implements IConnector {
  private config: ConnectorConfig;
  private baseUrl: string;

  constructor(config: ConnectorConfig = {}) {
    this.config = {
      timeout: 10000,
      retries: 3,
      errorHandling: 'return',
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    };
    // Store baseUrl as-is, normalization happens in buildUrl
    this.baseUrl = config.baseUrl || '';
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    // Normalize baseUrl and endpoint to handle trailing/leading slashes consistently
    // Works with: http://localhost:3000/api or http://localhost:3000/api/
    const normalizedBase = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const fullUrl = normalizedBase ? `${normalizedBase}/${normalizedEndpoint}` : normalizedEndpoint;
    const url = new URL(fullUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private getSeedDataForEndpoint(endpoint: string): any {
    if (!this.config.seed?.data) {
      return null;
    }

    // Extract collection name from endpoint (e.g., "users/123" -> "users")
    const collection = endpoint.split('/')[0] || endpoint;
    const seedData = this.config.seed.data[collection];

    if (!seedData) {
      return null;
    }

    // If endpoint has ID, return single item, otherwise return array
    const parts = endpoint.split('/').filter(Boolean);
    if (parts.length > 1) {
      // Single item request
      const id = parts[1];
      return seedData.find((item: any) => item.id === id) || null;
    } else {
      // List request
      return seedData;
    }
  }

  private async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const url = this.buildUrl(endpoint, params);

    // Debug log request
    debugLogger.logRequest(method, endpoint, data, params);

    const requestConfig: RequestInit = {
      method,
      headers: {
        ...this.config.headers,
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestConfig.body = JSON.stringify(data);
    }

    // Apply request interceptors
    if (this.config.fetchInstance?.interceptors?.request) {
      const reqConfig: RequestConfig = {
        method,
        url,
        headers: requestConfig.headers as Record<string, string>,
        data,
      };

      for (const interceptor of this.config.fetchInstance.interceptors.request) {
        const result = await interceptor(reqConfig);
        requestConfig.headers = result.headers;
        if (result.data) {
          requestConfig.body = JSON.stringify(result.data);
        }
      }
    }

    let lastError: Error | null = null;
    const maxRetries = this.config.retries || 1;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...requestConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Apply response interceptors
        let processedResponse = response;
        if (this.config.fetchInstance?.interceptors?.response) {
          for (const interceptor of this.config.fetchInstance.interceptors.response) {
            processedResponse = await interceptor(processedResponse);
          }
        }

        // Handle 204 No Content with seed data
        if (processedResponse.status === 204) {
          if (this.config.seed?.behavior?.useOnNoContent) {
            const seedData = this.getSeedDataForEndpoint(endpoint);
            if (seedData) {
              return {
                success: true,
                data: seedData,
                message: 'Using seed data for 204 response',
              };
            }
          }

          // Return null/undefined for 204 if no seed or seed disabled
          return {
            success: true,
            data: null as T,
          };
        }

        const responseData = await processedResponse.json();

        if (!processedResponse.ok) {
          return {
            success: false,
            message: responseData.message || `HTTP ${processedResponse.status}`,
            error: { code: responseData.code || 'HTTP_ERROR' },
            type: responseData.type,
            validation: responseData.validation,
          };
        }

        // Handle different response formats
        let finalResponse;
        if (responseData.success !== undefined) {
          // API already returns our format
          finalResponse = responseData;
        } else {
          // Wrap raw data in our format
          finalResponse = {
            success: true,
            data: responseData,
          };
        }

        // Debug log successful response
        const duration = Date.now() - startTime;
        debugLogger.logResponse(method, endpoint, finalResponse, duration);

        return finalResponse;
      } catch (error) {
        lastError = error as Error;

        // Debug log error
        debugLogger.logError(method, endpoint, error);

        if (error instanceof Error && error.name === 'AbortError') {
          return {
            success: false,
            message: 'Request timeout',
            error: { code: 'TIMEOUT' },
          };
        }

        // If this is the last attempt, don't retry
        if (attempt === maxRetries - 1) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return {
      success: false,
      message: lastError?.message || 'Network error',
      error: { code: 'NETWORK_ERROR' },
    };
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('GET', endpoint, undefined, params);
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('POST', endpoint, data);
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Support dynamic ID: if endpoint doesn't contain ID but data has ID, append it
    let finalEndpoint = endpoint;
    if (data && data.id && !endpoint.includes('/')) {
      finalEndpoint = `${endpoint}/${data.id}`;
    }
    return this.executeRequest<T>('PUT', finalEndpoint, data);
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Support dynamic ID: if endpoint doesn't contain ID but data has ID, append it
    let finalEndpoint = endpoint;
    if (data && data.id && !endpoint.includes('/')) {
      finalEndpoint = `${endpoint}/${data.id}`;
    }
    return this.executeRequest<T>('PATCH', finalEndpoint, data);
  }

  async delete<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Support dynamic ID: if endpoint doesn't contain ID but data has ID, append it
    let finalEndpoint = endpoint;
    if (data && data.id && !endpoint.includes('/')) {
      finalEndpoint = `${endpoint}/${data.id}`;
    }
    return this.executeRequest<T>('DELETE', finalEndpoint);
  }
}
