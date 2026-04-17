Critérios de Aceite

Cenário 1: Marcar livro como releitura no cadastro

Dado que estou cadastrando um novo livro
Quando eu selecionar a opção de “releitura”
Então o livro deve ser salvo com a flag de releitura ativada

Cenário 2: Cadastro padrão (não releitura)

Dado que estou cadastrando um novo livro
Quando eu não selecionar a opção de releitura
Então o livro deve ser salvo como leitura normal

Cenário 3: Visualização da informação

Dado que um livro foi marcado como releitura
Então essa informação deve ser visível na listagem e/ou detalhes do livro

Cenário 4: Filtrar releituras

Dado que estou na listagem de livros
Quando eu aplicar o filtro de releituras
Então devem ser exibidos apenas os livros marcados como releitura

Cenário 5: Combinação de filtros

Dado que existem outros filtros na listagem
Quando eu aplicar o filtro de releitura junto com outros filtros
Então o resultado deve respeitar todas as condições aplicadas
Notas Técnicas (opcional, mas útil pro dev)
Adicionar campo booleano: isRereading (ou isReread) no modelo de Book
Garantir persistência no banco (Supabase)
Atualizar query builder para suportar filtro por releitura
Expor flag no mapper de domínio

---

User Story: Ordenação de livros por número de páginas

Como usuário
Quero poder ordenar os livros pelo número de páginas
Para visualizar livros menores ou maiores conforme minha necessidade de leitura

Critérios de Aceite

Cenário 1: Ordenação padrão

Dado que estou acessando a tela inicial ou a listagem de livros dentro de uma estante
Quando nenhum critério de ordenação for selecionado
Então a ordem exibida deve ser a padrão já utilizada atualmente no sistema

Cenário 2: Ordenar por páginas (crescente)

Dado que estou na tela inicial ou na listagem de uma estante
Quando eu selecionar a ordenação por número de páginas crescente
Então os livros devem ser exibidos do menor para o maior número de páginas

Cenário 3: Ordenar por páginas (decrescente)

Dado que estou na tela inicial ou na listagem de uma estante
Quando eu selecionar a ordenação por número de páginas decrescente
Então os livros devem ser exibidos do maior para o menor número de páginas

Cenário 4: Integração com filtros existentes

Dado que estou utilizando filtros na tela inicial ou na listagem de uma estante
Quando eu aplicar uma ordenação por número de páginas
Então a ordenação deve respeitar os filtros já aplicados

Cenário 5: Consistência entre telas

Dado que a funcionalidade está disponível
Então o comportamento de ordenação deve ser consistente entre a tela inicial e a listagem de estantes

Cenário 6: Persistência da escolha (opcional)

Dado que selecionei uma ordenação
Quando eu navegar ou recarregar a página
Então o sistema pode manter a ordenação escolhida (caso exista persistência de estado)
