## ⚡ Quick Reference: DCO & Commit Signing

### ✅ Setup Complete
Your local git is now configured for OpenMCP compliance.

### 🔑 Add SSH Key to GitHub (Required!)
1. Your key is copied to clipboard, or run:
   ```bash
   cat ~/.ssh/id_ed25519.pub | pbcopy
   ```

2. Go to: https://github.com/settings/keys

3. Click "New SSH Key"
   - **Title**: "MacBook Signing Key"
   - **Key type**: **Signing Key** ⚠️ (NOT Authentication Key!)
   - **Key**: Paste from clipboard
   - Click "Add SSH key"

### 📝 Daily Usage

All new commits automatically get:
- ✅ SSH signature (verified badge on GitHub)
- ✅ DCO sign-off (`Signed-off-by` trailer)

Just commit normally:
```bash
git commit -m "feat: my change"
```

### 🔧 Fix Existing Commits

**Add DCO to last commit:**
```bash
git commit --amend --signoff --no-edit
```

**Fix all commits in branch:**
```bash
git rebase --signoff --exec 'git commit --amend --no-edit -S' main
```

### ✓ Verify

**Check last commit:**
```bash
git log -1 --show-signature --pretty=format:"%B"
```

Should show:
- "Good 'git' signature..."
- "Signed-off-by: Your Name <your.email@sap.com>"

### 🆘 Troubleshooting

**"gpg failed to sign"**
```bash
git config --global user.signingkey ~/.ssh/id_ed25519.pub
ssh-add -l  # Verify SSH agent
```

**Sign-off not added**
```bash
ls -la .git/hooks/prepare-commit-msg  # Check exists
git commit -s -m "test"  # Manual sign-off
```

**Not showing as Verified on GitHub**
- Did you add key as "Signing Key" type? (not Authentication)
- Wait a few minutes after pushing
- Check key is still active on GitHub

### 📚 Full Documentation
- `.github/DCO_SETUP.md` - Complete setup guide
- Setup script: `./scripts/setup-dco-signing.sh`
