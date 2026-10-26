import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  ExternalLink,
  Leaf,
  Link,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBasket,
  Smartphone,
  Sprout,
  Store,
  Upload,
  Camera,
  Minus,
  Plus,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { api, send, setCsrf, ApiError } from './api';
import { Brand, Button, Field, Notice } from './design-system';
import './styles.css';
import './simple-ui.css';
import { Catalog } from './Catalog';
import { Checkout, SellerOrders, SellerOverview } from './Orders';
import type { Product, Stall } from './models';
type Stage =
  'welcome' | 'interest' | 'waiting' | 'login' | 'code' | 'stall' | 'product' | 'preview' | 'done';
const emptyProduct = {
  id: '',
  name: '',
  priceCents: 0,
  unit: 'kg' as const,
  stock: 0,
  photoUrl: '',
  available: true,
};
const steps = ['Barraca', 'Produto', 'Conferir'];
function App() {
  const [stage, setStage] = useState<Stage>('welcome'),
    [demo, setDemo] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [name, setName] = useState(''),
    [phone, setPhone] = useState(''),
    [interestId, setInterestId] = useState(''),
    [challengeId, setChallengeId] = useState(''),
    [code, setCode] = useState(''),
    [demoCode, setDemoCode] = useState(''),
    [cooldown, setCooldown] = useState(0);
  const [productPart, setProductPart] = useState(0);
  const [stall, setStall] = useState<Stall>({
      id: '',
      name: '',
      description: '',
      published: false,
    }),
    [products, setProducts] = useState<Product[]>([]),
    [product, setProduct] = useState<Product>(emptyProduct),
    [price, setPrice] = useState(''),
    [stock, setStock] = useState(''),
    [draftSaved, setDraftSaved] = useState(false),
    [publicData, setPublicData] = useState<{ stall: Stall; products: Product[] } | null>(null);
  const publicId = location.pathname.startsWith('/b/') ? location.pathname.split('/')[2] : null;
  function go(next: Stage) {
    setError('');
    setNotice('');
    setStage(next);
    if (next === 'product') setProductPart(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function loadProgress() {
    const data = await api('/onboarding');
    setStall(data.stall);
    setProducts(data.products);
    const first = data.products[0];
    if (first) {
      setProduct(first);
      setPrice((first.priceCents / 100).toFixed(2).replace('.', ','));
      setStock(String(first.stock).replace('.', ','));
    }
    go(
      data.stall.published
        ? 'done'
        : !data.stall.name
          ? 'stall'
          : !data.products.length
            ? 'product'
            : 'preview',
    );
  }
  useEffect(() => {
    (async () => {
      try {
        const config = await api('/config');
        setDemo(config.demo);
        if (publicId) {
          setPublicData(await api('/catalog/' + encodeURIComponent(publicId)));
          return;
        }
        try {
          const session = await api('/auth/session');
          setCsrf(session.csrf);
          await loadProgress();
        } catch (e) {
          if (!(e instanceof ApiError && e.status === 401)) throw e;
        }
      } catch (e) {
        setError('Sem conexão. Confira a internet e tente de novo.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => {
    if (stage === 'product') {
      document.getElementById('product-title')?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [stage, productPart]);
  useEffect(() => {
    if (error)
      document
        .querySelector('[role="alert"]')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [error]);
  // Local draft is scoped to the stable stall id. It contains no phone, code or session.
  useEffect(() => {
    if (!stall.id) return;
    const raw = localStorage.getItem('caxi-draft:' + stall.id);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setStall((s) => ({ ...s, name: d.stall.name, description: d.stall.description }));
        // A saved draft must never override the server's inventory for an existing product.
        if (!d.product?.id) {
          setProduct(d.product);
          setPrice(d.price);
          setStock(d.stock);
        }
        setNotice('Seu cadastro foi recuperado.');
      } catch {
        localStorage.removeItem('caxi-draft:' + stall.id);
      }
    }
  }, [stall.id]);
  useEffect(() => {
    if (!stall.id || !['stall', 'product'].includes(stage)) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          'caxi-draft:' + stall.id,
          JSON.stringify({ stall, product, price, stock }),
        );
        setDraftSaved(true);
      } catch {
        setDraftSaved(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [stall, product, price, stock, stage]);
  async function requestCode() {
    const result = await api('/auth/code', { method: 'POST', body: send({ phone }) });
    setChallengeId(result.challengeId);
    setDemoCode(result.demoCode || '');
    setCode('');
    setCooldown(30);
    go('code');
  }
  const url = stall.id ? `${location.origin}/b/${stall.id}` : '';
  async function share(copyOnly = false) {
    await run(async () => {
      if (!copyOnly && navigator.share) {
        await navigator.share({ title: stall.name, text: 'Conheça minha barraca no Caxi', url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setNotice(copyOnly ? 'Link copiado!' : 'Pronto!');
      await api('/events/shared', { method: 'POST' });
    });
  }
  if (loading)
    return (
      <main className="loading">
        <Sprout size={42} />
        <p>Carregando…</p>
      </main>
    );
  if (publicId)
    return (
      <>
        <header className="topbar">
          <Brand />
          <span className="top-note">Sua feira, mais perto.</span>
        </header>
        <main className="public-shell">
          {error ? (
            <Notice tone="error">{error}</Notice>
          ) : publicData?.stall.published ? (
            <>
              <Catalog {...publicData} />
              <Checkout stall={publicData.stall} products={publicData.products} />
            </>
          ) : (
            <div className="empty">
              <Sprout size={52} />
              <h1>Barraca em preparação</h1>
              <p>Volte depois para ver os produtos.</p>
            </div>
          )}
        </main>
      </>
    );
  const step = ['stall', 'product', 'preview', 'done'].includes(stage)
    ? ['stall', 'product', 'preview', 'done'].indexOf(stage)
    : -1;
  return (
    <>
      <header className="topbar">
        <Brand />
        <div className="top-actions">
          <span className="top-note">
            <ShieldCheck size={15} /> Feito para quem vive da feira
          </span>
          {step >= 0 ? (
            <button
              className="text-button"
              aria-label="Sair da conta"
              onClick={() =>
                run(async () => {
                  await api('/auth/logout', { method: 'POST' });
                  setCsrf('');
                  setStall({ id: '', name: '', description: '', published: false });
                  setProducts([]);
                  setProduct(emptyProduct);
                  setPrice('');
                  setStock('');
                  go('welcome');
                })
              }
            >
              <LogOut size={18} />
              Sair
            </button>
          ) : (
            <button className="text-button" onClick={() => go('login')}>
              Entrar <span>↗</span>
            </button>
          )}
        </div>
      </header>
      {demo ? (
        <div className="demo-banner">
          <span className="demo-dot" /> Versão de teste · não envia mensagens
        </div>
      ) : null}
      {stage === 'welcome' && error ? <Notice tone="error">{error}</Notice> : null}
      {stage === 'welcome' ? (
        <main className="landing">
          <section className="hero">
            <div className="hero-copy">
              <h1>
                Sua barraca
                <br />
                <em>na internet.</em>
              </h1>
              <p>Mostre seus produtos e preços para seus clientes.</p>
              <Button onClick={() => go('interest')}>Criar minha barraca</Button>
              <span className="hero-footnote">
                <CheckCheck size={18} /> Não precisa instalar nada.
              </span>
              <div className="hero-stats">
                <span>
                  <Store aria-hidden="true" />
                  <b>1</b> Nome
                </span>
                <span>
                  <Camera aria-hidden="true" />
                  <b>2</b> Produto
                </span>
                <span>
                  <MessageCircle aria-hidden="true" />
                  <b>3</b> WhatsApp
                </span>
              </div>
            </div>
            <div className="hero-art" aria-label="Ilustração de uma barraca com vegetais">
              <div className="art-orbit" />
              <div className="art-tag">
                <Leaf size={16} /> Sua barraca
              </div>
              <div className="illustrated-stall">
                <div className="awning-top" />
                <div className="awning">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="stall-sign">DA NOSSA HORTA</div>
                <div className="veggies">
                  <span>🥬</span>
                  <span>🥕</span>
                  <span>🍅</span>
                  <span>🥦</span>
                </div>
                <div className="stall-counter">
                  <Sprout size={34} />
                  <b>feito com cuidado.</b>
                </div>
              </div>
              <div className="floating-note">
                <span className="note-check">
                  <Check size={18} />
                </span>
                <div>
                  <b>Sua barraca está online!</b>
                  <small>Pronta para mostrar aos clientes.</small>
                </div>
              </div>
            </div>
          </section>
          <footer className="site-footer">
            <span>Caxi · Sua barraca online.</span>
          </footer>
        </main>
      ) : (
        <main className="workspace">
          <aside className="journey-aside">
            <h1>
              Sua barraca,
              <br />
              <em>passo a passo.</em>
            </h1>
            <div className="aside-steps">
              {steps.map((label, i) => (
                <div
                  key={label}
                  className={(step === i ? 'current ' : '') + (step > i ? 'complete' : '')}
                >
                  <span>{step > i ? <Check size={16} /> : String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <b>{label}</b>
                  </div>
                </div>
              ))}
            </div>
          </aside>
          <section className={`flow ${stage === 'product' ? 'product-flow' : ''}`}>
            <div className="flow-top">
              {stage !== 'done' ? (
                <button
                  className="text-button back"
                  onClick={() =>
                    stage === 'product' && productPart > 0
                      ? setProductPart(productPart - 1)
                      : go(
                          (
                            {
                              interest: 'welcome',
                              waiting: 'interest',
                              login: 'welcome',
                              code: 'login',
                              stall: 'login',
                              product: 'stall',
                              preview: 'product',
                            } as Record<string, Stage>
                          )[stage] || 'welcome',
                        )
                  }
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
              ) : (
                <span />
              )}
              <span>
                {step >= 0 && stage !== 'done'
                  ? stage === 'product'
                    ? `PRODUTO ${productPart + 1} DE 3`
                    : `ETAPA ${Math.min(step + 1, 3)} DE 3`
                  : ''}
              </span>
            </div>
            {step >= 0 && stage !== 'done' && stage !== 'product' ? (
              <div className="mobile-progress">
                {steps.map((s, i) => (
                  <span key={s} className={i <= step ? 'active' : ''} />
                ))}
              </div>
            ) : null}
            {error ? <Notice tone="error">{error}</Notice> : null}
            {notice ? <Notice tone="success">{notice}</Notice> : null}
            {stage === 'interest' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    const result = await api('/interests', {
                      method: 'POST',
                      body: send({ name, phone }),
                    });
                    setInterestId(result.id);
                    go('waiting');
                  });
                }}
              >
                <div className="section-icon">
                  <Sprout />
                </div>
                <h2>Qual é o seu nome?</h2>
                <Field
                  label="Seu nome"
                  id="name"
                  autoComplete="name"
                  placeholder="Ex.: Ana"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Field
                  label="Seu WhatsApp com DDD"
                  id="phone"
                  autoComplete="tel"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  hint="Ex.: 11 99999-9999"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <div className="privacy-note">
                  <ShieldCheck size={18} />
                  <span>Usamos seu nome e telefone para liberar seu acesso.</span>
                </div>
                <Button type="submit" busy={busy}>
                  Pedir acesso
                </Button>
                <p className="form-foot">
                  Já tem acesso?{' '}
                  <button type="button" className="inline-button" onClick={() => go('login')}>
                    Entrar
                  </button>
                </p>
              </form>
            ) : null}
            {stage === 'waiting' ? (
              <div>
                <div className="section-icon">
                  <CheckCheck />
                </div>
                <h2>Pedido recebido!</h2>
                <p className="intro">Agora, aguarde a equipe liberar seu acesso.</p>
                {demo ? (
                  <div className="demo-panel">
                    <p>Só neste teste: você pode liberar o acesso.</p>
                    <Button
                      busy={busy}
                      onClick={() =>
                        run(async () => {
                          await api('/demo/interests/' + interestId + '/approve', {
                            method: 'POST',
                          });
                          go('login');
                          setNotice('Acesso liberado para o teste.');
                        })
                      }
                    >
                      Liberar acesso de teste
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => go('login')}>Meu acesso já foi liberado</Button>
                )}
              </div>
            ) : null}
            {stage === 'login' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(requestCode);
                }}
              >
                <div className="section-icon">
                  <MessageCircle />
                </div>
                <h2>Qual é o seu WhatsApp?</h2>
                <p className="intro">Use o número que você cadastrou.</p>
                <Field
                  label="WhatsApp com DDD"
                  id="login-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Button type="submit" busy={busy}>
                  Receber código
                </Button>
                <p className="form-foot">
                  Ainda não tem acesso?{' '}
                  <button type="button" className="inline-button" onClick={() => go('interest')}>
                    Pedir acesso
                  </button>
                </p>
              </form>
            ) : null}
            {stage === 'code' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    const result = await api('/auth/verify', {
                      method: 'POST',
                      body: send({ challengeId, code }),
                    });
                    setCsrf(result.csrf);
                    await loadProgress();
                  });
                }}
              >
                <div className="section-icon">
                  <ShieldCheck />
                </div>
                <h2>Digite o código.</h2>
                <p className="intro">
                  {demo ? 'Use o código de teste abaixo.' : 'Veja o código no WhatsApp:'}{' '}
                  {!demo ? <b>{phone}</b> : null}
                </p>
                {demoCode ? (
                  <Notice>
                    Código de teste: <b>{demoCode}</b>
                  </Notice>
                ) : null}
                <Field
                  label="Código com 6 números"
                  id="code"
                  className="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
                <Button type="submit" busy={busy}>
                  Entrar
                </Button>
                <p className="form-foot">
                  <button
                    type="button"
                    className="inline-button"
                    disabled={cooldown > 0 || busy}
                    onClick={() => run(requestCode)}
                  >
                    {cooldown ? `Reenviar em ${cooldown}s` : 'Reenviar código'}
                  </button>
                </p>
              </form>
            ) : null}
            {stage === 'stall' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    const result = await api('/stalls/mine', {
                      method: 'PUT',
                      body: send({ name: stall.name, description: stall.description }),
                    });
                    setStall(result);
                    go('product');
                  });
                }}
              >
                <div className="section-icon">
                  <Store />
                </div>
                <h2>Qual é o nome da barraca?</h2>
                <Field
                  label="Nome da barraca"
                  id="stall-name"
                  placeholder="Ex.: Horta da Dona Ana"
                  required
                  maxLength={80}
                  value={stall.name}
                  onChange={(e) => setStall({ ...stall, name: e.target.value })}
                />
                <details className="optional-details">
                  <summary>Adicionar uma descrição (opcional)</summary>
                  <label className="field">
                    <span>Sobre a barraca</span>
                    <textarea
                      placeholder="Ex.: Verduras frescas todos os dias"
                      maxLength={300}
                      value={stall.description}
                      onChange={(e) => setStall({ ...stall, description: e.target.value })}
                    />
                  </label>
                </details>
                <div className="save-hint">
                  <CheckCheck size={16} />
                  {draftSaved ? 'Salvo neste celular.' : 'Você pode continuar depois.'}
                </div>
                <Button type="submit" busy={busy}>
                  Continuar
                </Button>
              </form>
            ) : null}
            {stage === 'product' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    if (productPart === 0) {
                      if (!product.photoUrl) throw new Error('Adicione uma foto para continuar.');
                      if (!product.name.trim()) throw new Error('Digite o nome do produto.');
                      setProductPart(1);
                      return;
                    }
                    if (!/^\d+([,.]\d{1,2})?$/.test(price))
                      throw new Error('Digite o preço assim: 8,50.');
                    if (Number(price.replace(',', '.')) <= 0)
                      throw new Error('O preço precisa ser maior que zero.');
                    if (Number(price.replace(',', '.')) > 100000)
                      throw new Error('Esse preço está muito alto. Confira o valor.');
                    if (productPart === 1) {
                      setProductPart(2);
                      return;
                    }
                    if (!/^\d+([,.]\d+)?$/.test(stock))
                      throw new Error('Informe uma quantidade válida.');
                    const input = {
                      name: product.name,
                      priceCents: Math.round(Number(price.replace(',', '.')) * 100),
                      unit: product.unit,
                      stock: Number(stock.replace(',', '.')),
                      photoUrl: product.photoUrl,
                      version: product.version,
                      available: product.available,
                    };
                    let saved: Product;
                    try {
                      saved = await api('/products' + (product.id ? '/' + product.id : ''), {
                        method: product.id ? 'PATCH' : 'POST',
                        body: send(input),
                      });
                    } catch (e) {
                      if (e instanceof ApiError && e.status === 409 && product.id) {
                        const current = await api<Product[]>('/products');
                        const latest = current.find((p) => p.id === product.id);
                        setProducts(current);
                        if (latest) {
                          setProduct(latest);
                          setStock(String(latest.stock).replace('.', ','));
                          setPrice((latest.priceCents / 100).toFixed(2).replace('.', ','));
                        }
                        throw new Error(
                          'O produto mudou enquanto você editava. Atualizamos os dados; confira antes de salvar novamente.',
                        );
                      }
                      throw e;
                    }
                    setProduct(saved);
                    setProducts((prev) => [...prev.filter((p) => p.id !== saved.id), saved]);
                    localStorage.removeItem('caxi-draft:' + stall.id);
                    go('preview');
                  });
                }}
              >
                <div
                  className="product-progress"
                  aria-label={`Produto: passo ${productPart + 1} de 3`}
                >
                  {[
                    <Camera key="photo" />,
                    <span key="price">R$</span>,
                    <Package key="quantity" />,
                  ].map((icon, i) => (
                    <span
                      key={i}
                      className={i === productPart ? 'current' : i < productPart ? 'complete' : ''}
                    >
                      {i < productPart ? <Check aria-hidden="true" /> : icon}
                    </span>
                  ))}
                </div>
                <h2 id="product-title" tabIndex={-1}>
                  {['O que você vende?', 'Quanto custa?', 'Quanto você tem?'][productPart]}
                </h2>
                {productPart === 0 ? (
                  <>
                    <label className={'upload-area ' + (product.photoUrl ? 'has-photo' : '')}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={busy}
                        aria-label="Foto do produto"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            setError('Essa foto é muito grande. Tente outra.');
                            return;
                          }
                          run(async () => {
                            const form = new FormData();
                            form.append('file', file);
                            const result = await api('/uploads', { method: 'POST', body: form });
                            setProduct((p) => ({ ...p, photoUrl: result.url }));
                          });
                        }}
                      />
                      {product.photoUrl ? (
                        <>
                          <img src={product.photoUrl} alt="Foto do produto selecionada" />
                          <span className="change-photo">Trocar foto</span>
                        </>
                      ) : (
                        <>
                          <span className="upload-icon">
                            <Camera size={32} />
                          </span>
                          <b>Tirar ou escolher foto</b>
                        </>
                      )}
                    </label>
                    <Field
                      label="O que é?"
                      id="product-name"
                      placeholder="Ex.: Tomate"
                      required
                      maxLength={100}
                      value={product.name}
                      onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    />
                  </>
                ) : null}
                {productPart === 1 ? (
                  <>
                    <div className="product-reminder">
                      {product.photoUrl ? <img src={product.photoUrl} alt="" /> : null}
                      <strong>{product.name}</strong>
                    </div>
                    <Field
                      label="Preço (R$)"
                      id="price"
                      inputMode="decimal"
                      placeholder="0,00"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                    <fieldset className="unit-options">
                      <legend>Como você vende?</legend>
                      <label className={product.unit === 'kg' ? 'selected' : ''}>
                        <input
                          type="radio"
                          name="unit"
                          value="kg"
                          checked={product.unit === 'kg'}
                          onChange={() => setProduct({ ...product, unit: 'kg' })}
                        />
                        <span aria-hidden="true" className="unit-symbol">
                          1 kg
                        </span>
                        <span>Por quilo</span>
                      </label>
                      <label className={product.unit === 'un' ? 'selected' : ''}>
                        <input
                          type="radio"
                          name="unit"
                          value="un"
                          checked={product.unit === 'un'}
                          onChange={() => setProduct({ ...product, unit: 'un' })}
                        />
                        <span aria-hidden="true" className="unit-symbol">
                          1 un
                        </span>
                        <span>Por unidade</span>
                      </label>
                    </fieldset>
                  </>
                ) : null}
                {productPart === 2 ? (
                  <>
                    <div className="product-reminder">
                      {product.photoUrl ? <img src={product.photoUrl} alt="" /> : null}
                      <strong>{product.name}</strong>
                    </div>
                    <div className="quantity-control">
                      <button
                        type="button"
                        aria-label={
                          product.unit === 'kg' ? 'Diminuir meio quilo' : 'Diminuir uma unidade'
                        }
                        onClick={() => {
                          const current = Number(stock.replace(',', '.'));
                          if (
                            !Number.isFinite(current) ||
                            current < 0 ||
                            !Number.isInteger(current * (product.unit === 'kg' ? 2 : 1))
                          ) {
                            setError(
                              product.unit === 'kg'
                                ? 'Use 1 ou 1,5 ou 2 kg.'
                                : 'Use um número inteiro, como 1 ou 2.',
                            );
                            return;
                          }
                          setError('');
                          setStock(
                            String(
                              Math.max(0, current - (product.unit === 'kg' ? 0.5 : 1)),
                            ).replace('.', ','),
                          );
                        }}
                      >
                        <Minus aria-hidden="true" />
                      </button>
                      <Field
                        label={
                          product.unit === 'kg' ? 'Quilos para vender' : 'Unidades para vender'
                        }
                        id="stock"
                        inputMode="decimal"
                        placeholder="0"
                        required
                        hint={
                          product.unit === 'kg' ? 'Ex.: 1 kg ou 1,5 kg' : 'Ex.: 1, 2 ou 3 unidades'
                        }
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                      />
                      <button
                        type="button"
                        aria-label={
                          product.unit === 'kg' ? 'Adicionar meio quilo' : 'Adicionar uma unidade'
                        }
                        onClick={() => {
                          const current = Number(stock.replace(',', '.'));
                          if (
                            !Number.isFinite(current) ||
                            current < 0 ||
                            !Number.isInteger(current * (product.unit === 'kg' ? 2 : 1))
                          ) {
                            setError(
                              product.unit === 'kg'
                                ? 'Use 1 ou 1,5 ou 2 kg.'
                                : 'Use um número inteiro, como 1 ou 2.',
                            );
                            return;
                          }
                          setError('');
                          setStock(
                            String(current + (product.unit === 'kg' ? 0.5 : 1)).replace('.', ','),
                          );
                        }}
                      >
                        <Plus aria-hidden="true" />
                      </button>
                    </div>
                  </>
                ) : null}
                <Button type="submit" busy={busy}>
                  {productPart < 2 ? 'Continuar' : 'Salvar produto'}
                </Button>
              </form>
            ) : null}
            {stage === 'preview' ? (
              <div>
                <h2>Está tudo certo?</h2>
                <Catalog stall={stall} products={products} preview />
                <div className="review-actions">
                  <button className="text-button" onClick={() => go('stall')}>
                    Editar barraca
                  </button>
                  <button className="text-button" onClick={() => go('product')}>
                    Editar produto
                  </button>
                </div>
                <Notice>Seus clientes poderão ver sua barraca e os produtos.</Notice>
                <Button
                  busy={busy}
                  onClick={() =>
                    run(async () => {
                      const result = await api('/stalls/mine/publish', { method: 'POST' });
                      setStall(result);
                      localStorage.removeItem('caxi-draft:' + stall.id);
                      go('done');
                    })
                  }
                >
                  Está certo. Publicar
                </Button>
              </div>
            ) : null}
            {stage === 'done' ? (
              <div>
                <SellerOverview products={products} />
                <SellerOrders />
                <div className="success-icon">
                  <Check size={34} />
                </div>
                <h2>
                  Sua barraca
                  <br />
                  <em>já está online!</em>
                </h2>
                <p className="intro">Mostre seus produtos aos clientes.</p>
                <div className="published-card">
                  <div className="section-icon">
                    <Store />
                  </div>
                  <div>
                    <h3>{stall.name}</h3>
                    <span className="live">
                      <i /> Pronta
                    </span>
                  </div>
                  <a href={url} target="_blank" rel="noreferrer" aria-label="Abrir catálogo">
                    <ExternalLink size={20} />
                  </a>
                </div>
                <details className="optional-details">
                  <summary>Ver link da barraca</summary>
                  <label className="field">
                    <span>O link da sua barraca</span>
                    <div className="copy-field">
                      <input readOnly value={url} aria-label="Link público da barraca" />
                      <button aria-label="Copiar link" onClick={() => share(true)}>
                        <Copy size={19} />
                      </button>
                    </div>
                  </label>
                </details>
                <a
                  className="button primary whatsapp-button"
                  href={
                    'https://wa.me/?text=' +
                    encodeURIComponent('Conheça minha barraca no Caxi: ' + url)
                  }
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    api('/events/shared', { method: 'POST' }).catch(() => {});
                  }}
                >
                  <MessageCircle size={19} />
                  Enviar no WhatsApp
                </a>
                <Button variant="secondary" busy={busy} onClick={() => share(true)}>
                  <Copy size={20} />
                  Copiar link
                </Button>
                <div className="done-links">
                  <a href="#painel-barraca">
                    <Eye size={17} /> Ver dados da barraca
                  </a>
                  <a href={url} target="_blank" rel="noreferrer">
                    <ExternalLink size={17} /> Ver catálogo do cliente
                  </a>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        const data = await api('/onboarding');
                        setStall(data.stall);
                        setProducts(data.products);
                        const first = data.products[0];
                        if (first) {
                          setProduct(first);
                          setPrice((first.priceCents / 100).toFixed(2).replace('.', ','));
                          setStock(String(first.stock).replace('.', ','));
                        }
                        go('product');
                      })
                    }
                  >
                    <Package size={17} /> Mudar produto
                  </button>
                  <button className="text-button" onClick={() => go('stall')}>
                    Editar barraca
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </main>
      )}
    </>
  );
}
const root = createRoot(document.getElementById('root')!);
if (location.pathname === '/design-system') {
  void import('./enzo/DesignSystem').then(({ DesignSystem }) =>
    root.render(
      <main className="page">
        <DesignSystem />
      </main>,
    ),
  );
} else
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
