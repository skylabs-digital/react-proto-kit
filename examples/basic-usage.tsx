import React from 'react';
import {
  ApiClientProvider,
  createEntitySchema,
  createCrudApi,
  createCreateSchema,
  createUpdateSchema,
  z,
} from '../src/index';

// 1. Define your schema (only manual step)
const ProductSchema = createEntitySchema({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  inStock: z.boolean(),
});

// 2. Generate create/update schemas with validation
const ProductCreateSchema = createCreateSchema(ProductSchema);
const ProductUpdateSchema = createUpdateSchema(ProductSchema);

// 3. Create API with validation
const productApi = createCrudApi('products', ProductSchema, {
  createSchema: ProductCreateSchema,
  updateSchema: ProductUpdateSchema,
});

// 3. Use in components (zero config)
function ProductList() {
  const { data: products, loading, error } = productApi.useList!();
  const createProduct = productApi.useCreate!();

  const handleCreate = async () => {
    try {
      await createProduct.mutate({
        name: 'New Product',
        price: 99.99,
        category: 'Electronics',
        inStock: true,
      });
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Products</h2>
      <button onClick={handleCreate} disabled={createProduct.loading}>
        {createProduct.loading ? 'Creating...' : 'Add Product'}
      </button>
      <ul>
        {products?.map(product => (
          <li key={product.id}>
            {product.name} - ${product.price}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProductDetail({ productId }: { productId: string }) {
  const { data: product, loading } = productApi.useById!(productId);
  const updateProduct = productApi.useUpdate!(productId);
  const deleteProduct = productApi.useDelete!(productId);

  const handleUpdate = async () => {
    try {
      await updateProduct.mutate({ price: 89.99 });
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct.mutate();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  if (loading) return <div>Loading product...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div>
      <h3>{product.name}</h3>
      <p>Price: ${product.price}</p>
      <p>Category: {product.category}</p>
      <p>In Stock: {product.inStock ? 'Yes' : 'No'}</p>

      <button onClick={handleUpdate} disabled={updateProduct.loading}>
        Update Price
      </button>
      <button onClick={handleDelete} disabled={deleteProduct.loading}>
        Delete Product
      </button>
    </div>
  );
}

// App with provider setup
export function BasicUsageExample() {
  return (
    <ApiClientProvider connectorType="localStorage">
      <div>
        <h1>Basic Usage Example</h1>
        <ProductList />
        <ProductDetail productId="1" />
      </div>
    </ApiClientProvider>
  );
}
