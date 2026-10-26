# Caxi — Sprint 2

ERP web mobile-first para vendedores permissionários, com foco em feirantes. O Caxi organiza a oferta da barraca e transforma compras pelo catálogo em pedidos que o vendedor consegue acompanhar. O WhatsApp continua como canal de conversa.

**Entrega: 26/10/2026 às 23h59.** [Índice da entrega por disciplina](docs/entrega/README.md).

## Executar

Com **Node.js 22**:

```bash
npm ci
npm run dev
```

Abra **http://127.0.0.1:5173**. A API fica em `http://127.0.0.1:3001`. O modo local usa SQLite/SQL.js, cria o banco por migration e preserva os dados em `apps/api/data/`. Não exige conta AWS para demonstrar o produto.

Alternativa com **Docker Compose**, PostgreSQL/PostGIS e nginx:

```bash
docker compose up --build -d --wait
```

Abra **http://localhost:8080**. Banco e fotos ficam em volumes. Para encerrar preservando os dados: `docker compose down`.

Os dois ambientes acima são de **demonstração**. O código de acesso é mostrado na tela e nenhum OTP é enviado. A configuração real Cognito/WhatsApp está separada em [infrastructure/README.md](infrastructure/README.md); não há deploy AWS comprovado nesta entrega.

## Experimentar o primeiro valor

1. Na landing page, manifeste interesse com nome e WhatsApp.
2. Use a liberação de demonstração, solicite o código e informe o código exibido.
3. Cadastre a barraca e um produto com foto, preço, unidade e estoque.
4. Publique e copie o link do catálogo.
5. Abra o link em outra aba, selecione uma quantidade, informe os dados do comprador e registre o pedido.
6. O botão de WhatsApp abre o resumo para o número da barraca. O comprador decide enviar.
7. Volte ao painel do vendedor e abra **Pedidos recebidos**. Passe de recebido para preparo, pronto e concluído. Outro pedido pode ser cancelado antes da conclusão.
8. Atualize o resumo para conferir vendas concluídas e estoque.

A reserva de estoque ocorre ao registrar o pedido. Cancelar devolve a reserva uma vez; concluir não desconta novamente. Compras por kg aceitam passos de 0,5; por unidade, inteiros. Um identificador da tentativa evita duplicar pedidos em reenvios. Edições antigas de produto recebem conflito para não sobrescrever estoque alterado por pedidos.

O cenário demonstra a utilidade operacional: catálogo único, pedido legível com total calculado e fila de atendimento. [Demonstração e evolução do produto](docs/entrega/BI.md).

## Jornadas consolidadas

| Jornada | Funcionalidade |
|---|---|
| Onboarding | Landing/lista de espera, liberação, acesso, cadastro guiado e primeiro catálogo publicado |
| Operação da barraca | Produtos, fotos, preço, estoque, disponibilidade e edição |
| Pedidos e entregas | Checkout, retirada/entrega, resumo WhatsApp e acompanhamento dos status |
| Resultados | Quantidade e valor de vendas concluídas, além do estoque atual |

**Total vendido** soma pedidos concluídos. Não comprova recebimento de pagamento nem lucro. Avaliações, pagamento automático, logística própria e análise avançada não estão implementados.

## Design system

- Vitrine React: **[/design-system](http://127.0.0.1:5173/design-system)**, também disponível no ambiente Docker.
- [Figma entregue por Enzo](https://www.figma.com/design/bayroMB0vsrd8sjHFWL2q9/Caxi--Design-System?node-id=0-1).
- Componentes e tokens em `apps/web/src/enzo/`. A [exportação Figma e o inventário conferido](design/README.md) estão versionados em `design/`; 55 dos 57 valores de tokens coincidem, com duas diferenças de raio documentadas.
- As telas entregues por Rafael/Maria foram preservadas; a aplicação ainda possui variações visuais entre essa base e a vitrine. A unificação integral do design system é uma evolução.

## Verificações

```bash
npm run build
npm test
# Com npm run dev ativo, gera registros fictícios e verifica a jornada por HTTP:
npm run smoke
# Com Docker ativo:
CAXI_BASE_URL=http://localhost:8080 npm run smoke
```

Os testes cobrem publicação, persistência, sessão/CSRF, isolamento, 0,5 kg, idempotência, concorrência de pedidos, rollback e cancelamento/estoque. O workflow [CI](.github/workflows/ci.yml) executa build/testes, integração PostgreSQL e reprodução do Compose em jobs separados.

[Registro de verificação](docs/VALIDACAO.md). Smoke test é evidência técnica com dados fictícios, não pesquisa com usuários.

## Estrutura e documentação

| Caminho | Conteúdo |
|---|---|
| `apps/web` | React, TypeScript, Vite, jornadas e vitrine de componentes |
| `apps/api` | NestJS, sessão, catálogo, produtos, pedidos, upload e health checks |
| `packages/domain` | Regras compartilhadas de produto, unidade e telefone |
| `infrastructure` | nginx e base Terraform/Lambda para Cognito e WhatsApp |
| `docs/entrega` | Pacotes de BI, RPA e DevOps conforme o enunciado atualizado |
| `docs/API.md` | Contratos e regras; Swagger ao vivo em `/api/docs` |
| `docs/evidencias` | Resultados reproduzíveis e capturas de demonstração |
| `docs/originais` | Relatórios originais preservados, sem substituir a documentação consolidada |
| `docs/CONTRIBUICOES.md` | Origem dos materiais e decisões de integração |

A consolidação não inclui bancos de demonstração, credenciais, caches, `node_modules` ou builds dos ZIPs. O código-fonte e o lockfile permitem reconstruir a aplicação.
