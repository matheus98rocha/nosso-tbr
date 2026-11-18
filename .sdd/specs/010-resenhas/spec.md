# Feature Specification: Resenhas (feed social de leituras)

**Feature ID:** 010
**Status:** Draft
**Owner:** Mateus
**Criada em:** 2026-11-18
**Domínios relacionados:** Livro e status (`CONTEXT.md`) · Leitor e Seguidor · Avaliação por estrelas (feature 002) · Cartão de leitura no X (feature 009) · ADR 0003 e ADR 0005

## 1. Resumo executivo

O Leitor ganha uma tela de resenhas com três abas (Geral, Seguindo, Minhas resenhas), ordenadas da mais recente para a mais antiga. Ao finalizar um livro, um popup pede as estrelas e um texto opcional de até 500 caracteres. Sem texto, só a avaliação privada é salva. Com texto, a resenha é publicada. O mesmo popup serve para escrever ou editar uma resenha a qualquer momento, pela tela ou pelo card do livro na Home.

Cada card mostra o status daquela leitura no momento da publicação, e permite curtir, não curtir, comentar (com respostas em um nível) e compartilhar o texto no X.

## 2. Por quê

Finalizar um livro hoje abre estrelas e, em seguida, o cartão do X. Falta um lugar para a opinião em texto e para a conversa em volta dela. A leitura coletiva já tem comentários, mas eles pertencem à sala do grupo, não a uma resenha do leitor.

## 3. Glossário

Os termos Resenha, Status na resenha, Reação e Comentário de resenha estão em `CONTEXT.md`.

## 4. Escopo

### 4.1 Dentro

- Tela `/reviews`, com login obrigatório, três abas na URL e feed de 10 em 10.
- Popup único de resenha, com as estrelas já existentes, contador de 500 caracteres e aviso quando o livro é solo.
- Abertura automática ao finalizar, nos três caminhos: formulário do livro, Lendo agora e Finalizar leitura do card.
- Atalho no card da Home e comando nos detalhes do livro.
- Curtir e não curtir com resposta imediata na interface.
- Comentários e respostas em um nível.
- Compartilhar o texto no X.
- A resenha segue a visibilidade do livro (ADR 0005).

### 4.2 Fora

- Notificação de curtida ou comentário.
- Atualização em tempo real do feed.
- Reação em comentário.
- Página pública da resenha e link no tweet.
- Lista de resenhas dentro dos detalhes do livro.
- Denúncia ou moderação por Administrador.

## 5. Personas e cenários

### User Story 1 — Feed em três abas (P1)

Como Leitor, quero ver as resenhas visíveis, as de quem eu sigo e as minhas, da mais recente para a mais antiga, para acompanhar leituras sem misturar os recortes.

### User Story 2 — Escrever ao finalizar (P1)

Como Leitor, quando finalizo um livro, quero estrelas e um texto opcional no mesmo popup, para registrar a leitura e, se quiser, publicá-la. Sem texto, só a avaliação privada fica salva. Ao fechar, o cartão do X continua disponível.

### User Story 3 — Escrever quando quiser (P1)

Como Leitor, quero escrever ou editar uma resenha de um livro em qualquer status, pela tela de resenhas ou pelo card na Home, para não depender de ter finalizado a obra.

### User Story 4 — Status no card (P1)

Como Leitor, quero ver se o autor concluiu, está lendo, pausou, abandonou ou ainda não começou, para ler a opinião no contexto daquela leitura.

### User Story 5 — Conversar e compartilhar (P1)

Como Leitor, quero curtir, não curtir, comentar, responder e levar o texto ao X, para reagir à resenha sem sair do feed.

## 6. Regras

- Uma resenha por Leitor por livro. Editar não muda a ordem do feed e marca "editada".
- Estrelas de 1 a 5 são obrigatórias. No popup de finalização o texto é opcional. Na criação manual, o texto é obrigatório.
- O status gravado vem do livro no momento da escrita. O cliente não envia esse valor.
- Quando o livro está finalizado, as estrelas da resenha e a avaliação da leitura ficam iguais.
- Curtir e não curtir são exclusivos. O autor não reage à própria resenha.
- Resposta só ao comentário principal. Responder a uma resposta cita a pessoa e entra na mesma conversa.
- Comentário: o autor do comentário ou o autor da resenha pode excluir.
- Só participa do livro quem escreve a resenha. Qualquer Leitor que vê a resenha comenta e reage.
- O texto do X cabe em 280 pela contagem do X e não leva link.

## 7. Critérios de sucesso

- Finalizar um livro abre o popup e, ao fechá-lo, o cartão do X.
- As três abas respeitam visibilidade, seguidos e autoria.
- Curtir muda o contador na hora e desfaz se a gravação falha.
- Livro solo não aparece para quem não segue o autor.
- Estados de carregamento, vazio e erro têm texto e uma ação.
