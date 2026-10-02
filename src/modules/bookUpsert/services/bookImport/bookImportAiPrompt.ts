const BOOK_IMPORT_AI_PROMPT = `Gere um CSV para importar livros no Nosso TBR. A resposta deve ser o arquivo, e depois uma lista só do que ficou faltando.

Antes de gerar, confira se eu preenchi as duas partes abaixo. Se a lista de livros estiver vazia, não invente títulos: peça os nomes. Se eu não disser se quero as imagens, pergunte antes de gerar.

LISTA DE LIVROS:
(escreva aqui o nome de cada livro, um por linha)

QUERO AS IMAGENS DAS CAPAS:
(escreva sim ou não)

Regras do CSV:
- Separador vírgula. No máximo 5000 livros. Sem linha de exemplo.
- Cabeçalho: titulo,autor,paginas,status,data_fim
- Se eu escrever sim em imagens, acrescente url_imagem no final do cabeçalho. Se eu escrever não, não inclua essa coluna.
- Uma linha para cada nome que eu listei. Use o título que eu escrevi.
- autor: autor da edição em português. Busque. Não invente.
- paginas: inteiro maior que zero, da mesma edição em português na Amazon.com.br. Não invente. Se não achar a página, deixe o livro de fora e avise depois do CSV.
- status: not_started, a menos que eu tenha pedido outro. Só aceita not_started, reading ou finished.
- data_fim: vazio, a menos que o status seja finished. Aí use AAAA-MM-DD.
- Campo com vírgula ou aspas vai entre aspas duplas. Aspas internas dobram.
- url_imagem, só se eu pedir imagens: URL https direta da capa dessa mesma edição. Só servem m.media-amazon.com, outro host media-amazon.com, books.google.com ou covers.openlibrary.org. Prefira https://m.media-amazon.com/images/I/... Não invente URL. Se não achar, deixe a célula vazia e avise depois do CSV.`;

export default BOOK_IMPORT_AI_PROMPT;
