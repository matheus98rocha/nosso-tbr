# Feature Specification: Tela de Comunidade

**Feature ID:** 005  
**Status:** Implemented  
**Owner:** Mateus  
**Criada em:** 2026-09-16  
**Domínios relacionados (vault):** [[business-rules]] · [[features/feature-visibilidade-leitores-rede]] · [[features/aba-seguindo-livros-seguidos]] · [[features/feature-selecao-avatar-dicebear]] · [[telas-mobile/perfil-meu/tela-perfil-meu]] · [[telas-mobile/perfil-membro/tela-perfil-membro]] · [[telas-mobile/navegacao-global/tela-navegacao-global]] · [[database/database-schema]]

---

## 1. Resumo executivo

O leitor autenticado precisa de um **lugar dedicado para descobrir outros leitores**, entender o gosto literário de cada um e **seguir** quem fizer sentido — sem misturar isso com a gestão da própria conta.

Hoje a descoberta de membros vive **dentro do perfil**: lista de nomes, busca e seguir/deixar de seguir. Não há tela própria, **não há contagem de quem segue o usuário**, **não há avatar na lista** e **não há recorte de gêneros** (mais lido / mais cadastrado) ao explorar a comunidade.

Esta feature cria a **tela Comunidade**: diretório dos usuários cadastrados, recortes de **quem o usuário segue** e **quem o segue**, **avatares e nomes**, ação de **seguir**, e um **modal de detalhes do leitor** com gêneros quando existirem.

---

## 2. Por quê (motivação)

- **Descoberta social:** seguir alguém hoje exige abrir o perfil e procurar; a comunidade deve ser uma jornada de primeiro nível, como estatísticas ou estantes.
- **Contexto para seguir:** nome sozinho não ajuda a decidir. Gênero mais lido (quando houver) e, no detalhe, o gênero com mais livros cadastrados dão um recorte rápido do leitor.
- **Reciprocidade visível:** o perfil mostra só “seguindo”. Sem “seguidores” e sem lista de quem segue o usuário, a rede social fica incompleta.
- **Identidade visual:** avatares já existem na conta; a comunidade deve reconhecê-los, não só iniciais/texto.

---

## 3. Escopo

### 3.1 Dentro do escopo

- Tela **Comunidade** na navegação principal, **somente para usuário autenticado**.
- Exibir **quantos** o usuário logado **segue** e **quantos o seguem**.
- Listar **usuários cadastrados** (exceto o próprio usuário) com **avatar**, **nome**, **quantidade de livros cadastrados**, **quantidade de livros lidos**, o **título em leitura** quando houver, e **seguir / deixar de seguir**.
- **Não** exibir o gênero mais lido na lista; ele aparece só no modal.
- Listar **quem segue o usuário logado** e **quem o usuário logado segue**.
- Ao **tocar no leitor** (não no controle de seguir), abrir um **modal** com:
  - avatar e nome;
  - gênero mais lido (se existir);
  - gênero com mais livros **cadastrados** (se existir);
  - ação de seguir / deixar de seguir.
- Estados vazios, carregamento e erro em **pt-BR**.
- Respeitar privacidade de livros individuais (o que o visitante da tela **pode ver** daquele leitor).
- Tirar o **diretório completo de membros** da tela Meu perfil, deixando lá um atalho para a Comunidade (a conta continua no perfil).

### 3.2 Fora do escopo (não-objetivos)

- **NÃO** ranking, feed de atividade, mensagens diretas ou recomendações automáticas de “quem seguir”.
- **NÃO** editar perfil, e-mail ou avatar nesta tela (permanecem no perfil).
- **NÃO** exibir e-mail de outros leitores na Comunidade.
- **NÃO** seguir a si mesmo.
- **NÃO** exigir seguir mútuo para aparecer no diretório (descoberta é de **todos** os cadastrados, alinhado à regra atual de diretório vs rede).
- **NÃO** estatísticas anuais, ranking de leitura ou gráficos da tela de estatísticas.
- **NÃO** alterar a aba **Seguindo** da home (livros de quem você segue).
- **NÃO** portar a tela para o app Expo nesta entrega (a nota de tela no vault serve de referência futura).

---

## 4. Personas e cenários

### Personas

- **Leitor autenticado** — quer achar outros leitores, ver um recorte de gosto e seguir.
- **Visitante** — não autenticado; não acessa a Comunidade (mesma política do restante do app autenticado).

### User Scenarios & Testing

#### User Story 1 — Ver a comunidade e as contagens da rede (Priority: P1)

O leitor logado abre a Comunidade e vê, de imediato, **quantas pessoas segue** e **quantas o seguem**, além da lista de **outros usuários cadastrados** com avatar e nome.

**Razão da prioridade P1:** Sem a tela e sem as contagens, o resto da feature não tem âncora.

**Independent Test:** Autenticar, abrir Comunidade pela navegação, conferir as duas contagens e que cada cartão/linha mostra avatar + nome. Visitante não acessa o conteúdo.

**Acceptance Scenarios:**

1. **Given** um usuário autenticado, **When** abre a Comunidade, **Then** vê a quantidade de pessoas que ele segue e a quantidade de pessoas que o seguem.
2. **Given** existem outros usuários cadastrados, **When** a lista “todos os leitores” é exibida, **Then** cada um aparece com avatar e nome, **sem** o próprio usuário logado.
3. **Given** um visitante, **When** tenta abrir a Comunidade, **Then** é bloqueado sem ver a lista de leitores.
4. **Given** a navegação principal com sessão ativa, **When** o usuário procura o destino, **Then** existe um item **Comunidade** visível (admin e common-user).

#### User Story 2 — Seguir um leitor a partir da lista (Priority: P1)

O leitor segue (ou deixa de seguir) alguém **sem sair da lista**.

**Razão da prioridade P1:** É a ação social principal da tela.

**Independent Test:** Na lista, seguir um membro que ainda não é seguido; a ação passa a “deixar de seguir” e a contagem “seguindo” sobe em 1. Inverso ao deixar de seguir.

**Acceptance Scenarios:**

1. **Given** um leitor que o usuário **não** segue, **When** confirma seguir, **Then** o estado daquele leitor passa a “seguindo” e a contagem de quem o usuário segue aumenta em 1.
2. **Given** um leitor que o usuário **já** segue, **When** deixa de seguir, **Then** o estado volta a permitir seguir e a contagem diminui em 1.
3. **Given** o próprio usuário na comunidade, **Then** ele **não** aparece como alvo de seguir.
4. **Given** falha ao seguir, **When** a ação não se completa, **Then** o usuário vê mensagem em pt-BR e o estado anterior da lista/contagens é preservado.

#### User Story 3 — Ver quem me segue e quem eu sigo (Priority: P1)

Além do diretório geral, o usuário consulta **quem o segue** e **quem ele segue**.

**Razão da prioridade P1:** Pedido explícito da tela (cadastrados + quem segue você) e das duas contagens.

**Independent Test:** Criar relações A segue B. Como B, a lista “seguidores” contém A. Como A, a lista “seguindo” contém B. Contagens batem com o tamanho das listas.

**Acceptance Scenarios:**

1. **Given** pessoas que seguem o usuário logado, **When** ele abre o recorte **Seguidores**, **Then** vê exatamente esses leitores (avatar, nome, seguir se ainda não os segue).
2. **Given** pessoas que o usuário logado segue, **When** ele abre o recorte **Seguindo**, **Then** vê exatamente esses leitores.
3. **Given** as contagens no topo, **When** o usuário aciona a contagem de seguidores ou a de seguindo, **Then** a lista correspondente é exibida.
4. **Given** zero seguidores (ou zero seguindo), **When** o recorte correspondente está ativo, **Then** aparece estado vazio compreensível em pt-BR, sem lista fantasma.

#### User Story 4 — Gênero mais lido e detalhes no modal (Priority: P1)

A lista **não** mostra gênero. Ao tocar no leitor, um **modal** mostra o **gênero mais lido** (se existir) e o **gênero com mais livros cadastrados** (se existir), além de avatar, nome, atividade e seguir.

**Razão da prioridade P1:** É o diferencial da Comunidade frente ao diretório atual do perfil, sem sobrecarregar a label.

**Independent Test:** Leitor com livros finalizados concentrados num gênero G e cadastros concentrados num gênero H (pode ser o mesmo). Lista não mostra G. Modal mostra G e H quando existem. Leitor sem livros visíveis com gênero: modal explica a ausência.

**Acceptance Scenarios:**

1. **Given** um leitor com pelo menos um livro **finalizado visível** com gênero, **When** a lista é renderizada, **Then** o gênero mais lido **não** aparece na label.
2. **Given** um leitor **sem** livros finalizados visíveis com gênero, **When** a lista é renderizada, **Then** o nome, o avatar e a atividade continuam visíveis.
3. **Given** o usuário toca no leitor (fora do controle de seguir), **When** o modal abre, **Then** vê avatar, nome, seguir/deixar de seguir e, quando existirem, gênero mais lido e gênero com mais cadastrados.
4. **Given** o modal aberto, **When** o usuário fecha, **Then** volta à mesma lista e recorte sem perder o contexto.
5. **Given** um livro individual privado do outro leitor que o usuário logado **não** tem permissão de ver, **When** os gêneros são calculados para aquele visitante, **Then** esse livro **não** entra nas contagens.

#### User Story 8 — Ver atividade de leitura na label do leitor (Priority: P1)

Na lista, a label de cada leitor mostra **quantos livros cadastrou**, **quantos leu** e, se estiver com um livro em andamento visível, **o que está lendo**.

**Razão da prioridade P1:** Dá contexto imediato para decidir seguir, sem abrir o modal.

**Independent Test:** Leitor com 12 livros visíveis, 8 finalizados e um `reading` “O Nome do Vento”. A linha mostra `12 cadastrados · 8 lidos` e `Lendo O Nome do Vento`. Leitor sem livros visíveis: `0 cadastrados · 0 lidos` e sem linha “Lendo”.

**Acceptance Scenarios:**

1. **Given** um leitor com livros visíveis ao visitante, **When** a lista é renderizada, **Then** a label mostra a quantidade de cadastrados (qualquer status) e de lidos (`finished`).
2. **Given** um leitor com pelo menos um livro visível em `reading`, **When** a lista é renderizada, **Then** a label mostra o título desse livro após “Lendo”.
3. **Given** um leitor sem livro visível em `reading`, **When** a lista é renderizada, **Then** não se inventa uma linha “Lendo”.
4. **Given** um livro privado invisível ao visitante, **When** as contagens e o título em leitura são calculados, **Then** esse livro **não** entra.

#### User Story 5 — Atalho a partir do perfil (Priority: P2)

Meu perfil deixa de hospedar o diretório completo e aponta para a Comunidade. O perfil continua com dados da conta, avatar e, se fizer sentido, as próprias contagens da rede.

**Razão da prioridade P2:** Evita duas descobertas divergentes; não bloqueia o MVP da tela nova.

**Independent Test:** Abrir Meu perfil: não há lista completa de membros para busca/seguir; há caminho claro para Comunidade.

**Acceptance Scenarios:**

1. **Given** usuário autenticado em Meu perfil, **When** procura o diretório de membros, **Then** é direcionado à Comunidade em vez de uma segunda lista completa no próprio perfil.
2. **Given** usuário autenticado em Meu perfil, **When** usa o atalho de Comunidade, **Then** chega à mesma tela da navegação principal.

#### User Story 6 — Buscar leitores por nome (Priority: P2)

Com muitos cadastrados, o usuário filtra a lista visível pelo **nome**.

**Razão da prioridade P2:** Melhora descoberta, mas a tela já é útil sem busca.

**Independent Test:** Digitar parte de um nome existente; a lista reduz. Termo sem match: estado vazio com opção de limpar.

**Acceptance Scenarios:**

1. **Given** busca por nome com correspondência, **When** o termo é aplicado no recorte atual, **Then** só leitores cujo nome atende ao termo permanecem visíveis.
2. **Given** termo sem correspondência, **When** a busca está ativa, **Then** o usuário vê estado vazio em pt-BR e pode limpar a busca.

#### User Story 7 — Abrir o perfil completo a partir do modal (Priority: P3)

Do modal, o usuário pode ir ao **perfil do membro** (favoritos e demais dados já existentes).

**Razão da prioridade P3:** O perfil de membro já existe; o modal cobre o pedido desta feature.

**Independent Test:** No modal, acionar “ver perfil”; a jornada do perfil de membro permanece a atual.

**Acceptance Scenarios:**

1. **Given** modal de um leitor aberto, **When** o usuário escolhe ver o perfil completo, **Then** chega ao perfil daquele membro.

---

## 5. Regras de domínio (novas RNs propostas)

> Promover ao vault em `01-Projetos/nosso-tbr/business-rules.md` após aprovação e entrega. Numeração provisória até promover (próximos livres após RN67 no grafo social).

- **RN-COM-01 — Acesso:** A Comunidade é exclusiva de usuário **autenticado**. Visitante não vê leitores, contagens nem modal.
- **RN-COM-02 — Autoexclusão:** O usuário logado **não** aparece como item das listas da Comunidade e **não** pode seguir a si mesmo (já alinhado a `follower_id ≠ following_id`).
- **RN-COM-03 — Diretório:** O recorte **Todos** lista **todos os usuários cadastrados** exceto o logado (descoberta, como o diretório atual do perfil — não restringe à rede seguida).
- **RN-COM-04 — Seguidores / seguindo:** **Seguidores** = quem tem relação “segue o usuário logado”. **Seguindo** = quem o usuário logado segue. Contagens no topo **devem coincidir** com o tamanho dessas relações (não com o filtro de busca).
- **RN-COM-05 — Semântica de seguir:** Seguir / deixar de seguir nesta tela usa a **mesma** relação social já existente no produto. Follow **unidirecional** basta; mútuo não é exigido para aparecer ou para seguir.
- **RN-COM-06 — Identidade na lista:** Cada leitor visível **deve** mostrar **avatar** (o escolhido na conta; se não houver, o fallback visual já usado no produto) e **nome de exibição**. E-mail de terceiros **não** é exibido na Comunidade.
- **RN-COM-07 — Gênero mais lido:** Entre os livros **visíveis ao usuário logado** em que o leitor da linha **participa** (está entre os leitores ou é quem escolheu o livro) **e** o status é **finalizado**, agrupa-se por gênero preenchido. O gênero com **maior quantidade** é o “mais lido”. Livros sem gênero não entram. Empate: o rótulo que vem primeiro na ordenação alfabética pt-BR. Exibido **somente no modal**.
- **RN-COM-08 — Gênero mais cadastrado:** Igual ao recorte de participação e visibilidade, **sem** filtrar por finalizado (qualquer status). Gênero com maior quantidade de livros cadastrados visíveis. Mesma regra de empate e de ausência de gênero.
- **RN-COM-09 — Ausência:** A lista **não** mostra chip de gênero. Sem livros visíveis elegíveis, o modal explica que ainda não há gênero destacado.
- **RN-COM-10 — Privacidade:** Livros individuais privados seguem a visibilidade já vigente (dono e, quando a regra atual permite, **seguidores** do dono). Quem **não** pode ver o livro **não** o usa nos gêneros nem nas contagens/título em leitura da Comunidade.
- **RN-COM-11 — Perfil vs Comunidade:** O diretório completo de membros para descoberta e seguir passa a viver na **Comunidade**. Meu perfil não mantém uma segunda lista completa equivalente.
- **RN-COM-12 — Idioma:** Rótulos, recortes, vazios, erros e nomes dos recortes (Todos / Seguidores / Seguindo) em **pt-BR**.
- **RN-COM-13 — Atividade na label:** Cada item (e o modal) mostra a quantidade de livros **cadastrados** visíveis (qualquer status) e de livros **lidos** (`finished`) em que o leitor participa (`readers` ∪ `chosen_by`). Se houver livro visível com `status = reading`, mostra o título (o de `start_date` mais recente; empate por título e id). Sem livros visíveis: `0` e `0`, sem “Lendo”. Livros invisíveis ao visitante não entram (RN-COM-10).

---

## 6. Functional Requirements

### 6.1 Tela e navegação

- **FR-001:** O sistema MUST disponibilizar a tela Comunidade na navegação principal para usuários autenticados.
- **FR-002:** Visitante MUST ser impedido de ver o conteúdo da Comunidade.
- **FR-003:** A tela MUST exibir as contagens de **seguindo** e **seguidores** do usuário logado.
- **FR-004:** Acionar cada contagem MUST abrir o recorte de lista correspondente (Seguindo / Seguidores).

### 6.2 Listas

- **FR-005:** O recorte **Todos** MUST listar todos os usuários cadastrados exceto o logado.
- **FR-006:** O recorte **Seguidores** MUST listar apenas quem segue o usuário logado.
- **FR-007:** O recorte **Seguindo** MUST listar apenas quem o usuário logado segue.
- **FR-008:** Cada item MUST exibir avatar e nome de exibição.
- **FR-023:** Cada item MUST exibir na label as quantidades de livros cadastrados e lidos visíveis ao visitante, e o título em leitura quando existir um livro visível com status `reading`.
- **FR-009:** Cada item MUST oferecer seguir ou deixar de seguir conforme o estado atual da relação, com alvo de toque adequado a mobile.
- **FR-010:** Listas vazias MUST ter estado vazio em pt-BR (sem fingir que há leitores).
- **FR-011:** Ordenação padrão das listas MUST ser pelo nome de exibição em ordem alfabética pt-BR.

### 6.3 Gêneros e modal

- **FR-012:** A lista MUST NOT exibir o gênero mais lido. Se o gênero mais lido existir para aquele leitor e aquele visitante, o modal MUST exibi-lo.
- **FR-013:** Tocar no leitor (fora de seguir) MUST abrir um modal com avatar, nome, gêneros existentes e seguir/deixar de seguir.
- **FR-014:** O modal MUST mostrar o gênero com mais livros cadastrados quando existir, além do mais lido quando existir.
- **FR-015:** Gêneros MUST respeitar visibilidade de livros (FR alinhado a RN-COM-10).
- **FR-016:** Fechar o modal MUST devolver o usuário à mesma lista e recorte.

### 6.4 Rede e erros

- **FR-017:** Seguir / deixar de seguir MUST atualizar imediatamente o estado do item, as contagens e os recortes afetados após sucesso.
- **FR-018:** Falha na ação social MUST informar em pt-BR e MUST preservar o estado anterior.
- **FR-019:** E-mail de outros leitores MUST NOT ser exibido na Comunidade.

### 6.5 Perfil e busca (P2+)

- **FR-020:** Meu perfil MUST NOT manter o diretório completo de membros após a Comunidade existir; MUST oferecer atalho para a Comunidade.
- **FR-021:** (P2) O usuário MUST poder filtrar a lista visível pelo nome de exibição.
- **FR-022:** (P3) O modal MAY oferecer ir ao perfil completo daquele membro.

---

## 7. Success Criteria

- **SC-001:** Usuário autenticado abre a Comunidade pela navegação e, em até **5 segundos** em condições normais, vê contagens e a lista Todos (ou estado vazio/carregamento explícito — nunca tela em branco sem feedback).
- **SC-002:** Em um cenário com N cadastrados (N ≥ 2 além do logado), a lista Todos contém **N** pessoas e **nunca** o próprio usuário.
- **SC-003:** Após seguir com sucesso, a contagem “seguindo” aumenta **exatamente 1** e o leitor aparece no recorte Seguindo; o inverso vale para deixar de seguir.
- **SC-004:** A contagem de seguidores coincide com o número de relações “me seguem”; a de seguindo, com “eu sigo”.
- **SC-005:** Para um leitor cujo único gênero finalizado visível é G, o modal mostra G como mais lido e a lista **não** mostra G; livros privados invisíveis ao visitante não alteram G.
- **SC-006:** Auditoria rápida de acessibilidade: seguir, trocar recorte e abrir/fechar modal operáveis por teclado, com nome acessível no controle de seguir (inclui o nome do leitor).
- **SC-007:** Visitante não visualiza nomes, avatares nem gêneros da Comunidade.
- **SC-008:** Para um leitor com C cadastrados visíveis, L finalizados visíveis e um título T em `reading` visível, a lista mostra C cadastrado(s), L lido(s) e “Lendo T”; um livro privado invisível não altera C, L nem T.

---

## 8. Edge cases

| Caso | Comportamento esperado |
|------|------------------------|
| Único usuário no sistema | Todos vazio com mensagem; contagens 0; recortes Seguidores/Seguindo vazios. |
| Leitor sem avatar escolhido | Fallback visual já usado no produto (não quebrar layout). |
| Leitor sem `display_name` útil | Não deve ocorrer (nome é obrigatório no cadastro); se dado legado vazio, não listar identificador interno (UUID) como rótulo. |
| Empate de gêneros | Desempate alfabético pt-BR do rótulo. |
| Só livros sem gênero | Lista sem gênero; modal informa ausência. |
| Seguir alguém que já te segue | Relação unidirecional extra; ambos aparecem nos recortes corretos. |
| Deixar de seguir enquanto o modal está aberto | Modal e lista refletem o novo estado; contagens atualizam. |
| Leitor removido da base entre listar e seguir | Erro em pt-BR; item some ou recarrega de forma consistente, sem estado “seguindo” fantasma. |
| Vários livros em `reading` | Mostra o de `start_date` mais recente; empate por título e id. |
| Leitor sem livros visíveis | `0 cadastrados · 0 lidos`; sem linha “Lendo”. |

---

## 9. Riscos, dependências e premissas

### 9.1 Premissas

- Já existem usuários cadastrados, relação de seguir, avatares na conta e perfil de membro.
- Gênero do livro é o mesmo conceito já usado em filtros e estatísticas (rótulo amigável em pt-BR).
- Participação em livro = estar entre os leitores **ou** ser quem escolheu o livro.

### 9.2 Riscos

- **R-01 — Custo de agregar gênero por leitor:** muitos cadastros × muitos livros. Mitigação na fase Plan (agregação no servidor, cache). Não muda o WHAT.
- **R-02 — Duplicar descoberta perfil + comunidade:** se o diretório permanecer no perfil, as regras divergem. Mitigado por RN-COM-11 / US5.
- **R-03 — Vazamento de livros privados nos gêneros:** mitigado por RN-COM-10; testes devem cobrir seguidor vs não-seguidor.

### 9.3 Dependências internas

- Grafo social existente (seguir / deixar de seguir).
- Visibilidade de livros individuais e de seguidores.
- Avatares da conta.
- Navegação global e Meu perfil.
- Perfil de membro (apenas US7 / FR-022).

---

## 10. Itens marcados como [NEEDS CLARIFICATION]

Nenhum bloqueante. Decisões assumidas nesta spec (revisar se o produto discordar):

1. **Três recortes** (Todos / Seguidores / Seguindo), não só cadastrados + seguidores — Seguindo existe porque a contagem “quem você segue” precisa de lista correspondente.
2. **E-mail oculto** na Comunidade (hoje o diretório do perfil mostra e-mail).
3. **Diretório sai do perfil** (P2) para não haver duas fontes de verdade.
4. **Busca por nome** é P2, não MVP.
5. **Ver perfil completo** no modal é P3; o clique padrão abre o **modal**, não navega direto.
6. **Gênero mais lido** = livros **finalizados** visíveis com gênero; **mais cadastrado** = qualquer status visível com gênero.

---

## 11. Notas de governança SDD

- Fase atual: **Complete** (`tasks.md` T001–T032).
- Após entrega: promover RN-COM-* em `business-rules.md`, atualizar README (mapa de funcionalidades) e índice de telas mobile.
