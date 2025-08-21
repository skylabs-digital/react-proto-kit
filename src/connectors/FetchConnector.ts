import { IConnector, ApiResponse, ConnectorConfig, RequestConfig } from '../types';

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
    this.baseUrl = config.baseUrl || '';
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, params);
    const requestConfig: RequestInit = {
      method,
      headers: {
        ...this.config.headers,
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
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
        if (responseData.success !== undefined) {
          // API already returns our format
          return responseData;
        } else {
          // Wrap raw data in our format
          return {
            success: true,
            data: responseData,
          };
        }
      } catch (error) {
        lastError = error as Error;

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
    return this.executeRequest<T>('PUT', endpoint, data);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('DELETE', endpoint);
  }
}
