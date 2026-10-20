# Implementation Plan: Perfil enriquecido

**Feature ID:** 008  
**Spec:** [spec.md](./spec.md)  
**Data model:** [data-model.md](./data-model.md)  
**Contracts:** [contracts/api-spec.md](./contracts/api-spec.md)  
**Status:** Draft — Plan  
**Criada em:** 2026-10-20

---

## 1. Summary

Enriquecer **Meu perfil** (`ClientProfile`) e **perfil de membro** (`MemberProfileView`) com vitrine de leitura compartilhada — sem REST novo, sem migration no MVP e sem segunda tela de Estatísticas.

**P1:** atividade (cadastrados / lidos / lendo) + gêneros destacados + favoritos no Meu perfil + mesmos blocos no membro + ocultar e-mail no membro + totais de rede no membro.  
**P2:** hub de atalhos (Estatísticas / Estantes / Comunidade) e contagens Seguindo/Seguidores clicáveis no Meu perfil (`/community?view=…`).

Clarificações da spec **travadas neste Plan** (Opção A):

| Item | Decisão |
| ---- | ------- |
| E-mail no membro | **Ocultar** (paridade com Comunidade 005) |
| Favoritos no Meu perfil | Cards **com** interações do dono (sem `hideInteractions`) |
| Recap no hub | **Fora** |
| Preview de estantes | **Só atalho** (`SHELVES_LIST_PATH`) |

---

## 2. Decisões técnicas

### 2.1 Sem migration / sem RPC nova no MVP

**Decisão:** reusar `get_community_reader_genres` e `get_community_reader_activity` (SECURITY INVOKER, RLS) e **filtrar no client** pelo `readerId` do perfil.

**Por quê:** mesma semântica de privacidade da Comunidade (RN-PRF-02/03 ≡ RN-COM-07/08/10/13); onboarding 006 já chama o par completo; comunidade pequena.  
**Não** usar `get_reading_stats_by_reader` (DEFINER) no perfil de membro — vazaria solo.

**Evolução futura (fora do escopo):** RPCs parametrizadas `p_reader_id` se o snapshot global pesar.

### 2.2 Serviço de vitrine + contagens de rede

**Decisão:** `ProfileReadingService` em `src/modules/profile/services/`:

```text
getReadingShowcase(readerId) →
  { registeredCount, finishedCount, currentlyReadingTitle,
    mostReadGender, mostRegisteredGender }
```

1. Em paralelo: `rpc(genres)`, `rpc(activity)`.
2. Filtrar linhas do `readerId`.
3. Atividade ausente → `0 / 0 / null`.
4. Gêneros → `pickTopGenre` (já em `community/utils`) + rótulos via `getGenderLabel`.

**Rede do membro (e reuso no Meu perfil se útil):**

```text
UserSocialService.getNetworkCounts(userId) →
  { followingCount, followerCount }
```

Queries em `user_followers`:

- seguindo: `follower_id = userId` → count / ids length  
- seguidores: `following_id = userId` → count / ids length  

Hoje `getFollowingIds` / `getFollowerIds` são **só do auth.uid()**; não estender a semântica — método novo explícito.

### 2.3 Hooks (hook-first)

| Hook | Responsabilidade |
| ---- | ---------------- |
| `useProfileReadingShowcase(readerId)` | Query showcase; estados loading/error/empty |
| `useProfileNetworkCounts(userId)` | Query totais de rede |
| `useMemberProfileFavorites` | Já existe — reusar no Meu perfil com `selfId` |
| `useClientProfile` | Estender view model: paths do hub + hrefs das contagens (P2); **não** misturar showcase no mesmo memo se queries forem independentes |

Query keys:

```text
QUERY_KEYS.profile.all
QUERY_KEYS.profile.readingShowcase(readerId)
QUERY_KEYS.profile.networkCounts(userId)
```

Favoritos mantêm a key atual `["userSocial", "profileFavoriteBooks", id]` (ou migrar para `QUERY_KEYS.profile.favorites` na mesma entrega se tocar nos testes — preferir **não** renomear no MVP para diff menor).

`staleTime`: 2 min (igual social/community).

Invalidação: ao seguir/deixar de seguir, além de community, invalidar `QUERY_KEYS.profile.readingShowcase(targetId)` e `networkCounts` do alvo e do self (gênero/atividade do visitante mudam com follow por causa de livros privados). Estender `useOptimisticFollowToggle` `onSettled`.

### 2.4 Componentes compartilhados (só UI)

Extrair do `memberProfile` / criar sob `src/modules/profile/components/`:

| Componente | Uso |
| ---------- | --- |
| `ProfileReadingActivity` | Contagens + “Lendo …” (`formatCommunityMemberActivity`) |
| `ProfileGenreHighlights` | Mais lido / mais cadastrado ou copy de ausência |
| `ProfileFavoritesSection` | Heading + `ListGrid` + CTA “Ver todos os livros” |
| `ProfileHubLinks` | P2 — só Meu perfil |
| `ProfileNetworkCountLinks` | P2 — contagens como `Link` no Meu perfil |

Tipos em arquivos `*.types.ts` fora do componente; barrels `index.ts`; `export default`; pt-BR; `useCallback`/`useMemo` nos hooks.

### 2.5 Meu perfil — composição

Ordem das seções:

1. Header (copy atualizada: perfil = conta **e** leitura).
2. Card de identidade (avatar, nome, e-mail **próprio**, badge) + rede (P1 totais; P2 links).
3. Datas de conta (mantém).
4. **Atividade + gêneros** (novos).
5. `AvatarSelectionPanel` (mantém).
6. `ProfileWelcomeTutorial` (006 — não remover).
7. **Favoritos** (novo; `BookCard` **sem** `hideInteractions`).
8. Hub P2 (substitui o bloco único “Ver comunidade” ou o absorve como um dos atalhos).

CTA biblioteca: `/?reader=${encodeURIComponent(selfId)}` (mesmo padrão do membro).

### 2.6 Perfil de membro — composição

1. Remover exibição de **e-mail** (ícone Mail + texto).
2. Card: nome, avatar, seguir, **totais seguindo/seguidores** (não clicáveis para listas — só informativos; listas ficam na Comunidade).
3. Atividade + gêneros (visibilidade do visitante via RPC INVOKER).
4. Favoritos existentes com `hideInteractions` (visitante).
5. CTA “Ver todos os livros”.

Degradação (RN-PRF-08): falha em showcase/gêneros não derruba card + seguir + favoritos.

### 2.7 Rotas e hub (P2)

| Atalho | Path |
| ------ | ---- |
| Estatísticas | `/stats` (constante `STATS_PATH` em `src/lib/routes/stats.ts` se ainda não existir) |
| Estantes | `SHELVES_LIST_PATH` (`/shelves`) |
| Comunidade | `COMMUNITY_PATH` |
| Seguindo | `${COMMUNITY_PATH}?view=seguindo` |
| Seguidores | `${COMMUNITY_PATH}?view=seguidores` |

Helper opcional: `getCommunityViewPath(view)` em `src/lib/routes/community.ts`.

### 2.8 UI / identidade visual

Preservar padrões atuais do módulo profile (filete/gradiente do card, `.page-title`, bordas violetas já usadas). Novas seções: headings `h2`, estados skeleton alinhados ao membro, copy pt-BR. Não inventar dashboard de KPIs — tipografia e densidade leves (RN-PRF-09).

### 2.9 Testes

- Unit: `ProfileReadingService` (filtro por readerId, ausência → zeros, pickTopGenre).
- Unit: `getNetworkCounts`.
- Hooks: showcase / network (React Query mocks).
- Componentes: activity labels, ausência de gênero, Meu perfil renderiza favoritos, membro **não** mostra e-mail, hub links (P2), contagens → hrefs corretos.
- Atualizar `clientProfile.test.tsx` / `memberProfile` tests existentes.

---

## 3. Technical Context

| Item | Decisão |
| ---- | ------- |
| Linguagem | TypeScript |
| UI | Next.js App Router; módulos client existentes |
| Auth | Rotas já guardadas; sem mudança |
| Dados | RPCs community INVOKER + `user_followers` + `user_book_favorites` |
| Estado | TanStack Query |
| Seguir | `useOptimisticFollowToggle` + invalidate profile keys |
| Testes | Vitest + Testing Library, colocation |
| Localização | pt-BR |
| Schema | **Nenhuma** migration MVP |

---

## 4. Project Structure

### 4.1 Novos

```text
.sdd/specs/008-perfil-enriquecido/
  plan.md
  data-model.md
  contracts/api-spec.md
  tasks.md                    # fase seguinte

src/lib/routes/stats.ts       # se necessário
src/lib/routes/stats.test.ts

src/modules/profile/services/
  profileReading.service.ts
  profileReading.service.test.ts
  index.ts

src/modules/profile/hooks/useProfileReadingShowcase.ts
src/modules/profile/hooks/useProfileReadingShowcase.test.ts
src/modules/profile/hooks/useProfileNetworkCounts.ts
src/modules/profile/hooks/useProfileNetworkCounts.test.ts

src/modules/profile/components/ProfileReadingActivity/
src/modules/profile/components/ProfileGenreHighlights/
src/modules/profile/components/ProfileFavoritesSection/
src/modules/profile/components/ProfileHubLinks/
src/modules/profile/components/ProfileNetworkCountLinks/
```

### 4.2 Alterados

```text
src/constants/keys.ts
src/services/userSocial/userSocial.service.ts          + getNetworkCounts
src/services/userSocial/userSocial.service.test.ts
src/lib/routes/community.ts                            + getCommunityViewPath
src/modules/profile/hooks/useOptimisticFollowToggle.ts + invalidate profile
src/modules/profile/clientProfile/clientProfile.tsx
src/modules/profile/clientProfile/hooks/useClientProfile.ts
src/modules/profile/clientProfile/types/clientProfile.types.ts
src/modules/profile/clientProfile/clientProfile.test.tsx
src/modules/profile/memberProfile/memberProfileView.tsx
src/modules/profile/memberProfile/hooks/useMemberProfile.ts  # counts opcional
src/modules/profile/components/index.ts
README.md                                              # mapa (ao fechar feature)
```

---

## 5. Fases de implementação

### Fase 0 — Fundação

- `QUERY_KEYS.profile.*`
- `getNetworkCounts` + testes
- `ProfileReadingService` + testes (filtro RPC + pickTopGenre)
- Helpers de rota (`getCommunityViewPath`, `STATS_PATH`)

### Fase 1 — P1 Meu perfil (US1–US3)

- Hooks showcase
- Componentes Activity / Genres / FavoritesSection
- Wire em `ClientProfile`
- Testes de render + empty/loading/error

### Fase 2 — P1 Perfil de membro (US4)

- Showcase + network counts no membro
- Remover e-mail
- Degradação parcial
- Teste privacidade (mock RPC sem livro solo)

### Fase 3 — P2 Hub e contagens (US5–US6)

- `ProfileHubLinks`
- Contagens clicáveis no Meu perfil
- Testes de href

### Fase 4 — Polish

- Invalidação no follow toggle
- Copy/a11y (SC-007)
- Checklist requirements / README / promover RN-PRF-*

---

## 6. Complexity Tracking

| Aspecto | Notas |
| ------- | ----- |
| Schema | Zero no MVP |
| Risco privacidade | Mitigado por INVOKER + testes de filtro |
| Acoplamento community | Reuso consciente de RPCs + `pickTopGenre` + `formatCommunityMemberActivity`; não importar `CommunityService.getSnapshot` inteiro no perfil |
| Escopo UI | Extrair seções compartilhadas evita divergência Meu ↔ Membro |

---

## 7. Risks & Mitigations

| Risco | Mitigação |
| ----- | --------- |
| RPC global cara no perfil | Aceito no MVP; documentar RPC filtrada como follow-up |
| Vazamento de e-mail | UI sem e-mail; não expor em novos tipos de view model do membro |
| Duplicar stats | Só resumo + link `/stats` |
| Regressão 006 tutorial | Manter `ProfileWelcomeTutorial` no Meu perfil |

---

## 8. Out of scope (reafirma)

Bio, edit display_name, feed, carrossel de estantes, Recap no hub, diretório de membros, Expo, dependência de 007.
