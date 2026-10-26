import type {
  OpenAPIObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
const string = (example: string): SchemaObject => ({ type: 'string', example });
const object = (
  properties: Record<string, SchemaObject>,
  required = Object.keys(properties),
): SchemaObject => ({ type: 'object', properties, required, additionalProperties: false });
export function describeApi(doc: OpenAPIObject) {
  const product = object({
    name: { ...string('Tomate italiano'), maxLength: 100 },
    priceCents: { type: 'integer', minimum: 1, maximum: 10000000, example: 850 },
    unit: { type: 'string', enum: ['kg', 'un'] },
    stock: {
      type: 'number',
      minimum: 0,
      maximum: 1000000,
      example: 2.5,
      description: 'kg: múltiplos de 0,5; un: inteiro',
    },
    photoUrl: string('/uploads/00000000-0000-0000-0000-000000000000.jpg'),
    available: { type: 'boolean', example: true },
  });
  const schemas: Record<string, SchemaObject> = {
    InterestInput: object({ name: string('Ana'), phone: string('11999999999') }),
    CodeInput: object({ phone: string('11999999999') }),
    VerifyInput: object({
      challengeId: { type: 'string', format: 'uuid' },
      code: { type: 'string', pattern: '^[0-9]{6}$', example: '123456' },
    }),
    StallInput: object({
      name: { ...string('Horta da Ana'), maxLength: 80 },
      description: { ...string('Da nossa horta para sua casa.'), maxLength: 300 },
    }),
    ProductInput: {
      ...product,
      properties: {
        ...product.properties,
        version: {
          type: 'integer',
          minimum: 0,
          description: 'Obrigatório na edição; valor devolvido pela API.',
        },
      },
    },
    OrderInput: object(
      {
        requestId: { type: 'string', format: 'uuid' },
        customerName: string('Cliente de demonstração'),
        customerPhone: string('11999999999'),
        fulfillment: { type: 'string', enum: ['pickup', 'delivery'] },
        address: string('Endereço para entrega'),
        notes: string('Observações'),
        items: {
          type: 'array',
          minItems: 1,
          items: object({
            productId: { type: 'string', format: 'uuid' },
            quantity: {
              type: 'number',
              minimum: 0.5,
              description: 'kg: passos de 0,5. un: inteiro.',
            },
          }),
        },
      },
      ['requestId', 'customerName', 'customerPhone', 'fulfillment', 'items'],
    ),
    OrderStatusInput: object({
      status: { type: 'string', enum: ['preparing', 'ready', 'completed', 'cancelled'] },
    }),
    Error: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer' },
        message: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
        error: { type: 'string' },
      },
    },
  };
  doc.components = { ...doc.components, schemas: { ...doc.components?.schemas, ...schemas } };
  const bodies: Record<string, string> = {
    '/api/interests': 'InterestInput',
    '/api/auth/code': 'CodeInput',
    '/api/auth/verify': 'VerifyInput',
    '/api/stalls/mine': 'StallInput',
    '/api/products': 'ProductInput',
    '/api/products/{id}': 'ProductInput',
    '/api/catalog/{id}/orders': 'OrderInput',
    '/api/orders/{id}/status': 'OrderStatusInput',
  };
  for (const [path, item] of Object.entries(doc.paths))
    for (const method of ['get', 'post', 'put', 'patch'] as const) {
      const op = item?.[method];
      if (!op) continue;
      if (bodies[path] && method !== 'get')
        op.requestBody = {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/' + bodies[path] } },
          },
        };
      for (const [status, description] of Object.entries({
        '400': 'Dados inválidos',
        '401': 'Sessão/código inválido ou expirado',
        '403': 'Convite, origem ou CSRF inválido',
        '404': 'Registro não encontrado ou de outro proprietário',
        '409': 'Conflito de versão ou identificador de pedido',
        '429': 'Limite de tentativas ou requisições',
      }))
        op.responses[status] = {
          description,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        };
      if (path.startsWith('/api/admin/'))
        op.parameters = [
          ...(op.parameters || []),
          { name: 'X-Admin-Key', in: 'header', required: true, schema: { type: 'string' } },
        ];
      if (
        [
          '/api/orders',
          '/api/orders/{id}/status',
          '/api/onboarding',
          '/api/products',
          '/api/products/{id}',
          '/api/stalls/mine',
          '/api/stalls/mine/publish',
          '/api/uploads',
          '/api/events/shared',
          '/api/auth/session',
          '/api/auth/logout',
          '/api/auth/refresh',
        ].includes(path)
      ) {
        op.security = [{ cookie: [] }];
        if (method !== 'get')
          op.parameters = [
            ...(op.parameters || []),
            { name: 'X-CSRF-Token', in: 'header', required: true, schema: { type: 'string' } },
          ];
      }
    }
  const upload = doc.paths['/api/uploads']?.post;
  if (upload)
    upload.requestBody = {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['file'],
            properties: { file: { type: 'string', format: 'binary' } },
          },
        },
      },
    };
  return doc;
}
