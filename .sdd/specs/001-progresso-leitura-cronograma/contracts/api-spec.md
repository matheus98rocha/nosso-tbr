# API Contract — Reading Progress

**Feature ID:** 001
**Endpoint introduzido:** `GET /api/schedule/progress`

---

## 1. `GET /api/schedule/progress`

### 1.1 Propósito

Retornar, para um conjunto de `bookIds` informados na query string, o agregado `(total, completed)` do cronograma do **usuário autenticado** (`auth.uid()`).

### 1.2 Autenticação e autorização

- **Sessão obrigatória** via `requireUser(supabase)` (mesmo padrão do POST/DELETE em `/api/schedule`).
- **Anônimo:** rota responde `401 Unauthorized`.
- **Autenticado mas sem cronograma para nenhum dos bookIds:** rota responde `200 OK` com array vazio. NÃO é erro.
- **Backend honra RN44:** a RPC chamada internamente filtra `owner = auth.uid()`, então mesmo que o cliente envie `bookIds` de livros que ele não criou cronograma, a resposta omite essas entradas (alinhado à I-03 do `data-model.md`).

### 1.3 Request

**Método:** `GET`

**Path:** `/api/schedule/progress`

**Query params:**

| Param      | Tipo                          | Obrigatório | Validação                                                                              |
| ---------- | ----------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| `bookIds`  | CSV de UUIDs (`a,b,c,d,...`)  | Sim         | ≥ 1 UUID. Cada elemento deve ser UUID v4 válido. Limite máximo: **100 UUIDs por chamada** (proteção contra abuso). |

**Exemplo:**

```http
GET /api/schedule/progress?bookIds=a1f2c3e4-1234-5678-9abc-def012345678,b2g3d4f5-2345-6789-abcd-ef0123456789
Cookie: sb-access-token=...; sb-refresh-token=...
```

### 1.4 Response

**Sucesso — `200 OK`**

Content-Type: `application/json`

```json
[
  {
    "book_id": "a1f2c3e4-1234-5678-9abc-def012345678",
    "total": 12,
    "completed": 5
  },
  {
    "book_id": "b2g3d4f5-2345-6789-abcd-ef0123456789",
    "total": 8,
    "completed": 8
  }
]
```

**Garantias do payload:**

- Array de objetos (nunca `null`).
- Ordem **não garantida** (cliente deve indexar por `book_id` — `Map<bookId, ProgressDomain>`).
- Cada item satisfaz `0 <= completed <= total` e `total > 0` (I-02 / I-03).
- Apenas livros que possuem cronograma do usuário aparecem (livros sem schedule são omitidos — alinhado a FR-004).
- Headers: `Cache-Control: no-store` (alinhado ao padrão de outras rotas autenticadas como `GET /api/users`).

### 1.5 Erros

| Status | Cenário                                                                         | Body                                                                                                                |
| ------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `400`  | `bookIds` ausente, vazio após `split(",")`, ou contém valor não-UUID.           | `{ "error": "Invalid bookIds", "details": { ... } }` (saída do `z.array(z.string().uuid())`)                        |
| `400`  | `bookIds` excede 100 elementos.                                                 | `{ "error": "Too many bookIds (max 100)" }`                                                                         |
| `401`  | Sessão ausente ou inválida.                                                     | `{ "error": "Unauthorized" }` (mesma forma de `requireUser`)                                                        |
| `500`  | Falha na RPC ou conexão Supabase.                                               | `{ "error": "<message>" }` (mensagem do erro Postgres, alinhada ao padrão das outras rotas de `/api/schedule`)      |

### 1.6 Estabilidade do contrato

- **Adição compatível:** novos campos no objeto retornado (ex.: `percentage`, `last_completed_at`) podem ser adicionados sem versionar. Clientes ignoram campos desconhecidos.
- **Remoção/renomeação:** quebra compatibilidade — exigirá nova versão da rota.

---

## 2. Validação Zod (referência)

```text
import { z } from "zod";

const querySchema = z.object({
  bookIds: z.string()
    .min(1, "bookIds required")
    .transform((s) => s.split(","))
    .pipe(z.array(z.string().uuid()).min(1).max(100)),
});
```

(implementação efetiva fica em `src/app/api/schedule/progress/route.ts` na fase Implement)

---

## 3. Fluxo server (referência)

```
1. const auth = await requireUser(supabase);
   if (auth.errorResponse) return auth.errorResponse;
2. parse query (querySchema) → bookIds: string[]
3. const { data, error } = await supabase.rpc("get_schedule_progress_for_books", {
     book_ids: bookIds,
   });
4. if (error) → 500
5. return NextResponse.json(data ?? [], {
     status: 200,
     headers: { "Cache-Control": "no-store" },
   });
```

---

## 4. Compatibilidade

- **Não substitui** nem altera `POST /api/schedule`, `DELETE /api/schedule`, nem `PATCH /api/schedule/[id]`.
- **Não interage** com `/api/books`, `/api/users`, ou outras rotas. Acoplamento estritamente isolado.

---

## 5. Testes obrigatórios (referência)

| Caso                                                                                 | Status esperado                                |
| ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Sem sessão.                                                                          | `401`                                          |
| Sessão válida, `?bookIds=` ausente.                                                  | `400` "Invalid bookIds"                        |
| Sessão válida, UUID malformado.                                                      | `400` "Invalid bookIds"                        |
| Sessão válida, > 100 UUIDs.                                                          | `400` "Too many bookIds"                       |
| Sessão válida, lista de UUIDs onde NENHUM tem cronograma.                            | `200`, body `[]`                               |
| Sessão válida, lista mista (alguns têm cronograma, outros não).                      | `200`, body só com os que têm cronograma.      |
| Sessão válida, lista contendo bookId de cronograma de OUTRO usuário (`userY`).       | `200`, body omite essa entrada (RN44 garantido pela RPC). |
| Falha simulada no `supabase.rpc`.                                                    | `500` com mensagem do erro.                    |
