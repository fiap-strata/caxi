# Evidências da demonstração — 26/10/2026

Todos os registros desta pasta usam **dados fictícios de teste**. Números de telefone não representam participantes de pesquisa, e a imagem de produto do smoke é uma fixture técnica de upload. Não há envio de WhatsApp nem pagamento.

- [Landing mobile](landing-mobile.png).
- [Painel do vendedor](painel-mobile.png).
- [Pedido registrado pelo navegador](pedido-mobile.png).
- [Vitrine do design system](design-system-mobile.png).
- [Jornada técnica local](smoke-local.txt).
- [Jornada técnica com PostgreSQL/Compose](smoke-postgres.txt).
- [Testes locais](testes-locais.txt) e [PostgreSQL](testes-postgres.txt).
- [Saúde dos containers](compose-saude.json) e [auditoria](auditoria.txt).

Reproduzir: `npm ci`, `npm run dev` e, em outro terminal, `npm run smoke`. Para o ambiente Docker: `docker compose up --build -d --wait` e `CAXI_BASE_URL=http://localhost:8080 npm run smoke`.

Cada execução cria uma barraca e registros novos. Links presentes nos logs apontam ao ambiente local daquela execução e não são links de produção. O identificador é gerado novamente em cada reprodução.
