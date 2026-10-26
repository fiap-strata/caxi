import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canPublish, normalizePhone, productErrors, ProductInput } from './index';
const product: ProductInput = {
  name: 'Tomate',
  priceCents: 850,
  unit: 'kg',
  stock: 2.5,
  photoUrl: '/uploads/ab12-cd34.jpg',
  available: true,
};
test('publicação exige produto válido, disponível e estoque positivo', () => {
  assert.equal(canPublish('Horta', [product]), true);
  assert.equal(canPublish('', [product]), false);
  assert.equal(canPublish('Horta', [{ ...product, stock: 0 }]), false);
  assert.equal(canPublish('Horta', [{ ...product, available: false }]), false);
  assert.equal(canPublish('Horta', [{ ...product, photoUrl: '' }]), false);
});
test('estoque por kg não arredonda incrementos inválidos', () => {
  assert.equal(productErrors({ ...product, stock: 2.3 }).length, 1);
  assert.equal(productErrors({ ...product, stock: 2.5 }).length, 0);
});
test('unidades são inteiras e preços em centavos', () => {
  assert.equal(productErrors({ ...product, unit: 'un', stock: 1.5 }).length, 1);
  assert.equal(productErrors({ ...product, priceCents: 1.2 }).length, 1);
  assert.equal(productErrors({ ...product, priceCents: -1 }).length, 1);
});
test('telefone brasileiro normalizado', () => {
  assert.equal(normalizePhone('(11) 99999-9999'), '+5511999999999');
  assert.equal(normalizePhone('+55 11 99999-9999'), '+5511999999999');
  assert.throws(() => normalizePhone('123'));
});
