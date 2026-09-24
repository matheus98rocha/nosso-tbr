# Nosso TBR

Contexto social e de organização de livros da aplicação, incluindo estantes pessoais, relações entre leitores e avisos sobre novas adições.

## Leitores e relações

**Leitor**:
Pessoa usuária que mantém livros na aplicação e pode seguir outros leitores.
_Avoid_: usuário social, conta

**Seguidor**:
Leitor que mantém uma relação ativa de acompanhamento com outro leitor.
_Avoid_: amigo, assinante

**Ator da atividade**:
Leitor autenticado que executou uma ação na aplicação. Para a atividade de adicionar livro, é quem cadastrou o livro, independentemente do leitor responsável pelo livro.
_Avoid_: dono do livro, leitor responsável

**Leitor responsável**:
Leitor associado ao livro como pessoa que o escolheu ou lê. Não é necessariamente o ator que cadastrou o livro.
_Avoid_: autor da atividade

## Notificações sociais

**Notificação de novos livros**:
Aviso interno de que um ator da atividade adicionou um ou mais livros, entregue aos leitores que o seguem e mantêm essa preferência ativa.
_Avoid_: alerta, mensagem, atualização de status

**Preferência de notificação**:
Escolha individual de um seguidor sobre receber notificações de novos livros de um leitor específico. É ativada por padrão e não altera a relação de seguir.
_Avoid_: silenciar usuário, deixar de seguir

**Lote de notificação**:
Conjunto de livros adicionados pelo mesmo ator e acumulado em uma única notificação enquanto ela permanece não lida.
_Avoid_: evento, pacote

**Notificação não lida**:
Notificação que ainda não foi aberta pela ação de ver os livros. Uma notificação lida permanece no histórico recente.
_Avoid_: pendente, nova notificação

**Livros visíveis**:
Livros que o destinatário pode consultar segundo as regras atuais de privacidade e relacionamento. Uma notificação não concede acesso adicional a livros.
_Avoid_: livros públicos
