# DCO Sign-off & Commit Signing Setup for OpenMCP

This guide helps you configure your local git to meet OpenMCP's requirements:
1. **DCO Sign-off**: Automatic `Signed-off-by` trailer on all commits
2. **Signed Commits**: SSH key signing for verified commits (green badge on GitHub)

## Prerequisites

- Git 2.34.0 or later (for SSH commit signing)
- SSH key pair (you already have: `id_ed25519`)

## Quick Setup

Run the setup script:

```bash
./scripts/setup-dco-signing.sh
```

Or follow the manual steps below.

## Manual Setup

### 1. Configure SSH Commit Signing

#### Step 1: Tell Git to use SSH for signing

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

#### Step 2: Add your SSH public key to GitHub

1. Copy your public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub | pbcopy
   ```

2. Go to GitHub Settings → SSH and GPG keys → New SSH Key:
   - **Title**: "Signing Key - MacBook"
   - **Key type**: **Signing Key** (important!)
   - **Key**: Paste your public key
   - Click "Add SSH key"

   URL: https://github.com/settings/keys

#### Step 3: Configure allowed signers (for verification)

```bash
# Create allowed signers file
mkdir -p ~/.ssh
echo "$(git config --global user.email) $(cat ~/.ssh/id_ed25519.pub)" >> ~/.ssh/allowed_signers

# Tell Git about it
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
```

### 2. Configure DCO Automatic Sign-off

Create a prepare-commit-msg hook to automatically add `Signed-off-by` to all commits:

```bash
# For this repository
mkdir -p .git/hooks
cat > .git/hooks/prepare-commit-msg << 'EOF'
#!/bin/bash

# Get the commit message file
COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Only add sign-off if this is not an amend, merge, or squash
if [ -z "$COMMIT_SOURCE" ] || [ "$COMMIT_SOURCE" = "message" ]; then
    # Get user name and email
    NAME=$(git config user.name)
    EMAIL=$(git config user.email)
    
    # Check if Signed-off-by is already present
    grep -qs "^Signed-off-by: $NAME <$EMAIL>$" "$COMMIT_MSG_FILE" || \
        echo -e "\nSigned-off-by: $NAME <$EMAIL>" >> "$COMMIT_MSG_FILE"
fi
EOF

chmod +x .git/hooks/prepare-commit-msg
```

### 3. Configure Globally (All Repositories)

To apply the DCO hook to all new repositories:

```bash
# Create global git hooks directory
mkdir -p ~/.git-templates/hooks

# Create the global prepare-commit-msg hook
cat > ~/.git-templates/hooks/prepare-commit-msg << 'EOF'
#!/bin/bash

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

if [ -z "$COMMIT_SOURCE" ] || [ "$COMMIT_SOURCE" = "message" ]; then
    NAME=$(git config user.name)
    EMAIL=$(git config user.email)
    
    grep -qs "^Signed-off-by: $NAME <$EMAIL>$" "$COMMIT_MSG_FILE" || \
        echo -e "\nSigned-off-by: $NAME <$EMAIL>" >> "$COMMIT_MSG_FILE"
fi
EOF

chmod +x ~/.git-templates/hooks/prepare-commit-msg

# Configure Git to use the template
git config --global init.templateDir ~/.git-templates
```

For existing repositories, run:
```bash
git init
```

## Verification

### Test Signed Commits

```bash
# Make a test commit
echo "test" > test.txt
git add test.txt
git commit -m "test: verify signing"

# Verify the signature
git verify-commit HEAD

# Check the log shows signature
git log --show-signature -1
```

You should see:
```
Good "git" signature for johannes.ott@sap.com with ED25519 key SHA256:...
```

### Test DCO Sign-off

```bash
git log -1 --pretty=format:%B
```

Should show:
```
test: verify signing

Signed-off-by: Johannes Ott <johannes.ott@sap.com>
```

### Check GitHub Verification

Push a commit and check on GitHub - you should see a green **Verified** badge next to the commit.

## Fixing Existing Commits

### Add Sign-off to Last Commit

```bash
git commit --amend --signoff --no-edit
```

### Add Sign-off to Multiple Commits (Interactive Rebase)

```bash
# Rebase last 5 commits
git rebase -i HEAD~5

# In the editor, change 'pick' to 'edit' for commits needing sign-off
# For each commit:
git commit --amend --signoff --no-edit
git rebase --continue
```

### Sign-off All Commits in a Branch

```bash
# From your feature branch
git rebase --signoff main
```

## Current Commits Status

To check your current branch commits for DCO compliance:

```bash
# Check which commits are missing sign-off
git log --pretty=format:"%h %s" main..HEAD | while read hash msg; do
  if ! git show $hash --pretty=format:%B | grep -q "Signed-off-by:"; then
    echo "Missing sign-off: $hash $msg"
  fi
done
```

## Troubleshooting

### "error: gpg failed to sign the data"

- Check SSH key path: `git config --global user.signingkey`
- Verify file exists: `ls -la ~/.ssh/id_ed25519.pub`
- Check SSH agent is running: `ssh-add -l`

### Sign-off not added automatically

- Check hook exists: `ls -la .git/hooks/prepare-commit-msg`
- Verify it's executable: `chmod +x .git/hooks/prepare-commit-msg`
- Test manually: `git commit -s -m "test"`

### Commits not showing as Verified on GitHub

1. Ensure you added the **Signing Key** (not Authentication Key) on GitHub
2. The key type must match your signing key (ED25519)
3. Wait a few minutes for GitHub to process

## References

- [DCO Bot GitHub App](https://github.com/apps/dco)
- [GitHub: Signing Commits with SSH](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)
- [SAP Handbook: Open Source Contribution Config](https://pages.github.tools.sap/cloud-orchestration/handbook/docs/develop/useful/open-source-contribution-config)
