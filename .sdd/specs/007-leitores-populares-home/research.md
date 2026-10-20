# Research: Leitores populares na Home

**Feature ID:** 007  
**Criada em:** 2026-10-20

## Estado atual

- Home (`src/modules/home`) = filtros + ReadingNow + grade de livros; empty state de seguir aponta para perfil, não Comunidade.
- Comunidade (005) = diretório + seguir + gêneros no modal; **sem** recomendações automáticas (fora de escopo da 005).
- Issue #175 (006) = tutorial + zero-seguindo + recomendações por gênero — **spec não commitada**; overlap com esta feature na parte de recomendações.
- Contagem de seguidores = length de IDs, sem coluna denormalizada.
- Autores: `book_authors` + legado `books.author_id`.

## Alternativas descartadas

| Alternativa | Por quê não |
| ----------- | ----------- |
| Reusar snapshot da Comunidade no client | Ordenação alfabética; snapshot pesado; sem autores |
| DEFINER / stats RPC | Vaza livros privados (lição da 005) |
| Preferência no Postgres MVP | Overkill; localStorage suficiente para esconder |
| Overlap só por título | Mais raro; MVP usa gênero + autor |
| Incluir já seguidos com botão Seguiendo | Faixa é descoberta; polui com quem já segue |

## Integração com 006

Implementar a faixa uma vez (007). 006 deve referenciar este módulo para qualquer “recomendar quem seguir” na Home.
