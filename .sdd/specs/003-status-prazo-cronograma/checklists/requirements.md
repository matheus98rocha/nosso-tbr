# Checklist — Requirements Review

> Use este checklist antes de aprovar a `spec.md` e antes de avançar para a fase **Plan**.

## A. Clareza WHAT/WHY

- [x] A spec descreve **somente** o WHAT e o WHY (sem stack prescritiva)?
- [x] Cada User Story tem prioridade explícita (P1/P2)?
- [x] Cada User Story é **independentemente testável**?
- [x] Cada User Story tem ≥ 1 cenário Given-When-Then?
- [x] Escopo in/out impede persistência e a copy “termina X dias antes”?

## B. Cobertura funcional

- [x] Data prevista nas duas superfícies (US1, FR-005)?
- [x] Ocultação sem cronograma (US5, FR-006)?
- [x] Atraso só de dias vencidos; futuro não lido não atrasa (US2, RNxx-04)?
- [x] Adiantamento antecipa a data prevista, sem “termina X dias antes” (US3, FR-008)?
- [x] Antes do início + zero lidos = em dia (RNxx-07)?
- [x] Singular/plural pt-BR (FR-007, SC-007)?

## C. Privacidade e isolamento

- [x] Só cronograma do usuário autenticado (RN44 / RNxx-11)?
- [x] Home restrita ao progresso do dono; estante/visitante ocultos (FR-010)?

## D. Estados de carregamento e erro

- [x] Loading sem valor parcial (FR-013)?
- [x] Erro não bloqueia (FR-014)?
- [x] Toggle atualiza na tela de Cronograma (US4, FR-011)?

## E. Acessibilidade e localização

- [x] Texto suficiente sem só cor (FR-009, FR-015)?
- [x] Strings em pt-BR (FR-009, SC-007)?

## F. Success Criteria mensuráveis

- [x] SC de correção (SC-001)?
- [x] SC de copy (SC-002)?
- [x] SC de zero persistência de prazo (SC-003)?
- [x] SC das duas superfícies (SC-004)?

## G. Itens em aberto

- [x] §9 só com virada de meia-noite (não bloqueante)?

## H. Conformidade SDD

- [x] Pasta `003-status-prazo-cronograma`?
- [x] Slug kebab-case sem acentos?

## I. Próximos passos

- [x] Spec revisada com feedback do owner (2026-08-16).
- [x] Plan gerado.
- [x] Avançar para `tasks` (`tasks.md`).
- [ ] Aprovar tasks e avançar para `implement`.

---

**Revisor:** Mateus (feedback de produto incorporado)  
**Data:** 2026-08-16  
**Status:** [x] Aprovado com ressalvas (Plan em andamento) · [ ] Aprovado · [ ] Reprovado
