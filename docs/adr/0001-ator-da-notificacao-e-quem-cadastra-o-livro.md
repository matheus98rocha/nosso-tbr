# O ator da notificação é quem cadastra o livro

**Status**: accepted

O ator de uma notificação de novos livros é o leitor autenticado que executou o cadastro, e não `user_id` ou `chosen_by`, pois esses campos representam o leitor responsável pelo livro e podem apontar para outra pessoa. Os destinatários são os seguidores desse ator no momento do cadastro; o próprio ator não é destinatário.

**Consequências**: o registro da atividade precisa preservar a identidade do executor autenticado. Alterações posteriores no leitor responsável não devem mudar quem originou a notificação.
