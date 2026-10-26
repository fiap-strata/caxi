# Acesso real: provisionamento a validar na conta AWS

Este código é uma base de provisionamento, **não foi aplicado**. Não há recursos cloud criados nem envio WhatsApp validado nesta entrega local.

1. Tenha uma conta WhatsApp Business, número remetente e template de autenticação PT-BR aprovado com botão de copiar código. Configure uma versão suportada da Graph API em `meta_graph_version`. Números de teste da Meta aceitam apenas destinatários habilitados.
2. Crie no Secrets Manager um segredo JSON com `accessToken` e `phoneNumberId`. Informe somente seu ARN ao Terraform. Se o segredo usar chave KMS própria, acrescente `kms:Decrypt` dessa chave à role da Lambda.
3. Em `whatsapp-sender/`, execute `npm install --omit=dev`. Compacte **o conteúdo dessa pasta**, incluindo `index.mjs`, `package.json` e `node_modules`, em `infrastructure/sender.zip`. Não inclua credenciais.
4. Execute `terraform init`, `terraform validate` e `terraform plan` antes de aplicar. Informe as variáveis de Meta. Quem provisiona precisa de `kms:CreateGrant` para a configuração do Custom SMS Sender. Valide requisitos de SNS/SMS da região e do pool mesmo que a entrega seja redirecionada ao WhatsApp.
5. A identidade da API precisa de `cognito-idp:AdminCreateUser` somente no pool. Use uma role de execução; não grave chaves AWS no código. `InitiateAuth`/`RespondToAuthChallenge` usam o client id.
6. Configure `AUTH_PROVIDER=cognito`, região, pool e client na API. O app client deve manter refresh token auth sem rotação; se habilitar rotação, adapte o fluxo de renovação para a API correspondente.
7. Aprove um interesse pelo endpoint administrativo. Só então solicite código. Demonstre primeiro acesso e retorno, código incorreto/expirado, reenvio, renovação, saída e isolamento entre barracas.

A Lambda lança erro em falha de entrega, mas não registra código, token ou resposta completa da Meta. Observe falhas no CloudWatch sem habilitar logs de payloads. Custos dependem do plano Cognito Essentials, usuários ativos, Lambda, KMS, Secrets Manager e cobrança da Meta; levantar na conta antes do piloto.

Referências: [Custom SMS Sender](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-sms-sender.html), [fluxos Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/authentication.html), [arquitetura AWS e WhatsApp](https://aws.amazon.com/blogs/security/how-to-use-whatsapp-to-send-amazon-cognito-notification-messages/).
