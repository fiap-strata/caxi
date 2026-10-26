import './styles/tokens.css';
import './styles/components.css';
import './styles/base.css';
import { useState, type ReactNode } from 'react';
import { Button, ChoiceGroup, Field, Notice, QuantityControl, StepProgress } from './components';

// Vitrine dos componentes, com os mesmos estados das variantes do Figma.
// Serve para revisar visualmente e para quem for montar telas copiar o uso.

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="ds-section">
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}

export function DesignSystem() {
  const [kg, setKg] = useState(2.5);
  const [un, setUn] = useState(0);
  const [vendidoPor, setVendidoPor] = useState<'kg' | 'un' | null>('kg');
  const [salvando, setSalvando] = useState(false);

  const simularSalvar = () => {
    setSalvando(true);
    setTimeout(() => setSalvando(false), 1500);
  };

  return (
    <>
      <section className="hero">
        <h1>Design System</h1>
        <p className="lead">Componentes do Caxi em React, com os tokens do Figma.</p>
        <p>
          <a href="/">Voltar ao início</a>
        </p>
      </section>

      <Secao titulo="Button">
        <Button onClick={simularSalvar} busy={salvando}>
          Continuar
        </Button>
        <Button variant="secondary">Adicionar outro</Button>
        <Button variant="ghost">Pular por agora</Button>
        <Button variant="whatsapp">Enviar no WhatsApp</Button>
        <Button disabled>Continuar</Button>
        <Button busy>Continuar</Button>
      </Secao>

      <Secao titulo="Field">
        <Field
          label="Nome do produto"
          placeholder="Ex.: Tomate italiano"
          hint="Use o nome que o cliente conhece."
        />
        <Field
          label="Preço (R$)"
          type="money"
          placeholder="0,00"
          hint="Use vírgula para os centavos."
        />
        <Field
          label="Preço (R$)"
          type="money"
          defaultValue="0"
          error="Informe um preço maior que zero."
        />
        <Field label="Nome do produto" placeholder="Ex.: Tomate italiano" disabled />
      </Secao>

      <Secao titulo="Notice">
        <Notice>Confira o preço antes de salvar.</Notice>
        <Notice tone="success">Produto salvo. Ele já aparece no seu catálogo.</Notice>
        <Notice tone="error">Não foi possível salvar. Verifique a conexão e tente de novo.</Notice>
      </Secao>

      <Secao titulo="QuantityControl">
        <QuantityControl unit="kg" value={kg} onChange={setKg} />
        <QuantityControl unit="un" value={un} onChange={setUn} />
        <QuantityControl unit="kg" value={2.5} onChange={() => {}} disabled />
      </Secao>

      <Secao titulo="ChoiceGroup">
        <ChoiceGroup
          legend="Vendido por"
          value={vendidoPor}
          onChange={setVendidoPor}
          options={[
            { value: 'kg', label: 'Quilo (kg)' },
            { value: 'un', label: 'Unidade' },
          ]}
        />
      </Secao>

      <Secao titulo="StepProgress">
        <StepProgress label="Produto" current={1} total={3} />
        <StepProgress label="Produto" current={3} total={3} />
      </Secao>
    </>
  );
}
