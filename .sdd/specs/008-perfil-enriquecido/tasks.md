# Tasks: Perfil enriquecido

**Feature ID:** 008  
**Spec:** [spec.md](./spec.md)  
**Plan:** [plan.md](./plan.md)  
**Data model:** [data-model.md](./data-model.md)  
**Contracts:** [contracts/api-spec.md](./contracts/api-spec.md)  
**Criada em:** 2026-10-20

---

## Phase 1: Setup

- [x] T001 [P] `QUERY_KEYS.profile` em `src/constants/keys.ts`
- [x] T002 [P] `STATS_PATH` + `getCommunityViewPath` + testes de rota
- [x] T003 [P] Tipos `ProfileReadingShowcase` / `ProfileNetworkCounts` em `src/modules/profile/types/`

---

## Phase 2: Foundational

- [x] T004 `UserSocialService.getNetworkCounts(userId)` + testes
- [x] T005 `ProfileReadingService.getReadingShowcase(readerId)` (RPC filter + `pickTopGenre` + labels) + testes
- [x] T006 Invalidar `QUERY_KEYS.profile` no `onSettled` de `useOptimisticFollowToggle` + teste

**Checkpoint:** serviço de vitrine e contagens de rede prontos; follow invalida cache do perfil.

---

## Phase 3: User Story 1–3 — Meu perfil P1 🎯 MVP

- [x] T007 [US1] `useProfileReadingShowcase(readerId)` + testes
- [x] T008 [US1] `ProfileReadingActivity` (usa `formatCommunityMemberActivity`) + testes
- [x] T009 [US3] `ProfileGenreHighlights` (ausência pt-BR) + testes
- [x] T010 [US2] `ProfileFavoritesSection` (ListGrid + CTA) + testes
- [x] T011 [US1][US2][US3] Wire em `ClientProfile` (atividade, gêneros, favoritos sem `hideInteractions`) + atualizar `clientProfile.test.tsx`

**Checkpoint:** Meu perfil mostra atividade, gêneros e favoritos.

---

## Phase 4: User Story 4 — Perfil de membro P1

- [x] T012 [US4] `useProfileNetworkCounts` + wire no membro (totais informativos)
- [x] T013 [US4] Atividade + gêneros no `MemberProfileView`; remover e-mail; degradação parcial + testes

**Checkpoint:** membro sem e-mail; atividade/gêneros/rede; favoritos intactos.

---

## Phase 5: User Story 5–6 — Hub P2

- [x] T014 [US5] `ProfileHubLinks` (Stats / Estantes / Comunidade) + testes
- [x] T015 [US6] `ProfileNetworkCountLinks` no Meu perfil (`?view=seguindo|seguidores`) + estender `useClientProfile` + testes

**Checkpoint:** hub e contagens clicáveis.

---

## Phase 6: Polish

- [x] T016 Checklist requirements + status da spec → Implemented
- [x] T017 README mapa de funcionalidades
- [x] T018 Marcar tasks; testes unitários da feature

---

## Dependencies (graph)

```text
T001, T002, T003 → T004, T005
T005 → T007 → T008, T009
T007 → T011
T010 → T011
T004 → T012 → T013
T002 → T014, T015
T011 + T013 → T016
T006 ∥ T007 (após T001)
```

## Parallel examples

- T001 ∥ T002 ∥ T003  
- T008 ∥ T009 ∥ T010 após T007  
- T014 ∥ T015 após Phase 4  
