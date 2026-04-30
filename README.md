## 📚 Nosso TBR

**Nosso TBR** é uma aplicação para organização e acompanhamento de leituras, feita para ajudar leitores a gerenciar listas de livros, acompanhar o progresso, registrar citações, criar cronogramas de leitura e visualizar estatísticas.

Este `README` é o **documento de referência do projeto** e deve ser mantido sempre atualizado – tanto por pessoas quanto por novos agentes de IA.

---

### 🎯 Objetivo deste README (para pessoas e agentes)

- **Documentar o contexto do produto** (o que o sistema resolve e para quem).
- **Mapear as principais funcionalidades e fluxos de uso**.
- **Explicar a arquitetura e organização de pastas**.
- **Servir como guia de contribuição** (como criar novas features e como documentá‑las aqui).

Sempre que uma nova feature for criada, **atualize, no mínimo**:

- **Mapa de funcionalidades** (seção “Funcionalidades principais”).
- **Fluxos principais** (se alterarem a jornada do usuário).
- **Arquitetura / módulos** (se surgir um novo módulo em `src/modules` ou um novo serviço em `src/services`).

---

## 🚀 Como rodar o projeto

### 📦 Instalação

```bash
git clone https://github.com/seu-usuario/nosso-tbr.git
cd nosso-tbr
yarn install
```

### ▶️ Execução em desenvolvimento

```bash
yarn dev
```

### 🏗 Build e produção

```bash
# Criar a build
yarn build

# Rodar a build
yarn start
```

### 🧪 Testes

```bash
# Rodar testes com coverage
yarn test

# Rodar testes em modo watch
yarn test:watch

# UI do Vitest
yarn test:ui
```

---

## 🛠 Tecnologias e ferramentas

Projeto construído principalmente com:

- **Next.js 15** (App Router, `src/app`, `next dev --turbopack`)
- **React 19** + **TypeScript**
- **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) – banco de dados e autenticação
- **TanStack Query** (`@tanstack/react-query`) – cache e orquestração de chamadas assíncronas
- **Zustand** – store de estado global (`userStore`, hooks de autenticação etc.)
- **React Hook Form** + **Zod** – formulários tipados e validação
- **Tailwind CSS 4** + **shadcn/ui** + **Radix UI** – design system e componentes de UI
- **Vitest** + **Testing Library** – testes unitários/comportamentais

Script útil relacionado ao Supabase:

```bash
yarn update-types
```

Gera os tipos do banco em `src/types/supabase.ts` a partir do projeto configurado no Supabase.

---

## 🏗 Arquitetura geral

- **Rotas (camada de página)**
  - Local: `src/app/(main)/**/page.tsx` e `src/app/(auth)/**/page.tsx`.
  - Responsáveis por orquestrar dados de servidor/SSR e renderizar os módulos de tela.

- **Módulos de funcionalidade**
  - Local: `src/modules/<feature>/`.
  - Cada módulo concentra **componentes de tela**, **hooks**, **tipos** e, às vezes, **services específicos da feature**.

- **Serviços de domínio**
  - Exemplo: `src/services/books/` com:
    - `bookQuery.builder.ts`: construção fluente de queries (filtros de gênero, leitores, status, paginação, busca textual etc.).
    - `books.mapper.ts`: mapeamento entre dados do banco (Supabase) e o domínio (`BookDomain`).
    - `books.service.ts`: orquestração de consultas, aplicação de filtros e tratamento de erros.

- **Estado global e stores**
  - Local: `src/stores/**`.
  - Ex.: `useUserStore`, hooks de autenticação como `useIsLoggedIn`, controle de logout, etc.

- **Componentes compartilhados**
  - Local: `src/components/**`.
  - Exemplos: `ListGrid`, `confirmDialog`, componentes de UI (`button`, `card`, `pagination`, `skeleton`), etc.

> **Regra importante**: mantenha a lógica de negócio em **hooks** e **services**, deixando os componentes focados em **renderização** e **interação com o usuário**.

---

## 📚 Funcionalidades principais

Abaixo um mapa das principais telas e domínios da aplicação. Sempre que uma nova tela/fluxo importante for criado, **adicione um item aqui**.

### 🏠 Home (`/`)

- Lista de **todos os livros** cadastrados.
- **Filtros avançados** usando `BookQueryBuilder`:
  - Gênero (`gender`)
  - Leitores (ex.: “Matheus”, “Fabi”, “Barbara”)
  - Status da leitura (`not_started`, `reading`, `finished`)
  - Busca textual (título, autor, etc.).
- **Paginação** com tamanho de página fixo.
- Ações principais:
  - **Criar/editar livro** via modal `BookUpsert`.
  - **Criar/editar estante** via modal `CreateEditBookshelves`.

### 📖 Minhas Leituras (`/my-books`)

- Lista de livros **associados ao usuário logado**.
- Mesma experiência de filtros da Home (gênero, leitores, status, busca).
- Paginação própria usando o componente de `Pagination`.
- Ações principais:
- Criar/editar livro via `BookUpsert`.
  - Criar/editar estantes associadas aos livros.

### 🗂 Estantes (`/shelves` e `/bookshelves/[id]`)

- **`/shelves`** – gestão de estantes:
  - Lista de estantes (`ListGrid<BookshelfDomain>`).
  - Criação/edição de estantes (`CreateEditBookshelves`).
  - Adição de livros a uma estante via `AddBookToBookshelfDialog` (o mesmo livro não pode ser associado duas vezes à mesma estante: validação na API `POST /api/shelves/[id]/books/[bookId]`, índice único `(shelf_id, book_id)` e feedback genérico *Não é possível adicionar o livro.* quando a ação não é permitida).
- **`/bookshelves/[id]`** – livros de uma estante específica:
  - Carrega livros de uma estante com `BookshelfServiceBooks`.
  - Chips de ordenação (`SortFilterChips` com `variant="shelf"`): por **data de início** e **data de finalização** da leitura (`start_date_*` / `end_date_*`, mais antigo ↔ mais recente) e por **páginas**; escolha sincronizada à query `?sort=...` para persistir ao recarregar.
  - Renderiza os livros usando `BookCard` com contexto de estante (`isShelf`).
  - Remover pelo menu do card tira só o vínculo com aquela estante (confirmação deixa explícito que o livro não é excluído da biblioteca); a lista atualiza via invalidação da query `bookshelf-books`.

### ✍️ Autores (`/authors`)

- Tela de **CRUD de autores** com paginação, search e contagem de livros.
- Usa `AuthorsService` + `TanStack Query` para:
  - Listar autores com total de livros.
  - Buscar por nome com debounce.
  - Criar/editar autor via modal `AuthorUpsert`.
  - Deletar autores com `ConfirmDialog` e feedback via `toast`.
- Ação extra:
  - Ver livros de um autor redirecionando para a Home filtrada por `authorId`.

### 💬 Citações (`/quotes/[title]/[id]`)

- Tela de **citações ligadas a um livro específico**.
- Usa o hook `useQuotes` para:
  - Buscar citações do livro.
  - Criar/editar citação via `UpsertQuoteModal`.
  - Deletar citação com confirmação (`ConfirmDialog`).
- Interface:
  - Cards por citação (`Card` + `CardDescription`).
  - Indicação de página (`quote.page`).
  - Esqueleton loading enquanto carrega.

### 📅 Cronograma de Leitura (`/schedule/[id]/[title]`)

- Criação e acompanhamento de **cronogramas de leitura** por livro.
- Usa `useSchedule` para:
  - Criar um novo cronograma (`CreateScheduleForm`).
  - Listar cronogramas existentes em tabela (`ScheduleTable`).
  - Marcar capítulos como concluídos.
  - Excluir itens do cronograma.
- Diferencia entre:
  - Estado vazio (`emptySchedule`) → exibe formulário de criação.
  - Cronograma existente (`shouldDisplayScheduleTable`) → exibe tabela com ações.

### 📊 Estatísticas de Leitura (`/stats`)

- Dashboard com **métricas agregadas de leitura por leitor**:
  - Total de livros.
  - Total de páginas lidas.
  - Gênero mais lido (usando `getGenderLabel`).
  - Autor mais lido.
- Visualizações:
  - **Gráfico de barras** (`BarChart`) – livros por ano.
  - **Gráfico de pizza** (`PieChart`) – colaboração/leitura entre leitores.
- Permite selecionar leitor via `<Select>`; rota é sincronizada com query string (`/stats?reader=Nome`).

### 🔐 Autenticação & Recuperação de Senha

- **Login (`/auth`)**
  - Formulário com `loginAction` + `useActionState`.
  - Exibe mensagens de erro/sucesso.
  - Acesso ao fluxo de “esqueci a senha”.

- **Esqueci a senha (`/forgot-password`)**
  - Form simples para enviar email de recuperação (`useForgotPassword`).
  - Feedback de loading e sucesso.

- **Reset de senha (`/reset-password`)**
  - Valida sessão do Supabase antes de permitir troca de senha.
  - Form para nova senha (`useResetPassword`).
  - Feedback de sucesso/erro.

---

## 🧱 Padrões de código e organização

### Componentização e hooks

### Co-location obrigatória de implementação + teste

Para manter consistência estrutural entre features, **todo arquivo de implementação que tenha teste associado deve viver em uma pasta própria com seu teste ao lado**.

✅ **Padrão obrigatório**

```text
feature-name/
  feature-name.ts(x)
  feature-name.test.ts(x) | feature-name.spec.ts(x)
  index.ts (quando fizer sentido para export público)
```

❌ **Evitar**

```text
components/
  feature-name.tsx
  feature-name.test.tsx
  feature-name1.tsx
  feature-name2.test.tsx
```

#### Regra prática para novas contribuições

- Se você criou `foo.ts`, `foo.tsx` ou `foo.service.ts` e também criou `foo.test.ts`, `foo.test.tsx`, `foo.spec.ts` ou `foo.spec.tsx`, então:
  - crie a pasta `foo/` (ou `foo.service/`, seguindo o nome-base já usado);
  - mova implementação e teste para dentro dela;
  - ajuste imports relativos e exportações (`index.ts`) do módulo pai para manter API estável.

#### Rule pronta (para adicionar na sua skill/projeto)

> **Regra:** Sempre que existir par implementação + teste com o mesmo basename no mesmo diretório, o par deve ser movido para uma pasta dedicada com o mesmo basename. Ex.: `bar.ts` + `bar.test.ts` ⟶ `bar/bar.ts` + `bar/bar.test.ts` (+ `bar/index.ts` quando necessário). Após mover, atualize imports e exports para manter compatibilidade pública.

- **Componentes de tela**:
  - Focados em renderizar UI, lidar com eventos e compor componentes menores.
  - Não devem conter lógica complexa de acesso a dados direto no componente.
- **Hooks (`useHome`, `useMyBooks`, `useQuotes`, `useSchedule`, etc.)**:
  - Encapsulam lógica de negócio, chamadas de serviço, uso de TanStack Query, estados derivados e side effects.
- **Types (`*.types.ts`)**:
  - Centralizam tipos específicos da feature (ex.: `BookDomain`, `BookshelfDomain`, `ClientQuotesProps`).

### Serviços

- **Regra geral**:
  - Services não conhecem UI; expõem funções assíncronas tipadas para serem consumidas pelos hooks.
  - Tratamento de erro centralizado com `ErrorHandler` e `RepositoryError` quando aplicável.

Exemplo de responsabilidades no domínio de livros:

- `BookQueryBuilder`: constrói a query (filtros, busca, paginação…).
- `BookMapper`: transforma o payload do Supabase em `BookDomain`.
- `BookService`: orquestra a chamada, aplica filtros válidos e normaliza erros.

---

## 📂 Estrutura de pastas (resumo)

Estrutura simplificada (apenas diretórios relevantes):

```text
src/
  app/
    (main)/
      page.tsx                 # Home
      my-books/page.tsx        # Minhas leituras
      shelves/page.tsx         # Estantes
      bookshelves/[id]/page.tsx# Livros de uma estante
      quotes/[title]/[id]/page.tsx
      schedule/[id]/[title]/page.tsx
      stats/page.tsx
      authors/page.tsx
    (auth)/
      auth/page.tsx
      forgot-password/page.tsx
      reset-password/page.tsx

  modules/
    home/
    myBooks/
    shelves/
    bookshelves/
    quotes/
    schedule/
    authors/
    stats/
    auth/
    ...

  services/
    books/
    ...

  components/
  stores/
  types/
```

> **Quando criar um novo módulo**, mantenha esse padrão (pasta em `src/modules`, tipagem própria, hooks dedicados, integração via `src/app`).

---

## 🤝 Regras de contribuição

Para garantir qualidade e consistência:

- **Branches**
  - Não fazer `push` diretamente para `main` ou `develop`.
  - Toda mudança deve ser feita em uma branch dedicada:
    - `feat/<descricao>` – novas funcionalidades.
    - `fix/<descricao>` – correções de bugs.
    - `chore/<descricao>` – manutenção/refatoração/setup.

- **Pull Requests**
  - Sempre abrir PR contra `develop`.
  - Nenhum PR pode ser aprovado sem pelo menos **uma revisão**.
  - Atualize este `README` sempre que:
    - Criar uma nova tela/fluxo relevante.
    - Alterar comportamento importante de uma feature existente.

---

## 📓 Guia rápido para novos agentes

Quando você (agente) for implementar uma nova feature:

1. **Identifique o domínio**:
   - O que a feature afeta? Livros, autores, estantes, citações, cronogramas, estatísticas, autenticação ou outro?
2. **Escolha/Crie o módulo** em `src/modules`:
   - Reaproveite um módulo existente ou crie um novo (seguindo o padrão de hooks, tipos e componentes).
3. **Conecte a rota** em `src/app`:
   - Crie/ajuste o `page.tsx` correspondente na pasta `(main)` ou `(auth)`.
4. **Atualize este README**:
   - Adicione/atualize a seção em **“Funcionalidades principais”**.
   - Se criar um serviço novo em `src/services`, documente o papel dele em **“Arquitetura geral”**.
5. **Se possível, adicione testes**:
   - Use Vitest + Testing Library para novos hooks e componentes críticos.

Seguindo esses passos, o `Nosso TBR` permanece bem documentado e fácil de evoluir – tanto para humanos quanto para outros agentes de IA.

---

## 🙏 Agradecimentos

Obrigado a todas as pessoas que contribuem com código, ideias e feedback.  
Cada melhoria deixa o **Nosso TBR** mais útil para quem ama ler e organizar suas leituras.
