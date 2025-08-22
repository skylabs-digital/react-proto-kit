import { useEffect } from 'react';
import { z } from 'zod';
import { useFormData, createCrudApi } from '../index';
import { createEntitySchema } from '../helpers/schemas';

const ProductSchema = createEntitySchema({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  inStock: z.boolean(),
  description: z.string().optional(),
});

const productApi = createCrudApi('products', ProductSchema);

// Example 1: Edit form with loadData
export function EditProductForm({ productId }: { productId: string }) {
  const {
    values,
    errors,
    generalError,
    handleInputChange,
    handleSubmit,
    loadData,
    isValid,
    isDirty,
  } = useFormData(ProductSchema);

  // Load existing product data
  const { data: product, loading } = productApi.useById?.(productId) || {
    data: null,
    loading: false,
  };
  const { mutate: updateProduct } = productApi.useUpdate?.(productId) || {
    mutate: async () => {},
  };

  // Pre-fill form when product data loads
  useEffect(() => {
    if (product) {
      loadData(product);
    }
  }, [product, loadData]);

  const onSubmit = handleSubmit(async data => {
    await updateProduct(data);
    console.log('Product updated successfully');
  });

  if (loading) return <div>Loading product...</div>;

  return (
    <form onSubmit={onSubmit}>
      {generalError && <div className="error-general">{generalError}</div>}

      <div>
        <label>Name:</label>
        <input name="name" type="text" value={values.name || ''} onChange={handleInputChange} />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>

      <div>
        <label>Price:</label>
        <input name="price" type="number" value={values.price || ''} onChange={handleInputChange} />
        {errors.price && <span className="error">{errors.price}</span>}
      </div>

      <div>
        <label>Category:</label>
        <select name="category" value={values.category || ''} onChange={handleInputChange}>
          <option value="">Select category</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="books">Books</option>
        </select>
        {errors.category && <span className="error">{errors.category}</span>}
      </div>

      <div>
        <label>
          <input
            name="inStock"
            type="checkbox"
            checked={values.inStock || false}
            onChange={handleInputChange}
          />
          In Stock
        </label>
      </div>

      <div>
        <label>Description:</label>
        <textarea
          name="description"
          value={values.description || ''}
          onChange={handleInputChange}
        />
        {errors.description && <span className="error">{errors.description}</span>}
      </div>

      <button type="submit" disabled={!isValid || !isDirty}>
        Update Product
      </button>
    </form>
  );
}

// Example 2: Edit form with initial values (alternative approach)
export function EditProductFormWithInitial({ productId }: { productId: string }) {
  const { data: product, loading } = productApi.useById?.(productId) || {
    data: null,
    loading: false,
  };

  const { values, errors, handleInputChange, handleSubmit, isValid, isDirty } = useFormData(
    ProductSchema,
    product || {}
  );

  const { mutate: updateProduct } = productApi.useUpdate?.(productId) || {
    mutate: async () => {},
  };

  const onSubmit = handleSubmit(async data => {
    await updateProduct(data);
  });

  if (loading) return <div>Loading...</div>;

  return (
    <form onSubmit={onSubmit}>
      <input name="name" value={values.name || ''} onChange={handleInputChange} />
      {errors.name && <span>{errors.name}</span>}

      <button type="submit" disabled={!isValid || !isDirty}>
        Update Product
      </button>
    </form>
  );
}

// Example 3: Create/Edit form that handles both scenarios
export function ProductForm({ productId }: { productId?: string }) {
  const isEditing = !!productId;

  const { values, errors, handleInputChange, handleSubmit, loadData, reset, isValid, isDirty } =
    useFormData(ProductSchema);

  // API hooks
  const { data: product, loading } = productApi.useById?.(productId || '') || {
    data: null,
    loading: false,
  };
  const { mutate: createProduct } = productApi.useCreate?.() || {
    mutate: async () => {},
  };
  const { mutate: updateProduct } = productApi.useUpdate?.(productId || '') || {
    mutate: async () => {},
  };

  // Load data for editing
  useEffect(() => {
    if (isEditing && product) {
      loadData(product);
    } else if (!isEditing) {
      reset(); // Clear form for create mode
    }
  }, [isEditing, product, loadData, reset]);

  const onSubmit = handleSubmit(async data => {
    if (isEditing && productId) {
      await updateProduct(data);
    } else {
      await createProduct(data);
    }
  });

  if (isEditing && loading) return <div>Loading...</div>;

  return (
    <form onSubmit={onSubmit}>
      <h2>{isEditing ? 'Edit Product' : 'Create Product'}</h2>

      <input
        name="name"
        placeholder="Product name"
        value={values.name || ''}
        onChange={handleInputChange}
      />
      {errors.name && <span>{errors.name}</span>}

      <button type="submit" disabled={!isValid || (isEditing && !isDirty)}>
        {isEditing ? 'Update' : 'Create'} Product
      </button>
    </form>
  );
}
