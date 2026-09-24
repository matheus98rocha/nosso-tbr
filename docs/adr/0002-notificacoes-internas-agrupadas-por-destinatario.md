# Notificações internas agrupadas por destinatário

**Status**: accepted

As notificações de novos livros serão persistidas dentro da aplicação, com uma preferência por relação entre seguidor e ator e uma notificação por destinatário e lote não lido. Novos livros do mesmo ator incrementam e atualizam esse lote até ele ser lido; a escolha evita poluição visual e mantém o painel simples, sem exigir push, e-mail ou atualização em tempo real na primeira versão.

**Consequências**: a mensagem precisa variar entre singular e plural, e o painel deve separar não lidas de lidas recentes. Desligar a preferência bloqueia novos avisos, mas preserva o histórico.
