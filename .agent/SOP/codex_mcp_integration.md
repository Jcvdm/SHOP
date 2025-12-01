# SOP: Codex + MCP Integration for ClaimTech

**Purpose**: Setup and use OpenAI Codex with Model Context Protocol servers  
**Audience**: Developers, DevOps, AI agents  
**Last Updated**: November 21, 2025

---

## 🎯 Quick Start (5 minutes)

### 1. Install Codex CLI
```bash
npm install -g @openai/codex
codex --version
```

### 2. Copy Config Template
```bash
# Copy example config to home directory
cp codex.config.toml.example ~/.codex/config.toml

# Edit with your GitHub token
nano ~/.codex/config.toml  # or use your editor
```

### 3. Add MCP Servers
```bash
# Add Context7 (documentation)
codex mcp add context7 -- npx -y @upstash/context7-mcp

# Add GitHub (repo management)
codex mcp add github -- npx -y @modelcontextprotocol/server-github

# Add Playwright (browser automation)
codex mcp add playwright -- npx -y @executeautomation/playwright-mcp-server
```

### 4. Verify Setup
```bash
codex mcp list
```

---

## 🚀 Usage Patterns

### Pattern 1: Code Generation with Context
```bash
codex "Create a SvelteKit page component for assessment details with form validation"
```

### Pattern 2: Using MCP Servers
```bash
# Codex will automatically use available MCPs
codex "Search GitHub for recent PRs and summarize changes"
```

### Pattern 3: Interactive Session
```bash
codex
# Then in TUI:
# /mcp - view connected servers
# /help - see all commands
```

---

## 🔧 Configuration Management

### Add New MCP Server
```bash
codex mcp add <name> -- <command>
```

### Remove MCP Server
```bash
codex mcp remove <name>
```

### Edit config.toml Directly
```bash
# Linux/Mac
nano ~/.codex/config.toml

# Windows
notepad %USERPROFILE%\.codex\config.toml
```

---

## 🔌 MCP Server Reference

| Server | Type | Use Case |
|--------|------|----------|
| context7 | STDIO | Access developer docs |
| github | STDIO | Manage repos/PRs |
| playwright | STDIO | Browser automation |
| chrome-devtools | STDIO | Browser debugging |
| supabase | HTTP | Database operations |

---

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| MCP not connecting | Check `codex mcp list`, verify command syntax |
| Timeout errors | Increase `startup_timeout_sec` in config |
| Auth failures | Verify env vars (GITHUB_PERSONAL_ACCESS_TOKEN) |
| Command not found | Run `npm install -g @openai/codex` |

---

## 📚 Related Docs

- **Codex Setup**: `.agent/System/codex_setup.md`
- **MCP Setup**: `.agent/System/mcp_setup.md`
- **Official Docs**: https://developers.openai.com/codex/

---

**Next**: Configure your GitHub token and test with `codex "hello"`

