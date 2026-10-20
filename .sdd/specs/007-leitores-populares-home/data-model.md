# Data Model: Leitores populares na Home

**Feature ID:** 007  
**Status:** Draft (acompanha `plan.md`)

---

## 1. Visão geral

**Zero tabelas novas. Zero colunas novas no MVP.** A faixa lê:

- `public.users` (`id`, `display_name`, `avatar_seed`)
- `public.user_followers` (grafo + contagem de seguidores)
- `public.books` (`readers`, `chosen_by`, `gender`, `author_id`, `status`) via RLS
- `public.book_authors` / `public.authors` para autores

Preferência **esconder** = `localStorage` (não persistida no Postgres no MVP).

```
viewer (auth.uid())
  ├── following → exclui candidatos
  ├── livros visíveis → set(gêneros), set(autores)
  └── get_popular_readers_for_home(limit)
        ├── candidatos (users \ {self} \ following)
        ├── follower_count
        ├── shared_gender_count / shared_author_count
        └── score + order + limit
```

---

## 2. Entidades persistidas (existentes)

### 2.1 `users`

| Coluna | Uso |
| ------ | --- |
| `id` | identidade; exclusão do logado |
| `display_name` | nome; desempate |
| `avatar_seed` | avatar |

`email` não é selecionado.

### 2.2 `user_followers`

| Uso | Semântica |
| --- | --------- |
| `follower_id = me` | excluir `following_id` da descoberta |
| `following_id = candidate` | `follower_count` |

### 2.3 `books` + autores

Participação: `reader_id = ANY(readers) OR chosen_by = reader_id`.  
Gênero elegível: não nulo / não vazio após trim.  
Autor: `book_authors.author_id` e, se legado, `books.author_id`.  
Visibilidade: policy atual.

---

## 3. Domínio (app)

```ts
type PopularReader = {
  id: string;
  displayName: string;
  avatarSeed: string | null;
  followerCount: number;
  sharedGenderCount: number;
  sharedAuthorCount: number;
  score: number;
  isFollowing: boolean; // sempre false na lista de descoberta; útil pós-otimismo
};

type PopularReadersQuery = {
  readers: PopularReader[];
};
```

Preferência:

```ts
type PopularReadersPreference = {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
};
```

---

## 4. RPC (resumo)

Entrada: `p_limit int` (default 12, clamp 1..24).  
Saída: linhas `(reader_id, display_name, avatar_seed, follower_count, shared_gender_count, shared_author_count, score)`.

Ver `contracts/rpc-spec.sql`.

---

## 5. Preferência local

| Chave | Valor |
| ----- | ----- |
| `nosso-tbr:home:hide-popular-readers:${userId}` | `"1"` quando escondida; ausente = visível |
