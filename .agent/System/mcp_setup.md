# MCP (Model Context Protocol) Setup

This document describes the MCP servers configured for ClaimTech development with Claude Code.

## What is MCP?

Model Context Protocol (MCP) is a standard for connecting AI assistants to external tools and services. It allows Claude to directly interact with platforms like Supabase, GitHub, and development tools.

---

## Configured MCP Servers

### Location
**Config File**: `C:\Users\Jcvdm\AppData\Roaming\Claude\claude_desktop_config.json`

### Active Servers

#### 1. Supabase MCP
**Purpose**: Direct database access and management

```json
"supabase": {
  "url": "https://mcp.supabase.com/mcp"
}
```

**Capabilities**:
- Query database directly
- Get schema information
- Verify RLS policies
- Manage tables and migrations
- Fetch project configuration

**Authentication**: OAuth (credentials stored in `~/.claude/.credentials.json`)

**Use Cases**:
- Verify Supabase skill documentation against actual database
- Query data during development
- Check RLS policy implementations
- Explore database schema

---

#### 2. GitHub MCP
**Purpose**: GitHub repository interactions

```json
"github": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "***"
  }
}
```

**Capabilities**:
- Create issues and PRs
- Search code
- Read repository contents
- Manage branches

---

#### 3. Playwright MCP
**Purpose**: Browser automation and testing

```json
"@executeautomation-playwright-mcp-server": {
  "command": "npx",
  "args": ["-y", "@executeautomation/playwright-mcp-server"]
}
```

**Capabilities**:
- Run E2E tests
- Browser automation
- Screenshot capture

---

#### 4. Svelte MCP
**Purpose**: Svelte/SvelteKit development assistance

```json
"svelte": {
  "command": "npx",
  "args": ["-y", "@executeautomation/svelte-mcp-server"]
}
```

**Capabilities**:
- Svelte component patterns
- SvelteKit routing assistance
- Framework best practices

---

#### 5. Chrome DevTools MCP
**Purpose**: Browser debugging

```json
"chrome-devtools-mcp": {
  "command": "npx",
  "args": ["-y", "chrome-devtools-mcp@latest"]
}
```

---

#### 6. Context7 MCP
**Purpose**: Context management with Upstash

```json
"context7": {
  "command": "npx",
  "args": ["-y", "@upstash/context7-mcp"]
}
```

---

## Enhanced MCP Servers (Recommended Additions)

#### 7. Files MCP
**Purpose**: Enhanced code navigation and file operations

```json
"files": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-files"],
  "env": {
    "ALLOWED_DIRECTORIES": "C:\\Users\\Jcvdm\\Desktop\\Jaco\\Programming\\sites\\Claimtech"
  }
}
```

**Capabilities**:
- Quick file search and navigation
- Surgical code editing
- Symbol finding across codebase
- Safe file operations with directory restrictions

**Use Cases**:
- Find and edit code with precision
- Navigate large codebases efficiently
- Locate symbols across multiple files

---

#### 8. SQLite MCP
**Purpose**: Local database testing and development

```json
"sqlite": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sqlite", "--db-path", "./dev.db"]
}
```

**Capabilities**:
- Local database operations
- Development testing
- Schema exploration
- Query execution

**Use Cases**:
- Test database operations locally
- Prototype schema changes
- Development database management

---

#### 9. Memory-Plus MCP
**Purpose**: Persistent AI memory across sessions

```json
"memory-plus": {
  "command": "npx",
  "args": ["-y", "memory-plus-mcp"]
}
```

**Capabilities**:
- Store persistent memories
- Cross-session context retention
- RAG-based memory retrieval
- Perfect for multiple AI coders

**Use Cases**:
- Remember project context across sessions
- Store important decisions and patterns
- Maintain continuity with multiple AI assistants

---

#### 10. Time MCP
**Purpose**: Time and date utilities

```json
"time": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-time"]
}
```

**Capabilities**:
- Natural language time parsing
- Timezone conversions
- Date calculations
- Multiple format support

**Use Cases**:
- Handle time-based calculations
- Convert between timezones
- Parse natural language dates

---

#### 11. Calculator MCP
**Purpose**: Precise numerical calculations

```json
"calculator": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-calculator"]
}
```

**Capabilities**:
- Mathematical calculations
- Precise numerical operations
- Complex expressions
- Scientific calculations

**Use Cases**:
- Perform precise calculations
- Handle complex mathematical operations
- Avoid floating-point errors

---

#### 12. Brave Search MCP
**Purpose**: Web search capabilities

```json
"brave-search": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-brave-search"],
  "env": {
    "BRAVE_API_KEY": "your-brave-api-key-here"
  }
}
```

**Capabilities**:
- Web search functionality
- Real-time information retrieval
- Search result analysis
- Privacy-focused search

**Use Cases**:
- Research latest technologies
- Find documentation and examples
- Get real-time information

---

## Code Execution Pattern (Preferred)

### Overview

ClaimTech uses MCP servers as **code APIs** rather than individual tool calls. This MCP-as-Code-API pattern provides 88-98% token reduction for multi-step workflows while enabling sophisticated data processing.

### Why Code Execution?

**Traditional Tool Chaining** (Inefficient):
```
User: "Analyze assessment completion times by stage"

Claude: → Call mcp__supabase__list_tables (500 tokens)
        → Call mcp__supabase__execute_sql for assessments (500 tokens)
        → Call mcp__supabase__execute_sql for stage_history (500 tokens)
        → Process in conversation context (1000 tokens)
        → Format response (500 tokens)

Total: ~3000 tokens, 5 API calls, 30+ seconds
```

**Code Execution Pattern** (Efficient):
```
User: "Analyze assessment completion times by stage"

Claude: → Write TypeScript code (200 tokens)
        → Execute via code executor (100 tokens)
        → Return formatted results (50 tokens)

Total: ~350 tokens, 1 execution, 5 seconds
88% reduction in token usage
```

### When to Use Code Execution

Use code execution when you need:

1. **Multiple data transformations** - Fetch → filter → map → aggregate → format
2. **Complex filtering/aggregation** - Custom calculations, statistical analysis
3. **Batch processing** - Update 10+ records, process 100+ files
4. **Data analysis** - Averages, percentages, correlations
5. **Multi-step workflows** - Conditional logic, retry logic, validation
6. **Report generation** - Markdown/HTML output, charts, summaries

Use direct tool calls when:

1. **Single operation** - Create one file, read one record
2. **Simple CRUD** - Update one record without complex logic
3. **Immediate feedback** - Streaming responses needed

### Quick Example

```typescript
import { executeSQL } from '/servers/supabase/database';

const projectId = process.env.SUPABASE_PROJECT_ID!;

// Fetch data
const assessments = await executeSQL({
  projectId,
  query: `
    SELECT id, stage, created_at, stage_history
    FROM assessments
    WHERE stage IN ('completed', 'archived')
      AND created_at >= NOW() - INTERVAL '30 days'
  `
});

// Transform and analyze
const stageStats = assessments.reduce((acc, a) => {
  const history = JSON.parse(a.stage_history || '[]');
  // ... calculate stage durations ...
  return acc;
}, {});

// Return formatted results
console.log(JSON.stringify(stageStats, null, 2));
```

### Benefits

- **88-98% token reduction** vs tool chaining
- **Single execution** instead of 5-10+ tool calls
- **Complex TypeScript logic** in isolated execution context
- **Access to all 6 MCP servers** as code APIs
- **Type-safe** operations with full TypeScript support
- **Error handling** in familiar programming patterns

### Documentation

For comprehensive guides and patterns:

- **[Using Code Executor](../../.agent/SOP/using_code_executor.md)** (500+ lines) - Step-by-step workflow guide
- **[Code Execution Architecture](./code_execution_architecture.md)** (800+ lines) - Architecture and token efficiency
- **[Code Execution Patterns](./code_execution_patterns.md)** (600+ lines) - 6 real-world patterns
- **[MCP Code API Reference](./mcp_code_api_reference.md)** (1,200+ lines) - Complete API for all 6 servers

---

## Using Supabase MCP

### After Setup

**IMPORTANT**: Restart Claude Desktop completely (quit and reopen) for the MCP server to load.

### Available Tools

Once configured, you'll have access to MCP tools like:
- `mcp__supabase__query` - Execute SQL queries
- `mcp__supabase__getTables` - List all tables
- `mcp__supabase__getSchema` - Get schema information
- `mcp__supabase__getPolicies` - View RLS policies
- And more...

### Example Usage

Ask Claude:
- "Show me all tables in the Supabase database"
- "Query the assessments table to verify the schema"
- "Check the RLS policies on the requests table"
- "Verify that the service patterns in the skill match the actual database"

---

## MCP Server Types

### Cloud-Hosted (URL-based)
Example: Supabase MCP

```json
"server-name": {
  "url": "https://mcp-server-url.com"
}
```

**Characteristics**:
- Hosted remotely
- Uses OAuth or token authentication
- No local installation needed

### NPM Package (Command-based)
Example: GitHub, Playwright, Svelte

```json
"server-name": {
  "command": "npx",
  "args": ["-y", "package-name"],
  "env": {
    "ENV_VAR": "value"
  }
}
```

**Characteristics**:
- Runs locally via npx
- Can use environment variables
- Downloaded on-demand

---

## Troubleshooting

### MCP Server Not Appearing

**Solution 1**: Restart Claude Desktop
1. Quit Claude Desktop completely
2. Reopen Claude Desktop
3. Check for MCP tools in chat

**Solution 2**: Verify Config Syntax
```bash
# Check JSON is valid
cat "$APPDATA/Claude/claude_desktop_config.json" | jq .
```

**Solution 3**: Check OAuth Credentials
```bash
# OAuth creds should be in this file
cat ~/.claude/.credentials.json
```

### Supabase MCP Authentication Issues

1. OAuth credentials should already be in `~/.claude/.credentials.json`
2. If missing, Claude will prompt for login on first use
3. Make sure you're logged into Supabase in your browser

### Testing MCP Connection

Ask Claude: "What MCP tools do you have available?"

You should see tools prefixed with `mcp__supabase__` in the response.

---

## Security Considerations

### Supabase MCP Security

⚠️ **IMPORTANT**: Supabase MCP is designed for **development and testing only**.

**Best Practices**:
1. Never connect to production databases
2. Use read-only mode when possible
3. Project scoping limits access to specific projects
4. OAuth provides secure authentication

### Token Storage

- GitHub token stored in config file (environment variable)
- Supabase OAuth tokens stored in `~/.claude/.credentials.json`
- Never commit config files with tokens to git

---

## Adding New MCP Servers

### Steps

1. Find the MCP server package or URL
2. Add entry to `claude_desktop_config.json`
3. Use appropriate format (URL-based or command-based)
4. Add environment variables if needed
5. Restart Claude Desktop
6. Test the connection

### Example: Adding a New MCP Server

```json
{
  "mcpServers": {
    "new-server": {
      "command": "npx",
      "args": ["-y", "@org/new-mcp-server"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

---

## Related Documentation

- [Supabase Development Skill](../../.claude/skills/supabase-development/SKILL.md) - Supabase patterns and templates
- [Project Architecture](./project_architecture.md) - Overall system architecture
- [Database Schema](./database_schema.md) - Complete database documentation
- [Code Execution Architecture](./code_execution_architecture.md) - MCP-as-Code-API pattern

---

**Last Updated**: November 9, 2025
**Maintained By**: ClaimTech Development Team
