# Feature Specification: Leitores populares na Home

**Feature ID:** 007  
**Status:** Draft (Specify)  
**Owner:** Mateus  
**Criada em:** 2026-10-20  
**Issue relacionada:** [#177](https://github.com/matheus98rocha/nosso-tbr/issues/177)  
**Relação com 006:** A issue #175 (tutorial / zero-seguindo / recomendações por gênero) permanece para onboarding. Esta feature **é** a superfície de descoberta horizontal na Home (leitores populares + seguir + esconder). O overlap de gênero da #175 converge aqui; autores e popularidade (seguidores) entram no ranking.

**Domínios relacionados:** [[CONTEXT]] · [[features/005-tela-comunidade]] · [[features/aba-seguindo-livros-seguidos]] · [[database/database-schema]]

---

## 1. Resumo executivo

O leitor autenticado precisa **descobrir quem seguir sem sair da Home**. Hoje a descoberta vive na Comunidade (005); a Home só mostra livros e um empty state estático. Não há lista de leitores sugeridos, nem ranking por afinidade ou popularidade.

Esta feature adiciona na Home uma **lista horizontal de leitores populares**: cada item mostra identidade (avatar + nome), permite **seguir**, e a seção tem opção de **esconder**. A ordem privilegia leitores com **mais seguidores** e **leituras em comum** com o logado, derivadas de **gênero** e **autores** dos livros visíveis.

---

## 2. Por quê (motivação)

- **Descoberta no fluxo diário:** a Home é o destino principal; obrigar a ir à Comunidade reduz follows.
- **Sinal de afinidade:** popularidade sozinha recomenda celebridades sem gosto em comum; overlap de gênero e autores dá contexto de leitura.
- **Controle do leitor:** quem não quer a faixa deve poder escondê-la sem perder o resto da Home.
- **Alinhamento com 005:** reusa seguir, avatares e privacidade de livros; não reabre ranking genérico nem feed social.

---

## 3. Escopo

### 3.1 Dentro do escopo

- Faixa **Leitores populares** na Home, **somente autenticado**.
- Lista **horizontal** (scroll) com leitores candidatos: avatar, nome de exibição, ação **Seguir** / **Seguindo**.
- Ordenação por score combinando:
  1. quantidade de **seguidores** do candidato;
  2. **leituras em comum** por **gênero** (overlap com o gosto do logado);
  3. **leituras em comum** por **autor** (overlap com autores dos livros do logado).
- Excluir o próprio leitor e, por padrão, quem o logado **já segue** (a faixa é descoberta).
- Opção **Esconder** a faixa, com persistência por leitor (não volta sozinha na próxima visita no mesmo dispositivo/conta — ver plan).
- Estados vazios, carregamento e erro em **pt-BR**; falha de seguir não quebra a Home.
- Respeitar **privacidade de livros** ao calcular overlap (só livros que o visitante pode ver).
- Atalho opcional para a Comunidade (“Ver mais”) quando houver candidatos.

### 3.2 Fora do escopo (não-objetivos)

- **NÃO** tutorial de boas-vindas completo (permanece na #175 / 006).
- **NÃO** aviso dedicado de “zero seguindo” fora desta faixa (006).
- **NÃO** feed de atividade, ranking global público, mensagens ou indicação por IA de **livros**.
- **NÃO** alterar a aba **Seguindo** da Home (livros de quem você segue).
- **NÃO** exibir e-mail de terceiros.
- **NÃO** seguir a si mesmo.
- **NÃO** portar para Expo nesta entrega.
- **NÃO** exigir follow mútuo para aparecer como candidato.

---

## 4. Personas e cenários

### Personas

- **Leitor autenticado** — quer achar gente com gosto parecido e seguir sem sair da Home.
- **Visitante** — não autenticado; não vê a faixa.

### User Story 1 — Ver leitores populares na Home (Priority: P1)

O leitor logado abre a Home e vê uma lista horizontal de outros leitores, ordenados por popularidade + afinidade, sem incluir a si mesmo nem quem já segue.

**Razão P1:** Sem a faixa, não há descoberta no fluxo principal.

**Independent Test:** Autenticar com rede e livros de gêneros/autores conhecidos; abrir Home; conferir faixa com avatar + nome; visitante não vê.

**Acceptance Scenarios:**

1. **Given** um leitor autenticado com candidatos elegíveis, **When** abre a Home, **Then** vê a faixa **Leitores populares** com lista horizontal.
2. **Given** a lista, **When** renderiza, **Then** cada item tem avatar e nome (nunca e-mail; nome vazio → rótulo **Leitor**).
3. **Given** o próprio usuário, **Then** ele **não** aparece na lista.
4. **Given** leitores que o usuário já segue, **Then** eles **não** aparecem na lista de descoberta.
5. **Given** um visitante, **When** abre a Home, **Then** a faixa **não** é exibida.

### User Story 2 — Seguir a partir da faixa (Priority: P1)

O leitor segue alguém na faixa sem navegar para perfil ou Comunidade.

**Razão P1:** Ação social principal.

**Independent Test:** Seguir um candidato; botão vira Seguiendo; o item some da faixa (ou some no próximo refresh) e passa a contar em “seguindo”.

**Acceptance Scenarios:**

1. **Given** um candidato não seguido, **When** o usuário confirma Seguir, **Then** a relação é criada e o item deixa de ser candidato de descoberta.
2. **Given** falha ao seguir, **When** a ação não completa, **Then** mensagem pt-BR e o estado da faixa/Home é preservado.
3. **Given** alvo de toque no botão Seguir, **Then** área clicável ≥ 44px e `aria-label` inclui o nome do leitor.

### User Story 3 — Esconder a faixa (Priority: P1)

O leitor esconde a faixa; ela permanece oculta nas visitas seguintes até ele optar por reexibir (se houver controle de reexibir nesta entrega — ver FR de reexibir).

**Razão P1:** Pedido explícito; evita ruído para quem não quer social discovery.

**Independent Test:** Clicar Esconder; recarregar Home; faixa ausente. Preferência associada ao leitor logado.

**Acceptance Scenarios:**

1. **Given** a faixa visível, **When** o usuário escolhe **Esconder**, **Then** a faixa some imediatamente.
2. **Given** a faixa escondida, **When** o usuário recarrega a Home autenticado, **Then** a faixa continua oculta.
3. **Given** visitante ou outro leitor na mesma máquina, **Then** a preferência de esconder **não** vazá entre contas (chave por `user id`).

### User Story 4 — Ordenação por seguidores + afinidade (Priority: P1)

A ordem reflete mais seguidores e mais leituras em comum (gênero e autores), usando só livros visíveis.

**Razão P1:** Define o “populares” do produto.

**Independent Test:** Fixture com A (muitos seguidores, zero overlap), B (poucos seguidores, alto overlap de gênero/autor); B ranqueia acima de A quando o peso de afinidade domina o empate configurado no plan — ou documentar pesos e assertar ordem estável.

**Acceptance Scenarios:**

1. **Given** dois candidatos, **When** um tem maior score (seguidores + overlap gênero + overlap autor), **Then** aparece antes na lista.
2. **Given** overlap calculado, **When** um livro do candidato é privado e invisível ao logado, **Then** esse livro **não** conta para gênero nem autor em comum.
3. **Given** empate de score, **Then** desempate estável (ex.: nome pt-BR, depois `id`).

### User Story 5 — Reexibir e ver mais (Priority: P2)

Quem escondeu pode reexibir (atalho leve, ex. nas configurações da Home ou link na Comunidade). “Ver mais” leva à Comunidade.

**Acceptance Scenarios:**

1. **Given** faixa escondida, **When** o usuário escolhe reexibir (controle P2), **Then** a faixa volta na Home.
2. **Given** candidatos na faixa, **When** aciona **Ver comunidade**, **Then** navega para `/community`.

### User Story 6 — Empty / loading (Priority: P2)

Sem candidatos (todos seguidos ou rede vazia), a faixa não ocupa espaço com skeleton eterno nem copy enganosa.

**Acceptance Scenarios:**

1. **Given** zero candidatos elegíveis e faixa não escondida, **When** a query resolve, **Then** a faixa **não** é renderizada (ou empty discreto sem CTA agressivo — preferir omitir).
2. **Given** carregamento, **When** a Home já mostra livros, **Then** a faixa pode skeletonizar sem bloquear o restante da página.

---

## 5. Requirements (Functional)

| ID | Requirement | Priority |
| -- | ----------- | -------- |
| FR-001 | Faixa na Home para autenticado | P1 |
| FR-002 | Visitante não vê a faixa | P1 |
| FR-003 | Lista horizontal com scroll | P1 |
| FR-004 | Item: avatar + nome + Seguir/Seguindo | P1 |
| FR-005 | Excluir self da lista | P1 |
| FR-006 | Excluir já seguidos da lista de descoberta | P1 |
| FR-007 | Ordenar por score: seguidores + overlap gênero + overlap autor | P1 |
| FR-008 | Overlap só com livros visíveis ao logado (RLS / INVOKER) | P1 |
| FR-009 | Esconder faixa com persistência por leitor | P1 |
| FR-010 | Seguir via grafo existente; erro pt-BR | P1 |
| FR-011 | Sem e-mail de terceiros | P1 |
| FR-012 | Textos e empty/loading em pt-BR | P1 |
| FR-013 | Limite máximo de itens na faixa (ex. 12) | P1 |
| FR-014 | Reexibir faixa (controle) | P2 |
| FR-015 | CTA Ver comunidade | P2 |
| FR-016 | Omitir faixa se zero candidatos | P2 |

---

## 6. Success Criteria

| ID | Criterion |
| -- | --------- |
| SC-001 | Autenticado com candidatos vê a faixa em ≤ 5s ou skeleton; sem tela branca |
| SC-002 | Self nunca aparece |
| SC-003 | Já seguidos não aparecem como descoberta |
| SC-004 | Seguir cria relação e remove o item da faixa |
| SC-005 | Livro privado invisível não altera overlap |
| SC-006 | Esconder persiste após reload para o mesmo leitor |
| SC-007 | Visitante sem payload da faixa |
| SC-008 | Alvo Seguir ≥ 44px e nome acessível |

---

## 7. Edge cases

- Logado sem livros próprios: ranking cai mais em **seguidores**; ainda assim mostra populares (não exige overlap).
- Candidato sem gênero/autor visível: score só por seguidores.
- Rede com um único outro usuário: lista de 1 item.
- Preferência esconder + logout/login mesma conta: permanece escondida.
- Falha da RPC/query: Home de livros segue; faixa omitida ou erro discreto (não toast bloqueante).

---

## 8. Domain notes / glossary gaps

- Usar **Leitor**, não “conta” / “usuário social” (ver `CONTEXT.md`).
- **Leitores populares**: leitores elegíveis à faixa de descoberta na Home, ordenados por popularidade (seguidores) e afinidade (gênero/autor). Proposto para inclusão no glossário se a spec for aprovada.
- **Leituras em comum**: overlap derivado de gêneros e autores presentes nos livros visíveis do logado e do candidato — não implica o mesmo título necessariamente (título em comum pode ser refinamento futuro; fora do MVP).

---

## 9. Assumptions (clarificar se necessário)

1. Overlap é por **conjunto de gêneros/autores**, não por títulos idênticos (MVP).
2. Esconder em P1 = persistência **local por `user id`** (dispositivo); sync multi-device é P3/fora.
3. Pesos do score e limite de itens ficam no `plan.md`.
4. Posição na Home: entre filtros e **Lendo agora** (visível cedo, sem empurrar o hero de contagem).
