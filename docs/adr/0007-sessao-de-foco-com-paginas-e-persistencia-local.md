# Sessão de foco com páginas e persistência local

**Status**: accepted

O Foco de leitura passou a aceitar um livro em leitura opcional, uma meta de páginas e dois modos de contagem (Timer regressivo e Cronômetro livre). Ao encerrar uma sessão válida, o Leitor informa a página final e a sessão é registrada localmente com duração efetiva, livro, meta, páginas lidas e data. A duração do Timer é sugerida por `ceil(páginas / V)`, as páginas prováveis por `floor(minutos × V)` e o tempo restante do livro por `(páginas - página atual) / V`, com velocidade inicial de 1,0 página/minuto até três sessões válidas.

O domínio atual não possui `current_page`, páginas lidas por sessão nem histórico de foco, e o progresso da plataforma é derivado dos dias do cronograma. Por isso, página atual e sessões ficam no `localStorage` por usuário, com chaves versionadas pelo prefixo `nosso-tbr:focus`. A conclusão do livro na última página reusa a transição existente para `finished` via `BookUpsertService.edit`, que já garante `end_date`.

**Consequências**: a tela sobrevive a recarregamento, mas página atual e histórico não são sincronizados entre dispositivos nem ficam disponíveis para o servidor. A velocidade de leitura é calculada apenas sobre sessões locais. Para tornar esses dados canônicos é necessário migrar o banco (campo `books.current_page` e tabela `focus_sessions` com RLS por leitor), expor rotas de escrita de página/sessão e mover o cálculo de velocidade para o servidor; até lá, o resumo da PR lista esses ajustes como pendentes.
