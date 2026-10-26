import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
test('interesse → convite → sessão → barraca → produto → publicação e isolamento', async () => {
  const oldCwd = process.cwd(),
    dir = mkdtempSync(join(tmpdir(), 'caxi-test-'));
  process.chdir(dir);
  process.env.NODE_ENV = 'test';
  process.env.AUTH_PROVIDER = 'demo';
  process.env.ADMIN_KEY = 'test-admin';
  const { createApp } = await import('../src/main');
  let app = await createApp();
  await app.listen(0, '127.0.0.1');
  let base = await app.getUrl();
  let cookie = '',
    csrf = '';
  async function call(
    path: string,
    method = 'GET',
    body?: unknown,
    headers: Record<string, string> = {},
  ) {
    const response = await fetch(base + '/api' + path, {
      method,
      headers: { 'content-type': 'application/json', cookie, 'x-csrf-token': csrf, ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { response, data: await response.json() };
  }
  try {
    const a = await call('/interests', 'POST', { name: 'Ana', phone: '11999999999' });
    assert.equal(a.response.status, 201);
    const again = await call('/interests', 'POST', { name: 'Ana', phone: '11999999999' });
    assert.equal(a.data.id, again.data.id);
    assert.equal((await call('/auth/code', 'POST', { phone: '11999999999' })).response.status, 403);
    assert.equal((await call('/admin/interests')).response.status, 401);
    await call('/demo/interests/' + a.data.id + '/approve', 'POST');
    const challenge = await call('/auth/code', 'POST', { phone: '11999999999' });
    assert.equal(challenge.data.demoCode, '123456');
    assert.equal((await call('/auth/code', 'POST', { phone: '11999999999' })).response.status, 429);
    assert.equal(
      (
        await call('/auth/verify', 'POST', {
          challengeId: challenge.data.challengeId,
          code: '000000',
        })
      ).response.status,
      401,
    );
    const verified = await call('/auth/verify', 'POST', {
      challengeId: challenge.data.challengeId,
      code: '123456',
    });
    cookie = verified.response.headers.get('set-cookie')!.split(';')[0];
    csrf = verified.data.csrf;
    assert.match(verified.response.headers.get('set-cookie')!, /HttpOnly/i);
    assert.equal(
      (
        await call('/auth/verify', 'POST', {
          challengeId: challenge.data.challengeId,
          code: '123456',
        })
      ).response.status,
      401,
    );
    assert.equal(
      (
        await call(
          '/stalls/mine',
          'PUT',
          { name: 'Horta da Ana', description: 'Fresquinhos' },
          { 'x-csrf-token': 'bad' },
        )
      ).response.status,
      403,
    );
    const saved = await call('/stalls/mine', 'PUT', {
      name: 'Horta da Ana',
      description: 'Fresquinhos',
    });
    assert.equal(saved.response.status, 200);
    const id = saved.data.id;
    assert.equal((await call('/catalog/' + id)).data.stall.published, false);
    assert.equal((await call('/stalls/mine/publish', 'POST')).response.status, 400);
    const upload = new FormData();
    upload.append(
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
      'tomate.png',
    );
    const photoResponse = await fetch(base + '/api/uploads', {
      method: 'POST',
      headers: { cookie, 'x-csrf-token': csrf },
      body: upload,
    });
    assert.equal(photoResponse.status, 201);
    const photo = (await photoResponse.json()) as any;
    const input = {
      name: 'Tomate',
      priceCents: 850,
      unit: 'kg',
      stock: 2.5,
      available: true,
      photoUrl: photo.url,
    };
    assert.equal((await call('/products', 'POST', { ...input, stock: 2.3 })).response.status, 400);
    const p = await call('/products', 'POST', input);
    assert.equal(p.response.status, 201);
    assert.equal((await call('/stalls/mine/publish', 'POST')).response.status, 201);
    const publicCatalog = (await call('/catalog/' + id)).data;
    assert.equal(publicCatalog.products[0].stock, undefined);
    assert.equal(publicCatalog.products[0].priceCents, 850);
    assert.equal((await call('/onboarding')).data.products.length, 1);
    assert.equal((await call('/health/live')).response.status, 200);
    assert.equal((await call('/health/ready')).response.status, 200);
    const buyer = {
      requestId: crypto.randomUUID(),
      customerName: 'Cliente teste',
      customerPhone: '11988888888',
      fulfillment: 'pickup',
      items: [{ productId: p.data.id, quantity: 0.5 }],
    };
    const order = await call('/catalog/' + id + '/orders', 'POST', buyer);
    assert.equal(order.response.status, 201);
    assert.equal(order.data.totalCents, 425);
    assert.equal((await call('/products')).data[0].stock, 2);
    const repeated = await call('/catalog/' + id + '/orders', 'POST', buyer);
    assert.equal(repeated.data.id, order.data.id);
    assert.equal((await call('/products')).data[0].stock, 2);
    assert.equal(
      (await call('/catalog/' + id + '/orders', 'POST', { ...buyer, customerName: 'Outro' }))
        .response.status,
      409,
    );
    assert.equal(
      (
        await call('/catalog/' + id + '/orders', 'POST', {
          ...buyer,
          requestId: crypto.randomUUID(),
          items: [{ productId: p.data.id, quantity: 0.3 }],
        })
      ).response.status,
      400,
    );
    assert.equal(
      (await call('/products/' + p.data.id, 'PATCH', { ...input, version: p.data.version }))
        .response.status,
      409,
    );
    // A failure between stock reservation and order persistence must roll back both.
    const { Store } = await import('../src/store');
    const { OrdersService } = await import('../src/orders');
    const store = app.get(Store),
      originalPut = store.put.bind(store);
    store.put = async (kind: string, key: string, payload: any) => {
      if (kind === 'order') throw new Error('simulated write failure');
      return originalPut(kind, key, payload);
    };
    await assert.rejects(() =>
      app.get(OrdersService).create(id, { ...buyer, requestId: crypto.randomUUID() }),
    );
    store.put = originalPut;
    assert.equal((await call('/products')).data[0].stock, 2);
    assert.equal((await call('/orders')).data.length, 1);
    assert.equal(
      (await call('/orders/' + order.data.id + '/status', 'PATCH', { status: 'completed' }))
        .response.status,
      400,
    );
    const cancelled = await call('/orders/' + order.data.id + '/status', 'PATCH', {
      status: 'cancelled',
    });
    assert.equal(cancelled.data.status, 'cancelled');
    await call('/orders/' + order.data.id + '/status', 'PATCH', { status: 'cancelled' });
    assert.equal((await call('/products')).data[0].stock, 2.5);
    const competing = await Promise.all(
      [1, 2].map(() =>
        call('/catalog/' + id + '/orders', 'POST', {
          ...buyer,
          requestId: crypto.randomUUID(),
          items: [{ productId: p.data.id, quantity: 2 }],
        }),
      ),
    );
    assert.deepEqual(competing.map((x) => x.response.status).sort(), [201, 400]);
    assert.equal((await call('/products')).data[0].stock, 0.5);
    const successful = competing.find((x) => x.response.status === 201)!;
    for (const status of ['preparing', 'ready', 'completed'])
      assert.equal(
        (await call('/orders/' + successful.data.id + '/status', 'PATCH', { status })).response
          .status,
        200,
      );
    assert.equal(
      (await call('/orders/' + successful.data.id + '/status', 'PATCH', { status: 'cancelled' }))
        .response.status,
      400,
    );
    assert.equal((await call('/products')).data[0].stock, 0.5);
    const unit = await call('/products', 'POST', {
      ...input,
      name: 'Alface',
      unit: 'un',
      stock: 3,
    });
    assert.equal(
      (
        await call('/catalog/' + id + '/orders', 'POST', {
          ...buyer,
          requestId: crypto.randomUUID(),
          items: [{ productId: unit.data.id, quantity: 0.5 }],
        })
      ).response.status,
      400,
    );
    await app.close();
    app = await createApp();
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
    assert.equal((await call('/onboarding')).data.stall.name, 'Horta da Ana');
    assert.equal((await call('/onboarding')).data.products[0].name, 'Tomate');
    await call('/auth/logout', 'POST');
    assert.equal((await call('/onboarding')).response.status, 401);
    assert.equal((await call('/orders')).response.status, 401);
    cookie = '';
    csrf = '';
    const other = await call('/interests', 'POST', { name: 'Bia', phone: '21999999999' });
    await call('/demo/interests/' + other.data.id + '/approve', 'POST');
    const ch2 = await call('/auth/code', 'POST', { phone: '21999999999' });
    const v2 = await call('/auth/verify', 'POST', {
      challengeId: ch2.data.challengeId,
      code: '123456',
    });
    cookie = v2.response.headers.get('set-cookie')!.split(';')[0];
    csrf = v2.data.csrf;
    assert.equal((await call('/products/' + p.data.id, 'PATCH', input)).response.status, 404);
    assert.equal(
      (await call('/orders/' + order.data.id + '/status', 'PATCH', { status: 'preparing' }))
        .response.status,
      404,
    );
    assert.equal((await call('/orders')).data.length, 0);
    const funnel = await call('/admin/funnel', 'GET', undefined, { 'x-admin-key': 'test-admin' });
    assert.equal(funnel.data.find((x: any) => x.type === 'catalog_published').testUsers, 1);
    assert.equal(funnel.data.find((x: any) => x.type === 'catalog_published').realUsers, 0);
  } finally {
    await app.close();
    process.chdir(oldCwd);
    rmSync(dir, { recursive: true, force: true });
  }
});
