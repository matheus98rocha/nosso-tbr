# Nosso TBR

Contexto social e de organização de livros da aplicação, incluindo estantes pessoais, relações entre leitores e avisos sobre novas adições.

## Leitores e relações

**Leitor**:
Pessoa usuária que mantém livros na aplicação e pode seguir outros leitores.
_Avoid_: usuário social, conta

**Seguidor**:
Leitor que mantém uma relação ativa de acompanhamento com outro leitor.
_Avoid_: amigo, assinante

**Leitores populares**:
Faixa de descoberta na Home com leitores elegíveis a seguir, ordenados por quantidade de seguidores e por leituras em comum (gênero e autores) com o leitor logado.
_Avoid_: contas populares, suggested users, ranking global

**Ator da atividade**:
Leitor autenticado que executou uma ação na aplicação. Para a atividade de adicionar livro, é quem cadastrou o livro, independentemente do leitor responsável pelo livro.
_Avoid_: dono do livro, leitor responsável

**Leitor responsável**:
Leitor associado ao livro como pessoa que o escolheu ou lê. Não é necessariamente o ator que cadastrou o livro.
_Avoid_: autor da atividade

**Administrador**:
Leitor com acesso às telas de Administração e Autores.
_Avoid_: admin user, superuser, operador

**Exclusão de conta**:
Remoção permanente de um Leitor, feita por ele mesmo ou por um Administrador sobre outro Leitor. Some a conta, os livros em que ele é o único participante, os cronogramas, as notas e os demais dados ligados a ele. Em um livro compartilhado, ele sai da leitura e, se era o responsável, outro participante passa a ser. O Ator da atividade também conta como participante. Um Leitor que não é Administrador não remove outro Leitor. O último Administrador permanece.
_Avoid_: desativar conta, banir, anonimizar

**Modo de inscrição**:
Escolha do Administrador entre inscrições abertas e convites. Só um modo fica ativo por vez.
_Avoid_: feature flag, configuração de site

**Inscrições abertas**:
Modo de inscrição em que qualquer pessoa cria a conta em `/register`, sem convite.
_Avoid_: signup, registro público

**Convite**:
Link de cadastro com validade de 24 horas, gerado pelo Administrador. Autoriza a inscrição somente quando o modo de inscrição é convites.
_Avoid_: token de acesso, senha compartilhada

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
Pessoa creditada no livro; um livro pode ter um ou mais autores. Não é o Leitor. A tela Autores é a gestão desses registros, só para Administrador.
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

## Resenhas

**Resenha**:
Texto de até 500 caracteres que um Leitor publica sobre um Livro de que participa, com uma nota de 1 a 5 estrelas. A nota só fica disponível quando o livro está com a leitura finalizada; sem ela, a resenha não é publicada. Cada Leitor tem no máximo uma resenha por livro, e pode editá-la. A edição não muda a posição no feed: a ordem é a de criação, mais recente primeiro. Uma resenha editada mostra a marca "editada". Quem pode ver a resenha é quem pode ver o livro.
_Avoid_: avaliação privada, citação, comentário da leitura coletiva

**Status na resenha**:
Status do livro gravado no momento em que a resenha é publicada ou editada. Não acompanha mudanças posteriores do livro até a próxima edição da resenha. O Leitor não escolhe esse valor.
_Avoid_: status atual, progresso do cronograma

**Reação**:
Curtir ou não curtir uma resenha. As duas são exclusivas, e o autor da resenha não reage à própria. Curtir de novo desfaz a reação.
_Avoid_: favorito, estrela, voto em comentário

**Comentário de resenha**:
Texto de até 500 caracteres escrito sobre uma resenha visível. Pode receber respostas em um nível. Uma resposta a uma resposta entra na mesma conversa, citada como resposta à pessoa. O autor do comentário e o autor da resenha podem excluí-lo.
_Avoid_: comentário da leitura coletiva, resenha

## Foco de leitura

**Foco de leitura**:
Período que o Leitor define na tela `/focus` para ler sem interrupções. Pode ser contado como Timer regressivo (1 a 180 minutos, padrão 25) ou Cronômetro livre, ser pausado e retomado, e ficar vinculado a um livro em leitura ou ao modo livre. Seu estado ativo é persistido no navegador para sobreviver a recarregamento.
_Avoid_: pomodoro, sessão de estudo, cronograma

**Sessão de foco**:
Registro local de um Foco de leitura encerrado, com início, fim, duração efetiva, modo, livro opcional, meta de páginas e páginas efetivamente lidas. Alimenta a Velocidade de leitura do Leitor.
_Avoid_: cronograma, resenha, estatística agregada

**Meta de páginas**:
Quantidade de páginas que o Leitor pretende ler em uma Sessão de foco. Com um livro vinculado, é a diferença entre a Página pretendida do foco e a Página atual do foco; no modo livre, é informada diretamente. Serve para sugerir a duração do Timer regressivo.
_Avoid_: páginas totais, páginas lidas no dia

**Página atual do foco**:
Última página registrada para um livro nas Sessões de foco do Leitor, ajustável na tela antes de iniciar. Enquanto a plataforma não tiver esse campo no domínio do livro, ela vive no armazenamento local por leitor.
_Avoid_: progresso do cronograma, `pages`

**Página pretendida do foco**:
Página em que o Leitor quer chegar ao final da Sessão de foco. Combine com a Página atual do foco para definir as páginas restantes usadas na sugestão de tempo.
_Avoid_: meta de páginas, páginas totais

**Velocidade de leitura**:
Média de páginas por minuto calculada sobre as Sessões de foco concluídas com páginas lidas. Começa em 1,0 página/minuto até que existam sessões suficientes para a média.
_Avoid_: ritmo do cronograma, páginas por dia

**Aviso sonoro do foco**:
Som emitido pelo navegador quando o Foco de leitura chega a zero ou é encerrado, sem usar a API de notificações do sistema e sem exigir permissão adicional. O áudio é desbloqueado no gesto de iniciar ou continuar o foco, é reutilizado no aviso e pode ser silenciado na própria tela.
_Avoid_: notificação push, alarme do servidor
