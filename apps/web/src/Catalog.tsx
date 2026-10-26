import { Sprout, Store } from 'lucide-react';
import { Money } from './design-system';
import type { Product, Stall } from './models';
export function Catalog({
  stall,
  products,
  preview = false,
}: {
  stall: Stall;
  products: Product[];
  preview?: boolean;
}) {
  return (
    <section className="catalog">
      <div className="catalog-cover">
        <Sprout size={45} />
      </div>
      <div className="catalog-heading">
        <div className="stall-icon">
          <Store />
        </div>
        {preview ? <span className="eyebrow">Sua barraca</span> : null}
        <h2>{stall.name || 'Sua barraca'}</h2>
        {stall.description ? <p>{stall.description}</p> : null}
      </div>
      <div className="catalog-products">
        {products.map((p) => (
          <article className="product-card" key={p.id}>
            <img src={p.photoUrl} alt={p.name} />
            <div>
              <span className="product-status">{p.available ? 'Disponível' : 'Indisponível'}</span>
              <h3>{p.name}</h3>
              <p>
                <Money value={p.priceCents} />
                <small> / {p.unit === 'un' ? 'unidade' : 'kg'}</small>
              </p>
            </div>
          </article>
        ))}
      </div>
      <p className="catalog-footer">
        <b>caxi.</b>
      </p>
    </section>
  );
}
