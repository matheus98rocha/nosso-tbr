# RPC Contract — Comunidade (feature 005)

**Feature ID:** 005  
**Auth:** `authenticated` only  
**Security:** `SECURITY INVOKER` (RLS de `books` aplica)

Não há HTTP. Chamadas: `supabase.rpc("get_community_reader_genres")` e `supabase.rpc("get_community_reader_activity")`.

---

## 1. Semântica — `get_community_reader_genres`

Para o **visitante atual** (`auth.uid()`), devolve pares (leitor, gênero) com:

- `registered_count`: livros visíveis em que o leitor participa e o gênero está preenchido (qualquer status).
- `finished_count`: subconjunto com `status = 'finished'`.

Participação: `reader_id = ANY(books.readers) OR books.chosen_by = reader_id`.

O app deriva “mais lido” / “mais cadastrado” com `pickTopGenre` (empate pelo rótulo pt-BR).

### Exemplo de linha

```json
{
  "reader_id": "a1f2c3e4-1234-5678-9abc-def012345678",
  "gender": "fantasy",
  "finished_count": 4,
  "registered_count": 7
}
```

Leitor sem gênero visível: **ausente** do array.

Livro solo privado de B: entra nas linhas de B **somente** se o visitante é B ou segue B (mesma regra de `is_book_visible_to_current_user`).

---

## 2. Semântica — `get_community_reader_activity`

Uma linha por leitor com pelo menos um livro visível:

- `registered_count`: qualquer status visível (incluindo livros sem gênero).
- `finished_count`: `status = 'finished'`.
- `currently_reading_title`: título do `reading` visível com `start_date` mais recente (`null` se não houver).

```json
{
  "reader_id": "a1f2c3e4-1234-5678-9abc-def012345678",
  "registered_count": 12,
  "finished_count": 8,
  "currently_reading_title": "O Nome do Vento"
}
```

Leitor sem livros visíveis: **ausente** (o app assume 0 / 0 / null).

---

## 3. Erros

| Caso | Comportamento |
| ----- | ------------- |
| `anon` | sem `GRANT`; PostgREST 401/permission denied |
| sem linhas visíveis | `[]` |

---

## 4. Não há

- Parâmetros (o visitante é `auth.uid()`)
- Inclusão forçada do próprio usuário (o client já exclui; a RPC pode devolver o viewer e o mapper ignora)
- Rótulo pt-BR de gênero (só o value de `books.gender`)
