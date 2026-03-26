# Nosso TBR - Business Rules & Domain Logic

## 1. Book Creation & Validation (Schema)

- **RN01 - Campos Obrigatórios:** `title`, `author_id` e `readers` são estritamente obrigatórios.
- **RN03 - Integridade de Páginas:** O campo `pages` deve ser um número inteiro e positivo.
- **RN04 - Segurança de Imagem:** `image_url` deve ser uma URL válida e pertencer obrigatoriamente aos domínios Amazon (`amazon.com`, `amazon.com.br`, `media-amazon.com`, `m.media-amazon.com`, `ssl-images-amazon.com`).

## 2. Listing, Search & Pagination

- **RN05 - Paginação:** O tamanho padrão da página é de 8 itens (`PAGE_SIZE = 8`).
- **RN06 - Filtro de Leitores (Leituras Conjuntas):**
  - Sem seleção explícita de leitores (`filters.readers` vazio), a UI deve considerar **todos os leitores como ativos**.
  - Nesse estado "todos selecionados", a query **não deve aplicar filtro de `readers`** (envio de array vazio) para evitar restrição indevida por combinação exata.
  - Com seleção parcial, a query deve enviar apenas os leitores selecionados.
  - **RN18 - Normalização de Arrays de Filtro:** Os arrays de filtro (`readers`, `status`, `gender`) devem ser **ordenados alfabeticamente** antes de serem usados na query do banco e na query key do TanStack Query. Isso garante que `["Matheus", "Fabi"]` e `["Fabi", "Matheus"]` produzam o mesmo cache key e a mesma query, retornando sempre o mesmo resultado.
- **RN07 - Sincronização em Busca (Retry Logic):** Ao buscar um livro específico (`bookId` ou `searchQuery`) estando logado: se a API retornar vazio, disparar erro "Sincronizando novo livro..." e realizar 2 retries (delay de 1s).
- **RN08 - Reset de Estado:** Qualquer alteração em filtros ou na `searchQuery` deve resetar obrigatoriamente a `currentPage` para 0.
- **RN09 - Limpeza de Filtros:** O botão "Limpar" deve ficar ativo apenas se houver busca ativa, filtros de gênero/status/ano selecionados ou se o filtro de leitores for diferente do padrão.
- **RN16 - Filtro de Ano Híbrido (Query):** O filtro por ano deve retornar livros que foram **finalizados** naquele ano (`end_date`) OU que foram **planejados** para iniciar naquele ano (`planned_start_date`).

- **RN17 - Exibição de Livros (Query):** Caso usuário logado, exiba os filtros conforme regras, caso contrário exiba todos os livros.

- **RN18 - Guard de Autenticação em Queries:** Todo `useQuery` que acessa uma rota autenticada (`/api/users`, `/api/shelves`) DEVE declarar `enabled: isLoggedIn`. Queries sem esse guard disparam a requisição mesmo para sessões não autenticadas, resultando em 401 e erro em cascata.

- **RN19 - staleTime em Queries Compartilhadas:** Queries com o mesmo `queryKey` usadas em múltiplos hooks/componentes DEVEM declarar `staleTime` consistente (padrão: `1000 * 60 * 5`). Sem `staleTime`, mounts sequenciais de componentes distintos disparam refetches redundantes mesmo com o cache populado, pois `staleTime` padrão é 0.

- **RN20 - Livro duplicado:** Ao adicionar um livro já existente, verificando pelo titulo e autor, deve aparecer um modal avisando que aquele livro já foi adicionado e se deseja duplicar

- **RN20 - Usuario não logado:** Não pode navegar entre telas, não pode fazer crud de absolutamente nada na aplicação e deve ver todos os livros cadastrados.

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
- **RN32 - Compatibilidade de Identificador de Leitor:**
  - Enquanto a base persistir `readers/chosen_by` em texto, a regra de relacionamento deve aceitar identificadores múltiplos do mesmo usuário (ex.: `id` e `display_name`) para manter compatibilidade durante migração gradual para UUID.
- **RN33 - Seleção Inicial de Leitores na Visão Todos:**
  - Ao abrir a Home logado, na visão **Todos**, apenas o leitor do usuário atual deve iniciar marcado.
  - Ao selecionar outros leitores, a seleção deve acumular no filtro da visão **Todos**.
  - O leitor padrão pode ser removido manualmente pelo usuário.
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

## 5. Cadastro direto de usuário (link exclusivo)

- **RN35 - Descoberta e layout:** A rota `/register` não faz parte da navegação principal nem do layout `(main)`; o acesso é apenas por URL direta (ou link compartilhado), sem alterar fluxos de usuários já autenticados.
- **RN36 - Fluxo de persistência:** O endpoint `POST /api/auth/register` valida o corpo, cria o usuário no Supabase Auth (`signUp`) e em seguida faz upsert em `public.users` com `id` igual ao `auth.users.id`, preenchendo `display_name` e `email`.
- **RN37 - Validação (API + formulário):** Os campos enviados à API (`email`, `password`, `display_name`) são obrigatórios: `email` com formato válido; `password` com mínimo de 8 caracteres; `display_name` com trim, mínimo de 2 e máximo de 200 caracteres. A rota usa `registerUserBodySchema`; o formulário usa `registerUserFormSchema`, que inclui `password_confirm` obrigatório e deve coincidir com `password` (o campo de confirmação não é enviado ao servidor). As regras dos três campos persistidos ficam centralizadas em `registerFieldsSchema` no mesmo módulo de validação.
- **RN38 - Camada de UI e dados:** O cadastro é implementado no módulo `modules/register` (componente cliente `ClientRegister`, hook `useRegister`). O envio usa TanStack Query (`useMutation`); o formulário usa React Hook Form. A página `register` segue o padrão da home: `Suspense` com fallback em `Skeleton` envolvendo o cliente.
