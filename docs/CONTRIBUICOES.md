# Contribuições e consolidação

| Material | Origem | Integração |
|---|---|---|
| Aplicação base | Rafael, `challenge (1).zip` | Onboarding, landing, operação, React/NestJS, persistência e configuração Cognito |
| Pedidos e entregas | Maria Júlia, `challenge.zip` e relatório PDF | Checkout, pedidos, atendimento e indicadores integrados na aplicação base |
| Fundação técnica e design system | Enzo, [Rodriguessz/caxi-monolito](https://github.com/Rodriguessz/caxi-monolito), commit `ef1d275b0b306425297fa1e2b52b687d43f8cd60` | Componentes/tokens React e vitrine, health checks adaptados, desenho AWS e estrutura de CI/Compose adaptada ao monorepo |
| Direção de produto | Gabriel e decisões do projeto Caxi | Quatro jornadas, contratos e escopo da Sprint 2 |

Os ZIPs compartilham a mesma base; a versão de Maria acrescenta os arquivos de pedidos e a integração nas telas. A consolidação usa essa versão ampliada, evitando duas aplicações concorrentes no repositório.

O código-base de barracas de Enzo possui outro modelo de dados; manter dois cadastros/bancos independentes quebraria a jornada integrada. Foram aproveitados os componentes, health checks e estrutura de infraestrutura, preservando os documentos originais como referência. O desenho AWS é proposta, não deploy realizado.

Correções da consolidação: compras em passos de 0,5 kg, idempotência de pedido, transação de pedido/estoque, cancelamento sem dupla reposição, proteção contra edição de estoque desatualizada, destino WhatsApp da barraca e contratos de pedidos no Swagger. Foram incluídos testes para essas regras.

Os bancos SQLite, uploads de demonstração, caches, builds e `node_modules` contidos nos ZIPs não são versionados. Capturas anteriores e o PDF da jornada 3 ficam preservados como evidências recebidas; resultados de execução desta versão são separados em `docs/evidencias`.

## Figma

[Design System Caxi](https://www.figma.com/design/bayroMB0vsrd8sjHFWL2q9/Caxi--Design-System?node-id=0-1).

O conector remoto informou falta de permissão e o navegador recebeu HTTP 403. O grupo forneceu depois uma exportação `.fig`, inspecionada localmente: [fonte e inventário](../design/README.md). A vitrine deriva dos componentes de Enzo; a comparação estrutural confirmou 55 de 57 valores de tokens, com diferenças de raio documentadas. A página de telas de referência está vazia. Não se declara auditoria visual completa das variantes.

## Documentos acadêmicos

O PDF **Challenge Sprint 2 — Turma de Quarta (4ESPR)** enviado em 26/10 é a referência vigente. A entrega de BI considera o CP3 anterior concluído, conforme orientação do grupo. Não foi criado um novo pacote CP3/MVP 0. RPA cobre processo mapeado; DevOps cobre infraestrutura e desenvolvimento.

## Identificação dos arquivos recebidos

SHA-256 para conferir a origem, sem versionar os ZIPs ou bancos de teste:

- `challenge (1).zip`: `625be2c7e273a335753727ac9ff1c2c2f9a60c6d3130805325d7ef43609d850e`.
- `challenge.zip`: `bfbd3d914c85591f42b7c0912fd236766c24e5bca6e673ce79362d826eafdec5`.
- `Caxi_Jornada_3_Pedidos_e_Entregas.pdf`: `5fa58f752a7cd167f38b402a466aba49cbf30682d5463689ef707600cd9b876a`.
