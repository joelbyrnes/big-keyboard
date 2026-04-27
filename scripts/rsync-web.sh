#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Deploy web files via rsync over SSH.

Copies only:
  - index.html
  - styles.css
  - script.js

Usage:
  scripts/rsync-web.sh --dest user@host --path /remote/web/root [options]

Required:
  --dest   Remote SSH destination in form user@host (or host)
  --path   Remote directory path to sync into (e.g. /var/www/site)

Options:
  --key FILE        SSH private key to use (passed to ssh -i)
  --port PORT       SSH port (default: 22)
  --dry-run         Print what would change, but do not upload
  --delete          Delete remote files not present locally (opt-in)
  -h, --help        Show help

Notes:
  - If you omit --key, SSH will use your normal agent/config and may prompt
    for a password or key passphrase as needed.
  - For non-interactive password auth you would need sshpass, but this script
    intentionally stays interactive and dependency-free.
EOF
}

DEST=""
REMOTE_PATH=""
SSH_KEY=""
SSH_PORT="22"
DRY_RUN="0"
DO_DELETE="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dest)
      DEST="${2:-}"; shift 2 ;;
    --path)
      REMOTE_PATH="${2:-}"; shift 2 ;;
    --key)
      SSH_KEY="${2:-}"; shift 2 ;;
    --port)
      SSH_PORT="${2:-}"; shift 2 ;;
    --dry-run)
      DRY_RUN="1"; shift ;;
    --delete)
      DO_DELETE="1"; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      echo >&2
      usage >&2
      exit 2 ;;
  esac
done

if [[ -z "$DEST" || -z "$REMOTE_PATH" ]]; then
  echo "Missing required arguments." >&2
  echo >&2
  usage >&2
  exit 2
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required but was not found in PATH." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

SSH_CMD=(ssh -p "$SSH_PORT")
if [[ -n "$SSH_KEY" ]]; then
  if [[ ! -f "$SSH_KEY" ]]; then
    echo "SSH key not found: $SSH_KEY" >&2
    exit 2
  fi
  SSH_CMD+=(-i "$SSH_KEY")
fi

RSYNC_ARGS=(
  -avz
  --human-readable
  --progress
  --recursive
  --times
  --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r
  --exclude ".git/"
  --exclude "scripts/"
  --exclude "README.md"
  --include "index.html"
  --include "styles.css"
  --include "script.js"
  --exclude "*"
)

if [[ "$DO_DELETE" == "1" ]]; then
  RSYNC_ARGS+=(--delete)
fi
if [[ "$DRY_RUN" == "1" ]]; then
  RSYNC_ARGS+=(--dry-run)
fi

SRC="${PROJECT_ROOT}/"
DEST_SPEC="${DEST}:${REMOTE_PATH%/}/"

echo "Syncing:"
echo "  from: ${SRC}"
echo "  to:   ${DEST_SPEC}"
echo

rsync "${RSYNC_ARGS[@]}" -e "${SSH_CMD[*]}" "$SRC" "$DEST_SPEC"
