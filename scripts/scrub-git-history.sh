#!/usr/bin/env bash
# ==============================================================================
# Git History Secret Scrubbing Utility for PrepLoop
# Target Commit: dc71871221b848a720397f8454c3fb95936e7959
# Target Secret: 10042001@Sb (Razorpay Webhook Secret in scripts/test-webhook.js)
# ==============================================================================

set -euo pipefail

echo "================================================================="
echo "🔒 PREPLOOP GIT HISTORY SECRET SCRUBBER"
echo "================================================================="

# Create temporary replacement mapping file
TEMP_REPLACE_FILE=$(mktemp)
cat << 'EOF' > "$TEMP_REPLACE_FILE"
10042001@Sb==>REDACTED_WEBHOOK_SECRET
EOF

echo "Scrubbing pattern: 10042001@Sb across all branches and tags..."

if command -v git-filter-repo >/dev/null 2>&1; then
    echo "Using git-filter-repo (recommended)..."
    git filter-repo --replace-text "$TEMP_REPLACE_FILE" --force
elif command -v bfg >/dev/null 2>&1; then
    echo "Using BFG Repo-Cleaner..."
    echo "10042001@Sb" > bfg-passwords.txt
    bfg --replace-text bfg-passwords.txt
    rm -f bfg-passwords.txt
    git reflog expire --expire=now --all && git gc --prune=now --aggressive
else
    echo "Falling back to native git filter-branch..."
    git filter-branch --force --tree-filter "
        if [ -f scripts/test-webhook.js ]; then
            sed -i 's/10042001@Sb/process.env.RAZORPAY_WEBHOOK_SECRET/g' scripts/test-webhook.js 2>/dev/null || true
        fi
    " --tag-name-filter cat -- --all
fi

rm -f "$TEMP_REPLACE_FILE"

echo "Scrub complete."
echo "CRITICAL POST-SCRUB ACTIONS REQUIRED:"
echo "1. Run: git push origin --force --all"
echo "2. Run: git push origin --force --tags"
echo "3. Rotate RAZORPAY_WEBHOOK_SECRET in Razorpay Merchant Dashboard immediately."
