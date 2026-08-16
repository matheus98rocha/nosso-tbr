# Tasks: Status de Prazo da Leitura no Cronograma

**Feature ID:** 003  
**Spec:** [spec.md](./spec.md)  
**Plan:** [plan.md](./plan.md)  
**Data model:** [data-model.md](./data-model.md)  
**Criada em:** 2026-08-16

---

## Legenda

- `[P]` — pode rodar em paralelo com outras `[P]` da **mesma** fase, desde que não compartilhem o mesmo arquivo.
- `[USn]` — pertence à User Story n.
- Independente: cada história P1 deve ser testável sem as P2.

**Ordem entre fases:** 1 → 2 → 3 (MVP) → demais. Não pular a Foundational.

---

## Phase 1: Setup

- [x] T001 Criar `src/modules/schedule/types/schedulePace.types.ts` com `SchedulePaceStatus`, `SchedulePaceDomain` e o input de agregados (`overdue`, `ahead`, `lastDate`) conforme `data-model.md` §2
- [x] T002 [P] Estender `ReadingProgressPersistence` em `readingProgress.types.ts` com `overdue?`, `ahead?`, `last_date?` opcionais (RPC antiga não quebra o progresso)

---

## Phase 2: Foundational (pré-requisito de todas as US)

Função pura + RPC. Sem UI ainda.

- [x] T003 [P] Implementar `getTodayInSaoPaulo` + `getTodayInSaoPaulo.test.ts` (fake timers: meia-noite UTC vs America/São_Paulo)
- [x] T004 [P] Implementar `addCalendarDays` + `addCalendarDays.test.ts` (`+n`, `−n`, virada de mês)
- [x] T005 Implementar `computeSchedulePace` e `computeSchedulePaceFromAggregates` em `computeSchedulePace.ts` + `computeSchedulePace.test.ts` cobrindo: lista vazia → `null`; em dia → `predictedEnd = lastDate`; 2 vencidos não lidos → `behind` e data +2; futuros não lidos **não** atrasam; leu o de amanhã → `ahead` e data −1; antes do início + 0 lidos → `on_time` e atraso 0; misto vencido+futuro lido → `behind` com os dois deslocamentos; datas desordenadas
- [x] T006 [P] Implementar `formatSchedulePaceLabels` + testes: sempre `Data prevista de término: DD/MM/AAAA`; atraso só se `behind`; singular/plural; **nunca** a string `termina` + `dias antes`
- [x] T007 Migration `supabase/migrations/20260816220000_schedule_progress_pace_columns.sql` com `CREATE OR REPLACE` da RPC (`overdue`, `ahead`, `last_date`, `hoje` via `America/Sao_Paulo`), mesmos `GRANT`/`REVOKE` da 001 — contrato em `contracts/rpc-spec.sql`
- [x] T008 Mapear persistência → `paceByBookId` em `useReadingProgressMany` via `computeSchedulePaceFromAggregates`; campos ausentes → `pace` `null`; estender `useReadingProgressMany.spec.ts` (payload completo e payload só `total`/`completed`)

**Checkpoint:** testes de T003–T006 e T008 passam; migration aplicada no ambiente de destine; `GET /api/schedule/progress` devolve as colunas novas sem quebrar o progresso.

---

## Phase 3: User Story 1 (P1) — Data prevista de término 🎯 MVP

- [x] T009 [US1] Incluir `paceByBookId` em `ScheduleProgressBatchContext` e em `useHomeReadingProgressBatch`; ajustar fixtures de `src/modules/home/index.test.tsx` e `index.bookUpsertLift.test.tsx`
- [x] T010 [US1] Expor `pace` em `useBookCardScheduleProgress` (batch + fallback) + casos em `useBookCardScheduleProgress.spec.ts` (`pace` presente / ausente / CTA sem cronograma)
- [x] T011 [P] [US1] Criar `useScheduleReadingPace` (linhas `ScheduleDomain` + `getTodayInSaoPaulo` + `computeSchedulePace`, `useMemo`) + `useScheduleReadingPace.spec.ts`; exportar no barrel `hooks/index.ts`
- [x] T012 [US1] Criar `<SchedulePaceLabel />` (apresentacional, tipos em `types/`, barrel, default export) variantes `card` | `page`: `pace === null` → `null`; texto da data prevista; `aria-label` com o mesmo significado
- [x] T013 [US1] Compor o label em `pageReadingProgressIndicator` via `useScheduleReadingPace(schedule)` abaixo do progresso
- [x] T014 [US1] Compor o label em `cardReadingProgressIndicator` quando `pace != null` (mesmo critério de cronograma existente; loading/erro inalterados)

**Checkpoint US1:** com cronograma em dia, tela `/schedule` e card da Home mostram `Data prevista de término: {última data}`; sem cronograma a data não aparece. Independente de atraso/adiantamento na UI (cálculo já coberto em T005).

---

## Phase 4: User Story 2 (P1) — Atraso só de dias vencidos

- [x] T015 [US2] Em `<SchedulePaceLabel />` renderizar `Atraso de X dia(s)` **somente** se `status === "behind"`; testes de componente: 2 dias / 1 dia; futuro não lido não mostra atraso; cor não substitui o texto
- [x] T016 [P] [US2] Garantir no teste de `computeSchedulePace` (já T005) o caso “hoje anterior à primeira data, zero lidos → sem atraso”; se faltar assert de labels, acrescentar em `formatSchedulePaceLabels.test.ts`

**Checkpoint US2:** 2 vencidos em aberto → `Atraso de 2 dias` e data prevista depois do plano; futuros abertos → sem linha de atraso.

---

## Phase 5: User Story 3 (P1) — Adiantar a data ao ler o de amanhã

- [x] T017 [US3] Teste de componente/label: `ahead` com `overdue = 0` mostra data **anterior** à última planejada e **não** mostra atraso nem a substring `termina`/`dias antes`
- [x] T018 [P] [US3] Teste de `useScheduleReadingPace`: linhas com vencidos lidos + 1 futuro lido → `status === "ahead"` e `predictedEndDate` = last − 1 dia

**Checkpoint US3:** leu hoje o de amanhã → nova data prevista mais cedo; copy proibida ausente.

---

## Phase 6: User Story 4 (P2) — Toggle atualiza na hora

- [x] T019 [US4] Teste de `useScheduleReadingPace`: rerender com a mesma lista e `completed` de um dia futuro (ou vencido) alterado → `predictedEndDate` / `status` mudam **sem** novo fetch (assert: `ReadingProgressService.getMany` não entra neste hook)
- [x] T020 [US4] Smoke do `pageReadingProgressIndicator` (ou do `index` de schedule com schedule mockado): após mudar `schedule` nas props, o texto da data/atraso muda. A invalidação `many` da Home **já existe** no toggle — não duplicar; só confirmar que o card passa a ler `pace` do cache após `onSettled` (teste do many/card se ainda não cobrir)

**Checkpoint US4:** marcar amanhã antecipa a data; desmarcar vencido mostra `Atraso de 1 dia`.

---

## Phase 7: User Story 5 (P2) — Ausência sem cronograma

- [x] T021 [US5] `useScheduleReadingPace([])` / `undefined` → `null`; página com `emptySchedule` não monta o label (só o form atual)
- [x] T022 [US5] Card: `showNoScheduleCta` continua; **não** renderiza `Data prevista de término`; estante/`showReadingProgress === false` continua sem o bloco (regressão `useBookCard` / `bookCard.test.tsx` se necessário)

**Checkpoint US5:** zero rótulo de prazo sem cronograma nas duas superfícies.

---

## Phase 8: Polish & cross-cutting

- [x] T023 [P] Atualizar `src/app/api/schedule/progress/route.test.ts` para aceitar/ignorar `overdue`, `ahead`, `last_date` no fixture de 200 (contrato 003; auth 401 inalterado)
- [x] T024 [P] Ajustar `readingProgress.service.test.ts` se o tipo persistência quebrar mocks
- [x] T025 Acessibilidade: `schedulePaceLabel.test.tsx` — `aria-label` inclui data e, se behind, o atraso; informação não depende só de cor
- [x] T026 Após implementação estável: promover RNxx-01..12 em `C:\www\second_brain\01-Projetos\nosso-tbr\business-rules.md` e atualizar `features/feature-status-prazo-cronograma.md` para status entregue — **não** bloquear o merge de código

---

## Mapa spec → tasks

| Item | Tasks |
| ---- | ----- |
| US1 / FR-005 data prevista | T009–T014 |
| US2 / RNxx-04 atraso vencido | T005, T015–T016 |
| US3 / RNxx-05..09 adiantamento | T005, T017–T018 |
| US4 / FR-011 toggle | T019–T020 |
| US5 / FR-006 ausência | T021–T022 |
| FR-004 zero persistência | T007 (só replace de função), T001–T006 client |
| SC-002 copy | T006, T015, T017, T025 |
| SC-003 sem coluna em `schedule` | T007 |

---

## Dependências

```
T001, T002
    → T003, T004 (paralelos)
    → T005 (usa T003/T004)
    → T006 (usa T005 domain)
    → T007 (paralelo a T003–T006)
    → T008 (usa T002 + T005 + T007 no ambiente)
    → T009 → T010 → T014 (Home)
    → T011 → T013 (página)
    → T012 (antes de T013/T014)
    → T015–T018 (UI das regras já em T005)
    → T019–T022
    → T023–T026
```
