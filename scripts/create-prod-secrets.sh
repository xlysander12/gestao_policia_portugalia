#!/usr/bin/env bash

set -euo pipefail

# Creates all external Docker secrets required by docker-compose.prod.yml.
# Usage:
#   bash scripts/create-prod-secrets.sh
# Optional env overrides:
#   DB_HOST, DB_USER, DB_DATABASE, DB_PORT, HTTP_PORT,
#   GH_APP_ID, GH_INSTALLATION_ID, GH_REPO_OWNER, GH_REPO_NAME,
#   DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, SESSION_SECRET, DB_PASSWORD, DB_ROOT_PASSWORD,
#   FORCE (true|false)

FORCE="${FORCE:-true}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

random_base64() {
  local bytes="$1"
  openssl rand -base64 "$bytes" | tr -d '\n'
}

upsert_secret() {
  local name="$1"
  local value="$2"

  if docker secret inspect "$name" >/dev/null 2>&1; then
    if [[ "$FORCE" == "true" ]]; then
      docker secret rm "$name" >/dev/null
    else
      echo "Skipping existing secret: $name"
      return 0
    fi
  fi

  printf "%s" "$value" | docker secret create "$name" - >/dev/null
  echo "Created secret: $name"
}

require_command docker
require_command openssl

swarm_state="$(docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null || true)"
if [[ "$swarm_state" != "active" ]]; then
  echo "Docker Swarm is not active. Initializing swarm..."
  docker swarm init >/dev/null 2>&1 || true
  swarm_state="$(docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null || true)"
  if [[ "$swarm_state" != "active" ]]; then
    echo "Failed to initialize Docker Swarm. Initialize it manually and retry." >&2
    exit 1
  fi
fi

DB_HOST="${DB_HOST:-db}"
DB_USER="${DB_USER:-portal_user}"
DB_DATABASE="${DB_DATABASE:-portal_prod}"
DB_PORT="${DB_PORT:-3306}"
HTTP_PORT="${HTTP_PORT:-8080}"
GH_APP_ID="${GH_APP_ID:-0}"
GH_INSTALLATION_ID="${GH_INSTALLATION_ID:-0}"
GH_REPO_OWNER="${GH_REPO_OWNER:-changeme-owner}"
GH_REPO_NAME="${GH_REPO_NAME:-changeme-repo}"
DISCORD_CLIENT_ID="${DISCORD_CLIENT_ID:-changeme-discord-client-id}"
DISCORD_CLIENT_SECRET="${DISCORD_CLIENT_SECRET:-$(random_base64 32)}"
SESSION_SECRET="${SESSION_SECRET:-$(random_base64 48)}"
DB_PASSWORD="${DB_PASSWORD:-$(random_base64 32)}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-$(random_base64 32)}"

# Names must match docker-compose.prod.yml exactly.
upsert_secret db_host "$DB_HOST"
upsert_secret db_user "$DB_USER"
upsert_secret db_database "$DB_DATABASE"
upsert_secret db_password "$DB_PASSWORD"
upsert_secret db_root_password "$DB_ROOT_PASSWORD"
upsert_secret db_port "$DB_PORT"
upsert_secret http_port "$HTTP_PORT"
upsert_secret gh_app_id "$GH_APP_ID"
upsert_secret gh_installation_id "$GH_INSTALLATION_ID"
upsert_secret gh_repo_owner "$GH_REPO_OWNER"
upsert_secret gh_repo_name "$GH_REPO_NAME"
upsert_secret discord_client_id "$DISCORD_CLIENT_ID"
upsert_secret discord_client_secret "$DISCORD_CLIENT_SECRET"
upsert_secret session_secret "$SESSION_SECRET"

echo "All production secrets are ready."
