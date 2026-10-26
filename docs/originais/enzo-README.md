# Caxi — monólito

ERP mobile-first para feirantes e vendedores permissionários. Este repositório contém a **API** do Caxi (NestJS + PostgreSQL/PostGIS) e o **front** (React + Vite, em `web/`), construídos em etapas, cada uma entregue por Pull Request:

| Etapa | Conteúdo | Situação |
|---|---|---|
| 1 | API NestJS mínima + Docker Compose (API + PostgreSQL) | ✅ |
| 2 | Testes básicos (unitário e de integração com o banco) | ✅ |
| 3 | Pipeline de CI no GitHub Actions | ✅ |
| 4 | Proteção da `main` e regras de PR | ✅ |
| 5 | Documento explicando o conjunto | ✅ |

## Arquitetura

![Arquitetura do Caxi na AWS](docs/arquitetura/caxi-arquitetura.svg)

## Como rodar

Pré-requisito único: **Docker** com Compose v2 (Docker Desktop no Windows/macOS).

```bash
git clone https://github.com/Rodriguessz/caxi-monolito.git
cd caxi-monolito
docker compose up --build -d
```

A primeira vez leva alguns minutos (download das imagens e build). Depois, abra **http://localhost:8080**: a tela inicial mostra se a API e o banco estão respondendo. Pelo terminal:

```bash
docker compose ps -a                         # db, api e web "Up (healthy)"; migrate "Exited (0)"
curl localhost:3000/api/health/ready         # {"status":"ok",...,"database":{"status":"up"}}
curl localhost:3000/api/barracas/demo        # {"nome":"Barraca Demonstração (dados fictícios)","slug":"demo"}
curl localhost:3000/api/barracas/nao-existe  # 404 "Barraca não encontrada"
```

| Para | Comando |
|---|---|
| Ver os logs da API | `docker compose logs -f api` |
| Parar, mantendo os dados | `docker compose down` |
| Apagar o banco e recomeçar do zero | `docker compose down -v && docker compose up --build -d` |

O `migrate` aparecer como **Exited (0)** é o esperado: ele aplica as migrations, insere os dados de exemplo e encerra.

## Como o ambiente sobe

```
docker compose up
   │
   ├─ db        PostgreSQL 16 + PostGIS 3.4 ............ espera ficar saudável (pg_isready por TCP)
   │
   ├─ migrate   aplica as migrations + seed, e encerra ... espera terminar com código 0
   │
   ├─ api       NestJS na porta 3000 ..................... saudável quando /api/health/live responde
   │
   └─ web       nginx na porta 8080 ...................... serve o front e encaminha /api/* para a api
```

Cada serviço só começa quando o anterior está pronto (`depends_on` com `condition`). Assim, a API nunca sobe contra um banco sem tabelas.

O navegador fala só com o `web` (porta 8080). Quando o front chama `/api/...`, o nginx repassa para a API. É o mesmo desenho da AWS, onde o CloudFront entrega o front e encaminha `/api/*` para o ALB. Por isso o front usa caminhos relativos e não precisa saber o endereço da API.

## Testes

Exigem Node 22 (`.nvmrc`) e `npm ci` uma vez.

| Tipo | Comando | Precisa de banco? | O que prova |
|---|---|---|---|
| **Unitário** | `npm test` | Não | A lógica de cada classe, isolada. O banco é substituído por um *mock* |
| **Integração** | `docker compose up -d db` e depois `npm run test:integration` | Sim | A API inteira funcionando contra um PostgreSQL real, com requisições HTTP de verdade |
| Cobertura | `npm run test:cov` | Não | Quais linhas os testes unitários executam (relatório em `coverage/`) |

### Por que dois tipos

- **Unitários** rodam em milissegundos e apontam exatamente qual classe quebrou. Mas, com o banco simulado, não pegam erro de SQL, de migration ou de configuração.
- **Integração** sobe o NestJS completo (módulos, TypeORM, rotas, prefixo `/api`) e conversa com o PostgreSQL. Pegam o que o unitário não vê, mas são mais lentos e dependem do banco.

### O que está coberto

| Arquivo | Tipo | Casos |
|---|---|---|
| `src/barracas/barracas.service.spec.ts` | Unitário | Retorna a barraca; consulta só os campos públicos filtrando pelo slug; lança 404 se não existir |
| `src/health/health.controller.spec.ts` | Unitário | `live` não toca no banco; `ready` faz ping no banco com timeout de 1,5 s |
| `test/api.integration-spec.ts` | Integração | `/api/health/live` e `/api/health/ready` respondem 200; `/api/barracas/:slug` devolve só `nome` e `slug` de um registro gravado no banco; slug inexistente devolve 404; a migration habilitou o PostGIS |

O teste de integração **aplica as migrations sozinho** e cria a própria barraca com um slug único, que apaga no fim. Por isso não depende do seed e pode rodar várias vezes no mesmo banco.

`src/app.setup.ts` guarda a configuração da aplicação (o prefixo `/api`). Ele é usado tanto pelo `main.ts` quanto pelo teste de integração, para que o teste exercite exatamente a API real.

Convenção de nomes: `*.spec.ts` ao lado do código para unitários; `test/*.integration-spec.ts` para integração. Nenhum dos dois entra na imagem Docker (`tsconfig.build.json` exclui os testes).

## Integração contínua (CI)

O workflow `.github/workflows/ci.yml` roda sozinho em **todo Pull Request para a `main`** e em **todo push na `main`**. Cada job vira um *check* no PR (✓ ou ✕):

| Job | O que verifica |
|---|---|
| `qualidade` | Segredos vazados (gitleaks), lint, tipos, testes unitários, dependências vulneráveis (`npm audit`) e build |
| `integracao` | Migrations num PostgreSQL + PostGIS vazio (aplicar, reverter e aplicar de novo) e testes de integração |
| `ambiente-reproduzivel` | Sobe o `docker compose` do zero numa máquina limpa e testa a API e o front por HTTP |

Os três rodam em paralelo, cada um numa máquina nova. Para reproduzir um job localmente:

| Job | Comandos |
|---|---|
| `qualidade` | `npm ci && npm run lint && npm run typecheck && npm test && npm audit --omit=dev && npm run build` |
| `integracao` | `docker compose up -d db`, depois `npm run migration:run && npm run test:integration` |
| `ambiente-reproduzivel` | `docker compose up --build -d --wait api web` e `curl localhost:8080/api/health/ready` |

O `package.json` tem um `overrides` que força o `multer` 2.5.0. O `@nestjs/platform-express` fixa a 2.4.0, que tem uma vulnerabilidade alta de negação de serviço ([GHSA-q7qp-rjg7-q26m](https://github.com/advisories/GHSA-q7qp-rjg7-q26m)). Remova o override quando o NestJS publicar uma versão com a correção.

## Como contribuir

Branches, commits e Pull Requests seguem o [`CONTRIBUTING.md`](CONTRIBUTING.md). Resumo:

- Branch: `<tipo>/<descricao>`, ex.: `feat/vendas-pedido-duplicado`
- Título do PR: `tipo(area): descrição`, ex.: `feat(pedidos): registra pedido`
- A `main` é protegida: só recebe mudanças por PR, com os 4 checks verdes (`padroes-do-pr`, `qualidade`, `integracao` e `ambiente-reproduzivel`)

## O que cada arquivo faz

| Arquivo | Papel | Por que assim |
|---|---|---|
| `src/main.ts` | Inicia o NestJS na porta 3000, com o prefixo `/api` em todas as rotas | O prefixo é o mesmo que o CloudFront vai encaminhar para a API na AWS |
| `src/app.module.ts` | Módulo raiz: conecta o banco (TypeORM) e carrega os módulos `health` e `barracas` | Cada domínio do Caxi vira um módulo, como define o Roadmap |
| `src/health/` | `GET /api/health/live` (o processo responde?) e `GET /api/health/ready` (o banco responde?) | São os health checks que o Docker, e depois o ALB da AWS, usam para decidir se a API pode receber tráfego. Feitos com `@nestjs/terminus` |
| `src/barracas/` | Entidade, serviço e controller de barracas. `GET /api/barracas/:slug` devolve a barraca ou 404 | Primeiro módulo de domínio, para provar o caminho API → banco |
| `src/database/config.ts` | Configuração do TypeORM, com `synchronize: false` | O schema só muda por migration versionada, nunca automaticamente |
| `src/database/migrations/` | Migrations versionadas. A primeira habilita o PostGIS e cria a tabela `barracas` | O banco de qualquer pessoa, e o do CI, nasce igual, só a partir destes arquivos |
| `src/database/seed.ts` | Insere uma barraca de demonstração, marcada como fictícia. Pode rodar várias vezes (`ON CONFLICT DO NOTHING`) | Ter dados para testar, sem misturar com dados reais |
| `Dockerfile` | Imagem em 3 estágios: compila → instala só dependências de produção → imagem final rodando como usuário `node` | A imagem final fica menor, sem compilador nem código-fonte, e sem rodar como root. É a mesma imagem que irá para o ECS |
| `docker-compose.yml` | Sobe `db`, `migrate`, `api` e `web` na ordem certa | Um comando para ter o ambiente completo |
| `web/` | Front em React + Vite + TypeScript, projeto separado com o próprio `package.json` | Front e API têm dependências e ferramentas diferentes; separados, um não interfere no build do outro |
| `web/src/components/` | Componentes do Design System em React: `Button`, `Field`, `Notice`, `QuantityControl`, `ChoiceGroup` e `StepProgress`. A vitrine com todos os estados fica em http://localhost:8080/design-system | As telas montam a interface só com esses componentes, como no Figma; mudar um componente muda todas as telas |
| `web/src/styles/tokens.css` | Cores, espaçamentos e raios do Design System, com os mesmos nomes das Variables do Figma | Uma mudança de cor é feita num lugar só e vale para todas as telas |
| `web/Dockerfile` e `web/nginx.conf` | Compila o front e serve os arquivos estáticos com nginx, sem root, na porta 8080 | Na AWS os mesmos arquivos vão para o S3 atrás do CloudFront; o nginx faz esse papel localmente |
| `.env.example` | Lista as variáveis que podem ser sobrescritas | Funciona sem `.env`; as senhas são só de desenvolvimento |
| `.nvmrc` | Versão do Node (22) | Fonte única da versão, usada também pelo CI |
| `package-lock.json` | Versões exatas de todas as dependências | Junto com `npm ci`, garante que todos instalem exatamente o mesmo |

## O que torna o ambiente reproduzível

- **Versões fixadas:** imagens com tag explícita (`postgis/postgis:16-3.4`, `node:22-alpine`) e `package-lock.json` versionado.
- **Banco a partir de migrations:** nenhuma tabela é criada à mão.
- **Zero configuração manual:** nenhum passo além do `docker compose up`.
- **Ordem garantida:** cada serviço espera o anterior estar pronto.

> Docker Compose é o ambiente de **desenvolvimento**. Ele não é evidência de deploy nem de CI/CD; essas evidências vêm do GitHub Actions (etapa 3) e dos deploys na AWS.

## Desenvolvimento sem Docker (opcional)

Com Node 22 instalado, dá para rodar a API no host com recarga automática, usando só o banco no Docker:

```bash
npm ci
docker compose up -d db
npm run migration:run && npm run seed
npm run dev        # http://localhost:3000/api
```

Para o front com recarga automática, em outro terminal (com a API rodando, no Docker ou no host):

```bash
cd web
npm ci
npm run dev        # http://localhost:5173, com /api encaminhado para localhost:3000
```
