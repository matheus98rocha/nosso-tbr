# Feature Specification: Tutorial de boas-vindas e recomendações de leitores

**Feature ID:** 006  
**Status:** Planned  
**Owner:** Mateus  
**Criada em:** 2026-10-20  
**Atualizada em:** 2026-10-20  
**Domínios relacionados:** [[CONTEXT]] · [[005-tela-comunidade]] · [[features/aba-seguindo]] · [[modules/aiRecommendation]] · [[modules/bookUpsert]]

---

## 1. Resumo executivo

O **Leitor** autenticado precisa descobrir, sem fricção, três pilares do Nosso TBR: **seguir outros leitores**, **cadastrar livros** e **usar a indicação com inteligência artificial**. Hoje isso existe espalhado (Comunidade, FAB da Home, empty states genéricos), mas **não há um tutorial** nem um aviso claro quando o leitor **não segue ninguém**.

Esta feature entrega:

1. Um **tutorial** exibido **somente na primeira vez que o Leitor faz login** (reabertura manual opcional depois), cobrindo seguir, criar livros e IA.
2. Um **aviso persistente enquanto o leitor segue zero pessoas**, com **recomendações de leitores** que gostam de **Gêneros** alinhados ao gosto dele (derivado dos livros que ele cadastra/lê).

A descoberta social deixa de depender só da tela Comunidade (005); a recomendação automática de “quem seguir” — explicitamente fora do escopo da 005 — passa a ser objetivo desta feature.

---

## 2. Por quê (motivação)

- **Cold start social:** sem seguir ninguém, a aba Seguindo e o feed de rede ficam vazios; o empty state atual ainda aponta ao **perfil**, enquanto a descoberta vive na **Comunidade**.
- **Descoberta de valor:** cadastro de livros e Indicação com IA são ações de primeiro nível na Home, mas um leitor novo não sabe que existem ou por onde começar.
- **Afinidade por Gênero:** a Comunidade já calcula gênero mais lido / mais cadastrado; usar isso para sugerir leitores reduz o “seguir no escuro”.
- **Retenção:** um tutorial curto + nudge de rede aumenta a chance de o leitor montar uma rede e voltar.

---

## 3. Escopo

### 3.1 Dentro do escopo

- **Tutorial de boas-vindas** exibido **apenas no primeiro login** do Leitor (primeira sessão autenticada em que o tutorial ainda não foi marcado como visto):
  - passo(s) sobre **seguir leitores** (Comunidade / rede);
  - passo(s) sobre **criar / cadastrar livros**;
  - passo(s) sobre **Indicação com IA**.
- Ao **exibir** o tutorial (ou ao pular/concluir), **marcar como visto** no servidor — logins seguintes **não** reabrem automaticamente, mesmo que o Leitor tenha fechado o app no meio.
- Permitir **pular** o tutorial sem bloquear o uso do app.
- Permitir **reabrir** o tutorial depois (atalho discreto, ex.: no perfil) — P3; isso não muda a regra do primeiro login.
- **Aviso “você ainda não segue ninguém”** quando o Leitor autenticado tem **zero** relações “seguindo”, com copy em pt-BR e CTA para seguir a partir das recomendações ou ir à Comunidade.
- **Lista de leitores recomendados** baseada em **sobreposição de Gênero** entre o gosto do Leitor logado e o de outros leitores (ver RN-ONB-*).
- Seguir / deixar de seguir a partir do aviso ou do tutorial **reusando** a relação social já existente (mesmo grafo da Comunidade).
- Atualizar empty states da Home que ainda direcionam seguir para `/profile`, passando a apontar para **Comunidade** e/ou para o bloco de recomendações.
- Textos, vazios e erros em **pt-BR**; alvos de toque adequados a mobile.

### 3.2 Fora do escopo (não-objetivos)

- **NÃO** tour pixel-perfect tipo “spotlight” em todos os botões da UI (coachmarks multi-tela opcional só se o Plan couber no MVP; o WHAT exige tutorial compreensível, não biblioteca de tour).
- **NÃO** preferências explícitas de gênero numa tela “escolha seus gêneros” (MVP usa gêneros **já derivados dos livros** do Leitor; captura explícita fica para evolução).
- **NÃO** recomendações de **livros** no tutorial (a Indicação com IA já cobre isso).
- **NÃO** alterar o algoritmo interno do provedor de IA / `TBR_BOOK_PROVIDER_URL`.
- **NÃO** ranking público, feed de atividade, DMs ou “pessoas que você pode conhecer” por grafo de amigos mútuos (só afinidade por Gênero + regras de desempate).
- **NÃO** forçar o Leitor a seguir alguém ou cadastrar livro para usar o app.
- **NÃO** portar o tutorial para app Expo nesta entrega.
- **NÃO** e-mail marketing / push externo sobre o tutorial.

---

## 4. Personas e cenários

### Personas

- **Leitor novo** — acabou de criar conta; poucos ou nenhum livro; ainda não segue ninguém.
- **Leitor autenticado sem rede** — já usa o app (pode ter livros), mas `seguindo = 0`.
- **Visitante** — não autenticado; não vê tutorial nem recomendações personalizadas.

### User Scenarios & Testing

#### User Story 1 — Ver o tutorial só no primeiro login (Priority: P1)

No **primeiro login** (primeira Home autenticada com tutorial ainda não marcado como visto), o Leitor vê um fluxo curto que explica: seguir leitores, cadastrar livros e usar Indicação com IA. Em qualquer login posterior, o tutorial **não** abre sozinho.

**Razão da prioridade P1:** Pedido explícito do produto — uma única exposição automática.

**Independent Test:** Conta nova (`welcome_tutorial_seen_at` nulo). Primeiro login → Home → tutorial com os três temas; ao exibir (ou pular/concluir) a flag persiste. Segundo login → Home **sem** tutorial automático.

**Acceptance Scenarios:**

1. **Given** Leitor autenticado com tutorial **ainda não visto** (primeiro login), **When** chega à Home autenticada, **Then** o tutorial é apresentado (modal ou painel dedicado) com conteúdo dos três pilares em pt-BR.
2. **Given** o tutorial aberto, **When** o Leitor avança pelos passos, **Then** vê pelo menos um passo dedicado a **seguir**, um a **criar livros** e um a **IA**.
3. **Given** o tutorial foi **exibido** (ou pulado/concluído), **When** o mesmo Leitor faz login de novo e abre a Home, **Then** o tutorial **não** reabre automaticamente.
4. **Given** visitante, **When** abre a Home, **Then** o tutorial **não** aparece.
5. **Given** Leitores já existentes no deploy da feature, **When** fazem o próximo login, **Then** **não** recebem o tutorial automático (backfill de “já visto” — ver Plan).

#### User Story 2 — Agir a partir do tutorial (Priority: P1)

Do tutorial, o Leitor pode ir direto às ações: abrir Comunidade / recomendações para seguir, abrir cadastro de livro, abrir Indicação com IA — sem precisar “lembrar o caminho”.

**Razão da prioridade P1:** Tutorial sem CTA vira só texto; o valor é conduzir à ação.

**Independent Test:** Em cada passo com CTA, acionar e verificar que a superfície correta abre (Comunidade ou bloco de recomendações; `BookUpsert`; dialog de IA).

**Acceptance Scenarios:**

1. **Given** passo de seguir, **When** aciona o CTA principal, **Then** chega à Comunidade **ou** ao bloco de recomendações na Home (decisão de Plan; ambos válidos se o fluxo for óbvio).
2. **Given** passo de criar livros, **When** aciona o CTA, **Then** abre o fluxo de cadastro de livro já existente.
3. **Given** passo de IA, **When** aciona o CTA, **Then** abre o fluxo de Indicação com IA já existente.
4. **Given** o Leitor conclui uma ação a partir do CTA, **When** fecha a superfície de destino, **Then** pode voltar ao app sem estado quebrado (Home utilizável).

#### User Story 3 — Aviso quando não segue ninguém (Priority: P1)

Enquanto o Leitor autenticado **não segue nenhum outro leitor**, a plataforma mostra um aviso claro e recomenda pessoas para seguir.

**Razão da prioridade P1:** Pedido explícito (“avisar que ele não segue” + mostrar usuários).

**Independent Test:** Usuário com `seguindo = 0` vê o aviso e a lista de recomendações. Após seguir ≥ 1, o aviso some (ou deixa de ser o estado “zero seguindo”).

**Acceptance Scenarios:**

1. **Given** Leitor autenticado com zero seguindo, **When** está na Home (e/ou Comunidade — Plan define superfícies mínimas; Home é obrigatória), **Then** vê aviso em pt-BR de que ainda não segue ninguém.
2. **Given** o aviso visível, **When** há leitores recomendáveis, **Then** vê uma lista/carrossel de recomendações com avatar, nome e motivo curto (ex.: gênero em comum).
3. **Given** o Leitor segue alguém a partir da recomendação, **When** a ação tem sucesso, **Then** a contagem de seguindo passa a ≥ 1 e o aviso de “zero seguindo” **deixa de ser exibido**.
4. **Given** zero seguindo e **nenhum** candidato recomendável, **When** o aviso aparece, **Then** ainda há CTA para a Comunidade (descoberta manual), sem lista fantasma.

#### User Story 4 — Recomendação por afinidade de Gênero (Priority: P1)

As recomendações priorizam leitores cujo gosto (gênero mais lido ou mais cadastrado, no sentido da Comunidade) **intersecta** os gêneros presentes nos livros do Leitor logado.

**Razão da prioridade P1:** É o critério pedido (“mesmo gênero”).

**Independent Test:** Leitor A com livros no gênero G. Leitor B com mais lido/cadastrado G. A com seguindo=0. B aparece nas recomendações de A. Leitor C só com gênero H distinto e sem overlap não é priorizado sobre B.

**Acceptance Scenarios:**

1. **Given** o Leitor logado tem pelo menos um livro **visível a si mesmo** com Gênero preenchido, **When** as recomendações são calculadas, **Then** candidatos com overlap de gênero são preferidos aos sem overlap.
2. **Given** overlap, **When** a UI mostra o motivo, **Then** o motivo cita o Gênero em comum em rótulo pt-BR (ex.: “Também curte Fantasia”).
3. **Given** livro privado de **outro** leitor que o logado **não** pode ver, **When** o gosto do outro é calculado para recomendação, **Then** esse livro **não** entra (mesma privacidade da Comunidade / RN-COM-10).
4. **Given** o próprio Leitor logado, **When** a lista é montada, **Then** ele **nunca** aparece como recomendação.

#### User Story 5 — Cold start sem gêneros próprios (Priority: P2)

Se o Leitor ainda não tem livros com gênero, a plataforma ainda recomenda alguém (fallback), sem fingir afinidade de gênero.

**Razão da prioridade P2:** Não bloqueia o aviso de zero-seguindo; qualidade da recomendação é menor.

**Independent Test:** Conta nova sem livros; seguindo=0; ainda vê candidatos com motivo genérico (“Leitor ativo na comunidade”) ou baseado em atividade, nunca “mesmo gênero” inventado.

**Acceptance Scenarios:**

1. **Given** Leitor sem gêneros próprios, **When** recomendações são exibidas, **Then** há fallback ordenado (ex.: atividade / quantidade de livros visíveis) **sem** alegar gênero em comum.
2. **Given** depois o Leitor cadastra livros com gênero, **When** as recomendações atualizam, **Then** passam a priorizar overlap quando existir.

#### User Story 6 — Reabrir o tutorial (Priority: P3)

O Leitor que já viu o tutorial no primeiro login pode reabri-lo sob demanda (exceção explícita à regra de não reexibir).

**Razão da prioridade P3:** Útil, não bloqueia MVP.

**Independent Test:** Após o primeiro login, usar atalho “Ver tutorial de novo”; o fluxo reabre sem resetar o aviso de zero-seguindo nem limpar `welcome_tutorial_seen_at`.

**Acceptance Scenarios:**

1. **Given** tutorial já marcado como visto, **When** aciona reabrir, **Then** o tutorial aparece novamente.
2. **Given** reabertura, **When** fecha, **Then** estado de seguindo / aviso permanece coerente e o próximo login **continua** sem abrir o tutorial automaticamente.

---

## 5. Regras de domínio (novas RNs propostas)

> Promover ao vault / `CONTEXT` após aprovação e entrega. Prefixo provisório **RN-ONB-**.

- **RN-ONB-01 — Acesso:** Tutorial, aviso de zero-seguindo e recomendações personalizadas são exclusivos de **Leitor autenticado**. Visitante não vê.
- **RN-ONB-02 — Primeiro login apenas:** O tutorial automático ocorre **somente** enquanto o Leitor ainda não tem marca de “tutorial visto”. Essa marca é **por Leitor**, persistida no servidor. Deve ser gravada **ao exibir** o tutorial (e também ao pular/concluir, se ainda nula), para que o **segundo login** nunca reabra o fluxo sozinho — mesmo se o Leitor fechou o app no meio do primeiro.
- **RN-ONB-03 — Não bloqueante:** Nenhuma ação do app (Home, Comunidade, cadastro, IA) exige ver o tutorial até o fim ou seguir alguém.
- **RN-ONB-04 — Condição do aviso:** O aviso “você ainda não segue ninguém” aparece **somente** enquanto a quantidade de pessoas que o Leitor **segue** é **zero**. Seguir ≥ 1 remove o aviso automaticamente.
- **RN-ONB-05 — Semântica de seguir:** Seguir a partir do tutorial/aviso usa a **mesma** relação `user_followers` da Comunidade / perfil (unidirecional).
- **RN-ONB-06 — Autoexclusão:** O Leitor logado nunca é candidato a recomendação e não pode seguir a si mesmo.
- **RN-ONB-07 — Gosto do logado:** Conjunto de Gêneros do Leitor logado = gêneros preenchidos nos livros em que ele **participa** (`readers` ∪ `chosen_by`) e que **ele mesmo** pode ver (sempre os próprios, pelas regras atuais).
- **RN-ONB-08 — Gosto do candidato:** Para cada outro leitor, usa gênero mais lido e/ou mais cadastrado **visível ao Leitor logado**, no mesmo espírito de RN-COM-07/08/10 (privacidade de livros individuais).
- **RN-ONB-09 — Overlap:** Há afinidade quando a interseção entre o conjunto de gêneros do logado (RN-ONB-07) e o conjunto {mais lido, mais cadastrado} do candidato (quando existirem) **não é vazia**. Em caso de vários, o motivo exibido escolhe um gênero da interseção (desempate alfabético pt-BR do rótulo).
- **RN-ONB-10 — Ordenação:** (1) candidatos com overlap antes dos sem overlap; (2) entre iguais, maior “força” de overlap (ex.: soma das contagens do gênero em comum no candidato); (3) empate: nome de exibição pt-BR. Fallback sem gêneros do logado: ordenar por atividade visível (ex.: livros cadastrados visíveis) e nome.
- **RN-ONB-11 — Limite:** Exibir no máximo **N** recomendações no aviso (N padrão **5**; Plan pode ajustar). Comunidade continua sendo a descoberta completa.
- **RN-ONB-12 — Idioma:** Todo copy do tutorial, aviso, motivos, vazios e erros em **pt-BR**.
- **RN-ONB-13 — Relação com 005:** Esta feature **introduz** recomendações automáticas de quem seguir; a tela Comunidade permanece o diretório completo. Não duplicar o diretório inteiro no aviso.

---

## 6. Functional Requirements

### 6.1 Tutorial

- **FR-001:** O sistema MUST apresentar o tutorial automático **somente** no primeiro login do Leitor (Home autenticada com marca de visto ainda nula).
- **FR-002:** O tutorial MUST cobrir explicitamente: seguir leitores, cadastrar livros, Indicação com IA.
- **FR-003:** Ao exibir o tutorial (e ao pular/concluir se ainda não marcado), o sistema MUST persistir “visto” no servidor (RN-ONB-02). Logins seguintes MUST NOT reabrir automaticamente.
- **FR-004:** CTAs do tutorial MUST conduzir às superfícies reais de seguir, cadastro e IA (FR alinhado às US2).
- **FR-005:** Visitante MUST NOT ver o tutorial.
- **FR-022:** (P3) O sistema MUST oferecer reabertura manual do tutorial sem limpar a marca de visto do primeiro login.
- **FR-023:** Leitores já existentes na base no deploy MUST ser tratados como já tendo visto o tutorial (sem surpresa no próximo login).

### 6.2 Aviso de zero-seguindo

- **FR-006:** Com seguindo = 0, a Home MUST exibir aviso em pt-BR de que o Leitor ainda não segue ninguém.
- **FR-007:** Com seguindo ≥ 1, o aviso de zero-seguindo MUST NOT permanecer visível.
- **FR-008:** O aviso MUST oferecer seguir a partir das recomendações e/ou navegar à Comunidade.
- **FR-009:** Empty states da Home que incentivam seguir MUST apontar para Comunidade (ou para o aviso), **não** para o diretório legado do perfil.

### 6.3 Recomendações

- **FR-010:** O sistema MUST calcular candidatos excluindo o próprio Leitor e quem ele **já** segue (quando seguindo > 0 o aviso some; se recomendações forem reutilizadas noutro lugar no futuro, a exclusão de já-seguidos continua válida).
- **FR-011:** Com gêneros próprios, o sistema MUST priorizar overlap (RN-ONB-09/10).
- **FR-012:** Cada item recomendado MUST mostrar avatar, nome de exibição e motivo curto em pt-BR.
- **FR-013:** Cada item MUST permitir seguir (e refletir estado) com o mesmo comportamento social do produto.
- **FR-014:** Cálculo de gêneros de candidatos MUST respeitar visibilidade de livros (RN-ONB-08).
- **FR-015:** Sem candidatos, MUST mostrar empty compreensível + CTA Comunidade.
- **FR-016:** Sem gêneros próprios, MUST usar fallback (US5) sem inventar motivo de gênero.

### 6.4 Qualidade

- **FR-017:** Falha ao carregar recomendações MUST informar em pt-BR e MUST NOT quebrar a Home.
- **FR-018:** Falha ao seguir MUST informar em pt-BR e preservar estado anterior.
- **FR-019:** Controles principais MUST ter nome acessível (inclui nome do leitor no seguir).
- **FR-020:** E-mail de outros leitores MUST NOT aparecer no tutorial nem nas recomendações.
- **FR-021:** Textos MUST usar a terminologia do domínio (Leitor, Gênero, Livro) — evitar “usuário social”, “amigo”, “categoria”.

---

## 7. Success Criteria

- **SC-001:** Em conta nova (tutorial nunca visto), no **primeiro** login o tutorial aparece na Home autenticada em até **5 s** em condições normais (ou loading explícito — nunca tela muda sem feedback).
- **SC-002:** No **segundo** login do mesmo Leitor (após a marca de visto), a Home **não** reabre o tutorial automaticamente — inclusive se no primeiro login ele só abriu e fechou o app.
- **SC-003:** Conta com seguindo = 0 vê o aviso; após seguir 1 leitor com sucesso, o aviso desaparece sem refresh manual forçado além do refetch normal do app.
- **SC-004:** Em fixture A(gênero G) / B(top G) / C(sem G), B aparece antes de C nas recomendações de A; o motivo de B menciona G.
- **SC-005:** Livro privado invisível ao visitante não altera o top de gênero do candidato usado na recomendação.
- **SC-006:** Visitante não vê tutorial, aviso nem nomes/avatars de recomendações personalizadas.
- **SC-007:** Auditoria rápida: avançar/pular tutorial, seguir recomendado e ir à Comunidade operáveis por teclado.

---

## 8. Edge cases

| Caso | Comportamento esperado |
|------|------------------------|
| Único usuário no sistema | Aviso de zero-seguindo + empty de recomendações + CTA inútil atenuado (“Em breve haverá outros leitores”) ou só copy sem botão morto para lista vazia; Comunidade Todos vazia já existe. |
| Todos os outros já seguidos | Aviso não se aplica (seguindo ≥ 1). |
| Empate de gêneros no motivo | Rótulo alfabético pt-BR. |
| Nome de exibição vazio legado | Rótulo **Leitor**, nunca UUID. |
| Sem avatar | Fallback visual do produto. |
| Tutorial aberto + usuário segue alguém noutro texto | Ao fechar, Home reflete seguindo atual; aviso some se ≥ 1. |
| Fecha o app no meio do tutorial no 1º login | Marca de visto já gravada ao exibir; 2º login sem tutorial automático. |
| Conta existente no deploy | Backfill “já visto”; não recebe tutorial surpresa. |
| IA indisponível no passo do tutorial | CTA ainda abre o dialog; erro da IA permanece o tratamento já existente — tutorial não precisa mockar sucesso. |
| Leitor só com livros sem gênero | Fallback US5; sem chip “mesmo gênero”. |
| Muitos candidatos | Cortar em N (RN-ONB-11); resto na Comunidade. |

---

## 9. Riscos, dependências e premissas

### 9.1 Premissas

- Relação de seguir, Comunidade (005), cadastro de livros e Indicação com IA já existem.
- Gênero do livro é o slug/rótulo de `genders` / campo `books.gender`.
- Agregação de gênero por leitor na Comunidade (RPC INVOKER) é a base preferida para o gosto do candidato.

### 9.2 Riscos

- **R-01 — Custo de ranking:** N leitores × gêneros. Mitigação no Plan (RPC dedicada ou reuso + filtro server-side).
- **R-02 — Tutorial irritante:** Mitigado por **uma única** exibição automática (primeiro login), pular, persistência ao exibir e não bloqueante.
- **R-03 — Copy desatualizada (perfil vs comunidade):** Mitigado por FR-009.
- **R-04 — Cold start fraco:** Fallback P2; não inventar afinidade.

### 9.3 Dependências internas

- `user_followers` + `useOptimisticFollowToggle` / `UserSocialService`.
- Módulo Comunidade (gêneros / atividade) ou RPC nova derivada.
- `BookUpsert` e `AiRecommendationDialog` na Home.
- Persistência de flag de tutorial (coluna em `users` ou tabela dedicada — Plan).

---

## 10. Itens marcados como [NEEDS CLARIFICATION]

Nenhum bloqueante para seguir ao Plan. Decisões assumidas (rever se o produto discordar):

1. **Tutorial na Home** (não em rota `/onboarding` obrigatória pós-register).
2. **Só no primeiro login:** marca `welcome_tutorial_seen_at` ao **exibir**; backfill em contas existentes; reabrir é P3 e não limpa a marca.
3. **Aviso obrigatório na Home**; Comunidade pode repetir um banner curto no Plan, mas não é MUST da spec.
4. **N = 5** recomendações no aviso.
5. **Sem tela de “escolha seus gêneros”** no MVP.
6. **Motivo** mostra no máximo um gênero em comum por card.
7. Recomendações automáticas **são intencionais** aqui e supersedem o “não-objetivo” de recomendações da spec 005 **apenas** neste contexto de onboarding/aviso — a Comunidade em si não vira um ranking.

---

## 11. Notas de governança SDD

- Fase atual: **Planned** (`plan.md` + `tasks.md`).
- Issue: https://github.com/matheus98rocha/nosso-tbr/issues/175
- Após entrega: atualizar empty state da Home no README/mapa de funcionalidades; promover RN-ONB-*; eventual ADR se a persistência do tutorial ou a RPC de recomendação forem decisões estruturais.
)
