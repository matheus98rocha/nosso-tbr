# Importação não gera notificação de novos livros

**Status**: accepted

A importação registra vários livros de uma vez e não é atividade para seguidores. O trigger `books_notify_followers_after_insert` notifica em todo insert feito por um leitor autenticado e acumula na notificação não lida. A importação grava os livros numa transação que esse trigger reconhece e ignora. O livro importado não é um tipo diferente e não ganha coluna de origem.

**Considered options**: coluna permanente de origem no livro; apagar a notificação depois do insert; microserviço separado só para o CSV.

**Consequences**: qualquer insert fora dessa transação continua notificando. Quem ler o trigger encontra a exceção de propósito.
