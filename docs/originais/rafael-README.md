# Caxi · Onboarding e ativação

Implementação local da primeira jornada da Sprint 2, em React mobile-first + NestJS. Começa no interesse do vendedor e termina com catálogo publicado e link compartilhável. O roadmap original está preservado.

## Rodar

Requisitos: Node.js 22 e npm 10 ou superior.

```powershell
npm install
npm run dev
```

Abra **http://127.0.0.1:5173/**. API: `http://127.0.0.1:3001/api`. Swagger: `http://127.0.0.1:3001/api/docs` e JSON em `/api/docs-json`.

Sem configuração, usa modo **demo** e SQLite via SQL.js em arquivo, sem Docker. Os dados e fotos ficam em `apps/api/data/` e `apps/api/uploads/` quando iniciado por `npm run dev`. Esses diretórios devem ser preservados para manter os cadastros.

Para personalizar, copie `.env.example` para `.env` na raiz. `APP_ORIGIN` precisa ser exatamente a origem do navegador, incluindo hostname e porta. Não use `localhost` e `127.0.0.1` alternadamente: cookies e origem são distintos.

## Experimentar

1. Clique em **Criar minha barraca**; use um nome e telefone fictícios com DDD.
2. Clique em **Pedir acesso** e depois em **Liberar acesso de teste**.
3. Solicite o código. No modo demo, use **123456**. **Nenhuma mensagem WhatsApp é enviada.**
4. Cadastre o nome da barraca. A descrição fica recolhida e é opcional.
5. Cadastre o produto em três passos: foto/nome, preço/forma de venda e quantidade. A foto aceita JPG/PNG/WebP de até 5 MB; a quantidade tem botões de mais e menos.
6. Confira a prévia, publique e copie o link. O botão WhatsApp apenas abre uma mensagem para o usuário enviar.
7. Abra `/b/<id>` em outro navegador ou saia da conta: o catálogo continua público. Antes da publicação, essa URL mostra “em preparação”.
8. Volte à conta com o mesmo telefone para editar barraca/produto. Os dados confirmados vêm do banco; rascunhos ainda não enviados são recuperados apenas neste dispositivo.

O link local funciona no computador em que o servidor está rodando. Compartilhamento com pessoas externas depende de hospedagem e domínio. Os servidores estão vinculados ao loopback deliberadamente.

## Organização para ajustes

| Mudança                                      | Arquivo/camada                                      |
| -------------------------------------------- | --------------------------------------------------- |
| Cores, fontes, espaçamento, responsividade   | `apps/web/src/styles.css`, tokens em `:root`        |
| Botões, campos, avisos e marca               | `apps/web/src/design-system.tsx`                    |
| Etapas, navegação e telas                    | `apps/web/src/main.tsx`                             |
| Comunicação HTTP e CSRF                      | `apps/web/src/api.ts`                               |
| Regras de produto/publicação/telefone        | `packages/domain/src/index.ts`                      |
| Serviço compartilhado de barracas e produtos | `apps/api/src/products.ts`                          |
| Autenticação e sessão                        | `apps/api/src/auth.ts`                              |
| Upload e adaptador de armazenamento          | `apps/api/src/photos.ts`                            |
| Persistência e migration inicial             | `apps/api/src/database.ts`, `store.ts`              |
| Contratos e endpoints                        | `apps/api/src/http.ts`, `openapi.ts`, `docs/API.md` |
| AWS e envio pela Meta                        | `infrastructure/`                                   |

O cadastro de produto é o mesmo serviço para onboarding e operação: a futura jornada 2 deve consumir `GET/POST /products` e `PATCH /products/:id`. A autorização é derivada da sessão, nunca de um proprietário recebido do cliente. O cliente envia preço em centavos; estoque por kg usa múltiplos de 0,5 e por unidade usa inteiros. Zero pode ser salvo, mas não habilita publicação sozinho. Quantidade exata não sai no catálogo público.

## Banco e fotos

SQLite/SQL.js é apenas a opção local sem instalação adicional. Para PostgreSQL/PostGIS:

```powershell
docker compose up -d
```

No `.env`, defina `DATABASE_DRIVER=postgres` e `DATABASE_URL`. Reinicie a API. As migrations executam na inicialização; `synchronize` está desabilitado. Trocar o driver não transfere automaticamente registros existentes.

A primeira migration usa uma tabela de registros com chaves únicas e payloads tipados pelos serviços. É uma persistência inicial simples, não o modelo relacional final de pedidos/estoque. Antes de integrar Vendas, evoluir via migrations para entidades relacionais, FKs e transações de reserva/baixa. Essa troca fica atrás do `Store`; não exige mudar componentes visuais ou contratos públicos.

As fotos usam um adaptador de disco local. Para hospedagem, substitua `LocalPhotoStorage` por armazenamento de objetos e preserve as URLs já publicadas ou migre-as. A validação atual confere tamanho e assinatura dos formatos; processamento de imagem, remoção de EXIF, quotas e limpeza de uploads órfãos são melhorias do piloto.

## Acesso real e triagem

O adaptador Cognito usa `USER_AUTH` + `SMS_OTP`, valida o access token e associa o `sub` ao proprietário. Tokens ficam no servidor; o navegador recebe um identificador de sessão HttpOnly, SameSite=Lax e Secure em produção. A sessão tem duração absoluta configurável (padrão 7 dias); tokens Cognito são renovados sob demanda. Logout remove a sessão local; ele não executa logout global de todos os dispositivos.

O código da Lambda e a base Terraform estão em `infrastructure/README.md`. **Não foram provisionados nem verificados na AWS/Meta.** Contas, template, plano Essentials/Plus, remetente, IAM, KMS e segredo Meta precisam ser configurados e demonstrados com envio real. PostgreSQL, HTTPS e variáveis reais são exigidos na inicialização de produção; modo demo é bloqueado.

Para triagem real, configure `ADMIN_KEY` e use `GET /api/admin/interests` e `POST /api/admin/interests/:id/approve` com `X-Admin-Key`. A chave nunca deve entrar no frontend. Não foi criado painel administrativo; a aprovação é uma operação técnica documentada. Em produção, proteja também o acesso à documentação e aos endpoints administrativos no gateway.

O MVP deve rodar em **uma instância da API**. Limites de requisição e coordenação de desafios não são distribuídos. Antes de escalar, introduza locks/transações e rate limiting compartilhados. Defina retenção dos cadastros, sessões e eventos, criptografia/backup do banco e permissões dos arquivos. Isso exige decisão operacional antes do piloto público.

## Funil e evidências

`GET /api/admin/funnel`, com `X-Admin-Key`, retorna usuários únicos por etapa e separa `testUsers` e `realUsers` conforme o provedor de autenticação. Eventos: interesse, acesso aprovado, primeiro acesso, barraca salva, produto salvo, publicação e compartilhamento. “Compartilhamento” registra intenção/abertura ou cópia; não comprova que uma mensagem foi enviada ou recebida.

Use `docs/VALIDACAO.md` para o roteiro de evidências acadêmicas. Não há evidência de uso real nesta entrega nem afirmação de ganho de produtividade.

## Verificação

```powershell
npm run build
npm test
```

Os testes incluem regras de preço/estoque/publicação e um fluxo HTTP integrado: interesse idempotente, convite, OTP incorreto, intervalo de reenvio, cookie HttpOnly, CSRF, upload, persistência consultável, catálogo sem estoque exato, logout, isolamento entre vendedores e funil de demonstração. O build verifica TypeScript e gera frontend e API. Docker/PostgreSQL e Terraform dependem de ferramentas/contas que não estão disponíveis neste ambiente.

Fontes tipográficas são carregadas do Google Fonts; há fallback local para uso offline. A direção visual Botanical Intelligence é provisória e pode ser ajustada pelo Gabriel nos tokens e componentes.

O catálogo reutilizável fica em `apps/web/src/Catalog.tsx` e os tipos de tela em `models.ts`. Para conferir larguras de 360, 390 e 430 px, abra `/mobile-preview.html` no servidor de desenvolvimento. A captura em `docs/screenshots/mobile-360.png` registra a conferência de 360 px.
