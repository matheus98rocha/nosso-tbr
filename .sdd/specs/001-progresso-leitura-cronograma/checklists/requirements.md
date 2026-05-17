# Checklist — Requirements Review

> Use este checklist antes de aprovar a `spec.md` e antes de avançar para a fase **Plan**.

## A. Clareza WHAT/WHY

- [ ] A spec descreve **somente** o WHAT e o WHY (sem stack, sem padrões de código, sem detalhes de API/SDK)?
- [ ] Cada User Story tem prioridade explícita (P1/P2/P3)?
- [ ] Cada User Story é **independentemente testável**?
- [ ] Cada User Story tem ≥ 1 cenário no formato Given-When-Then?
- [ ] O escopo (in/out) está explícito o suficiente para impedir scope creep?

## B. Cobertura funcional

- [ ] Todos os comportamentos descritos no WHY estão cobertos por pelo menos um FR?
- [ ] Cobertura do happy path (usuário logado, livro `reading` com cronograma)?
- [ ] Cobertura do caminho negativo principal: **sem cronograma** → ocultação silenciosa (FR-004)?
- [ ] Cobertura do caminho negativo secundário: **status ≠ reading** → não exibir (FR-005)?
- [ ] Cobertura de **visitante anônimo** (FR-008)?
- [ ] Cobertura do contexto **estante** (FR-007) e da diferenciação imposta pela RN55?

## C. Privacidade e isolamento

- [ ] A regra de isolamento por `owner` (RN44) está reiterada e testável (User Story 3 / RNxx-04)?
- [ ] Não há vazamento conceitual de progresso entre usuários em livros coletivos?

## D. Estados de carregamento e erro

- [ ] Comportamento durante loading inicial está descrito (FR-012)?
- [ ] Comportamento em caso de erro de rede está descrito e é não bloqueante (FR-013)?
- [ ] Comportamento otimista (toggle de leitura) está consistente entre superfícies (FR-010, FR-011)?

## E. Acessibilidade e localização

- [ ] A semântica do indicador é acessível a leitores de tela (FR-014)?
- [ ] A informação não depende apenas de cor (FR-014)?
- [ ] Todos os textos visíveis estão especificados em pt-BR (FR-009)?

## F. Success Criteria mensuráveis

- [ ] Cada SC é **mensurável** (sem adjetivos vagos como "rápido" ou "bonito")?
- [ ] Há SC ligado a correção numérica (SC-003)?
- [ ] Há SC ligado a performance/não regressão (SC-005)?
- [ ] Há SC ligado a isolamento entre usuários (SC-006)?

## G. Itens em aberto

- [ ] Todos os `[NEEDS CLARIFICATION]` estão listados na seção 9 da spec?
- [ ] Nenhum item em aberto bloqueia a fase Plan (apenas decisões técnicas a serem tomadas lá)?

## H. Conformidade SDD

- [ ] Numeração da pasta (`001-...`) está correta e única?
- [ ] Pasta segue a convenção `.sdd/specs/NNN-<slug>/`?
- [ ] Slug da feature é semântico e em kebab-case sem acentos (`progresso-leitura-cronograma` ✅)?
- [ ] Nenhuma menção a stack tecnológica fora das seções de **dependências internas** (que são contextuais, não prescritivas)?

## I. Próximos passos

- [ ] Aprovar a spec (visto explícito do owner).
- [ ] Resolver pendências bloqueantes (se surgirem).
- [x] Avançar para a fase **Plan** (concluído em 2026-05-17 → ver `plan.md` / `data-model.md` / `contracts/`).

---

## J. Pós-Plan (Fase 2 entregue)

- [ ] Revisar `plan.md` (decisões §2.1, §2.2, §2.3 que resolvem os `[NEEDS CLARIFICATION]` da spec).
- [ ] Revisar `data-model.md` (zero alterações de schema; apenas RPC derivada).
- [ ] Revisar `contracts/api-spec.md` (novo `GET /api/schedule/progress`).
- [ ] Revisar `contracts/rpc-spec.sql` (RPC `get_schedule_progress_for_books`).
- [ ] Confirmar índice `schedule(owner, book_id)` (criar via migration apenas se ausente — checar [[database/database-indexes-views]] no vault).
- [ ] Avançar para Fase 3 (`tasks`) ou pausar para revisão arquitetural.

---

**Revisor:** _______________________
**Data:** _______________________
**Status:** [ ] Aprovado · [ ] Aprovado com ressalvas · [ ] Reprovado
