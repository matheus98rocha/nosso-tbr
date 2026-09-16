# Requirements Checklist: 005-tela-comunidade

## P1 — Tela, listas e seguir

- [x] FR-001 Comunidade na navegação principal (autenticado)
- [x] FR-002 Visitante bloqueado
- [x] FR-003 Contagens seguindo e seguidores
- [x] FR-004 Contagem abre o recorte correspondente
- [x] FR-005 Recorte Todos: cadastrados exceto o logado
- [x] FR-006 Recorte Seguidores
- [x] FR-007 Recorte Seguindo
- [x] FR-008 Avatar e nome em cada item
- [x] FR-009 Seguir / deixar de seguir
- [x] FR-010 Estados vazios em pt-BR
- [x] FR-011 Ordenação alfabética pt-BR pelo nome
- [x] FR-017 Atualização de estado, contagens e recortes após seguir
- [x] FR-018 Erro em pt-BR preserva estado anterior
- [x] FR-019 E-mail de terceiros não aparece

## P1 — Gêneros e modal

- [x] FR-012 Gênero mais lido só no modal (não na lista)
- [x] FR-013 Modal ao tocar no leitor
- [x] FR-014 Gênero mais cadastrado no modal quando existir
- [x] FR-015 Gêneros respeitam visibilidade de livros
- [x] FR-016 Fechar modal mantém recorte e lista

## P2 — Perfil e busca

- [x] FR-020 Diretório completo sai do perfil; atalho para Comunidade
- [x] FR-021 Busca por nome de exibição

## P3 — Perfil do membro

- [x] FR-022 Atalho do modal para o perfil completo do membro
- [x] FR-023 Label com cadastrados, lidos e livro em leitura (quando existir)

## Success criteria (verificação)

- [x] SC-001 Feedback de carga ≤ 5s / nunca branco mudo
- [x] SC-002 Todos nunca inclui o próprio usuário
- [x] SC-003 Seguir altera contagem em exatamente 1
- [x] SC-004 Contagens = tamanho das relações
- [x] SC-005 Gênero mais lido ignora livro privado invisível
- [x] SC-006 Teclado + nome acessível no seguir
- [x] SC-007 Visitante sem dados da comunidade
- [x] SC-008 Label: cadastrados, lidos e “Lendo T” só com livros visíveis
