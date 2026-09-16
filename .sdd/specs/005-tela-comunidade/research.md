# Research: Tela de Comunidade (005)

## R-01 — REST `/api/community` vs cliente Supabase + RPC

**Opções:** (A) `GET /api/community` agrega tudo no server; (B) `UserSocialService` + RPC no browser.

**Escolha:** B.

O diretório do perfil já é B. RN48 pede API para mutações de livros/estantes, não para SELECT social. Um REST extra duplica auth e não muda a superfície de segurança da RPC.

## R-02 — Reusar `get_reading_stats_by_reader`

**Opções:** (A) chamar a RPC de stats por cada membro; (B) RPC nova INVOKER.

**Escolha:** B.

Stats é SECURITY DEFINER e ignora RLS para o leitor escolhido — certo para “minhas stats”, errado para “gênero do outro na Comunidade”. Também é anual / `end_date`, não `status = finished` + cadastrados.

## R-03 — Vencedor do gênero no SQL vs no TS

**Opções:** (A) `ORDER BY count DESC, gender ASC` no SQL; (B) counts na RPC + `pickTopGenre` com `getGenderLabel`.

**Escolha:** B.

A spec desempata pelo **rótulo** pt-BR (`Fantasia` vs value `fantasy`). Rótulos estão no app.

## R-04 — Recortes no servidor vs no client

**Opções:** (A) três queries; (B) um snapshot, filtra na UI.

**Escolha:** B.

N de usuários é pequeno. Contagens devem ignorar a busca (RN-COM-04): mais simples com IDs completos em memória. URL só carrega `view`.

## R-05 — Extrair módulo `social/`

**Opções:** (A) mover follow/directory agora; (B) reusar hooks do profile.

**Escolha:** B nesta entrega.

P2 remove o diretório do perfil; o toggle continua compartilhado. Extração é refactor sem valor de produto no MVP.
