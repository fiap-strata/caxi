import {
  ArrowDown,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  Leaf,
  Link as LinkIcon,
  MessageCircle,
  Package,
  ShoppingBasket,
  Smartphone,
  Sprout,
  Store,
} from 'lucide-react';
import { Brand, Button } from './design-system';
import './landing.css';

const steps = [
  {
    icon: Store,
    title: 'Apresente sua barraca',
    text: 'Depois de receber acesso, coloque o nome da sua barraca e conte um pouco sobre o que você vende.',
  },
  {
    icon: ShoppingBasket,
    title: 'Monte seu catálogo',
    text: 'Adicione uma foto, o preço e a quantidade disponível. Você pode vender por quilo ou por unidade.',
  },
  {
    icon: MessageCircle,
    title: 'Compartilhe e receba pedidos',
    text: 'Envie o link pelo WhatsApp. Seus clientes escolhem os produtos e você acompanha os pedidos no painel.',
  },
];

const features = [
  {
    icon: LinkIcon,
    title: 'Um link para seus produtos',
    text: 'Fotos, preços e disponibilidade juntos em um catálogo que você pode atualizar quando precisar.',
  },
  {
    icon: ClipboardList,
    title: 'Cada pedido no seu lugar',
    text: 'Veja os itens, as quantidades e o total. Acompanhe o atendimento do recebimento até a conclusão.',
  },
  {
    icon: Package,
    title: 'Estoque acompanhado de perto',
    text: 'A quantidade é reservada quando o pedido entra. Se ele for cancelado, ela volta para o estoque.',
  },
  {
    icon: BarChart3,
    title: 'Uma visão do seu movimento',
    text: 'Consulte a quantidade de pedidos concluídos, o valor dessas vendas e o estoque atual da barraca.',
  },
];

const questions = [
  {
    question: 'Para quem é o Caxi?',
    answer:
      'O Caxi foi pensado para vendedores permissionários, especialmente feirantes que querem mostrar seus produtos na internet e organizar os pedidos da barraca. O foco é uma rotina simples, com acesso pelo celular.',
  },
  {
    question: 'Preciso instalar algum aplicativo?',
    answer:
      'Não. O Caxi funciona pelo navegador do celular ou do computador. Seus clientes também abrem o catálogo pelo link, sem precisar instalar um aplicativo.',
  },
  {
    question: 'Como o WhatsApp entra nessa história?',
    answer:
      'Você compartilha o link do catálogo pelo WhatsApp. Depois de registrar o pedido, o cliente pode abrir um resumo no WhatsApp da barraca e escolher enviar a mensagem. A conversa continua por lá, enquanto o pedido fica organizado no Caxi.',
  },
  {
    question: 'Como funcionam o pagamento e a entrega?',
    answer:
      'O cliente informa se prefere retirada ou entrega ao fazer o pedido. Você combina os detalhes e o pagamento diretamente com ele. Nesta versão, o Caxi não processa pagamentos nem oferece uma frota de entregas.',
  },
  {
    question: 'Como posso começar a usar?',
    answer:
      'Clique em “Quero começar” e informe seu nome e WhatsApp para solicitar acesso. Depois da liberação, você poderá cadastrar a barraca e publicar seu primeiro catálogo. Na demonstração acadêmica, a própria tela permite liberar um acesso de teste.',
  },
];

export function Landing({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  return (
    <main className="landing landing-page" id="inicio">
      <section className="hero" aria-labelledby="landing-title">
        <div className="hero-copy">
          <span className="landing-eyebrow">
            <Sprout size={16} aria-hidden="true" /> FEITO PARA QUEM VIVE DA FEIRA
          </span>
          <h1 id="landing-title">
            Sua barraca
            <br />
            <em>na internet.</em>
            <br />
            Sua rotina mais simples.
          </h1>
          <p>
            Da banca para a tela: mostre seus produtos, receba pedidos e organize o dia a dia da sua
            barraca. Tudo pelo celular.
          </p>
          <div className="landing-hero-actions">
            <Button onClick={onStart}>Quero começar</Button>
            <a className="landing-text-link" href="#como-funciona">
              Veja como funciona <ArrowDown size={17} aria-hidden="true" />
            </a>
          </div>
          <span className="hero-footnote">
            <CheckCheck size={18} aria-hidden="true" /> Pelo navegador. Sem instalar nada.
          </span>
        </div>
        <div
          className="hero-art"
          role="img"
          aria-label="Ilustração de uma barraca de feira com vegetais e um aviso de catálogo publicado"
        >
          <div className="art-orbit" />
          <div className="art-tag">
            <Leaf size={16} /> Da feira para o digital
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
              <small>Pronta para receber novos pedidos.</small>
            </div>
          </div>
          <span className="art-caption">O CUIDADO É O MESMO. O ALCANCE É MAIOR.</span>
        </div>
      </section>

      <div className="landing-highlights" aria-label="O que você encontra no Caxi">
        <span>
          <Smartphone aria-hidden="true" /> Feito para o celular
        </span>
        <span>
          <ShoppingBasket aria-hidden="true" /> Catálogo com a sua cara
        </span>
        <span>
          <MessageCircle aria-hidden="true" /> Pertinho pelo WhatsApp
        </span>
      </div>

      <section className="landing-about landing-section" id="sobre" aria-labelledby="about-title">
        <div>
          <span className="landing-eyebrow">TECNOLOGIA COM O PÉ NA FEIRA</span>
          <h2 id="about-title">
            Você cuida da barraca.
            <br />
            <em>O Caxi ajuda a organizar.</em>
          </h2>
        </div>
        <div className="landing-about-copy">
          <p>
            Quem vive da feira já tem muita coisa para cuidar: os produtos, os preços, o estoque e
            cada cliente que chega.
          </p>
          <p>
            O Caxi é um projeto criado para apoiar essa rotina. Reúne a vitrine da barraca e os
            pedidos em um só lugar, mantendo a conversa próxima com o cliente pelo WhatsApp.
          </p>
          <span className="landing-about-note">
            <Sprout size={20} aria-hidden="true" /> Mais organização para o pequeno comércio.
          </span>
        </div>
      </section>

      <section
        className="landing-section landing-how"
        id="como-funciona"
        aria-labelledby="how-title"
      >
        <div className="landing-section-heading">
          <div>
            <span className="landing-eyebrow">DO SEU JEITO, PASSO A PASSO</span>
            <h2 id="how-title">Sua feira online começa aqui.</h2>
          </div>
          <p>Um caminho simples para levar o que você vende a quem já compra de você.</p>
        </div>
        <ol className="landing-steps">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <div className="landing-step-top">
                <span className="landing-icon">
                  <Icon size={26} aria-hidden="true" />
                </span>
                <span className="landing-step-number">0{i + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="landing-section landing-features"
        id="recursos"
        aria-labelledby="features-title"
      >
        <div className="landing-section-heading">
          <div>
            <span className="landing-eyebrow">DA VITRINE AO PEDIDO</span>
            <h2 id="features-title">
              Menos coisa espalhada.
              <br />
              <em>Mais clareza no dia a dia.</em>
            </h2>
          </div>
          <p>Ferramentas que se conectam para acompanhar o movimento da sua barraca.</p>
        </div>
        <div className="landing-features-layout">
          <div className="landing-order-scene">
            <div className="landing-example-label">
              <span /> UM EXEMPLO NA PRÁTICA
            </div>
            <div className="landing-order-preview">
              <div className="landing-order-header">
                <span className="landing-icon">
                  <Store size={22} aria-hidden="true" />
                </span>
                <div>
                  <b>Barraca da Ana</b>
                  <small>Pedido de exemplo · #001</small>
                </div>
                <ShoppingBasket size={22} aria-hidden="true" />
              </div>
              <div className="landing-order-customer">
                <b>Uma compra fresquinha.</b>
                <span>Retirada na barraca</span>
              </div>
              <div className="landing-order-item">
                <span className="landing-produce" aria-hidden="true">
                  🍅
                </span>
                <div>
                  <b>Tomate</b>
                  <small>1 kg × R$ 8,00</small>
                </div>
                <strong>R$ 8,00</strong>
              </div>
              <div className="landing-order-item">
                <span className="landing-produce" aria-hidden="true">
                  🥬
                </span>
                <div>
                  <b>Alface</b>
                  <small>2 un. × R$ 4,00</small>
                </div>
                <strong>R$ 8,00</strong>
              </div>
              <div className="landing-order-total">
                <span>Total do pedido</span>
                <strong>R$ 16,00</strong>
              </div>
              <div className="landing-order-status">
                <CheckCheck size={18} aria-hidden="true" /> Pedido recebido e estoque reservado
              </div>
            </div>
            <p>O cliente escolhe. O pedido chega organizado.</p>
          </div>
          <div className="landing-feature-list">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title}>
                <span className="landing-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-whatsapp landing-section" aria-labelledby="whatsapp-title">
        <span className="landing-whatsapp-icon">
          <MessageCircle size={36} aria-hidden="true" />
        </span>
        <div>
          <span className="landing-eyebrow">A CONVERSA CONTINUA</span>
          <h2 id="whatsapp-title">
            O mesmo contato de sempre.
            <br />
            Com os pedidos mais organizados.
          </h2>
          <p>
            Compartilhe seu catálogo e combine os detalhes com seus clientes pelo WhatsApp. O Caxi
            cuida do registro para você acompanhar cada pedido.
          </p>
        </div>
        <a
          href="#como-funciona"
          className="landing-round-link"
          aria-label="Ver como funciona o Caxi"
        >
          <ArrowUpRight size={25} aria-hidden="true" />
        </a>
      </section>

      <section className="landing-section landing-faq" id="duvidas" aria-labelledby="faq-title">
        <div>
          <span className="landing-eyebrow">ANTES DE COMEÇAR</span>
          <h2 id="faq-title">Ficou alguma dúvida?</h2>
          <p>Um pouco mais sobre o Caxi e como ele pode fazer parte da sua rotina.</p>
        </div>
        <div className="landing-questions">
          {questions.map(({ question, answer }) => (
            <details key={question}>
              <summary>
                {question}
                <ChevronDown size={20} aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-cta" aria-labelledby="cta-title">
        <Sprout size={38} aria-hidden="true" />
        <span className="landing-eyebrow">VAMOS CULTIVAR ESSA IDEIA?</span>
        <h2 id="cta-title">
          Sua próxima venda pode
          <br />
          começar com um link.
        </h2>
        <p>Solicite seu acesso e dê o primeiro passo para levar sua barraca para a internet.</p>
        <Button onClick={onStart}>Quero começar</Button>
        <span className="landing-cta-login">
          Já tem acesso?{' '}
          <button type="button" onClick={onLogin}>
            Entre na sua barraca <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        </span>
      </section>

      <footer className="site-footer landing-footer">
        <div>
          <Brand />
          <p>
            Da feira para a tela.
            <br />
            Sempre perto de quem compra.
          </p>
        </div>
        <nav aria-label="Links do rodapé">
          <a href="#sobre">O projeto</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#recursos">Recursos</a>
          <a href="#duvidas">Dúvidas</a>
        </nav>
        <span>
          Feito para quem vive da feira.<small>Caxi · Projeto acadêmico em evolução.</small>
        </span>
      </footer>
    </main>
  );
}
