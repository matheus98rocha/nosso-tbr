# Data Model: Tier de Usuário

**Feature ID:** 004

---

## 1. Enum `user_tier`

| Valor (DB) | Valor de produto | Descrição |
|---|---|---|
| `admin` | admin | Acesso a administração e tela de autores |
| `common_user` | common-user | Leitor participante padrão |

---

## 2. Tabela `public.users` (delta)

| Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|
| `tier` | `user_tier` | NO | `common_user` | Tier do perfil |

### Seed

| id | tier |
|---|---|
| `bd12cc9a-51ec-452d-8722-a97547b6e0c0` | `admin` |

---

## 3. Domínio (app)

```ts
type UserTier = "admin" | "common_user";

type AdminUserListItem = {
  id: string;
  display_name: string;
  email: string | null;
  tier: UserTier;
};

type InviteLinkPayload = {
  inviteUrl: string;
  configured: boolean;
};
```

---

## 4. Relacionamentos

Sem tabelas novas. `tier` é atributo do perfil já espelhado de `auth.users`.
