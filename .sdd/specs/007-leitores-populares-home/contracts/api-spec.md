# API Contract: Leitores populares na Home

**Feature ID:** 007

## REST

Nenhum endpoint HTTP novo. Mutação de seguir permanece no client Supabase (`UserSocialService`).

## RPC

| Nome | Args | Retorno | Segurança |
| ---- | ---- | ------- | --------- |
| `get_popular_readers_for_home` | `p_limit int` default 12 | ver `rpc-spec.sql` | `SECURITY INVOKER`, só `authenticated` |

## Client query key

```ts
QUERY_KEYS.popularReaders.list(userId)
```

## Preferência (não-API)

`localStorage`: `nosso-tbr:home:hide-popular-readers:${userId}`
