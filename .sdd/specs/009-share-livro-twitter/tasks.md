# Tasks: Compartilhar livro finalizado no X

**Feature ID:** 009  
**Spec:** [spec.md](./spec.md)  
**Plan:** [plan.md](./plan.md)  
**Criada em:** 2026-10-31

Não há `data-model` nem `contracts`. Cada task é um commit. Spec e plan permanecem fechados: esta lista não reabre decisão de produto nem de técnica.

---

## Legenda

- `[P]` — pode rodar em paralelo com outras `[P]` da **mesma** fase cujas dependências já fecharam, desde que não compartilhem o mesmo arquivo. A linha `Depende de` manda na ordem.
- `[USn]` — pertence à User Story n da spec.
- Fases 1 → 10 são a ordem padrão. `Depende de` e o grafo liberam o que já não espera ninguém: T008, T009 e T010 não esperam T005; T013 não espera T011. T006 e T007 esperam a luminância. O PNG espera T006, T007 e T008. Call sites só depois do host em `AppProviders` (T017).

**Não editar:** `finishedReadingRatingDialog.tsx`, `cardReadingRatingButton.tsx`, `bookUpsert.tsx`, `bookCardDetailsModal.tsx`, `src/modules/readingRecap/**`, `src/app/api/book-covers/route.ts`, `computeReadingProgress.ts`, `books.types.ts`, `resolveBookAuthors.ts`. `shareOnWhatsApp` não muda. Sem migration, sem rota, sem `localStorage`, sem `x.com`, sem OAuth, sem hospedar PNG.

---

## Phase 1: Setup

- [x] T001 Tipos do módulo em `src/modules/finishedBookShare/types/finishedBookShare.types.ts` e barrel `types/index.ts`.
  - Arquivos: `src/modules/finishedBookShare/types/finishedBookShare.types.ts`, `src/modules/finishedBookShare/types/index.ts`
  - Depende de: —
  - Pronto quando: existe `FinishedBookShareSubject` com `{ bookId, title, author, imageUrl }`, `author` `string | null` (nome de exibição ou `null`), `imageUrl` `string | null`. Props do diálogo ficam neste arquivo, não inline no componente. Sem tipo de série, saga ou posição.

- [x] T002 [P] Constantes de layout, cor e intent em `src/modules/finishedBookShare/constants/finishedBookShareLayout.ts`.
  - Arquivos: `src/modules/finishedBookShare/constants/finishedBookShareLayout.ts`
  - Depende de: —
  - Pronto quando: o arquivo é a única fonte destes números — luminância `0.08` e `0.92`; corte claro `Y >= 0.42`; crominância `(max-min)/255 >= 0.12`; alpha mínimo `128`; quantização `16`; amostra máx. `64` px; fallback `#6B4F3A`; tinta clara `#FFFFFF`; tinta escura `#1C1917`; `100%` sobre pílula clara `#141210`; alpha do autor `0.78`; contraste mínimo `4.5`; separação da pílula `0.18`; traço `4` px; teto do texto `250` code points; intent `https://twitter.com/intent/tweet`; canvas `1200×600`; degradê `L + 0.18` (teto `0.86`), `S × 0.92`, borda `L × 0.5` (piso `0.05`); geometria do plano §6.5 (capa `64, 300×450`, raio `12`; bloco `x 420`, largura `708`, padding direito `72`; título `700 54` / entrelinha `64` / até 3 linhas; autor `500 32` / uma linha / `16` px abaixo; pílula altura `72`, raio `36`, padding `36`, `700 36`, `28` px abaixo do autor). Não cria o barrel (T004).

- [x] T003 [P] [US4] Copy pt-BR e varredura das frases do plano.
  - Arquivos: `src/modules/finishedBookShare/constants/finishedBookShareCopy.ts`, `src/modules/finishedBookShare/constants/finishedBookShareCopy.test.ts`
  - Depende de: —
  - Pronto quando: o teste compara as constantes, uma a uma, com estas frases e com nenhuma outra: título `Compartilhar no X`; `Gerando o cartão…`; `A imagem fica no seu dispositivo. Este link não envia o arquivo — anexe o PNG na publicação.`; botões `Baixar imagem`, `Copiar texto`, `Abrir no X`, `Fechar`, `Tentar de novo`; erro `Não foi possível gerar a imagem. Tente de novo.`; toasts `Não foi possível copiar o texto.` e `Não foi possível abrir o X. Permita pop-ups e tente de novo.`; hint `Cartão da leitura`. O mapa não tem rótulo em inglês. Não cria o barrel (T004).

- [x] T004 Barrel de constantes.
  - Arquivos: `src/modules/finishedBookShare/constants/index.ts`
  - Depende de: T002, T003
  - Pronto quando: reexporta layout e copy. Nenhum número ou frase é redefinido aqui.

**Checkpoint:** tipos e constantes existem; ainda não há canvas, store nem UI.

---

## Phase 2: Foundational — luminância

- [x] T005 [US3] `relativeLuminance` + teste.
  - Arquivos: `src/modules/finishedBookShare/utils/relativeLuminance/relativeLuminance.ts`, `src/modules/finishedBookShare/utils/relativeLuminance/relativeLuminance.test.ts`, `src/modules/finishedBookShare/utils/relativeLuminance/index.ts`
  - Depende de: T002
  - Pronto quando: uma função só aplica a fórmula WCAG do plano §6 (`lin` com `0.04045` / `12.92` / `1.055` / `2.4`; `Y = 0.2126 R + 0.7152 G + 0.0722 B`; canal `0–1`). O teste prova preto `Y < 0.08`, branco `Y > 0.92` e `#E0A020` no meio. Não edita `utils/index.ts` (T011).

**Checkpoint:** o descarte de pixel e o contraste usam a mesma função.

---

## Phase 3: Utils puros e store

Funções puras e o store, com teste ao lado. Sem componente e sem call site.

- [x] T006 [P] [US3] `extractCoverColor` + teste.
  - Arquivos: `src/modules/finishedBookShare/utils/extractCoverColor/extractCoverColor.ts`, `src/modules/finishedBookShare/utils/extractCoverColor/extractCoverColor.test.ts`, `src/modules/finishedBookShare/utils/extractCoverColor/index.ts`
  - Depende de: T002, T005
  - Pronto quando: os limiares vêm das constantes de T002. Recebe `ImageData` já same-origin (quem chama é que reduz para 64 px e que recusa placeholder). Ignora alpha `< 128`. Pixel cromático: `(max-min)/255 >= 0.12` e `0.08 <= Y <= 0.92`. Sem pixel cromático devolve `null` — não tira média do preto descartado. Quantiza cada canal em passos de 16, histograma. Balde vencedor: maior contagem; empate pela maior crominância média; novo empate pelo menor índice. Cor base = média dos pixels originais daquele balde. Fixture 20×20 `#000000` com bloco `#E0A020`: `Y > 0.08` e matiz HSL entre 30° e 50°. Buffer `#1E4DB7` não cai em `#6B4F3A` nem no ouro. Só preto, só branco ou só cinza médio devolve `null`. Brancos e pretos não vencem um bloco cromático menor.

- [x] T007 [P] [US3] `deriveCardPalette` + teste.
  - Arquivos: `src/modules/finishedBookShare/utils/deriveCardPalette/deriveCardPalette.ts`, `src/modules/finishedBookShare/utils/deriveCardPalette/deriveCardPalette.test.ts`, `src/modules/finishedBookShare/utils/deriveCardPalette/index.ts`
  - Depende de: T002, T005
  - Pronto quando: os números vêm das constantes de T002. A região do texto é a mesma matiz, `L + 0.18` (teto `0.86`), `S × 0.92`; a borda é a mesma matiz, `L × 0.5` (piso `0.05`). O contraste olha o stop claro, não a borda. `Y >= 0.42` → título e autor `#1C1917`, pílula `#1C1917`, `100%` em `#FFFFFF`. Abaixo → título `#FFFFFF`, pílula `#FFFFFF`, `100%` em `#141210`. Fallback `#6B4F3A` não passa por esse corte: texto branco, pílula branca, `100%` preto, mesmo se o stop claro subir. Autor: tinta do título com alpha `0.78` composta na região do texto; se o contraste dessa composição ficar abaixo de `4.5`, tinta sólida do título. Os dois pares da pílula passam de `4.5`. Se `|Y(pílula) − Y(região)| < 0.18`, traço de `4` px na tinta do título. Testes do plano §9.1 para este util passam.

- [x] T008 [P] [US3] [US4] `buildShareModel`, `buildTweetIntentUrl` e o builder do assunto + teste.
  - Arquivos: `src/modules/finishedBookShare/utils/buildShareModel/buildShareModel.ts`, `src/modules/finishedBookShare/utils/buildShareModel/buildShareModel.test.ts`, `src/modules/finishedBookShare/utils/buildShareModel/index.ts`
  - Depende de: T001, T002
  - Pronto quando: `buildFinishedBookShareSubject` normaliza o snapshot (título com trim; `imageUrl` vazio, só espaço ou placeholder → `null`; autor vazio ou exatamente `Autor desconhecido` após trim → `null`) e não chama `formatList`. `buildShareModel` produz, com aspas curvas `“”`: com autor `Terminei de ler “{título}”, de {autor}.`; sem autor `Terminei de ler “{título}”.` Sem hashtag e sem URL. Título vazio vira `Livro sem título` no cartão, no alt e no texto. Alt: `Cartão de leitura de “{título}”, de {autor}. Leitura em 100%.`; sem autor, sem `, de {autor}`. Teto de 250 code points (`[...texto].length`, não UTF-16): encolhe o título dentro das aspas com `…` (U+2026) e mantém o resto; se o autor sozinho ainda estourar, encolhe o autor antes do ponto. O cartão não usa esse corte. Filename: slug do título inteiro já resolvido (NFD, sem marcas, minúsculas, `[^a-z0-9]+` → `-`, hífens das pontas fora); `Jogos Vorazes (Jogos Vorazes, #1)` → `jogos-vorazes-jogos-vorazes-1.png`; slug vazio → `leitura.png`. Não remove parênteses de série. `buildTweetIntentUrl` é `https://twitter.com/intent/tweet?text=` + `encodeURIComponent(texto)`. `URL.searchParams` só tem a chave `text`. Não usa `x.com`, nem `url`, nem `media`, nem `via`.

- [x] T009 [P] [US2] `canShareFinishedBook` + teste.
  - Arquivos: `src/modules/finishedBookShare/utils/canShareFinishedBook/canShareFinishedBook.ts`, `src/modules/finishedBookShare/utils/canShareFinishedBook/canShareFinishedBook.test.ts`, `src/modules/finishedBookShare/utils/canShareFinishedBook/index.ts`
  - Depende de: T001
  - Pronto quando: verdadeiro só com `isLogged && isParticipant && !isShelf && status === "finished"`. Falso para `reading` mesmo com progresso 100, estante, sem sessão, não participante, `paused`, `abandoned`, `planned` e `not_started`. A função não recebe `hideInteractions`. Participante continua sendo `canUserParticipateInBook` nos call sites; este helper só aplica o booleano.

- [x] T010 [P] [US1] [US2] Store Zustand em memória + teste.
  - Arquivos: `src/modules/finishedBookShare/stores/finishedBookShareStore.ts`, `src/modules/finishedBookShare/stores/finishedBookShareStore.test.ts`, `src/modules/finishedBookShare/stores/index.ts`
  - Depende de: T001
  - Pronto quando: sem `persist` e sem escrita em `userStore` nem `localStorage`. Ações exatamente: `armAfterRating(bookId, subject)` guarda e não abre; `revealArmed(bookId)` abre só se o id armado for esse e outro id não abre; `clearArmed(bookId)` descarta só esse id e não abre; `openNow(subject)` abre já, sem estrelas; `close()` fecha o diálogo ativo. Um único slot armado. `beforeEach` chama `close()` e `clearArmed` do id da fixture. Não há `reset()` extra.

**Checkpoint:** cor, texto, elegibilidade e store testáveis sem montar diálogo. `utils/index.ts` ainda não existe.

---

## Phase 4: Renderer

- [x] T011 [US3] `renderFinishedBookCardPng` + teste no estilo de `renderRecapPng.test.ts`, e barrel `utils/index.ts`.
  - Arquivos: `src/modules/finishedBookShare/utils/renderFinishedBookCardPng/renderFinishedBookCardPng.ts`, `src/modules/finishedBookShare/utils/renderFinishedBookCardPng/renderFinishedBookCardPng.test.ts`, `src/modules/finishedBookShare/utils/renderFinishedBookCardPng/index.ts`, `src/modules/finishedBookShare/utils/index.ts`
  - Depende de: T002, T006, T007, T008
  - Pronto quando: canvas `1200×600` e `toBlob` `image/png`. Capa remota só entra por `toSameOriginCoverSrc` importado de `@/modules/readingRecap/utils/toSameOriginCoverSrc`; URL da Amazon vira `Image.src` do proxy e a URL crua não é atribuída. Não há segundo `tryLoadCover` com `crossOrigin`. Path local permitido carrega direto. Placeholder (`isPlaceholderBookCoverSrc`, inclusive `/book-cover-placeholder.svg`) e host fora de `isAllowedBookCoverUrl` não são amostrados; o desenho ainda pede o SVG local. Amostra: lado maior ≤ 64 px, passo 1, só para `getImageData`; a capa desenhada permanece em tamanho de leitura, **contain** (`Math.min`), cantos 12, sombra leve — não o recorte `Math.max` do Recap. `fillText` recebe título, autor e `100%`. Sem capa, load falho ou extração `null`: placeholder (se não houver capa) ou a capa carregada à esquerda, degradê `#6B4F3A`, e o PNG ainda sai. `SecurityError` em `getImageData` / `toBlob` falha o cartão inteiro. Degradê: retângulo na cor da borda e radial centrado no bloco de texto (direita, meio vertical), do stop claro para a borda — não é capa desfocada. Fonte `ui-sans-serif, system-ui, sans-serif`, sem `document.fonts`. Helper de download duplicado dentro deste módulo; não importar `triggerPngDownload` do Recap. `utils/index.ts` reexporta os utils das fases 2–4. Image e canvas stubados, como no teste do Recap.

**Checkpoint:** o PNG é o único layout. Preview ainda não existe.

---

## Phase 5: Hook e botão

- [x] T012 [P] [US4] `useFinishedBookShareDialog` + teste.
  - Arquivos: `src/modules/finishedBookShare/hooks/useFinishedBookShareDialog.ts`, `src/modules/finishedBookShare/hooks/useFinishedBookShareDialog.test.ts`, `src/modules/finishedBookShare/hooks/index.ts`
  - Depende de: T003, T008, T010, T011
  - Pronto quando: o hook chama `renderFinishedBookCardPng` e guarda um único `blob:` para o `<img>`. Revoga o object URL ao trocar o assunto e no unmount. Enquanto gera, baixar, copiar e abrir ficam desabilitados. Falha (incluindo `SecurityError`) expõe a frase exata de T003 e o handler de abrir não chama `window.open`. `Tentar de novo` gera outra vez. Baixar usa o filename do model e o helper local, não o do Recap. Copiar e o intent recebem a mesma string. Clipboard rejeitado → toast `Não foi possível copiar o texto.`; diálogo segue aberto. `window.open` nulo → toast `Não foi possível abrir o X. Permita pop-ups e tente de novo.` Abrir usa `buildTweetIntentUrl` já calculado, `window.open(url, "_blank", "noopener,noreferrer")`, sem esperar o canvas no gesto. Handlers com `useCallback` / `useMemo`.

- [x] T013 [P] [US2] Botão persistente, sem teste próprio.
  - Arquivos: `src/modules/finishedBookShare/components/shareFinishedBookOnXButton/shareFinishedBookOnXButton.tsx`, `src/modules/finishedBookShare/components/shareFinishedBookOnXButton/index.ts`
  - Depende de: T003, T008, T010
  - Pronto quando: `type="button"`, `w-full`, `onClick` chama `event.stopPropagation()` e `openNow(buildFinishedBookShareSubject(...))`. Rótulo `Compartilhar no X` vindo da copy. Não sabe de estrelas, WhatsApp nem cronograma. Sem arquivo de teste (o plano não lista); a visibilidade fica em T025.

**Checkpoint:** gerar, baixar, copiar e abrir testados no hook. O diálogo ainda não está na árvore.

---

## Phase 6: Diálogo e host

- [x] T014 [US3] [US4] `FinishedBookShareDialog` + teste.
  - Arquivos: `src/modules/finishedBookShare/components/finishedBookShareDialog/finishedBookShareDialog.tsx`, `src/modules/finishedBookShare/components/finishedBookShareDialog/finishedBookShareDialog.test.tsx`, `src/modules/finishedBookShare/components/finishedBookShareDialog/index.ts`
  - Depende de: T003, T012
  - Pronto quando: `Dialog` de `@/components/ui/dialog`. Props tipadas no arquivo de T001. O preview é só o `<img>` do blob do hook — sem segundo layout em React. Gerando: título `Compartilhar no X`, texto `Gerando o cartão…`, `aria-busy`, ações desabilitadas. Pronto: `alt` do model e a descrição do anexo manual de T003; botões `Baixar imagem`, `Copiar texto`, `Abrir no X`, `Fechar`. Falha: frase exata de T003, botão `Tentar de novo`, e `Abrir no X` não dispara `window.open`. Baixar usa o filename. Copiar e o intent recebem a mesma string. Sem comentários no código novo.

- [x] T015 [US1] Host que só lê o store. Sem arquivo de teste.
  - Arquivos: `src/modules/finishedBookShare/components/finishedBookShareHost/finishedBookShareHost.tsx`, `src/modules/finishedBookShare/components/finishedBookShareHost/index.ts`
  - Depende de: T010, T014
  - Pronto quando: com diálogo ativo, monta `FinishedBookShareDialog`; fechado, não monta. `Fechar` chama `close()`. Não busca livro, não persiste e não abre sozinho. O plano não lista teste deste arquivo.

**Checkpoint:** o fluxo do cartão abre e fecha pelo store, ainda fora dos call sites.

---

## Phase 7: API pública e montagem

- [x] T016 Barrel do módulo.
  - Arquivos: `src/modules/finishedBookShare/index.ts`
  - Depende de: T008, T009, T010, T013, T015
  - Pronto quando: exporta o host, o botão, `canShareFinishedBook`, `buildFinishedBookShareSubject` e as ações do store (`armAfterRating`, `revealArmed`, `clearArmed`, `openNow`, `close`). Não exporta o canvas nem o helper de download do Recap.

- [x] T017 [US1] Montar o host em `AppProviders`.
  - Arquivos: `src/providers/AppProviders.tsx`
  - Depende de: T016
  - Pronto quando: `FinishedBookShareHost` renderiza ao lado do `Toaster`, dentro do provider que já existe. Nenhum outro provider ganha o diálogo.

**Checkpoint:** a oferta sobrevive ao unmount do card e do Lendo agora. Call sites ainda não armam.

---

## Phase 8: Call sites independentes

Todos dependem de T017. Não compartilham arquivo entre si.

- [x] T018 [P] [US1] Armar e revelar no Lendo agora.
  - Arquivos: `src/modules/home/components/readingNow/hooks/useReadingNow.ts`, `src/modules/home/components/readingNow/hooks/useReadingNow.test.tsx`
  - Depende de: T016, T017
  - Pronto quando: no `onSuccess` de `statusTransitionMutation`, `nextStatus === "finished"` chama `armAfterRating` com snapshot de `variables.book` (`title`, `author` já vindo de `resolveBookAuthors` — não passar de novo por `formatList` —, `imageUrl` pelo builder) e mantém `setRatingPromptBookId`. `dismissRatingPrompt` chama `revealArmed` com esse id e só então zera `ratingPromptBookId`. Pausar, abandonar, cancelar `ReadingNowStatusConfirmationDialog` e `onError` não armam. O cleanup do unmount do hook chama `clearArmed` só do id que esta instância armou e não chama `revealArmed`. `shouldRender` falso não é unmount do hook: não limpar o slot nesse caso. `FinishedReadingRatingDialog` não é editado.

- [x] T019 [P] [US1] Manter estrelas montadas quando o carrossel some.
  - Arquivos: `src/modules/home/components/readingNow/readingNow.tsx`, `src/modules/home/components/readingNow/readingNow.test.tsx`
  - Depende de: T017
  - Pronto quando: com `shouldRender` falso e `ratingPromptBookId !== null`, `FinishedReadingRatingDialog` e `ReadingNowStatusConfirmationDialog` continuam no documento e o carrossel não renderiza. Sem prompt, a seção segue oculta (`return null`). O `onDismiss` existente continua sendo `dismissRatingPrompt` (a revelação é T018). O teste cobre os dois casos.

- [x] T020 [P] [US1] Mapa id → nome no upsert, sem armar ainda.
  - Arquivos: `src/modules/bookUpsert/bookUpsert.types.ts`, `src/modules/bookUpsert/hooks/useBookUpsert.ts`, `src/modules/bookUpsert/hooks/useBookUpsert.test.ts`, `src/modules/bookUpsert/hooks/useBookDialog.ts`, `src/modules/bookUpsert/hooks/useBookDialog.test.ts`, `src/modules/bookUpsert/hooks/useBookDialog.ignoreCreate.test.ts`
  - Depende de: T017
  - Pronto quando: `useBookUpsert` guarda `Map<string, string>` num ref, sem request novo no sucesso. Edição: `bookData.authorIds` alinhado por índice a `bookData.authorNames`. Cada resposta de `searchAuthors` (`ComboboxOption` `{ id, name }`) entra no mapa. `handleAuthorCreated`: se o id voltar e `authorSearch` tiver nome, grava esse par. `UseCreateBookDialog` ganha `resolveAuthorNames(ids: string[]): string[]`. `useBookDialog` aceita e repassa o resolvedor; id sem nome é omitido, não vira `Autor desconhecido` nem uuid. `useBookUpsert` passa o resolvedor. Chamadas de teste em `useBookDialog.test.ts` e `useBookDialog.ignoreCreate.test.ts` compilam. `bookUpsert.tsx` não muda. Esta task não chama `armAfterRating`.

- [x] T021 [P] [US1] [US2] `openNow` no card e `showShareOnX`.
  - Arquivos: `src/components/bookCard/hooks/useBookCard.ts`, `src/components/bookCard/hooks/useBookCard.test.ts`
  - Depende de: T009, T016, T017
  - Pronto quando: `showShareOnX` usa `canShareFinishedBook` (`isLogged`, participante por `canUserParticipateInBook`, `!isShelf`, `status === "finished"`). No `onSuccess` de `statusTransitionMutation`, se `nextStatus === "finished"`, o status anterior não era `finished` e `!isShelf`: depois do toast `Leitura finalizada` e de fechar o modal de detalhes, `openNow` com snapshot do `book` do closure (não reler após o invalidate). Estante não chama. Pausar não chama. Não mexe em `ratingPrompt` nem abre estrelas. `shareOnWhatsApp` segue `https://wa.me/?text=`. O retorno `onFinishReading: () => changeBookStatus("finished")` não é reescrito.

- [x] T022 [P] Query do WhatsApp no teste do modal deixa de ser ambígua.
  - Arquivos: `src/components/bookCard/components/bookCardDetailsModal/bookCardDetailsModal.test.tsx`
  - Depende de: T017
  - Pronto quando: o `getByRole("button", { name: /Compartilhar/ })` desse arquivo passa a mirar `Enviar no WhatsApp` (o hint já está no nome acessível do comando WhatsApp). O teste continua verde sem o botão novo. Nenhum outro `getByRole` de “Compartilhar leituras” é alterado. `shareOnWhatsApp` não muda.

**Checkpoint:** Lendo agora arma no hook; o card já sabe abrir; a query do WhatsApp está apertada antes do segundo botão.

---

## Phase 9: Call sites que encadeiam

- [ ] T023 [US1] Revelar o cartão no dismiss do upsert.
  - Arquivos: `src/modules/bookUpsert/hooks/useBookDialog.ts`, `src/modules/bookUpsert/hooks/useBookDialog.test.ts`
  - Depende de: T008, T016, T020
  - Pronto quando: no `onSuccess`, o snapshot sai de `variables` e de `resolveAuthorNames` antes de depender do form resetado. `title` ← `variables.title`; `imageUrl` ← `variables.image_url` (o builder zera vazio e placeholder); `bookId` ← id editado ou `result.book.id` no create; nomes → `formatList` em `src/utils/formatters/formatters.ts`; lista vazia → `author: null`. `armAfterRating` só quando `shouldOpenRatingPrompt` já é verdadeiro (transição para `finished` de um livro que ainda não estava finalizado). Regravar `finished` não arma. `onError` não arma. `handleDismissRatingPrompt` chama `revealArmed(bookId)` e só então zera o prompt. Unmount do hook: `clearArmed` daquele id, sem revelar. Create usa o mapa, sem fetch novo de autores. `bookUpsert.tsx` não muda. O diálogo de estrelas do `CardReadingRatingButton` não revela o cartão.

- [ ] T024 [US2] Comando “Compartilhar no X” no modal de detalhes.
  - Arquivos: `src/components/bookCard/components/bookCardDetailsModal/types/bookCardDetailsModal.types.ts`, `src/components/bookCard/components/bookCardDetailsModal/hooks/useBookCardDetailsModal.ts`, `src/components/bookCard/components/bookCardDetailsModal/components/bookDetailsSections/bookDetailsSections.tsx`, `src/components/bookCard/components/bookCardDetailsModal/bookCardDetailsModal.test.tsx`
  - Depende de: T021, T022
  - Pronto quando: `BookDetailsActionIcon` ganha `"shareOnX"`. `onShareOnX` é opcional nas props. O comando só existe se o callback foi passado; fica **depois** do WhatsApp; label `Compartilhar no X`; hint `Cartão da leitura`; ícone `X` de `lucide-react` no mapa, não `Share2`. Sem callback, o comando não aparece. O teste do WhatsApp continua em `Enviar no WhatsApp` (T022) e ganha o caso do comando novo. `bookCardDetailsModal.tsx` não muda: já entrega `props` ao hook. Avaliação no modal fica onde está.

- [ ] T025 [P] [US2] Botão no rodapé do card e callback no modal.
  - Arquivos: `src/components/bookCard/bookCard.tsx`, `src/components/bookCard/bookCard.test.tsx`
  - Depende de: T013, T021, T024
  - Pronto quando: no `CardFooter` que já envolve `CardReadingRatingButton` (`!isShelf` e `finished`), o botão novo fica **embaixo**, os dois `w-full`. Não é um controle só e não divide a linha com `Alterar avaliação`. `reading` (mesmo com cronograma em 100%) continua só com `CardReadingProgressIndicator`. Estante não renderiza esse rodapé. O mesmo `bookCard.tsx` repassa `onShareOnX` para `BookCardDetailsModal` quando `showShareOnX`; não repassa na estante. `onShare={shareOnWhatsApp}` permanece. Teste: `finished` fora da estante mostra `Compartilhar no X` no mesmo `card-footer` da avaliação; `reading` não mostra; estante não mostra.

- [ ] T026 [P] [US2] Repasse no modal do Lendo agora.
  - Arquivos: `src/modules/home/components/readingNow/components/readingNowBookDetailsModal.tsx`
  - Depende de: T021, T024
  - Pronto quando: repassa `onShareOnX` vindo de `useBookCard`. Em `reading` o callback não existe, então o comando novo não aparece. `onShare={shareOnWhatsApp}` permanece. Finalizar por este modal continua no `onFinishReading` do pai (T018: estrelas e só depois `revealArmed`). Não ligar o `openNow` de T021 a esse `onFinishReading`.

**Checkpoint:** oferta automática na ordem da spec §6.1; ação persistente no card e no modal; WhatsApp e estrelas intactos.

---

## Phase 10: Verificação

- [ ] T027 Rodar só os unitários novos e os dos call sites tocados.
  - Arquivos: nenhum fonte novo. Comando abaixo.
  - Depende de: T005–T026
  - Pronto quando: este comando termina verde e nenhum servidor do app foi iniciado (`yarn dev` / `next dev` / `next start` ficam de fora; o checklist manual do plano §9.2 não é task de agente):

```text
yarn vitest run --coverage=false \
  src/modules/finishedBookShare \
  src/modules/home/components/readingNow/readingNow.test.tsx \
  src/modules/home/components/readingNow/hooks/useReadingNow.test.tsx \
  src/modules/bookUpsert/hooks/useBookDialog.test.ts \
  src/modules/bookUpsert/hooks/useBookDialog.ignoreCreate.test.ts \
  src/modules/bookUpsert/hooks/useBookUpsert.test.ts \
  src/components/bookCard/hooks/useBookCard.test.ts \
  src/components/bookCard/bookCard.test.tsx \
  src/components/bookCard/components/bookCardDetailsModal/bookCardDetailsModal.test.tsx
```

Não usar `yarn test` sozinho: ele cobre o repositório inteiro.

---

## Mapa spec → tasks

| Item | Tasks |
| ---- | ----- |
| US1 oferta na transição, estrelas primeiro | T010, T015, T017, T018, T019, T023 |
| US1 card da biblioteca sem estrelas | T021 |
| US2 ação persistente | T009, T013, T021, T024, T025, T026 |
| US3 cartão, cor cromática, fallback | T005, T006, T007, T011, T014 |
| US4 texto, PNG, intent só `text` | T003, T008, T012, T014 |
| FR-007 WhatsApp e estrelas intactos | T018, T021, T022, T024, T025 |
| SC-002 ouro sobre preto / dois fundos | T006, T007 |
| §9.1 query `/Compartilhar/` | T022, T024 |

---

## Dependências

```text
T001 ∥ T002 ∥ T003
T002, T003 → T004
T002 → T005 → T006 ∥ T007
T001, T002 → T008
T001 → T009 ∥ T010
T006, T007, T008 → T011 → T012
T008, T010 → T013
T012 ∥ T013
T012 → T014 → T015
T008, T009, T010, T013, T015 → T016 → T017
T017 → T018 ∥ T019 ∥ T020 ∥ T021 ∥ T022
T020 → T023
T021, T022 → T024
T013, T024 → T025 ∥ T026
T005–T026 → T027
```

## Paralelo

- T001 ∥ T002 ∥ T003
- Após T005: T006 ∥ T007. No mesmo momento, se T001 e T002 já fecharam: T008 ∥ T009 ∥ T010 (não usam a luminância)
- T013 após T008 e T010, em paralelo com T011 e com T012. T012 após T011
- T018 ∥ T019 ∥ T020 ∥ T021 ∥ T022 após T017
- T025 ∥ T026 após T024
