import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const blob: typeof import('@vercel/blob') = require('@vercel/blob');
import {
  BlobPhotoStorage,
  createPhotoStorage,
  LocalPhotoStorage,
  MAX_PHOTO_BYTES,
  PhotosService,
} from '../src/photos';

test('Vercel exige fotos persistentes e desenvolvimento mantém armazenamento local', (t) => {
  const keys = ['VERCEL', 'NODE_ENV', 'PHOTO_STORAGE', 'BLOB_READ_WRITE_TOKEN'] as const;
  const previous = keys.map((key) => process.env[key]);
  t.after(() =>
    keys.forEach((key, i) => {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    }),
  );
  keys.forEach((key) => delete process.env[key]);
  process.env.NODE_ENV = 'development';
  process.env.VERCEL = '1';
  assert.ok(createPhotoStorage() instanceof LocalPhotoStorage);
  process.env.NODE_ENV = 'production';
  assert.throws(createPhotoStorage, /BLOB_READ_WRITE_TOKEN/);
  process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
  assert.ok(createPhotoStorage() instanceof BlobPhotoStorage);
  process.env.PHOTO_STORAGE = 'local';
  assert.throws(createPhotoStorage, /persistente/);
});

test('Blob salva fotos com URL pública e tipo de imagem verificado', async (t) => {
  const buffer = Buffer.from([255, 216, 255, 0]);
  const put = t.mock.method(blob, 'put', async (path, body, options) => {
    assert.match(path, /^products\/[\da-f-]+\.jpg$/);
    assert.equal(body, buffer);
    assert.equal(options.access, 'public');
    assert.equal(options.contentType, 'image/jpeg');
    return { url: 'https://example.public.blob.vercel-storage.com/' + path };
  });
  const url = await new BlobPhotoStorage().save(buffer, 'jpg');
  assert.match(url, /^https:\/\/example\.public\.blob\.vercel-storage\.com\/products\//);
  assert.equal(put.mock.callCount(), 1);
});

test('fotos acima de 4 MB são rejeitadas antes de gravar no storage', async () => {
  const photos = new PhotosService({ save: async () => assert.fail('Não deve gravar') }, {} as any);
  await assert.rejects(
    photos.upload('owner', { buffer: Buffer.alloc(MAX_PHOTO_BYTES + 1) } as Express.Multer.File),
    /4 MB/,
  );
});
