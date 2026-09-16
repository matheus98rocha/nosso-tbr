# Implementation Plan: Tela de Comunidade

**Feature ID:** 005  
**Spec:** [spec.md](./spec.md)  
**Status:** Implemented  
**Criada em:** 2026-09-16

---

## 1. Summary

Nova rota autenticada `/community` (rótulo **Comunidade**) com módulo `src/modules/community`. Reusa o grafo `user_followers` e os avatares já persistidos. Agrega gêneros no **Postgres** via RPC **SECURITY INVOKER** (RLS de livros aplica; stats atuais **não** servem — são DEFINER e vazam privado). Recortes Todos / Seguidores / Seguindo e busca P2 filtram **no client** o mesmo snapshot. Seguir continua no `UserSocialService` + `useOptimisticFollowToggle`, invalidando também o snapshot da Comunidade (gêneros de livros privados mudam ao seguir).

P1: tela + contagens + três recortes + avatar/nome + seguir + gêneros + modal.  
P2: busca por nome; diretório sai do perfil.  
P3: atalho do modal para `/profile/[userId]`.

---

## 2. Decisões técnicas

### 2.1 Rota e guarda

**Decisão:** `src/app/(main)/community/page.tsx` — mesmo padrão de `/profile` e `/stats`: `getCurrentUser()` no servidor; sem sessão → `redirect("/auth")`. Item de menu **Comunidade** com `requiresAuth: true`, entre Estatísticas e Estantes. Path constante `COMMUNITY_PATH = "/community"` em `src/lib/routes/community.ts`.

Visitante não vê o item e não vê payload (SC-007).

### 2.2 Sem REST novo

**Decisão:** não criar `GET /api/community`. O diretório do perfil já lê `users` e `user_followers` no cliente Supabase. A Comunidade faz o mesmo, mais **uma RPC**. Mutação de seguir permanece no client (já existente); RN48 cobre mutações destrutivas de livros, não este grafo.

Contrato da feature = RPC + tipos de domínio (ver `contracts/`).

### 2.3 RPC de gêneros: INVOKER, não reusar stats

**Decisão:** `public.get_community_reader_genres()` `SECURITY INVOKER`, `GRANT EXECUTE` só `authenticated`, `REVOKE` de `anon` e `PUBLIC`.

`get_reading_stats_by_reader` é **DEFINER** de propósito para o **próprio** leitor ver stats incluindo privados. Usá-la (ou DEFINER) na Comunidade **vaza** livro solo de quem o visitante não segue — viola RN-COM-10 / SC-005.

A RPC lê `books` sob a policy `books_select_non_solo_or_owner` (`is_book_visible_to_current_user`). Participação: `reader_id = ANY(readers) OR chosen_by = reader_id`. Gênero vazio/nulo omitido.

Retorno **por par (reader, gender)** com `finished_count` e `registered_count`. O vencedor (empate pelo **rótulo** pt-BR) é escolhido no app (`pickTopGenre` + `getGenderLabel` + `localeCompare("pt-BR")`), porque os rótulos vivem em `src/constants/genders.ts`, não no banco.

### 2.4 Snapshot único + recortes no client

**Decisão:** `CommunityService.getSnapshot()` em paralelo:

1. membros (`id, display_name, avatar_seed`, sem e-mail, `order display_name`, excluir `auth.uid()` no mapper);
2. `getFollowingIds()` já existente;
3. `getFollowerIds()` novo (`following_id = me`);
4. RPC de gêneros;
5. RPC de atividade (cadastrados, lidos, título em leitura).

Hook `useCommunity` monta linhas, aplica recorte (`todos` | `seguidores` | `seguindo`) e, no P2, filtro de nome. Contagens **sempre** vêm dos IDs de relação, **não** da lista filtrada (RN-COM-04).

Recorte na URL: `?view=todos|seguidores|seguindo` (`router.replace`, como a home). Toque nas contagens troca `view`. Default `todos`. Modal **não** vai na URL (FR-016 = estado de tela).

### 2.5 Seguir e cache

**Decisão:** reusar `useOptimisticFollowToggle`. Estender `onSettled` para invalidar também `QUERY_KEYS.community.all` (gêneros dependem de seguir por causa de livros privados). Toast de erro pt-BR no hook da Comunidade (`onError` da mutation ou wrapper): *Não foi possível atualizar o seguir. Tente de novo.* Rollback já existe no toggle.

Após P1, perfil e Comunidade compartilham o mesmo toggle. Não extrair pacote `social/` nesta entrega (escopo).

### 2.6 UI e identidade

**Decisão:** módulo novo; **não** reusar `CommunityMemberFollowRow` (mostra e-mail e navega ao perfil). Nova linha: avatar (`ProfileAvatar`), nome, atividade (cadastrados / lidos / lendo), botão Seguir/Seguindo (alvo ≥ 44px). Gênero mais lido **não** vai na lista; só no modal. Modal: `Dialog` shadcn, gêneros + copy de ausência. Identidade Literal (título `.page-title`, filete, CTA preto). Textos pt-BR.

Nome vazio legado: rótulo **Leitor**, nunca UUID.

### 2.7 P2 perfil e busca

**Decisão:** busca = filtro **local** sobre o snapshot (comunidade pequena; sem nova query). Diretório completo some de `ClientProfile`; CTA “Ver comunidade” → `/community`. Perfil pode mostrar as duas contagens (barato com as mesmas query keys `userSocial`).

### 2.8 P3

**Decisão:** botão “Ver perfil” no modal → `router.push(/profile/${id})`. Sem mudar o perfil do membro.

### 2.9 Prefetch

**Decisão:** `useDesktopNav` prefetch do snapshot ao hover **Comunidade** (`QUERY_KEYS.community.snapshot(userId)`), `staleTime` 2 min (igual diretório atual).

---

## 3. Technical Context

| Item | Decisão |
| ---- | ------- |
| Linguagem | TypeScript |
| UI | Next.js 15 App Router, React 19, client no módulo |
| Auth | Supabase session; redirect servidor + `requiresAuth` no header |
| Dados | `public.users`, `public.user_followers`, `public.books` via RLS |
| Agregação | RPC `get_community_reader_genres` INVOKER |
| Estado | TanStack Query + `?view=` |
| Seguir | `UserSocialService` + optimistic toggle |
| Testes | Vitest + Testing Library, colocation |
| Localização | pt-BR |

---

## 4. Project Structure

### 4.1 Novos

```text
supabase/migrations/YYYYMMDDHHMMSS_community_reader_genres.sql

src/lib/routes/community.ts

src/app/(main)/community/page.tsx

src/modules/community/
  index.ts
  communityScreen.tsx
  communityScreen.test.tsx
  types/community.types.ts
  types/index.ts
  services/community.service.ts
  services/community.service.test.ts
  services/index.ts
  utils/pickTopGenre.ts
  utils/pickTopGenre.test.ts
  utils/filterCommunityMembers.ts
  utils/filterCommunityMembers.test.ts
  hooks/useCommunity.ts
  hooks/useCommunity.spec.ts
  hooks/index.ts
  components/communityMemberRow/
    communityMemberRow.tsx
    communityMemberRow.test.tsx
    types/communityMemberRow.types.ts
    index.ts
  components/communityReaderModal/
    communityReaderModal.tsx
    communityReaderModal.test.tsx
    types/communityReaderModal.types.ts
    index.ts
  components/communityCounts/
    communityCounts.tsx
    communityCounts.test.tsx
    types/communityCounts.types.ts
    index.ts
```

### 4.2 Alterados

```text
src/constants/keys.ts              + QUERY_KEYS.community
src/types/supabase.ts              yarn update-types após a RPC
src/services/userSocial/userSocial.service.ts  + getFollowerIds
src/services/userSocial/userSocial.service.test.ts
src/modules/profile/hooks/useOptimisticFollowToggle.ts  + invalidate community
src/modules/profile/hooks/useOptimisticFollowToggle.test.ts
src/components/header/hooks/useHeader.ts
src/components/header/hooks/useHeader.test.ts
src/components/header/hooks/useDesktopNav.ts
src/components/header/hooks/useDesktopNav.test.ts
src/modules/profile/clientProfile/*   (P2: tira diretório, CTA)
README.md                          mapa de funcionalidades
```

`CommunityMemberFollowRow` permanece no perfil do **membro** até alguém unificar UI; a Comunidade não o usa.

---

## 5. Fases de implementação

### Fase 0 — Fundação

- Migration RPC + grants.
- Tipos de domínio + `pickTopGenre`.
- `QUERY_KEYS.community`.
- `getFollowerIds`.
- `CommunityService.getSnapshot`.

### Fase 1 — US1–US3 (MVP visual + rede)

- Página + guarda.
- Nav Comunidade.
- Hook `useCommunity` (recorte, contagens, exclude self, empty/loading/error).
- Lista + seguir + contagens clicáveis.
- Testes de recorte e contagem.

### Fase 2 — US4 (gêneros + modal)

- Mapear RPC → `mostReadGender` / `mostRegisteredGender`.
- Chip na lista; modal; ausência.
- Teste: livro privado invisível não altera o top (mock de retorno da RPC / casos da função pura).

### Fase 3 — US5–US6 (P2)

- Filtro por nome.
- Perfil: remove diretório; atalho; testes do profile atualizados.

### Fase 4 — US7 (P3) + polish

- Ver perfil no modal.
- Prefetch nav.
- README + vault (promover RN-COM).

---

## 6. Integração (brownfield)

| Ponto | Como |
| ----- | ---- |
| `user_followers` | Sem schema novo. Follow unidirecional. RLS: SELECT se sou follower ou following. |
| `users.avatar_seed` | Só leitura; fallback `ProfileAvatar`. |
| `GET /api/users` | **Intocado** (rede para chips da home, não diretório). |
| Aba Seguindo da home | **Intocada** (livros, não pessoas). |
| Stats | **Intocada**. |
| Perfil membro | Só link P3. |
| Invalidação follow | Já invalida `userSocial/following` e `users`; somar `community`. |

---

## 7. Test plan (alto nível)

- `pickTopGenre`: vazio, um gênero, empate por rótulo pt-BR, ignora string vazia.
- `filterCommunityMembers`: recortes + busca; nunca inclui `selfId`; contagens independentes da busca.
- `CommunityService`: não seleciona `email`; exclui self; monta snapshot.
- `getFollowerIds`: `eq("following_id", me)`.
- `useCommunity`: view na URL; toque na contagem; toggle chama follow; erro mostra toast e estado anterior (via toggle).
- `useHeader`: Comunidade visível logado, oculta deslogado; common-user vê o item.
- Página: smoke + redirect coberto pelo padrão de profile (teste de página se o repo já testar `profile/page`).
- `useOptimisticFollowToggle`: `onSettled` inclui `community`.
- P2: `useClientProfile` / `clientProfile.test` sem lista de membros.

Não há teste E2E obrigatório nesta entrega; SC-001 é critério de UX (skeleton, não branco).

---

## 8. Riscos e mitigação

| Risco | Mitigação |
| ----- | --------- |
| RPC DEFINER por engano | Code review da migration; testes de contrato SQL INVOKER; grant só authenticated |
| Snapshot pesado | Comunidade atual é pequena; RPC agrega no banco; se crescer, paginar Depois |
| Gênero na lista stale após follow | Invalidar `community` no settle do toggle |
| Duas UIs de diretório | P2 remove a do perfil na mesma entrega se o tempo permitir; senão P2 imediato após P1 na mesma branch |

---

## 9. Notas de governança SDD

- Fase atual: **Complete** (T001–T028).
- Entrega: Hook-First, tipos fora do componente, colocation de testes, pt-BR.
