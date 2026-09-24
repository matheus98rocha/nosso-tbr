# Notificações de Novos Livros — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a base persistente e atômica para gerar notificações agrupadas quando um ator cadastra livros visíveis para seus seguidores.

**Architecture:** Uma migration do Supabase cria preferências e notificações por destinatário, com RLS restritivo. Uma função PostgreSQL acionada após inserção de livro identifica `auth.uid()` como ator, seleciona seguidores elegíveis e faz upsert no lote não lido; a leitura e a marcação serão expostas posteriormente pelo Ticket #156.

**Tech Stack:** Next.js, TypeScript, Supabase/PostgreSQL, migrations SQL, Vitest.

**Spec:** GitHub Issue #155; [CONTEXT.md](../../../CONTEXT.md); ADRs 0001–0003 em `docs/adr/`.

## Global Constraints

- O ator é o usuário autenticado que cadastrou o livro, não `books.user_id` nem `books.chosen_by`.
- O próprio ator não recebe notificação.
- A preferência ausente significa notificações ativadas.
- O agrupamento é por destinatário + ator enquanto a notificação permanece não lida.
- Livros em qualquer status podem gerar notificações.
- Um livro invisível ao destinatário não gera notificação para esse destinatário.
- Falha na geração deve reverter o cadastro do livro.
- A notificação não expõe título nem capa.

## Review Focus

- **Executor diferente do leitor responsável:** cadastrar um livro para outra pessoa ainda atribui a atividade ao `auth.uid()`; teste na Task 2.
- **Preferência ausente versus explicitamente desligada:** ausência habilita, `false` bloqueia; testes na Task 1.
- **Privacidade por destinatário:** o mesmo livro pode ser visível para um seguidor e invisível para outro; testes na Task 2.
- **Agrupamento concorrente:** novas adições do mesmo ator não criam lotes paralelos não lidos; teste na Task 2.
- **Rollback transacional:** falha ao criar um destinatário não deixa o livro persistido sem sua notificação; teste na Task 2.

### Task 1: Modelar preferências e notificações com RLS

**Files:**
- Create: `supabase/migrations/20260923010000_book_notifications.sql`
- Modify: `database.types.ts` (regenerar após aplicar a migration, sem editar manualmente o contrato)
- Test: `src/integration/bookNotifications.integration.test.ts`

**Interfaces:**
- Consumes: `public.users`, `public.user_followers`, `public.books` e a função de visibilidade já usada pela política de livros.
- Produces: tabelas de preferência e notificação, índices de destinatário/estado/data, constraints de integridade, policies de leitura e uma RPC que só marca como lida a notificação do próprio destinatário.

- [ ] **Step 1: Escrever o teste de contrato do schema**

  Cubra que a preferência identifica unicamente `(follower_id, following_id)`, que a notificação pertence a um destinatário e ator, que a quantidade é positiva, que `read_at` distingue lida/não lida e que usuários não podem ler ou alterar dados de outro destinatário.

- [ ] **Step 2: Executar o teste para confirmar a falha**

  Run: `yarn test --run src/integration/bookNotifications.integration.test.ts`.

  Expected: FAIL porque as tabelas, constraints e policies ainda não existem.

- [ ] **Step 3: Criar a migration mínima**

  Criar uma tabela de preferências com default lógico ativado e uma tabela de notificações contendo identificadores do destinatário e ator, tipo da atividade, quantidade, `created_at`, `updated_at` e `read_at`. Criar índices para notificações recentes do destinatário e não lidas. Ativar RLS e permitir somente que o destinatário consulte sua própria notificação; expor uma RPC que altere exclusivamente `read_at`. Preferências devem permitir que o seguidor autenticado consulte e altere apenas suas próprias linhas.

- [ ] **Step 4: Atualizar os tipos gerados**

  Regenerar o contrato TypeScript do Supabase usando o fluxo já adotado pelo projeto e conferir que os nomes, nullable fields e constraints correspondem à migration.

- [ ] **Step 5: Executar o teste novamente**

  Run: o mesmo teste de schema/RLS da Task 1.

  Expected: PASS.

- [ ] **Step 6: Verificar tipos**

  Run: `yarn type-check`.

  Expected: exit code 0.

### Task 2: Gerar e agrupar notificações no cadastro do livro

**Files:**
- Modify: `supabase/migrations/20260923010000_book_notifications.sql`
- Test: `src/integration/bookNotifications.integration.test.ts`
- Test: testes existentes do endpoint de criação de livro, para preservar atomicidade e autorização

**Interfaces:**
- Consumes: evento de inserção em `public.books`, `auth.uid()`, `public.user_followers`, preferências e função de visibilidade parametrizada pelo destinatário.
- Produces: uma notificação não lida por destinatário e ator, com incremento/upsert idempotente.

- [ ] **Step 1: Escrever o teste do ator e destinatários**

  Criar um cenário com Matheus autenticado, dois seguidores, uma preferência ausente, uma preferência explicitamente desligada e o próprio Matheus. Inserir um livro e afirmar que somente o seguidor elegível recebe a notificação; `user_id`/`chosen_by` do livro devem poder apontar para outra pessoa sem mudar o ator.

- [ ] **Step 2: Executar o teste para confirmar a falha**

  Run: `yarn test --run src/integration/bookNotifications.integration.test.ts`.

  Expected: FAIL porque nenhuma notificação é criada.

- [ ] **Step 3: Implementar a função de geração e o trigger**

  Na mesma transação do insert, capturar `auth.uid()` como ator. Selecionar seguidores ativos do ator, ignorar o ator, aceitar preferência ausente e excluir destinatários para os quais o livro não seja visível. Fazer upsert no lote não lido do par destinatário/ator, incrementando a quantidade e atualizando `updated_at`; notificações lidas devem iniciar um novo lote. Se `auth.uid()` estiver ausente, não gerar notificação.

- [ ] **Step 4: Executar o teste do ator e destinatários**

  Run: `yarn test --run src/integration/bookNotifications.integration.test.ts`.

  Expected: PASS.

- [ ] **Step 5: Escrever o teste de agrupamento e visibilidade**

  Inserir duas vezes para o mesmo ator e destinatário e afirmar uma única notificação não lida com quantidade 2 e data atualizada. Adicionar um destinatário sem acesso ao livro e afirmar ausência de notificação para ele.

- [ ] **Step 6: Executar o teste de agrupamento**

  Run: `yarn test --run src/integration/bookNotifications.integration.test.ts`.

  Expected: FAIL antes do ajuste se o upsert ou a visibilidade não estiverem implementados; depois, PASS.

- [ ] **Step 7: Escrever o teste de atomicidade**

  Forçar uma falha na criação do registro de notificação e afirmar que a inserção do livro também não permanece confirmada.

- [ ] **Step 8: Executar o teste de atomicidade**

  Run: `yarn test --run src/integration/bookNotifications.integration.test.ts src/app/api/books/route.test.ts`.

  Expected: PASS, demonstrando rollback transacional.

- [ ] **Step 9: Executar a suíte relacionada**

  Run: `yarn test --run src/app/api/books/route.test.ts`.

  Expected: PASS sem regressões no cadastro existente.

### Task 3: Verificar a fatia completa do Ticket #155

**Files:**
- Modify: somente arquivos das Tasks 1–2, caso a verificação revele inconsistência
- Test: testes de integração SQL e endpoint já criados

**Interfaces:**
- Consumes: migration, RLS e trigger das Tasks 1–2.
- Produces: uma base pronta para o Ticket #156 consultar e marcar notificações.

- [ ] **Step 1: Rodar todos os testes da fatia**

  Run: `yarn test --run src/integration/bookNotifications.integration.test.ts src/app/api/books/route.test.ts`.

  Expected: todos os testes relacionados passam.

- [ ] **Step 2: Rodar validações estáticas**

  Run: `yarn type-check` e `yarn lint`.

  Expected: exit code 0; nenhum warning novo relacionado à mudança.

- [ ] **Step 3: Inspecionar a migration final**

  Confirmar que não há privilégios para `anon`, que toda leitura/escrita de notificação é limitada ao destinatário e que o trigger não usa `user_id`/`chosen_by` como ator.

- [ ] **Step 4: Registrar a implementação no Ticket #155**

  Publicar comentário no issue com testes executados, migration criada e qualquer limitação de ambiente Supabase local/linked.
