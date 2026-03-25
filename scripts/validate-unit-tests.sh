#!/usr/bin/env sh
set -eu

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR)

if [ -z "$STAGED_FILES" ]; then
  echo "Nenhum arquivo staged para validação."
  exit 0
fi

STAGED_IMPL_FILES=$(echo "$STAGED_FILES" | rg '^src/.+\.(ts|tsx|js|jsx)$' | rg -v '(\.test\.|\.spec\.|\.d\.ts$)') || true
STAGED_TEST_FILES=$(echo "$STAGED_FILES" | rg '^src/.+(\.test\.|\.spec\.).+\.(ts|tsx|js|jsx)$') || true

if [ -n "$STAGED_IMPL_FILES" ] && [ -z "$STAGED_TEST_FILES" ]; then
  echo "❌ Commit bloqueado: alterações de implementação sem testes unitários staged."
  echo "Adicione/atualize arquivos *.test.* ou *.spec.* no mesmo commit."
  exit 1
fi

if [ -z "$STAGED_IMPL_FILES" ] && [ -z "$STAGED_TEST_FILES" ]; then
  echo "Nenhuma alteração de código/teste unitário detectada."
  exit 0
fi

RELATED_TARGETS=$(printf '%s\n%s\n' "$STAGED_IMPL_FILES" "$STAGED_TEST_FILES" | rg -v '^$' | tr '\n' ' ')

echo "▶ Executando testes relacionados aos arquivos staged..."
# shellcheck disable=SC2086
npx vitest related --run $RELATED_TARGETS

echo "✅ Testes relacionados passaram."
