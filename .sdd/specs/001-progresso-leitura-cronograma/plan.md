# Implementation Plan: Progresso de Leitura Baseado no Cronograma

**Feature ID:** 001
**Spec:** [spec.md](./spec.md)
**Status:** Draft (pós-aprovação da Spec)
**Criada em:** 2026-05-17

---

## 1. Summary

A spec define um indicador visual de progresso derivado **exclusivamente** do cronograma do usuário atual (`schedule.owner = auth.uid()`), exibido em duas superfícies (`BookCard` na Home e topo da tela `/schedule/[id]/[title]`), restrito a livros com `status = reading`, com **ocultação silenciosa** quando o cronograma não existe.

Este plano consolida as 3 decisões técnicas em aberto na seção 9 da spec e desenha a arquitetura completa em conformidade com os padrões do repositório (**Hook-First**, separação Service/Mapper/Hook/UI, TanStack Query com `staleTime` consistente — RN19, RLS via RPC respeitando `auth.uid()` — RN44/RN48, pt-BR — diretriz global).

A abordagem evita N requisições por card na Home através de **uma única RPC agregada** consumida em lote a partir da lista de livros já carregada pelo `useHome`. Na tela de Cronograma, o progresso é **derivado em memória** do array que `useSchedule` já fornece, garantindo sincronia 100% otimista com o toggle de leitura existente.

---

## 2. Decisões técnicas (resolução dos `[NEEDS CLARIFICATION]` da spec)

### 2.1 Unidade do cálculo (resposta a `[NEEDS CLARIFICATION] #1`)

**Decisão:** **1 linha de cronograma = 1 unidade**.

- **Por quê:**
  - O `generateBookSchedule` já balanceia capítulos por dia via `chaptersPerDay` (default 3). Em ~95% dos casos as linhas têm peso equivalente.
  - O campo `schedule.chapters` é uma **string livre** (`"1-3"`, `"Prólogo, 1"`, `"11"`, `"Epílogo"`) — ponderar exigiria um parser robusto, novo conjunto de testes e tratamento de edge cases (faixas com hífen, prólogos sem número, epílogos).
  - Semanticamente a tabela representa "dias de leitura": "X dias lidos de Y dias planejados" é mais natural na UI ("Você está no 4º dia de 10").
- **Trade-off aceito:** dias muito diferentes em volume de capítulos (raros, criados manualmente fora do gerador) representarão progresso "achatado". Aceitável no MVP; pode ser extendido posteriormente com ponderação.
- **Impacto na spec:** atualizar **RNxx-03** como decisão definitiva (não mais com `[NEEDS CLARIFICATION]`).

### 2.2 Estratégia de fetch na Home (resposta a `[NEEDS CLARIFICATION] #2` / R-01)

**Decisão:** **RPC agregada Postgres** + **prefetch único em lote** no `useHome`.

- **Arquitetura:**
  - Nova RPC `public.get_schedule_progress_for_books(book_ids uuid[])` executa em `SECURITY INVOKER` e usa `auth.uid()` internamente como filtro, retornando `{ book_id, total, completed }` apenas para os livros recebidos. **Naturalmente** alinhada à RN44 (a RPC nunca devolve progresso de outro usuário; é o próprio RLS implícito de `auth.uid()`).
  - Nova rota `GET /api/schedule/progress?bookIds=a,b,c` (autenticada via `requireUser`) chama a RPC e devolve `[{ book_id, total, completed }]`.
  - Novo hook `useReadingProgressMany(bookIds)` consome a rota via TanStack Query.
  - `useHome` (ou um wrapper intermediário) dispara o hook **uma vez** passando os `bookIds` da página corrente filtrados por `status === "reading"`. O `BookCard` na Home consulta o cache via `useReadingProgress(bookId)` (que faz `useQuery` na mesma key OU usa `useQueries`/`useSelector` para pegar a fatia do cache agregado).
- **Por quê não opção B (fetch por card):**
  - 8 cards × 1 request = pico de 8 requests redundantes ao montar a Home (ou pior se o usuário pagina).
  - Acopla o `BookCard` ao endpoint do schedule, dificultando manter o card como componente puro reutilizável.
- **Por quê não opção C apenas (prefetch em lote sem endpoint agregado):**
  - Disparar `useSchedule` por livro internamente carrega TODAS as linhas (potencialmente 30-100 linhas × N livros). A RPC agregada devolve só `(total, completed)` — payload mínimo.
- **Mitigação de R-01:** o endpoint agregado é a contra-medida explícita.

### 2.3 Invalidação cross-screen (resposta a `[NEEDS CLARIFICATION] #3` / R-02)

**Decisão:** **Aproveitar a invalidação por prefixo já existente** + **predicate para o cache agregado**.

- Já temos `getScheduleBookQueryFilterKey(bookId) = ["schedule", bookId]` invalidada em `onSettled` do `useOptimisticScheduleReadToggle`.
- A nova versão **single** usará a key `["schedule", bookId, "progress", userId]` — **invalida automaticamente** com a regra atual (sem mudar uma linha do toggle).
- A nova versão **many** usará a key `["schedule", "progress", "many", sortedHash, userId]` — **NÃO** é tocada pelo invalidate atual. Solução: adicionar uma segunda chamada de `invalidateQueries` com `predicate` no `onSettled` (alteração cirúrgica de 3 linhas no hook existente, ou criação de utilitário `invalidateAllReadingProgressCaches`).
- **Na tela `/schedule`:** o progresso será **derivado em memória** do array que `useSchedule` retorna (NÃO via `useReadingProgress`). Sincronia otimista é 100% nativa do React, sem refetch.
- **Mitigação de R-02:** comportamento garantido pelo `staleTime` consistente já em uso (RN19) + invalidação ativa.

---

## 3. Technical Context

| Item                          | Decisão                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Linguagem**                 | TypeScript estrito (já consolidado)                                                                    |
| **Framework**                 | Next.js 15 (App Router)                                                                                |
| **UI Runtime**                | React 19 + RSC + Client components onde necessário                                                     |
| **Estado servidor**           | TanStack Query v5 (já consolidado)                                                                     |
| **Estado client global**      | Zustand stores existentes (`useUserStore`)                                                             |
| **Estilo / Tokens**           | Tailwind + componentes shadcn já em `src/components/ui` (incluindo `<Progress />` em `progress.tsx`)   |
| **Persistência**              | Supabase Postgres — **nenhuma nova tabela**. Apenas uma **RPC** derivada (`SECURITY INVOKER`)          |
| **Auth/RLS**                  | RN44 já garante isolamento por `owner`. RPC roda como invoker → herda RLS automaticamente               |
| **API**                       | Next App Router (`src/app/api/schedule/progress/route.ts`)                                             |
| **Testes**                    | Vitest + Testing Library (padrão do repo). Cobrir hooks, service, RPC integrada via rota               |
| **Localização**               | pt-BR em todos os textos (FR-009)                                                                      |
| **Acessibilidade**            | Componente `<Progress />` shadcn + label textual associado (FR-014)                                    |

---

## 4. Project Structure (novos arquivos + deltas)

### 4.1 Novos arquivos

```text
src/modules/schedule/
├── services/
│   ├── readingProgress.service.ts             # GET /api/schedule/progress?bookIds=...
│   └── readingProgress.service.test.ts
├── hooks/
│   ├── useReadingProgress.ts                  # Single — usado pelo BookCard
│   ├── useReadingProgress.spec.ts
│   ├── useReadingProgressMany.ts              # Lote — usado pelo useHome para prefetch agregado
│   └── useReadingProgressMany.spec.ts
├── utils/
│   ├── computeReadingProgress.ts              # função pura: (total, completed) → ProgressDomain
│   ├── computeReadingProgress.test.ts
│   ├── readingProgressQueryKey.ts             # query keys (single + many)
│   └── readingProgressQueryKey.test.ts
├── types/
│   └── readingProgress.types.ts               # ProgressDomain / ProgressPersistence / ProgressInputMany
└── components/
    └── readingProgressIndicator/
        ├── readingProgressIndicator.tsx       # componente visual (puramente apresentacional)
        ├── readingProgressIndicator.test.tsx
        ├── types/readingProgressIndicator.types.ts
        └── index.ts

src/app/api/schedule/progress/
├── route.ts                                   # GET aggregated
└── route.test.ts

supabase/migrations/
└── 20260517120000_schedule_progress_rpc.sql   # RPC + GRANTs
```

### 4.2 Arquivos alterados (deltas mínimos)

```text
src/components/bookCard/bookCard.tsx
  - Renderizar <ReadingProgressIndicator bookId variant="card" /> condicional a:
      isLogged && !isShelf && book.status === "reading"
  - Posição: dentro do bloco "mt-auto" abaixo do statusDisplay (não afeta layout em estantes).

src/components/bookCard/hooks/useBookCard.ts
  - Exportar derivado boolean shouldShowProgress = isLogged && !isShelf && book.status === "reading"
    (mantém o componente burro; lógica fica no hook — diretriz Hook-First).

src/modules/schedule/index.tsx
  - Renderizar <ReadingProgressIndicator bookId={id} variant="page" /> abaixo do <header> e acima de
    {shouldDisplayScheduleTable ? ... : ...}.
  - Usa internamente um hook variante (ver §5.3) que deriva do schedule já carregado, sem novo fetch.

src/modules/schedule/hooks/useOptimisticScheduleReadToggle.ts
  - No onSettled: adicionar invalidação adicional para a key "many"
    (ver §5.5 — alternativa: utilitário invalidateAllReadingProgressCaches).

src/modules/schedule/hooks/index.ts
  - Exportar useReadingProgress, useReadingProgressMany.

src/modules/schedule/services/index.ts (criar se ainda não exporta o service novo)

src/modules/home/hooks/useHome.ts (OU novo wrapper)
  - Após booksQueryData resolver, chamar useReadingProgressMany com os bookIds em status "reading".
  - Decisão: criar hook auxiliar useHomeReadingProgressPrefetch para preservar a complexidade atual
    do useHome (já com 700+ linhas). Ver §5.4.
```

---

## 5. Detalhamento de implementação

### 5.1 RPC Postgres (migration)

Arquivo: `supabase/migrations/20260517120000_schedule_progress_rpc.sql`

Responsabilidade: agregar `total` e `completed` por `book_id` para o usuário atual, restrito aos `book_ids` recebidos.

Características obrigatórias:
- `LANGUAGE sql STABLE` (sem efeitos colaterais, lógica determinística).
- `SECURITY INVOKER` (default) — RLS é respeitado automaticamente; a função só vê linhas do próprio usuário via policy de `schedule` (RN44).
- Internamente filtra com `owner = auth.uid()` como **defesa em profundidade** (mesmo se a policy for relaxada no futuro).
- `GRANT EXECUTE ... TO authenticated;` (anon não pode chamar).
- Retorna apenas linhas onde `total > 0` (livros sem schedule são omitidos no retorno; alinhado a FR-004).

Contrato detalhado em `contracts/rpc-spec.sql`.

### 5.2 Service `ReadingProgressService`

Responsabilidade: apenas falar HTTP com `GET /api/schedule/progress`. Sem lógica de cálculo (essa fica em `computeReadingProgress.ts`).

Padrão idêntico ao `ScheduleUpsertService` (try/catch + `ErrorHandler.normalize` + `apiJson`). Métodos:

```text
getMany(bookIds: string[]): Promise<ProgressPersistence[]>
```

- Curto-circuita devolvendo `[]` se `bookIds.length === 0` (não dispara HTTP — economia da camada Service).
- Concatena bookIds em `?bookIds=a,b,c` (parsed server-side com `z.string().uuid().array()`).

### 5.3 Hooks

#### `useReadingProgress(bookId, options?)`

- Usado pelo `BookCard`.
- Internamente apenas **lê o cache populado** pela versão `many` (via `queryClient.getQueryData` + `useQuery` com `enabled: false` e `placeholderData` derivando do many). 
- **Decisão de fallback:** se o cache `many` ainda não tiver resposta para esse `bookId`, o hook devolve `null` (não dispara fetch single). Isso garante 1 single source of truth (a chamada batch) e evita race conditions.
- **Exceção:** se o consumidor explicitamente passar `options.fallbackToSingle = true` (não usado na Home, mas disponível para usos futuros), o hook dispara `useQuery` no endpoint single — **MAS** esse modo NÃO é parte do MVP. Marcar como "extensão futura" no JSDoc.
- Retorna `{ progress: ProgressDomain | null, isLoading: boolean }`.

#### `useReadingProgressMany(bookIds)`

- Usado pelo `useHomeReadingProgressPrefetch` (e potencialmente outras telas no futuro).
- TanStack Query:
  - `queryKey: readingProgressManyQueryKey(bookIds, userId)` — id list ordenado para cache estável (RN18).
  - `queryFn: () => readingProgressService.getMany(bookIds)`.
  - `enabled: isLoggedIn && bookIds.length > 0`.
  - `staleTime: 1000 * 60 * 5` (alinhado a RN19).
  - `gcTime: 1000 * 60 * 10`.
- Retorna `{ progressByBookId: Map<bookId, ProgressDomain>, isLoading, isError }`.

#### `useScheduleReadingProgress(bookId)` (interno à tela de cronograma)

- **NÃO** faz fetch. É um wrapper que consome o array já carregado por `useSchedule(bookId)` e aplica `computeReadingProgress` em memória.
- Garante sincronia 100% otimista com o toggle existente (FR-010, SC-004).
- Reutilizado pelo `<ReadingProgressIndicator variant="page" />` exclusivamente.

### 5.4 Prefetch agregado na Home

Decisão: **criar hook auxiliar** `useHomeReadingProgressPrefetch(allBooks)` em vez de incharcar mais `useHome`. Razão: `useHome` já tem 747 linhas e múltiplos `useMemo`/`useEffect` — adicionar lógica de progresso lá viola o princípio de coesão.

Localização: `src/modules/home/hooks/useHomeReadingProgressPrefetch.ts`.

Comportamento:
1. Extrai `bookIds` dos livros em `status === "reading"` da página corrente.
2. Chama `useReadingProgressMany(bookIds)` (TanStack Query cuida da deduplicação).
3. Não retorna nada (efeito colateral é popular o cache).

Integração no `useHome.ts`: 1 linha de chamada após `allBooks` resolver:

```typescript
useHomeReadingProgressPrefetch(allBooks?.data ?? []);
```

### 5.5 Invalidação para a key "many"

Opção escolhida: criar utilitário em `src/modules/schedule/utils/readingProgressQueryKey.ts`:

```typescript
export async function invalidateReadingProgressManyCaches(queryClient: QueryClient) {
  await queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey[0] === "schedule" &&
      query.queryKey[1] === "progress" &&
      query.queryKey[2] === "many",
  });
}
```

Chamado no `onSettled` do `useOptimisticScheduleReadToggle`:

```typescript
onSettled: async () => {
  await queryClient.invalidateQueries({
    queryKey: getScheduleBookQueryFilterKey(bookId),
  });
  await invalidateReadingProgressManyCaches(queryClient);
},
```

Delta: ~5 linhas no hook existente. Coberto por teste de integração já existente para o toggle (extender o spec).

### 5.6 Componente `<ReadingProgressIndicator />`

Puramente apresentacional (UI). Aceita props:

```text
{
  bookId: string;
  variant: "card" | "page";
  progress: ProgressDomain | null;     // injetado pelo hook via prop drilling controlado
  isLoading: boolean;
}
```

Comportamento (alinhado a FR-004 / FR-005 / FR-013):
- Se `!progress` → retorna `null` (ocultação silenciosa).
- Se `isLoading && !progress` → retorna `null` (não exibe estado intermediário no `card`, evita layout shift). Para `variant="page"` na tela de cronograma, isLoading raramente acontece pois o dado vem do `useSchedule` já carregado.
- Caso contrário, renderiza:
  - `variant="card"`: barra compacta + texto `"X de Y"` em tabular-nums (estilo consistente com `pagesLabel` já existente).
  - `variant="page"`: barra larga + texto `"X de Y dias lidos (Z%)"` (% arredondado para inteiro).
- Acessibilidade (FR-014): `role="progressbar"` com `aria-valuenow / aria-valuemin / aria-valuemax`, `aria-label` em pt-BR descritivo.

Hook adapter para o card: o `<ReadingProgressIndicator />` exposto a partir do módulo schedule terá uma variante "self-fetching" exportada como `<CardReadingProgressIndicator bookId />` (compositional helper) que internamente usa `useReadingProgress(bookId)` e injeta props no apresentacional. Isso mantém o `BookCard` totalmente declarativo (`<CardReadingProgressIndicator bookId={book.id} />`).

### 5.7 Função pura `computeReadingProgress`

`src/modules/schedule/utils/computeReadingProgress.ts`:

```text
computeReadingProgress(total: number, completed: number): ProgressDomain
```

- Devolve `null` se `total <= 0`.
- Arredonda percentual `Math.round((completed / total) * 100)`.
- Garante `completed <= total` (clamp por segurança).

Testes unitários cobrem: total zero, completed zero, completed == total, completed > total (clamp), arredondamento (3/7 = 43%).

### 5.8 Tipos

`src/modules/schedule/types/readingProgress.types.ts`:

```text
type ProgressPersistence = {
  book_id: string;
  total: number;
  completed: number;
};

type ProgressDomain = {
  bookId: string;
  total: number;
  completed: number;
  percentage: number;     // 0-100, inteiro
};

type ProgressByBookId = Map<string, ProgressDomain>;
```

---

## 6. Fluxo de dados (E2E)

### Cenário A — Usuário abre a Home com 5 livros em `reading`

1. `useHome` resolve a página de livros (cache TanStack Query, RN19).
2. `useHomeReadingProgressPrefetch` extrai `bookIds` em `reading`, chama `useReadingProgressMany`.
3. `useReadingProgressMany` dispara `GET /api/schedule/progress?bookIds=...` (1 request).
4. Rota chama a RPC; RPC devolve agregados; rota responde JSON.
5. Cada `BookCard` consome `useReadingProgress(book.id)` que lê do cache populado e injeta no `<CardReadingProgressIndicator />`.
6. Cards com `status !== "reading"` ou sem entrada no cache → `null` (FR-004 / FR-005).

### Cenário B — Usuário marca uma linha como lida na tela de Cronograma

1. `<ScheduleTable />` dispara `updateRead` (existente).
2. `useOptimisticScheduleReadToggle.onMutate` atualiza o cache `["schedule", bookId, userId]` otimisticamente.
3. `<ReadingProgressIndicator variant="page" />` é **reatividade pura**: deriva do mesmo array via `useScheduleReadingProgress(bookId)` → re-renderiza instantaneamente (SC-004 ≤ 100ms).
4. Mutation resolve → `onSettled` invalida `["schedule", bookId, ...]` E o cache `many` da Home.
5. Usuário volta à Home → na próxima montagem, `useReadingProgressMany` refetcha e atualiza o card.

### Cenário C — Usuário em livro de leitura coletiva (`userX` e `userY` ambos como readers)

1. `userX` logado abre Home. `useReadingProgressMany` chama a rota, que chama a RPC.
2. A RPC filtra por `owner = auth.uid() = userX`. **Nunca** retorna linhas de `userY` (RN44 + defesa em profundidade na RPC).
3. `userX` vê seu próprio progresso. SC-006 garantido por construção.

---

## 7. Plano de testes

### 7.1 Unitários (Vitest)

| Arquivo                                                            | Cobre                                                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `computeReadingProgress.test.ts`                                   | Edge cases: zero, full, overshoot, arredondamento.                                     |
| `readingProgressQueryKey.test.ts`                                  | Ordem estável, estabilidade entre montagens (RN18).                                    |
| `readingProgress.service.test.ts`                                  | Curto-circuito em `[]`, montagem da URL, propagação de erros.                          |
| `useReadingProgress.spec.ts`                                       | Leitura do cache many, fallback a `null` quando ausente.                               |
| `useReadingProgressMany.spec.ts`                                   | `enabled: false` deslogado, montagem da queryKey, `staleTime`.                         |
| `readingProgressIndicator.test.tsx`                                | Render condicional (sem dados → null), variants card/page, atributos ARIA.             |

### 7.2 Integração / Rota

| Arquivo                                  | Cobre                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `api/schedule/progress/route.test.ts`    | 401 sem sessão (RN20), 200 com sessão devolvendo apenas linhas do `auth.uid()` (RN44).            |

### 7.3 Extensões a testes existentes

- `useOptimisticScheduleReadToggle.spec.ts`: adicionar assert de que o `invalidateReadingProgressManyCaches` é chamado em `onSettled`.
- `BookCard` testes existentes (se houver): assert de que `<CardReadingProgressIndicator />` NÃO é renderizado para `status !== "reading"` e para `isShelf === true`.

### 7.4 Cobertura mínima (alinhado à diretriz `cobertura-fontes-abaixo-100pct.md`)

- Service novo: 100% statements e branches.
- Utils novos: 100%.
- Hooks novos: ≥ 90% (mocks de `useQuery` / `queryClient`).
- Rota nova: ≥ 90% (mock de `supabase.rpc`).
- Componente: ≥ 90%.

---

## 8. Migração e implantação

### 8.1 Ordem

1. **Migration** (`supabase migration up`) — cria a RPC. Não toca tabelas; rollback trivial (`DROP FUNCTION`).
2. **Backend route + service** — sem deploy quebrante (rota nova).
3. **Hooks + componente** — sem deploy quebrante.
4. **Wiring** no `BookCard` e na tela `/schedule` — visível para o usuário.

### 8.2 Feature flag

Não há necessidade. A ausência silenciosa (FR-004) cobre o caso de RPC falhar (try/catch + ErrorHandler) — o card e a tela degradam graciosamente sem indicador.

### 8.3 Rollback

- Reverter os deltas (3 arquivos: `bookCard.tsx`, `schedule/index.tsx`, `useOptimisticScheduleReadToggle.ts`).
- Remover `DROP FUNCTION public.get_schedule_progress_for_books(uuid[])`.
- Pastas novas podem ficar no repositório sem efeito (dead code) até remoção.

---

## 9. Conformidade com regras do projeto

| Regra/diretriz                       | Como o plano endereça                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Hook-First + Logic Separation**    | Toda lógica nos hooks (`useReadingProgress*`, `useScheduleReadingProgress`); componentes apenas renderizam.  |
| **Optimization (useCallback/useMemo)** | Hooks novos usarão `useMemo` para `progressByBookId` derivada e `useCallback` para selectors.              |
| **Component Anatomy**                | Tipos em arquivos `types/*.types.ts` separados (jamais no arquivo do componente).                            |
| **No underscore in component names** | Nomes: `ReadingProgressIndicator`, `CardReadingProgressIndicator`.                                          |
| **No comments**                      | Código entregue sem comentários narrativos (apenas JSDoc em assinaturas públicas onde estritamente útil).   |
| **Default exports + barrel**         | Cada nova pasta de componente/hook terá `index.ts` reexportando.                                            |
| **Import organization**              | Bibliotecas externas → aliases (`@/`) → relativos; ordem alfabética; linha em branco entre blocos.           |
| **Localização pt-BR**                | Todos os textos visíveis em pt-BR; `aria-label` em pt-BR (FR-009 / FR-014).                                  |
| **RN44** (privacy)                   | RPC filtra `auth.uid()` + RLS já existente; SC-006 testado.                                                  |
| **RN48** (API Routes)                | Rota nova usa `requireUser`. Mutação não aplicável (apenas GET).                                            |
| **RN19** (staleTime)                 | `1000 * 60 * 5` consistente em `useReadingProgressMany`.                                                    |
| **RN18** (cache key estável)         | `bookIds` ordenados alfabeticamente em `readingProgressManyQueryKey`.                                       |
| **RN55** (BookCard isShelf)          | Indicador NUNCA renderizado quando `isShelf === true` (FR-007).                                              |

---

## 10. Estimativa e sequenciamento

| Lote | Conteúdo                                                                                | Esforço      |
| ---- | --------------------------------------------------------------------------------------- | ------------ |
| **L1** | Migration RPC + testes manuais de SQL (REPL psql / Supabase Studio)                   | 1h           |
| **L2** | Types + computeReadingProgress + queryKey utils + tests                               | 1h           |
| **L3** | ReadingProgressService + tests                                                         | 1h           |
| **L4** | Rota `/api/schedule/progress/route.ts` + tests                                         | 1h           |
| **L5** | `useReadingProgressMany` + `useReadingProgress` + `useScheduleReadingProgress` + tests | 2h           |
| **L6** | `<ReadingProgressIndicator />` + `<CardReadingProgressIndicator />` + tests           | 2h           |
| **L7** | Wiring no `BookCard` (delta) + atualização do `useBookCard`                            | 30min        |
| **L8** | Prefetch no `useHome` via `useHomeReadingProgressPrefetch`                             | 30min        |
| **L9** | Wiring na tela `/schedule` (delta)                                                     | 15min        |
| **L10**| Extensão do `useOptimisticScheduleReadToggle` (invalidação cross-key) + tests          | 30min        |
| **L11**| Smoke E2E manual nas duas superfícies                                                  | 30min        |
| **L12**| Atualização do vault (Second Brain) — promover RNxx-01..06 + nota da feature           | 30min        |

**Total estimado:** ~10h de trabalho focado.

---

## 11. Riscos pós-Plan (acompanhar na fase Tasks/Implement)

- **R-04 — RPC sem `auth.uid()` em ambiente de teste:** mocks de Supabase precisam responder corretamente. Mitigação: testes da rota com mock determinístico de `supabase.rpc`.
- **R-05 — Cache "many" desalinhado quando o usuário pagina rapidamente:** TanStack Query deduplica por queryKey; como a key inclui o set de bookIds ordenado, paginar gera nova key → novo fetch. Aceitável.
- **R-06 — Layout shift no `BookCard` quando o progresso chega depois:** mitigado retornando `null` durante loading no `variant="card"` (sem skeleton — evita "piscar"). Validar em smoke E2E.

---

## 12. Próximos passos (governança SDD)

- Pós-aprovação deste Plan → executar `tasks` para gerar `tasks.md` (Fase 3) com a quebra por User Story.
- Itens de spec marcados como `[NEEDS CLARIFICATION]` agora têm decisão registrada aqui (§2). Quando promover ao vault, atualizar RNxx-03 / FR-001 / FR-003 / FR-011 referenciando este Plan.
