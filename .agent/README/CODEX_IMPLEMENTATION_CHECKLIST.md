# Codex Implementation Checklist

**Status**: Ready for Implementation  
**Estimated Time**: 20 minutes  
**Difficulty**: Easy

---

## ✅ Phase 1: Installation (5 minutes)

- [ ] Open terminal/PowerShell
- [ ] Run: `npm install -g @openai/codex`
- [ ] Verify: `codex --version`
- [ ] Create directory: `mkdir -p ~/.codex`
- [ ] Confirm: Directory created successfully

---

## ✅ Phase 2: Configuration (5 minutes)

- [ ] Copy template: `cp codex.config.toml.example ~/.codex/config.toml`
- [ ] Open config file in editor
- [ ] Add GitHub PAT (if using GitHub MCP)
- [ ] Review STDIO servers section
- [ ] Review HTTP servers section
- [ ] Save config file
- [ ] Verify: File saved to correct location

---

## ✅ Phase 3: Add MCP Servers (5 minutes)

- [ ] Add Context7: `codex mcp add context7 -- npx -y @upstash/context7-mcp`
- [ ] Add GitHub: `codex mcp add github -- npx -y @modelcontextprotocol/server-github`
- [ ] Add Playwright: `codex mcp add playwright -- npx -y @executeautomation/playwright-mcp-server`
- [ ] Add Chrome: `codex mcp add chrome -- npx -y chrome-devtools-mcp@latest`
- [ ] List MCPs: `codex mcp list`
- [ ] Verify: All 4 MCPs listed

---

## ✅ Phase 4: Testing (3 minutes)

- [ ] Launch Codex: `codex`
- [ ] Wait for TUI to load
- [ ] Run: `/mcp` (view connected servers)
- [ ] Verify: All MCPs connected
- [ ] Test prompt: `"hello"`
- [ ] Verify: Response received
- [ ] Exit: `Ctrl+C` or `/exit`

---

## ✅ Phase 5: Integration (2 minutes)

- [ ] Create project-specific profile (optional)
- [ ] Document custom MCPs (if added)
- [ ] Add to team wiki/docs
- [ ] Share config template with team
- [ ] Create team guidelines for usage

---

## 📋 Verification Steps

### Installation Verification
```bash
codex --version
# Should show version number
```

### Configuration Verification
```bash
# Check config file exists
ls ~/.codex/config.toml
# Should show file path
```

### MCP Verification
```bash
codex mcp list
# Should show all configured MCPs
```

### Functionality Verification
```bash
codex "Create a simple hello world component"
# Should generate code
```

---

## 🚀 First Commands to Try

```bash
# 1. Simple test
codex "hello"

# 2. Code generation
codex "Create a SvelteKit form component"

# 3. Bug fixing
codex "Fix the photo upload component"

# 4. Test generation
codex "Generate unit tests for the service"

# 5. Documentation
codex "Add JSDoc comments to the function"
```

---

## 📚 Documentation References

| Task | Document |
|------|----------|
| Quick start | `.agent/README/codex_quick_ref.md` |
| Full setup | `.agent/System/codex_setup.md` |
| MCP integration | `.agent/SOP/codex_mcp_integration.md` |
| Troubleshooting | `.agent/SOP/codex_mcp_integration.md` |
| Comparison | `.agent/System/codex_vs_context_engine.md` |

---

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Command not found | Run `npm install -g @openai/codex` |
| Config not found | Check path: `~/.codex/config.toml` |
| MCP not connecting | Run `codex mcp list` to verify |
| Timeout errors | Increase `startup_timeout_sec` in config |
| Auth failures | Verify GitHub PAT in config |

---

## ✅ Completion Checklist

- [ ] All 5 phases completed
- [ ] All verification steps passed
- [ ] First commands tested successfully
- [ ] Team notified of setup
- [ ] Documentation shared with team
- [ ] Ready for production use

---

**Status**: Ready to implement!  
**Next**: Follow Phase 1 above and work through each phase.

