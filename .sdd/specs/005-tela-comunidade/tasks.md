# Tasks: Tela de Comunidade

**Feature ID:** 005  
**Spec:** [spec.md](./spec.md)  
**Plan:** [plan.md](./plan.md)  
**Data model:** [data-model.md](./data-model.md)  
**Criada em:** 2026-09-16

---

## Phase 1: Setup

- [x] T001 Criar constante `COMMUNITY_PATH` em `src/lib/routes/community.ts` + teste
- [x] T002 [P] Adicionar `QUERY_KEYS.community` em `src/constants/keys.ts`
- [x] T003 [P] Tipos de domínio em `src/modules/community/types/community.types.ts` + barrels do módulo

---

## Phase 2: Foundational

- [x] T004 Migration `get_community_reader_genres` SECURITY INVOKER + grants (`authenticated` only)
- [x] T005 [P] Registrar RPC em `src/types/supabase.ts` e `database.types.ts`
- [x] T006 `pickTopGenre` (empate pt-BR, ignora vazio) + testes
- [x] T007 [P] `filterCommunityMembers` + `parseCommunityView` + testes (recorte, busca, exclui self, contagens independentes)
- [x] T008 `UserSocialService.getFollowerIds` (`eq following_id = me`) + testes
- [x] T009 `CommunityService.getSnapshot` (sem e-mail, exclui self, mapeia gêneros) + testes
- [x] T010 `useOptimisticFollowToggle` invalida `QUERY_KEYS.community.all` + testes

**Checkpoint:** snapshot monta sem e-mail; RPC INVOKER; follow invalida comunidade.

---

## Phase 3: User Story 1 — Ver comunidade e contagens (P1) 🎯 MVP

- [x] T011 [US1] Item **Comunidade** em `useHeader` (`requiresAuth`, entre Estatísticas e Estantes) + testes (logado visível, visitante oculto, common-user vê)
- [x] T012 [P] [US1] `ALLOWED_LABELS` + `buildMenuItems` do `DesktopNavMenu` incluem Comunidade + testes
- [x] T013 [US1] Rota `src/app/(main)/community/page.tsx` com `getCurrentUser` + redirect `/auth`
- [x] T014 [US1] Hook `useCommunity`: snapshot, contagens pelos IDs, exclude self, loading/error, `?view=`
- [x] T015 [US1] `CommunityCounts` + `CommunityScreen` (lista avatar/nome, vazios pt-BR, skeleton)

**Checkpoint:** autenticado vê contagens e Todos; visitante redireciona; nav mostra Comunidade.

---

## Phase 4: User Story 2 — Seguir na lista (P1)

- [x] T016 [US2] `CommunityMemberRow` com Seguir/Seguindo (alvo ≥ 44px, aria com nome do leitor)
- [x] T017 [US2] Toggle na Comunidade; toast de erro pt-BR; overlay otimista de `followingIds` nas contagens

**Checkpoint:** seguir sobe “seguindo” em 1; falha preserva estado e avisa em pt-BR.

---

## Phase 5: User Story 3 — Recortes Seguidores / Seguindo (P1)

- [x] T018 [US3] Recortes Todos / Seguidores / Seguindo na UI; toque nas contagens troca `view`
- [x] T019 [P] [US3] Testes de `useCommunity` / filtro: recorte, URL, empty states, contagens independentes da busca

**Checkpoint:** listas batem com IDs; empty em pt-BR; `?view=` persiste.

---

## Phase 6: User Story 4 — Gêneros e modal (P1)

- [x] T020 [US4] Lista **sem** chip de gênero; gênero mais lido só no modal
- [x] T021 [US4] `CommunityReaderModal` (avatar, nome, mais lido, mais cadastrado, ausência, seguir)
- [x] T022 [P] [US4] Testes: empate de gênero; ausência de chip; livro privado invisível não altera o top (mapper / mock RPC)

**Checkpoint:** modal abre/fecha sem perder recorte; gêneros só do visível.

---

## Phase 7: User Story 5–6 — Perfil e busca (P2)

- [x] T023 [US5] Remover diretório completo de `ClientProfile`; CTA “Ver comunidade”; testes do profile
- [x] T024 [US6] Busca local por nome no snapshot; empty + limpar busca

**Checkpoint:** perfil sem segunda lista; busca filtra só o recorte atual.

---

## Phase 8: User Story 7 + polish (P3)

- [x] T025 [US7] Botão “Ver perfil” no modal → `/profile/[userId]`
- [x] T026 [P] Prefetch do snapshot em `useDesktopNav` (hover Comunidade, staleTime 2 min) + testes
- [x] T027 README (mapa de funcionalidades) + Second Brain (promover RN-COM, telas, feature)
- [x] T028 Marcar tasks concluídas e smoke da tela

**Checkpoint:** P1–P3 entregues; vault e README alinhados.

---

## Phase 9: User Story 8 — Atividade na label (P1)

- [x] T029 Migration `get_community_reader_activity` SECURITY INVOKER + grants (`authenticated` only)
- [x] T030 [P] Registrar RPC em `src/types/supabase.ts` e `database.types.ts`; mapear no `CommunityService.getSnapshot`
- [x] T031 [US8] Label da linha e modal: cadastrados, lidos e “Lendo {título}” quando existir; `formatCommunityMemberActivity` + testes
- [x] T032 [P] [US8] Testes de mapper (ausência = 0/0/null), pluralização pt-BR e omissão de “Lendo”

**Checkpoint:** lista mostra atividade visível; livro privado não vaza título nem conta.
