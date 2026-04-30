# Nosso TBR - Business Rules & Domain Logic

## 1. Book Creation & Validation (Schema)

- **RN01 - Campos Obrigatórios:** `title`, `author_id` e `readers` são estritamente obrigatórios.
- **Persistência `books.readers`:** A coluna `readers` na tabela `books` é do tipo **`uuid[]`**. Cada elemento referencia `public.users.id` (leitores associados ao livro).
- **RN03 - Integridade de Páginas:** O campo `pages` deve ser um número inteiro e positivo.
- **RN04 - Segurança de Imagem:** `image_url` é **opcional**. Se o usuário não informar (campo vazio ou ausente), o sistema persiste e exibe a **capa padrão** (`/book-cover-placeholder.svg`). Se informada, deve ser uma URL válida e pertencer aos domínios Amazon (`amazon.com`, `amazon.com.br`, `media-amazon.com`, `m.media-amazon.com`, `ssl-images-amazon.com`).

## 2. Listing, Search & Pagination

- **RN05 - Paginação:** O tamanho padrão da página é de 8 itens (`PAGE_SIZE = 8`).
- **RN06 - Filtro de Leitores (Leituras Conjuntas):**
  - Sem seleção explícita de leitores (`filters.readers` vazio), a UI deve considerar **todos os leitores como ativos**.
  - Nesse estado "todos selecionados", a query **não deve aplicar filtro de `readers`** (envio de array vazio) para evitar restrição indevida por combinação exata.
  - Com seleção parcial, a query deve enviar apenas os leitores selecionados.
  - **RN18 - Normalização de Arrays de Filtro:** Os arrays de filtro (`readers`, `status`, `gender`) devem ser **ordenados alfabeticamente** antes de serem usados na query do banco e na query key do TanStack Query. Para `readers`, os valores são UUIDs de usuário; a ordenação lexicográfica de string dos UUIDs garante que permutações do mesmo conjunto produzam a mesma cache key e a mesma query.
- **RN07 - Sincronização em Busca (Retry Logic):** Ao buscar um livro específico (`bookId` ou `searchQuery`) estando logado: se a API retornar vazio, disparar erro "Sincronizando novo livro..." e realizar 2 retries (delay de 1s).
- **RN08 - Reset de Estado:** Qualquer alteração em filtros ou na `searchQuery` deve resetar obrigatoriamente a `currentPage` para 0.
- **RN09 - Limpeza de Filtros:** O botão "Limpar" deve ficar ativo apenas se houver busca ativa, filtros de gênero/status/ano selecionados ou se o filtro de leitores for diferente do padrão.
- **RN16 - Filtro de Ano Híbrido (Query):** O filtro por ano deve retornar livros que foram **finalizados** naquele ano (`end_date`) OU que foram **planejados** para iniciar naquele ano (`planned_start_date`).

- **RN17 - Exibição de Livros (Query):** Caso usuário logado, exiba os filtros conforme regras, caso contrário exiba todos os livros (exceto livros individuais privados conforme **RN56**).

- **RN18 - Guard de Autenticação em Queries:** Todo `useQuery` que acessa uma rota autenticada (`/api/users`, `/api/shelves`) DEVE declarar `enabled: isLoggedIn`. Queries sem esse guard disparam a requisição mesmo para sessões não autenticadas, resultando em 401 e erro em cascata.

- **RN19 - staleTime em Queries Compartilhadas:** Queries com o mesmo `queryKey` usadas em múltiplos hooks/componentes DEVEM declarar `staleTime` consistente (padrão: `1000 * 60 * 5`). Sem `staleTime`, mounts sequenciais de componentes distintos disparam refetches redundantes mesmo com o cache populado, pois `staleTime` padrão é 0.

- **RN20 - Livro duplicado:** Ao adicionar um livro já existente, verificando pelo titulo e autor, deve aparecer um modal avisando que aquele livro já foi adicionado e se deseja duplicar

- **RN49 - Descoberta na criação (título + autor):** Na **criação** de livro (não edição), se existir no catálogo um registro com o mesmo `author_id` e título equivalente após normalização:
  - **Participação:** o usuário atual **participa** do livro se for `chosen_by` **ou** se seu id estiver em `readers` (**RN29–RN32**).
  - **Bloqueio:** se o usuário já participa, não é permitido novo cadastro duplicado; a UI deve informar o bloqueio (modal ou equivalente).
  - **Sugestão de inclusão na leitura:** se o usuário **não** participa, o livro existente está com **`status = not_started`** e há **mútuo seguir** (**RN39–RN40**) entre o usuário atual e o leitor de referência — prioriza-se `chosen_by` quando for terceiro; caso contrário outro participante em `readers` — deve ser oferecido o fluxo de vincular o usuário ao livro existente (modal de sugestão).
  - **Sem sugestão:** se não houver match de título/autor, ou houver match mas o usuário não participa e **não** se cumprir `not_started` + mútuo seguir, o fluxo segue como **novo cadastro** sem modal de sugestão.

- **RN20 - Usuario não logado:** Não pode navegar entre telas, não pode fazer crud de absolutamente nada na aplicação e deve ver todos os livros cadastrados — **exceto livros individuais privados** (conforme **RN56**).

- **RN21 - Usuario não logado - filtros:** Não pode aplicar filtros e não deve ver a opção de filtros.
- **RN22 - Busca Unificada (Autocomplete):** O autocomplete da busca inicial deve retornar resultados de **livros** e **autores** em um único fluxo de interação.
- **RN23 - Performance do Autocomplete:** O autocomplete deve usar debounce (300ms) e entregar sugestões em até **500ms** em condições normais de rede.
- **RN24 - Limite de Resultados no Autocomplete:** As sugestões devem ser limitadas por tipo para evitar sobrecarga de renderização e consultas.
- **RN25 - Persistência do filtro "Meus Livros":** Ao executar buscas (digitação manual ou seleção via autocomplete), o estado `myBooks=true` deve ser preservado e **nunca** alternar automaticamente para leituras conjuntas.
- **RN26 - Fechamento do Autocomplete:** O dropdown de autocomplete deve ser fechado quando o usuário clicar em uma sugestão, no botão de busca ou fora do campo.
- **RN29 - Filtro de Visão "Todos" (Default):**
  - A visão **Todos** deve estar disponível na lista de filtros de visão e iniciar selecionada por padrão no primeiro carregamento.
  - Quando **Todos** estiver ativo para usuário logado, a consulta deve retornar apenas livros relacionados ao usuário por regra de relacionamento.
  - A regra de relacionamento é: `user.id ∈ readers` **OU** `user.id === chosen_by`.
  - Essa regra deve ser aplicada no nível de query (Supabase/PostgREST), evitando filtro apenas em memória.
- **RN30 - Prioridade e Ausência de Filtro de Visão:**
  - `view=todos`: aplica regra de relacionamento (`readers OR chosen_by`).
  - `view=joint`: aplica regra existente de leituras conjuntas (comportamento preservado).
  - `myBooks=true`: mantém comportamento de livros do usuário por `user_id` (comportamento preservado).
  - Ao desativar `myBooks`, restaurar a última `view` não-`myBooks` selecionada pelo usuário.
  - Sem filtro de visão ativo: retornar **todos os livros do sistema**, sem restrição por usuário.
- **RN31 - Casos de Borda (Visão Todos):**
  - Usuário sem livros relacionados: retorno vazio.
  - `readers` vazio: livro pode ser retornado se `chosen_by` for o usuário.
  - `chosen_by` nulo: livro pode ser retornado se `readers` contiver o usuário.
- **RN32 - Identificadores na visão Todos (query):** `books.readers` persiste **apenas UUIDs** (`uuid[]`). A regra `user.id ∈ readers` compara o id do usuário com esses UUIDs. `chosen_by` é **`uuid`** referenciando `users.id` (FK); a comparação com `user.id` na query usa o mesmo identificador.
- **RN33 - Seleção Inicial de Leitores na Visão Todos:**
  - Ao abrir a Home logado, na visão **Todos**, apenas o leitor do usuário atual deve iniciar marcado.
  - Ao selecionar outros leitores, a seleção deve acumular no filtro da visão **Todos**.
  - O leitor do próprio usuário logado **não pode ser removido manualmente** (conforme **RN57**).
- **RN34 - Paginação da Visão Todos:**
  - A visão **Todos** deve respeitar `PAGE_SIZE = 8` e paginação por página atual.
  - Alterações na seleção de leitores na visão **Todos** devem gerar nova query (query key distinta) para evitar stale cache.

## 3. Book Status & Lifecycle

- **RN10 - Estados Permitidos:** `not_started`, `planned`, `reading`, `paused`, `abandoned` e `finished`.
- **RN11 - Lógica do Status "Planned" (UI):**
  - O campo `planned_start_date` no formulário deve aparecer apenas para `not_started`, `planned` ou quando nenhum status estiver selecionado.
  - O campo não deve aparecer para `paused`, `abandoned`, `reading` e `finished`.
  - Se possuir `planned_start_date`: Exibir "Início: [Data Formatada]" (Ex: 15 mar).
  - Se NÃO possuir data: Exibir "Vou ler".
- **RN12 - Toggle de Status:** A seleção de status é cumulativa. Clicar em um status ativo deve removê-lo; clicar em um inativo deve adicioná-lo ao array de filtros.
- **RN17 - Definição Técnica de Estados (Query):**
  - O filtro por status deve usar a coluna explícita `books.status`.
  - Mapeamento e listagem não devem inferir status a partir de datas.
- **RN27 - Regras de Datas por Status (Edição):**
  - `paused`: mantém `start_date` e `end_date`.
  - `abandoned`: limpa `start_date` e `end_date` (NULL).
- **RN28 - Retomada de Leitura:**
  - Retomar de `paused` para `reading`: manter `start_date` existente quando nenhuma nova data for informada.
  - Retomar de `abandoned` para `reading`: exigir nova `start_date` para reiniciar o ciclo.

## 4. UI, Sharing & Deletion

- **RN13 - Compartilhamento WhatsApp:** A URL deve conter o base path do Vercel e o título do livro encodado no parâmetro `search`.
- **RN14 - Deleção Lógica vs. Física:**
  - Excluir via `BookService`: Remove o livro permanentemente da base.
  - Excluir via `BookshelfService`: Remove apenas o vínculo do livro com a estante específica (módulo Shelves).
- **RN15 - Mobile Touch Targets:** Elementos interativos (Dropdowns, Cards) devem seguir o padrão de acessibilidade para touch. Elementos de menu (ellipsis) devem ter áreas de clique de no mínimo 44x44px.

- **RN55 - `BookCard`: Biblioteca (Home) vs Estante:** O mesmo componente `BookCard` é usado na **Home** (`modules/home`, lista geral da biblioteca) e nas **estantes** (`modules/bookshelves`). O comportamento **não é intercambiável**:
  - **Home / biblioteca:** usar `isShelf={false}` (valor padrão do componente). Não passar `shelfId`. Ações de remoção e exclusão referem-se ao **livro** no catálogo, conforme **RN14** (fluxo `BookService` / exclusão física quando aplicável).
  - **Estante:** usar `isShelf={true}` e **`shelfId` obrigatório** (id da `custom_shelves` em contexto). A remoção pelo card desfaz apenas o **vínculo** livro–estante (`BookshelfService` / **RN14**), nunca confundir com exclusão do registro `books`.
  - **UI na estante:** menu e confirmação usam textos do tipo «Remover livro da estante» / «Remover da estante» e deixam explícito que o livro permanece na biblioteca; após remover, a lista atualiza com invalidação da query `bookshelf-books`.
  - Novas telas que reutilizem `BookCard` devem declarar explicitamente esse contexto; não inferir `isShelf` a partir de rota sem passar props corretas.

## 5. Cadastro direto de usuário (link exclusivo)

- **RN35 - Descoberta e layout:** A rota `/register` não faz parte da navegação principal nem do layout `(main)`; o acesso é apenas por URL direta (ou link compartilhado), sem alterar fluxos de usuários já autenticados.
- **RN36 - Fluxo de persistência:** O endpoint `POST /api/auth/register` valida o corpo, cria o usuário no Supabase Auth (`signUp`) e em seguida faz upsert em `public.users` com `id` igual ao `auth.users.id`, preenchendo `display_name` e `email`.
- **RN37 - Validação (API + formulário):** Os campos enviados à API (`email`, `password`, `display_name`) são obrigatórios: `email` com formato válido; `password` com mínimo de 8 caracteres; `display_name` com trim, mínimo de 2 e máximo de 200 caracteres. A rota usa `registerUserBodySchema`; o formulário usa `registerUserFormSchema`, que inclui `password_confirm` obrigatório e deve coincidir com `password` (o campo de confirmação não é enviado ao servidor). As regras dos três campos persistidos ficam centralizadas em `registerFieldsSchema` no mesmo módulo de validação.
- **RN38 - Camada de UI e dados:** O cadastro é implementado no módulo `modules/register` (componente cliente `ClientRegister`, hook `useRegister`). O envio usa TanStack Query (`useMutation`); o formulário usa React Hook Form. A página `register` segue o padrão da home: `Suspense` com fallback em `Skeleton` envolvendo o cliente.

## 6. Social graph (seguidores)

- **RN39 - Tabela `user_followers`:** Relações de seguir/deixar de seguir são persistidas em `public.user_followers`, com colunas **`follower_id`** (quem segue) e **`following_id`** (quem é seguido), ambas `uuid` referenciando `public.users.id`. Não é permitida linha com `follower_id = following_id`.
- **RN40 - Semântica:** Uma linha `(follower_id, following_id)` indica que o usuário `follower_id` segue o usuário `following_id`. Contagens e listas de seguidores/seguindo derivam dessa tabela.

## 7. Segurança (RLS e Postgres)

As regras abaixo são aplicadas no banco (Row Level Security). A UI continua responsável por **RN20** (visitante sem CRUD); no Postgres, o papel `anon` tem apenas **SELECT** nas tabelas necessárias para listagem e autocomplete (**RN17**, **RN22**), e **nenhuma** operação de escrita.

- **RN41 - Visitante (`anon`):** Apenas `SELECT` em `books`, `authors` e demais tabelas expostas para leitura pública. `INSERT` / `UPDATE` / `DELETE` são negados para `anon` (alinhado a **RN20** e **RN21**). O `SELECT` em `books` é limitado pela policy `books_select_non_solo_or_owner`: livros individuais privados (**RN56**) são invisíveis para `anon`.

- **RN42 - Escrita em `books` (leitura coletiva):** Um usuário autenticado pode **inserir, atualizar ou excluir** uma linha em `books` somente se participar do livro, isto é, se `auth.uid()` for igual a `user_id` (quando preenchido), ou a `chosen_by`, ou estiver em `readers`. Assim, leitores conjuntos podem editar ou remover o registro conforme o mesmo critério de participação (alinhado a **RN29–RN32** e ao modelo de `readers` / `chosen_by`).

- **RN43 - `quotes`:** `INSERT`, `UPDATE` e `DELETE` em `quotes` exigem que o usuário tenha permissão de mutação no livro pai (`books.id = quotes.book_id`), pela mesma regra de **RN42**.

- **RN44 - `schedule`:** Cada linha é isolada por `owner`: apenas o dono (`owner = auth.uid()`) pode ler, inserir, atualizar ou excluir o próprio cronograma.

- **RN45 - `custom_shelves` e `custom_shelf_books`:** Apenas o dono da estante (`custom_shelves.user_id = auth.uid()`) gerencia prateleiras e vínculos livro–estante.

- **RN46 - `public.users`:** Usuário autenticado pode ler perfis necessários à UI social. Pode **inserir/atualizar/remover** somente a própria linha (`id = auth.uid()`), inclusive no fluxo de **RN36** após `signUp`.

- **RN47 - `authors` (catálogo compartilhado):** Leitura ampla para listagem e autocomplete. Usuários autenticados podem **criar** e **atualizar** autores. **Exclusão** de autor só é permitida quando **não** existir livro (nem vínculo em `book_authors`) referenciando esse autor, evitando apagar registro em uso por terceiros.

- **RN48 - Camada de aplicação (API Routes):** Mutações destrutivas ou sensíveis (`books` criar/editar/excluir, `authors`, `quotes`, `schedule`, `custom_shelves` / vínculos) devem passar pelas rotas em `src/app/api/**`, com sessão validada e a mesma regra de participação em livros (**RN42**) aplicada no servidor antes de chamar o Supabase. Isso complementa o RLS no Postgres; leituras que podem permanecer via cliente (`getAll` de livros, autocomplete, etc.) seguem **RN17** e **RN22**.

## 8. Estantes customizadas — ordenação manual de livros

- **RN50 - Identificador de ordem (`book_id`):** A posição de cada livro na estante é definida em relação ao **`book_id`** (identificador do livro no catálogo `books`). A UI e a API de reordenação trabalham com a lista ordenada de `book_id`; na tabela `custom_shelf_books`, a coluna de ordem (`sort_order`) associa-se à linha cujo `book_id` corresponde àquele livro. Não se ordena pela coluna `id` da junção para exibição ou persistência da sequência.

- **RN51 - Independência por estante:** Cada `custom_shelves.id` possui sua própria sequência de `sort_order`. Alterar a ordem em uma estante não altera a ordem do mesmo `book_id` em outras estantes.

- **RN52 - Sobreposição à ordenação automática:** Quando a usuária reordena manualmente (drag-and-drop), essa ordem manual passa a ser a fonte da verdade para a listagem daquela estante, substituindo qualquer ordenação apenas visual por título, autor ou data que a UI puder aplicar em outros contextos.

- **RN53 - Persistência e salvamento automático:** Ao concluir o gesto de soltar (drop), o sistema persiste imediatamente a nova sequência no banco, sem botão de salvar. Se a persistência falhar, a interface deve notificar o erro e restaurar a ordem anteriormente exibida.

- **RN54 - Novos vínculos na estante:** Ao adicionar um livro a uma estante, o novo vínculo recebe posição ao final da sequência existente naquela estante (comportamento garantido no banco ou na API de criação do vínculo).

## 9. Privacidade e visibilidade

- **RN56 - Privacidade de livros individuais:** Um livro é considerado **individual/privado** quando `array_length(readers, 1) = 1 AND readers[1] = chosen_by`, ou seja, há exatamente um leitor e ele é o mesmo que escolheu o livro. Nesses casos:
  - O livro é visível **apenas** para o próprio `chosen_by` (dono), independentemente de estar logado ou não.
  - Usuários anônimos e qualquer outro usuário autenticado **não** recebem a linha na query de `SELECT` (enforçado via RLS policy `books_select_non_solo_or_owner`).
  - Esta regra sobrepõe **RN20** e **RN41** para esse subconjunto de livros.
  - O `BookCard` exibe um badge "Privado" (ícone de cadeado) quando `isSoloBook(book) && book.chosen_by === user.id`.
  - Livros com múltiplos leitores **ou** com `readers[1] ≠ chosen_by` permanecem com visibilidade pública inalterada.

- **RN57 - Filtro de leitores por visão (Todos vs Leitura em conjunto):**
  - **Todos** (`view="todos"`): com usuário logado, a lista usa **apenas o próprio usuário** como escopo (`relationshipUserValues`); não há chips de leitor nem aviso de inclusão na home; o sheet de filtros não mostra a seção "Leitores" (exceto quando `myBooks` está ativo); `handleToggleReader` não altera a URL nesta visão.
  - **Leitura em conjunto** (`view="joint"`), usuário logado: o chip do próprio usuário fica **sempre marcado e desabilitado** (`disabled`); clicar nele não tem efeito (`handleToggleReader`); `aria-label` com "sempre incluído nesta visão"; se a URL tiver `readers` sem o ID do usuário, os memos reinjetam o ID; exige **pelo menos 1 outro leitor** (`needsExtraReader`) com mensagem de aviso em âmbar quando faltar.
  - Em **myBooks** continuam sem chips de leitor na home.
  - Usuário não logado: `lockedReaderId = undefined`; lock só existe em `joint` quando logado.
