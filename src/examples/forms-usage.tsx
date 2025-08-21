import { z } from 'zod';
import { useFormData, createFormHandler } from '../forms';
import { createEntitySchema } from '../helpers/schemas';

// Example 1: Direct hook usage
const ProductSchema = createEntitySchema({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  inStock: z.boolean(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export function ProductFormDirect() {
  const { values, errors, generalError, handleInputChange, handleSubmit, isValid } = useFormData(
    ProductSchema,
    {
      name: '',
      price: 0,
      category: '',
      inStock: true,
    }
  );

  const onSubmit = handleSubmit(async data => {
    console.log('Form submitted:', data);
    // Here you would typically call your API
    // await productApi.create(data);
  });

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

      <button type="submit" disabled={!isValid}>
        Create Product
      </button>
    </form>
  );
}

// Example 2: Factory pattern usage (consistent with createCrudApi)
const productForm = createFormHandler(ProductSchema);

export function ProductFormFactory() {
  const { values, errors, handleInputChange, handleSubmit, isValid } = productForm.useForm({
    name: '',
    price: 0,
    category: '',
    inStock: true,
  });

  const onSubmit = handleSubmit(async data => {
    console.log('Form submitted via factory:', data);
  });

  return (
    <form onSubmit={onSubmit}>
      {/* Same form structure as above */}
      <div>
        <label>Name:</label>
        <input name="name" type="text" value={values.name || ''} onChange={handleInputChange} />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>

      <button type="submit" disabled={!isValid}>
        Create Product (Factory)
      </button>
    </form>
  );
}

// Example 3: Integration with API
export function ProductFormWithAPI() {
  // This would integrate with your existing createCrudApi
  // const productApi = createCrudApi('products', ProductSchema);

  const { generalError, handleSubmit, reset } = useFormData(ProductSchema);

  const onSubmit = handleSubmit(async data => {
    try {
      // await productApi.create(data);
      console.log('Product created successfully:', data);
      reset(); // Clear form after successful submission
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  });

  return (
    <form onSubmit={onSubmit}>
      {generalError && <div className="error-general">{generalError}</div>}

      {/* Form fields... */}
      <button type="submit">Create Product</button>
    </form>
  );
}
