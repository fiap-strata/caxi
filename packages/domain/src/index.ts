export type Unit = 'kg' | 'un';
export type ProductInput = {
  name: string;
  priceCents: number;
  unit: Unit;
  stock: number;
  photoUrl: string;
  available: boolean;
};
export function productErrors(p: ProductInput): string[] {
  const errors: string[] = [];
  if (typeof p.name !== 'string' || !p.name.trim() || p.name.trim().length > 100)
    errors.push('Informe um nome de produto com até 100 caracteres.');
  if (!Number.isSafeInteger(p.priceCents) || p.priceCents <= 0 || p.priceCents > 10000000)
    errors.push('Informe um preço entre R$ 0,01 e R$ 100.000,00.');
  if (!['kg', 'un'].includes(p.unit)) errors.push('Escolha kg ou unidade.');
  if (typeof p.available !== 'boolean') errors.push('Informe a disponibilidade do produto.');
  if (!Number.isFinite(p.stock) || p.stock < 0 || p.stock > 1000000)
    errors.push('Informe um estoque entre 0 e 1.000.000.');
  if (p.unit === 'un' && !Number.isInteger(p.stock))
    errors.push('Use unidades inteiras, como 1, 2 ou 3.');
  if (p.unit === 'kg' && !Number.isInteger(p.stock * 2))
    errors.push('Use quilos assim: 1, 1,5 ou 2.');
  if (!/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(p.photoUrl || ''))
    errors.push('Adicione uma foto do produto.');
  return errors;
}
export function canPublish(name: string, products: ProductInput[]) {
  return (
    !!name.trim() &&
    products.some((p) => productErrors(p).length === 0 && p.stock > 0 && p.available)
  );
}
export function normalizePhone(value: string) {
  if (typeof value !== 'string') throw new Error('Informe um telefone brasileiro com DDD.');
  let digits = value.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = '55' + digits;
  if (!/^55[1-9]{2}[0-9]{8,9}$/.test(digits))
    throw new Error('Informe um telefone brasileiro com DDD.');
  return '+' + digits;
}
