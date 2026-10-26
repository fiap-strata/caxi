# Business Intelligence e Startup Development — Sprint 2

## Cliente e problema

O Caxi atende vendedores permissionários, com foco em feirantes que já recebem encomendas e vendem para sua própria base de clientes. Fotos, preços, quantidades e instruções dispersos em conversas dificultam conferir o combinado e organizar o atendimento.

A proposta é reunir oferta e pedidos sem exigir mudança do canal de conversa do vendedor. O comprador escolhe produtos em um catálogo; o pedido chega estruturado ao painel; vendedor e comprador continuam combinando pelo WhatsApp.

## Evolução e ajustes para a Sprint 2

O grupo considera o CP3 concluído com MVP 0, especificações técnicas e landing de lista de espera. A orientação de produto para esta sprint é melhorar a jornada do usuário e tornar o valor demonstrável.

| Ajuste de produto | Como aparece no MVP desta entrega |
|---|---|
| Transformar interesse em uma sequência de ativação | Landing com chamada para cadastro, lista de espera, liberação e cadastro guiado |
| Reduzir a carga inicial de configuração | Nome da barraca e um produto completo permitem publicar; endereço não é obrigatório no cadastro |
| Manter continuidade entre aquisição e operação | O cadastro inicial gera os mesmos produtos e catálogo usados no dia a dia |
| Tornar a oferta compartilhável | Catálogo público com link estável, foto, preço, unidade e disponibilidade |
| Demonstrar organização da venda | Checkout gera pedido persistido, com itens, quantidades, total, contato e modalidade |
| Acompanhar o atendimento | Lista do vendedor com preparo, pronto, conclusão e cancelamento |
| Conferir o resultado da operação | Resumo de pedidos concluídos e estoque, sem inferir recebimento ou lucro |

Esta tabela descreve decisões e comportamento do produto. Não atribui comentários específicos a entrevistados ou professores sem o registro correspondente.

## Landing page e aquisição

A landing apresenta a proposta do Caxi e recebe nome e WhatsApp no CTA de interesse. O cadastro fica pendente até aprovação. A implementação registra eventos de interesse, liberação, acesso, produto e publicação, permitindo conferir o avanço do funil. No modo local, os eventos ficam marcados como demonstração.

A lista de espera integra o trabalho anterior e permanece utilizável na mesma aplicação. Não há promessa de vendas adicionais nem taxa de conversão inventada.

## Primeiro valor demonstrável

**Tarefa:** publicar uma oferta e organizar uma encomenda de ponta a ponta.

1. Vendedor cria a barraca e cadastra um produto com foto, preço por kg/unidade e estoque.
2. Publica e compartilha o catálogo.
3. Comprador escolhe a quantidade e registra o pedido.
4. O sistema calcula o total e reserva o estoque ao registrar o pedido.
5. Comprador pode abrir o WhatsApp com o resumo preenchido. O envio depende da ação dele.
6. Vendedor encontra o pedido e acompanha preparo, disponibilidade e conclusão.
7. O resumo contabiliza a venda concluída; cancelamento devolve a reserva e não soma ao total vendido.

**Valor entregue pela funcionalidade:** referência única de pedido, itens e quantidades explícitos, total calculado e fila de atendimento. A demonstração permite observar esses resultados. Não permite quantificar redução de tempo, aumento de vendas ou retenção sem medição em campo.

## Operação assistida e limites

O acesso local usa aprovação e código de demonstração; o envio de mensagens e a combinação de pagamento/retirada/entrega são manuais. Catálogo, pedido, mudança de status e estoque são executados pela aplicação e persistidos. Isso permite demonstrar a operação assistida sem simular pagamentos ou envio automático de WhatsApp.

O [relatório original de Pedidos e Entregas](../originais/Caxi_Jornada_3_Pedidos_e_Entregas.pdf) descreve os testes manuais da contribuição de Maria. A [validação consolidada](../VALIDACAO.md) registra as verificações técnicas desta versão. Esses registros não são apresentados como estudo quantitativo com feirantes.

## Roteiro de apresentação

- Mostrar proposta e CTA na landing.
- Publicar produto e abrir catálogo em outra aba.
- Comprar 0,5 kg, conferir total e pedido no painel.
- Concluir um atendimento e cancelar outro, mostrando a diferença no estoque e no resumo.
- Explicar a continuidade entre as quatro jornadas: ativar, operar, vender e consultar resultados.

O comando `npm run smoke` reproduz o caminho por HTTP com dados fictícios. Capturas e resultado da execução ficam em `docs/evidencias/`.
