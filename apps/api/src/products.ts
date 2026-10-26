import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { canPublish, ProductInput, productErrors } from '@caxi/domain';
import { Store } from './store';
import { PhotosService } from './photos';
export type Stall = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  published: boolean;
};
export type Product = ProductInput & { id: string; stallId: string; version?: number };
@Injectable()
export class StallsService {
  constructor(@Inject(Store) readonly store: Store) {}
  async mine(ownerId: string): Promise<Stall> {
    const old = await this.store.get<Stall>('stall:' + ownerId);
    if (old) return old;
    return this.store.put('stall', 'stall:' + ownerId, {
      id: randomUUID(),
      ownerId,
      name: '',
      description: '',
      published: false,
    });
  }
  async save(ownerId: string, body: any) {
    if (
      typeof body.name !== 'string' ||
      !body.name.trim() ||
      body.name.length > 80 ||
      typeof body.description !== 'string' ||
      body.description.length > 300
    )
      throw new BadRequestException(
        'Informe o nome da barraca (até 80 caracteres) e uma descrição de até 300.',
      );
    const stall = await this.mine(ownerId);
    Object.assign(stall, { name: body.name.trim(), description: body.description.trim() });
    await this.store.put('stall', 'stall:' + ownerId, stall);
    await this.store.event('stall_saved', ownerId);
    return stall;
  }
  async publicStall(id: string) {
    const stall = (await this.store.list<Stall>('stall')).find((x) => x.id === id);
    if (!stall) throw new NotFoundException('Barraca não encontrada.');
    return stall;
  }
}
@Injectable()
export class ProductsService {
  constructor(
    @Inject(Store) private readonly store: Store,
    @Inject(StallsService) private readonly stalls: StallsService,
    @Inject(PhotosService) private readonly photos: PhotosService,
  ) {}
  async list(ownerId: string) {
    const stall = await this.stalls.mine(ownerId);
    return (await this.store.list<Product>('product')).filter((p) => p.stallId === stall.id);
  }
  async save(ownerId: string, body: ProductInput & { version?: number }, id?: string) {
    const errors = productErrors(body);
    if (errors.length) throw new BadRequestException(errors);
    const stall = await this.stalls.mine(ownerId);
    return this.store.transaction('stall:' + stall.id, async () => {
      const previous = id ? await this.store.get<Product>('product:' + id) : null;
      if (id && previous?.stallId !== stall.id)
        throw new NotFoundException('Produto não encontrado.');
      if (previous && body.version !== (previous.version || 0))
        throw new ConflictException(
          'O produto ou estoque mudou. Atualize os dados antes de salvar.',
        );
      await this.photos.assertOwned(ownerId, body.photoUrl);
      const product: Product = {
        id: id || randomUUID(),
        stallId: stall.id,
        name: body.name.trim(),
        priceCents: body.priceCents,
        unit: body.unit,
        stock: body.stock,
        photoUrl: body.photoUrl,
        available: body.available === true,
        version: (previous?.version || 0) + 1,
      };
      await this.store.put('product', 'product:' + product.id, product);
      await this.store.event('product_saved', ownerId);
      return product;
    });
  }
  async publish(ownerId: string) {
    const stall = await this.stalls.mine(ownerId);
    if (!canPublish(stall.name, await this.list(ownerId)))
      throw new BadRequestException(
        'Cadastre o nome da barraca e pelo menos um produto com foto, preço e estoque disponível.',
      );
    stall.published = true;
    await this.store.put('stall', 'stall:' + ownerId, stall);
    await this.store.event('catalog_published', ownerId);
    return stall;
  }
  async catalog(id: string) {
    const stall = await this.stalls.publicStall(id);
    const products = stall.published
      ? (await this.store.list<Product>('product'))
          .filter((p) => p.stallId === id)
          .map(({ stock, stallId, ...p }) => ({ ...p, available: p.available && stock > 0 }))
      : [];
    const owner = await this.store.get<{ phone: string }>('owner:' + stall.ownerId);
    return {
      stall: {
        id: stall.id,
        name: stall.name,
        description: stall.description,
        published: stall.published,
        whatsapp: owner?.phone,
      },
      products,
    };
  }
}
