# SOP: Codex Troubleshooting Guide

**Purpose**: Fix common Codex startup and runtime errors  
**Last Updated**: November 21, 2025

---

## ⚠️ Error: Failed to load c++ bson extension

### Symptoms
```
Failed to load c++ bson extension, using pure JS version
```

### Root Cause
- MongoDB BSON native extension not compiled for your platform
- Common on Windows/MINGW64 with Node.js version mismatch
- **This is NOT a critical error** - falls back to pure JS version

### Solution
✅ **This warning is safe to ignore** - Codex will work fine  
✅ The pure JS version is slower but fully functional

### Optional Fix (if you want to eliminate warning)
```bash
# Rebuild native modules
npm rebuild

# Or reinstall Codex
npm uninstall -g @openai/codex
npm install -g @openai/codex
```

---

## ⚠️ Error: Accessing non-existent property 'padLevels'

### Symptoms
```
(node:2692) Warning: Accessing non-existent property 'padLevels' 
of module exports inside circular dependency
```

### Root Cause
- Circular dependency in logging module
- Common in older versions of dependencies
- **This is NOT a critical error** - logging still works

### Solution
✅ **This warning is safe to ignore** - Codex will work fine  
✅ It's a known issue in Node.js ecosystem

### Optional Fix (if you want to eliminate warning)
```bash
# Update Node.js to latest LTS
node --version  # Check current version

# Update npm packages
npm update -g @openai/codex
```

---

## ⚠️ Error: MINGW64 Shell Issues

### Symptoms
- Codex hangs on login
- Codex doesn't respond to input
- Terminal freezes

### Root Cause
- MINGW64/Git Bash has compatibility issues with Codex CLI
- Works fine in Windows CMD or PowerShell

### Solution
✅ **Use PowerShell or CMD instead of MINGW64**

```bash
# Instead of Git Bash MINGW64, use:
# 1. Windows PowerShell
# 2. Windows CMD
# 3. Windows Terminal (recommended)
```

---

## ✅ Verified Working Setup

### On Windows with MINGW64
```bash
# These warnings are SAFE and expected:
# ✅ "Failed to load c++ bson extension" - OK
# ✅ "Accessing non-existent property 'padLevels'" - OK

# Codex will still work fine!
```

### Recommended: Use PowerShell Instead
```powershell
# Open PowerShell and run:
codex

# This avoids MINGW64 compatibility issues
```

---

## 🔧 Verification Steps

### Step 1: Check if Codex is actually running
```bash
# In MINGW64, despite warnings, try typing:
/help

# If you see help text, Codex is running!
```

### Step 2: Test with simple command
```bash
# Try a simple prompt:
"hello"

# If you get a response, Codex is working!
```

### Step 3: Check MCP servers
```bash
# View connected MCPs:
/mcp

# If you see servers listed, everything is working!
```

---

## 📋 Troubleshooting Checklist

- [ ] Warnings appear but Codex responds to commands
- [ ] `/help` shows help text
- [ ] `/mcp` shows connected servers
- [ ] Simple prompts generate responses
- [ ] MCP servers are accessible

If all above are ✅, **Codex is working correctly!**

---

## 🚀 Recommended Solution

### For Windows Users
**Use PowerShell instead of MINGW64**:

```powershell
# Open Windows PowerShell or Windows Terminal
# Then run:
codex

# This avoids all MINGW64 compatibility issues
```

### For MINGW64 Users
**Ignore the warnings** - they're harmless:

```bash
# In MINGW64, these warnings are expected:
# ✅ Failed to load c++ bson extension
# ✅ Accessing non-existent property 'padLevels'

# Codex will work fine despite warnings!
# Test with: /help or /mcp
```

---

## 📞 Support

- **Official Issues**: https://github.com/openai/codex/issues
- **Known MINGW64 Issue**: #6994 (login hangs)
- **Workaround**: Use PowerShell or CMD

---

**Status**: ✅ SAFE TO IGNORE - Codex is working correctly!

