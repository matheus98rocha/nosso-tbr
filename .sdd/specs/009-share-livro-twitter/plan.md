# Implementation Plan: Compartilhar livro finalizado no X

**Feature ID:** 009  
**Spec:** [spec.md](./spec.md)  
**Status:** Draft  
**Criada em:** 2026-10-31

Não há `data-model` nem `contracts`: a feature não grava linha, não cria rota e não chama a API do X. Este documento é só o plano. `tasks.md` fica para a fase seguinte.

---

## 1. Summary

Cartão de um livro `finished`, gerado no navegador (PNG 1200×600), com oferta automática na transição e ação persistente “Compartilhar no X”. O fundo sai da cor cromática daquela capa. O intent abre só com `text`.

Decisões de produto da spec permanecem fechadas: sem estante, sem cronograma na pílula, sem hospedar PNG, sem OAuth, sem mexer em WhatsApp, Recap ou estrelas.

---

## 2. Decisões técnicas

### 2.1 Módulo novo, canvas no estilo do Recap

**Decisão:** módulo `src/modules/finishedBookShare`. Funções puras e o canvas ficam em `utils/`. O hook do diálogo só orquestra gerar, baixar, copiar e abrir o intent.

**Por quê:** `readingRecap` já separa `renderRecapPng` / `toSameOriginCoverSrc` dos componentes. O cartão é outro layout; não estende o mosaico.

**Não fazer:**

- Não editar `renderRecapPng.ts` nem o modal “Compartilhar leituras”.
- Não mover `toSameOriginCoverSrc`. Importar de `@/modules/readingRecap/utils/toSameOriginCoverSrc`.
- Não copiar o segundo `tryLoadCover` do Recap, que tenta a URL remota crua com `crossOrigin`. Se o proxy falhar, essa imagem contamina o canvas e `toBlob` quebra. Aqui a capa remota só entra via `/api/book-covers`. Falha de load vira placeholder + fallback, e o PNG ainda sai.
- Não reutilizar o `drawCover` do Recap: ele recorta a capa (`Math.max`). O cartão usa **contain** (`Math.min`) para a capa inteira caber no retângulo de livro (§6.3).
- Duplicar o helper de download (o de `renderRecapPng.ts`, `triggerPngDownload`) dentro do módulo novo. Não exportar o do Recap para este fluxo.

### 2.2 Onde o diálogo mora

**Decisão:** um host único, `FinishedBookShareHost`, montado em `src/providers/AppProviders.tsx`, ao lado do `Toaster`. O estado da oferta fica num store Zustand **sem** `persist`, em `src/modules/finishedBookShare/stores/finishedBookShareStore.ts`. Não vai para `src/stores/userStore.ts`.

```text
armAfterRating(bookId, subject)  → guarda, não abre
revealArmed(bookId)             → abre só se o id armado for esse
clearArmed(bookId)              → descarta sem abrir
openNow(subject)                → abre já (card e botão persistente)
close()                         → fecha o diálogo ativo
```

`FinishedReadingRatingDialog` não muda. O `onDismiss` dos pais da transição (Lendo agora e upsert) é que chama `revealArmed`. O diálogo de estrelas do `CardReadingRatingButton` continua só fechando a avaliação; não revela o cartão.

**Por quê um host fora do card:**

- `ReadingNow` dá `return null` quando `shouldRender` fica falso. O último livro que sai de “Lendo agora” desmontaria estrelas e cartão se os dois estivessem só dentro desse `return`. O carrossel pode sumir; o diálogo de estrelas dessa transição precisa continuar montado até o dismiss (§6.1, R-03).
- `useBookCard` fecha o modal de detalhes e a Home pode filtrar o livro para fora da lista (`status=reading`). Estado dentro do card morre com a linha. A spec exige a oferta depois do sucesso.
- `BookUpsert` reseta o formulário no `onSuccess` antes do prompt de estrelas. O assunto do cartão tem de ser um snapshot, não o form.

Recarregar a página zera o store. Isso é o “estado da sessão” da spec. Não há `localStorage`.

### 2.3 Ordem da oferta automática

Snapshot `FinishedBookShareSubject`: `{ bookId, title, author, imageUrl }`. `author` já é o nome de exibição ou `null`. `imageUrl` é a URL cadastrada ou `null` (vazia, só espaço, ou placeholder).

| Superfície | Quando armar / abrir | Estrelas |
| --- | --- | --- |
| Lendo agora | `onSuccess` da mutação em `useReadingNow.ts` com `nextStatus === "finished"` chama `armAfterRating`. `dismissRatingPrompt` chama `revealArmed` com o id e só então zera `ratingPromptBookId`. Pausar, abandonar, cancelar `ReadingNowStatusConfirmationDialog` e `onError` não armam. | Primeiro, como hoje |
| Cadastro/edição | Mesmo par em `useBookDialog.ts`, só quando `shouldOpenRatingPrompt` já é verdadeiro (transição para `finished`, livro que ainda não estava finalizado). Regravar `finished` não arma. | Primeiro, como hoje |
| Card da biblioteca (`isShelf` falso) | `onSuccess` de `statusTransitionMutation` em `useBookCard.ts` quando `nextStatus === "finished"` e o status anterior não era `finished`. `openNow` depois do toast e de fechar o modal de detalhes. | Esse caminho não abre estrelas. Não acrescentar. |
| Card de estante | Não arma, não abre, não mostra ação. | Intocado |

Cleanup no unmount de `useReadingNow` e `useBookDialog`: `clearArmed(bookId)` do id que aquela instância armou. Sair da Home no meio das estrelas perde a oferta automática, como um reload. Não revelar no unmount. A ação persistente continua se o livro seguir `finished`.

Há dois `BookUpsert` na Home (criar e editar) e outro nas estantes. Os dois podem montar `FinishedReadingRatingDialog`, mas só o que armou revela, porque `revealArmed` exige o mesmo `bookId`.

### 2.4 Autor no snapshot do upsert

`BookCreateValidator` tem `author_ids`, não o nome. `bookUpsertService.create` devolve só `{ id }`.

**Decisão:** `useBookUpsert` mantém um `Map<string, string>` em ref, sem request novo no sucesso:

- edição: `bookData.authorIds` alinhado a `bookData.authorNames`;
- cada resposta de `searchAuthors`;
- ao criar autor no modal, o par id → nome que o fluxo já conhece (`authorSearch` no momento de `handleAuthorCreated`, se o id voltar).

`useBookDialog` recebe `resolveAuthorNames(ids: string[]): string[]`. No `onSuccess`, **antes** de depender do form resetado:

- `title` ← `variables.title`;
- `imageUrl` ← `variables.image_url`;
- `bookId` ← id editado ou `result.book.id` no create;
- nomes → `formatList` (`src/utils/formatters/formatters.ts`). Lista vazia → `author: null`. Não gravar o uuid nem “Autor desconhecido”.

`book.author` em Lendo agora e no card já veio de `resolveBookAuthors`. Não passar essa string de novo por `formatList`.

### 2.5 Elegibilidade da ação persistente

Helper puro `canShareFinishedBook`:

```text
isLogged && isParticipant && !isShelf && status === "finished"
```

Participante = `canUserParticipateInBook`, o mesmo critério de `useReadingRatingStrip` (`participating && status === "finished"`). `hideInteractions` não entra: a spec fala em participante, e o rodapé de avaliação já ignora esse flag. Visitante não participante não vê o botão. Estante não vê.

O comando do modal só existe se o card passar `onShareOnX`. Estante e Lendo agora (livro ainda `reading`) não passam.

### 2.6 Intent

**Decisão:** uma função pura `buildTweetIntentUrl` e a constante `https://twitter.com/intent/tweet`. Não usar `x.com` neste código.

```text
https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}
```

Sem `url`, sem `media`, sem `via`. `window.open(url, "_blank", "noopener,noreferrer")` no clique, com o texto já calculado (o gesto não pode esperar o canvas).

### 2.7 Preview = o mesmo PNG

**Decisão:** o preview é um `<img>` do `blob:` gerado pelo mesmo `renderFinishedBookCardPng`. Não há um segundo layout em React. O Recap tem preview em componente e PNG no canvas; aqui a spec exige os mesmos dados nos dois, então um bitmap só.

Revogar o object URL ao trocar o assunto e no unmount.

---

## 3. Technical Context

| Item | Decisão |
| ---- | ------- |
| Linguagem | TypeScript |
| UI | Client components, `Dialog` de `@/components/ui/dialog`, botões existentes |
| Auth | Sessão já exigida pelo proxy de capas e pelas superfícies. Sem rota nova |
| Dados | Nenhum. Store só em memória |
| Estado | Zustand local do módulo + `useState` já usado nas mutações |
| Canvas | 1200×600, `image/png`, capa same-origin |
| Testes | Vitest + Testing Library, colocados ao lado do arquivo |
| Localização | pt-BR nas strings novas |
| Schema / API | Nenhuma migration, nenhum endpoint, nenhuma query key |

---

## 4. Project Structure

### 4.1 Novos

```text
src/modules/finishedBookShare/
  index.ts
  types/finishedBookShare.types.ts
  types/index.ts
  constants/finishedBookShareLayout.ts
  constants/finishedBookShareCopy.ts
  constants/index.ts
  stores/finishedBookShareStore.ts
  stores/finishedBookShareStore.test.ts
  stores/index.ts
  utils/relativeLuminance/relativeLuminance.ts
  utils/relativeLuminance/relativeLuminance.test.ts
  utils/extractCoverColor/extractCoverColor.ts
  utils/extractCoverColor/extractCoverColor.test.ts
  utils/deriveCardPalette/deriveCardPalette.ts
  utils/deriveCardPalette/deriveCardPalette.test.ts
  utils/buildShareModel/buildShareModel.ts
  utils/buildShareModel/buildShareModel.test.ts
  utils/renderFinishedBookCardPng/renderFinishedBookCardPng.ts
  utils/renderFinishedBookCardPng/renderFinishedBookCardPng.test.ts
  utils/index.ts
  hooks/useFinishedBookShareDialog.ts
  hooks/useFinishedBookShareDialog.test.ts
  hooks/index.ts
  components/finishedBookShareDialog/finishedBookShareDialog.tsx
  components/finishedBookShareDialog/finishedBookShareDialog.test.tsx
  components/finishedBookShareDialog/index.ts
  components/finishedBookShareHost/finishedBookShareHost.tsx
  components/finishedBookShareHost/index.ts
  components/shareFinishedBookOnXButton/shareFinishedBookOnXButton.tsx
  components/shareFinishedBookOnXButton/index.ts
```

Tipos do módulo ficam em `types/`, no padrão de `readingRecap` e do modal de detalhes. Não copiar o `type` de props declarado dentro de `finishedReadingRatingDialog.tsx`.

Barrel `index.ts` em cada pasta. O `index.ts` do módulo exporta o host, o botão, `canShareFinishedBook`, o builder do assunto e as ações do store. UI em pt-BR. Lógica de clique no hook com `useCallback` / `useMemo`. Sem comentários no código novo.

### 4.2 Alterados

```text
src/providers/AppProviders.tsx
  FinishedBookShareHost ao lado do Toaster

src/modules/home/components/readingNow/readingNow.tsx
  Diálogos de estrelas e de confirmação continuam montados quando
  shouldRender é falso e ratingPromptBookId !== null.
  O carrossel é que não renderiza. onDismiss existente passa a revelar o cartão.

src/modules/home/components/readingNow/hooks/useReadingNow.ts
  armAfterRating no sucesso de finished; revealArmed no dismiss;
  clearArmed no unmount

src/modules/home/components/readingNow/readingNow.test.tsx
src/modules/home/components/readingNow/hooks/useReadingNow.test.tsx

src/modules/bookUpsert/hooks/useBookDialog.ts
src/modules/bookUpsert/hooks/useBookUpsert.ts
  Snapshot + arm / reveal. Assinatura de useBookDialog ganha o resolvedor de nomes.
  handleDismissRatingPrompt revela. bookUpsert.tsx não muda:
  ele já passa esse dismiss ao FinishedReadingRatingDialog.

src/modules/bookUpsert/hooks/useBookDialog.test.ts
src/modules/bookUpsert/hooks/useBookUpsert.test.ts

src/components/bookCard/hooks/useBookCard.ts
  showShareOnX; openNow no sucesso de finished se !isShelf

src/components/bookCard/hooks/useBookCard.test.ts
src/components/bookCard/bookCard.tsx
  Botão no mesmo CardFooter da avaliação

src/components/bookCard/bookCard.test.tsx
src/components/bookCard/components/bookCardDetailsModal/hooks/useBookCardDetailsModal.ts
src/components/bookCard/components/bookCardDetailsModal/types/bookCardDetailsModal.types.ts
  Novo icon "shareOnX" e callback onShareOnX opcional

src/components/bookCard/components/bookCardDetailsModal/components/bookDetailsSections/bookDetailsSections.tsx
  Ícone distinto do Share2 do WhatsApp

src/components/bookCard/components/bookCardDetailsModal/bookCardDetailsModal.test.tsx
src/modules/home/components/readingNow/components/readingNowBookDetailsModal.tsx
  Repassa onShareOnX vindo de useBookCard (em reading o callback não existe)

bookCardDetailsModal.tsx não muda: já entrega props ao hook, e o grid desenha commands.
```

### 4.3 Intocados

```text
src/modules/bookRating/components/finishedReadingRatingDialog.tsx
src/modules/bookRating/components/cardReadingRatingButton.tsx
src/modules/bookUpsert/bookUpsert.tsx
src/components/bookCard/components/bookCardDetailsModal/bookCardDetailsModal.tsx
src/modules/readingRecap/**
src/app/api/book-covers/route.ts
src/modules/schedule/utils/computeReadingProgress.ts
src/types/books.types.ts
src/lib/books/resolveBookAuthors.ts
```

`useBookCard.ts` entra em “alterados” pelo `openNow` e por `showShareOnX`. A função `shareOnWhatsApp` não muda.

---

## 5. Fluxo de dados

### 5.1 Oferta automática

```text
mutação finished ok
  ├─ Lendo agora / upsert
  │    armAfterRating(snapshot)
  │    FinishedReadingRatingDialog abre (estado que já existe)
  │    dismiss (salvar, pular ou fechar) → revealArmed(bookId) → host abre
  └─ card da biblioteca, não estante
       toast “Leitura finalizada” + fecha o modal de detalhes
       openNow(snapshot) → host abre
falha ou cancelamento da confirmação
  → store de oferta não é armado
```

O snapshot da capa/título/autor é tirado no sucesso, com os campos do `BookDomain` (Lendo agora e card) ou com `variables` + o mapa de autores (upsert). Não reler o livro depois do invalidate: o item pode ter saído da lista.

### 5.2 Ação persistente

```text
BookCard (finished, participante, !isShelf)
  ShareFinishedBookOnXButton → openNow(subject do book atual)
BookCardDetailsModal
  comando “Compartilhar no X” / hint “Cartão da leitura”
  → o mesmo openNow
  comando “Compartilhar” / “Enviar no WhatsApp” → shareOnWhatsApp, sem mudança
```

O botão do card chama `event.stopPropagation()`, como a avaliação, e é `type="button"`.

### 5.3 Dentro do diálogo

```text
subject
  → buildShareModel (título, autor, texto, alt, filename)
  → renderFinishedBookCardPng
       capa: toSameOriginCoverSrc, ou placeholder sem amostrar
       cor: extractCoverColor ou #6B4F3A
       paleta: deriveCardPalette
       desenha 1200×600
  → blob image/png + object URL no <img>
Baixar imagem → <a download>
Copiar texto  → clipboard.writeText(o mesmo texto do intent)
Abrir no X    → buildTweetIntentUrl; não abre se o PNG falhou
```

Mensagem de falha do cartão inteiro, exatamente: `Não foi possível gerar a imagem. Tente de novo.` Nesse estado o intent não abre.

---

## 6. Algoritmo de cor, contraste e layout

Constantes em `finishedBookShareLayout.ts`. A luminância relativa é a do WCAG, uma função só, usada no descarte de pixels e no contraste:

```text
lin(c) = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ^ 2.4
Y      = 0.2126*lin(R) + 0.7152*lin(G) + 0.0722*lin(B)
```

`c` é o canal 0–1. Limiares da spec: `Y < 0.08` quase preto, `Y > 0.92` quase branco.

### 6.1 O que pode ser amostrado

`extractCoverColor` recebe `ImageData` já same-origin. Quem chama só produz esse buffer se a URL passou por `isAllowedBookCoverUrl` ou é path local permitido, e **não** é placeholder (`isPlaceholderBookCoverSrc`, inclusive `/book-cover-placeholder.svg`). Host fora da lista nem é pedido. O SVG do placeholder não entra no `getImageData`.

Reduzir a capa para no máximo 64 px no lado maior antes de ler os pixels (desenho same-origin, passo 1). O PNG final continua com a capa em tamanho de leitura; a redução é só da amostra.

### 6.2 Cor cromática dominante

Não é a média de todos os pixels.

1. Ignorar alpha &lt; 128.
2. Pixel cromático: `(max(r,g,b) - min(r,g,b)) / 255 >= 0.12`, com `0.08 <= Y <= 0.92`.
3. Se não sobrar pixel cromático, devolver `null` (falha de extração). Não fazer média do preto que foi descartado.
4. Quantizar cada canal em passos de 16. Histograma.
5. Balde vencedor: maior contagem; empate pela maior crominância média; novo empate pelo menor índice de balde.
6. Cor base = média dos pixels originais daquele balde.

Fixture de teste (não usar capa comercial): 20×20 preto `#000000` com um bloco `#E0A020`. O resultado tem `Y > 0.08` e matiz HSL entre 30° e 50°. Um segundo buffer azul `#1E4DB7` não pode cair em `#6B4F3A` nem na cor do ouro. Buffer só preto, só branco, ou só cinza médio devolve `null`.

`#6B4F3A` entra somente no fallback: sem capa, placeholder, load falho, ou extração `null`. A capa, se carregou, continua desenhada à esquerda mesmo com fallback de cor.

### 6.3 Degradê

Não é a capa desfocada. HSL da cor base:

- região do texto: mesma matiz, `L` sobe 0,18 (teto 0,86), `S` × 0,92;
- bordas: mesma matiz, `L` × 0,5 (piso 0,05).

Pintura: retângulo na cor da borda; gradiente radial centrado no bloco de texto (à direita, meio vertical) da cor clara para a cor da borda.

O contraste olha a cor da **região do texto** (o stop claro), não a borda.

### 6.4 Contraste

A spec não fixa o número que separa fundo escuro de fundo claro. Este plano trava:

- `Y(região do texto) >= 0.42` → título e autor `#1C1917`; pílula `#1C1917` com `100%` em `#FFFFFF`;
- abaixo disso → título branco `#FFFFFF`; pílula `#FFFFFF` com `100%` em `#141210`.

Fallback `#6B4F3A` **não** passa por esse corte: texto branco, pílula branca, `100%` preto, como o §6.4 da spec, mesmo que o stop claro suba.

Autor: mesma tinta do título com alpha 0,78 composta sobre a região do texto. Se o contraste dessa composição ficar abaixo de 4,5:1, usar a tinta do título sólida. Não deixar o autor só na opacidade quando ela falha.

A pílula usa os pares acima (os dois passam de 4,5:1). Se `|Y(pílula) - Y(região do texto)| < 0.18`, traço de 4 px na tinta do título para a cápsula não sumir.

### 6.5 Layout 1200×600

Números em `finishedBookShareLayout.ts`, compartilhados pelo renderer (não há segundo layout):

| Peça | Valor |
| --- | --- |
| Capa | x 64, caixa 300×450, centralizada na vertical, contain, cantos 12, sombra leve |
| Bloco de texto | x 420, largura 708, padding direito 72, centralizado na vertical |
| Título | 700 54 px, `ui-sans-serif, system-ui, sans-serif`, até 3 linhas, entrelinha 64, reticências |
| Autor | 500 32 px, uma linha, reticências, 16 px abaixo do título |
| Pílula | altura 72, raio 36, padding horizontal 36, 700 36 px, texto `100%`, 28 px abaixo do autor |

Fonte de sistema, como o rodapé do PNG do Recap. Sem webfont no canvas: `document.fonts` não é dependência deste PNG.

Título vazio depois do trim vira `Livro sem título` no cartão, no alt e no texto. Autor ausente ou exatamente `Autor desconhecido` (trim) some da imagem e do texto. Vários autores já chegam numa linha (`A e B`, `A, B e C`).

Alt do preview: `Cartão de leitura de “{título}”, de {autor}. Leitura em 100%.` Sem autor, sem o trecho `, de {autor}`.

### 6.6 Texto, arquivo e corte

```text
com autor:    Terminei de ler “{título}”, de {autor}.
sem autor:    Terminei de ler “{título}”.
```

Aspas curvas `“”`. Sem hashtag. Sem URL. Teto de **250** code points (`[...texto].length`, não unidades UTF-16).

Corte: encolher o título dentro das aspas com `…` (U+2026) e manter o resto da frase. Se o autor sozinho ainda estourar 250, encolher o autor com a mesma reticência antes do ponto final. O cartão não usa esse corte: segue nas 3 linhas.

Arquivo: slug do `title` inteiro já resolvido (NFD, sem marcas, minúsculas, `[^a-z0-9]+` → `-`, hífens das pontas fora). Vazio → `leitura.png`. O exemplo `jogos-vorazes.png` da spec ilustra o formato. Este plano **não** parseia parênteses (§6.2). Para `Jogos Vorazes (Jogos Vorazes, #1)` o arquivo é `jogos-vorazes-jogos-vorazes-1.png`.

“Copiar texto” copia a mesma string que vai no `text` do intent.

---

## 7. Estados de UI

Copy travada em `finishedBookShareCopy.ts`.

| Estado | O que aparece |
| --- | --- |
| Fechado | Host não renderiza o diálogo. Ação persistente segue no card `finished`. |
| Abrindo / gerando | Título `Compartilhar no X`. Texto `Gerando o cartão…`. `aria-busy`. Baixar, copiar e abrir desabilitados. |
| Pronto | `<img>` do PNG, `alt` do §6.5. Descrição: `A imagem fica no seu dispositivo. Este link não envia o arquivo — anexe o PNG na publicação.` Botões: `Baixar imagem`, `Copiar texto`, `Abrir no X`, `Fechar`. |
| Falha do PNG | `Não foi possível gerar a imagem. Tente de novo.` Botão `Tentar de novo`. `Abrir no X` não dispara. |
| Capa ausente ou extração vazia | Preview e download seguem, com placeholder à esquerda e fallback. Sem toast de erro. |
| Clipboard falha | Toast `Não foi possível copiar o texto.` O diálogo continua aberto. |
| Popup bloqueado | Toast `Não foi possível abrir o X. Permita pop-ups e tente de novo.` |

Rodapé do card: o `CardFooter` que já envolve `CardReadingRatingButton` ganha o botão novo **embaixo**, os dois `w-full`. A grade do card não cabe `Alterar avaliação` e `Compartilhar no X` na mesma linha. Não é um controle só. Estante não renderiza esse rodapé de share. `reading` com cronograma em 100% continua só com `CardReadingProgressIndicator`.

Modal de detalhes: comando novo **depois** do WhatsApp, ícone `shareOnX` (traço de X no mapa de `bookDetailsSections.tsx`, não o `Share2`). Label `Compartilhar no X`, hint `Cartão da leitura`. A avaliação no modal fica onde está.

---

## 8. Convenções dos vizinhos

| Padrão pedido | O que o vizinho faz | O que este plano faz |
| --- | --- | --- |
| Lógica em hooks | Recap: canvas e texto em `utils/`; hook chama e guarda loading | Igual. Cor, texto, paleta e PNG são puros. Hook só para blob, clipboard e `window.open`. |
| Tipos fora do componente | Recap e o modal de detalhes: `types/`. O diálogo de estrelas declara props no próprio arquivo | Tipos em `types/finishedBookShare.types.ts` |
| Barrel `index.ts` | Recap e bookRating | Sim, no módulo novo |
| pt-BR, sem comentários | Recap e card | Sim |
| `useCallback` / `useMemo` | `useBookCard`, `useBookCardDetailsModal`, `useReadingNow` | Novos handlers nesses hooks seguem o arquivo. Não refatorar o que já está solto |

`useBookCard` hoje devolve `onFinishReading: () => changeBookStatus("finished")` inline. O plano não reescreve esses retornos; só acrescenta o ramo `finished` no `onSuccess` que já existe.

---

## 9. Testes

### 9.1 Automatizados

Puross, sem canvas real (jsdom não oferece `getImageData` confiável):

- `relativeLuminance`: preto &lt; 0,08, branco &gt; 0,92, `#E0A020` no meio.
- `extractCoverColor`: ouro sobre preto (Y e matiz); azul diferente do fallback; só preto / só branco / cinza → `null`; brancos e pretos não vencem um bloco cromático menor.
- `deriveCardPalette`: fundo escuro → tinta clara e pílula branca; fundo claro (`Y >= 0.42`) → `#1C1917` e pílula escura; fallback força tinta clara; contraste do `100%` ≥ 4,5; autor sólido quando a opacidade não passa; traço quando a pílula cola no fundo.
- `buildShareModel`: frase com Suzanne Collins; sem autor; `Autor desconhecido` omitido; título vazio → `Livro sem título`; aspas curvas; teto 250 com reticências dentro das aspas; autor longo também cabe; filename do título com parênteses; slug vazio → `leitura.png`; `buildTweetIntentUrl` igual a `https://twitter.com/intent/tweet?text=` + `encodeURIComponent`, e `URL.searchParams` só tem a chave `text`.
- `canShareFinishedBook`: finished participante; reading mesmo com progresso; estante; sem sessão; não participante.

Renderer, no estilo de `renderRecapPng.test.ts` (Image e canvas stubados):

- canvas 1200×600 e `toBlob` `image/png`;
- URL da Amazon vira `Image.src` do proxy e a URL crua não é atribuída;
- placeholder e host proibido não são amostrados; o desenho ainda pede o SVG local;
- `fillText` recebe o título, o autor e `100%`.

Store e hook:

- `arm` não abre; `revealArmed` do mesmo id abre; outro id não abre; `clearArmed` no unmount não abre;
- `openNow` abre sem estrelas;
- `close` limpa;
- diálogo: descrição do anexo manual; botões desabilitados enquanto gera; erro com a frase exata e sem `window.open`; baixar usa o filename; copiar e o intent recebem a mesma string.

Call sites:

- `useReadingNow`: sucesso `finished` arma e mantém `ratingPromptBookId`; dismiss revela; cancelar a confirmação, pausar, abandonar e erro não armam.
- `readingNow.tsx`: com `shouldRender` falso e prompt de estrelas setado, o diálogo de estrelas continua no documento. Sem prompt, a seção segue oculta.
- `useBookDialog`: transição para `finished` arma; já `finished` não arma; erro não arma; dismiss revela. Create usa o mapa de nomes, não um fetch novo.
- `useBookCard`: sucesso `finished` fora da estante chama `openNow` e não mexe em rating; estante não chama; pausar não chama. `shareOnWhatsApp` segue `wa.me`.
- `bookCard.tsx`: `finished` fora da estante mostra `Compartilhar no X` no mesmo `card-footer` da avaliação; `reading` não mostra; estante não mostra.
- Modal de detalhes: comando com hint `Cartão da leitura` só com `onShareOnX`. O teste que hoje faz `getByRole(..., { name: /Compartilhar/ })` passa a mirar `Enviar no WhatsApp`, senão o botão novo deixa o `getByRole` ambíguo.

Varredura pt-BR: o teste da copy compara as constantes com as frases deste plano. Não inventar rótulo em inglês nesse mapa.

### 9.2 Manual

O teste de pixel não prova o degradê na tela. No browser, com sessão:

1. Finalizar pelo Lendo agora um livro `reading`: confirmação, estrelas, e só depois o cartão. Cancelar a confirmação não abre o cartão. Pular as estrelas abre o cartão.
2. Finalizar pelo modal de detalhes do card da biblioteca: toast, modal fecha, cartão abre, sem estrelas.
3. Salvar de novo um livro já `finished`: sem oferta. O botão do rodapé e o comando do modal abrem o cartão.
4. Estante e livro `reading` (mesmo com cronograma em 100%): sem botão.
5. Capa preta com região dourada: fundo quente, não preto chapado. Outro livro de capa azul: fundo diferente. Sem capa: placeholder e marrom estável, download ainda funciona.
6. Baixar o PNG, copiar o texto, abrir o X e conferir a query só com `text`. A descrição do diálogo fala em anexar à mão.
7. Título longo: três linhas no cartão; texto colado ≤ 250 caracteres.
8. Viewport estreito: diálogo rola, botões alcançáveis, rodapé do card não estoura.

---

## 10. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| R-01 Intent sem anexo parece quebrado | A descrição do §7 é aceite, não copy opcional. Teste do diálogo trava a frase. |
| R-02 Média do preto | Moda cromática com descarte de Y. Teste do bloco `#E0A020`. |
| R-03 Dois modais juntos | `revealArmed` só no dismiss. Card não abre estrelas. |
| R-04 Canvas contaminado | Sem URL crua no `Image.src`. Teste do proxy. `SecurityError` em `getImageData` / `toBlob` cai na mensagem de falha e não abre o X. |
| Último livro some do Lendo agora | Estrelas ficam montadas com `ratingPromptBookId`; o cartão mora no host. |
| Filtro `status=reading` desmonta o card | `openNow` no store, host em `AppProviders`. |
| Dois `BookUpsert` | `revealArmed(bookId)` só casa com quem armou. |
| Autores trocados no mesmo save que finaliza | Mapa id→nome em memória. Id sem nome é omitido, não vira “Autor desconhecido”. |
| `/Compartilhar/` ambíguo nos testes | Apertar a query do WhatsApp na mesma entrega. |
| Store sujo entre testes | `beforeEach` dá `close()` e `clearArmed`. |

---

## 11. Fora deste plano

- `tasks.md` e código de aplicação.
- Hospedar o PNG, OG image, Storage, OAuth do X.
- Trocar o slug para cortar `(Série, #n)`.
- Alterar avaliação, WhatsApp, Recap ou o proxy de capas.
