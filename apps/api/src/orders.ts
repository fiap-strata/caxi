import {
  BadRequestException,
  Controller,
  Get,
  Injectable,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Body,
  Req,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import type { Request } from 'express';
import { randomUUID, createHash } from 'node:crypto';
import { Store } from './store';
import { StallsService, ProductsService, Product } from './products';
import { AuthService, safeEqual } from './auth';

type Line = {
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
};
type Status = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
type Order = {
  id: string;
  stallId: string;
  customerName: string;
  customerPhone: string;
  fulfillment: 'pickup' | 'delivery';
  address?: string;
  notes: string;
  items: Line[];
  totalCents: number;
  status: Status;
  createdAt: string;
  updatedAt: string;
};
@Injectable()
export class OrdersService {
  constructor(
    @Inject(Store) private store: Store,
    @Inject(StallsService) private stalls: StallsService,
    @Inject(ProductsService) private products: ProductsService,
  ) {}
  async create(stallId: string, body: any) {
    return this.store.transaction('stall:' + stallId, async () => {
      const stall = await this.stalls.publicStall(stallId);
      if (!stall.published) throw new BadRequestException('Catálogo indisponível.');
      const name = String(body?.customerName || '').trim();
      const phone = String(body?.customerPhone || '').replace(/\D/g, '');
      const fulfillment = body?.fulfillment;
      const address = String(body?.address || '').trim();
      const notes = String(body?.notes || '').trim();
      if (
        !name ||
        name.length > 100 ||
        phone.length < 10 ||
        phone.length > 13 ||
        !['pickup', 'delivery'].includes(fulfillment) ||
        (fulfillment === 'delivery' && !address) ||
        address.length > 300 ||
        notes.length > 500
      )
        throw new BadRequestException('Confira nome, telefone, modalidade e endereço de entrega.');
      if (!Array.isArray(body?.items) || !body.items.length || body.items.length > 50)
        throw new BadRequestException('Selecione pelo menos um produto.');
      const requestId = body.requestId;
      if (typeof requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(requestId))
        throw new BadRequestException('Identificador da tentativa inválido.');
      const requestKey = 'order-request:' + stallId + ':' + requestId;
      const fingerprint = createHash('sha256')
        .update(JSON.stringify({ name, phone, fulfillment, address, notes, items: body.items }))
        .digest('hex');
      const existing = await this.store.get<{ fingerprint: string; orderId: string }>(requestKey);
      if (existing) {
        if (existing.fingerprint !== fingerprint)
          throw new ConflictException('Identificador já utilizado em outro pedido.');
        return this.store.get<Order>('order:' + existing.orderId);
      }
      const all = await this.store.list<Product>('product');
      const items: Line[] = [];
      const used = new Set<string>();
      for (const item of body.items) {
        const p = all.find((x) => x.id === item.productId && x.stallId === stallId);
        const quantity = item.quantity;
        if (
          !p ||
          !p.available ||
          !Number.isFinite(quantity) ||
          quantity <= 0 ||
          (p.unit === 'kg'
            ? !Number.isSafeInteger(quantity * 2)
            : !Number.isSafeInteger(quantity)) ||
          used.has(p.id) ||
          !Number.isSafeInteger(p.priceCents) ||
          p.priceCents < 0
        )
          throw new BadRequestException('Produto ou quantidade inválida.');
        used.add(p.id);
        if (quantity > p.stock) throw new BadRequestException(`Estoque insuficiente: ${p.name}.`);
        items.push({
          productId: p.id,
          name: p.name,
          unit: p.unit,
          quantity,
          unitPriceCents: p.priceCents,
          subtotalCents: Math.round(p.priceCents * quantity),
        });
      }
      const totalCents = items.reduce((s, x) => s + x.subtotalCents, 0);
      if (!Number.isSafeInteger(totalCents)) throw new BadRequestException('Total inválido.');
      const now = new Date().toISOString();
      const order: Order = {
        id: randomUUID(),
        stallId,
        customerName: name,
        customerPhone: phone,
        fulfillment,
        ...(fulfillment === 'delivery' ? { address } : {}),
        notes,
        items,
        totalCents,
        status: 'received',
        createdAt: now,
        updatedAt: now,
      };
      // Reserve inventory before acknowledging the order.
      for (const item of items) {
        const p = all.find((x) => x.id === item.productId)!;
        await this.store.put('product', 'product:' + p.id, {
          ...p,
          stock: p.stock - item.quantity,
          version: (p.version || 0) + 1,
        });
      }
      await this.store.put('order', 'order:' + order.id, order);
      await this.store.put('order-request', requestKey, { fingerprint, orderId: order.id });
      return order;
    });
  }
  async list(ownerId: string) {
    const stall = await this.stalls.mine(ownerId);
    return (await this.store.list<Order>('order'))
      .filter((o) => o.stallId === stall.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async update(ownerId: string, id: string, status: Status) {
    const stall = await this.stalls.mine(ownerId);
    return this.store.transaction('stall:' + stall.id, async () => {
      const order = await this.store.get<Order>('order:' + id);
      if (!order || order.stallId !== stall.id)
        throw new NotFoundException('Pedido não encontrado.');
      const allowed: Record<Status, Status[]> = {
        received: ['preparing', 'cancelled'],
        preparing: ['ready', 'cancelled'],
        ready: ['completed', 'cancelled'],
        completed: [],
        cancelled: [],
      };
      if (order.status === status) return order;
      if (!allowed[order.status].includes(status))
        throw new BadRequestException('Mudança de status não permitida.');
      if (status === 'cancelled') {
        for (const item of order.items) {
          const p = await this.store.get<Product>('product:' + item.productId);
          if (p)
            await this.store.put('product', 'product:' + p.id, {
              ...p,
              stock: p.stock + item.quantity,
              version: (p.version || 0) + 1,
            });
        }
      }
      order.status = status;
      order.updatedAt = new Date().toISOString();
      return this.store.put('order', 'order:' + id, order);
    });
  }
}
@Controller('api')
export class OrdersController {
  constructor(
    @Inject(OrdersService) private orders: OrdersService,
    @Inject(AuthService) private auth: AuthService,
  ) {}
  private async owner(req: Request) {
    const session = await this.auth.session(req.cookies?.caxi_session);
    if (
      !['GET', 'HEAD'].includes(req.method) &&
      !safeEqual(String(req.headers['x-csrf-token'] || ''), session.csrf)
    )
      throw new ForbiddenException('Sessão inválida.');
    return session.ownerId;
  }
  @Post('catalog/:id/orders') create(@Param('id') id: string, @Body() body: any) {
    return this.orders.create(id, body);
  }
  @Get('orders') async list(@Req() req: Request) {
    return this.orders.list(await this.owner(req));
  }
  @Patch('orders/:id/status') async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.orders.update(await this.owner(req), id, body?.status);
  }
}
