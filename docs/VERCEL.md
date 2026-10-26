# Deploy na Vercel com Services

## Demonstração acadêmica para apresentação

Para apresentar as jornadas ao professor sem provisionar AWS e PostgreSQL,
configure `CAXI_DEMO_MODE=true`, `AUTH_PROVIDER=demo` e `DATABASE_DRIVER=sqljs`
nos ambientes desejados da Vercel. Mantenha `PHOTO_STORAGE=blob` e conecte o store
público para fotos. O código de teste é mostrado na tela; nenhum OTP é enviado.

Esse modo é uma exceção explícita para a apresentação: o banco SQL.js usa `/tmp`
na função, e os dados e sessões podem ser reiniciados quando a instância for
reciclada. Instâncias diferentes não compartilham esse banco. Use apenas dados
fictícios e refaça a jornada se a demonstração for reiniciada. A infraestrutura
AWS/PostGIS descrita no repositório permanece como proposta de system design.

As origens HTTPS exatas do deploy e do domínio principal fornecidas pela Vercel
são aceitas automaticamente nesse modo. Para um domínio adicional, configure
`APP_ORIGIN`. Fora do modo acadêmico explícito, as exigências de PostgreSQL,
Cognito e origem HTTPS de produção continuam em vigor.

## Configuração para operação real

O projeto usa o `vercel.json` da raiz e Node.js 22. Importe o repositório com
**Root Directory = `.`** e habilite acesso aos arquivos fora da raiz de cada
serviço, para que o workspace `packages/domain` e o lockfile estejam disponíveis.

## Serviços e tráfego

| Serviço | Diretório  | Execução                  | Caminhos públicos                                       |
| ------- | ---------- | ------------------------- | ------------------------------------------------------- |
| `api`   | `apps/api` | NestJS / função Node.js   | `/api`, `/api/*`, `/uploads/*`                          |
| `web`   | `apps/web` | Vite / arquivos estáticos | Demais caminhos, incluindo `/design-system` e catálogos |

O Dockerfile da raiz contém os mesmos dois apps para Compose. Ele não representa
um terceiro serviço `app` na Vercel. PostgreSQL/PostGIS, Cognito e Blob são
dependências externas; o sender WhatsApp continua como trigger Lambda do Cognito.

Não há bindings entre serviços nesta arquitetura: `web` é estático e o navegador
chama `/api` no mesmo domínio. A API já declara suas rotas com o prefixo `/api`;
os rewrites de Services preservam esse prefixo. `/uploads/*` chega à API para o
armazenamento local usado no desenvolvimento. Fotos novas em Blob usam URLs
absolutas públicas. Não copie hostnames do Compose para a configuração da Vercel.

Se um serviço com funções passar a chamar outro serviço, declare o binding no
chamador com os quatro campos `type`, `service`, `format`, `env`, e leia a variável
gerada dentro da função em runtime. Não configure o valor manualmente, não exponha
a variável como `VITE_*` e não a leia durante o build ou em middleware.

O build da API compila primeiro `@caxi/domain` e depois `@caxi/api`. A entrada
`dist/main.js` preserva os metadados de decorators gerados pelo TypeScript.
`web` usa seu build Vite padrão, com fallback de SPA configurado no próprio
serviço para que links diretos de catálogo e `/design-system` carreguem o app.

## Dependências e variáveis

Configure as variáveis nos ambientes Production e Preview da Vercel. Valores
sensíveis pertencem apenas ao backend; nenhum segredo usa prefixo `VITE_`.

| Variável                | Configuração                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_DRIVER`       | `postgres`                                                                         |
| `DATABASE_URL`          | URL de um PostgreSQL/PostGIS persistente; use pool e TLS conforme o provedor       |
| `AUTH_PROVIDER`         | `cognito`                                                                          |
| `ADMIN_KEY`             | Segredo aleatório de pelo menos 32 caracteres                                      |
| `APP_ORIGIN`            | Origem HTTPS exata do site, sem barra final, usada por CORS e proteção de mutações |
| `AWS_REGION`            | Região do pool Cognito                                                             |
| `COGNITO_USER_POOL_ID`  | Pool provisionado com o sender WhatsApp                                            |
| `COGNITO_CLIENT_ID`     | App client do Cognito                                                              |
| `BLOB_READ_WRITE_TOKEN` | Token secreto de um store **público** do Vercel Blob conectado ao projeto          |
| `PHOTO_STORAGE`         | Opcional: `blob`; selecionado automaticamente na Vercel em produção                |
| `SESSION_DAYS`          | Opcional, padrão `7`                                                               |

Configure também credenciais AWS para `cognito-idp:AdminCreateUser`, preferindo
federação de identidade, conforme [infrastructure/README.md](../infrastructure/README.md).
A Vercel define `NODE_ENV=production` para deploys, inclusive Preview. O app
deliberadamente exige Cognito e PostgreSQL em produção. Use dados, pool Cognito e
Blob de teste em Preview e defina `APP_ORIGIN` para a URL HTTPS correspondente; uma
origem de produção não autoriza mutações vindas de uma URL de preview diferente.

A migration inicial roda no startup e requer permissão para criar a extensão
`postgis` e a tabela `records`. Provisione PostGIS e execute a migration uma vez
antes de liberar tráfego concorrente de uma instalação nova.

Na Vercel, fotos são enviadas pelo servidor para Blob, com nome aleatório e MIME
verificado. O limite do app é 4 MiB, deixando espaço para multipart abaixo do
limite de request de funções. Os arquivos são públicos porque fazem parte do
catálogo. Tokens permanecem no servidor. Dados antigos com URLs `/uploads/*`
precisam ter as fotos migradas para Blob antes de usar esses registros no deploy;
disco local de uma função não fornece persistência compartilhada.

## Validação local e deploy

```bash
npm ci
npm run build
npm test
APP_ORIGIN=http://localhost:3000 npx vercel@latest dev --local
```

Abra `http://localhost:3000`. Se mudar o host ou a porta com `--listen`, ajuste
`APP_ORIGIN` para a mesma origem, pois mutações validam o header `Origin`.

`vercel dev` inicia os dois serviços e aplica os rewrites. Sem configuração de
produção, o ambiente local usa SQL.js, autenticação demo e fotos locais. Para
testar Blob localmente, configure `PHOTO_STORAGE=blob` e o token de um store de
teste. Não configure manualmente `VERCEL` nem `PORT` no projeto.

Em outro terminal, o smoke cria registros fictícios e verifica a jornada completa:

```bash
CAXI_BASE_URL=http://localhost:3000 npm run smoke
```

Confira também `/api/health/ready`, `/api/docs`, `/design-system` e uma URL de
catálogo aberta diretamente. Depois de confirmar os nomes, os caminhos públicos
e a ausência de bindings, conecte o Git ou use `npx vercel@latest` na raiz para
criar um preview. Nenhuma publicação é necessária para os testes locais.
