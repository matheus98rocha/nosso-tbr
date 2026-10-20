# Data Model: Perfil enriquecido (008)

**Feature ID:** 008  
**Spec:** [spec.md](./spec.md)  
**Plan:** [plan.md](./plan.md)

---

## 1. Persistência

**Nenhuma alteração de schema no MVP.**

Fontes existentes:

| Conceito | Fonte |
| -------- | ----- |
| Identidade | `public.users` (`id`, `display_name`, `avatar_seed`; e-mail só no Meu perfil via auth/session) |
| Rede | `public.user_followers` (`follower_id`, `following_id`) |
| Atividade / gêneros | RPCs `get_community_reader_activity` / `get_community_reader_genres` (INVOKER → RLS `books`) |
| Favoritos | `public.user_book_favorites` via `BookFavoritesService` |
| Conta (datas) | Auth user `created_at` / `last_sign_in_at` (já no Meu perfil) |

---

## 2. Domínio (app)

```text
ProfileReadingShowcase
  readerId: string
  registeredCount: number
  finishedCount: number
  currentlyReadingTitle: string | null
  mostReadGender: string | null          // value books.gender
  mostRegisteredGender: string | null
  mostReadGenderLabel: string | null     // pt-BR via getGenderLabel
  mostRegisteredGenderLabel: string | null

ProfileNetworkCounts
  userId: string
  followingCount: number
  followerCount: number

ProfileHubLink
  href: string
  label: string   // "Estatísticas" | "Estantes" | "Comunidade"
```

Regras de agregação: idênticas a 005 (`pickTopGenre`, participação `readers ∪ chosen_by`, visibilidade do visitante).

---

## 3. Relação com outras features

| Feature | Relação |
| ------- | ------- |
| 005 Comunidade | Reuso de RPCs e utils; contagens P2 navegam com `?view=` |
| 006 Onboarding | `ProfileWelcomeTutorial` permanece no Meu perfil; sem conflito de dados |
| Stats `/stats` | Apenas atalho; sem ler RPCs DEFINER de stats no perfil de membro |
