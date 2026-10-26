import { Injectable, Inject } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { RecordEntity } from './database';
@Injectable()
export class Store {
  private context = new AsyncLocalStorage<EntityManager>();
  private repository() {
    return (this.context.getStore() || this.db.manager).getRepository(RecordEntity);
  }
  async transaction<T>(key: string, action: () => Promise<T>): Promise<T> {
    if (this.context.getStore()) return action();
    const lockKey = this.db.options.type === 'postgres' ? key : 'database-transaction';
    return this.exclusive(lockKey, () =>
      this.db.transaction(async (manager) => {
        if (this.db.options.type === 'postgres')
          await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [key]);
        return this.context.run(manager, action);
      }),
    );
  }
  private locks = new Map<string, Promise<unknown>>();
  constructor(@Inject(DataSource) readonly db: DataSource) {}
  async exclusive<T>(key: string, action: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(key) || Promise.resolve();
    const next = previous.catch(() => {}).then(action);
    this.locks.set(key, next);
    try {
      return await next;
    } finally {
      if (this.locks.get(key) === next) this.locks.delete(key);
    }
  }
  async get<T>(key: string): Promise<T | null> {
    const row = await this.repository().findOneBy({ key });
    return row ? JSON.parse(row.payload) : null;
  }
  async put<T>(kind: string, key: string, payload: T) {
    const repo = this.repository();
    const existing = await repo.findOneBy({ key });
    await repo.save({
      ...existing,
      id: existing?.id || randomUUID(),
      kind,
      key,
      payload: JSON.stringify(payload),
      createdAt: existing?.createdAt || new Date().toISOString(),
    });
    return payload;
  }
  async list<T>(kind: string): Promise<T[]> {
    return (await this.repository().findBy({ kind })).map((row) => JSON.parse(row.payload));
  }
  async remove(key: string) {
    await this.repository().delete({ key });
  }
  async event(type: string, ownerId?: string) {
    await this.put('event', 'event:' + randomUUID(), {
      type,
      ownerId,
      test: process.env.AUTH_PROVIDER !== 'cognito',
      at: new Date().toISOString(),
    });
  }
}
