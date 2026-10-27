# Gitflow e deploy contínuo

O repositório `fiap-strata/caxi` está conectado ao projeto **caxi**, no time
**Project Lambda** da Vercel. O diretório do projeto é a raiz do repositório.
Os serviços `api` e `web` são construídos pelo `vercel.json` da raiz.

| Branch    | Uso                                 | Deploy após push                                 |
| --------- | ----------------------------------- | ------------------------------------------------ |
| `develop` | Integração e validação das mudanças | Preview na Vercel                                |
| `main`    | Versão apresentada/publicada        | Produção na Vercel, em `https://caxi.vercel.app` |

`main` permanece como branch padrão do GitHub e branch de produção da Vercel.
O `vercel.json` habilita explicitamente os deploys de `main` e `develop`.
Branches de funcionalidade também podem receber previews pela integração nativa;
o fluxo de integração recomendado é `feature/*` → `develop` → `main`.

## Trabalhar em uma funcionalidade

```bash
git fetch origin
git switch develop
git pull --ff-only origin develop
git switch -c feature/minha-alteracao
# Faça as alterações e valide:
npm run build
npm test
git add <arquivos-alterados>
git commit -m "feat: descreve a alteração"
git push -u origin feature/minha-alteracao
```

Abra um pull request de `feature/minha-alteracao` para `develop`. Confira o CI e
o preview antes de integrar. Após o merge, a Vercel publica um preview atualizado
da `develop`. Um push direto em `develop` também inicia esse deploy.

## Publicar uma versão

Abra um pull request de **`develop` para `main`**, confira os checks e faça o
merge. Prefira merge commit para preservar o histórico compartilhado das duas
branches. O push resultante em `main` inicia o deploy de produção automaticamente.
Confira o status **Ready** na Vercel antes de apresentar o site.

Depois da publicação, sincronize a base de integração:

```bash
git fetch origin
git switch develop
git merge origin/main
git push origin develop
```

Correções urgentes podem partir de `main` em uma branch `hotfix/*`. Integre o
hotfix em `main` e depois sincronize `main` com `develop` usando os comandos acima.

## CI e Vercel

O workflow `.github/workflows/ci.yml` executa em pushes para `main` e `develop`,
em pull requests destinados às duas branches e por execução manual. Ele verifica
build, testes, auditoria de dependências, integração PostgreSQL e Docker Compose.

O GitHub Actions valida o código; a **integração Git da Vercel faz o deploy**.
Não é necessário cadastrar `VERCEL_TOKEN`, duplicar deploys em Actions nem enviar
arquivos manualmente. CI e build da Vercel executam em paralelo: o CI não bloqueia
automaticamente um push direto. Este fluxo recomenda PRs e não altera as regras
de proteção de branches ou as permissões de acesso do projeto.

As variáveis de runtime continuam nas configurações do projeto Vercel, nos
ambientes Production e Preview. A apresentação usa `CAXI_DEMO_MODE=true`, acesso
de teste e dados temporários; AWS/PostgreSQL permanecem como proposta de system
design. Consulte [VERCEL.md](VERCEL.md) para limites e configuração da demonstração.

## Diagnóstico

- Sem deploy após push: confira **Settings → Git**, o repositório conectado e a
  branch/commit mostrados no deployment. O autor do commit precisa ter acesso
  permitido pelo plano/time Vercel.
- Falha de build: abra os build logs do commit correspondente na Vercel.
- Vercel pede login: a proteção do projeto é independente do Gitflow; use a conta
  autorizada ou gere um link compartilhado para a apresentação.
- Não envie `.env`, `.vercel` nem tokens para o GitHub.
