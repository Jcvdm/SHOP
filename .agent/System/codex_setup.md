# OpenAI Codex Setup & Configuration

**Last Updated**: November 21, 2025  
**Status**: Research Complete - Ready for Implementation

---

## 🎯 What is Codex?

OpenAI Codex is a lightweight coding agent that:
- ✅ Runs in your terminal (CLI) or IDE (VSCode extension)
- ✅ Understands code context and generates solutions
- ✅ Integrates with Model Context Protocol (MCP) servers
- ✅ Available in ChatGPT Plus, Pro, Business, Edu, and Enterprise plans
- ✅ Included in ChatGPT Plus (June 2025+)

**Key Difference from GPT-4**: Codex is specifically optimized for code generation and understanding, with better performance on coding tasks than general-purpose models.

---

## 📦 Installation

### Prerequisites
- Node.js 18+ (for CLI)
- OpenAI API key or ChatGPT Plus subscription
- npm or yarn

### Install Codex CLI
```bash
npm install -g @openai/codex
# or
yarn global add @openai/codex
```

### Verify Installation
```bash
codex --version
codex --help
```

---

## 🔧 Configuration

### Config File Location
- **Linux/Mac**: `~/.codex/config.toml`
- **Windows**: `%USERPROFILE%\.codex\config.toml`

### Basic Setup
```bash
# Initialize config
codex init

# Launch interactive TUI
codex
```

---

## 🔌 MCP Integration

Codex supports Model Context Protocol servers for extended functionality.

### Supported MCP Types
1. **STDIO servers** - Local commands (e.g., `npx @upstash/context7-mcp`)
2. **HTTP servers** - Remote URLs with optional auth
3. **Environment variables** - For API keys and configuration

### Add MCP Server (CLI)
```bash
codex mcp add context7 -- npx -y @upstash/context7-mcp
codex mcp add github -- npx -y @modelcontextprotocol/server-github
```

### View Connected MCPs
```bash
# In Codex TUI, use:
/mcp
```

---

## 📋 Recommended MCPs for ClaimTech

| MCP | Purpose | Command |
|-----|---------|---------|
| **Context7** | Developer docs | `npx @upstash/context7-mcp` |
| **GitHub** | Repo management | `npx @modelcontextprotocol/server-github` |
| **Playwright** | Browser automation | `npx @executeautomation/playwright-mcp-server` |
| **Chrome DevTools** | Browser debugging | `npx chrome-devtools-mcp@latest` |
| **Supabase** | Database access | `https://mcp.supabase.com/mcp` |

---

## 🚀 Usage

### Terminal
```bash
codex "implement a login form with validation"
```

### VSCode Extension
- Install: OpenAI Codex extension
- Configure: Same `config.toml` file
- Use: Cmd+Shift+P → "Codex: Start Session"

---

## 📚 Related Documentation

- **MCP Setup**: `.agent/System/mcp_setup.md`
- **Official Docs**: https://developers.openai.com/codex/

---

**Next Steps**: Create `~/.codex/config.toml` with MCP servers configured for ClaimTech development.

