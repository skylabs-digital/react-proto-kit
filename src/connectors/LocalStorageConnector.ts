import { IConnector, ApiResponse, ConnectorConfig, SuccessResponse, ErrorResponse } from '../types';

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

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      const error: ErrorResponse = {
        success: false,
        message: 'Simulated localStorage error',
        error: { code: 'STORAGE_ERROR' },
      };
      return error;
    }

    const { collection, id } = this.parseEndpoint(endpoint);
    const data = this.getStorageData();
    const collectionData = data[collection] || [];

    if (id) {
      // Get single item
      const item = collectionData.find((item: any) => item.id === id);
      if (!item) {
        return {
          success: false,
          message: 'Item not found',
          error: { code: 'NOT_FOUND' },
        };
      }
      return {
        success: true,
        data: item as T,
      };
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

      return response;
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return {
        success: false,
        message: 'Simulated localStorage error',
        error: { code: 'STORAGE_ERROR' },
      };
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

    return {
      success: true,
      data: newItem as T,
      message: 'Item created successfully',
    };
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return {
        success: false,
        message: 'Simulated localStorage error',
        error: { code: 'STORAGE_ERROR' },
      };
    }

    const { collection, id } = this.parseEndpoint(endpoint);
    if (!id) {
      return {
        success: false,
        message: 'ID is required for update operation',
        error: { code: 'INVALID_REQUEST' },
      };
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

    return {
      success: true,
      data: updatedItem as T,
      message: 'Item updated successfully',
    };
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return {
        success: false,
        message: 'Simulated localStorage error',
        error: { code: 'STORAGE_ERROR' },
      };
    }

    const { collection, id } = this.parseEndpoint(endpoint);
    if (!id) {
      return {
        success: false,
        message: 'ID is required for delete operation',
        error: { code: 'INVALID_REQUEST' },
      };
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

    return {
      success: true,
      data: undefined as T,
      message: 'Item deleted successfully',
    };
  }
}
