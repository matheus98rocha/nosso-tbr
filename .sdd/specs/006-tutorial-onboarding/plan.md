# Implementation Plan: Tutorial de boas-vindas e recomendações

**Feature ID:** 006  
**Spec:** [spec.md](./spec.md)  
**Data model:** [data-model.md](./data-model.md)  
**Status:** Draft  
**Criada em:** 2026-10-20

---

## 1. Summary

Módulo `src/modules/onboarding` na Home autenticada:

1. **Tutorial** modal multi-passo (seguir → livros → IA), automático **só no primeiro login** (`users.welcome_tutorial_seen_at IS NULL`). Marca `seen_at` ao abrir.
2. **Aviso zero-seguindo** + até **5** cards de leitores ranqueados por overlap de gênero (reuso das RPCs da Comunidade + ranking no client).
3. Corrigir empty state da Home que ainda aponta seguir para `/profile` → `/community`.

Sem REST novo. Sem biblioteca de coachmark. P3 (reabrir tutorial) no final.

---

## 2. Decisões técnicas

### 2.1 Persistência do primeiro login

**Decisão:** coluna `public.users.welcome_tutorial_seen_at timestamptz NULL`.

- Migration: ADD COLUMN + `UPDATE ... SET welcome_tutorial_seen_at = now() WHERE ... IS NULL` (FR-023).
- Contas novas permanecem `NULL` (registro atual não seta a coluna).
- `OnboardingService.markWelcomeTutorialSeen()` faz `update users set welcome_tutorial_seen_at = now() where id = me and welcome_tutorial_seen_at is null` (idempotente).
- Ler o flag junto do perfil/sessão já carregada na Home (estender select do user store / `getCurrentUserSession` / query de perfil — o ponto que já traz `display_name` do `users`).

**Por que não localStorage:** RN-ONB-02 exige servidor (multi-device).  
**Por que marcar ao exibir:** segundo login não reabre mesmo se fechou no meio (SC-002).

### 2.2 UI do tutorial

**Decisão:** `Dialog` shadcn (mesmo padrão de IA / BookUpsert), 3 passos com copy pt-BR + CTA por passo + Pular / Concluir.

| Passo | CTA |
| ----- | --- |
| Seguir | Fecha tutorial → foca o bloco de recomendações na Home **ou** `router.push(COMMUNITY_PATH)` se ainda sem candidatos |
| Criar livros | Fecha → `onOpenBookUpsert()` (callback da Home) |
| IA | Fecha → `onOpenAiRecommendation()` |

Não navegar para rota `/onboarding`. Não usar joyride/spotlight no MVP.

### 2.3 Quando abrir

**Decisão:** hook `useWelcomeTutorial` na Home:

```text
autoOpen =
  isLoggedIn &&
  !isLoadingUser &&
  welcomeTutorialSeenAt === null &&
  !hasAutoOpenedThisMount
```

Ao `autoOpen`, chama `markWelcomeTutorialSeen()` **em paralelo** com abrir o dialog (falha de persistência: toast pt-BR, ainda assim não spammar — retry uma vez; se falhar de novo, sessionStorage `onboarding-seen-fallback` só para a aba atual, nunca como fonte de verdade).

### 2.4 Aviso + recomendações

**Decisão:** componente `ZeroFollowingNudge` acima da grade / no lugar do empty “Conectar com amigos” quando `followingCount === 0`.

**Dados:** `OnboardingService.getFollowRecommendations(selfId, limit=5)`:

1. Em paralelo: `getFollowingIds()`, membros (`id, display_name, avatar_seed`), `get_community_reader_genres`, `get_community_reader_activity`, gêneros dos livros do self (query `books` com participação do self — ou derivar dos próprios livros já na Home se barato).
2. Excluir self e já seguidos.
3. Para cada candidato: tops via `pickTopGenre` (já existe).
4. Overlap com set de gêneros do self → reason `shared_genre`; senão `active_reader`.
5. Ordenar RN-ONB-10; slice(0, 5).

**Por que não RPC nova no MVP:** comunidade pequena; mesmas INVOKER RPCs já respeitam RLS. Se pesar, evoluir para `get_follow_recommendations(limit)` depois.

**Seguir:** `useOptimisticFollowToggle`; invalidar também `QUERY_KEYS.onboarding.recommendations(selfId)`.

### 2.5 Empty state Home

**Decisão:** trocar Link `/profile` → `COMMUNITY_PATH`; copy “Na Comunidade você encontra leitores…”. Quando o nudge de zero-seguindo estiver visível, o card duplicado “Conectar com amigos” no empty de zero livros pode sumir ou virar “Ver recomendações” (scrollIntoView) — preferir **não duplicar**: se `followingCount === 0`, o nudge cobre rede; empty de livros fica só “Adicionar livros” (+ IA se quiser).

### 2.6 Query keys e módulo

```text
QUERY_KEYS.onboarding.tutorial(userId)
QUERY_KEYS.onboarding.recommendations(userId)
```

Estrutura hook-first, tipos fora do componente, `export default`, barrels `index.ts`, pt-BR, `useCallback`/`useMemo` nos hooks (padrão do repo).

### 2.7 P3 reabrir

Atalho em Meu perfil: “Ver tutorial de novo” abre o mesmo Dialog **sem** limpar `welcome_tutorial_seen_at`.

---

## 3. Technical Context

| Item | Decisão |
| ---- | ------- |
| Linguagem | TypeScript |
| UI | Next.js App Router, Dialog shadcn, Home client |
| Auth | Só autenticado |
| Dados | `users.welcome_tutorial_seen_at`, `user_followers`, RPCs community, `books` |
| Estado | TanStack Query + callbacks da Home |
| Seguir | `useOptimisticFollowToggle` |
| Testes | Vitest + Testing Library, colocation |
| Localização | pt-BR |

---

## 4. Project Structure

### 4.1 Novos

```text
supabase/migrations/YYYYMMDDHHMMSS_users_welcome_tutorial_seen_at.sql

src/modules/onboarding/
  index.ts
  types/onboarding.types.ts
  types/index.ts
  services/onboarding.service.ts
  services/onboarding.service.test.ts
  services/index.ts
  utils/rankFollowRecommendations.ts
  utils/rankFollowRecommendations.test.ts
  utils/index.ts
  hooks/useWelcomeTutorial.ts
  hooks/useWelcomeTutorial.test.ts
  hooks/useFollowRecommendations.ts
  hooks/useFollowRecommendations.test.ts
  hooks/index.ts
  components/welcomeTutorialDialog/
    welcomeTutorialDialog.tsx
    welcomeTutorialDialog.test.tsx
    types/welcomeTutorialDialog.types.ts
    index.ts
  components/zeroFollowingNudge/
    zeroFollowingNudge.tsx
    zeroFollowingNudge.test.tsx
    types/zeroFollowingNudge.types.ts
    index.ts
  components/followRecommendationRow/
    followRecommendationRow.tsx
    followRecommendationRow.test.tsx
    types/followRecommendationRow.types.ts
    index.ts
```

### 4.2 Alterados

```text
src/constants/keys.ts
src/types/supabase.ts / database.types.ts   (após migration)
src/services/users/service/getCurrentUser.service.ts  (+ welcome_tutorial_seen_at na session se couber)
src/stores/userStore.ts / tipos de user     (expor seenAt)
src/modules/home/index.tsx                  (tutorial + nudge + empty state)
src/modules/home/index.test.tsx
src/modules/profile/clientProfile/...       (P3 atalho)
src/lib/routes/community.ts                 (já existe; só importar)
README.md                                   (mapa)
```

---

## 5. Fases de implementação

### Fase 0 — Fundação

- Migration coluna + backfill.
- Tipos + `QUERY_KEYS.onboarding`.
- `OnboardingService` (mark seen + recommendations).
- `rankFollowRecommendations` puro + testes.

### Fase 1 — Tutorial primeiro login (US1–US2)

- `useWelcomeTutorial` + Dialog 3 passos + CTAs.
- Wire na Home; marcar seen ao abrir.
- Testes: não abre se `seenAt` setado; abre se null; mark chamado.

### Fase 2 — Zero-seguindo + recomendações (US3–US4)

- `useFollowRecommendations` + `ZeroFollowingNudge` + row com seguir.
- Sumir com following ≥ 1.
- Testes de ranking / motivo / exclusão self.

### Fase 3 — Empty Home + cold start (US5 + FR-009)

- Empty state → Comunidade; sem card duplicado de rede.
- Fallback `active_reader` sem alegar gênero.

### Fase 4 — P3 + polish

- Reabrir no perfil.
- README + promover RNs.

---

## 6. Integração (brownfield)

| Ponto | Como |
| ----- | ---- |
| Comunidade RPCs | Reuso INVOKER; não DEFINER |
| Follow | Mesmo toggle; invalidar onboarding |
| BookUpsert / AI | Callbacks já existentes na Home |
| Aba Seguindo | Intocada (livros) |
| Spec 005 | Recomendações só no nudge/tutorial context |

---

## 7. Test plan (alto nível)

- `rankFollowRecommendations`: overlap primeiro; motivo pt-BR; limite 5; exclui self/following; fallback sem gênero inventado.
- `OnboardingService.markWelcomeTutorialSeen`: update condicional; idempotente.
- `useWelcomeTutorial`: auto-open só com `seenAt === null`; chama mark; segundo mount não reabre se seen.
- `ZeroFollowingNudge`: hidden se following > 0; empty + CTA comunidade; follow dispara toggle.
- Home: empty não linka `/profile` para rede; link Comunidade.
- FR-023: migration backfill coberta por comentário + teste SQL opcional / review.

---

## 8. Riscos e mitigação

| Risco | Mitigação |
| ----- | --------- |
| Contas antigas veem tutorial | Backfill na mesma migration |
| Mark fails → loop | Fallback session só por aba; toast; não reabrir se mark ok |
| Snapshot pesado | limit 5; comunidade pequena; RPC depois se precisar |
| Duplicar empty + nudge | UI: um bloco de rede só |

---

## 9. Notas de governança SDD

- Fase: **Planning** → `tasks.md`.
- Issue #175.
- Implementação: branch desta PR ou follow-up `ready-for-agent`.
