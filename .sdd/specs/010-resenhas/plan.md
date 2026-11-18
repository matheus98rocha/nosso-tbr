# Plan: Resenhas (feed social de leituras)

**Feature ID:** 010
**Spec:** [spec.md](./spec.md)
**Criada em:** 2026-11-18

## Decisões

- Visibilidade = `is_book_visible_to_current_user`. Sem seletor por resenha.
- Uma linha em `book_reviews` por `(user_id, book_id)`.
- `reading_status` é preenchido por trigger a partir de `books.status`.
- Trigger em `book_reading_ratings` copia as estrelas para a resenha do mesmo par.
- O popup de finalização substitui `FinishedReadingRatingDialog` nos três caminhos. O diálogo antigo permanece só em "Alterar avaliação" no card.
- O popup vive em `AppProviders`, para não sumir quando o card sai da tela. Fechar no modo finalização chama `revealArmed`.
- Feed por `get_review_feed`, `SECURITY INVOKER`, cursor `(created_at, id)`.
- Leituras pelo cliente Supabase. Escritas por rotas `/api`, com `requireUser` e zod.
- Aba na query `aba`. "Resenhas" entra no menu desktop e na barra inferior. "Estatisticas" vai para o menu Mais no mobile.

## Módulos

- `supabase/migrations/20261118120000_book_reviews.sql`
- `src/app/api/reviews`, `review-reactions`, `review-comments`
- `src/modules/reviews`
- Entradas em `useBookDialog`, `useReadingNow`, `useBookCard`, `navCatalog`

## Fora

Notificação, tempo real, reação em comentário, URL pública, moderação.
