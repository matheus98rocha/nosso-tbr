# 📋 Project Roadmap & Bug Tracker

## 🐛 Bugs & Refatorações Técnicas

- [ ] **BUG-01:** Ajustar fetch de livro por ID imediatamente após a criação (Sync Issue).
- [ ] **BUG-02:** Corrigir reset de estado no Cronograma; formulário permanece visível após deleção (Zumbi UI).
- [ ] **BUG-03:** Implementar carregamento de Autor vinculado ao abrir a edição de um Livro.
- [ ] **BUG-04:** Falha na Reversão de Status: "Iniciado" para "Não Iniciado"
      Descrição: O sistema impede que um livro retorne ao status "Não Iniciado" após uma data de início ter sido registrada. O status é uma propriedade calculada (derivada) da existência do campo data_inicio. Quando o usuário tenta editar o livro para remover o progresso, o estado não é resetado corretamente, mantendo o vínculo com a data anterior.

Comportamento Esperado: Ao selecionar o status "Não Iniciado" na edição, o campo data_inicio deve ser definido como null (ou removido do objeto).

Diretrizes de Implementação (Clean Code): \* Encapsulamento: A lógica de "reset" de campos temporais deve estar dentro do hook personalizado de gerenciamento de livros (ex: useBookActions).

Otimização: Certifique-se de que a função de atualização utilize useCallback.

Validação: O hook deve garantir que, se o status for alterado para "Não Iniciado", campos como data_inicio, progresso_paginas e data_fim sejam limpos simultaneamente.

I18n: Se houver exibição de datas, garantir que a formatação respeite o local pt-br (corrigindo o comportamento padrão pl).

Localização Provável do Erro: Verificar a função de update dentro do hook de persistência onde a lógica de merge do objeto livro acontece.

---

## ✨ Novas Features & UX

- [ ] **FEAT-01:** Revisão de Copy: Deixar todos os textos da aplicação mais amigáveis e menos técnicos.
- [ ] **FEAT-02:** Abstração de Regras: Mover lógicas de componentes para Custom Hooks.
- [ ] **FEAT-03:** Otimização de Performance: Aplicar `useCallback` e `useMemo` em funções e cálculos pesados.
- [ ] **FEAT-04:** Arquitetura: Remover definições de `types` de dentro dos arquivos de componentes.

- [ ] **FEAT-04:** Feature: Adicionar uma nova aba de sorteio de leitura conjunta.

- [ ] **FEAT-05:** Feature: Filtro de listagem de livros, os livros com o status de iniciado aparecem primeiro.

---

## 🛠️ Critérios de Aceite (Clean Code)
