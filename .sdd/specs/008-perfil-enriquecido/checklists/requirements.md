# Requirements Checklist: 008-perfil-enriquecido

## P1 — Meu perfil (atividade, favoritos, gêneros)

- [x] FR-001 Cadastrados e lidos no Meu perfil
- [x] FR-002 Título em leitura quando existir
- [x] FR-003 Seção de favoritos no Meu perfil
- [x] FR-004 Gêneros mais lido / mais cadastrado (ou ausência)
- [x] FR-005 Preservar avatar, conta e atalho Comunidade

## P1 — Perfil de membro

- [x] FR-006 Atividade com visibilidade do visitante
- [x] FR-007 Gêneros com visibilidade do visitante
- [x] FR-008 Totais seguindo / seguidores do membro
- [x] FR-009 Seguir + favoritos existentes

## P2 — Hub e rede

- [x] FR-010 Atalhos Estatísticas, Estantes, Comunidade
- [x] FR-011 Contagens do Meu perfil → Comunidade com `view`

## Transversal

- [x] FR-012 Loading / vazio / erro em pt-BR
- [x] FR-013 Privacidade de livros no perfil de membro (RPC INVOKER 005)
- [x] FR-014 Visitante não autenticado bloqueado (guarda de rota existente)

## Success criteria (verificação)

- [x] SC-001 Atividade no Meu perfil com skeleton / query (unit)
- [x] SC-002 Favoritos Meu perfil = `getFavoriteBooksForUser` do mesmo userId
- [x] SC-003 Gêneros via mesmas RPCs da Comunidade + `pickTopGenre`
- [x] SC-004 Contagens via `getNetworkCounts` em `user_followers`
- [x] SC-005 Livro solo privado não vaza (INVOKER / RLS — mesmo contrato 005)
- [x] SC-006 Atalhos / `view` corretos (P2 — testes de rota e UI)
- [x] SC-007 a11y básico das novas seções (headings, links nomeados)

## Clarificações (travadas no Plan)

- [x] E-mail no perfil de membro → ocultar
- [x] Favoritos no Meu perfil → com interações do dono
- [x] Atalho Recap no hub → não
- [x] Preview de estantes → só atalho `/shelves`
