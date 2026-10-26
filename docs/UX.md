# Interface para pessoas com pouca familiaridade com leitura

- Perguntas curtas: “O que você vende?”, “Quanto custa?” e “Quanto você tem?”.
- Uma decisão principal por passo. Foto/nome, preço/unidade e quantidade em telas separadas.
- Campos com rótulos visíveis, exemplos e números grandes; botões com pelo menos 60 px de altura.
- Ícones acompanhados de texto nas ações. Quilo/unidade aparecem como escolhas visíveis, sem menu fechado.
- Descrição da barraca e URL completa ficam recolhidas por padrão.
- Mensagens de erro aparecem uma por vez e entram na área visível.
- A ação principal após publicar é “Enviar no WhatsApp”. A abertura da mensagem não confirma envio.
- Direção respeitosa, sem linguagem infantil ou pressupor familiaridade com termos técnicos.

Conferência realizada no navegador: navegação pelos três passos do produto, incremento de 2,5 para 3 kg e salvamento na API. A imagem de teste usada nessa conferência é fictícia.

Ainda precisa de validação com o público: observar se a pessoa reconhece os botões, entende quilo/unidade, informa o preço e termina o cadastro sem orientação. A simplificação não comprova, sozinha, que a interface é acessível a quem não lê. Instruções por áudio podem ser avaliadas nessa validação; não foram implementadas nesta versão.

Estilos dessa revisão: `apps/web/src/simple-ui.css`, sobre os tokens existentes. Evidência: `docs/screenshots/simple-quantity.png`.
