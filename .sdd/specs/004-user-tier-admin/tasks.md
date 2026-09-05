# Tasks: Tier de Usuário (Admin / Common-User)

**Feature ID:** 004  
**Spec:** [spec.md](./spec.md)  
**Plan:** [plan.md](./plan.md)  
**Data model:** [data-model.md](./data-model.md)  
**Criada em:** 2026-09-05

---

## Phase 1: Setup

- [x] T001 Criar tipos `UserTier`, `AdminUserListItem`, `InviteLinkPayload` em módulo admin/auth
- [x] T002 [P] Checklist de requirements em `checklists/requirements.md`

---

## Phase 2: Foundational

- [x] T003 Migration `users_tier`: enum + coluna + seed admin
- [x] T004 Atualizar `src/types/supabase.ts` com `tier`
- [x] T005 Implementar `requireAdmin` + testes
- [x] T006 Hidratar `tier` no `userStore` / layout / `useIsAdmin`

**Checkpoint:** admin seed reconhecido; common_user bloqueado em `requireAdmin`.

---

## Phase 3: User Story 1 — Tier default (P1)

- [x] T007 [US1] Garantir upsert de registro com `tier: common_user` (ou default DB)
- [x] T008 [P] [US1] Teste/registro que novo perfil nasce common_user

---

## Phase 4: User Story 2 — Administração (P1)

- [x] T009 [US2] `GET /api/admin/users` + service client
- [x] T010 [P] [US2] `GET /api/admin/invite-link` + service
- [x] T011 [US2] Módulo `src/modules/admin` + rota `/admin`
- [x] T012 [US2] Guard de página admin (`useIsAdmin`)

**Checkpoint:** admin vê lista + link; common_user 403/redirect.

---

## Phase 5: User Story 3 — Autores admin (P1)

- [x] T013 [US3] Guard página `/authors`
- [x] T014 [US3] `requireAdmin` em PATCH/DELETE authors + testes

---

## Phase 6: User Story 4 — Nav (P2)

- [x] T015 [US4] `useHeader`: Autores e Administração só se admin; ALLOWED_LABELS
- [x] T016 [P] [US4] Testes do header/menu

---

## Phase 7: Polish

- [x] T017 Atualizar Second Brain (RN tier + schema + telas)
- [x] T018 Marcar tasks concluídas e smoke manual
