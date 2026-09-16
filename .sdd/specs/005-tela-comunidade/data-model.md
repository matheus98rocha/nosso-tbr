# Data Model: Tela de Comunidade

**Feature ID:** 005  
**Status:** Draft (acompanha `plan.md`)

---

## 1. Visão geral

**Zero tabelas novas. Zero colunas novas.** A tela lê:

- `public.users` (`id`, `display_name`, `avatar_seed`)
- `public.user_followers` (`follower_id`, `following_id`)
- `public.books` (`readers`, `chosen_by`, `status`, `gender`) só via RLS + RPC INVOKER

Gêneros são **derivados**, não persistidos.

```
users ── user_followers (follower_id → following_id)
  │
  └── participação em books (readers[] ∪ chosen_by)
        └── get_community_reader_genres()  [SECURITY INVOKER]
              └── pickTopGenre() no app
```

---

## 2. Entidades persistidas (existentes)

### 2.1 `users` (campos usados)

| Coluna | Uso na Comunidade |
| ------ | ----------------- |
| `id` | identidade do item; exclusão do logado |
| `display_name` | nome; ordenação; busca P2 |
| `avatar_seed` | avatar DiceBear; null → fallback do `ProfileAvatar` |

`email` **não** é selecionado nem mapeado (FR-019).

### 2.2 `user_followers`

| Relação | Semântica |
| ------- | --------- |
| `follower_id = me` | eu sigo `following_id` → recorte **Seguindo** + contagem seguindo |
| `following_id = me` | `follower_id` me segue → recorte **Seguidores** + contagem seguidores |
| PK `(follower_id, following_id)` | unicidade |
| `CHECK follower_id <> following_id` | RN-COM-02 |

### 2.3 `books` (só agregação)

Participação do leitor R: `R = ANY(readers) OR chosen_by = R`.  
Elegível a gênero: `gender` não nulo e não vazio após trim.  
Mais lido: `status = 'finished'`.  
Mais cadastrado: qualquer `status`.  
Visibilidade: policy atual (`is_book_visible_to_current_user`).

---

## 3. Domínio (app)

```ts
type CommunityView = "todos" | "seguidores" | "seguindo";

type CommunityMember = {
  id: string;
  displayName: string;
  avatarSeed: string | null;
  isFollowing: boolean;
  isFollower: boolean;
  mostReadGender: string | null;
  mostRegisteredGender: string | null;
  registeredCount: number;
  finishedCount: number;
  currentlyReadingTitle: string | null;
};

type CommunitySnapshot = {
  members: CommunityMember[];
  followingIds: string[];
  followerIds: string[];
};

type CommunityGenreRow = {
  readerId: string;
  gender: string;
  finishedCount: number;
  registeredCount: number;
};
```

`mostReadGender` / `mostRegisteredGender` guardam o **value** de `books.gender` (ex.: `fantasy`). A UI aplica `getGenderLabel` **no modal**. `null` = copy de ausência no modal. A lista não exibe gênero.

`registeredCount` / `finishedCount` / `currentlyReadingTitle` vêm de `get_community_reader_activity()`. Leitor ausente da RPC → `0`, `0`, `null`.

`followingCount = followingIds.length`  
`followerCount = followerIds.length`  
independente de `view` e da busca.

---

## 4. Wire da RPC

Ver `contracts/rpc-spec.sql`.

| Coluna | Tipo | JSON / TS |
| ------ | ---- | --------- |
| `reader_id` | uuid | `readerId` |
| `gender` | text | `gender` |
| `finished_count` | bigint | `finishedCount` |
| `registered_count` | bigint | `registeredCount` |

Sem linha para (leitor, gênero) com ambos os counts 0. Leitor sem gêneros visíveis simplesmente não aparece no resultado da RPC.

### 4.2 `get_community_reader_activity`

| Coluna | Tipo | JSON / TS |
| ------ | ---- | --------- |
| `reader_id` | uuid | `readerId` |
| `registered_count` | bigint | `registeredCount` |
| `finished_count` | bigint | `finishedCount` |
| `currently_reading_title` | text | `currentlyReadingTitle` |

Uma linha por leitor com pelo menos um livro visível. `currently_reading_title` é o título do `reading` com `start_date` mais recente (NULLS LAST, depois título e id). Sem `reading` visível: `null`.

---

## 5. Invariantes

- **I-01:** `members` nunca contém `auth.uid()`.
- **I-02:** `isFollowing` ⇔ `id ∈ followingIds`.
- **I-03:** `isFollower` ⇔ `id ∈ followerIds`.
- **I-04:** recorte `seguidores` ⊆ `isFollower`; `seguindo` ⊆ `isFollowing`; `todos` = todos os `members`.
- **I-05:** `pickTopGenre` empata pelo rótulo pt-BR, não pelo value cru.
- **I-06:** gênero só existe se a RPC (logo o RLS) devolveu count > 0 para aquele visitante.
- **I-07:** e-mail não transita no snapshot da Comunidade.

---

## 6. Ciclo de vida

| Evento | Efeito |
| ------ | ------ |
| Novo cadastro | entra em Todos na próxima carga |
| Seguir | `followingIds` +1; item em Seguindo; RPC refetch (privados do seguido podem passar a contar) |
| Deixar de seguir | inverso; gênero pode **sumir** se só existia via livro privado |
| Outra pessoa me segue | `followerIds` +1 na próxima carga (sem realtime nesta entrega) |
| Livro finalizado / gênero alterado | RPC refetch quando o snapshot ficar stale (2 min) ou após invalidação |
