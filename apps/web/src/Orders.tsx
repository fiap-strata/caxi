import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { api, send } from './api';
import type { Product, Stall } from './models';
import './orders.css';

const money = (c: number) =>
  (c / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  fulfillment: 'pickup' | 'delivery';
  address?: string;
  notes: string;
  items: {
    name: string;
    quantity: number;
    unit: string;
    subtotalCents: number;
  }[];
  totalCents: number;
  status: string;
  createdAt: string;
};

const labels: Record<string, string> = {
  received: 'Recebido',
  preparing: 'Em preparo',
  ready: 'Pronto',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

// CHECKOUT DO CLIENTE — PRESERVADO
export function Checkout({ stall, products }: { stall: Stall; products: Product[] }) {
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [qty, setQty] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selected = products.filter((p) => (qty[p.id] || 0) > 0);
  const total = selected.reduce((s, p) => s + Math.round(p.priceCents * qty[p.id]), 0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const created = await api<Order>('/catalog/' + encodeURIComponent(stall.id) + '/orders', {
        method: 'POST',
        body: send({
          requestId,
          customerName: name,
          customerPhone: phone,
          fulfillment,
          address,
          notes,
          items: selected.map((p) => ({
            productId: p.id,
            quantity: qty[p.id],
          })),
        }),
      });
      setOrder(created);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const message = order
    ? [
        `Olá! Fiz um pedido na barraca ${stall.name}.`,
        `Pedido: ${order.id}`,
        `Ver no painel: ${location.origin}/?pedido=${order.id}`,
        `Cliente: ${order.customerName}`,
        `Telefone: ${order.customerPhone}`,
        `Modalidade: ${order.fulfillment === 'pickup' ? 'Retirada' : 'Entrega'}`,
        ...(order.address ? [`Endereço: ${order.address}`] : []),
        ...order.items.map(
          (i) => `${i.quantity} ${i.unit} × ${i.name} — ${money(i.subtotalCents)}`,
        ),
        `Total: ${money(order.totalCents)}`,
        ...(order.notes ? [`Observações: ${order.notes}`] : []),
      ].join('\n')
    : '';

  return (
    <section className="orders-panel">
      <h2>Faça seu pedido</h2>

      {order ? (
        <div role="status">
          <p>
            <strong>Pedido registrado!</strong> Nº {order.id}
          </p>
          <p>Total: {money(order.totalCents)}</p>
          <p>Envie o resumo para combinar o atendimento com a barraca. O envio não é automático.</p>
          <a
            className="orders-action"
            href={
              'https://wa.me/' +
              (stall.whatsapp || '').replace(/\D/g, '') +
              '?text=' +
              encodeURIComponent(message)
            }
            target="_blank"
            rel="noreferrer"
          >
            Compartilhar resumo no WhatsApp
          </a>
        </div>
      ) : (
        <form onSubmit={submit}>
          <p>Selecione a quantidade de cada produto:</p>

          {products
            .filter((p) => p.available)
            .map((p) => (
              <label className="orders-product" key={p.id}>
                <span>
                  {p.name} — {money(p.priceCents)} / {p.unit}{' '}
                </span>
                <input
                  aria-label={'Quantidade de ' + p.name}
                  type="number"
                  min="0"
                  step={p.unit === 'kg' ? '0.5' : '1'}
                  value={qty[p.id] || 0}
                  onChange={(e) => {
                    setRequestId(crypto.randomUUID());
                    setQty((v) => ({
                      ...v,
                      [p.id]: Number(e.target.value),
                    }));
                  }}
                />
              </label>
            ))}

          <p>
            <strong>Total: {money(total)}</strong>
          </p>

          <label>
            Seu nome
            <input
              required
              maxLength={100}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setRequestId(crypto.randomUUID());
              }}
            />
          </label>

          <label>
            WhatsApp com DDD
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setRequestId(crypto.randomUUID());
              }}
            />
          </label>

          <label>
            Recebimento
            <select
              value={fulfillment}
              onChange={(e) => {
                setFulfillment(e.target.value as 'pickup' | 'delivery');
                setRequestId(crypto.randomUUID());
              }}
            >
              <option value="pickup">Retirar na barraca</option>
              <option value="delivery">Receber entrega</option>
            </select>
          </label>

          {fulfillment === 'delivery' && (
            <label>
              Endereço
              <input
                required
                maxLength={300}
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setRequestId(crypto.randomUUID());
                }}
              />
            </label>
          )}

          <label>
            Observações
            <textarea
              maxLength={500}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setRequestId(crypto.randomUUID());
              }}
            />
          </label>

          {error && <p role="alert">{error}</p>}

          <button className="orders-action" disabled={busy || !selected.length} type="submit">
            {busy ? 'Registrando...' : 'Confirmar pedido'}
          </button>

          <small>O pagamento e a entrega serão combinados diretamente com a barraca.</small>
        </form>
      )}
    </section>
  );
}

// PEDIDOS DO FEIRANTE — ABA RETRÁTIL
export function SellerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  async function refresh() {
    try {
      setOrders(await api<Order[]>('/orders'));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function update(id: string, status: string) {
    setBusy(id);
    setError('');

    try {
      await api('/orders/' + encodeURIComponent(id) + '/status', {
        method: 'PATCH',
        body: send({ status }),
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="orders-panel">
      <details open={new URLSearchParams(location.search).has('pedido') || undefined}>
        <summary
          style={{
            cursor: 'pointer',
            fontWeight: 600,
            padding: '4px 0',
          }}
        >
          Pedidos recebidos ({orders.length})
        </summary>

        <button type="button" onClick={() => void refresh()}>
          Atualizar pedidos
        </button>

        {error && <p role="alert">{error}</p>}

        {orders.length === 0 ? (
          <p>Nenhum pedido registrado até agora.</p>
        ) : (
          orders.map((o) => (
            <article className="seller-order" key={o.id}>
              <strong>
                {o.customerName} — {money(o.totalCents)}
              </strong>

              <p>
                {new Date(o.createdAt).toLocaleString('pt-BR')} · {labels[o.status]}
              </p>

              <p>
                {o.fulfillment === 'delivery' ? 'Entrega: ' + o.address : 'Retirada na barraca'} ·{' '}
                {o.customerPhone}
              </p>

              {o.items.map((i, j) => (
                <p key={j}>
                  {i.quantity} {i.unit} × {i.name} — {money(i.subtotalCents)}
                </p>
              ))}

              {o.notes && <p>Obs.: {o.notes}</p>}

              <div className="order-buttons">
                {o.status === 'received' && (
                  <button disabled={busy === o.id} onClick={() => update(o.id, 'preparing')}>
                    Iniciar preparo
                  </button>
                )}

                {o.status === 'preparing' && (
                  <button disabled={busy === o.id} onClick={() => update(o.id, 'ready')}>
                    Marcar pronto
                  </button>
                )}

                {o.status === 'ready' && (
                  <button disabled={busy === o.id} onClick={() => update(o.id, 'completed')}>
                    Concluir venda
                  </button>
                )}

                {!['completed', 'cancelled'].includes(o.status) && (
                  <button disabled={busy === o.id} onClick={() => update(o.id, 'cancelled')}>
                    Cancelar pedido
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </details>
    </section>
  );
}

// PAINEL DO FEIRANTE — PRESERVADO
// Indicadores não são expostos no catálogo público.
export function SellerOverview({ products }: { products: Product[] }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [inventory, setInventory] = useState<Product[]>(products);

  async function refreshOverview() {
    try {
      const [currentOrders, progress] = await Promise.all([
        api<Order[]>('/orders'),
        api<{ products: Product[] }>('/onboarding'),
      ]);

      setOrders(currentOrders);
      setInventory(progress.products);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    void refreshOverview();
  }, []);

  const completed = orders.filter((o) => o.status === 'completed');
  const salesCents = completed.reduce((sum, o) => sum + o.totalCents, 0);

  return (
    <section className="orders-panel" id="painel-barraca" aria-label="Painel da barraca">
      <h3>Resumo da sua barraca</h3>

      <button type="button" onClick={() => void refreshOverview()}>
        Atualizar dados
      </button>

      {error && <p role="alert">{error}</p>}

      <div className="owner-stats">
        <div>
          <strong>{completed.length}</strong>
          <span>Vendas concluídas</span>
        </div>

        <div>
          <strong>{money(salesCents)}</strong>
          <span>Total vendido</span>
        </div>

        <div>
          <strong>—</strong>
          <span>Avaliação: ainda não disponível</span>
        </div>
      </div>

      <h4>Estoque disponível</h4>

      {inventory.length === 0 ? (
        <p>Nenhum produto cadastrado.</p>
      ) : (
        <ul className="owner-stock">
          {inventory.map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              <strong>
                {p.stock} {p.unit}
              </strong>
              <small>{p.available && p.stock > 0 ? 'Disponível' : 'Indisponível'}</small>
            </li>
          ))}
        </ul>
      )}

      <small>
        Vendas contabilizadas apenas quando concluídas. Pedidos cancelados não entram no total. O
        estoque é reservado ao confirmar o pedido.
      </small>
    </section>
  );
}
