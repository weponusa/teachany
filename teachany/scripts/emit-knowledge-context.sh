#!/usr/bin/env bash
# Emit knowledge-context.json for a courseware directory.
# Usage: ./scripts/emit-knowledge-context.sh <node_id> [course_dir]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_ID="${1:?node_id required}"
COURSE_DIR="${2:-$ROOT/community/$NODE_ID}"
OUT="$COURSE_DIR/knowledge-context.json"
cd "$ROOT"
python3 scripts/knowledge_layer.py lookup \
  --node-id "$NODE_ID" \
  --emit-kcp "$OUT"
echo "Wrote $OUT"
