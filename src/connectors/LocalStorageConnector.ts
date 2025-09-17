import { IConnector, ApiResponse, ConnectorConfig, SuccessResponse, ErrorResponse } from '../types';
import { debugLogger } from '../utils/debug';

export class LocalStorageConnector implements IConnector {
  private config: ConnectorConfig;
  private storageKey: string;

  constructor(config: ConnectorConfig = {}) {
    this.config = {
      simulateDelay: 100,
      errorRate: 0,
      errorHandling: 'return',
      ...config,
    };
    this.storageKey = 'api_client_data';

    // Initialize seed data if configured
    this.initializeSeedData();
  }

  private async simulateDelay(): Promise<void> {
    if (this.config.simulateDelay && this.config.simulateDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.simulateDelay));
    }
  }

  private shouldSimulateError(): boolean {
    return this.config.errorRate ? Math.random() < this.config.errorRate : false;
  }

  private getStorageData(): Record<string, any[]> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private setStorageData(data: Record<string, any[]>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private parseEndpoint(endpoint: string): {
    collection: string;
    id?: string;
    pathParams?: Record<string, string>;
  } {
    const parts = endpoint.split('/').filter(Boolean);

    if (parts.length <= 2) {
      // Simple case: collection or collection/id
      return {
        collection: parts[0] || 'default',
        id: parts[1],
      };
    }

    // Nested case: convert to flat collection name and extract path params
    // todos/123/comments -> collection: 'todos_comments', pathParams: { todosId: '123' }
    // todos/123/comments/456 -> collection: 'todos_comments', id: '456', pathParams: { todosId: '123' }
    // users/123/posts/456/comments -> collection: 'users_posts_comments', pathParams: { usersId: '123', postsId: '456' }
    // users/123/posts/456/comments/789 -> collection: 'users_posts_comments', id: '789', pathParams: { usersId: '123', postsId: '456' }

    const pathParams: Record<string, string> = {};
    const collectionParts: string[] = [];

    // Determine if the last part is an ID (path has even length)
    const hasTargetId = parts.length % 2 === 0;
    const processingLength = hasTargetId ? parts.length - 1 : parts.length;

    for (let i = 0; i < processingLength; i++) {
      if (i % 2 === 0) {
        // Even indices are collection names
        collectionParts.push(parts[i]);
      } else {
        // Odd indices are path parameter IDs
        const paramName = collectionParts[collectionParts.length - 1] + 'Id';
        pathParams[paramName] = parts[i];
      }
    }

    // The final collection name is all collection parts joined with underscore
    const collection = collectionParts.join('_');

    // If the last part is an ID, use it as the target ID
    const id = hasTargetId ? parts[parts.length - 1] : undefined;

    return {
      collection,
      id,
      pathParams: Object.keys(pathParams).length > 0 ? pathParams : undefined,
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private initializeSeedData(): void {
    if (this.config.seed?.data) {
      const existingData = this.getStorageData();
      const hasData = Object.keys(existingData).some(key => existingData[key].length > 0);

      if (!hasData) {
        this.setStorageData(this.config.seed.data);
      }
    }
  }

  async get<T>(endpoint: string, params?: any): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    debugLogger.logRequest('GET', endpoint, undefined, params);

    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      const error: ErrorResponse = {
        success: false,
        message: 'Simulated localStorage error',
        error: { code: 'STORAGE_ERROR' },
      };
      debugLogger.logResponse('GET', endpoint, error, Date.now() - startTime);
      return error;
    }

    const { collection, id, pathParams } = this.parseEndpoint(endpoint);
    const data = this.getStorageData();

    // Get collection data (now always flat)
    let collectionData = data[collection] || [];

    // Filter by path params if they exist
    if (pathParams) {
      collectionData = collectionData.filter((item: any) => {
        return Object.entries(pathParams).every(([key, value]) => item[key] === value);
      });
    }

    if (id) {
      // Get single item
      const item = collectionData.find((item: any) => item.id === id);
      if (!item) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Item not found',
          error: { code: 'NOT_FOUND' },
        };
        debugLogger.logResponse('GET', endpoint, errorResponse, Date.now() - startTime);
        return errorResponse;
      }
      const successResponse: SuccessResponse<T> = {
        success: true,
        data: item as T,
      };
      debugLogger.logResponse('GET', endpoint, successResponse, Date.now() - startTime);
      return successResponse;
    } else {
      // Get list with optional pagination and filtering
      let filteredData = [...collectionData];

      // Apply filters
      if (params?.filters) {
        filteredData = filteredData.filter(item => {
          return Object.entries(params.filters).every(([key, value]) => {
            return item[key] === value;
          });
        });
      }

      // Apply pagination
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      const response: SuccessResponse<T> = {
        success: true,
        data: paginatedData as T,
        meta: {
          total: filteredData.length,
          page,
          limit,
          totalPages: Math.ceil(filteredData.length / limit),
        },
      };

      debugLogger.logResponse('GET', endpoint, response, Date.now() - startTime);
      return response;
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    debugLogger.logRequest('POST', endpoint, data);

    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Simulated localStorage error',
        error: { code: 'STORAGE_ERROR' },
      };
      debugLogger.logResponse('POST', endpoint, errorResponse, Date.now() - startTime);
      return errorResponse;
    }

    const { collection, pathParams } = this.parseEndpoint(endpoint);
    const storageData = this.getStorageData();

    const newItem = {
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Add path params as fields in the item
      ...(pathParams || {}),
    };

    // Get or create collection
    const collectionData = storageData[collection] || [];
    collectionData.push(newItem);
    storageData[collection] = collectionData;
    this.setStorageData(storageData);

    const successResponse: SuccessResponse<T> = {
      success: true,
      data: newItem as T,
      message: 'Item created successfully',
    };
    debugLogger.logResponse('POST', endpoint, successResponse, Date.now() - startTime);
    return successResponse;
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    debugLogger.logRequest('PUT', endpoint, data);

    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Simulated localStorage error',
        error: { code: 'STORAGE_ERROR' },
      };
      debugLogger.logResponse('PUT', endpoint, errorResponse, Date.now() - startTime);
      return errorResponse;
    }

    const { collection, id: endpointId, pathParams } = this.parseEndpoint(endpoint);

    // Support dynamic ID: extract from endpoint or from data payload
    const id = endpointId || (data && data.id);

    if (!id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'ID is required for update operation (either in endpoint or data payload)',
        error: { code: 'INVALID_REQUEST' },
      };
      debugLogger.logResponse('PUT', endpoint, errorResponse, Date.now() - startTime);
      return errorResponse;
    }

    const storageData = this.getStorageData();
    let collectionData = storageData[collection] || [];

    // Filter by path params if they exist
    if (pathParams) {
      collectionData = collectionData.filter((item: any) => {
        return Object.entries(pathParams).every(([key, value]) => item[key] === value);
      });
    }

    const itemIndex = collectionData.findIndex((item: any) => item.id === id);

    if (itemIndex === -1) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Item not found',
        error: { code: 'NOT_FOUND' },
      };
      debugLogger.logResponse('PUT', endpoint, errorResponse, Date.now() - startTime);
      return errorResponse;
    }

    const updatedItem = {
      ...data,
      id,
      updatedAt: new Date().toISOString(),
      createdAt: collectionData[itemIndex].createdAt,
      // Preserve path params
      ...(pathParams || {}),
    };

    collectionData[itemIndex] = updatedItem;
    storageData[collection] = collectionData;
    this.setStorageData(storageData);

    const successResponse: SuccessResponse<T> = {
      success: true,
      data: updatedItem as T,
      message: 'Item updated successfully',
    };
    debugLogger.logResponse('PUT', endpoint, successResponse, Date.now() - startTime);
    return successResponse;
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    debugLogger.logRequest('PATCH', endpoint, data);

    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Simulated localStorage error',
        error: { code: 'STORAGE_ERROR' },
      };
      debugLogger.logResponse('PATCH', endpoint, errorResponse, Date.now() - startTime);
      return errorResponse;
    }

    const { collection, id: endpointId, pathParams } = this.parseEndpoint(endpoint);

    // Support dynamic ID: extract from endpoint or from data payload
    const id = endpointId || (data && data.id);

    if (!id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'ID is required for patch operation (either in endpoint or data payload)',
        error: { code: 'INVALID_REQUEST' },
      };
      debugLogger.logResponse('PATCH', endpoint, errorResponse, Date.now() - startTime);
      return errorResponse;
    }

    const storageData = this.getStorageData();
    let collectionData = storageData[collection] || [];

    // Filter by path params if they exist
    if (pathParams) {
      collectionData = collectionData.filter((item: any) => {
        return Object.entries(pathParams).every(([key, value]) => item[key] === value);
      });
    }

    const itemIndex = collectionData.findIndex((item: any) => item.id === id);

    if (itemIndex === -1) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Item not found',
        error: { code: 'NOT_FOUND' },
      };
      debugLogger.logResponse('PATCH', endpoint, errorResponse, Date.now() - startTime);
      return errorResponse;
    }

    const updatedItem = {
      ...collectionData[itemIndex],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
      // Preserve path params
      ...(pathParams || {}),
    };

    collectionData[itemIndex] = updatedItem;
    storageData[collection] = collectionData;
    this.setStorageData(storageData);

    const successResponse: SuccessResponse<T> = {
      success: true,
      data: updatedItem as T,
      message: 'Item updated successfully',
    };
    debugLogger.logResponse('PATCH', endpoint, successResponse, Date.now() - startTime);
    return successResponse;
  }

  async delete<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    debugLogger.logRequest('DELETE', endpoint, data);

    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Simulated localStorage error',
        error: { code: 'STORAGE_ERROR' },
      };
      debugLogger.logResponse('DELETE', endpoint, errorResponse, Date.now() - startTime);
      return errorResponse;
    }

    const { collection, id: endpointId, pathParams } = this.parseEndpoint(endpoint);

    // Support dynamic ID: extract from endpoint or from data payload
    const id = endpointId || (data && data.id);

    if (!id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'ID is required for delete operation (either in endpoint or data payload)',
        error: { code: 'INVALID_REQUEST' },
      };
      debugLogger.logResponse('DELETE', endpoint, errorResponse, Date.now() - startTime);
      return errorResponse;
    }

    const storageData = this.getStorageData();
    const originalCollectionData = storageData[collection] || [];
    let collectionData = [...originalCollectionData]; // Create a copy to avoid mutating original

    // Filter by path params if they exist
    if (pathParams) {
      collectionData = collectionData.filter((item: any) => {
        return Object.entries(pathParams).every(([key, value]) => item[key] === value);
      });
    }

    const itemIndex = collectionData.findIndex((item: any) => item.id === id);

    if (itemIndex === -1) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Item not found',
        error: { code: 'NOT_FOUND' },
      };
      debugLogger.logResponse('DELETE', endpoint, errorResponse, Date.now() - startTime);
      return errorResponse;
    }

    // Remove item from the filtered collection
    collectionData.splice(itemIndex, 1);

    // Update storage - we need to update the full collection, not just the filtered one
    const fullCollectionData = [...originalCollectionData]; // Use original data, not mutated
    const fullItemIndex = fullCollectionData.findIndex((item: any) => item.id === id);

    if (fullItemIndex !== -1) {
      fullCollectionData.splice(fullItemIndex, 1);
      storageData[collection] = fullCollectionData;
      this.setStorageData(storageData);
    }

    const successResponse: SuccessResponse<T> = {
      success: true,
      data: undefined as T,
      message: 'Item deleted successfully',
    };
    debugLogger.logResponse('DELETE', endpoint, successResponse, Date.now() - startTime);
    return successResponse;
  }
}
