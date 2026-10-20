# Feature Specification: Perfil enriquecido

**Feature ID:** 008  
**Status:** Implemented  
**Plan:** [plan.md](./plan.md)  
**Tasks:** [tasks.md](./tasks.md)  

**Owner:** Mateus  
**Criada em:** 2026-10-20  
**Domínios relacionados (vault):** [[business-rules]] · [[telas-mobile/perfil-meu/tela-perfil-meu]] · [[telas-mobile/perfil-membro/tela-perfil-membro]] · [[features/feature-selecao-avatar-dicebear]] · [[features/feature-visibilidade-leitores-rede]] · [[database/database-schema]]

---

## 1. Resumo executivo

O **Meu perfil** (`/profile`) ficou pobre depois que a Comunidade (005) tirou o diretório de membros dali: hoje o leitor autenticado vê sobretudo **dados de conta** (nome, e-mail, datas, avatar), **contagens da rede** e um **atalho para a Comunidade**. Quase não há material de **leitura** — o que o perfil de membro (`/profile/[userId]`) já começa a mostrar (favoritos).

Esta feature **enriquece Meu perfil e o perfil de membro** com o material de leitura e identidade que já existe no produto (atividade, gêneros, favoritos, atalhos), sem virar uma segunda tela de Estatísticas nem trazer de volta o diretório da Comunidade.

---

## 2. Por quê (motivação)

- **Perfil como vitrine do leitor:** quem abre o próprio perfil (ou o de outra pessoa) espera ver **o que essa pessoa lê**, não só metadados de conta.
- **Paridade Meu perfil ↔ perfil de membro:** o membro já tem favoritos; o dono da conta não — a jornada fica inconsistente.
- **Material já calculado na Comunidade:** cadastrados, lidos, título em leitura e gêneros destacados já existem nas RPCs da 005; o perfil não os reaproveita.
- **Orientação na app:** o perfil pode ser o hub leve para **Estatísticas**, **Estantes** e **Comunidade**, sem duplicar essas telas.

---

## 3. Escopo

### 3.1 Dentro do escopo

#### Meu perfil (`/profile`) — leitor autenticado olhando a si mesmo

- Manter o que já existe e funciona: cabeçalho de conta, avatar + seleção de avatar, e-mail, datas de conta/último acesso, contagens seguindo/seguidores, atalho Comunidade.
- Exibir **resumo de atividade de leitura** do próprio leitor: quantidade de livros **cadastrados**, quantidade **lidos** (`finished`) e, se houver, o título **em leitura** (`reading`).
- Exibir **gêneros em destaque** do próprio leitor: **mais lido** e **mais cadastrado** (mesma semântica da Comunidade / RN-COM-07 e RN-COM-08), com estado vazio compreensível quando não houver gênero.
- Exibir a seção **Livros favoritos** (mesma fonte e comportamento visual do perfil de membro), com estado vazio e caminho para a biblioteca (`/` filtrada pelo próprio leitor ou equivalente já usado no membro).
- Exibir um bloco de **atalhos** para destinos de primeiro nível já existentes: **Estatísticas**, **Estantes**, **Comunidade** (e, se o produto já expõe na navegação, **Compartilhar leituras** / Recap só como atalho — sem reimplementar o fluxo).
- Contagens **Seguindo** / **Seguidores** no cabeçalho MUST ser acionáveis e levar à Comunidade no recorte correspondente (`/community?view=seguindo|seguidores`), alinhado à 005.

#### Perfil de membro (`/profile/[userId]`)

- Manter seguir / deixar de seguir, favoritos e atalho “Ver todos os livros”.
- Exibir as mesmas **contagens de atividade** (cadastrados, lidos, em leitura) e **gêneros em destaque**, respeitando a **visibilidade** dos livros para o visitante (igual Comunidade).
- Exibir **seguindo** e **seguidores** daquele membro (totais), sem listar o diretório completo no perfil (listas continuam na Comunidade).
- **Não** exibir e-mail do membro se a privacidade da Comunidade já o ocultou na descoberta; no perfil de membro, e-mail só permanece se o produto já o mostra hoje — ver [NEEDS CLARIFICATION] item 1.

### 3.2 Fora do escopo (não-objetivos)

- **NÃO** reintroduzir o diretório completo de membros no Meu perfil (RN-COM-11).
- **NÃO** duplicar a tela de Estatísticas (gráficos anuais, ranking, colaboração detalhada) — só resumo + atalho.
- **NÃO** criar campo de **bio**, edição de `display_name` ou upload de foto fora do catálogo DiceBear já existente.
- **NÃO** feed de atividade temporal, mural, posts ou timeline.
- **NÃO** listar estantes inteiras no perfil (só atalho para `/bookshelves` ou rota equivalente).
- **NÃO** alterar regras de privacidade de livros individuais.
- **NÃO** portar a tela para o app Expo nesta entrega.
- **NÃO** dependência das features 006 (tutorial) ou 007 (leitores populares na Home).

---

## 4. Personas e cenários

### Personas

- **Leitor autenticado (dono)** — quer ver e compartilhar a própria identidade de leitura no Meu perfil.
- **Leitor autenticado (visitante)** — quer entender o gosto de outro leitor no perfil de membro antes/depois de seguir.
- **Visitante não autenticado** — continua sem acesso (mesma política das rotas autenticadas).

### User Scenarios & Testing

#### User Story 1 — Ver atividade de leitura no Meu perfil (Priority: P1)

Como dono da conta, abro Meu perfil e vejo de imediato quantos livros cadastrei, quantos li e o que estou lendo agora (se houver).

**Razão da prioridade P1:** É o conteúdo mínimo que tira o perfil do “só conta”.

**Independent Test:** Conta com 10 cadastrados, 4 `finished` e 1 `reading` “Duna”. Meu perfil mostra 10 / 4 / “Lendo Duna”. Sem `reading`: sem inventar linha “Lendo”.

**Acceptance Scenarios:**

1. **Given** o leitor autenticado com livros próprios, **When** abre `/profile`, **Then** vê cadastrados e lidos coerentes com a participação dele nos livros.
2. **Given** pelo menos um livro em `reading`, **When** o perfil carrega, **Then** o título em leitura aparece (mesmo critério de desempate da Comunidade: `start_date` mais recente, depois título e id).
3. **Given** zero livros, **When** o perfil carrega, **Then** vê `0` / `0` e estado vazio compreensível, sem erro.

#### User Story 2 — Ver favoritos no Meu perfil (Priority: P1)

Como dono, vejo a mesma seção de **Livros favoritos** que já existe no perfil de membro.

**Razão da prioridade P1:** Fecha a assimetria óbvia entre as duas telas.

**Independent Test:** Marcar 2 favoritos; em `/profile` a grade mostra os 2. Sem favoritos: mensagem vazia em pt-BR.

**Acceptance Scenarios:**

1. **Given** favoritos existentes, **When** abre Meu perfil, **Then** a seção lista esses livros (cards sem interação destrutiva indevida — alinhado ao membro com `hideInteractions` ou equivalente seguro para o dono).
2. **Given** nenhum favorito, **When** a seção renderiza, **Then** aparece estado vazio em pt-BR.
3. **Given** a seção de favoritos, **When** o leitor quer ver a biblioteca, **Then** há atalho para ver todos os livros (mesmo padrão do membro).

#### User Story 3 — Ver gêneros em destaque (Priority: P1)

Como dono ou visitante do perfil de membro, vejo o gênero **mais lido** e o **mais cadastrado** quando existirem.

**Razão da prioridade P1:** É o mesmo diferencial da Comunidade, agora na vitrine do perfil.

**Independent Test:** Leitor com finalizados concentrados em Fantasia e cadastros em Romance; o perfil mostra ambos. Sem gêneros: copy de ausência, sem inventar rótulo.

**Acceptance Scenarios:**

1. **Given** livros finalizados com gênero, **When** o perfil (meu ou membro) carrega, **Then** o mais lido segue RN-COM-07 (visíveis ao visitante).
2. **Given** livros cadastrados com gênero, **When** o perfil carrega, **Then** o mais cadastrado segue RN-COM-08.
3. **Given** visitante que **não** pode ver um livro solo privado, **When** os gêneros são calculados, **Then** esse livro **não** entra (RN-COM-10).
4. **Given** ausência de gêneros elegíveis, **When** a seção renderiza, **Then** explica a ausência em pt-BR.

#### User Story 4 — Perfil de membro com atividade e rede (Priority: P1)

Como visitante, no perfil de outro leitor vejo atividade (cadastrados / lidos / lendo), gêneros, contagens de seguindo/seguidores e os favoritos já existentes.

**Razão da prioridade P1:** Hoje o membro é quase só favoritos + seguir.

**Independent Test:** Abrir `/profile/[id]` de alguém com atividade e rede; números batem com o que a Comunidade mostraria para o mesmo visitante; e-mail tratado conforme decisão de clarificação.

**Acceptance Scenarios:**

1. **Given** perfil de membro existente, **When** o visitante autenticado abre a página, **Then** vê atividade e gêneros respeitando visibilidade.
2. **Given** o membro tem S seguindo e F seguidores, **When** o perfil carrega, **Then** as contagens S e F aparecem (somente totais, sem lista embutida).
3. **Given** falha ao carregar atividade/gêneros, **When** o restante do perfil está ok, **Then** favoritos e seguir continuam utilizáveis e a seção afetada mostra erro/recuperação em pt-BR (não tela inteira morta).

#### User Story 5 — Atalhos a partir do Meu perfil (Priority: P2)

Como dono, a partir do Meu perfil alcanço Estatísticas, Estantes e Comunidade sem voltar ao menu.

**Razão da prioridade P2:** Melhora o hub; não bloqueia o MVP de conteúdo.

**Independent Test:** Em `/profile`, cada atalho navega para a rota correta já existente.

**Acceptance Scenarios:**

1. **Given** Meu perfil, **When** aciona Estatísticas, **Then** chega a `/stats` (ou rota canônica atual).
2. **Given** Meu perfil, **When** aciona Estantes, **Then** chega à rota de estantes do produto.
3. **Given** Meu perfil, **When** aciona Comunidade (atalho ou contagem), **Then** chega a `/community` (contagens com `view` adequado).

#### User Story 6 — Contagens da rede clicáveis (Priority: P2)

Como dono, tocar em Seguindo / Seguidores no Meu perfil abre a Comunidade no recorte certo.

**Razão da prioridade P2:** Já pedido implicitamente pela 005 (FR-004 no perfil).

**Independent Test:** Clique em Seguidores → `/community?view=seguidores`; Seguindo → `view=seguindo`.

**Acceptance Scenarios:**

1. **Given** Meu perfil com contagens, **When** aciona Seguidores, **Then** a Comunidade abre no recorte Seguidos/Seguidores correto.
2. **Given** Meu perfil, **When** aciona Seguindo, **Then** o recorte Seguindo é exibido.

---

## 5. Regras de domínio (novas RNs propostas)

> Promover ao vault após aprovação e entrega. Prefixo provisório **RN-PRF-***.

- **RN-PRF-01 — Duas faces, um contrato de leitura:** Meu perfil e perfil de membro compartilham o **mesmo** contrato de atividade (cadastrados / lidos / em leitura) e de gêneros destacados; a diferença é só o que é exclusivo do dono (e-mail da conta, datas de auth, seleção de avatar, atalhos de hub).
- **RN-PRF-02 — Semântica de atividade:** Idêntica a RN-COM-13 para o leitor do perfil, com visibilidade do **visitante atual** (no Meu perfil o visitante é o dono — vê os próprios livros, inclusive solo).
- **RN-PRF-03 — Gêneros:** Idênticos a RN-COM-07 e RN-COM-08; empate alfabético pt-BR do rótulo; ausência explicada, nunca inventada.
- **RN-PRF-04 — Favoritos:** A seção de favoritos no Meu perfil usa a **mesma** fonte `user_book_favorites` / serviço já usado no perfil de membro.
- **RN-PRF-05 — Sem diretório no perfil:** Continua proibido o diretório completo de membros no Meu perfil (RN-COM-11). Contagens da rede apontam para a Comunidade.
- **RN-PRF-06 — Contagens de rede no membro:** Totais de seguindo/seguidores do **membro visitado**; não listar quem são no perfil.
- **RN-PRF-07 — Idioma:** Toda copy nova em **pt-BR**.
- **RN-PRF-08 — Degradação:** Falha parcial (ex.: gêneros) não bloqueia avatar, seguir nem favoritos.
- **RN-PRF-09 — Não-estatísticas:** O perfil **não** substitui `/stats`; números anuais/ranking ficam fora.

---

## 6. Functional Requirements

### 6.1 Meu perfil — conteúdo de leitura

- **FR-001:** Meu perfil MUST exibir quantidade de livros cadastrados e lidos do leitor logado.
- **FR-002:** Meu perfil MUST exibir o título em leitura quando existir livro `reading` elegível; MUST NOT inventar título.
- **FR-003:** Meu perfil MUST exibir a seção de livros favoritos com os mesmos dados do perfil de membro.
- **FR-004:** Meu perfil MUST exibir gênero mais lido e mais cadastrado quando existirem, ou estado de ausência em pt-BR.
- **FR-005:** Meu perfil MUST preservar seleção de avatar, dados de conta e atalho à Comunidade já existentes.

### 6.2 Perfil de membro — enriquecimento

- **FR-006:** Perfil de membro MUST exibir cadastrados, lidos e título em leitura (quando houver), respeitando visibilidade do visitante.
- **FR-007:** Perfil de membro MUST exibir gêneros destacados com a mesma regra de visibilidade.
- **FR-008:** Perfil de membro MUST exibir totais de seguindo e seguidores do membro.
- **FR-009:** Perfil de membro MUST manter seguir/deixar de seguir e a seção de favoritos já existente.

### 6.3 Navegação e hub (P2)

- **FR-010:** (P2) Meu perfil MUST oferecer atalhos para Estatísticas, Estantes e Comunidade.
- **FR-011:** (P2) Contagens Seguindo/Seguidores no Meu perfil MUST navegar à Comunidade no recorte correspondente.

### 6.4 Qualidade transversal

- **FR-012:** Estados de carregamento, vazio e erro das novas seções MUST ser em pt-BR e MUST NOT deixar a página em branco sem feedback.
- **FR-013:** Livros invisíveis ao visitante MUST NOT entrar em atividade nem gêneros do perfil de membro.
- **FR-014:** Visitante não autenticado MUST continuar redirecionado/bloqueado nas rotas de perfil autenticadas.

---

## 7. Success Criteria

- **SC-001:** Em Meu perfil, um leitor com C cadastrados, L finalizados e título T em leitura vê C, L e “Lendo T” em até **5 s** em condições normais (ou skeleton explícito — nunca branco mudo).
- **SC-002:** Favoritos no Meu perfil coincidem com os favoritos do mesmo `userId` no perfil de membro (mesma lista).
- **SC-003:** Gênero mais lido / mais cadastrado no perfil de um membro, para um visitante V, coincidem com o que a Comunidade mostraria a V para esse membro (mesmas regras de visibilidade).
- **SC-004:** Contagens seguindo/seguidores no perfil de membro batem com o tamanho das relações daquele `userId`.
- **SC-005:** Com livro solo privado do membro e visitante não autorizado, atividade e gêneros **ignoram** esse livro.
- **SC-006:** Atalhos P2 (quando entregues) levam às rotas corretas; contagens do Meu perfil abrem Comunidade com `view` correto.
- **SC-007:** Auditoria rápida a11y: novas seções com headings, contagens e atalhos operáveis por teclado; imagens de capa/avatar com `alt` adequado.

---

## 8. Edge cases

| Caso | Comportamento esperado |
|------|------------------------|
| Zero livros | Atividade 0/0; sem “Lendo”; gêneros com ausência; favoritos vazios. |
| Vários `reading` | Mesmo desempate da Comunidade. |
| Só livros sem gênero | Atividade ok; gêneros com copy de ausência. |
| Favoritos com livro depois removido / invisível | Não quebrar a seção; omitir ou estado consistente (definir no Plan). |
| Membro inexistente | Mantém tela “Leitor não encontrado” atual. |
| Falha só na RPC de gêneros | Favoritos + atividade (se ok) + seguir continuam; seção de gêneros mostra erro recuperável. |
| Nome de exibição vazio legado | Fallback “Leitor”, nunca UUID (alinhado à 005). |

---

## 9. Riscos, dependências e premissas

### 9.1 Premissas

- RPCs `get_community_reader_activity` e `get_community_reader_genres` (ou equivalentes) podem ser reaproveitadas / filtradas para um `reader_id` no Plan.
- Favoritos e `BookFavoritesService.getFavoriteBooksForUser` já existem.
- Comunidade com `?view=` já existe (005).

### 9.2 Riscos

- **R-01 — Duplicar UI de stats:** mitigado por RN-PRF-09 e atalho P2.
- **R-02 — Vazamento de privado no perfil de membro:** mitigado por RN-PRF-02/03 + testes de visitante.
- **R-03 — Perfil poluído:** manter hierarquia clara (identidade → atividade/gêneros → favoritos → atalhos); evitar cards decorativos sem função.

### 9.3 Dependências internas

- Módulo `profile` (client + member).
- Serviços/RPCs da Comunidade (atividade e gêneros).
- `BookFavoritesService`.
- Rotas `/community`, `/stats`, estantes.

---

## 10. Clarificações (travadas no Plan — Opção A)

1. **E-mail no perfil de membro:** ocultar (paridade com Comunidade 005).
2. **Favoritos no Meu perfil:** cards **com** interações do dono (sem `hideInteractions`).
3. **Recap no hub:** fora desta feature.
4. **Preview de estantes:** só atalho para `/shelves`.

---

## 11. Notas de governança SDD

- Fase atual: **Implemented** (`tasks.md` T001–T018).
- Issue de rastreio: [#179](https://github.com/matheus98rocha/nosso-tbr/issues/179).
