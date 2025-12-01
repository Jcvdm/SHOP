# Task: Setup OpenAI Codex + MCP for ClaimTech

**Status**: READY FOR IMPLEMENTATION  
**Estimated Time**: 15-20 minutes  
**Difficulty**: Easy  
**Prerequisites**: Node.js 18+, npm, OpenAI API key or ChatGPT Plus

---

## 📋 Checklist

### Phase 1: Installation (5 min)
- [ ] Install Codex CLI globally: `npm install -g @openai/codex`
- [ ] Verify installation: `codex --version`
- [ ] Create config directory: `mkdir -p ~/.codex`

### Phase 2: Configuration (5 min)
- [ ] Copy config template: `cp codex.config.toml.example ~/.codex/config.toml`
- [ ] Add GitHub PAT to config (if using GitHub MCP)
- [ ] Verify config syntax: `codex config validate`

### Phase 3: MCP Setup (5 min)
- [ ] Add Context7: `codex mcp add context7 -- npx -y @upstash/context7-mcp`
- [ ] Add GitHub: `codex mcp add github -- npx -y @modelcontextprotocol/server-github`
- [ ] Add Playwright: `codex mcp add playwright -- npx -y @executeautomation/playwright-mcp-server`
- [ ] List MCPs: `codex mcp list`

### Phase 4: Testing (5 min)
- [ ] Launch Codex: `codex`
- [ ] In TUI, run: `/mcp` (view connected servers)
- [ ] Test simple prompt: `"hello"`
- [ ] Test with MCP: `"search github for recent commits"`

### Phase 5: Documentation (Optional)
- [ ] Create project-specific Codex profile
- [ ] Document custom MCP servers
- [ ] Add to team wiki/docs

---

## 🔧 Commands Reference

```bash
# Installation
npm install -g @openai/codex

# Launch
codex                          # Interactive TUI
codex "your prompt here"       # Single command

# MCP Management
codex mcp list                 # View all MCPs
codex mcp add <name> -- <cmd>  # Add MCP
codex mcp remove <name>        # Remove MCP

# Configuration
codex config validate          # Check config syntax
codex config show              # Display current config
```

---

## 📁 Files Created

- `~/.codex/config.toml` - Main configuration
- `codex.config.toml.example` - Template (in repo)
- `.agent/System/codex_setup.md` - Setup documentation
- `.agent/System/codex_research.md` - Research findings
- `.agent/SOP/codex_mcp_integration.md` - Integration guide

---

## 🚀 Next Steps

1. Follow Phase 1-4 checklist above
2. Test with: `codex "Create a SvelteKit form component"`
3. Integrate into development workflow
4. Document custom MCPs if added

---

## 📚 Related Documentation

- **Codex Setup**: `.agent/System/codex_setup.md`
- **Codex Research**: `.agent/System/codex_research.md`
- **MCP Integration**: `.agent/SOP/codex_mcp_integration.md`
- **MCP Setup**: `.agent/System/mcp_setup.md`

---

**Owner**: DevOps / AI Integration Team  
**Last Updated**: November 21, 2025

