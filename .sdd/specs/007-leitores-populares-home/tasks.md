# Tasks: Leitores populares na Home

**Feature ID:** 007  
**Spec:** [spec.md](./spec.md)  
**Plan:** [plan.md](./plan.md)  
**Data model:** [data-model.md](./data-model.md)  
**Criada em:** 2026-10-20

---

## Phase 1: Setup

- [ ] T001 Tipos `PopularReader` em `src/modules/home/types/popularReaders.types.ts` + barrel
- [ ] T002 [P] `QUERY_KEYS.popularReaders` em `src/constants/keys.ts`
- [ ] T003 [P] Constante de storage key / helper da preferência + testes

---

## Phase 2: Foundational

- [ ] T004 Migration `get_popular_readers_for_home` SECURITY INVOKER + grants
- [ ] T005 [P] Registrar RPC em `database.types.ts` / tipos Supabase
- [ ] T006 Service thin `PopularReadersService.list(limit)` + testes (mock RPC)
- [ ] T007 `usePopularReadersPreference` (esconder/reexibir, chave por userId) + testes

**Checkpoint:** RPC tipada; preferência local isolada por usuário.

---

## Phase 3: User Story 1+4 — Lista e ordenação (P1) 🎯 MVP

- [ ] T008 [US1][US4] `usePopularReaders`: query, map domain, omit se hidden/guest
- [ ] T009 [US1] `PopularReadersStrip` + `PopularReaderCard` (horizontal, avatar, nome)
- [ ] T010 [US1] Integrar na Home entre filtros e ReadingNow
- [ ] T011 [P] [US4] Testes de ordenação/score (fixture) e exclusão self/following

**Checkpoint:** autenticado vê faixa ordenada; visitante não.

---

## Phase 4: User Story 2 — Seguir (P1)

- [ ] T012 [US2] Seguir na faixa via `useOptimisticFollowToggle`; remove item otimista
- [ ] T013 [US2] Toast erro pt-BR; alvo ≥ 44px; aria com nome

**Checkpoint:** seguir remove da faixa e atualiza grafo.

---

## Phase 5: User Story 3 — Esconder (P1)

- [ ] T014 [US3] Controle Esconder no header da faixa; some na hora
- [ ] T015 [US3] Persistência após reload; isolamento por userId

**Checkpoint:** esconder sobrevive a reload.

---

## Phase 6: User Story 5–6 — P2

- [ ] T016 [US5] Controle reexibir + CTA Ver comunidade → `/community`
- [ ] T017 [US6] Omitir faixa se zero candidatos; skeleton não bloqueia livros

**Checkpoint:** empty omite; reexibir funciona.

---

## Phase 7: Polish

- [ ] T018 Atualizar `CONTEXT.md` com termo **Leitores populares**
- [ ] T019 Checklist requirements + comentário na issue #175 apontando 007
- [ ] T020 Testes de integração Home (faixa presente/ausente)

---

## Dependencies

- 005 Comunidade (seguir, avatares, privacidade) — **já implementada**
- 006 Tutorial — **não bloqueia**; evitar segunda lista na Home
