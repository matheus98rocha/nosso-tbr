# Implementation Plan: Tier de Usuário (Admin / Common-User)

**Feature ID:** 004  
**Spec:** [spec.md](./spec.md)  
**Status:** Draft  
**Criada em:** 2026-09-05

---

## 1. Summary

Adicionar coluna `tier` em `public.users` (`admin` | `common_user`), seed do admin fixo, tela `/admin` (lista de usuários + link de convite), e restrição de `/authors` + mutações PATCH/DELETE de autores ao admin. Criação pontual de autor no fluxo de livro permanece para autenticados.

---

## 2. Decisões técnicas

### 2.1 Persistência do tier

**Decisão:** enum Postgres `user_tier` com valores `admin` e `common_user` (snake_case no banco; UI pt-BR: “Admin” / “Common-user”). Coluna `users.tier NOT NULL DEFAULT 'common_user'`.

### 2.2 Como o client sabe o tier

**Decisão:** no layout `(main)`, além do auth user, buscar `tier` em `public.users` e hidratar no Zustand (`userStore.tier`). Hook `useIsAdmin()` deriva `tier === 'admin'`.

### 2.3 Guard de API

**Decisão:** `requireAdmin(supabase)` após `requireUser`: lê `users.tier` do `auth.uid()`; se não for admin → **403**.

### 2.4 Link de convite

**Decisão:** `GET /api/admin/invite-link` (admin only) monta  
`{NEXT_PUBLIC_SITE_URL|/origin}/register?invite={REGISTER_INVITE_SECRET}`.  
Nunca expor o segredo em endpoints públicos.

### 2.5 Lista admin de usuários

**Decisão:** `GET /api/admin/users` retorna `id`, `display_name`, `email`, `tier` (admin only). Não alterar o contrato público de `GET /api/users` (continua `id`, `display_name` para filtros sociais).

### 2.6 Autores

| Superfície | Regra |
|---|---|
| Página `/authors` + nav | só admin |
| PATCH/DELETE `/api/authors/[id]` | `requireAdmin` |
| POST `/api/authors` | `requireUser` (fluxo de livro) |
| Leitura Supabase `authors` | inalterada |

### 2.7 Bloqueio de rota na UI

**Decisão:** página client redireciona para `/` (ou `/auth` se sem sessão) quando `!isAdmin`. APIs retornam 401/403 independentemente.

---

## 3. Technical Context

| Item | Decisão |
| ---- | ------- |
| Linguagem | TypeScript |
| UI | Next.js 15 App Router |
| Auth | Supabase Auth + `public.users.tier` |
| Storage | Supabase Postgres + migration |
| Estado | Zustand (`tier`) + TanStack Query (admin lists) |
| Testes | Vitest |
| Localização | pt-BR |

---

## 4. Project Structure

### Novos

```text
supabase/migrations/YYYYMMDDHHMMSS_users_tier.sql
src/app/api/_utils/requireAdmin.ts
src/app/api/admin/users/route.ts
src/app/api/admin/invite-link/route.ts
src/app/(main)/admin/page.tsx
src/modules/admin/
  index.tsx
  hooks/useAdmin.ts
  services/admin.service.ts
  types/admin.types.ts
  components/...
src/lib/auth/userTier.ts
src/stores/hooks/useIsAdmin.ts
```

### Alterados

```text
src/types/supabase.ts
src/stores/userStore.ts
src/providers/UserProvider.tsx
src/app/(main)/layout.tsx
src/services/users/service/getCurrentUser.service.ts (ou getCurrentUserTier)
src/components/header/hooks/useHeader.ts
src/components/header/components/navMenu/navMenu.tsx
src/app/(main)/authors/page.tsx / modules/authors
src/app/api/authors/[id]/route.ts
src/app/api/auth/register/route.ts (garantir default tier)
```

---

## 5. Migration outline

```sql
CREATE TYPE user_tier AS ENUM ('admin', 'common_user');
ALTER TABLE public.users
  ADD COLUMN tier user_tier NOT NULL DEFAULT 'common_user';
UPDATE public.users
  SET tier = 'admin'
  WHERE id = 'bd12cc9a-51ec-452d-8722-a97547b6e0c0';
```

---

## 6. Test plan (alto nível)

- `requireAdmin`: 401 sem user, 403 common_user, ok admin
- register upsert: tier default common_user
- admin APIs: 403 common_user
- useHeader: itens condicionais
- authors PATCH/DELETE: 403 common_user
