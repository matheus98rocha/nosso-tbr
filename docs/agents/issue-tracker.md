# Issue tracker: GitHub

Issues e specs deste repositório vivem nas GitHub Issues de `matheus98rocha/nosso-tbr`.

Quando uma skill solicitar publicação, deve criar uma GitHub Issue. PRs não são tratados como superfície de triagem.

## Conventions

- Criar issue: `gh issue create --title "..." --body "..."`.
- Ler issue: `gh issue view <number> --comments`.
- Listar issues: `gh issue list --state open`.
- Comentar: `gh issue comment <number> --body "..."`.
- Aplicar/remover labels: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`.
- Fechar: `gh issue close <number> --comment "..."`.

O repositório é inferido pelo remote Git configurado.
