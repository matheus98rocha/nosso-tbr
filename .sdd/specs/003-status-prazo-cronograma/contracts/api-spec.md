# API / RPC Contract — Extensão de prazo (feature 003)

**Feature ID:** 003  
**Base:** `.sdd/specs/001-progresso-leitura-cronograma/contracts/`  
**Mudança:** aditiva e compatível (clientes antigos ignoram campos novos).

---

## 1. HTTP — inalterado

`GET /api/schedule/progress?bookIds=` permanece igual em URL, auth (401), validação (400) e `Cache-Control: no-store`.

O JSON de cada item **ganha** campos:

```json
{
  "book_id": "a1f2c3e4-1234-5678-9abc-def012345678",
  "total": 10,
  "completed": 6,
  "overdue": 0,
  "ahead": 1,
  "last_date": "2026-08-10"
}
```

| Campo | Semântica |
| ----- | --------- |
| `overdue` | Dias com `date ≤ hoje (America/Sao_Paulo)` e não concluídos |
| `ahead` | Dias com `date > hoje` e concluídos |
| `last_date` | `MAX(date)` do cronograma do owner naquele livro |

Livros sem cronograma continuam **omitidos** do array.

---

## 2. SQL — `CREATE OR REPLACE`

Ver `rpc-spec.sql` neste diretório. GRANTs iguais à 001. Sem `DROP` da função antiga além do replace (mesmo nome e argumento `uuid[]`; **muda** `RETURNS TABLE`).

**Nota de deploy:** PostgREST/Supabase client passa a receber as colunas novas no mesmo `rpc`. Testes da rota 001 devem aceitar o objeto estendido.

---

## 3. Não há

- Novo path HTTP
- POST/PATCH/DELETE
- Body de mutação
- Campo gravado em `public.schedule`
