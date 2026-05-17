# Feature Specification: Progresso de Leitura Baseado no Cronograma

**Feature ID:** 001
**Status:** Draft
**Owner:** Mateus
**Criada em:** 2026-05-17
**Domínios relacionados (vault):** [[features/feature-leitura-coletiva]] · [[telas-mobile/cronograma/tela-cronograma]] · [[business-rules]] (RN10, RN44)

---

## 1. Resumo executivo

O usuário acompanha o avanço da leitura de um livro a partir do cronograma que ele próprio criou. Hoje, marcar capítulos como lidos exige abrir a tela `/schedule/[id]` e olhar a tabela linha a linha — não há nenhuma indicação **agregada** de quanto já foi lido daquele cronograma. A feature adiciona um **indicador visual de progresso de leitura** baseado no cronograma do livro, exibido em dois pontos da jornada do usuário:

1. **No `BookCard` na Home** — para que o usuário enxergue, ao varrer a biblioteca, o quanto já avançou em cada livro **em leitura**.
2. **No topo da tela de Cronograma** (`/schedule/[id]/[title]`) — para dar contexto imediato do progresso ao abrir a tela detalhada.

O indicador é **derivado exclusivamente** do cronograma existente (não introduz nova fonte de verdade). Se o livro não tiver cronograma, o indicador é simplesmente **ocultado** — sem CTA, sem placeholder, sem ruído visual.

---

## 2. Por quê (motivação)

- **Falta de feedback de avanço:** o usuário lê, marca dia a dia, mas perde a sensação de "estou no terço final" — informação que motiva continuar lendo.
- **Custo cognitivo na Home:** hoje só o badge de status (`reading`, `finished`, etc.) aparece no card; não há nada que diferencie um livro em leitura recém-iniciado de um a uma sessão de terminar.
- **Reaproveitamento do cronograma:** o cronograma já carrega todas as informações necessárias (linhas marcadas vs. total). A feature transforma esse dado já capturado em **valor exibido** sem pedir nada novo do usuário.
- **Coerência com a regra existente RN44:** o cronograma é por `owner`, então o progresso é por usuário — naturalmente alinhado com a privacidade já consolidada.

---

## 3. Escopo

### 3.1 Dentro do escopo

- Cálculo e exibição de um **percentual de progresso** (e/ou representação visual equivalente) derivado do cronograma do usuário atual para o livro em questão.
- Renderização do indicador:
  - No `BookCard` exibido na **Home** (`modules/home`), respeitando a mesma instância de card usada em "Biblioteca / Todos / Leitura em Conjunto / Meus Livros".
  - No **topo da tela de Cronograma** (`/schedule/[id]/[title]`), acima da `ScheduleTable`.
- Restrição de visibilidade ao subconjunto de livros com `status = reading` (ver §6, FR-005).
- Comportamento de **ocultar silenciosamente** o indicador quando não houver cronograma do usuário atual para o livro (ver §6, FR-004).

### 3.2 Fora do escopo (não-objetivos)

- **NÃO** introduzir nova coluna, nova tabela ou nova rota para persistir progresso. Tudo é derivado do `schedule` existente.
- **NÃO** permitir marcar capítulos como lidos a partir do indicador na Home (interação fica apenas na tela de Cronograma, como já é hoje).
- **NÃO** exibir o indicador em estantes customizadas (`BookCard` com `isShelf=true`), nem em modais de detalhe do livro, nem na tela de Citações. Caso essas superfícies queiram exibir o indicador no futuro, será uma extensão posterior.
- **NÃO** exibir o indicador para visitantes (`anon`) ou em livros que não estejam em status `reading`.
- **NÃO** alterar o `BookCard` quando usado em estantes (manter compatibilidade total com RN55).
- **NÃO** considerar livros sem cronograma como "0% de progresso"; eles simplesmente não exibem o componente.

---

## 4. Personas e cenários

### Persona única

- **Leitor autenticado** que possui pelo menos um livro com status `reading` e cronograma definido por ele (`owner = auth.uid()` em `schedule`).

### User Scenarios & Testing

#### User Story 1 — Visualizar progresso de leitura na Home (Priority: **P1**)

- **Descrição:** Como leitor logado, ao percorrer a Home, quero ver no card de cada livro **que estou lendo** uma indicação visual de quanto já avancei no cronograma daquele livro, para reconhecer rapidamente onde estou em cada leitura ativa.
- **Razão da prioridade P1:** É o ganho principal de UX. Sem ele, o usuário continua precisando entrar na tela de cronograma de cada livro para ter qualquer noção de avanço. É o MVP da feature.
- **Independent Test:**
  - Logar como usuário com pelo menos 3 livros em estados distintos:
    - Livro A: `status = reading`, cronograma com 10 linhas, 4 completadas.
    - Livro B: `status = reading`, sem cronograma.
    - Livro C: `status = finished`, cronograma com 10 linhas, 10 completadas.
  - Abrir a Home.
- **Acceptance Scenarios:**
  - **Given** o usuário autenticado com o cenário acima, **When** a Home renderiza, **Then** apenas o card do Livro A exibe o indicador de progresso.
  - **Given** o card do Livro A, **When** o indicador é renderizado, **Then** ele reflete um avanço equivalente a "4 de 10" do cronograma do próprio usuário.
  - **Given** o card do Livro B, **When** renderiza, **Then** nenhum componente de progresso aparece e o layout do card não sofre nenhum gap visual residual.
  - **Given** o card do Livro C (`finished`), **When** renderiza, **Then** o indicador também não aparece (escopo restrito a `reading`).

#### User Story 2 — Visualizar progresso no topo da tela de Cronograma (Priority: **P1**)

- **Descrição:** Como leitor logado, ao abrir a tela `/schedule/[id]/[title]` de um livro em leitura, quero ver um resumo do meu progresso no topo da tela, antes da tabela, para entender o contexto antes de mergulhar nas linhas.
- **Razão da prioridade P1:** Reforça a sensação de avanço exatamente quando o usuário está prestes a marcar mais um dia. É barato implementar junto da User Story 1 porque consome o mesmo dado já carregado por `useSchedule`.
- **Independent Test:**
  - Logar como usuário com Livro A (acima).
  - Navegar para `/schedule/<idA>/<tituloA>`.
- **Acceptance Scenarios:**
  - **Given** a tela carregou com schedule não-vazio, **When** o usuário visualiza a página, **Then** existe um indicador de progresso acima da `ScheduleTable`, refletindo o mesmo avanço exibido na Home.
  - **Given** o usuário marca uma nova linha como lida (toggle existente), **When** a mutação otimista atualiza o estado, **Then** o indicador no topo da tela reflete o novo avanço imediatamente (sem refetch manual).
  - **Given** o usuário entra na tela `/schedule/...` de um livro **sem cronograma** (estado `emptySchedule`), **When** a tela renderiza, **Then** o indicador **não aparece** e o fluxo atual de "criar cronograma" (`CreateScheduleForm`) segue inalterado.

#### User Story 3 — Garantia de privacidade por usuário (Priority: **P2**)

- **Descrição:** Como leitor logado em um livro de leitura coletiva, quero que o indicador reflita **apenas o meu cronograma**, ignorando o avanço de outros leitores do mesmo livro, para que o número exibido seja fiel à minha experiência.
- **Razão da prioridade P2:** Não é uma feature visível ao usuário comum (ele nunca verá o cronograma alheio), mas é uma **invariante de correção** crítica que precisa estar testada para honrar a RN44.
- **Independent Test:**
  - Logar como `userX` em um livro com `readers = [userX, userY]` em status `reading`. Garantir que `userY` tem cronograma com 8/10 lidos e `userX` tem cronograma com 2/10 lidos.
- **Acceptance Scenarios:**
  - **Given** `userX` logado, **When** o card do livro coletivo renderiza na Home, **Then** o indicador reflete o progresso de `userX` (2/10) e nunca o de `userY`.
  - **Given** `userX` logado, **When** abre `/schedule/<id>`, **Then** o indicador também reflete 2/10.

---

## 5. Regras de domínio (novas RNs propostas)

> Estas regras serão promovidas ao vault em `01-Projetos/nosso-tbr/business-rules.md` após a entrega.

- **RNxx-01 — Origem única do progresso:** O progresso de leitura exibido é derivado **exclusivamente** do conteúdo da tabela `schedule` (linhas do usuário atual para o `book_id` em questão). Não há outra fonte de verdade nem cache paralelo.
- **RNxx-02 — Escopo do progresso:** O indicador só é considerado para exibição quando **todas** as condições abaixo são verdadeiras:
  - Usuário autenticado.
  - Livro com `status = reading`.
  - Existe pelo menos uma linha em `schedule` com `owner = auth.uid()` e `book_id = <livro atual>`.
  - Superfície de exibição é a Home (`BookCard` em contexto `isShelf=false`) **OU** a tela de Cronograma (`/schedule/[id]/[title]`).
- **RNxx-03 — Definição de "lido":** Uma unidade de progresso é contada como **lida** quando a respectiva linha em `schedule` tem `completed = true`. Não há ponderação por número de capítulos da linha — cada linha do cronograma é uma unidade equivalente (a divisão diária já foi feita no momento da criação do cronograma).
  - [NEEDS CLARIFICATION: confirmar se "1 linha = 1 unidade" é a expectativa, ou se o cálculo deve ponderar por quantidade de capítulos de cada linha — o que faria um dia com "Prólogo, 1-10" pesar mais que um dia com "11"].
- **RNxx-04 — Privacidade do progresso:** O indicador reflete somente o cronograma do usuário autenticado (alinhado à RN44 já consolidada). O progresso de outros participantes de uma leitura coletiva **não** influencia o cálculo nem é visível.
- **RNxx-05 — Ausência silenciosa:** Quando os critérios da RNxx-02 não são atendidos (livro sem cronograma do usuário, status diferente de `reading`, ou usuário não logado), o indicador é **omitido completamente da árvore renderizada**; não há placeholder, CTA, mensagem ou espaço reservado.
- **RNxx-06 — Sincronia com toggle de leitura:** Quando o usuário marca/desmarca uma linha como lida na tela de Cronograma (fluxo otimista atual de `useOptimisticScheduleReadToggle`), o indicador exibido na mesma tela deve refletir a mudança **na mesma operação otimista**, sem requerer refetch separado.

---

## 6. Functional Requirements

### 6.1 Cálculo e dados

- **FR-001 — Cálculo do progresso:** O sistema DEVE derivar o progresso a partir da contagem de linhas do `schedule` do usuário atual para o livro, onde:
  - **Total** = número total de linhas do cronograma do usuário para o livro.
  - **Lidas** = número de linhas com `completed = true`.
  - **Percentual** = `lidas / total` (arredondamento e formato visual definidos na fase de Plan).
- **FR-002 — Fonte do dado:** O sistema DEVE usar exclusivamente o cronograma do usuário autenticado (`owner = auth.uid()`), conforme RN44 / RNxx-04. NÃO DEVE consultar cronogramas de outros usuários.
- **FR-003 — Reaproveitamento de dados já carregados:** Quando os dados do cronograma já estão presentes em cache (ex.: usuário navegando entre Home → Cronograma → Home), o cálculo DEVE reutilizar o cache existente; não DEVE disparar requisição extra dedicada ao indicador.
  - [NEEDS CLARIFICATION: a Home hoje não carrega `schedule` por padrão para cada card; precisamos decidir na fase Plan se o cálculo é feito a partir de um endpoint agregado novo, ou se cada card dispara seu próprio fetch. Marcar como decisão técnica para o Plan].

### 6.2 Exibição

- **FR-004 — Ausência silenciosa:** O sistema DEVE ocultar completamente o indicador quando o livro não tiver cronograma do usuário, sem placeholder, sem CTA e sem alterar o layout do card além da remoção do componente.
- **FR-005 — Escopo de status:** O sistema DEVE exibir o indicador apenas para livros com `status = reading`. Livros em `not_started`, `planned`, `paused`, `abandoned` ou `finished` NÃO DEVEM exibir o indicador, mesmo que possuam cronograma.
- **FR-006 — Escopo de superfície:** O sistema DEVE exibir o indicador em duas superfícies, e somente nelas:
  1. `BookCard` quando renderizado na **Home** (contexto `isShelf = false`, conforme RN55).
  2. Topo da página `/schedule/[id]/[title]`, acima da `ScheduleTable`.
- **FR-007 — Exclusão explícita do contexto Estante:** O sistema NÃO DEVE renderizar o indicador no `BookCard` quando este estiver em contexto de estante (`isShelf = true`), para preservar a densidade visual do card de estante e manter compatibilidade com RN55.
- **FR-008 — Exclusão para visitantes:** O sistema NÃO DEVE renderizar o indicador para usuários anônimos, alinhado a RN20 e RN41.
- **FR-009 — Pt-BR:** Todos os rótulos e textos auxiliares do indicador (ex.: "lido", "concluído", "x de y") DEVEM estar em pt-BR, alinhados à diretriz global de localização do projeto.

### 6.3 Comportamento dinâmico

- **FR-010 — Reflexo do toggle otimista:** Quando uma linha do cronograma é marcada/desmarcada na tela de Cronograma via o fluxo otimista existente, o indicador na mesma tela DEVE refletir a alteração imediatamente, sem refetch dedicado.
- **FR-011 — Reflexo entre superfícies (best-effort):** Quando o usuário retorna à Home após marcar linhas no Cronograma, o indicador na Home DEVE refletir o novo progresso na próxima renderização do `BookCard`, dentro das políticas de cache TanStack Query já em uso (RN19 — `staleTime` consistente).
  - [NEEDS CLARIFICATION: confirmar se queremos invalidação ativa cross-screen ou se o comportamento padrão de `staleTime` é aceitável. Decisão técnica para fase Plan].

### 6.4 Erros e estados de carregamento

- **FR-012 — Estado de carregamento:** Enquanto os dados de progresso de um card específico ainda não foram resolvidos, o sistema DEVE evitar exibir um valor parcial ou incorreto. A estratégia exata (skeleton, valor escondido, animação de loading) será definida na fase Plan.
- **FR-013 — Erros silenciosos:** Falhas ao calcular o progresso (ex.: erro de rede ao buscar cronograma) NÃO DEVEM bloquear o restante do card nem da tela; o indicador simplesmente não é renderizado nessa amostra, e o card mantém todo o restante de seu comportamento padrão.

### 6.5 Acessibilidade

- **FR-014 — Acessibilidade do indicador:** O indicador visual DEVE expor sua semântica de progresso a tecnologias assistivas (rótulo textual descritivo do tipo "X de Y leituras concluídas" ou equivalente). Não DEVE depender apenas de cor para transmitir a informação.

---

## 7. Success Criteria

- **SC-001 — Adoção visual:** 100% dos livros em status `reading` que possuem cronograma do usuário atual exibem o indicador no `BookCard` da Home (verificado via inspeção manual e testes automatizados).
- **SC-002 — Zero falsos positivos:** Nenhum livro em status diferente de `reading` exibe o indicador, e nenhum livro sem cronograma do usuário atual exibe placeholder.
- **SC-003 — Correção do valor:** Em uma amostra de 5 livros com cronogramas conhecidos, o percentual exibido coincide com a contagem manual `linhas_completed / total_linhas` em 100% dos casos.
- **SC-004 — Sincronia otimista:** Após marcar uma linha como lida na tela de Cronograma, o indicador da mesma tela atualiza em ≤ 100ms (mesma operação otimista de `useOptimisticScheduleReadToggle`).
- **SC-005 — Não regressão da Home:** Tempo de primeira renderização da Home (FCP/LCP no fluxo logado com 8 livros) não piora em mais de 10% comparado à medição atual.
- **SC-006 — Isolamento por usuário:** Em teste com livro de leitura coletiva entre dois usuários, cada um vê apenas o seu próprio percentual (verificado via E2E ou teste integrado).
- **SC-007 — Acessibilidade:** Auditoria automatizada (axe ou equivalente) não reporta novas violações relacionadas ao indicador.

---

## 8. Riscos, dependências e premissas

### 8.1 Premissas

- A tabela `schedule` continua sendo a fonte canônica do cronograma, isolada por `owner` (RN44).
- O componente `BookCard` continua sendo usado tanto na Home (`isShelf=false`) quanto em estantes (`isShelf=true`) — a feature respeita essa diferenciação (RN55).
- O status `reading` continua sendo um valor explícito da coluna `books.status` (RN10 / RN17).

### 8.2 Riscos

- **R-01 — Custo de fetch na Home:** Calcular progresso para N cards na Home pode demandar N requisições adicionais se não houver endpoint agregado. Mitigação: decidir na fase Plan se o backend deve expor um endpoint agregado ou se o frontend prefetcha em lote. Marcado como [NEEDS CLARIFICATION] em FR-003.
- **R-02 — Cache desalinhado:** Se o cache do schedule for atualizado em uma tela e a Home não invalidar, o usuário pode ver progresso desatualizado momentaneamente. Mitigação: política de `staleTime` já consolidada (RN19); decidir invalidação ativa na fase Plan.
- **R-03 — Compreensão visual:** Um indicador mal calibrado (cores, posição, tamanho) pode poluir o card. Mitigação: validar visual com Figma/protótipo na fase Plan; manter card íntegro quando ausente (FR-004).

### 8.3 Dependências internas

- Módulo `schedule` (`src/modules/schedule/`) — fonte do dado.
- Componente `BookCard` (`src/components/bookCard/`) — superfície na Home (RN55).
- Tela `/schedule/[id]/[title]` (`src/app/(main)/schedule/...` e `src/modules/schedule/index.tsx`) — segunda superfície.
- Stores e hooks já existentes: `useUserStore`, `useSchedule`, `useOptimisticScheduleReadToggle`.

### 8.4 Dependências externas

- Nenhuma. A feature é 100% derivada de dados já capturados pelo sistema.

---

## 9. Itens marcados como [NEEDS CLARIFICATION]

1. **Unidade do cálculo (RNxx-03 / FR-001):** "1 linha do cronograma = 1 unidade" ou ponderar por quantidade real de capítulos da linha?
2. **Estratégia de fetch na Home (FR-003 / R-01):** endpoint agregado novo no backend OU fetch por card no frontend OU prefetch em lote ao carregar a Home?
3. **Invalidação cross-screen (FR-011):** invalidação ativa ao retornar à Home pós-toggle, ou aceitar o comportamento padrão de `staleTime`?

> Esses itens **não impedem** o avanço para a fase Plan, mas devem ser resolvidos como decisões técnicas explícitas antes da fase Tasks.

---

## 10. Notas de governança SDD

- Fase atual: **Specify (concluída quando esta spec for aprovada).**
- Próxima fase: **Plan** — definirá stack (já consolidado no projeto: Next.js 15 / React 19 / TanStack Query / TS estrito), arquitetura Hook-First, contratos de hook e (se necessário) novo endpoint agregado.
- Após a entrega: promover RNxx-01..06 à seção apropriada de `01-Projetos/nosso-tbr/business-rules.md` no vault e criar nota dedicada em `01-Projetos/nosso-tbr/features/feature-progresso-leitura-cronograma.md`.
