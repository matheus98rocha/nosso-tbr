# Implementation Plan: Leitores populares na Home

**Feature ID:** 007  
**Spec:** [spec.md](./spec.md)  
**Status:** Draft  
**Criada em:** 2026-10-20

---

## 1. Summary

Faixa horizontal na Home (`src/modules/home`) alimentada por uma RPC **SECURITY INVOKER** que devolve candidatos ranqueados (seguidores + overlap de gênero + overlap de autor). Seguir reusa `UserSocialService` + `useOptimisticFollowToggle`. Esconder persiste em `localStorage` chaveado por `userId`. Sem REST novo. Sem tabelas novas no MVP.

P1: faixa + lista + seguir + esconder + ranking.  
P2: reexibir + CTA Comunidade + omitir se vazio.  
P3 (fora): preferência no banco / títulos em comum.

---

## 2. Decisões técnicas

### 2.1 Posição na Home

**Decisão:** renderizar `PopularReadersStrip` **depois** de `CollapsibleBookFilters` e **antes** de `ReadingNow`, só se `isLoggedIn` e preferência não escondida.

Rationale: filtros já estabelecem contexto; a faixa social não compete com o título de contagem; ainda aparece acima da grade de livros.

### 2.2 Sem REST; RPC INVOKER

**Decisão:** `public.get_popular_readers_for_home(p_limit int DEFAULT 12)` `SECURITY INVOKER`, `GRANT` só `authenticated`.

Não reutilizar snapshot completo da Comunidade (pesado e ordenado por nome). A RPC agrega:

- candidatos = `users` exceto `auth.uid()` e exceto `following_id` já em `user_followers` onde `follower_id = auth.uid()`;
- `follower_count` = count em `user_followers` onde `following_id = candidate`;
- gêneros/autores do **viewer** e de cada candidato a partir de `books` visíveis (mesma participação `readers ∪ chosen_by` da 005);
- autores via `book_authors` (+ fallback `books.author_id` se ainda houver legado);
- score no SQL ou scores parciais no SQL + ordenação no app — **preferir score no SQL** para limite estável.

Contrato em `contracts/rpc-spec.sql`.

### 2.3 Fórmula de score

**Decisão (MVP):**

```
score = (follower_count * 1.0)
      + (shared_gender_count * 3.0)
      + (shared_author_count * 4.0)
```

- `shared_*_count` = tamanho da interseção dos conjuntos distintos (gênero trimado não vazio; `author_id` não nulo).
- Empate: `display_name` `localeCompare('pt-BR')`, depois `id`.
- Pesos enviesam afinidade sobre fama pura; seguidores ainda diferenciam quem não tem overlap.

Ajustáveis sem migration se a ordenação final for no app a partir de colunas brutas — **MVP ordena no SQL** com pesos fixos documentados; mudança de peso = migration ou constante na RPC.

### 2.4 Esconder: localStorage

**Decisão:** chave `nosso-tbr:home:hide-popular-readers:${userId}` = `"1"`. Hook `usePopularReadersPreference` lê/escreve; não synca entre dispositivos (assumido na spec).

Reexibir (P2): mesmo hook com clear; controle mínimo — botão “Mostrar leitores populares” no empty da visão Seguindo ou link discreto no rodapé da seção de filtros (detalhe de UI na implementação; não bloquear P1).

### 2.5 Seguir e cache

**Decisão:** reusar `useOptimisticFollowToggle`. Invalidar:

- `QUERY_KEYS.popularReaders.list(userId)` (novo);
- já existentes `userSocial` + `community`.

Após seguir com sucesso, remover o id da lista otimista na UI da faixa.

### 2.6 UI

**Decisão:**

- Componente visual `PopularReadersStrip` + item `PopularReaderCard` (não card de marketing: container de interação horizontal).
- Hook `usePopularReaders` (lógica, React Query, preferência, follow).
- Scroll horizontal nativo (`overflow-x-auto`), snap opcional; sem carousel lib.
- Botão Esconder (ícone X ou “Esconder”) no header da faixa, `aria-label` pt-BR.
- Identidade: tipografia/cores da Home existente; copy **Leitores populares**.
- Limite UI = limite RPC (12).

### 2.7 Privacidade

**Decisão:** igual 005 — nunca DEFINER em books. Contagem de seguidores é do grafo `user_followers` (já legível na Comunidade). Autores/gêneros só de livros que passam em `is_book_visible_to_current_user`.

### 2.8 Relação com 006 / issue 175

**Decisão:** implementação da faixa de recomendações da Home fica **nesta** feature. A #175 continua dona de tutorial e aviso zero-seguindo; ao implementar 006, consumir este módulo em vez de segunda lista.

---

## 3. Technical Context

| Item | Decisão |
| ---- | ------- |
| Linguagem | TypeScript |
| UI | Next.js 15, React 19, módulo home |
| Auth | sessão Supabase; faixa só autenticado |
| Dados | `users`, `user_followers`, `books`, `book_authors`, `authors` |
| Agregação | RPC `get_popular_readers_for_home` INVOKER |
| Estado | TanStack Query + localStorage |
| Seguir | `UserSocialService` + optimistic toggle |
| Testes | Vitest + Testing Library, colocation |
| Localização | pt-BR |

---

## 4. Project Structure (delta)

```text
src/modules/home/
  components/popularReadersStrip/
    popularReadersStrip.tsx
    popularReaderCard.tsx
    index.ts
  hooks/
    usePopularReaders.ts
    usePopularReadersPreference.ts
  services/   # opcional thin wrapper da RPC
  types/popularReaders.types.ts

supabase/migrations/
  YYYYMMDDHHMMSS_get_popular_readers_for_home.sql

.sdd/specs/007-leitores-populares-home/
  ...
```

---

## 5. Risks

| Risco | Mitigação |
| ----- | --------- |
| RPC lenta com muitos users/books | Limite 12; índices em `user_followers(following_id)`; medir; materializar depois se preciso |
| Overlap fraco sem livros do viewer | Score ainda usa seguidores; lista não fica vazia por falta de gosto |
| localStorage limpo | Usuário vê a faixa de novo — aceitável MVP |
| Conflito com 006 | Comentário na #175; um único componente de faixa |

---

## 6. Milestones

1. Migration RPC + types  
2. Hook + preferência + testes de score/ordenação (fixture)  
3. UI faixa + integração Home + follow  
4. P2 reexibir + CTA comunidade  
5. Checklist / analyze coverage  
