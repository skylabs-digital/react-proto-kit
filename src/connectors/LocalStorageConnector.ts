import { IConnector, ApiResponse, ConnectorConfig, SuccessResponse, ErrorResponse } from '../types';
import { debugLogger } from '../utils/debug';
import { applySchemaDefaults } from '../helpers/schemas';
import { z } from 'zod';

export class LocalStorageConnector implements IConnector {
  private config: ConnectorConfig;
  private storageKey: string;
  private schemas: Map<string, z.ZodSchema> = new Map();

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

  // Method to register schemas for entities
  registerSchema(entity: string, schema: z.ZodSchema): void {
    console.log(`📋 Registering schema for entity: ${entity}`);
    this.schemas.set(entity, schema);
  }

  // Helper to apply schema defaults to data
  private applyDefaults(data: any, entity: string): any {
    const schema = this.schemas.get(entity);
    if (!schema) {
      console.log(
        `🔍 No schema found for entity: ${entity}. Available schemas:`,
        Array.from(this.schemas.keys())
      );
      return data;
    }

    const result = applySchemaDefaults(data, schema);
    console.log(`🔧 Applied defaults for ${entity}:`, { original: data, withDefaults: result });
    return result;
  }

  private async simulateDelay(): Promise<void> {
    if (this.config.simulateDelay && this.config.simulateDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.simulateDelay));
    }
  }

  private shouldSimulateError(): boolean {
    return this.config.errorRate ? Math.random() < this.config.errorRate : false;
  }

  private getStorageData(): Record<string, any> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private setStorageData(data: Record<string, any>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private parseEndpoint(endpoint: string): {
    collection: string;
    id?: string;
    nestedPath?: string[];
  } {
    // Remove query parameters from endpoint before parsing
    const cleanEndpoint = endpoint.split('?')[0];
    const parts = cleanEndpoint.split('/').filter(Boolean);

    // Handle nested paths like 'todos/123/comments' or 'todos/123/comments/456'
    if (parts.length >= 3) {
      // For nested resources like 'todos/123/comments' or 'todos/123/comments/456'
      const parentCollection = parts[0];
      const parentId = parts[1];
      const nestedCollection = parts[2];
      const nestedId = parts[3]; // Optional for DELETE operations

      return {
        collection: parentCollection,
        id: nestedId, // The ID of the nested resource (for DELETE)
        nestedPath: [parentId, nestedCollection], // [parentId, nestedCollection]
      };
    }

    return {
      collection: parts[0] || 'default',
      id: parts[1],
    };
  }

  private getNestedCollection(data: Record<string, any>, path: string[]): any[] {
    let current = data;

    // For nested paths like [todos, 123, comments], we need to:
    // 1. Get the parent collection (todos)
    // 2. Find the parent item by ID (123)
    // 3. Get/create the nested collection (comments)

    if (path.length >= 3) {
      const [parentCollection, parentId, nestedCollection] = path;

      // Ensure parent collection exists
      if (!current[parentCollection]) {
        current[parentCollection] = [];
      }

      // Find the parent item
      const parentItems = current[parentCollection];
      let parentItem = parentItems.find((item: any) => item.id === parentId);

      // If parent item doesn't exist, return empty array instead of creating it
      // This prevents creating phantom parent items during GET operations
      if (!parentItem) {
        return [];
      }

      // Ensure nested collection exists on parent item
      if (!parentItem[nestedCollection]) {
        parentItem[nestedCollection] = [];
      }

      return parentItem[nestedCollection];
    }

    // Fallback for simple paths
    for (const segment of path) {
      if (!current[segment]) {
        current[segment] = {};
      }
      current = current[segment];
    }

    return Array.isArray(current) ? current : [];
  }

  private setNestedCollection(data: Record<string, any>, path: string[], collection: any[]): void {
    // For nested paths like [todos, 123, comments], we need to:
    // 1. Get the parent collection (todos)
    // 2. Find the parent item by ID (123)
    // 3. Set the nested collection (comments) on the parent item

    if (path.length >= 3) {
      const [parentCollection, parentId, nestedCollection] = path;

      // Ensure parent collection exists
      if (!data[parentCollection]) {
        data[parentCollection] = [];
      }

      // Find the parent item
      const parentItems = data[parentCollection];
      let parentItem = parentItems.find((item: any) => item.id === parentId);

      // If parent item doesn't exist, create it
      if (!parentItem) {
        parentItem = { id: parentId };
        parentItems.push(parentItem);
      }

      // Set the nested collection on the parent item
      parentItem[nestedCollection] = collection;
      return;
    }

    // Fallback for simple paths
    let current = data;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = collection;
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

    const { collection, id, nestedPath } = this.parseEndpoint(endpoint);
    const data = this.getStorageData();

    let collectionData: any[];
    if (nestedPath && nestedPath.length > 0) {
      // Handle nested paths like 'todos/123/comments' (without specific comment ID)
      // nestedPath contains [parentId, nestedCollection]
      const [parentId, nestedCollection] = nestedPath;
      const fullPath = [collection, parentId, nestedCollection];
      collectionData = this.getNestedCollection(data, fullPath);
    } else {
      collectionData = data[collection] || [];
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
      // Apply defaults to the retrieved item
      const itemWithDefaults = this.applyDefaults(item, collection);
      const successResponse: SuccessResponse<T> = {
        success: true,
        data: itemWithDefaults as T,
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
      // Apply defaults to all items in the list
      const dataWithDefaults = filteredData.map(item => this.applyDefaults(item, collection));
      const paginatedData = dataWithDefaults.slice(startIndex, endIndex);

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

  async post<T>(endpoint: string, data?: any, entitySchema?: z.ZodSchema): Promise<ApiResponse<T>> {
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

    const { collection, nestedPath } = this.parseEndpoint(endpoint);
    const storageData = this.getStorageData();

    let collectionData: any[];
    let storagePath: string[];

    if (nestedPath && nestedPath.length > 0) {
      // For nested paths like 'users/123/posts', we need to extract the parent ID from the endpoint
      // This will be handled by the API layer that calls this method
      storagePath = [collection, ...nestedPath];
      collectionData = this.getNestedCollection(storageData, storagePath);
    } else {
      storagePath = [collection];
      collectionData = storageData[collection] || [];
    }

    // Apply schema defaults first, then add generated fields
    let dataWithDefaults = data || {};
    if (entitySchema) {
      dataWithDefaults = applySchemaDefaults(dataWithDefaults, entitySchema);
      console.log(`🔧 Applied defaults for ${collection}:`, {
        original: data,
        withDefaults: dataWithDefaults,
      });
    }

    const newItem = {
      ...dataWithDefaults,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    collectionData.push(newItem);

    if (nestedPath && nestedPath.length > 0) {
      this.setNestedCollection(storageData, storagePath, collectionData);
    } else {
      storageData[collection] = collectionData;
    }

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

    const { collection, id: endpointId, nestedPath } = this.parseEndpoint(endpoint);

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

    let collectionData: any[];
    let storagePath: string[];

    if (nestedPath && nestedPath.length > 0) {
      storagePath = [collection, ...nestedPath];
      collectionData = this.getNestedCollection(storageData, storagePath);
    } else {
      storagePath = [collection];
      collectionData = storageData[collection] || [];
    }
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

    if (nestedPath && nestedPath.length > 0) {
      this.setNestedCollection(storageData, storagePath, collectionData);
    } else {
      storageData[collection] = collectionData;
    }

    this.setStorageData(storageData);

    const successResponse: SuccessResponse<T> = {
      success: true,
      data: updatedItem as T,
      message: 'Item updated successfully',
    };
    debugLogger.logResponse('PUT', endpoint, successResponse, Date.now() - startTime);
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

    const { collection, id: endpointId, nestedPath } = this.parseEndpoint(endpoint);

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

    let collectionData: any[];
    let storagePath: string[];

    if (nestedPath && nestedPath.length > 0) {
      storagePath = [collection, ...nestedPath];
      collectionData = this.getNestedCollection(storageData, storagePath);
    } else {
      storagePath = [collection];
      collectionData = storageData[collection] || [];
    }

    const itemIndex = collectionData.findIndex((item: any) => item.id === id);

    if (itemIndex === -1) {
      return {
        success: false,
        message: 'Item not found',
        error: { code: 'NOT_FOUND' },
      };
    }

    collectionData.splice(itemIndex, 1);

    if (nestedPath && nestedPath.length > 0) {
      this.setNestedCollection(storageData, storagePath, collectionData);
    } else {
      storageData[collection] = collectionData;
    }

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
