# Nosso TBR - Business Rules & Domain Logic

## 1. Book Creation & Validation (Schema)

- **RN01 - Campos Obrigatórios:** `title`, `author_id` e `readers` são estritamente obrigatórios.
- **RN02 - Curadoria (chosen_by):** Aceita apenas: "Matheus", "Fabi" ou "Barbara".
- **RN03 - Integridade de Páginas:** O campo `pages` deve ser um número inteiro e positivo.
- **RN04 - Segurança de Imagem:** `image_url` deve ser uma URL válida e pertencer obrigatoriamente aos domínios Amazon (`amazon.com`, `amazon.com.br`, `media-amazon.com`, `m.media-amazon.com`, `ssl-images-amazon.com`).

## 2. Listing, Search & Pagination

- **RN05 - Paginação:** O tamanho padrão da página é de 8 itens (`PAGE_SIZE = 8`).
- **RN06 - Filtro de Leitores (Leituras Conjuntas):**
  - Sem seleção explícita de leitores (`filters.readers` vazio), a UI deve considerar **todos os leitores como ativos**.
  - Nesse estado "todos selecionados", a query **não deve aplicar filtro de `readers`** (envio de array vazio) para evitar restrição indevida por combinação exata.
  - Com seleção parcial, a query deve enviar apenas os leitores selecionados.
- **RN07 - Sincronização em Busca (Retry Logic):** Ao buscar um livro específico (`bookId` ou `searchQuery`) estando logado: se a API retornar vazio, disparar erro "Sincronizando novo livro..." e realizar 2 retries (delay de 1s).
- **RN08 - Reset de Estado:** Qualquer alteração em filtros ou na `searchQuery` deve resetar obrigatoriamente a `currentPage` para 0.
- **RN09 - Limpeza de Filtros:** O botão "Limpar" deve ficar ativo apenas se houver busca ativa, filtros de gênero/status/ano selecionados ou se o filtro de leitores for diferente do padrão.
- **RN16 - Filtro de Ano Híbrido (Query):** O filtro por ano deve retornar livros que foram **finalizados** naquele ano (`end_date`) OU que foram **planejados** para iniciar naquele ano (`planned_start_date`).

## 3. Book Status & Lifecycle

- **RN10 - Estados Permitidos:** `not_started`, `planned`, `reading` e `finished`.
- **RN11 - Lógica do Status "Planned" (UI):**
  - Se possuir `planned_start_date`: Exibir "Início: [Data Formatada]" (Ex: 15 mar).
  - Se NÃO possuir data: Exibir "Vou ler".
- **RN12 - Toggle de Status:** A seleção de status é cumulativa. Clicar em um status ativo deve removê-lo; clicar em um inativo deve adicioná-lo ao array de filtros.
- **RN17 - Definição Técnica de Estados (Query):**
  - **Not Started:** `start_date` IS NULL AND `planned_start_date` IS NULL.
  - **Planned:** `start_date` IS NULL AND `planned_start_date` NOT IS NULL.
  - **Reading:** `start_date` NOT IS NULL AND `end_date` IS NULL.
  - **Finished:** `start_date` NOT IS NULL AND `end_date` NOT IS NULL.

## 4. UI, Sharing & Deletion

- **RN13 - Compartilhamento WhatsApp:** A URL deve conter o base path do Vercel e o título do livro encodado no parâmetro `search`.
- **RN14 - Deleção Lógica vs. Física:**
  - Excluir via `BookService`: Remove o livro permanentemente da base.
  - Excluir via `BookshelfService`: Remove apenas o vínculo do livro com a estante específica (módulo Shelves).
- **RN15 - Mobile Touch Targets:** Elementos interativos (Dropdowns, Cards) devem seguir o padrão de acessibilidade para touch. Elementos de menu (ellipsis) devem ter áreas de clique de no mínimo 44x44px.
