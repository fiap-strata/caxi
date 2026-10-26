import { EntitySchema, MigrationInterface, QueryRunner, Table } from 'typeorm';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
export class RecordEntity {
  id!: string;
  kind!: string;
  key!: string;
  payload!: string;
  createdAt!: string;
}
// Portable persistence envelope. Domain services own typed payloads, never controllers.
export const RecordSchema = new EntitySchema<RecordEntity>({
  name: 'RecordEntity',
  target: RecordEntity,
  tableName: 'records',
  columns: {
    id: { type: String, primary: true },
    kind: { type: String },
    key: { type: String, unique: true },
    payload: { type: 'text' },
    createdAt: { type: String },
  },
  indices: [{ columns: ['kind'] }],
});
export class Initial1792530000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    if (q.connection.options.type === 'postgres')
      await q.query('CREATE EXTENSION IF NOT EXISTS postgis');
    await q.createTable(
      new Table({
        name: 'records',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'kind', type: 'varchar' },
          { name: 'key', type: 'varchar', isUnique: true },
          { name: 'payload', type: 'text' },
          { name: 'createdAt', type: 'varchar' },
        ],
        indices: [{ columnNames: ['kind'] }],
      }),
    );
  }
  async down(q: QueryRunner) {
    await q.dropTable('records');
  }
}
export function databaseOptions(): any {
  const common = {
    entities: [RecordSchema],
    migrations: [Initial1792530000000],
    migrationsRun: true,
    synchronize: false,
  };
  if (process.env.DATABASE_DRIVER === 'postgres')
    return { ...common, type: 'postgres', url: process.env.DATABASE_URL };
  if (process.env.NODE_ENV === 'production') throw new Error('Produção requer PostgreSQL.');
  const dir = resolve(process.cwd(), 'data');
  mkdirSync(dir, { recursive: true });
  return { ...common, type: 'sqljs', location: resolve(dir, 'caxi.sqlite'), autoSave: true };
}
