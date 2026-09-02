/**
 * OpenAPI 3.0 spec for the Bidshop API.
 *
 * Served at:
 *   - /api-docs        – interactive Swagger UI
 *   - /openapi.json    – raw JSON spec (handy for test tooling)
 */
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Bidshop API',
    version: '1.0.0',
    description:
      'Sample food-supply e-commerce API used for the Bidfood SDET technical test. ' +
      'All data is held in memory and reset each time the server restarts.',
    contact: { name: 'Bidfood Engineering' },
  },
  servers: [
    { url: 'http://localhost:4000', description: 'Local dev server' },
  ],
  tags: [
    { name: 'Health', description: 'Service health' },
    { name: 'Auth', description: 'Register, login, current user' },
    { name: 'Products', description: 'Browse the product catalogue' },
    { name: 'Cart', description: 'Manage the authenticated user\'s cart' },
    { name: 'Orders', description: 'Place and retrieve orders' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the token returned from /auth/login or /auth/register.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Something went wrong' },
        },
        required: ['error'],
      },
      AuthUser: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
        },
        required: ['id', 'email', 'name'],
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/AuthUser' },
        },
        required: ['token', 'user'],
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'p-001' },
          name: { type: 'string' },
          description: { type: 'string' },
          category: {
            type: 'string',
            enum: [
              'Fresh Produce',
              'Meat & Poultry',
              'Dairy',
              'Seafood',
              'Pantry',
              'Frozen',
              'Beverages',
              'Bakery',
            ],
          },
          price: { type: 'number', format: 'float', example: 14.5 },
          unit: { type: 'string', example: '500g' },
          stock: { type: 'integer', example: 40 },
          imageUrl: { type: 'string', format: 'uri' },
        },
        required: ['id', 'name', 'description', 'category', 'price', 'unit', 'stock', 'imageUrl'],
      },
      ProductList: {
        type: 'object',
        properties: {
          count: { type: 'integer' },
          items: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
        },
        required: ['count', 'items'],
      },
      CartLine: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 },
          name: { type: 'string' },
          unit: { type: 'string' },
          unitPrice: { type: 'number', format: 'float' },
          lineTotal: { type: 'number', format: 'float' },
          imageUrl: { type: 'string', format: 'uri' },
        },
        required: ['productId', 'quantity', 'name', 'unit', 'unitPrice', 'lineTotal'],
      },
      Cart: {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'uuid' },
          items: { type: 'array', items: { $ref: '#/components/schemas/CartLine' } },
          subtotal: { type: 'number', format: 'float' },
          gst: { type: 'number', format: 'float', description: 'GST at 15%' },
          total: { type: 'number', format: 'float' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['userId', 'items', 'subtotal', 'gst', 'total', 'updatedAt'],
      },
      OrderItem: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          name: { type: 'string' },
          unitPrice: { type: 'number', format: 'float' },
          quantity: { type: 'integer' },
          lineTotal: { type: 'number', format: 'float' },
        },
        required: ['productId', 'name', 'unitPrice', 'quantity', 'lineTotal'],
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          subtotal: { type: 'number', format: 'float' },
          gst: { type: 'number', format: 'float' },
          total: { type: 'number', format: 'float' },
          customer: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              address: { type: 'string' },
              city: { type: 'string' },
              postcode: { type: 'string', pattern: '^\\d{4}$' },
            },
            required: ['name', 'email', 'address', 'city', 'postcode'],
          },
          status: { type: 'string', enum: ['PENDING', 'CONFIRMED'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'userId', 'items', 'subtotal', 'gst', 'total', 'customer', 'status', 'createdAt'],
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        responses: {
          '200': {
            description: 'Service is up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'bidshop-api' },
                    time: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
            },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '409': {
            description: 'A user with that email already exists',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Logged in',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          '400': {
            description: 'Missing fields',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '401': {
            description: 'Invalid credentials',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Return the currently authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthUser' } } },
          },
          '401': {
            description: 'Missing or invalid token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products with optional filters',
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Case-insensitive substring match on name or description' },
          { in: 'query', name: 'category', schema: { type: 'string' }, description: 'Exact category match (see /products/categories)' },
          { in: 'query', name: 'minPrice', schema: { type: 'number' } },
          { in: 'query', name: 'maxPrice', schema: { type: 'number' } },
          { in: 'query', name: 'inStock', schema: { type: 'string', enum: ['true', 'false'] } },
        ],
        responses: {
          '200': {
            description: 'Product list',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductList' } } },
          },
        },
      },
    },
    '/products/categories': {
      get: {
        tags: ['Products'],
        summary: 'List all available product categories',
        responses: {
          '200': {
            description: 'Categories',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    categories: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get a single product by id',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Product',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } },
          },
          '404': {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get the authenticated user\'s cart',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current cart',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Cart' } } },
          },
          '401': { description: 'Not authenticated' },
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Clear every item from the cart',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Emptied cart',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Cart' } } },
          },
          '401': { description: 'Not authenticated' },
        },
      },
    },
    '/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Add an item to the cart (or bump its quantity)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId'],
                properties: {
                  productId: { type: 'string' },
                  quantity: { type: 'integer', minimum: 1, default: 1 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Updated cart',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Cart' } } },
          },
          '400': { description: 'Invalid payload or not enough stock' },
          '401': { description: 'Not authenticated' },
          '404': { description: 'Product not found' },
        },
      },
    },
    '/cart/items/{productId}': {
      patch: {
        tags: ['Cart'],
        summary: 'Set the quantity of a specific cart line',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'productId', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quantity'],
                properties: {
                  quantity: { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated cart',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Cart' } } },
          },
          '400': { description: 'Invalid quantity or not enough stock' },
          '401': { description: 'Not authenticated' },
          '404': { description: 'Item not in cart or product does not exist' },
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Remove an item from the cart',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'productId', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Updated cart',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Cart' } } },
          },
          '401': { description: 'Not authenticated' },
          '404': { description: 'Item not in cart' },
        },
      },
    },
    '/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Place an order using the current cart',
        description:
          'Converts the authenticated user\'s cart into an order, decrements stock on each product, ' +
          'clears the cart, and returns the new order. Fails if the cart is empty or any product is understocked.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customer'],
                properties: {
                  customer: {
                    type: 'object',
                    required: ['name', 'email', 'address', 'city', 'postcode'],
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                      address: { type: 'string' },
                      city: { type: 'string' },
                      postcode: { type: 'string', pattern: '^\\d{4}$' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Order confirmed',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } },
          },
          '400': { description: 'Validation error, empty cart, or insufficient stock' },
          '401': { description: 'Not authenticated' },
        },
      },
      get: {
        tags: ['Orders'],
        summary: 'List the authenticated user\'s orders',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Orders',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer' },
                    items: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                  },
                },
              },
            },
          },
          '401': { description: 'Not authenticated' },
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get a single order by id (must belong to the current user)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Order',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } },
          },
          '401': { description: 'Not authenticated' },
          '404': { description: 'Order not found' },
        },
      },
    },
  },
} as const;
