#!/usr/bin/env bash
# One-time setup: create the labels used by sync-issues-to-ideas.yml
# Run from anywhere with: gh label create ... --repo The-Moody-Church/mp-charts

set -euo pipefail

REPO="The-Moody-Church/mp-charts"

echo "Creating labels on $REPO..."

gh label create "feature" \
  --repo "$REPO" \
  --description "New feature or capability" \
  --color "0E8A16" \
  --force

gh label create "improvement" \
  --repo "$REPO" \
  --description "Enhancement to existing functionality" \
  --color "1D76DB" \
  --force

gh label create "tech-debt" \
  --repo "$REPO" \
  --description "Technical debt, refactoring, or infrastructure" \
  --color "D93F0B" \
  --force

echo "Done. Labels created:"
gh label list --repo "$REPO" | grep -E "feature|improvement|tech-debt"
