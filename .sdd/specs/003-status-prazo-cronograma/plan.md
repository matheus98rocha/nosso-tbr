# Implementation Plan: Status de Prazo da Leitura no Cronograma

**Feature ID:** 003  
**Spec:** [spec.md](./spec.md)  
**Status:** Draft (pós-revisão da Spec)  
**Criada em:** 2026-08-16

---

## 1. Summary

A spec pede rótulos **somente de exibição** em duas superfícies (tela `/schedule/[id]/[title]` e `BookCard` na Home): **data prevista de término** sempre que existir cronograma, e **“Atraso de X dia(s)”** só quando houver dia **vencido e não lido**. Adiantamento **não** ganha texto próprio: só **antecipa a data prevista**. Zero persistência.

A tela de Cronograma já tem **todas as linhas** em memória (`useSchedule`). A Home hoje só tem agregado `(total, completed)` via RPC `get_schedule_progress_for_books`. O contrato da feature 001 **permite adicionar colunas** ao retorno da RPC. Este plano **estende essa RPC** com `overdue`, `ahead` e `last_date` (compatível) e concentra a regra em uma função pura `computeSchedulePace`, reusada nas duas superfícies.

---

## 2. Decisões técnicas (incluindo §9 da spec)

### 2.1 Atraso ≠ (esperado − realizado)

**Decisão:** atraso = `COUNT` de linhas com `date ≤ hoje` **e** `completed = false`. Adiantamento = `COUNT` de linhas com `date > hoje` **e** `completed = true`.

- Completar um dia futuro **não** apaga atraso de um dia vencido em aberto (R-03 da spec).
- Dia futuro não lido **nunca** entra no atraso.

Equivalência com “delta = lidos − devidos” **só** vale se o leitor marca em ordem. A regra do owner exige a forma por linha.

### 2.2 Data prevista = última data ± deslocamento em dias corridos

**Decisão:** `predictedEnd = lastDate + overdueDays − aheadDays` em **dias de calendário** (America/São_Paulo), sem reaplicar “pular fim de semana” do `generateBookSchedule`.

- Em dia: `overdue = 0`, `ahead = 0` → última data planejada.
- Leu o de amanhã: `ahead = 1` → última data **menos 1 dia**.
- 2 vencidos em aberto: `overdue = 2` → última data **mais 2 dias**.

Trade-off aceito (R-04): o gerador original pode pular sábados/domingos; o deslocamento da label não. Copy continua uma data `DD/MM/AAAA`.

### 2.3 Home: estender a RPC existente (não criar endpoint novo)

**Decisão:** `CREATE OR REPLACE` em `get_schedule_progress_for_books` adicionando:

| Coluna      | Significado                                      |
| ----------- | ------------------------------------------------ |
| `overdue`   | dias `date ≤ hoje_sp AND NOT completed`          |
| `ahead`     | dias `date > hoje_sp AND completed`              |
| `last_date` | `MAX(date)` do cronograma do owner               |

`hoje_sp = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date`.

`schedule.date` já é tipo `date` (vault). Comparação é calendário, sem hora.

Por quê não fetch de todas as linhas na Home: 8 livros × dezenas de linhas vs. 3 números + 1 data por livro. Por quê não RPC nova: o prefetch da Home já chama este endpoint; um segundo round-trip é desnecessário. Contrato 001 §1.6 autoriza colunas extras.

### 2.4 Virada de meia-noite (spec §9)

**Decisão:** **não** há timer à meia-noite. `hoje` é capturado no momento do cálculo (render / `useMemo`). Recarregar no dia seguinte usa o novo hoje. RPC usa `CURRENT_TIMESTAMP` no request.

### 2.5 Copy

- Sempre (há cronograma): `Data prevista de término: ${DateUtils.formatForDisplay(predictedEnd)}`
- Se `overdueDays > 0`: `Atraso de ${n} ${n === 1 ? "dia" : "dias"}`
- Nunca: “termina X dias antes”, “dentro do prazo”, “X dias à frente”

### 2.6 100% lido

Ainda há cronograma → **mostra a data prevista** (última data ± deslocamento; com tudo lido, `overdue = 0` e `ahead` = futuros já lidos, em geral 0 se todas as datas já passaram ou foram lidas). **Não** some só porque o progresso é 100%. Some **somente** se não houver linhas.

---

## 3. Technical Context

| Item | Decisão |
| ---- | ------- |
| **Linguagem** | TypeScript estrito |
| **UI** | Next.js 15 / React 19 / Client components |
| **Estado servidor** | TanStack Query v5 (mesmo cache `progress/many`) |
| **Persistência** | Nenhuma tabela nova. 1 migration: `CREATE OR REPLACE FUNCTION` |
| **Auth** | RPC continua `SECURITY INVOKER` + `owner = auth.uid()` (RN44) |
| **Testes** | Vitest + Testing Library |
| **Localização** | pt-BR |
| **Hoje** | `America/Sao_Paulo` via `Intl` no client e `AT TIME ZONE` no SQL |

---

## 4. Project Structure

### 4.1 Novos arquivos

```text
src/modules/schedule/
├── types/
│   └── schedulePace.types.ts
├── utils/
│   ├── getTodayInSaoPaulo.ts
│   ├── getTodayInSaoPaulo.test.ts
│   ├── addCalendarDays.ts
│   ├── addCalendarDays.test.ts
│   ├── computeSchedulePace.ts
│   ├── computeSchedulePace.test.ts
│   ├── formatSchedulePaceLabels.ts
│   └── formatSchedulePaceLabels.test.ts
├── hooks/
│   ├── useScheduleReadingPace.ts          # deriva das linhas (tela /schedule)
│   └── useScheduleReadingPace.spec.ts
└── components/
    └── schedulePaceLabel/
        ├── schedulePaceLabel.tsx
        ├── schedulePaceLabel.test.tsx
        ├── types/schedulePaceLabel.types.ts
        └── index.ts

supabase/migrations/
└── YYYYMMDDHHMMSS_schedule_progress_pace_columns.sql
```

### 4.2 Arquivos alterados (deltas)

```text
src/modules/schedule/types/readingProgress.types.ts
  + overdue, ahead, last_date no Persistence; Pace opcional no Domain ou tipo irmão

src/modules/schedule/utils/computeReadingProgress.ts
  - NÃO misturar regra de prazo aqui. Mapear campos novos no hook many.

src/modules/schedule/hooks/useReadingProgressMany.ts
  - Mapear overdue/ahead/last_date → SchedulePaceDomain via computeSchedulePaceFromAggregates

src/modules/schedule/hooks/useBookCardScheduleProgress.ts
  - Passar a expor `pace` além de `progress`

src/modules/schedule/components/readingProgressIndicator/cardReadingProgressIndicator.tsx
  - Compor <SchedulePaceLabel /> abaixo do progresso quando pace != null

src/modules/schedule/components/readingProgressIndicator/pageReadingProgressIndicator.tsx
  - Compor <SchedulePaceLabel /> (pace via useScheduleReadingPace)

src/modules/schedule/hooks/index.ts
  - Exportar useScheduleReadingPace

src/app/api/schedule/progress/route.test.ts
  - Aceitar payload com colunas extras (fixture)

.sdd/specs/001-.../contracts  NÃO reescrever; 003 documenta a extensão
```

`BookCard` em si **não** precisa de novo wiring se o card indicator já compõe o label (mesmo `showReadingProgress`).

---

## 5. Detalhamento de implementação

### 5.1 Função pura `computeSchedulePace`

Entrada: linhas `{ date: Date /* dia calendário */, completed: boolean }[]` e `today: Date`.

```text
overdueDays = count(date <= today && !completed)
aheadDays   = count(date > today && completed)
lastDate    = max(date)
predictedEndDate = addCalendarDays(lastDate, overdueDays - aheadDays)
status = overdueDays > 0 ? "behind" : aheadDays > 0 ? "ahead" : "on_time"
```

Devolve `null` se `linhas.length === 0`.

`computeSchedulePaceFromAggregates({ overdue, ahead, lastDate })` aplica a **mesma** fórmula da data e do status, para a Home sem as linhas.

Datas de `ScheduleDomain.date` (string `DD/MM/AAAA`) → `DateUtils.ptBRToISO` + `DateUtils.toDate`.

`getTodayInSaoPaulo()`: `Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" })` → `YYYY-MM-DD` → `DateUtils.toDate`.

`addCalendarDays(date, n)`: soma `n` (pode ser negativo) no calendário local do `Date` já normalizado ao meio-dia (padrão `DateUtils`).

### 5.2 RPC

```sql
CREATE OR REPLACE FUNCTION public.get_schedule_progress_for_books(book_ids uuid[])
RETURNS TABLE (
  book_id   uuid,
  total     bigint,
  completed bigint,
  overdue   bigint,
  ahead     bigint,
  last_date date
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT
    s.book_id,
    COUNT(*)::bigint AS total,
    COUNT(*) FILTER (WHERE s.completed)::bigint AS completed,
    COUNT(*) FILTER (
      WHERE s.date <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
        AND NOT COALESCE(s.completed, false)
    )::bigint AS overdue,
    COUNT(*) FILTER (
      WHERE s.date > (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
        AND COALESCE(s.completed, false)
    )::bigint AS ahead,
    MAX(s.date) AS last_date
  FROM public.schedule s
  WHERE s.owner = auth.uid()
    AND s.book_id = ANY(book_ids)
  GROUP BY s.book_id
  HAVING COUNT(*) > 0;
$$;
```

GRANTs iguais aos atuais. Sem índice novo (`schedule(owner, book_id)` já existe na 001).

### 5.3 Hooks

**`useScheduleReadingPace(schedule)`** — `useMemo` → `computeSchedulePace(rows, getTodayInSaoPaulo())`. Sem fetch.

**`useReadingProgressMany`** — para cada item da RPC, além de `computeReadingProgress`, chama `computeSchedulePaceFromAggregates`. Expõe `paceByBookId` **ou** anexa `pace` no retorno do card hook.

**`useBookCardScheduleProgress`** — `{ progress, pace, isLoading, isError, showNoScheduleCta }`. `pace === null` quando não há cronograma (mesmo critério de `progress === null`).

Invalidação: a já existente em `useOptimisticScheduleReadToggle` (`invalidateReadingProgressManyCaches`) atualiza a Home. Tela `/schedule` é 100% derivada das linhas otimistas.

### 5.4 Componente `<SchedulePaceLabel />`

Apresentacional. Props: `pace: SchedulePaceDomain | null`. `null` → `null`.

Dois textos (FR-009 / FR-015):

1. `Data prevista de término: {pt-BR}`
2. Se `status === "behind"`: `Atraso de {n} dia(s)`

`aria-label` concatenando os dois. Cor pode reforçar atraso (âmbar) sem substituir o texto.

Variantes visuais `card` (texto `text-xs`, centro, densidade do card) e `page` (dentro/abaixo do cartão de progresso).

### 5.5 Tipos

```text
SchedulePaceStatus = "on_time" | "ahead" | "behind"

SchedulePaceDomain = {
  status: SchedulePaceStatus
  overdueDays: number
  aheadDays: number
  plannedEndDate: Date
  predictedEndDate: Date
}

ReadingProgressPersistence += {
  overdue: number
  ahead: number
  last_date: string  // ISO yyyy-mm-dd
}
```

Tipos **não** ficam no arquivo do componente.

### 5.6 Defesa em payload antigo

Se um ambiente ainda não aplicou a migration, `overdue`/`ahead`/`last_date` podem vir `undefined`. O mapper trata ausência como “sem pace” (`null`) — o progresso continua funcionando. Não quebra a Home.

---

## 6. Fluxo de dados

### Home

1. Prefetch atual `GET /api/schedule/progress` (inalterado na URL).
2. RPC devolve colunas extras.
3. `useBookCardScheduleProgress` lê `pace` do cache.
4. Sem entrada no cache → sem label (FR-006). `showNoScheduleCta` permanece.

### Cronograma

1. `useSchedule` já tem linhas.
2. `useScheduleReadingPace(schedule)` calcula.
3. Toggle otimista muda `completed` → `useMemo` recalcula (SC-005).

---

## 7. Plano de testes

| Arquivo | Cobre |
| ------- | ----- |
| `computeSchedulePace.test.ts` | em dia; atraso 2 vencidos; futuro não lido sem atraso; leu o de amanhã antecipa 1 dia; antes do início 0 lidos; misto atraso+adianto; lista vazia → null; datas desordenadas |
| `addCalendarDays.test.ts` | +n, −n, virada de mês |
| `getTodayInSaoPaulo.test.ts` | fake timers perto da meia-noite UTC vs SP |
| `formatSchedulePaceLabels.test.ts` | copy; singular/plural; sem “termina X dias antes” |
| `useScheduleReadingPace.spec.ts` | deriva das linhas; vazio → null |
| `schedulePaceLabel.test.tsx` | null → null; data; atraso visível só se behind; ARIA |
| `useReadingProgressMany.spec.ts` | mapeia colunas novas; ausência de colunas → pace null |
| `route.test.ts` | 200 ignora/aceita campos extras |

Cobertura: utils e formatters 100% statements/branches; hook e componente ≥ 90%.

---

## 8. Migração e implantação

1. Migration RPC (substitui função; rollback = restaurar assinatura antiga da 001).
2. Tipos + `computeSchedulePace` + testes.
3. Hooks + label + composição nos indicators.
4. Smoke: Home com/sem cronograma; tela schedule toggle.

Sem feature flag. RPC falha → rota 500 → card já oculta progresso/pace (FR-014).

---

## 9. Conformidade com regras do projeto

| Diretriz | Como |
| -------- | ---- |
| Hook-First | Cálculo em `computeSchedulePace` + hooks; UI só pinta |
| `useMemo` / `useCallback` | `useScheduleReadingPace` e mapeamento many |
| Tipos fora do componente | `schedulePace.types.ts` + `types/` do label |
| Default export + barrel | pasta `schedulePaceLabel/` |
| Imports | externos → `@/` → relativos |
| pt-BR | copy e `formatForDisplay` |
| RN44 | RPC inalterada em owner |
| RN48 | GET existente, sem mutação nova |
| RN61 | progresso intocado na fórmula |
| RN55 | `isShelf` já esconde o bloco de progresso do card |

---

## 10. Sequenciamento

| Lote | Conteúdo |
| ---- | -------- |
| L1 | Migration RPC + verificação Studio |
| L2 | `getTodayInSaoPaulo`, `addCalendarDays`, `computeSchedulePace`, labels + testes |
| L3 | Tipos persistence + mapper no `useReadingProgressMany` + `useBookCardScheduleProgress` |
| L4 | `useScheduleReadingPace` |
| L5 | `<SchedulePaceLabel />` + composição card/page |
| L6 | Ajustar testes da rota/many |
| L7 | Vault: nota da feature + RN após entrega |

**Estimativa:** ~6h focadas.

---

## 11. Riscos pós-Plan

- **R-05 — Migration não aplicada em um ambiente:** mapper degrada pace para `null`.
- **R-06 — `last_date` serializado como string ISO:** parse único via `DateUtils.toDate`.
- **R-07 — Card denso:** label em `text-xs` abaixo da %; se estourar, truncar com `title` nativo — validar no smoke.

---

## 12. Próximos passos

Pós-aprovação deste Plan → `tasks` gerando `tasks.md` por User Story (US1 data prevista, US2 atraso, US3 adiantamento, US4 toggle, US5 ausência).
