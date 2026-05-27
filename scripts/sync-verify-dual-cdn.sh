#!/usr/bin/env bash
# Verify GitHub Pages and CloudBase serve identical bytes for key artifacts.
# Exit 0 = in sync. Exit 1 = drift (CloudBase older or different content).
set -euo pipefail

GH_CW="${GH_COURSEWARE_BASE:-https://weponusa.github.io/teachany-courseware}"
GH_MAIN="${GH_MAIN_BASE:-https://weponusa.github.io/teachany}"
CB_BASE="${CB_BASE:-https://ai-native-d8g706ji7cd5f763c-1327165012.tcloudbaseapp.com}"
CB_CW="$CB_BASE/teachany-courseware"
CB_MAIN="$CB_BASE/teachany"

OFFICIAL_IDS=(
  bio-photosynthesis chem-h-aluminum-compounds chem-oxidation-reduction
  chem-ib-dp-periodic-table chem-daily-life chem-periodic-table chn-compound-vowel
  geo-monsoon hist-classical-civilization hist-m-silk-road history-sanguo-sui-tang
  imperial-unification history-industrial-revolution math-linear-function
  math-quadratic-function phy-m-light-reflection phy-ohms-law teachany-phy-mid-pressure
  sci-e-sound
)

FILES=(
  community/index.json
  registry.json
  courseware-registry.json
)

for id in "${OFFICIAL_IDS[@]}"; do
  FILES+=("community/$id/index.html")
done

MAIN_FILES=(
  index.html
  scripts/unified-loader.js
  registry.json
)

hash_url() {
  curl -fsSL "$1" | shasum -a 256 | awk '{print $1}'
}

head_lm() {
  curl -fsSI "$1" 2>/dev/null | awk -F': ' 'tolower($1)=="last-modified"{print $2}' | tr -d '\r'
}

fail=0
checked=0

check_pair() {
  local label="$1" gh_url="$2" cb_url="$3"
  checked=$((checked + 1))
  local gh_hash cb_hash
  gh_hash=$(hash_url "$gh_url") || { echo "❌ $label — GitHub fetch failed: $gh_url"; fail=1; return; }
  cb_hash=$(hash_url "$cb_url") || { echo "❌ $label — CloudBase fetch failed: $cb_url"; fail=1; return; }
  if [[ "$gh_hash" == "$cb_hash" ]]; then
    echo "✅ $label"
  else
    local gh_lm cb_lm
    gh_lm=$(head_lm "$gh_url")
    cb_lm=$(head_lm "$cb_url")
    echo "❌ DRIFT $label"
    echo "   GitHub:    $gh_hash  ($gh_lm)"
    echo "   CloudBase: $cb_hash  ($cb_lm)"
    echo "   → 以较新的 GitHub / main 构建产物为准，重新 deploy CloudBase"
    fail=1
  fi
}

echo "=== Dual CDN sync verify ==="
echo "GitHub courseware: $GH_CW"
echo "CloudBase:         $CB_CW"
echo ""

for f in "${FILES[@]}"; do
  check_pair "courseware/$f" "$GH_CW/$f" "$CB_CW/$f"
done

for f in "${MAIN_FILES[@]}"; do
  check_pair "teachany/$f" "$GH_MAIN/$f" "$CB_MAIN/$f"
done

echo ""
if [[ $fail -eq 0 ]]; then
  echo "🎉 $checked checks passed — GitHub 与 CloudBase 内容一致"
else
  echo "⚠️  $checked checks, drift detected — run: bash scripts/build-cloudbase-dist.sh && tcb hosting deploy dist/cloudbase -e ai-native-d8g706ji7cd5f763c"
  exit 1
fi
