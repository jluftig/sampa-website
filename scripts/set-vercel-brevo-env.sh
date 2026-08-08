#!/usr/bin/env bash
# Push Brevo server env to Vercel Production (and optional Preview).
# Prereq: `npx vercel login` once on this machine, linked to sampa-website.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${HERMES_HOME:-$HOME/.hermes/profiles/egg}/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  ENV_FILE="$HOME/.hermes/profiles/egg/.env"
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing Hermes egg .env with BREVO_*" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
# load only BREVO_
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  [[ "$line" != *"="* ]] && continue
  key="${line%%=*}"; key="${key// /}"
  case "$key" in BREVO_*) export "$line" ;; esac
done < "$ENV_FILE"
set +a

: "${BREVO_API_KEY:?BREVO_API_KEY missing in egg .env}"
: "${BREVO_LIST_UPDATES:=3}"
: "${BREVO_DOI_TEMPLATE_ID:?BREVO_DOI_TEMPLATE_ID missing — create DOI template first}"
: "${BREVO_SENDER_EMAIL:=info@addictionpas.org}"
: "${BREVO_SENDER_NAME:=SAMPA}"
: "${BREVO_REPLY_TO:=info@addictionpas.org}"
: "${BREVO_DOI_REDIRECT_URL:=https://www.addictionpas.org/newsletter-confirmed}"

cd "$ROOT"
npx --yes vercel@latest whoami >/dev/null

add_env() {
  local name="$1" value="$2"
  # Remove existing Production value if present (ignore errors)
  printf '%s\n' "$value" | npx --yes vercel@latest env add "$name" production --force 2>/dev/null \
    || printf '%s\n' "$value" | npx --yes vercel@latest env add "$name" production
  echo "set $name (production)"
}

add_env BREVO_API_KEY "$BREVO_API_KEY"
add_env BREVO_LIST_UPDATES "$BREVO_LIST_UPDATES"
add_env BREVO_DOI_TEMPLATE_ID "$BREVO_DOI_TEMPLATE_ID"
add_env BREVO_DOI_REDIRECT_URL "$BREVO_DOI_REDIRECT_URL"
add_env BREVO_SENDER_EMAIL "$BREVO_SENDER_EMAIL"
add_env BREVO_SENDER_NAME "$BREVO_SENDER_NAME"
add_env BREVO_REPLY_TO "$BREVO_REPLY_TO"

echo "Redeploying production..."
npx --yes vercel@latest deploy --prod --yes
echo "Done. Smoke-test footer signup on www.addictionpas.org"
