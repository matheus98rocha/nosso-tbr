# Feature Specification: Status de Prazo da Leitura no Cronograma

**Feature ID:** 003  
**Status:** Draft (revisada 2026-08-16 — feedback do owner)  
**Owner:** Mateus  
**Criada em:** 2026-08-16  
**Domínios relacionados (vault):** [[telas-mobile/cronograma/tela-cronograma]] · [[features/feature-progresso-leitura-cronograma]] · [[business-rules]] (RN44, RN61)

---

## 1. Resumo executivo

O leitor que já tem cronograma vê **quanto já leu** (indicador de progresso existente), mas **não sabe quando a leitura deve terminar** nem se está **atrasado** em relação às datas planejadas.

Esta feature adiciona rótulos **somente de exibição**, derivados do cronograma e do **dia calendário atual**, em duas superfícies:

1. **Tela de Cronograma** (`/schedule/[id]/[title]`)
2. **Card do livro na tela inicial (Home)**

Quando **existe cronograma** do usuário:

- Sempre: **“Data prevista de término: DD/MM/AAAA”**
- Se estiver atrasado: também **“Atraso de X dia(s)”**

Quando **não existe cronograma**, os rótulos **não aparecem**.

Se o leitor já leu um dia que estava planejado para o futuro (ex.: leu hoje o que era de amanhã), está **adiantado**: a data prevista **antecipa** (nova data). Não se usa o texto “termina X dias antes”.

Dias com data **depois de hoje** **nunca** entram no atraso.

O cálculo **não** grava nada no banco e **não** altera o cronograma persistido.

---

## 2. Por quê (motivação)

- **Progresso ≠ prazo:** “4 de 10 dias lidos” não diz se esses 4 dias são os que deveriam estar feitos hoje, nem em que data a leitura fecha.
- **Data concreta:** “Data prevista de término: 12/08/2026” é mais acionável do que “termina 2 dias antes”.
- **Atraso honesto:** só dias **já vencidos e não lidos** atrasam. Um dia futuro ainda não lido não é atraso.
- **Adiantamento visível na data:** ler o de amanhã hoje deve **puxar a data de término para frente** (mais cedo), sem copy extra.
- **Zero atrito de dados:** datas planejadas e marcações de lido já existem.

---

## 3. Escopo

### 3.1 Dentro do escopo

- Calcular, a partir do cronograma do usuário autenticado e do dia de hoje:
  - a **data prevista de término**;
  - se há **atraso** e de **quantos dias**.
- Exibir os rótulos:
  - no topo da tela de Cronograma, junto ao progresso, quando a tabela está visível;
  - no `BookCard` da Home, junto ao progresso, quando o card já mostra progresso de leitura **e** o livro tem cronograma.
- Copy em pt-BR:
  - “Data prevista de término: …” (sempre que houver cronograma);
  - “Atraso de X dia(s)” **somente** quando houver atraso.
- Atualizar os rótulos na tela de Cronograma **na hora** ao marcar/desmarcar lido.
- Ocultar tudo quando não houver cronograma (Home: sem data prevista; tela de Cronograma: formulário de criação inalterado).

### 3.2 Fora do escopo (não-objetivos)

- **NÃO** criar coluna, tabela ou campo persistido para prazo.
- **NÃO** recalcular nem regravar datas do cronograma no banco.
- **NÃO** usar a copy “Termina X dias antes” (nem equivalente).
- **NÃO** tratar dia futuro não lido como atraso.
- **NÃO** enviar notificações por atraso.
- **NÃO** exibir os rótulos em estantes (`isShelf`), perfil de terceiros ou visitantes.
- **NÃO** alterar a regra de cálculo do indicador de progresso (RN61); o prazo é complementar.
- **NÃO** ponderar por capítulos da linha: **1 linha = 1 dia** (RN61).

---

## 4. Personas e cenários

### Persona única

- **Leitor autenticado** com cronograma próprio (`owner` = usuário atual).

### User Scenarios & Testing

#### User Story 1 — Ver a data prevista de término (Priority: **P1**)

- **Descrição:** Como leitor logado, quero ver **quando a leitura deve terminar**, na tela de cronograma e no card da Home, para ter um alvo de data sem abrir a tabela linha a linha.
- **Razão da prioridade P1:** É o rótulo principal pedido. Sem a data prevista a feature não entrega o valor.
- **Independent Test:** Cronograma 01/08–10/08; hoje = 05/08; 5 dias lidos (os 5 vencidos).
- **Acceptance Scenarios:**
  - **Given** cronograma existente e leitura em dia, **When** a tela de Cronograma renderiza, **Then** aparece “Data prevista de término: 10/08/2026” (data da última linha planejada), **sem** texto de atraso.
  - **Given** o mesmo livro na Home (status em leitura, card do próprio usuário), **When** o card renderiza, **Then** a mesma data prevista aparece no card.
  - **Given** livro **sem** cronograma, **When** a Home ou a tela de Cronograma renderiza, **Then** a data prevista **não** aparece.

#### User Story 2 — Ver atraso só de dias já vencidos (Priority: **P1**)

- **Descrição:** Como leitor logado, quero ver “Atraso de X dia(s)” apenas quando deixei de ler dias cuja data **já chegou**, para não ser acusado de atraso por capítulos de amanhã ou depois.
- **Razão da prioridade P1:** Regra explícita do owner. Sem ela o atraso mente.
- **Independent Test:** Cronograma 01/08–10/08; hoje = 05/08.
- **Acceptance Scenarios:**
  - **Given** 3 dos 5 dias com data ≤ hoje lidos (2 vencidos em aberto), **When** os rótulos renderizam, **Then** aparece “Atraso de 2 dias” e a data prevista é **posterior** à última data planejada (10/08).
  - **Given** todos os dias com data ≤ hoje lidos e os dias com data > hoje **ainda não** lidos, **When** renderiza, **Then** **não** aparece atraso (dias futuros não lidos não atrasam).
  - **Given** hoje anterior à primeira data do cronograma e zero lidos, **When** renderiza, **Then** **não** aparece atraso (ainda não era para ter começado).

#### User Story 3 — Adiantar a data prevista ao ler um dia futuro (Priority: **P1**)

- **Descrição:** Como leitor logado, se li hoje o que estava planejado para amanhã, quero que a **data prevista de término mude para mais cedo**, para refletir que vou terminar antes.
- **Razão da prioridade P1:** Pedido explícito. A copy “termina X dias antes” está **proibida**; o sinal é a **nova data**.
- **Independent Test:** Cronograma 01/08–10/08; hoje = 05/08; todos os 5 vencidos lidos **e** o dia 06/08 também lido.
- **Acceptance Scenarios:**
  - **Given** o cenário acima, **When** os rótulos renderizam, **Then** a data prevista é **anterior** a 10/08 (antecipada em 1 dia de cronograma) e **não** aparece “termina X dias antes”.
  - **Given** o mesmo cenário, **Then** **não** aparece “Atraso de …”.

#### User Story 4 — Rótulo acompanha o toggle de lido na tela de Cronograma (Priority: **P2**)

- **Descrição:** Ao marcar/desmarcar lido na tabela, data prevista e atraso mudam **na hora**, sem recarregar.
- **Independent Test:** Em dia; marcar o dia de amanhã; depois desmarcar um dia já vencido.
- **Acceptance Scenarios:**
  - **Given** em dia, **When** marca o dia de amanhã como lido, **Then** a data prevista antecipa **sem recarregar**.
  - **Given** em dia, **When** desmarca um dia com data ≤ hoje, **Then** passa a exibir “Atraso de 1 dia” e a data prevista recua **sem recarregar**.

#### User Story 5 — Ausência silenciosa sem cronograma (Priority: **P2**)

- **Descrição:** Sem cronograma, não quero data prevista nem atraso vazio.
- **Acceptance Scenarios:**
  - **Given** cronograma vazio na tela `/schedule`, **When** aparece o formulário de criação, **Then** nenhum rótulo de prazo aparece.
  - **Given** card na Home sem cronograma do usuário, **When** renderiza, **Then** não mostra “Data prevista de término”.

---

## 5. Regras de domínio (novas RNs propostas)

> Promover ao vault após a entrega.

- **RNxx-01 — Somente exibição:** prazo e data prevista são derivados em memória. **Não** são persistidos e **não** alteram `schedule`.
- **RNxx-02 — Unidade:** 1 linha do cronograma = 1 dia (RN61). Sem ponderar capítulos.
- **RNxx-03 — Hoje:** dia calendário atual em **America/São_Paulo**.
- **RNxx-04 — Atraso (só vencidos):** um dia **atrasa** somente se `data planejada ≤ hoje` **e** ainda **não** está lido. Dia com data **> hoje** **nunca** entra no atraso, esteja lido ou não.
- **RNxx-05 — Adiantamento:** um dia **adianta** se `data planejada > hoje` **e** já está lido (ex.: ler hoje o de amanhã).
- **RNxx-06 — Estados:**
  - **Atrasado** se existe pelo menos 1 dia vencido não lido. Magnitude = quantidade desses dias.
  - **Adiantado** se **não** há atraso e existe pelo menos 1 dia futuro já lido. Magnitude = quantidade desses dias.
  - **Em dia** se não há atraso e não há adiantamento.
- **RNxx-07 — Antes do início:** se hoje é anterior à primeira data e zero lidos → **em dia** (não é atraso). Se já houver lidos (todos futuros) → **adiantado**.
- **RNxx-08 — Depois do fim planejado:** dias ainda não lidos com data ≤ hoje (incluindo todo o cronograma, se hoje passou da última data) contam como atraso.
- **RNxx-09 — Data prevista de término:**
  - Base = data da **última** linha planejada.
  - Cada dia de **adiantamento** **antecipa** essa data em 1 dia calendário.
  - Cada dia de **atraso** **posterga** essa data em 1 dia calendário.
  - Em dia: data prevista = última data planejada.
- **RNxx-10 — Copy:** “Data prevista de término: {data pt-BR}”. Se atrasado, também “Atraso de {n} dia(s)”. **Proibido** “termina X dias antes”.
- **RNxx-11 — Superfícies:** tela de Cronograma (tabela visível) **e** `BookCard` da Home (mesmo critério de visibilidade do progresso de leitura do dono). Sem cronograma → oculto. Estante / visitante / perfil de terceiro → oculto.
- **RNxx-12 — Sincronia:** na tela de Cronograma, toggle de lido atualiza os rótulos na mesma operação visível. Na Home, a próxima atualização do progresso já carregado em lote deve refletir o novo prazo.

---

## 6. Functional Requirements

### 6.1 Cálculo

- **FR-001:** O sistema DEVE contar atraso e adiantamento conforme RNxx-04 e RNxx-05.
- **FR-002:** O sistema DEVE usar o dia calendário atual em America/São_Paulo (RNxx-03).
- **FR-003:** O sistema DEVE calcular a data prevista conforme RNxx-09.
- **FR-004:** O sistema NÃO DEVE persistir prazo, data prevista ou atraso.

### 6.2 Exibição

- **FR-005:** Com cronograma do usuário, o sistema DEVE exibir “Data prevista de término: DD/MM/AAAA” na tela de Cronograma (tabela visível) e no `BookCard` da Home (quando o progresso de leitura do dono já é elegível).
- **FR-006:** Sem cronograma, o sistema NÃO DEVE exibir data prevista nem atraso.
- **FR-007:** Se atrasado, o sistema DEVE exibir também “Atraso de X dia(s)” com singular/plural corretos. Se não atrasado, NÃO DEVE exibir essa linha.
- **FR-008:** O sistema NÃO DEVE exibir “termina X dias antes” nem copy equivalente de magnitude de adiantamento em texto; o adiantamento aparece **só** na data prevista antecipada.
- **FR-009:** Textos em pt-BR. A informação NÃO DEVE depender só de cor.
- **FR-010:** Estantes (`isShelf`), visitantes e cards que não são do progresso do dono NÃO DEVEM exibir os rótulos.

### 6.3 Comportamento dinâmico

- **FR-011:** Toggle de lido na tela de Cronograma DEVE atualizar data prevista e atraso imediatamente.
- **FR-012:** Recarregar ou revisitar no dia seguinte DEVE usar o novo “hoje”. Recálculo contínuo à meia-noite com a tela aberta **não** é exigido.

### 6.4 Erros e carregamento

- **FR-013:** Durante loading, NÃO exibir data/atraso parciais.
- **FR-014:** Em erro de carregamento, NÃO renderizar os rótulos (não bloqueia o restante da tela/card).

### 6.5 Acessibilidade

- **FR-015:** Data prevista e atraso DEVEM ser anunciáveis com o mesmo significado do texto visível.

---

## 7. Success Criteria

- **SC-001:** Casos em dia / adiantado (leu o de amanhã) / atrasado (dia vencido em aberto) / antes do início / futuro não lido sem atraso coincidem com RNxx-04..09 em 100% dos testes.
- **SC-002:** Copy visível é só “Data prevista de término: …” e, se couber, “Atraso de X dia(s)”. Zero ocorrências de “termina X dias antes”.
- **SC-003:** Sem migração de schema de tabela; sem escrita extra em `schedule`.
- **SC-004:** Home e tela de Cronograma exibem a data quando há cronograma; ambas ocultam quando não há.
- **SC-005:** Toggle na tela de Cronograma atualiza rótulos em ≤ 100 ms percebidos.
- **SC-006:** Texto suficiente sem cor; sem violação nova de acessibilidade.
- **SC-007:** pt-BR com singular/plural corretos (“1 dia” / “2 dias”).

---

## 8. Riscos, dependências e premissas

### 8.1 Premissas

- Cada linha tem data planejada (`date`) e flag de lido.
- A Home hoje agrega só total/concluídos; o prazo na Home precisa dos **contadores de vencido/futuro lido** e da **última data** (decisão de como obter isso fica no Plan).
- RN61 (progresso) permanece.

### 8.2 Riscos

- **R-01 — Confusão com progresso:** mitigar copy distinta (“Data prevista…” / “Atraso de…”).
- **R-02 — Fuso:** mitigar America/São_Paulo.
- **R-03 — Atraso e adiantamento mistos:** leitor pode deixar um dia vencido em aberto e mesmo assim ler um dia futuro. Atraso **não** é cancelado pelo futuro lido; a data prevista usa os dois deslocamentos (RNxx-09).
- **R-04 — Deslocamento em dias corridos:** antecipar/postergar a última data em dias de calendário (não reaplicar “pular fim de semana” do gerador). Aceito nesta versão.

### 8.3 Dependências internas

- Módulo `schedule`, indicador de progresso (RN61), `BookCard` da Home, toggle otimista de lido.

### 8.4 Dependências externas

- Nenhuma.

---

## 9. Itens marcados como [NEEDS CLARIFICATION]

1. **Virada de meia-noite com a tela aberta (FR-012):** recálculo contínuo **não** é exigido. Confirmado como aceitável nesta versão, salvo o owner pedir o contrário depois.

> Copy, superfícies e regra de atraso/adiantamento foram resolvidas pelo owner em 2026-08-16. Não bloqueiam o Plan.

---

## 10. Notas de governança SDD

- Fase atual: **Implement** (código + testes).
- Próxima fase: **Implement**.
- Após a entrega: promover RNxx-01..12 em `business-rules.md` e atualizar a nota da feature no vault.
