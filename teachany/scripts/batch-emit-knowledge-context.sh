#!/usr/bin/env bash
# Batch emit knowledge-context.json (see batch-emit-knowledge-context.py).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
exec python3 scripts/batch-emit-knowledge-context.py "$@"
