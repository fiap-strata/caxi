// Demonstração técnica com dados fictícios. Não envia mensagens nem processa pagamentos.
import assert from 'node:assert/strict';
const base = process.env.CAXI_BASE_URL || 'http://127.0.0.1:5173';
let cookie = '',
  csrf = '';
async function call(path, method = 'GET', body) {
  const response = await fetch(base + '/api' + path, {
    method,
    headers: {
      cookie,
      'X-CSRF-Token': csrf,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  assert.ok(response.ok, `${method} ${path}: ${JSON.stringify(data)}`);
  if (response.headers.has('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
  return data;
}
assert.equal((await call('/config')).demo, true, 'Smoke exige ambiente de demonstração.');
assert.equal((await call('/health/ready')).status, 'ok');
const phone = '119' + String(Date.now()).slice(-8);
const interest = await call('/interests', 'POST', { name: 'Vendedor de demonstração', phone });
await call('/demo/interests/' + interest.id + '/approve', 'POST');
const challenge = await call('/auth/code', 'POST', { phone });
const auth = await call('/auth/verify', 'POST', {
  challengeId: challenge.challengeId,
  code: challenge.demoCode,
});
csrf = auth.csrf;
const stall = await call('/stalls/mine', 'PUT', {
  name: 'Barraca de demonstração',
  description: 'Dados fictícios para verificar a Sprint 2.',
});
const form = new FormData();
form.append(
  'file',
  new Blob(
    [
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
        'base64',
      ),
    ],
    { type: 'image/png' },
  ),
  'produto.png',
);
const uploaded = await fetch(base + '/api/uploads', {
  method: 'POST',
  headers: { cookie, 'X-CSRF-Token': csrf },
  body: form,
});
assert.equal(uploaded.status, 201);
const { url: photoUrl } = await uploaded.json();
const product = await call('/products', 'POST', {
  name: 'Tomate (teste)',
  unit: 'kg',
  stock: 2.5,
  priceCents: 800,
  photoUrl,
  available: true,
});
await call('/stalls/mine/publish', 'POST');
const body = {
  requestId: crypto.randomUUID(),
  customerName: 'Comprador de demonstração',
  customerPhone: '11988888888',
  fulfillment: 'pickup',
  items: [{ productId: product.id, quantity: 0.5 }],
};
const order = await call('/catalog/' + stall.id + '/orders', 'POST', body);
assert.equal(order.totalCents, 400);
assert.equal((await call('/catalog/' + stall.id + '/orders', 'POST', body)).id, order.id);
for (const status of ['preparing', 'ready', 'completed'])
  await call('/orders/' + order.id + '/status', 'PATCH', { status });
assert.equal((await call('/products'))[0].stock, 2);
const cancelled = await call('/catalog/' + stall.id + '/orders', 'POST', {
  ...body,
  requestId: crypto.randomUUID(),
});
await call('/orders/' + cancelled.id + '/status', 'PATCH', { status: 'cancelled' });
assert.equal((await call('/products'))[0].stock, 2);
const orders = await call('/orders');
assert.equal(orders.filter((o) => o.status === 'completed').length, 1);
assert.equal(orders.filter((o) => o.status === 'cancelled').length, 1);
console.log(
  JSON.stringify(
    {
      result: 'PASS',
      environment: 'demo',
      at: new Date().toISOString(),
      catalog: base + '/b/' + stall.id,
      phone,
      completed: 1,
      cancelled: 1,
      salesCents: 400,
      stockKg: 2,
      whatsapp: 'apenas link; nenhum envio automático',
    },
    null,
    2,
  ),
);
