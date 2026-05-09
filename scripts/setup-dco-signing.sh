#!/bin/bash

set -e

echo "🔧 Setting up DCO Sign-off and Commit Signing for OpenMCP"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if this is an OpenMCP repository
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [[ ! "$REMOTE_URL" =~ "openmcp-project" ]]; then
    echo -e "${YELLOW}⚠${NC}  This repository is not part of openmcp-project organization"
    echo "DCO/signing setup is only required for OpenMCP repositories"
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

# Get user info
USER_NAME=$(git config --global user.name)
USER_EMAIL=$(git config --global user.email)

if [ -z "$USER_NAME" ] || [ -z "$USER_EMAIL" ]; then
    echo -e "${RED}❌ Git user.name and user.email must be configured${NC}"
    echo "Run: git config --global user.name 'Your Name'"
    echo "Run: git config --global user.email 'your.email@sap.com'"
    exit 1
fi

echo -e "${GREEN}✓${NC} Git user: $USER_NAME <$USER_EMAIL>"
echo ""

# Step 1: Configure SSH Commit Signing (LOCAL ONLY)
echo "📝 Step 1: Configuring SSH Commit Signing (Repo-Specific)"

# Check for SSH keys
SSH_KEY=""
if [ -f ~/.ssh/id_ed25519.pub ]; then
    SSH_KEY=~/.ssh/id_ed25519.pub
elif [ -f ~/.ssh/id_rsa.pub ]; then
    SSH_KEY=~/.ssh/id_rsa.pub
else
    echo -e "${RED}❌ No SSH key found${NC}"
    echo "Generate one with: ssh-keygen -t ed25519 -C '$USER_EMAIL'"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found SSH key: $SSH_KEY"

# Configure git for SSH signing (LOCAL ONLY - not global)
git config --local gpg.format ssh
git config --local user.signingkey "$SSH_KEY"
git config --local commit.gpgsign true
git config --local tag.gpgsign true

echo -e "${GREEN}✓${NC} Configured SSH signing for this repository only"

# Setup allowed signers
mkdir -p ~/.ssh
SIGNERS_FILE=~/.ssh/allowed_signers

# Add current key if not already present
KEY_CONTENT=$(cat "$SSH_KEY")
if ! grep -q "$KEY_CONTENT" "$SIGNERS_FILE" 2>/dev/null; then
    echo "$USER_EMAIL $KEY_CONTENT" >> "$SIGNERS_FILE"
    echo -e "${GREEN}✓${NC} Added key to allowed signers"
else
    echo -e "${GREEN}✓${NC} Key already in allowed signers"
fi

git config --global gpg.ssh.allowedSignersFile "$SIGNERS_FILE"
git config --local gpg.ssh.allowedSignersFile "$SIGNERS_FILE"

# Step 2: Setup DCO Hook (Local)
echo ""
echo "📝 Step 2: Setting up DCO Sign-off Hook (Local Repository)"

mkdir -p .git/hooks
cat > .git/hooks/prepare-commit-msg << 'HOOK_EOF'
#!/bin/bash

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Only add sign-off for regular commits (not merge, amend, etc.)
if [ -z "$COMMIT_SOURCE" ] || [ "$COMMIT_SOURCE" = "message" ]; then
    NAME=$(git config user.name)
    EMAIL=$(git config user.email)

    # Check if Signed-off-by is already present
    if ! grep -qs "^Signed-off-by: $NAME <$EMAIL>$" "$COMMIT_MSG_FILE"; then
        echo "" >> "$COMMIT_MSG_FILE"
        echo "Signed-off-by: $NAME <$EMAIL>" >> "$COMMIT_MSG_FILE"
    fi
fi
HOOK_EOF

chmod +x .git/hooks/prepare-commit-msg
echo -e "${GREEN}✓${NC} Created prepare-commit-msg hook for this repository"

# Step 3: Setup DCO Hook (Global)
echo ""
echo "📝 Step 3: Info about DCO Hook for Other OpenMCP Repos"

mkdir -p ~/.git-templates/hooks
cat > ~/.git-templates/hooks/prepare-commit-msg << 'HOOK_EOF'
#!/bin/bash

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Only apply to openmcp-project repositories
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [[ ! "$REMOTE_URL" =~ "openmcp-project" ]]; then
    exit 0
fi

if [ -z "$COMMIT_SOURCE" ] || [ "$COMMIT_SOURCE" = "message" ]; then
    NAME=$(git config user.name)
    EMAIL=$(git config user.email)

    if ! grep -qs "^Signed-off-by: $NAME <$EMAIL>$" "$COMMIT_MSG_FILE"; then
        echo "" >> "$COMMIT_MSG_FILE"
        echo "Signed-off-by: $NAME <$EMAIL>" >> "$COMMIT_MSG_FILE"
    fi
fi
HOOK_EOF

chmod +x ~/.git-templates/hooks/prepare-commit-msg

echo -e "${GREEN}✓${NC} Created conditional global git template (only for openmcp-project repos)"
echo -e "${YELLOW}ℹ${NC}  Run 'git init' in other OpenMCP repos to apply the hook"

# Step 4: Test
echo ""
echo "📝 Step 4: Testing Configuration"

# Test signing
TEST_FILE=".dco-test-$$"
echo "test" > "$TEST_FILE"
git add "$TEST_FILE" 2>/dev/null || true

if git commit -m "test: DCO setup verification" --no-verify 2>/dev/null; then
    # Check if commit is signed
    if git verify-commit HEAD 2>&1 | grep -q "Good"; then
        echo -e "${GREEN}✓${NC} Commit signing working"
    else
        echo -e "${YELLOW}⚠${NC}  Commit signing may need verification"
    fi

    # Check if sign-off was added
    if git log -1 --pretty=format:%B | grep -q "Signed-off-by: $USER_NAME <$USER_EMAIL>"; then
        echo -e "${GREEN}✓${NC} DCO sign-off working"
    else
        echo -e "${YELLOW}⚠${NC}  DCO sign-off may need manual verification"
    fi

    # Rollback test commit
    git reset --soft HEAD~1
    git reset HEAD "$TEST_FILE" 2>/dev/null || true
    rm -f "$TEST_FILE"
else
    rm -f "$TEST_FILE"
    echo -e "${YELLOW}⚠${NC}  Could not create test commit (this is okay)"
fi

# Step 5: Instructions
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup Complete (OpenMCP Repo Only)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Add your SSH public key to GitHub as a SIGNING KEY:"
echo "   ${YELLOW}https://github.com/settings/keys${NC}"
echo ""
echo "   Copy your key:"
echo "   ${YELLOW}cat $SSH_KEY | pbcopy${NC}"
echo ""
echo "   Then click 'New SSH Key' and select 'Signing Key' as the type"
echo ""
echo "2. For existing commits on current branch:"
echo "   ${YELLOW}git rebase --signoff --exec 'git commit --amend --no-edit -S' main${NC}"
echo ""
echo "3. For other OpenMCP repositories:"
echo "   ${YELLOW}cd /path/to/other/openmcp-repo && ./scripts/setup-dco-signing.sh${NC}"
echo "   ${YELLOW}# Or copy this script there and run it${NC}"
echo ""
echo "4. Verify your next commit shows 'Verified' badge on GitHub"
echo ""
echo "📖 Full documentation: .github/DCO_SETUP.md"
echo ""
echo "⚠️  Note: This setup is LOCAL to this repository only."
echo "   Other repos (non-OpenMCP) will not be affected."
echo ""
