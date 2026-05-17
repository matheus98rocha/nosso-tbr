# Data Model: Progresso de Leitura Baseado no Cronograma

**Feature ID:** 001
**Status:** Draft (acompanha `plan.md`)

---

## 1. Visão geral

Esta feature **não introduz novas tabelas**, **não altera schema** e **não cria índices**. Toda a representação de progresso é **derivada em tempo de leitura** da tabela existente `public.schedule` (RN44), através de uma única **RPC Postgres** agregadora.

```
┌───────────────────────────────────┐         ┌────────────────────────────────────┐
│  public.schedule (já existente)   │         │  RPC get_schedule_progress_for_books │
│  ────────────────────────────     │ ──────► │  (book_ids uuid[]) RETURNS TABLE     │
│  id, book_id, owner, date,        │         │    (book_id, total, completed)       │
│  chapters, completed              │         │  SECURITY INVOKER + auth.uid()       │
└───────────────────────────────────┘         └────────────────────────────────────┘
                                                            │
                                                            ▼
                                              GET /api/schedule/progress?bookIds=...
                                                            │
                                                            ▼
                                                ProgressPersistence[]
                                                            │
                                                ┌───────────┴───────────┐
                                                ▼                       ▼
                                  ProgressDomain (single)    ProgressByBookId (many)
                                  (consumido pelo BookCard   (consumido pela Home
                                   e tela /schedule)          via prefetch agregado)
```

---

## 2. Entidades (camada lógica)

### 2.1 `ProgressPersistence` (wire format / linha retornada pela RPC)

| Campo       | Tipo     | Descrição                                                                 | Restrições                       |
| ----------- | -------- | ------------------------------------------------------------------------- | -------------------------------- |
| `book_id`   | `uuid`   | Identificador do livro no catálogo `books.id`                             | NOT NULL                         |
| `total`     | `bigint` | Total de linhas em `schedule` para `(book_id, auth.uid())`                | `> 0` (linhas com total 0 são omitidas pela RPC) |
| `completed` | `bigint` | Quantas dessas linhas têm `completed = true`                              | `0 <= completed <= total`        |

**Observação:** o JSON serializado pela rota converte `bigint` para `number` (TanStack Query e React lidam como `number`). Tamanhos > 2^53 são inconcebíveis (cronogramas de leitura têm 10-200 linhas).

### 2.2 `ProgressDomain` (domínio do client)

| Campo        | Tipo     | Derivação                                                                           |
| ------------ | -------- | ----------------------------------------------------------------------------------- |
| `bookId`     | `string` | Cópia direta de `book_id` (camelCase).                                              |
| `total`      | `number` | Cópia direta.                                                                       |
| `completed`  | `number` | `Math.min(completed, total)` (clamp defensivo).                                     |
| `percentage` | `number` | `Math.round((completed / total) * 100)`. Sempre inteiro 0-100.                      |

Calculado por `computeReadingProgress(total, completed)`. Devolve `null` quando `total <= 0` (ocultação silenciosa — FR-004).

### 2.3 `ProgressByBookId` (estrutura do cache "many")

`Map<string /* bookId */, ProgressDomain>` — construído no client a partir de `ProgressPersistence[]`. Permite lookup O(1) pelos `BookCard` consumidores.

---

## 3. Relacionamentos

| De                                       | Para                          | Cardinalidade | Observação                                                                  |
| ---------------------------------------- | ----------------------------- | ------------- | --------------------------------------------------------------------------- |
| `schedule.book_id`                       | `books.id`                    | N:1           | Já existente (FK em `schedule`).                                            |
| `schedule.owner`                         | `users.id` (= `auth.uid()`)   | N:1           | Já existente (RN44).                                                        |
| RPC `(book_ids)`                         | `schedule`                    | N:N (input)   | A RPC agrega linhas; relacionamento puramente computacional, sem persistência. |

**Nenhuma nova FK, nenhum novo índice.** A consulta da RPC se beneficia do índice composto já existente em `schedule (book_id, owner)` (verificar em `database/database-indexes-views.md` no vault; se não existir, **considerar adicionar** — ver §6).

---

## 4. Invariantes de domínio

- **I-01 (Isolamento por owner / RN44):** para qualquer chamada da RPC, todo `total` e `completed` retornado deve ser calculado APENAS sobre linhas onde `owner = auth.uid()`.
- **I-02 (Subconjunto):** `0 <= completed <= total` para toda linha retornada.
- **I-03 (Ausência implícita):** se um `book_id` solicitado não tem nenhuma linha em `schedule` para o `owner`, a RPC **omite** a entrada (não retorna `total=0`). O client interpreta ausência como "sem cronograma" → `null` → indicador oculto (FR-004).
- **I-04 (Não-retroatividade):** alterar `schedule.completed` em uma linha afeta apenas o `completed` agregado; nunca o `total`. Apagar/criar linhas de cronograma (`/api/schedule` POST/DELETE existentes) afeta `total`.
- **I-05 (Estabilidade da cache key):** a queryKey do TanStack Query para a versão "many" usa `bookIds` ordenados alfabeticamente (UUID lexicográfico) — alinhado a RN18.

---

## 5. Ciclo de vida dos dados

| Evento                                                       | Efeito derivado                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Usuário cria cronograma (`POST /api/schedule`)               | Próxima chamada da RPC para esse `bookId` passa a retornar `(total = N, completed = 0)`.         |
| Usuário marca linha como lida (`PATCH /api/schedule/[id]`)   | `completed` aumenta em 1. Otimistic update no cache de `useSchedule` reflete na tela imediatamente; invalidação no `onSettled` repropaga ao cache `many` da Home. |
| Usuário desmarca linha                                       | `completed` diminui em 1; mesmo fluxo.                                                           |
| Usuário apaga cronograma (`DELETE /api/schedule?bookId=`)    | RPC para de retornar entrada para esse `bookId` → indicador some.                                |
| Usuário muda `status` do livro de `reading` para `paused`    | Sem efeito no dado; o filtro de exibição (FR-005) é apenas no client (`BookCard` deixa de renderizar). |

---

## 6. Performance e índices

### 6.1 Plano de query da RPC

A query base é:

```text
SELECT
  s.book_id,
  COUNT(*)              AS total,
  COUNT(*) FILTER (WHERE s.completed) AS completed
FROM public.schedule s
WHERE s.owner   = auth.uid()
  AND s.book_id = ANY(book_ids)
GROUP BY s.book_id
HAVING COUNT(*) > 0;
```

### 6.2 Índices

- **Recomendado verificar:** índice composto `schedule(owner, book_id)` (ou `schedule(book_id, owner)`). Se ausente, criar na mesma migration:
  ```sql
  CREATE INDEX IF NOT EXISTS schedule_owner_book_id_idx
    ON public.schedule (owner, book_id);
  ```
- **Justificativa:** a Home dispara a RPC com 1-8 `book_ids`. Sem índice, scan sequencial degrada com cronogramas longos × muitos usuários.
- **Ação obrigatória no Plan/Tasks:** consultar `database/database-indexes-views.md` no vault para confirmar se o índice já existe; se sim, omitir a criação. Marcar como [DECISÃO_PENDENTE_NA_TASK].

### 6.3 Tamanho do payload

Estimativa por chamada do endpoint:
- `8 bookIds × ~50 bytes JSON cada = ~400 bytes`.
- Negligível comparado ao payload da lista de livros (`bookService.getAll` retorna ~3-10KB por página).

### 6.4 Caching

- TanStack Query com `staleTime = 5min` (RN19) reduz drasticamente fetches em navegação repetida.
- Invalidação ativa pós-toggle propaga atualizações sem polling.

---

## 7. Segurança (RLS / RBAC)

| Camada              | Mecanismo                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Postgres (RLS)**  | A RPC é `SECURITY INVOKER` → herda automaticamente a policy de `schedule` que filtra `owner = auth.uid()` (RN44).            |
| **Defesa em profundidade** | Mesmo se a policy mudar, a RPC já contém `WHERE s.owner = auth.uid()` na própria query.                                |
| **Anon**            | `GRANT EXECUTE` apenas para `authenticated`. Anônimo recebe `42501 permission denied` (refletido como `403` ou `401` pela rota). |
| **API Route**       | `requireUser` valida sessão antes de chamar a RPC. Sem sessão → `401` (RN20).                                                |
| **Vault**           | Promover a RNxx-04 (já na spec, será confirmada após entrega) e linkar com [[database/database-rls-policies]] e [[business-rules#RN44]]. |

---

## 8. Conformidade com domínios existentes

| Domínio existente                          | Como esta feature se encaixa                                                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `public.schedule` + RN44                   | Único reader. Nenhuma escrita nova. Nenhum trigger novo.                                                                      |
| `public.books` + `status`                  | O escopo `status = reading` é aplicado **somente no client** (FR-005). A RPC não consulta `books` (princípio: cada RPC faz uma coisa). |
| `get_reading_leaderboard` (RN10 — derivativa) | Precedente arquitetural: função SQL `STABLE` agregando de `readers[]` e `end_date`. Esta feature segue o mesmo padrão.    |
| Modelo de leitura coletiva (RN42 / RN59)   | Indiferente — cada `schedule.owner` é único por usuário. Leitura coletiva mantém um cronograma por participante.              |

---

## 9. Considerações de evolução futura (não escopo do MVP)

1. **Ponderação por capítulos** (descartada em §2.1 do Plan) — exigiria parser de `chapters` string. Caso adotada, alterar a RPC para devolver também `chapters_total` e `chapters_completed`, manter retrocompatibilidade adicionando colunas (não removendo).
2. **Histórico de progresso (tracking temporal)** — exigiria nova tabela. Fora deste escopo.
3. **Progresso em estantes (`isShelf=true`)** — UI-only; nenhum impacto no modelo de dados.
4. **Atrasos / pendências** — derivável adicionando `expected_completed_through_today` na RPC com base em `WHERE date <= CURRENT_DATE`. Extensão futura sem schema novo.

---

## 10. Resumo executivo

- **Zero novas tabelas, zero alterações de schema.**
- **1 nova RPC Postgres `STABLE` + `SECURITY INVOKER` + filtro `auth.uid()`.**
- **Possível 1 novo índice composto** em `schedule(owner, book_id)` (apenas se ausente — verificar vault).
- **2 novos tipos no client** (`ProgressPersistence` wire / `ProgressDomain` puro).
- **Nenhuma quebra de contrato** com endpoints, hooks ou componentes existentes.
