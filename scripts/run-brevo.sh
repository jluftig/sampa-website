#!/usr/bin/env bash
# Load BREVO_* (and optional SAMPA_*) from Hermes profile .env, run Brevo CLI.
# Usage: scripts/run-brevo.sh <command> [args...]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${HERMES_HOME:-$HOME/.hermes/profiles/egg}/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  ENV_FILE="$HOME/.hermes/profiles/egg/.env"
fi
if [[ -f "$ENV_FILE" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" != *"="* ]] && continue
    key="${line%%=*}"
    key="${key// /}"
    case "$key" in
      BREVO_*|SENDINBLUE_*|SAMPA_*)
        # shellcheck disable=SC2163
        export "$line"
        ;;
    esac
  done < "$ENV_FILE"
fi
cd "$ROOT"
exec node scripts/brevo/cli.mjs "$@"
