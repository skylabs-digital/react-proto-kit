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

  private parseEndpoint(endpoint: string): { collection: string; id?: string } {
    const parts = endpoint.split('/').filter(Boolean);
    return {
      collection: parts[0] || 'default',
      id: parts[1],
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private initializeSeedData(): void {
    if (!this.config.seed?.data || !this.config.seed?.behavior?.initializeEmpty) {
      return;
    }

    const existingData = this.getStorageData();
    const seedData = this.config.seed.data;
    const mergeStrategy = this.config.seed.behavior?.mergeStrategy || 'merge';

    Object.entries(seedData).forEach(([collection, items]) => {
      const existingCollection = existingData[collection] || [];

      if (existingCollection.length === 0 || mergeStrategy === 'replace') {
        // Initialize empty collection or replace existing
        existingData[collection] = items.map(item => ({
          ...item,
          id: item.id || this.generateId(),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        }));
      } else if (mergeStrategy === 'append') {
        // Append seed data to existing
        const newItems = items.map(item => ({
          ...item,
          id: item.id || this.generateId(),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        }));
        existingData[collection] = [...existingCollection, ...newItems];
      }
      // For 'merge' strategy with existing data, we don't add seed data
    });

    this.setStorageData(existingData);
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    debugLogger.logRequest('GET', endpoint, params);

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

    const { collection, id } = this.parseEndpoint(endpoint);
    const data = this.getStorageData();
    const collectionData = data[collection] || [];

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

    const { collection } = this.parseEndpoint(endpoint);
    const storageData = this.getStorageData();
    const collectionData = storageData[collection] || [];

    const newItem = {
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

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

    const { collection, id: endpointId } = this.parseEndpoint(endpoint);

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
    const collectionData = storageData[collection] || [];
    const itemIndex = collectionData.findIndex((item: any) => item.id === id);

    if (itemIndex === -1) {
      return {
        success: false,
        message: 'Item not found',
        error: { code: 'NOT_FOUND' },
      };
    }

    const updatedItem = {
      ...collectionData[itemIndex],
      ...data,
      updatedAt: new Date().toISOString(),
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

    const { collection, id: endpointId } = this.parseEndpoint(endpoint);

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
    const collectionData = storageData[collection] || [];
    const itemIndex = collectionData.findIndex((item: any) => item.id === id);

    if (itemIndex === -1) {
      return {
        success: false,
        message: 'Item not found',
        error: { code: 'NOT_FOUND' },
      };
    }

    // For PATCH, only update the provided fields (partial update)
    const patchedItem = {
      ...collectionData[itemIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    collectionData[itemIndex] = patchedItem;
    storageData[collection] = collectionData;
    this.setStorageData(storageData);

    const successResponse: SuccessResponse<T> = {
      success: true,
      data: patchedItem as T,
      message: 'Item patched successfully',
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

    const { collection, id: endpointId } = this.parseEndpoint(endpoint);

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
    const collectionData = storageData[collection] || [];
    const itemIndex = collectionData.findIndex((item: any) => item.id === id);

    if (itemIndex === -1) {
      return {
        success: false,
        message: 'Item not found',
        error: { code: 'NOT_FOUND' },
      };
    }

    collectionData.splice(itemIndex, 1);
    storageData[collection] = collectionData;
    this.setStorageData(storageData);

    const successResponse: SuccessResponse<T> = {
      success: true,
      data: undefined as T,
      message: 'Item deleted successfully',
    };
    debugLogger.logResponse('DELETE', endpoint, successResponse, Date.now() - startTime);
    return successResponse;
  }
}
