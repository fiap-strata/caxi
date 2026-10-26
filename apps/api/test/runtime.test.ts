import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { academicDemo, applicationOrigins, assertProductionConfiguration } from '../src/runtime';
import { databaseOptions } from '../src/database';

test('demo acadêmico é explícito, usa disco temporário e mantém proteção de origem', (t) => {
  const keys = [
    'NODE_ENV',
    'CAXI_DEMO_MODE',
    'AUTH_PROVIDER',
    'DATABASE_DRIVER',
    'APP_ORIGIN',
    'VERCEL_URL',
    'VERCEL_PROJECT_PRODUCTION_URL',
  ];
  const previous = keys.map((key) => process.env[key]);
  t.after(() =>
    keys.forEach((key, i) => {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    }),
  );
  process.env.NODE_ENV = 'production';
  process.env.AUTH_PROVIDER = 'demo';
  process.env.DATABASE_DRIVER = 'sqljs';
  delete process.env.CAXI_DEMO_MODE;
  assert.equal(academicDemo(), false);
  assert.throws(assertProductionConfiguration, /produção incompleta/);
  assert.throws(databaseOptions, /PostgreSQL/);

  process.env.CAXI_DEMO_MODE = 'true';
  assert.equal(academicDemo(), true);
  assert.doesNotThrow(assertProductionConfiguration);
  assert.equal(databaseOptions().location, resolve(tmpdir(), 'caxi-demo', 'caxi.sqlite'));
  process.env.APP_ORIGIN = 'https://caxi.example';
  process.env.VERCEL_URL = 'caxi-preview.vercel.app';
  process.env.VERCEL_PROJECT_PRODUCTION_URL = 'caxi.vercel.app';
  assert.ok(applicationOrigins().has('https://caxi-preview.vercel.app'));
  assert.ok(applicationOrigins().has('https://caxi.vercel.app'));
  assert.equal(applicationOrigins().has('https://untrusted.example'), false);

  process.env.AUTH_PROVIDER = 'cognito';
  assert.equal(academicDemo(), false);
  assert.throws(databaseOptions, /PostgreSQL/);
});
