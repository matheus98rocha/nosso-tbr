# Data Model: Tutorial e recomendações (006)

**Feature ID:** 006  
**Spec:** [spec.md](./spec.md)

---

## 1. Persistência do tutorial (primeiro login)

### Coluna em `public.users`

| Coluna | Tipo | Null | Semântica |
| ------ | ---- | ---- | --------- |
| `welcome_tutorial_seen_at` | `timestamptz` | sim | `NULL` = ainda não viu (elegível ao tutorial automático no próximo login). Timestamp = já viu (ou backfill). |

- **Escrita:** o próprio Leitor (`auth.uid() = id`) via client Supabase ou service dedicado; RLS UPDATE já existente em `users` deve permitir a coluna (revisar grants de coluna se o projeto usar column-level GRANT).
- **Backfill no deploy:** `UPDATE public.users SET welcome_tutorial_seen_at = now() WHERE welcome_tutorial_seen_at IS NULL` **antes** de liberar o UI — contas existentes não recebem tutorial surpresa (FR-023).
- **Contas novas:** trigger/registro atual deixa `NULL`; primeiro login na Home grava `now()` ao **exibir**.

Não criar tabela separada no MVP.

---

## 2. Entidades de leitura (sem schema novo)

| Conceito | Fonte |
| -------- | ----- |
| Seguindo = 0 | `user_followers` onde `follower_id = me` (count / `getFollowingIds`) |
| Gostos do logado | `books.gender` onde participa (`readers` ∪ `chosen_by`) |
| Gostos do candidato | RPC `get_community_reader_genres` (INVOKER) → top lido/cadastrado |
| Atividade (fallback) | RPC `get_community_reader_activity` |
| Identidade | `users.id`, `display_name`, `avatar_seed` |

---

## 3. Modelo de domínio (app)

```text
WelcomeTutorialState
  seenAt: Date | null
  shouldAutoOpen: boolean   // seenAt === null && autenticado

FollowRecommendation
  readerId: string
  displayName: string
  avatarSeed: string | null
  reason: { kind: "shared_genre"; gender: string } | { kind: "active_reader" }
  registeredCount?: number

ZeroFollowingNudge
  visible: boolean          // followingCount === 0
  recommendations: FollowRecommendation[]  // max 5
```

Ordenação e overlap: funções puras no client a partir do snapshot (ver `plan.md`).
