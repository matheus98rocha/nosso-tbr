# Nosso TBR

Contexto social e de organização de livros da aplicação, incluindo estantes pessoais, relações entre leitores e avisos sobre novas adições.

## Leitores e relações

**Leitor**:
Pessoa usuária que mantém livros na aplicação e pode seguir outros leitores.
_Avoid_: usuário social, conta

**Seguidor**:
Leitor que mantém uma relação ativa de acompanhamento com outro leitor.
_Avoid_: amigo, assinante

**Ator da atividade**:
Leitor autenticado que executou uma ação na aplicação. Para a atividade de adicionar livro, é quem cadastrou o livro, independentemente do leitor responsável pelo livro.
_Avoid_: dono do livro, leitor responsável

**Leitor responsável**:
Leitor associado ao livro como pessoa que o escolheu ou lê. Não é necessariamente o ator que cadastrou o livro.
_Avoid_: autor da atividade

**Administrador**:
Leitor com acesso às telas de Administração e Autores.
_Avoid_: admin user, superuser, operador

## Livros e organização

**Livro**:
Título acompanhado na aplicação por um ou mais leitores, com status de leitura. Mangá e manhwa são livros. O cadastro existe pelo ato do leitor, não por um catálogo externo.
_Avoid_: obra, edição, work, volume como tipo distinto

**Capa**:
Imagem que representa o livro. Capa cadastrada é a mesma que a Home mostraria: URL de host permitido ou path local, nunca o placeholder. No Recap de leitura, é o único elemento do livro que aparece na imagem gerada; sem capa cadastrada, o placeholder ocupa o slot.
_Avoid_: poster, thumbnail, highlight

**Gênero**:
Classificação temática do livro escolhida no cadastro.
_Avoid_: gender, categoria, tag

**Autor**:
Pessoa creditada no livro. Não é o Leitor. A tela Autores é a gestão desses registros, só para Administrador.
_Avoid_: papel de leitor, author account

**Estante**:
Coleção curada por um leitor para organizar livros segundo um critério próprio.
_Avoid_: série, saga, prateleira

**Importação**:
Ato do leitor de registrar vários livros de uma vez a partir de um arquivo .csv ou .txt com o mesmo conteúdo. Não é atividade para seguidores.
_Avoid_: sincronização, catálogo externo, migração

**Modelo de importação**:
Arquivo com as colunas obrigatórias do Nosso TBR (`titulo`, `autor`, `paginas`, `status`) e uma linha de exemplo. A coluna opcional `url_imagem` grava a capa quando a URL é de um host de capa já aceito pelo app.
_Avoid_: export do Goodreads, planilha livre

**Linha de exemplo**:
Linha do modelo de importação que mostra o formato e não é um livro. O título é `Exemplo: não importar`.
_Avoid_: primeiro registro, livro de teste

## Notificações sociais

**Notificação de novos livros**:
Aviso interno de que um ator da atividade adicionou um ou mais livros, entregue aos leitores que o seguem e mantêm essa preferência ativa.
_Avoid_: alerta, mensagem, atualização de status

**Preferência de notificação**:
Escolha individual de um seguidor sobre receber notificações de novos livros de um leitor específico. É ativada por padrão e não altera a relação de seguir.
_Avoid_: silenciar usuário, deixar de seguir

**Lote de notificação**:
Conjunto de livros adicionados pelo mesmo ator e acumulado em uma única notificação enquanto ela permanece não lida.
_Avoid_: evento, pacote

**Notificação não lida**:
Notificação que ainda não foi aberta pela ação de ver os livros. Uma notificação lida permanece no histórico recente.
_Avoid_: pendente, nova notificação

**Livros visíveis**:
Livros que o destinatário pode consultar segundo as regras atuais de privacidade e relacionamento. Uma notificação não concede acesso adicional a livros.
_Avoid_: livros públicos

## Recap de leitura

**Recap de leitura**:
Imagens que o próprio Leitor gera com as capas dos livros que ele finalizou num dia, mês ou ano calendário, segundo o Filtro do recap. Não cita outros leitores. Na Home, o botão e o título do modal usam a copy **Compartilhar leituras**.
_Avoid_: highlight, wrapped, citação, recap anual como tipo distinto

**Filtro do recap**:
Período (dia, mês ou ano calendário; ao abrir, o ano civil de hoje) e, opcionalmente, um ou mais Gêneros. O filtro de gênero começa oculto e só entra se o Leitor habilitar. É independente do filtro da Home.
_Avoid_: filtro da estante, filtro da home

**Imagem do recap**:
Uma das imagens que formam um Recap de leitura. Inclui todas as leituras finalizadas do período; nenhum livro é omitido automaticamente. Sem Capa cadastrada, o placeholder ocupa o slot. Preview e PNG usam os mesmos livros na mesma ordem e a mesma Capa cadastrada (incluindo capa da Open Library). Falha de load não tira o livro: o slot fica com o placeholder. Só o Leitor tira um livro pelo X no preview; a paginação recompõe. Até 12 capas por imagem (3×4, tamanho do BookCard). O modal abre com skeleton do conjunto e só revela filtros, preview e ações juntos depois do probe das capas da primeira vista. Com mais de uma imagem, o preview mostra uma por vez com setas e dots; com uma imagem, vazio, carregamento ou erro, não há setas nem dots.
_Avoid_: capa, highlight, story
