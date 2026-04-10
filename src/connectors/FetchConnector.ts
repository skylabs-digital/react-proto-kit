import { IConnector, ApiResponse, ConnectorConfig, RequestConfig } from '../types';
import { debugLogger } from '../utils/debug';
import { httpErrorFromResponse, makeNetworkError, makeTimeoutError } from '../utils/errorResponse';

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
    // Works with any host: localhost, domains, and IP addresses (e.g. http://192.168.4.22:3000/api)
    const normalizedBase = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const fullUrl = normalizedBase ? `${normalizedBase}/${normalizedEndpoint}` : normalizedEndpoint;

    if (params) {
      const searchParams = new URLSearchParams();
      const append = (key: string, value: unknown) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      };
      // `filters` is a nested container for equality filters (see ListParams);
      // flatten it onto the query string so `{ filters: { status: 'done' } }`
      // serializes as `?status=done`.
      for (const [key, value] of Object.entries(params)) {
        if (key === 'filters' && value && typeof value === 'object') {
          for (const [fk, fv] of Object.entries(value as Record<string, unknown>)) {
            append(fk, fv);
          }
        } else {
          append(key, value);
        }
      }
      const qs = searchParams.toString();
      return qs ? `${fullUrl}?${qs}` : fullUrl;
    }

    return fullUrl;
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
          return httpErrorFromResponse(processedResponse.status, responseData ?? {});
        }

        let finalResponse;
        if (responseData.success !== undefined) {
          // Ensure SuccessResponse<T> always has a `data` key, even for
          // no-body endpoints like DELETE.
          finalResponse =
            responseData.success === true && !('data' in responseData)
              ? { ...responseData, data: undefined }
              : responseData;
        } else {
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
          return makeTimeoutError();
        }

        // If this is the last attempt, don't retry
        if (attempt === maxRetries - 1) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return makeNetworkError(lastError?.message || 'Network error');
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('GET', endpoint, undefined, params);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('POST', endpoint, data, params);
  }

  async put<T>(
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    // Support dynamic ID: if endpoint doesn't contain ID but data has ID, append it
    let finalEndpoint = endpoint;
    if (data && data.id && !endpoint.includes('/')) {
      finalEndpoint = `${endpoint}/${data.id}`;
    }
    return this.executeRequest<T>('PUT', finalEndpoint, data, params);
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    // Support dynamic ID: if endpoint doesn't contain ID but data has ID, append it
    let finalEndpoint = endpoint;
    if (data && data.id && !endpoint.includes('/')) {
      finalEndpoint = `${endpoint}/${data.id}`;
    }
    return this.executeRequest<T>('PATCH', finalEndpoint, data, params);
  }

  async delete<T>(
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    // Support dynamic ID: if endpoint doesn't contain ID but data has ID, append it
    let finalEndpoint = endpoint;
    if (data && data.id && !endpoint.includes('/')) {
      finalEndpoint = `${endpoint}/${data.id}`;
    }
    return this.executeRequest<T>('DELETE', finalEndpoint, undefined, params);
  }
}
