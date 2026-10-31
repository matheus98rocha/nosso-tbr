# Feature Specification: Compartilhar livro finalizado no X

**Feature ID:** 009  
**Status:** Draft  
**Owner:** Mateus  
**Criada em:** 2026-10-31  
**Domínios relacionados:** [[business-rules]] (status `finished`) · Recap de leitura (`CONTEXT.md`) · Capa (`books.image_url`, hosts permitidos)

Esta feature acrescenta um **Cartão de leitura** de um único livro e a opção de levá-lo ao X (Twitter). Não altera o Recap de leitura (“Compartilhar leituras”) nem o compartilhamento por WhatsApp que já existe.

---

## 1. Resumo executivo

Quando o Leitor **termina** um livro (`status = finished`), o produto oferece gerar um cartão largo parecido com a referência de *Jogos Vorazes*: capa à esquerda, título e autor à direita, pílula **100%**, fundo em degradê suave tirado da cor daquela capa. O Leitor baixa o PNG, copia um texto em pt-BR e abre o compositor do X com esse texto já preenchido.

O compositor aberto por intent **não recebe o arquivo de imagem**. O X Web Intent só preenche `text` (e, se houver, `url`). Esta spec trata isso como decisão de produto: o cartão é gerado no navegador e baixado; o texto vai no intent; ninguém finge que a URL de intent faz upload do PNG. Também não há, hoje, um lugar público para hospedar esse PNG — ver §8.

A pílula é sempre **100%** porque o livro está finalizado. Ela não lê o percentual do cronograma.

---

## 2. Por quê (motivação)

- O momento de finalizar é quando o Leitor mais quer mostrar o livro. Hoje a finalização só muda o status, abre a avaliação por estrelas (em alguns fluxos) e, no máximo, manda um link de busca no WhatsApp.
- O Recap de leitura já prova o caminho “gerar PNG no cliente e baixar”, mas é um mosaico de várias capas num período, não o cartão de um livro.
- A referência pede um fundo que mude com a capa. Uma paleta fixa deixaria todo livro com o mesmo marrom.

---

## 3. Glossário desta feature

**Cartão de leitura**  
Imagem larga de um único Livro finalizado: capa, título, autor (quando houver) e pílula `100%`.  
_Avoid_: Recap de leitura, story, highlight, capa sozinha.

**Cor da capa**  
Cor cromática dominante extraída dos pixels da Capa daquele livro, usada só como base do degradê do cartão.  
_Avoid_: paleta fixa por gênero, média crua que deixa a capa preta virar fundo preto.

**Oferta de compartilhamento**  
Convite, em pt-BR, para abrir o fluxo do cartão. Aparece uma vez na transição para `finished` e permanece disponível enquanto o livro seguir finalizado para um participante autenticado.

---

## 4. Escopo

### 4.1 Dentro do escopo

- Oferecer o fluxo só para Livro com `status = finished`, para o Leitor autenticado que participa daquele livro.
- Gerar o Cartão de leitura no cliente, com preview, e permitir baixar o PNG.
- Copiar o texto de compartilhamento e abrir `https://twitter.com/intent/tweet` com esse texto.
- Derivar o fundo da Capa cadastrada daquele livro, com fallback explícito.
- Textos de interface em pt-BR.
- Conviver com a avaliação por estrelas e com o “Compartilhar” do WhatsApp, sem substituir nenhum dos dois.

### 4.2 Fora do escopo

- Outras redes (Instagram, Threads, Bluesky, Facebook, TikTok) e envio da imagem pelo WhatsApp.
- Compartilhar livro que não está `finished` (`reading`, `paused`, `abandoned`, `planned`, `not_started`), mesmo que o cronograma esteja em 100%.
- Trocar o percentual da pílula pelo progresso do cronograma (`computeReadingProgress`).
- Criar campos de série, saga ou posição. O modelo atual não tem esses dados (ver §6.2).
- Hospedar o PNG, rota pública de OG image, bucket no Supabase Storage ou upload pela API do X. Não existe Storage de capas hoje; o proxy `/api/book-covers` exige sessão e responde `Cache-Control: private`.
- Postar em nome do Leitor (OAuth do X).
- Notificar seguidores, gerar atividade ou gravar que o cartão foi compartilhado.
- Alterar o Recap de leitura, o texto do WhatsApp ou a avaliação por estrelas.
- Colocar nome do Leitor, estrelas, páginas ou logo do app no cartão. A referência não tem esses elementos.
- App Expo.

---

## 5. Personas e cenários

### Persona

- **Leitor autenticado participante** do livro. Visitante e Leitor que só enxerga o livro sem participar não entram no fluxo. Cartão de estante (`isShelf`) também não.

### User Story 1 — Oferecer o cartão ao finalizar (Priority: **P1**)

Como Leitor, quando marco um livro como lido, quero a opção de gerar o cartão e levá-lo ao X, para mostrar que terminei aquela leitura.

**Independent Test:** Livro em `reading` do participante. Confirmar a finalização. A avaliação por estrelas, quando esse fluxo já abre, continua primeiro. Depois que ela fecha (salvar ou dispensar), abre a oferta do cartão. Cancelar a confirmação de “Finalizar leitura?” ou falhar a mutação não abre a oferta.

**Acceptance Scenarios:**

- **Given** o livro está `reading` e o Leitor participa, **When** a mutação para `finished` tem sucesso no Lendo agora ou no cadastro/edição, **Then** o diálogo de estrelas existente segue como está e, ao fechar, a oferta do cartão abre uma vez.
- **Given** a finalização parte do modal de detalhes do card (hoje não abre estrelas), **When** a mutação tem sucesso, **Then** a oferta abre em seguida, sem esperar um diálogo de estrelas que esse caminho não tem.
- **Given** o Leitor cancela a confirmação, fecha o fluxo antes de confirmar, ou a mutação falha, **Then** a oferta não abre e o status anterior permanece.
- **Given** o livro já estava `finished` e o Leitor só salva de novo a ficha, **Then** a oferta automática não reabre. O acesso persistente da User Story 2 continua.
- **Given** o Leitor recarrega a página antes de ver a oferta automática, **Then** ela se perde (é estado da sessão, não dado gravado). O acesso persistente permanece.

### User Story 2 — Abrir de novo num livro já finalizado (Priority: **P1**)

Como Leitor, num livro que já finalizei, quero encontrar “Compartilhar no X” sem precisar finalizar outra vez.

**Independent Test:** Livro `finished` do participante na biblioteca (não na estante). O card e o modal de detalhes mostram a ação. Livro `reading` com cronograma em 100% não mostra.

**Acceptance Scenarios:**

- **Given** `status = finished`, participante autenticado, card fora de estante, **When** o card renderiza, **Then** existe a ação “Compartilhar no X” junto da avaliação no rodapé.
- **Given** o mesmo livro, **When** o modal de detalhes abre, **Then** existe o comando “Compartilhar no X” (hint “Cartão da leitura”), separado do comando atual “Compartilhar” / “Enviar no WhatsApp”.
- **Given** `status` diferente de `finished`, ou card de estante, ou Leitor que não participa, **When** a superfície renderiza, **Then** nem a oferta nem a ação persistente aparecem.
- **Given** cronograma em 100% e `status = reading`, **When** a Home renderiza, **Then** o indicador de progresso do cronograma segue a spec 001 e esta feature não aparece.

### User Story 3 — Cartão fiel à referência (Priority: **P1**)

Como Leitor, quero ver e baixar um cartão com a capa, o título, o autor e a pílula 100% sobre um fundo tirado daquela capa.

**Independent Test:** Livro finalizado “Jogos Vorazes (Jogos Vorazes, #1)”, autor “Suzanne Collins”, capa preta com emblema dourado. O PNG tem capa à esquerda, as três linhas de texto à direita e fundo quente, não preto chapado.

**Acceptance Scenarios:**

- **Given** capa, título e autor presentes, **When** o preview e o PNG são gerados, **Then** os dois mostram os mesmos dados, na mesma ordem, com a pílula exatamente `100%`.
- **Given** a capa é majoritariamente preta com uma região dourada, **When** a cor é extraída, **Then** o degradê parte dessa cor quente (luminância acima do preto descartado; matiz amarelo–laranja–marrom), não de um preto médio.
- **Given** dois livros finalizados com capas de cores diferentes, **When** os dois cartões são gerados, **Then** os fundos não são o mesmo marrom fixo.
- **Given** não há Capa cadastrada, a URL é o placeholder, o load falha ou a extração não acha pixel cromático, **When** o cartão é gerado, **Then** a esquerda usa o placeholder já usado no Recap e o fundo usa o fallback de §6.4. O cartão ainda sai.

### User Story 4 — Levar o texto ao X sem fingir anexo (Priority: **P1**)

Como Leitor, quero baixar a imagem, copiar o texto e abrir o X já com o texto, sabendo que preciso anexar o PNG eu mesmo.

**Independent Test:** No diálogo, “Baixar imagem” salva um PNG, “Copiar texto” copia o modelo de §6.6, “Abrir no X” abre uma nova aba em `https://twitter.com/intent/tweet` cuja query `text` é esse modelo. A URL não contém o binário nem um parâmetro de mídia.

**Acceptance Scenarios:**

- **Given** o preview pronto, **When** o Leitor baixa, **Then** o arquivo é `image/png` e o nome deriva do título (ex.: `jogos-vorazes.png`; se o slug ficar vazio, `leitura.png`).
- **Given** o preview pronto, **When** o Leitor escolhe “Abrir no X”, **Then** a aba nova é o intent com o texto codificado e sem URL de imagem.
- **Given** o diálogo, **When** o Leitor lê a descrição, **Then** ela diz, em pt-BR, que a imagem fica no dispositivo e que o link não envia o arquivo — é preciso anexar o PNG na publicação.
- **Given** a geração falha, **When** o erro aparece, **Then** a mensagem é “Não foi possível gerar a imagem. Tente de novo.” e nada é aberto no X.

---

## 6. Regras de domínio

### 6.1 Elegibilidade

- Só o Leitor autenticado participante do livro.
- Só `status = finished`. “Finalizado” aqui é o status do livro, não o percentual do cronograma. Um livro finalizado sem cronograma, ou com cronograma em 40%, ainda é 100% neste cartão. Um livro `reading` com cronograma em 100% não é elegível.
- A oferta automática dispara uma vez por transição bem-sucedida **para** `finished` naquela sessão (Lendo agora, cadastro/edição, ou “Finalizar leitura” do modal de detalhes). Não dispara em pausar, abandonar, reiniciar, nem ao regravar um livro que já estava finalizado.
- Onde já existe `FinishedReadingRatingDialog` (Lendo agora e cadastro/edição), ele permanece o primeiro passo. A oferta do cartão abre só depois do `onDismiss` desse diálogo, para não empilhar dois modais. No modal de detalhes do card, que hoje não abre estrelas, a oferta abre no sucesso da mutação.
- A oferta automática não é persistida. A ação “Compartilhar no X” permanece enquanto o livro estiver `finished` nas superfícies da §10.
- O fluxo não grava linha nova, não muda status e não cria notificação.

### 6.2 Título, série e autor

O `BookDomain` tem `title` (string única), `author` / `authorNames` e `image_url`. Não há série, saga nem posição. `CONTEXT.md` trata volume como o mesmo Livro, não como tipo à parte, e “série” não é entidade do produto (estante não é série).

- A linha de título do cartão é `title` já gravado, com trim. Se o Leitor cadastrou `Jogos Vorazes (Jogos Vorazes, #1)`, essa string inteira aparece. A feature não extrai parênteses, não consulta catálogo e não inventa `#1`.
- Título vazio não deve ocorrer. Se ocorrer, a linha visível é `Livro sem título`.
- A linha de autor usa o nome já formatado do livro (`author`, lista com “e” / “, ” como em `formatList`). Vários autores saem numa linha só: “A e B”, “A, B e C”.
- Sem nome creditado, ou quando o único rótulo seria “Autor desconhecido”, a linha de autor **some** do cartão e do texto. Não se imprime “Autor desconhecido” na imagem.

### 6.3 Layout do cartão

Exportação **1200×600** (2:1), PNG. Proporção larga, no espírito da referência e de uma imagem de post.

- Fundo ocupa o retângulo inteiro: degradê suave da Cor da capa, mais claro na região do texto, mais escuro nas bordas. Não é foto da capa desfocada.
- Capa à esquerda, em pé, proporção de livro, inteira (sem corte que coma o título impresso na capa), com sombra leve. Mesma Capa cadastrada que a Home usaria, inclusive Open Library quando a URL é permitida.
- Bloco à direita, alinhado ao centro vertical, nesta ordem: título, autor, pílula.
- Título: branco (ou tinta escura, §6.5), peso forte, no máximo **3 linhas**, depois reticências.
- Autor: uma linha, reticências, visualmente mais leve que o título.
- Pílula: cápsula bem arredondada, texto exatamente `100%`, peso forte. Na referência (fundo escuro) a pílula é branca e o texto é preto. Esse é o par padrão.
- Preview e PNG usam o mesmo layout e os mesmos dados. Falha de carga da capa não cancela o cartão: entra o placeholder e o fallback de cor.

### 6.4 Cor vinda da capa

Amostrar os pixels da imagem que de fato foi desenhada (a capa já carregada para o cartão).

- Caminho de carga igual ao do Recap: URL remota permitida passa por `toSameOriginCoverSrc` (`/api/book-covers`), para o canvas não ficar contaminado. Path local permitido carrega direto. Host fora da lista ou placeholder não é amostrado como se fosse capa.
- Cor cromática dominante, não a média de todos os pixels e não uma paleta fixa.
- Ignorar pixels quase pretos (luminância relativa abaixo de 0,08) e quase brancos (acima de 0,92) **quando ainda restar** um grupo de pixels cromáticos. A capa preta e dourada precisa produzir o marrom/dourado da referência, não `#000000`.
- Se, depois desse descarte, não houver pixel utilizável, tratar como falha de extração.
- **Fallback** (sem Capa cadastrada, placeholder, load falho, extração falha): degradê a partir de `#6B4F3A`, texto branco, pílula branca com `100%` preto. O fallback é único e estável; não varia por gênero.

### 6.5 Contraste

- Calcular a luminância do fundo atrás do texto.
- Luminância baixa (fundo escuro, como a referência): título e autor claros; pílula branca com texto preto.
- Luminância alta (capa muito clara): título e autor em `#1C1917`; pílula escura com `100%` branco, para a cápsula não sumir no fundo claro.
- O texto `100%` contra a pílula precisa de contraste de pelo menos 4,5:1. A pílula precisa se separar do fundo (diferença de luminância ou fio de borda).
- O autor pode ser a mesma cor do título com opacidade menor, como na referência, só se o contraste ainda passar. Se não passar, usar tom sólido mais claro ou mais escuro, sem depender da opacidade.

### 6.6 Texto e intent do X

Modelo, pt-BR:

- Com autor: `Terminei de ler “{título}”, de {autor}.`
- Sem autor: `Terminei de ler “{título}”.`

Exemplo:

`Terminei de ler “Jogos Vorazes (Jogos Vorazes, #1)”, de Suzanne Collins.`

- Não incluir hashtag obrigatória.
- Não incluir URL. O link público que o WhatsApp usa hoje (`https://nosso-tbr.vercel.app/?search=…`) é uma busca da aplicação, não este cartão. Colocá-lo no intent faria o X tentar desdobrar outra página no lugar da imagem que o Leitor vai anexar.
- O texto do intent tem no máximo **250 caracteres**. Se o título estourar, ele é cortado com reticências dentro das aspas; o resto da frase permanece. O cartão continua com a regra de 3 linhas, independente desse corte.
- “Copiar texto” copia exatamente a string enviada ao intent.
- “Abrir no X” abre nova aba em:

`https://twitter.com/intent/tweet?text={encodeURIComponent(texto)}`

`https://x.com/intent/tweet` com o mesmo `text` é equivalente; a implementação escolhe um dos dois e usa só esse. Não há parâmetro `url` nem campo de mídia.

### 6.7 Decisão de produto: o intent não anexa imagem

O Web Intent do X preenche texto e, opcionalmente, uma URL. Não aceita um PNG arbitrário. Anexar o arquivo exigiria a API de mídia do X (o Leitor autorizando a conta) ou uma URL pública que o crawler do X consiga buscar, para o card desdobrar sozinho.

Nesta feature o comportamento é:

1. Gerar e mostrar o cartão no navegador.
2. Baixar o PNG.
3. Copiar o texto.
4. Abrir o intent só com o texto.
5. O diálogo explica que o anexo é manual.

Não hospedar o cartão nesta entrega. Capas ficam em `books.image_url` (HTTPS de host permitido ou path local), não num bucket. O proxy `/api/book-covers` exige usuário autenticado e cache privado: o crawler do X não o usa, e a URL da capa na Amazon/Open Library desdobraria o site de origem, não este cartão. Hospedar o PNG (Storage público ou rota sem sessão) fica para uma feature futura, com decisão explícita de privacidade — qualquer um com o link veria o cartão.

---

## 7. Requisitos funcionais

- **FR-001:** O sistema DEVE oferecer o Cartão de leitura só quando o livro está `finished` e o Leitor autenticado participa dele.
- **FR-002:** O sistema NÃO DEVE oferecer o fluxo para outro status, inclusive `reading` com cronograma em 100%.
- **FR-003:** A pílula do cartão DEVE ser o texto `100%`, independente de existir cronograma ou do percentual dele.
- **FR-004:** Após mutação bem-sucedida para `finished`, o sistema DEVE abrir a oferta uma vez na sessão, respeitando a ordem com o diálogo de estrelas descrita em §6.1.
- **FR-005:** Falha ou cancelamento da finalização NÃO DEVE abrir a oferta.
- **FR-006:** Livro já `finished` DEVE expor “Compartilhar no X” no rodapé do card da biblioteca e no modal de detalhes, sem reabrir a oferta automática a cada visita.
- **FR-007:** O comando novo NÃO DEVE substituir “Compartilhar” (WhatsApp) nem a avaliação por estrelas.
- **FR-008:** O cartão DEVE seguir o layout de §6.3 no preview e no PNG.
- **FR-009:** O fundo DEVE ser derivado da Cor da capa daquele livro, com as exclusões de §6.4.
- **FR-010:** Sem capa utilizável ou se a extração falhar, o sistema DEVE usar o placeholder e o fallback `#6B4F3A`, e ainda assim entregar preview e download.
- **FR-011:** Título e pílula DEVEM permanecer legíveis nas capas muito claras e muito escuras, conforme §6.5.
- **FR-012:** Título no cartão DEVE ser o `title` armazenado. Autor DEVE usar o nome já formatado e DEVE ser omitido quando não houver nome.
- **FR-013:** “Baixar imagem” DEVE salvar um PNG. “Copiar texto” DEVE copiar o modelo de §6.6. “Abrir no X” DEVE abrir o intent só com `text`.
- **FR-014:** A interface nova (títulos, botões, hints, toasts, descrição do limite do X, texto alternativo) DEVE estar em pt-BR.
- **FR-015:** O texto alternativo do preview DEVE incluir título, autor quando existir, e que a leitura está em 100%.
- **FR-016:** O sistema NÃO DEVE gravar o cartão, chamar a API do X nem criar notificação.

---

## 8. Success Criteria

- **SC-001:** Num livro finalizado com capa, título e autor, preview e PNG mostram capa à esquerda, título completo (até 3 linhas), autor e pílula cujo texto é exatamente `100%`.
- **SC-002:** Numa fixture de capa preta com região dourada, a cor base do degradê tem luminância relativa acima de 0,08 e matiz quente (amarelo, laranja ou marrom). Dois livros com capas distintas não saem com o mesmo fallback `#6B4F3A`.
- **SC-003:** Livro `reading` com cronograma 100% não mostra a ação. Livro `finished` sem cronograma, ou com cronograma abaixo de 100%, mostra a ação e a pílula `100%`.
- **SC-004:** “Abrir no X” leva a `twitter.com/intent/tweet` ou `x.com/intent/tweet` com o texto de §6.6 e sem parâmetro de arquivo. O download é um PNG que o Leitor pode anexar à mão.
- **SC-005:** Sem capa, o PNG ainda sai (placeholder + fallback). Sem autor, não há linha de autor. Título longo corta em 3 linhas no cartão e em 250 caracteres no intent.
- **SC-006:** Finalizar pelo Lendo agora ou pelo cadastro abre estrelas primeiro e o cartão só depois do fecho desse diálogo, uma vez. Cancelar a confirmação ou falhar a mutação não abre o cartão. O WhatsApp existente continua abrindo `wa.me`.
- **SC-007:** Varredura das strings novas não encontra rótulo em inglês na UI deste fluxo.

---

## 9. Casos de borda

| Situação | Comportamento |
| --- | --- |
| Capa ausente, vazia ou placeholder (`/book-cover-placeholder.svg`) | Placeholder à esquerda, fallback `#6B4F3A`, resto do cartão normal. Não amostrar o SVG do placeholder. |
| URL de capa com host não permitido | Tratar como sem capa. Não buscar host fora de `isAllowedBookCoverUrl`. |
| Load da capa falha (proxy 502, timeout, imagem quebrada) | Mesmo fallback. Mensagem de erro só se o cartão inteiro não puder ser montado. |
| Extração só encontra preto/branco | Fallback de cor. A capa, se carregou, continua desenhada à esquerda. |
| Capa muito clara | Texto escuro e pílula escura com `100%` claro (§6.5). |
| Capa muito escura sem pixel cromático | Fallback, não um cartão preto com texto branco ilegível sobre preto. |
| Autor ausente | Sem linha de autor no cartão e sem “, de …” no texto. |
| Vários autores | Uma linha, já no formato “A, B e C”. |
| Livro sem série no título | Mostrar só o `title`. Não completar com série inventada. |
| Título já no formato “Nome (Série, #n)” | Mostrar a string inteira. Não parsear. |
| Título longo | Até 3 linhas no cartão; intent ≤ 250 caracteres. |
| Progresso do cronograma ≠ 100, ou cronograma inexistente, com status `finished` | Pílula `100%`. |
| Cronograma 100% com status `reading` | Fora do fluxo. |
| Status `abandoned` ou `paused` | Fora do fluxo. Não são leitura concluída. |
| Card de estante | Sem ação, mesmo `finished`. |
| Leitura coletiva | O status é o do livro. Qualquer participante autenticado pode gerar o mesmo cartão (sem nome de Leitor). Quem não participa não vê a ação. Sem notificação nova. |
| Regravar livro já finalizado | Sem oferta automática. Ação persistente segue. |
| Sessão cai no meio | Sem cartão hospedado para retomar. O Leitor gera de novo pela ação persistente se o livro continuar `finished`. |

---

## 10. Notas de integração

Não implementar nesta fase. Pontos que a fase Plan deve tocar:

**Onde a leitura vira `finished`**

- `src/modules/home/components/readingNow/components/readingNowStatusActions.tsx` — botão “Finalizar”.
- `src/modules/home/components/readingNow/components/readingNowStatusConfirmationDialog.tsx` — “Finalizar leitura?”. Cancelar aqui não oferece o cartão.
- `src/modules/home/components/readingNow/hooks/useReadingNow.ts` — mutação; no sucesso de `finished` já define `ratingPromptBookId`.
- `src/modules/home/components/readingNow/readingNow.tsx` — monta a confirmação e `FinishedReadingRatingDialog`.
- `src/modules/bookRating/components/finishedReadingRatingDialog.tsx` — estrelas primeiro; a oferta do cartão espera o dismiss.
- `src/modules/bookUpsert/hooks/useBookDialog.ts` — `shouldOpenRatingPrompt` só na transição para `finished`. Mesma ordem.
- `src/components/bookCard/components/bookCardDetailsModal/hooks/useBookCardDetailsModal.ts` — ação primária “Finalizar leitura” com o livro em `reading`. Este caminho não abre estrelas.
- `src/components/bookCard/hooks/useBookCard.ts` — `onFinishReading` chama `changeBookStatus("finished")`. No sucesso, toast “Leitura finalizada” e fecha o modal. A oferta entra depois disso.
- `src/components/bookCard/bookCard.tsx` — rodapé de `finished` já mostra `CardReadingRatingButton` (`src/modules/bookRating/components/cardReadingRatingButton.tsx`). A ação persistente fica ao lado, só fora de estante.

**O que não reutilizar como se fosse este cartão**

- `src/components/bookCard/hooks/useBookCard.ts` (`shareOnWhatsApp`) — `https://wa.me/?text=` com a URL de busca. Permanece o comando “Compartilhar”.
- `src/modules/readingRecap/utils/renderRecapPng/renderRecapPng.ts` — PNG de mosaico no cliente (`canvas.toBlob` + download). O cartão é outro layout; o padrão de gerar no browser e baixar é o que esta feature repete.
- `src/modules/readingRecap/utils/toSameOriginCoverSrc/toSameOriginCoverSrc.ts` — capa remota vira `/api/book-covers?url=…` para o canvas.
- `src/app/api/book-covers/route.ts` — proxy autenticado, cache privado, hosts de `src/constants/bookCover.ts`. Não serve como URL pública do cartão.
- `src/modules/schedule/utils/computeReadingProgress.ts` e `ReadingProgressIndicator` — percentual do cronograma, só em `reading` (spec 001). A pílula não lê esse número.
- `src/types/books.types.ts` — `title`, `author` / `authorNames`, `image_url`, `status`. Sem série.
- `src/lib/books/resolveBookAuthors.ts` — nome de exibição; “Autor desconhecido” não vai para o cartão.

Não há módulo de cor dominante, OG image nem cliente da API do X no repositório.

---

## 11. Riscos e premissas

### Premissas

- `finished` continua significando “terminei de ler” para aquele livro.
- O Leitor que finaliza está numa sessão em que `/api/book-covers` aceita o pedido, como no Recap.
- O Leitor aceita anexar o PNG à mão. O produto não promete post automático.

### Riscos

- **R-01 — Intent sem anexo parece quebrado** se o diálogo não explicar. A descrição em pt-BR é parte do aceite (SC-004), não um detalhe opcional.
- **R-02 — Média ingênua da capa preta** produz fundo preto e texto branco sem o dourado da referência. A exclusão de pixels extremos é requisito (SC-002), não melhoria.
- **R-03 — Dois diálogos** (estrelas e cartão) cansam se abrirem juntos. A ordem de §6.1 é obrigatória.
- **R-04 — Canvas contaminado** se a capa remota for desenhada sem o proxy. Amostrar ou exportar essa imagem falha em silêncio ou suja a cor. Usar o mesmo caminho de same-origin do Recap.

---

## 12. Fase

Specify. Próximo passo é Plan ou um ajuste desta spec. Não há `plan.md` nem `tasks.md` desta feature.
