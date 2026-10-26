# Contratos da aplicação consolidada

API NestJS em `/api`. Swagger: `/api/docs`; JSON exportado: [openapi.json](openapi.json).

## Acesso e sessão

| Método | Rota | Uso |
|---|---|---|
| GET | `/config` | Indica modo demo |
| POST | `/interests` | Nome e telefone; registro deduplicado por telefone |
| POST | `/demo/interests/:id/approve` | Aprovação apenas no modo demo |
| GET | `/admin/interests` | Triagem, exige X-Admin-Key |
| POST | `/admin/interests/:id/approve` | Aprovação administrativa |
| POST | `/auth/code` | Inicia desafio para telefone aprovado |
| POST | `/auth/verify` | Confirma código e cria cookie HttpOnly; retorna CSRF |
| GET | `/auth/session` | Recupera identidade e CSRF |
| POST | `/auth/refresh` | Renova acesso Cognito quando necessário |
| POST | `/auth/logout` | Remove sessão |

Mutações autenticadas exigem `X-CSRF-Token`. O identificador da barraca no catálogo não concede edição. Modo demo usa código de teste e é bloqueado em produção.

## Barraca, produtos e catálogo

| Método | Rota | Uso |
|---|---|---|
| GET | `/onboarding` | Barraca e produtos do proprietário |
| PUT | `/stalls/mine` | Salva nome e descrição |
| GET / POST | `/products` | Lista / cria produto |
| PATCH | `/products/:id` | Edita produto com versão atual |
| POST | `/uploads` | Multipart `file`, JPG/PNG/WebP até 5 MB |
| POST | `/stalls/mine/publish` | Publica com produto completo e disponível |
| GET | `/catalog/:id` | Oferta pública, sem quantidade exata de estoque |
| POST | `/events/shared` | Registra ação de compartilhamento; não comprova envio |
| GET | `/admin/funnel` | Eventos agregados de aquisição/ativação, exige chave administrativa |

Produto: `name`, `priceCents`, `unit` (`kg` ou `un`), `stock`, `photoUrl` e `available`. Na edição, enviar também `version` devolvida pela API. Mudança de estoque por pedido incrementa a versão; edição antiga retorna HTTP 409.

Valores monetários são centavos inteiros. Estoque por kg é múltiplo de 0,5; por unidade é inteiro. Preço deve ser positivo. Publicação exige pelo menos um produto válido, disponível e com estoque.

## Pedidos

| Método | Rota | Uso |
|---|---|---|
| POST | `/catalog/:id/orders` | Cria pedido público e reserva estoque |
| GET | `/orders` | Lista privada do proprietário da barraca |
| PATCH | `/orders/:id/status` | Altera status de pedido da própria barraca |

Exemplo de criação:

```json
{
  "requestId": "00000000-0000-4000-8000-000000000001",
  "customerName": "Comprador de demonstração",
  "customerPhone": "11988888888",
  "fulfillment": "pickup",
  "notes": "Combinar horário no WhatsApp",
  "items": [{ "productId": "id-do-produto", "quantity": 0.5 }]
}
```

Para `fulfillment=delivery`, `address` é obrigatório. `requestId` identifica uma tentativa: o mesmo identificador com o mesmo conteúdo retorna o pedido existente; com conteúdo diferente, retorna 409. O cliente mantém o identificador quando repete após falha de rede.

O servidor consulta os preços e calcula `subtotalCents = round(priceCents * quantity)` por item. O total soma os subtotais. Nome, preço e unidade ficam preservados no pedido. Criação e reserva são uma transação; falha não deixa desconto parcial. Cancelamento devolve uma única vez, e concluir não desconta novamente.

Status:

- `received` → `preparing` ou `cancelled`.
- `preparing` → `ready` ou `cancelled`.
- `ready` → `completed` ou `cancelled`.
- `completed` e `cancelled` são terminais. Repetir o status atual é idempotente.

O resumo do WhatsApp contém identificação, itens, total e link do painel autenticado para o vendedor. O envio é manual. Não há consulta pública de dados pessoais do pedido por identificador.

## Saúde e métricas

- `/health/live`: processo responde.
- `/health/ready`: banco acessível.
- Resumo de vendas: contagem e soma dos pedidos `completed`; cancelados não compõem o total. São valores de pedidos, sem conciliação de recebimento e sem lucro.

Erros: 400 dados/regra inválidos, 401 sessão/código inválido, 403 convite/origem/CSRF, 404 inexistente ou fora do proprietário, 409 versão/tentativa em conflito, 429 limite de requisições/tentativas.
