# Contract — Perfil enriquecido (feature 008)

**Feature ID:** 008  
**Auth:** `authenticated` only  
**HTTP:** nenhum endpoint novo

---

## 1. RPCs reutilizadas (005)

Chamadas client Supabase (sem parâmetros):

- `supabase.rpc("get_community_reader_genres")`
- `supabase.rpc("get_community_reader_activity")`

Semântica completa: [005 contracts/api-spec.md](../../005-tela-comunidade/contracts/api-spec.md).

**Uso no perfil:** o serviço filtra `reader_id === profileUserId`. Linha ausente ⇒ atividade `0/0/null` e gêneros `null` (copy de ausência na UI).

---

## 2. `UserSocialService.getNetworkCounts(userId)`

**Entrada:** `userId: string` (UUID do leitor do perfil).  
**Saída:** `{ followingCount: number; followerCount: number }`.

| Contagem | Query |
| -------- | ----- |
| `followingCount` | `user_followers` where `follower_id = userId` |
| `followerCount` | `user_followers` where `following_id = userId` |

Erros de PostgREST → `RepositoryError` (padrão do serviço). Sem sessão → `0/0` ou throw alinhado aos outros métodos (preferir throw se chamada só com `enabled` autenticado).

**Não** substitui `getFollowingIds` / `getFollowerIds` (sempre do `auth.uid()`).

---

## 3. Favoritos

Sem contrato novo: `BookFavoritesService.getFavoriteBooksForUser(profileUserId)` (já usado no membro).

---

## 4. Navegação (P2)

| Destino | URL |
| ------- | --- |
| Comunidade (default) | `/community` |
| Seguindo | `/community?view=seguindo` |
| Seguidores | `/community?view=seguidores` |
| Estatísticas | `/stats` |
| Estantes | `/shelves` |
| Biblioteca do leitor | `/?reader=<userId>` |

---

## 5. Fora deste contrato

- REST `/api/profile`
- RPCs DEFINER de estatísticas anuais
- Colunas novas em `users` / bio
