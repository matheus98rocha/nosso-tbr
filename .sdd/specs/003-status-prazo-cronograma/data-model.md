# Data Model: Status de Prazo da Leitura no Cronograma

**Feature ID:** 003  
**Status:** Draft (acompanha `plan.md`)

---

## 1. Visão geral

**Zero tabelas novas. Zero colunas novas em `schedule`.** O prazo é **derivado** das linhas já existentes (`date`, `completed`, `owner`, `book_id`).

Na tela de Cronograma a derivação é **só no client** (array já carregado).

Na Home a derivação usa a RPC **já existente** `get_schedule_progress_for_books`, **estendida** com três campos agregados (`overdue`, `ahead`, `last_date`). Isso não é schema de tabela; é assinatura de função.

```
public.schedule (date, completed, owner, book_id)
        │
        ├─ tela /schedule → computeSchedulePace(linhas, hoje_sp)
        │
        └─ RPC get_schedule_progress_for_books
              + overdue, ahead, last_date
              → computeSchedulePaceFromAggregates
              → BookCard
```

---

## 2. Entidades lógicas (client)

### 2.1 `SchedulePaceDomain`

| Campo | Tipo | Origem |
| ----- | ---- | ------ |
| `status` | `"on_time" \| "ahead" \| "behind"` | `overdueDays > 0` → behind; senão `aheadDays > 0` → ahead; senão on_time |
| `overdueDays` | `number` | linhas `date ≤ hoje` e não lidas |
| `aheadDays` | `number` | linhas `date > hoje` e lidas |
| `plannedEndDate` | `Date` | `max(date)` |
| `predictedEndDate` | `Date` | `plannedEndDate + overdueDays − aheadDays` (dias corridos) |

`null` quando não há linhas (sem cronograma).

### 2.2 Extensão de `ReadingProgressPersistence` (wire)

| Campo | Tipo SQL | JSON | Notas |
| ----- | -------- | ---- | ----- |
| `book_id` | uuid | string | já existia |
| `total` | bigint | number | já existia |
| `completed` | bigint | number | já existia |
| `overdue` | bigint | number | **novo** |
| `ahead` | bigint | number | **novo** |
| `last_date` | date | string `YYYY-MM-DD` | **novo** |

Ausência dos três novos (RPC antiga) → client não monta `SchedulePaceDomain`.

---

## 3. Relacionamentos

Nenhuma FK nova. Continua `schedule.book_id → books.id` e `schedule.owner → auth.uid()` (RN44).

---

## 4. Invariantes

- **I-01:** `overdueDays` só conta `date ≤ hoje_sp` e não lido.
- **I-02:** linha com `date > hoje_sp` nunca incrementa `overdueDays`.
- **I-03:** `aheadDays` só conta `date > hoje_sp` e lido.
- **I-04:** `predictedEndDate = plannedEndDate + overdueDays − aheadDays`.
- **I-05:** lista vazia → sem domínio de prazo (oculto).
- **I-06:** isolamento: RPC e tela só veem `owner = auth.uid()`.

---

## 5. Ciclo de vida

| Evento | Efeito |
| ------ | ------ |
| Criar cronograma | Home passa a receber linha da RPC (inclui `last_date`); labels aparecem |
| Marcar lido (passado) | `overdue` pode cair; data prevista pode antecipar |
| Marcar lido (futuro) | `ahead` sobe; data prevista antecipa; atraso inalterado se ainda houver vencidos |
| Desmarcar vencido | `overdue` sobe; data prevista posterga; “Atraso de …” aparece |
| Apagar cronograma | RPC omite o livro; labels somem |
| Virar o dia (novo request) | `hoje_sp` na RPC muda; vencidos novos entram em `overdue` |

Nada disso `INSERT/UPDATE` campos de prazo. Só `completed` / linhas já existentes.

---

## 6. Performance

Agregação extra na mesma `GROUP BY` da RPC atual. Índice `schedule(owner, book_id)` da 001 continua suficiente. Payload: ~3 números + 1 data por livro (~30 bytes a mais).

---

## 7. Segurança

Igual à 001: `SECURITY INVOKER`, `WHERE owner = auth.uid()`, `GRANT` só `authenticated`, rota `requireUser`. Sem RPC extra, sem superfície anônima.

---

## 8. Evolução futura (fora do MVP)

- Reaplicar calendário “sem fim de semana” no deslocamento da data prevista.
- Timer à meia-noite com a tela aberta.
- Rótulo em estantes.

---

## 9. Resumo

- **0 tabelas, 0 colunas em `schedule`.**
- **1 `CREATE OR REPLACE FUNCTION`** com 3 colunas agregadas novas.
- **1 tipo de domínio no client** (`SchedulePaceDomain`).
