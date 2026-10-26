# Validação da versão consolidada

Verificações realizadas em **26/10/2026**, com dados fictícios e sem envio de mensagens ou processamento de pagamentos.

| Verificação | Resultado | Evidência |
|---|---|---|
| Build TypeScript/React/NestJS | Passou | `npm run build` |
| Regras de domínio | 4 testes passaram | [Saída local](evidencias/testes-locais.txt) |
| Cenário HTTP integrado com SQLite/SQL.js | Passou | [Saída local](evidencias/testes-locais.txt) |
| Mesmo cenário HTTP com PostgreSQL/PostGIS | Passou | [Saída PostgreSQL](evidencias/testes-postgres.txt) |
| Jornada pelo proxy Vite | Passou | [Smoke local](evidencias/smoke-local.txt) |
| Jornada por nginx/Compose/PostgreSQL | Passou | [Smoke Compose](evidencias/smoke-postgres.txt) |
| Saúde de PostgreSQL, API e web no Compose | Saudáveis | [Estados dos containers](evidencias/compose-saude.json) |
| Auditoria de dependências de produção | Sem vulnerabilidades reportadas na execução | [Auditoria](evidencias/auditoria.txt) |
| Interface no Chrome | Landing, login demo, painel, compra de 0,5 kg e vitrine inspecionados | [Capturas](evidencias/README.md) |

## O que o cenário HTTP cobre

Interesse deduplicado; aprovação; código incorreto e reenvio; cookie/CSRF; publicação bloqueada sem produto; upload; persistência após reiniciar a API; isolamento entre proprietários; catálogo sem estoque exato; compra de 0,5 kg; identificação de repetição; conflito na edição antiga de produto; rollback quando a gravação do pedido falha; pedidos concorrentes disputando estoque; transições de atendimento; cancelamento com reposição uma vez; impossibilidade de cancelar concluído; rejeição de unidade fracionária; saída da sessão.

O teste usa serviços HTTP reais e banco, com falha de gravação injetada somente no trecho que verifica rollback. A auditoria recebeu overrides de `multer` e `body-parser` para versões corrigidas; não é uma garantia permanente contra novas vulnerabilidades.

## Demonstração do valor operacional

O smoke cria uma barraca e produto fictícios, registra compra de 0,5 kg por R$ 4,00, conclui um pedido e cancela outro. Confere uma venda concluída, uma cancelada e 2 kg restantes de um estoque inicial de 2,5 kg. Repetir a mesma tentativa retorna o mesmo pedido e não reserva de novo.

O teste no navegador também criou um pedido de 0,5 kg e verificou o link de WhatsApp com destinatário da barraca, resumo e referência. Não clicou em enviar mensagem.

## Limites

- OTP real, template Meta e recursos AWS não foram provisionados nem validados.
- As verificações acima são técnicas; não medem ganho de tempo, retenção ou aumento de vendas com usuários reais.
- Não há conciliação de pagamentos, coleta de avaliações ou logística própria.
- A interface preserva as contribuições recebidas e ainda possui variações visuais em relação à vitrine de componentes.
- O [relatório original da jornada 3](originais/Caxi_Jornada_3_Pedidos_e_Entregas.pdf) e `docs/screenshots/` são materiais recebidos. As capturas e logs em `docs/evidencias/` correspondem à versão consolidada.
