# Arquitetura — entrega de Enzo

Documentos fornecidos pelo grupo para a Sprint 2 de Secure DevOps Tools & Cloud Computing.

- [Como funciona a arquitetura — PDF original, 18 páginas](como-funciona-a-arquitetura.pdf).
- [Diagrama de arquitetura — PNG original](caxi-arquitetura.png).
- [Diagrama editável — draw.io](caxi-arquitetura.drawio), extraído do metadado `mxfile` do PNG.
- [Identificação e hashes dos arquivos](manifest.json).

![Arquitetura proposta do Caxi na AWS](caxi-arquitetura.png)

## Como usar na entrega

O PDF explica as camadas da solução, escolhas de serviços, rede, tráfego, autenticação, permissões, armazenamento e recuperação. O diagrama apresenta a arquitetura AWS proposta. Esses materiais complementam o [mapa e processo de desenvolvimento consolidados](../../entrega/DEVOPS.md).

Os originais foram preservados. O arquivo `.drawio` recupera a fonte editável já incorporada ao PNG, sem redesenhar a arquitetura.

## Relação com a implementação atual

O plano AWS é uma arquitetura alvo; sua inclusão não comprova provisionamento de CloudFront, ECS, RDS ou autenticação real pelo WhatsApp. Para executar o sistema, seguir o [README do projeto](../../../README.md); para a configuração Vercel, consultar [docs/VERCEL.md](../../VERCEL.md).

Algumas referências do documento descrevem o plano original, com diferenças em relação ao código consolidado:

| Referência no PDF | Aplicação no projeto |
|---|---|
| AWS CDK como proposta de infraestrutura como código | A base de identidade disponível em `infrastructure/` usa Terraform; a arquitetura AWS completa não está provisionada por esse código |
| API/target group na porta 3000 | O Compose consolidado usa API interna na porta 3001; a porta da Vercel é gerenciada pela plataforma |
| `/api/auth/otp` e `/api/auth/otp/confirm` | O contrato implementado usa `/api/auth/code` e `/api/auth/verify` |
| App client Cognito confidencial com `SECRET_HASH` | A base Terraform atual define app client sem secret; a implementação deve permanecer coerente com essa configuração |
| Trust policy OIDC com referência ao repositório original | Um eventual provisionamento deve usar `fiap-strata/caxi` e o ambiente correto |
| Proteções, logs, alarmes e recuperação descritos como arquitetura alvo | Conferir a configuração efetiva e as evidências da entrega; a descrição do plano não comprova que esses controles foram implantados |

Essas observações permitem ler o material original sem confundi-lo com o contrato de execução da aplicação atual. Elas não modificam os arquivos entregues por Enzo.
