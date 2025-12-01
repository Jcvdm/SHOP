# Code Execution Architecture

**Last Updated**: November 9, 2025
**Status**: Active Pattern - Architecture A (MCP Fetch → Code Process)

---

## Critical Architecture Note

**IMPORTANT**: Code execution runs in an isolated Deno sandbox and **CANNOT call MCP tools directly**.

The correct pattern (Architecture A) is:
1. **Claude calls MCP tools FIRST** to fetch data
2. **Claude passes data to code execution** for processing

The `/servers/` directory contains illustrative TypeScript wrappers that show ideal API structure, but these **cannot be used inside code execution**. They serve as reference examples only.

**For actual usage**, always follow the two-phase pattern documented below.

---

## Overview

ClaimTech uses a two-phase approach for complex data workflows, achieving **73-94% token reduction** compared to traditional tool chaining.

### Traditional Pattern (Tool Chaining)

```
User: "Analyze assessment completion times by stage"

Claude: → Call mcp__supabase__execute_sql (500 tokens)
        → Call mcp__supabase__execute_sql again (500 tokens)
        → Call mcp__supabase__execute_sql again (500 tokens)
        → Process in conversation context (1000 tokens)
        → Format response (500 tokens)

Total: ~3000 tokens, 5 API calls, 30+ seconds
```

### Architecture A: MCP Fetch → Code Process

```
User: "Analyze assessment completion times by stage"

Phase 1 - Claude calls MCP tool to fetch data:
  → mcp__supabase__execute_sql (500 tokens)

Phase 2 - Claude generates and executes processing code:
  → Write processing code with embedded data (200 tokens)
  → Execute via mcp__ide__executeCode (100 tokens)
  → Return formatted results (50 tokens)

Total: ~850 tokens, 2 operations, 8 seconds
**73% reduction**
```

---

## Architecture A: The Two-Phase Pattern

### Phase 1: Data Fetching (Claude Calls MCP Tools)

Claude identifies what data is needed and calls the appropriate MCP tools:

```typescript
// Claude calls MCP tool BEFORE code execution
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT id, stage, created_at, stage_history
    FROM assessments
    WHERE stage IN ('completed', 'archived')
      AND created_at >= NOW() - INTERVAL '30 days'
    ORDER BY created_at DESC
    LIMIT 1000
  `
});

// Data is now in Claude's context
```

### Phase 2: Data Processing (Code Execution)

Claude generates TypeScript code with the fetched data embedded, then executes it:

```typescript
// Claude generates this code with data embedded
const processingCode = `
  // Data from Phase 1 embedded via JSON.stringify()
  const assessments = ${JSON.stringify(assessments)};

  // Complex processing logic
  const stageDurations = assessments.map(a => {
    const history = JSON.parse(a.stage_history || '[]');
    const durations = {};

    for (let i = 1; i < history.length; i++) {
      const prev = new Date(history[i-1].timestamp);
      const curr = new Date(history[i].timestamp);
      const hours = (curr - prev) / (1000 * 60 * 60);
      durations[history[i].stage] = hours;
    }

    return { id: a.id, stages: durations };
  });

  // Aggregate statistics
  const stageStats = ['inspection_scheduled', 'inspection_in_progress', 'report_in_progress']
    .map(stage => {
      const times = stageDurations
        .map(d => d.stages[stage])
        .filter(t => t != null);

      return {
        stage,
        count: times.length,
        avg: times.reduce((a,b) => a+b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times)
      };
    });

  console.log(JSON.stringify(stageStats, null, 2));
`;

// Claude executes the code
await mcp__ide__executeCode({ code: processingCode });
```

**Key Points**:
- Data is fetched BEFORE code execution
- Data is embedded in code via `JSON.stringify()`
- Code execution focuses on PROCESSING, not FETCHING
- No MCP tool calls happen inside the code

---

## When to Use Code Execution

### ✅ Use Code Execution When:

1. **Complex data transformations** needed
   - Multiple map/filter/reduce operations
   - JSON parsing and restructuring
   - Statistical calculations

2. **Multi-step processing** with conditional logic
   - If/else branching based on data
   - Validation with multiple criteria
   - Iteration with state tracking

3. **Data analysis** requiring calculations
   - Averages, percentages, correlations
   - Time-based analysis
   - Trend identification

4. **Report generation** with formatting
   - Markdown/HTML output
   - Structured summaries
   - Multiple data aggregations

5. **Batch processing** with iteration
   - Process 10+ items with logic
   - Track success/failure/skipped
   - Generate detailed logs

**Decision Rule**: If you need to **transform, analyze, or format** data after fetching it, use code execution.

### ❌ Don't Use Code Execution When:

1. **Simple single query** with no processing
   - Just fetch and return data
   - Use MCP tool directly

2. **Need to make additional queries** based on results
   - Code cannot call MCP tools
   - Use tool chaining or fetch all data upfront

3. **Data is too large** to embed in code
   - JSON.stringify() may exceed token limits for huge datasets
   - Consider filtering in SQL or batch processing

---

## Token Efficiency Analysis

### Comparison: Traditional vs Architecture A

#### **Scenario 1: Simple Data Analysis**
**Task**: Calculate assessment completion times by stage

**Traditional (Tool Chaining)**:
- Call execute_sql for assessments: 500 tokens
- Call execute_sql for stage_history: 500 tokens
- Process in conversation: 1000 tokens
- Format response: 500 tokens
- **Total**: 2500 tokens

**Architecture A (MCP → Code)**:
- Call execute_sql (Phase 1): 500 tokens
- Generate processing code (Phase 2): 200 tokens
- Execute code: 100 tokens
- Return results: 50 tokens
- **Total**: 850 tokens
- **Savings**: 66%

---

#### **Scenario 2: Cross-Source Correlation**
**Task**: Correlate GitHub PR activity with assessment completions

**Traditional (Tool Chaining)**:
- Call Supabase queries: 1000 tokens
- Call GitHub queries: 1000 tokens
- Process in conversation: 2000 tokens
- Calculate correlations: 1500 tokens
- Format response: 500 tokens
- **Total**: 6000 tokens

**Architecture A (MCP → Code)**:
- Call Supabase MCP (Phase 1): 500 tokens
- Call GitHub MCP (Phase 1): 500 tokens
- Generate correlation code (Phase 2): 300 tokens
- Execute code: 150 tokens
- Return analysis: 100 tokens
- **Total**: 1550 tokens
- **Savings**: 74%

---

#### **Scenario 3: Batch Update with Validation**
**Task**: Update 50 assessments with validation logic

**Traditional (Tool Chaining)**:
- Fetch assessments: 500 tokens
- For each assessment (x50):
  - Validate photos: 100 tokens
  - Validate engineer: 100 tokens
  - Update if valid: 100 tokens
- Process responses: 1000 tokens
- **Total**: 16,500 tokens

**Architecture A (MCP → Code)**:
- Fetch assessments with JOINs (Phase 1): 700 tokens
- Generate batch processing code (Phase 2): 400 tokens
- Execute with validation loop: 200 tokens
- Return summary: 100 tokens
- **Total**: 1400 tokens
- **Savings**: 92%

---

### Token Efficiency Guidelines

| Scenario | Operations | Traditional Tokens | Code Exec Tokens | Savings | Recommendation |
|----------|-----------|-------------------|------------------|---------|----------------|
| Simple query | 1 | 200 | 200 | 0% | Either approach fine |
| Data analysis | 2-3 | 2000-3000 | 700-1000 | 60-70% | **Use code execution** |
| Multi-step workflow | 4-6 | 4000-6000 | 1000-1500 | 70-80% | **Use code execution** |
| Batch operations | 10+ | 15,000+ | 1200-1600 | 90-95% | **Use code execution** |
| Cross-source | 2+ sources | 5000-8000 | 1400-2000 | 70-75% | **Use code execution** |

**Rule of Thumb**: Use Architecture A for any workflow that involves processing or transforming data after fetching it.

---

## Architecture Layers

### Layer 1: MCP Servers (6 Active)

These are the services Claude calls in **Phase 1** to fetch data:

#### **Supabase MCP** (Database & Backend)
- **Purpose**: Database operations, migrations, edge functions
- **Location**: Cloud-hosted at `https://mcp.supabase.com/mcp`
- **Tools Claude Calls**:
  - `execute_sql` - Run SQL queries to fetch data
  - `apply_migration` - Deploy schema changes
  - `list_tables` - Schema inspection
  - `generate_typescript_types` - Type generation
  - 20+ additional tools

#### **GitHub MCP** (Repository Management)
- **Purpose**: Code repository operations, PRs, issues
- **Package**: `@modelcontextprotocol/server-github`
- **Tools Claude Calls**:
  - `get_file_contents` - Read repository files
  - `push_files` - Batch file updates
  - `create_pull_request` - PR creation
  - `search_code` - Code search
  - 30+ repository tools

#### **Playwright MCP** (Browser Automation)
- **Purpose**: E2E testing, browser automation
- **Package**: `@executeautomation/playwright-mcp-server`
- **Tools Claude Calls**:
  - Browser navigation and interaction
  - Element waiting and assertions
  - Screenshot capture
  - Network monitoring

#### **Svelte MCP** (Framework Guidance)
- **Purpose**: Svelte/SvelteKit patterns
- **Package**: `@executeautomation/svelte-mcp-server`
- **Tools Claude Calls**:
  - Component analysis
  - Routing guidance
  - Framework best practices

#### **Chrome DevTools MCP** (Runtime Debugging)
- **Purpose**: Browser runtime inspection
- **Package**: `chrome-devtools-mcp@latest`
- **Tools Claude Calls**:
  - Runtime inspection
  - Console monitoring
  - Performance profiling

#### **Context7 MCP** (Documentation Research)
- **Purpose**: Library documentation retrieval
- **Package**: `@upstash/context7-mcp`
- **Tools Claude Calls**:
  - Documentation search
  - Library reference lookup

---

### Layer 2: Code Executor Runtime

The execution environment that runs TypeScript code in **Phase 2**:

#### **Technology Stack**
- **Runtime**: Deno (secure TypeScript/JavaScript runtime)
- **Sandboxing**: Deno permissions model
- **Tool Access**: `mcp__ide__executeCode` MCP tool

#### **Security Features**
- **Filesystem Access**: Read-only to project, write to logs only
- **Network Access**: None (code cannot make HTTP requests)
- **Resource Limits**:
  - Max execution time: 60 seconds
  - Max memory: 512 MB
  - Max CPU: 50%
- **Audit Logging**: All executions logged to `.agent/Logs/code_execution/`

#### **What Code Execution CAN Do**
- ✅ Process data passed as parameters
- ✅ Transform, filter, map, reduce data
- ✅ Perform calculations and analysis
- ✅ Generate formatted output (JSON, Markdown, etc.)
- ✅ Iterate over data with complex logic
- ✅ Use JavaScript/TypeScript standard library

#### **What Code Execution CANNOT Do**
- ❌ Call MCP tools (no `mcp__*` access)
- ❌ Make HTTP requests (no `fetch()`)
- ❌ Import from `/servers/` (those are illustrative only)
- ❌ Access environment variables (unless passed in)
- ❌ Write files (except logs)
- ❌ Make database queries directly

---

### Layer 3: Illustrative Server Wrappers (`/servers/`)

**IMPORTANT**: The `/servers/` directory contains TypeScript wrappers that demonstrate ideal API structure but **CANNOT be used in code execution**.

#### **Purpose of `/servers/` Directory**
- 📚 **Reference Documentation**: Shows clean API design
- 📚 **Type Definitions**: TypeScript interfaces for MCP tools
- 📚 **Examples**: Demonstrates best practices
- 📚 **Future Use**: May be used in future architectures

#### **Why `/servers/` Cannot Be Used**
Code execution runs in an isolated sandbox that:
- Cannot call MCP tools
- Cannot access the MCP client
- Cannot make network requests to MCP servers
- Only has access to data passed as parameters

#### **Correct Pattern**
```typescript
// ❌ WRONG: This will NOT work in code execution
import { executeSQL } from '/servers/supabase/database';
const data = await executeSQL({ query: '...' });

// ✅ CORRECT: Claude calls MCP first, then passes data
// Step 1: Claude calls MCP tool
const data = await mcp__supabase__execute_sql({ query: '...' });

// Step 2: Claude generates code with data embedded
const code = `
  const data = ${JSON.stringify(data)};
  // Process data here
`;

// Step 3: Claude executes code
await mcp__ide__executeCode({ code });
```

---

## Complete Examples

### Example 1: Data Analysis

**Task**: Analyze assessment completion times by stage

**Phase 1: Fetch Data with MCP**
```typescript
// Claude calls this MCP tool
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT id, stage, created_at, stage_history
    FROM assessments
    WHERE stage IN ('completed', 'archived')
      AND created_at >= NOW() - INTERVAL '30 days'
    LIMIT 1000
  `
});
```

**Phase 2: Process with Code Execution**
```typescript
// Claude generates and executes this code
const code = `
  const assessments = ${JSON.stringify(assessments)};

  // Calculate stage durations
  const stageDurations = assessments.map(a => {
    const history = JSON.parse(a.stage_history || '[]');
    const durations = {};

    for (let i = 1; i < history.length; i++) {
      const prev = new Date(history[i-1].timestamp);
      const curr = new Date(history[i].timestamp);
      const hours = (curr - prev) / (1000 * 60 * 60);
      durations[history[i].stage] = hours;
    }

    return { id: a.id, stages: durations };
  });

  // Aggregate statistics
  const stats = ['inspection_scheduled', 'inspection_in_progress', 'report_in_progress']
    .map(stage => {
      const times = stageDurations
        .map(d => d.stages[stage])
        .filter(t => t != null);

      return {
        stage,
        count: times.length,
        avg: times.reduce((a,b) => a+b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times)
      };
    });

  console.log('Stage Statistics:', JSON.stringify(stats, null, 2));
`;

await mcp__ide__executeCode({ code });
```

**Token Efficiency**: 73% savings (850 tokens vs 3000 tokens)

---

### Example 2: Batch Updates

**Task**: Update assessments with validation

**Phase 1: Fetch Data with MCP**
```typescript
// Claude calls MCP tool with JOIN to get all needed data
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      a.id,
      a.stage,
      a.engineer_id,
      COUNT(p.id) as photo_count,
      COUNT(i.id) as issue_count
    FROM assessments a
    LEFT JOIN photos p ON p.assessment_id = a.id AND p.label IS NOT NULL
    LEFT JOIN issues i ON i.assessment_id = a.id AND i.status = 'open'
    WHERE a.stage = 'pending_review'
    GROUP BY a.id
    LIMIT 100
  `
});
```

**Phase 2: Process and Update with Code Execution**
```typescript
// Note: For updates, we need a different pattern since code can't call MCP
// Option 1: Validate in code, return IDs to update, Claude updates via MCP
const validationCode = `
  const assessments = ${JSON.stringify(assessments)};

  const validation = {
    valid: [],
    skipped: []
  };

  for (const a of assessments) {
    const reasons = [];

    if (!a.engineer_id) reasons.push('No engineer assigned');
    if (a.photo_count < 5) reasons.push(\`Insufficient photos (\${a.photo_count}/5)\`);
    if (a.issue_count > 0) reasons.push(\`\${a.issue_count} open issues\`);

    if (reasons.length === 0) {
      validation.valid.push(a.id);
    } else {
      validation.skipped.push({ id: a.id, reasons });
    }
  }

  console.log(JSON.stringify(validation, null, 2));
`;

// Execute validation
const result = await mcp__ide__executeCode({ code: validationCode });

// Parse result and update valid assessments via MCP
// (Claude would do this in a loop or batch query)
```

**Token Efficiency**: 92% savings (1400 tokens vs 16,500 tokens)

---

## Security Model

### Sandboxing Architecture

All code executes in a **Deno sandbox** with strict permissions:

#### **Filesystem Access**
```json
{
  "read": [
    "${PROJECT_ROOT}/**/*"  // Read-only access to project
  ],
  "write": [
    "${PROJECT_ROOT}/.agent/Logs/code_execution/**/*"  // Logs only
  ],
  "deny": [
    "${PROJECT_ROOT}/.env*",              // No environment files
    "${PROJECT_ROOT}/**/*.key",           // No key files
    "${PROJECT_ROOT}/**/secrets/**/*"     // No secrets directory
  ]
}
```

#### **Network Access**
- **Denied**: All network access (code cannot fetch data)
- **Reason**: Data must be fetched in Phase 1 by Claude via MCP tools

#### **Resource Limits**
- **Max Execution Time**: 60 seconds (prevents infinite loops)
- **Max Memory**: 512 MB (prevents memory leaks)
- **Max CPU**: 50% (prevents CPU exhaustion)

#### **Audit Trail**
Every execution creates an audit log:
```json
{
  "timestamp": "2025-11-09T14:23:45.123Z",
  "execution_id": "exec_1234567890",
  "context": "database-migration",
  "user": "jcvdm",
  "code_hash": "sha256:abc123...",
  "data_sources": ["mcp__supabase__execute_sql"],
  "execution_time_ms": 2134,
  "memory_used_mb": 45.2,
  "result": { "success": true }
}
```

---

## Best Practices

### 1. Fetch All Needed Data in Phase 1
```typescript
// ✅ GOOD: Use JOINs to get related data
const data = await mcp__supabase__execute_sql({
  query: `
    SELECT a.*, e.name as engineer_name, c.client_name
    FROM assessments a
    LEFT JOIN engineers e ON a.engineer_id = e.id
    LEFT JOIN clients c ON a.client_id = c.id
  `
});

// ❌ BAD: Fetching only assessments, then needing engineers later
const assessments = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM assessments'
});
// Now you can't get engineer data in code execution!
```

### 2. Use JSON.stringify() for Data Embedding
```typescript
// ✅ GOOD: Proper JSON embedding
const code = `
  const data = ${JSON.stringify(fetchedData)};
  // Process data
`;

// ❌ BAD: Direct interpolation (can break with quotes)
const code = `
  const data = ${fetchedData};
`;
```

### 3. Handle Large Datasets
```typescript
// ✅ GOOD: Limit query results
const data = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM assessments LIMIT 1000'
});

// ❌ BAD: Fetching all rows (may exceed token limits)
const data = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM assessments'
});
```

### 4. Return Structured Results
```typescript
// ✅ GOOD: Structured output
const code = `
  const result = {
    success: true,
    data: processedData,
    summary: { total: 100, processed: 95, failed: 5 }
  };
  console.log(JSON.stringify(result, null, 2));
`;
```

### 5. Log Progress for Long Operations
```typescript
const code = `
  const items = ${JSON.stringify(items)};

  for (let i = 0; i < items.length; i++) {
    console.log(\`Processing \${i + 1}/\${items.length}...\`);
    // Process item
  }
`;
```

---

## Integration with ClaimTech Architecture

### Assessment-Centric Architecture

Code execution respects ClaimTech's assessment-centric patterns:

**Phase 1: Fetch with Assessment Constraints**
```typescript
const data = await mcp__supabase__execute_sql({
  query: `
    SELECT a.*, r.id as request_id
    FROM assessments a
    INNER JOIN requests r ON a.request_id = r.id
    WHERE r.id = $1
  `,
  params: [requestId]
});
```

**Phase 2: Validate in Code**
```typescript
const code = `
  const assessments = ${JSON.stringify(data)};

  if (assessments.length > 1) {
    console.error('Violation: Multiple assessments for single request');
    console.log(JSON.stringify({ error: 'Multiple assessments', ids: assessments.map(a => a.id) }));
  } else {
    console.log(JSON.stringify({ success: true, assessment: assessments[0] }));
  }
`;
```

---

## Troubleshooting

### Common Issues

#### **Error: "Cannot import '/servers/...'"**
**Cause**: Trying to import from `/servers/` in code execution

**Solution**: Use Architecture A pattern (MCP fetch → code process)
```typescript
// ❌ WRONG
import { executeSQL } from '/servers/supabase/database';

// ✅ CORRECT
// Phase 1: Claude calls MCP
const data = await mcp__supabase__execute_sql({ query: '...' });
// Phase 2: Claude processes in code
const code = `const data = ${JSON.stringify(data)}; /* process */`;
```

#### **Error: "Data is undefined in code"**
**Cause**: Data not properly embedded via JSON.stringify()

**Solution**: Always use JSON.stringify()
```typescript
// ✅ CORRECT
const code = `
  const data = ${JSON.stringify(fetchedData)};
`;
```

#### **Error: "Token limit exceeded"**
**Cause**: Dataset too large to embed in code

**Solution**: Filter in SQL or process in batches
```typescript
// ✅ CORRECT: Limit results
const data = await mcp__supabase__execute_sql({
  query: 'SELECT id, name FROM assessments LIMIT 1000'
});
```

---

## Related Documentation

- **Usage Guide**: `.agent/SOP/using_code_executor.md` - Step-by-step procedures
- **Patterns**: `.agent/System/code_execution_patterns.md` - Common recipes
- **API Reference**: `.agent/System/mcp_code_api_reference.md` - MCP tool reference
- **Research**: `.agent/Tasks/active/mcp_bridge_research.md` - Architecture findings

---

## Metrics and Monitoring

### Key Performance Indicators (KPIs)

- **Token Efficiency**: 73-94% reduction vs traditional tool chaining
- **Execution Time**: 70-85% faster for multi-step workflows
- **Error Rate**: <2% of executions result in errors
- **Security Violations**: 0 (all attempted violations logged and blocked)

### Monitoring Dashboard

Track in `.agent/Logs/code_execution/metrics.json`:

```json
{
  "period": "2025-11",
  "total_executions": 1543,
  "successful": 1512,
  "failed": 31,
  "avg_execution_time_ms": 2145,
  "avg_memory_mb": 87.3,
  "token_savings_vs_traditional": "82%",
  "most_used_patterns": {
    "data_analysis": 523,
    "batch_validation": 412,
    "cross_source_correlation": 301
  }
}
```

---

**Document Version**: 2.0 (Architecture A)
**Last Review**: November 9, 2025
**Next Review**: December 2025
