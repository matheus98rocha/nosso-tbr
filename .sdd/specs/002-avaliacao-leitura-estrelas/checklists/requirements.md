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
- [ ] Cobertura do happy path: registrar avaliação ao finalizar (US1)?
- [ ] Cobertura de leitura posterior da própria avaliação (FR-004 / US2)?
- [ ] Cobertura de edição e remoção (FR-007, FR-008 / US3)?
- [ ] Cobertura de isolamento entre usuários no mesmo livro (FR-009 / US4)?
- [ ] Cobertura de visitante não autenticado (FR-010)?
- [ ] Cobertura de distinção entre “sem avaliação” e “nota mínima” (FR-005)?

## C. Privacidade e isolamento

- [ ] A regra de avaliação **por usuário** está explícita e testável (US4, FR-009)?
- [ ] Está claro se há ou não **visibilidade social** — item listado em §9?

## D. Estados de carregamento e erro

- [ ] Falha ao salvar está descrita como compreensível e não fantasiosa (FR-013)?
- [ ] Validação de escala está coberta (FR-014)?

## E. Acessibilidade e localização

- [ ] Teclado + tecnologias assistivas para o controle de estrelas (FR-011)?
- [ ] Informação não depende só de cor (FR-012)?
- [ ] Strings em pt-BR (FR-006)?

## F. Success Criteria mensuráveis

- [ ] Cada SC é **mensurável**?
- [ ] Há SC ligado a persistência correta (SC-001)?
- [ ] Há SC ligado a isolamento entre usuários (SC-002)?
- [ ] Há SC ligado a acessibilidade (SC-003)?
- [ ] Há SC ligado a consistência de estado após decisões de §9 (SC-004)?

## G. Itens em aberto

- [ ] Todos os `[NEEDS CLARIFICATION]` estão listados na seção 9 da spec?
- [ ] Itens de §9 foram distribuídos como decisões explícitas na fase Plan?

## H. Conformidade SDD

- [ ] Numeração da pasta (`002-...`) está correta e única?
- [ ] Pasta segue a convenção `.sdd/specs/NNN-<slug>/`?
- [ ] Slug da feature é semântico e em kebab-case sem acentos (`avaliacao-leitura-estrelas` ✅)?

## I. Próximos passos

- [ ] Aprovar a spec (visto explícito do owner).
- [ ] Resolver pendências de §9 na Plan / refinamento de produto.
- [ ] Avançar para a fase **Plan** (`plan:` + stack).

---

**Revisor:** _______________________  
**Data:** _______________________  
**Status:** [ ] Aprovado · [ ] Aprovado com ressalvas · [ ] Reprovado
