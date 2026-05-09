#!/bin/bash

set -e

echo "🔧 Fixing DCO Sign-off & Signatures for OpenMCP Branches"
echo ""

BRANCHES=(
    "feat/add_skills"
    "feat/copy-namespace-button-redesign"
    "feat/project-wizard-yaml-preview"
    "feat/project_delete"
    "feat/rename-control-plane-labels"
    "feat/restructure-project-page"
    "feature/amazing-splash-screen"
    "pr-534"
    "feat/revamped_project_view"
)

CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
echo ""

for BRANCH in "${BRANCHES[@]}"; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Processing: $BRANCH"

    # Check if branch exists
    if ! git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
        echo "⚠️  Branch $BRANCH does not exist, skipping"
        continue
    fi

    # Checkout branch
    echo "  → Checking out branch..."
    git checkout "$BRANCH" -q

    # Find base commit (usually main or ecb5231)
    BASE_COMMIT=$(git merge-base main HEAD 2>/dev/null || echo "ecb5231")

    # Check if there are commits to fix
    COMMITS_COUNT=$(git rev-list ${BASE_COMMIT}..HEAD --count)

    if [ "$COMMITS_COUNT" -eq 0 ]; then
        echo "  ✓ No commits to fix"
        continue
    fi

    echo "  → Found $COMMITS_COUNT commits to fix"
    echo "  → Rebasing from $BASE_COMMIT..."

    # Rebase with sign-off and signature
    if git rebase --signoff --exec 'git commit --amend --no-edit -S' "$BASE_COMMIT" 2>&1 | grep -v "^Rebasing"; then
        echo "  ✓ Successfully fixed $BRANCH"
    else
        echo "  ❌ Failed to rebase $BRANCH"
        echo "  → Aborting rebase..."
        git rebase --abort 2>/dev/null || true
        continue
    fi

    # Verify last commit has signature
    if git verify-commit HEAD 2>&1 | grep -q "Good"; then
        echo "  ✓ Verified: Commits are signed"
    else
        echo "  ⚠️  Warning: Signature verification failed"
    fi

    # Verify DCO sign-off
    if git log -1 --pretty=format:%B | grep -q "Signed-off-by:"; then
        echo "  ✓ Verified: DCO sign-off present"
    else
        echo "  ⚠️  Warning: DCO sign-off not found"
    fi

    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All branches processed"
echo ""
echo "Returning to: $CURRENT_BRANCH"
git checkout "$CURRENT_BRANCH" -q
echo ""
echo "📋 Next steps:"
echo "  1. Review the changes"
echo "  2. Force push branches that were updated:"
echo "     git push --force-with-lease origin <branch-name>"
echo ""
echo "⚠️  Note: These are force pushes. Make sure no one else is working on these branches!"
echo ""
