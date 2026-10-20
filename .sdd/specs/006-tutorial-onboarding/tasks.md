# Tasks: Tutorial de boas-vindas e recomendações

**Feature ID:** 006  
**Spec:** [spec.md](./spec.md)  
**Plan:** [plan.md](./plan.md)  
**Data model:** [data-model.md](./data-model.md)  
**Criada em:** 2026-10-20

---

## Phase 1: Setup

- [x] T001 Migration `users.welcome_tutorial_seen_at` + backfill `now()` em linhas existentes (FR-023) + grants de coluna se necessário
- [x] T002 [P] Registrar coluna em `database.types.ts` (`src/types/supabase.ts` continua gerado localmente)
- [x] T003 [P] `QUERY_KEYS.onboarding` em `src/constants/keys.ts`
- [x] T004 Tipos de domínio em `src/modules/onboarding/types/onboarding.types.ts` + barrels do módulo

---

## Phase 2: Foundational

- [x] T005 `rankFollowRecommendations` (overlap, ordenação RN-ONB-10, limite N, exclusões, fallback sem gênero inventado) + testes
- [x] T006 `OnboardingService.markWelcomeTutorialSeen` (update idempotente) + testes
- [x] T007 `OnboardingService.getFollowRecommendations` (RPCs community + gêneros do self + rank) + testes
- [x] T008 Expor `welcomeTutorialSeenAt` na sessão/store do Leitor logado (`getCurrentUserSession` / user store) + testes

**Checkpoint:** mark + ranking + flag no user; contas antigas backfilladas.

---

## Phase 3: User Story 1–2 — Tutorial no primeiro login (P1) 🎯 MVP

- [x] T009 [US1] `useWelcomeTutorial`: auto-open só se `seenAt === null`; chama mark ao exibir; não reabre no mesmo mount após seen
- [x] T010 [US1][US2] `WelcomeTutorialDialog` — 3 passos (seguir, livros, IA), Pular/Concluir, CTAs, pt-BR, a11y
- [x] T011 [US1][US2] Wire na `ClientHome`: dialog + CTAs → Comunidade/nudge, `BookUpsert`, `AiRecommendationDialog`
- [x] T012 [P] Testes: SC-001/SC-002 (abre se null; não abre se seen; mark chamado; visitante sem tutorial)

**Checkpoint:** primeiro login mostra tutorial; segundo não; CTAs abrem superfícies reais.

---

## Phase 4: User Story 3–4 — Aviso zero-seguindo + gênero (P1)

- [x] T013 [US3] `useFollowRecommendations` + `ZeroFollowingNudge` (aviso pt-BR, lista ≤5, CTA Comunidade)
- [x] T014 [US3][US4] `FollowRecommendationRow` (avatar, nome, motivo, seguir via `useOptimisticFollowToggle`)
- [x] T015 Invalidar `QUERY_KEYS.onboarding.recommendations` no settle do follow toggle (ou no hook do nudge)
- [x] T016 [P] Testes: nudge some com following ≥ 1; motivo shared_genre; self excluído; erro follow em pt-BR

**Checkpoint:** seguindo=0 vê aviso+recs; seguir 1 remove aviso; overlap priorizado.

---

## Phase 5: User Story 5 + FR-009 — Cold start e empty Home (P2)

- [x] T017 [US5] Fallback `active_reader` na UI (copy sem alegar gênero) + testes
- [x] T018 [FR-009] Empty state da Home: remover link `/profile` para rede; apontar Comunidade; evitar duplicar card de rede quando nudge visível + testes `home/index.test.tsx`

**Checkpoint:** cold start honesto; empty não manda ao perfil legado.

---

## Phase 6: User Story 6 — Reabrir (P3) + polish

- [x] T019 [US6] Atalho “Ver tutorial de novo” no Meu perfil (não limpa `seen_at`) + teste
- [x] T020 README (mapa de funcionalidades) + checklist requirements atualizado
- [x] T021 Marcar tasks concluídas; smoke manual Home (primeiro login simulado com `seen_at` null)

**Checkpoint:** P1–P3 documentados; feature pronta para review.

---

## Dependencies (graph)

```text
T001 → T002 → T008
T003, T004 → T005 → T007 → T013
T006 → T009 → T010 → T011
T007 → T014 → T015
T011 + T013 → T018
T010 → T019
```

## Parallel examples

- T002 ∥ T003 ∥ T004 após T001  
- T012 ∥ T016 após UI correspondente  
- T017 ∥ T018 após Phase 4  
