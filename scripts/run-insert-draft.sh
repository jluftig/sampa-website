#!/usr/bin/env bash
# Load SAMPA_* from Hermes profile .env and insert a draft post.
# Usage: scripts/run-insert-draft.sh path/to/draft.json [--validate-only]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${HERMES_HOME:-$HOME/.hermes/profiles/egg}/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  # fallback default profile layout
  ENV_FILE="$HOME/.hermes/profiles/egg/.env"
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing Hermes env: $ENV_FILE" >&2
  exit 1
fi

# Export SAMPA_* and optional SUPABASE_* elevated keys only
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  [[ "$line" != *"="* ]] && continue
  key="${line%%=*}"
  key="${key// /}"
  case "$key" in
    SAMPA_*|SUPABASE_URL|SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|VITE_SUPABASE_URL)
      # shellcheck disable=SC2163
      export "$line"
      ;;
  esac
done < "$ENV_FILE"

cd "$ROOT"
exec node scripts/insert-sampa-draft.mjs "$@"
