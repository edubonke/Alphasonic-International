#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-/workspaces/Alphasonic-International}"
PATCH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$REPO"

echo "Repository: $(git rev-parse --show-toplevel)"
git fetch origin --prune
git pull --ff-only origin main

mkdir -p assets/optimized
cp -f "$PATCH_DIR/index.html" ./index.html
cp -f "$PATCH_DIR"/assets/optimized/*.webp ./assets/optimized/

echo
echo "Optimized assets:"
du -h assets/optimized/* | sort -h

echo
echo "Git changes:"
git status --short

git add index.html assets/optimized
git commit -m "Optimize website images for faster page loading"
git push origin main

echo
echo "Performance optimization pushed successfully."
