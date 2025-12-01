# Codex Quick Reference

**Last Updated**: November 21, 2025

---

## 🚀 Installation (1 minute)

```bash
npm install -g @openai/codex
codex --version
```

---

## ⚙️ Configuration (2 minutes)

```bash
# Copy template
cp codex.config.toml.example ~/.codex/config.toml

# Edit config (add GitHub token if needed)
nano ~/.codex/config.toml
```

---

## 🔌 Add MCP Servers (2 minutes)

```bash
# Documentation
codex mcp add context7 -- npx -y @upstash/context7-mcp

# GitHub
codex mcp add github -- npx -y @modelcontextprotocol/server-github

# Browser automation
codex mcp add playwright -- npx -y @executeautomation/playwright-mcp-server

# Browser debugging
codex mcp add chrome -- npx -y chrome-devtools-mcp@latest
```

---

## 💻 Usage

### Interactive Mode
```bash
codex
# Then in TUI:
# /mcp - view servers
# /help - see commands
```

### Single Command
```bash
codex "Create a SvelteKit form component with validation"
```

### With Specific Model
```bash
codex --model o3 "your prompt"
```

---

## 🎯 Common Tasks

### Generate Code
```bash
codex "Generate a service for handling assessment approvals"
```

### Fix Bug
```bash
codex "Fix the photo upload component - images not displaying"
```

### Create Tests
```bash
codex "Generate unit tests for the additionals service"
```

### Refactor
```bash
codex "Refactor EstimateTab to use reactive pattern"
```

### Document
```bash
codex "Add JSDoc comments to assessment service"
```

---

## 📋 MCP Commands

```bash
codex mcp list              # View all MCPs
codex mcp add <name> -- <cmd>  # Add MCP
codex mcp remove <name>     # Remove MCP
```

---

## 🔧 Config Locations

- **Linux/Mac**: `~/.codex/config.toml`
- **Windows**: `%USERPROFILE%\.codex\config.toml`

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `codex_setup.md` | Full setup guide |
| `codex_research.md` | Research findings |
| `codex_mcp_integration.md` | Integration guide |
| `codex_vs_context_engine.md` | Comparison |

---

## ⚡ Pro Tips

✅ Use Context Engine first to understand code  
✅ Use Codex to generate solutions  
✅ Combine both for complex tasks  
✅ Test generated code before committing  
✅ Use `/mcp` in TUI to verify servers  

---

**Next**: `codex "hello"` to test your setup!

