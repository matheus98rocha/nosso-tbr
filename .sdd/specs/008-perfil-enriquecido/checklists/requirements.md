# Requirements Checklist: 008-perfil-enriquecido

## P1 — Meu perfil (atividade, favoritos, gêneros)

- [ ] FR-001 Cadastrados e lidos no Meu perfil
- [ ] FR-002 Título em leitura quando existir
- [ ] FR-003 Seção de favoritos no Meu perfil
- [ ] FR-004 Gêneros mais lido / mais cadastrado (ou ausência)
- [ ] FR-005 Preservar avatar, conta e atalho Comunidade

## P1 — Perfil de membro

- [ ] FR-006 Atividade com visibilidade do visitante
- [ ] FR-007 Gêneros com visibilidade do visitante
- [ ] FR-008 Totais seguindo / seguidores do membro
- [ ] FR-009 Seguir + favoritos existentes

## P2 — Hub e rede

- [ ] FR-010 Atalhos Estatísticas, Estantes, Comunidade
- [ ] FR-011 Contagens do Meu perfil → Comunidade com `view`

## Transversal

- [ ] FR-012 Loading / vazio / erro em pt-BR
- [ ] FR-013 Privacidade de livros no perfil de membro
- [ ] FR-014 Visitante não autenticado bloqueado

## Success criteria (verificação)

- [ ] SC-001 Atividade no Meu perfil ≤ 5s / skeleton
- [ ] SC-002 Favoritos Meu perfil = favoritos do mesmo userId
- [ ] SC-003 Gêneros alinhados à Comunidade para o mesmo visitante
- [ ] SC-004 Contagens de rede do membro batem com relações
- [ ] SC-005 Livro solo privado não vaza
- [ ] SC-006 Atalhos / `view` corretos (P2)
- [ ] SC-007 a11y básico das novas seções

## Clarificações abertas

- [ ] E-mail no perfil de membro (ocultar vs manter)
- [ ] Interações nos favoritos do Meu perfil
- [ ] Atalho Recap no hub (default: não)
- [ ] Preview de estantes (default: só atalho)
