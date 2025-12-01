# Using Code Executor for Data Processing

**Last Updated**: November 28, 2025
**Version**: 2.0 - Architecture A (MCP Fetch → Code Process)
**Audience**: All Claude Code users and implementations

---

## Overview

This guide explains when and how to use the two-phase code execution pattern for data processing tasks in ClaimTech. Architecture A achieves **73-94% token savings** by separating data fetching (MCP tools) from data processing (code execution).

**Critical**: Code execution runs in an isolated sandbox and **CANNOT call MCP tools directly**. Always follow the two-phase pattern.

---

## Decision Tree

```
START → Need to process data?
  ├─ YES → Is data already fetched?
  │   ├─ YES → Complex processing needed? (transformations, calculations, analysis)
  │   │   ├─ YES → Use Code Execution (Phase 2 only) ✓
  │   │   └─ NO → Return data directly
  │   └─ NO → Will you process it after fetching?
  │       ├─ YES → Use Architecture A (MCP fetch → Code process) ✓
  │       └─ NO → Use MCP tool call directly
  └─ NO → Use MCP tool directly
```

### Quick Decision Guide

| Scenario | Data Fetching | Processing | Pattern |
|----------|--------------|------------|---------|
| Get assessment by ID | 1 MCP call | None | MCP only |
| Calculate stage statistics | 1 MCP call | Aggregations | **Architecture A** |
| Validate 50 assessments | 1 MCP call (JOIN) | Iteration + logic | **Architecture A** |
| Generate monthly report | 2-3 MCP calls | Formatting + analysis | **Architecture A** |
| Correlate multiple sources | 2+ MCP calls | Cross-reference | **Architecture A** |

**Rule of Thumb**: If you need to transform, analyze, or format data after fetching, use Architecture A.

---

## 5-Step Procedure

### Step 1: Fetch Data with MCP Tools

**What to do**: Identify all data needed and fetch it using MCP tools

**Questions to Answer**:
- What data sources do I need? (Supabase, GitHub, etc.)
- What specific data do I need? (Think JOINs, not N+1 queries)
- Can I fetch related data in one query? (Use JOINs!)
- How much data will I fetch? (Stay under 1000 rows if possible)

**Examples**:

**Example 1: Simple fetch**
```typescript
// Claude calls this MCP tool
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT id, stage, created_at, stage_history
    FROM assessments
    WHERE stage = 'completed'
      AND created_at >= NOW() - INTERVAL '30 days'
    LIMIT 1000
  `
});
```

**Example 2: Fetch with JOINs (get all related data upfront)**
```typescript
// Claude calls this MCP tool
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      a.*,
      e.name as engineer_name,
      c.client_name,
      COUNT(p.id) as photo_count
    FROM assessments a
    LEFT JOIN engineers e ON a.engineer_id = e.id
    LEFT JOIN clients c ON a.client_id = c.id
    LEFT JOIN photos p ON p.assessment_id = a.id
    WHERE a.stage = 'pending_review'
    GROUP BY a.id, e.name, c.client_name
    LIMIT 100
  `
});
```

**Example 3: Multiple sources in parallel**
```typescript
// Claude calls multiple MCP tools in parallel
const [assessments, prs] = await Promise.all([
  mcp__supabase__execute_sql({
    project_id: env.SUPABASE_PROJECT_ID,
    query: 'SELECT * FROM assessments WHERE created_at >= $1',
    params: ['2025-11-01']
  }),
  mcp__github__list_prs({
    owner: 'claimtech',
    repo: 'platform',
    state: 'closed',
    per_page: 100
  })
]);
```

---

### Step 2: Write Processing Code

**What to do**: Write TypeScript code that processes the fetched data

**Template Structure**:

```typescript
// 1. Embed fetched data via JSON.stringify()
const data = ${JSON.stringify(fetchedData)};

// 2. Process data (transform, filter, calculate, etc.)
const processed = data.map(item => {
  // Your transformation logic
  return transformedItem;
});

// 3. Return structured results
console.log(JSON.stringify({
  success: true,
  data: processed,
  summary: { total: data.length, processed: processed.length }
}, null, 2));
```

**Best Practices**:

1. **Always embed data with JSON.stringify()**
   ```typescript
   // ✅ CORRECT
   const code = `
     const data = ${JSON.stringify(fetchedData)};
   `;

   // ❌ WRONG: Direct interpolation breaks with quotes/special chars
   const code = `
     const data = ${fetchedData};
   `;
   ```

2. **Use try/catch for error handling**
   ```typescript
   const code = `
     const data = ${JSON.stringify(fetchedData)};

     try {
       // Processing logic
       const result = processData(data);
       console.log(JSON.stringify({ success: true, data: result }));
     } catch (error) {
       console.error(JSON.stringify({ success: false, error: error.message }));
     }
   `;
   ```

3. **Log progress for long operations**
   ```typescript
   const code = `
     const items = ${JSON.stringify(items)};

     for (let i = 0; i < items.length; i++) {
       console.log(\`Processing \${i + 1}/\${items.length}...\`);
       // Process item
     }
   `;
   ```

4. **Return structured results**
   ```typescript
   const code = `
     const result = {
       success: true,
       data: processedData,
       summary: {
         total: items.length,
         successful: success.length,
         failed: failed.length,
         skipped: skipped.length
       },
       errors: failed.map(f => ({ id: f.id, error: f.error }))
     };

     console.log(JSON.stringify(result, null, 2));
   `;
   ```

---

### Step 3: Execute Code

**What to do**: Execute the processing code via `mcp__ide__executeCode`

**Pattern**:
```typescript
// Claude generates the code string
const processingCode = `
  const data = ${JSON.stringify(fetchedData)};

  // Your processing logic here
  const result = data.map(/* ... */);

  console.log(JSON.stringify(result, null, 2));
`;

// Claude executes the code
const executionResult = await mcp__ide__executeCode({
  code: processingCode
});

// executionResult contains stdout (console.log output)
```

**What happens**:
1. Claude sends code to `mcp__ide__executeCode` MCP tool
2. Code runs in isolated Deno sandbox
3. All `console.log()` output is captured
4. Output returned to Claude
5. Claude parses and presents results to user

---

### Step 4: Handle Results

**What to do**: Parse execution results and take action

**Pattern**:
```typescript
// Code execution returns stdout as string
const output = executionResult.stdout;

// Parse JSON output
const result = JSON.parse(output);

// Check for success
if (result.success) {
  // Present results to user or continue workflow
  console.log(`Processed ${result.summary.total} items successfully`);
} else {
  // Handle errors
  console.error(`Processing failed: ${result.error}`);
}
```

**If processing reveals actions needed**:
```typescript
// Example: Validation identified assessments to update
const validationResult = JSON.parse(executionResult.stdout);

// Now Claude updates via MCP tools
for (const id of validationResult.valid) {
  await mcp__supabase__execute_sql({
    project_id: env.SUPABASE_PROJECT_ID,
    query: 'UPDATE assessments SET stage = $1 WHERE id = $2',
    params: ['completed', id]
  });
}
```

---

### Step 5: Iterate if Needed

**What to do**: Review results and refine if necessary

**Common iterations**:

1. **Debug unexpected results**
   ```typescript
   // Add logging to see intermediate values
   const code = `
     const data = ${JSON.stringify(fetchedData)};

     console.log('First item:', JSON.stringify(data[0], null, 2));
     console.log('Total items:', data.length);

     // Continue processing...
   `;
   ```

2. **Handle edge cases discovered**
   ```typescript
   // Add validation before processing
   const code = `
     const data = ${JSON.stringify(fetchedData)};

     // Validate data structure
     if (!Array.isArray(data)) {
       console.error(JSON.stringify({ error: 'Expected array' }));
       throw new Error('Invalid data format');
     }

     // Continue processing...
   `;
   ```

3. **Optimize performance**
   ```typescript
   // Use more efficient algorithms
   const code = `
     const data = ${JSON.stringify(fetchedData)};

     // Create lookup map instead of nested loops
     const lookup = data.reduce((acc, item) => {
       acc[item.id] = item;
       return acc;
     }, {});

     // Now O(1) lookups instead of O(n)
   `;
   ```

---

## Common Tasks

### Task 1: Analyze Database Data

**Scenario**: Calculate assessment stage statistics

**Step 1: Fetch data**
```typescript
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT stage, created_at, updated_at, stage_history
    FROM assessments
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `
});
```

**Step 2: Process with code execution**
```typescript
const code = `
  const assessments = ${JSON.stringify(assessments)};

  // Group by stage
  const byStage = assessments.reduce((acc, a) => {
    if (!acc[a.stage]) acc[a.stage] = [];
    acc[a.stage].push(a);
    return acc;
  }, {});

  // Calculate statistics
  const stats = Object.entries(byStage).map(([stage, items]) => {
    const durations = items.map(a => {
      const created = new Date(a.created_at);
      const updated = new Date(a.updated_at);
      return (updated - created) / (1000 * 60 * 60); // hours
    });

    return {
      stage,
      count: items.length,
      avg_hours: durations.reduce((a,b) => a+b, 0) / durations.length,
      min_hours: Math.min(...durations),
      max_hours: Math.max(...durations)
    };
  });

  console.log(JSON.stringify({ success: true, stats }, null, 2));
`;

await mcp__ide__executeCode({ code });
```

---

### Task 2: Cross-Source Correlation

**Scenario**: Correlate GitHub PR activity with assessment completions

**Step 1: Fetch data from multiple sources**
```typescript
const [assessments, prs] = await Promise.all([
  mcp__supabase__execute_sql({
    project_id: env.SUPABASE_PROJECT_ID,
    query: `
      SELECT id, created_at, stage
      FROM assessments
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `
  }),
  mcp__github__list_prs({
    owner: 'claimtech',
    repo: 'platform',
    state: 'closed',
    per_page: 100
  })
]);
```

**Step 2: Correlate in code execution**
```typescript
const code = `
  const assessments = ${JSON.stringify(assessments)};
  const prs = ${JSON.stringify(prs)};

  // Filter PRs to last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentPRs = prs.filter(pr => {
    const mergedAt = new Date(pr.merged_at || pr.closed_at);
    return mergedAt >= sevenDaysAgo;
  });

  // Group by day
  const assessmentsByDay = assessments.reduce((acc, a) => {
    const day = a.created_at.split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const prsByDay = recentPRs.reduce((acc, pr) => {
    const day = (pr.merged_at || pr.closed_at).split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  // Combine
  const allDays = [...new Set([...Object.keys(assessmentsByDay), ...Object.keys(prsByDay)])].sort();

  const correlation = allDays.map(day => ({
    date: day,
    assessments: assessmentsByDay[day] || 0,
    prs: prsByDay[day] || 0
  }));

  console.log(JSON.stringify({ success: true, correlation }, null, 2));
`;

await mcp__ide__executeCode({ code });
```

---

### Task 3: Batch Validation

**Scenario**: Validate assessments before stage update

**Step 1: Fetch with JOINs (get all needed data)**
```typescript
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      a.id,
      a.engineer_id,
      COUNT(DISTINCT p.id) FILTER (WHERE p.label IS NOT NULL) as labeled_photo_count,
      COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'open') as open_issue_count
    FROM assessments a
    LEFT JOIN photos p ON p.assessment_id = a.id
    LEFT JOIN issues i ON i.assessment_id = a.id
    WHERE a.stage = 'pending_review'
    GROUP BY a.id
  `
});
```

**Step 2: Validate in code execution**
```typescript
const code = `
  const assessments = ${JSON.stringify(assessments)};

  const validation = {
    valid: [],
    invalid: []
  };

  for (const a of assessments) {
    const reasons = [];

    if (!a.engineer_id) {
      reasons.push('No engineer assigned');
    }

    if (a.labeled_photo_count < 5) {
      reasons.push(\`Only \${a.labeled_photo_count} labeled photos (need 5)\`);
    }

    if (a.open_issue_count > 0) {
      reasons.push(\`\${a.open_issue_count} open issues remaining\`);
    }

    if (reasons.length === 0) {
      validation.valid.push(a.id);
    } else {
      validation.invalid.push({ id: a.id, reasons });
    }
  }

  console.log(JSON.stringify({
    success: true,
    validation,
    summary: {
      total: assessments.length,
      valid: validation.valid.length,
      invalid: validation.invalid.length
    }
  }, null, 2));
`;

const result = await mcp__ide__executeCode({ code });
```

**Step 3: Update valid assessments via MCP**
```typescript
const validationResult = JSON.parse(result.stdout);

// Batch update valid assessments
if (validationResult.validation.valid.length > 0) {
  await mcp__supabase__execute_sql({
    project_id: env.SUPABASE_PROJECT_ID,
    query: `
      UPDATE assessments
      SET stage = 'completed', updated_at = NOW()
      WHERE id = ANY($1)
    `,
    params: [validationResult.validation.valid]
  });
}
```

---

## Common Mistakes

### ❌ Mistake 1: Trying to Import from `/servers/`

**Wrong**:
```typescript
const code = `
  import { executeSQL } from '/servers/supabase/database';

  const data = await executeSQL({ query: '...' });
`;
```

**Why it fails**: Code execution cannot access MCP tools or the `/servers/` wrappers

**Correct**:
```typescript
// Phase 1: Fetch with MCP
const data = await mcp__supabase__execute_sql({ query: '...' });

// Phase 2: Process with code
const code = `
  const data = ${JSON.stringify(data)};
  // Process data here
`;
```

---

### ❌ Mistake 2: Not Using JSON.stringify()

**Wrong**:
```typescript
const code = `
  const data = ${fetchedData};  // This will break!
`;
```

**Why it fails**: Direct interpolation doesn't properly serialize objects/arrays

**Correct**:
```typescript
const code = `
  const data = ${JSON.stringify(fetchedData)};
`;
```

---

### ❌ Mistake 3: Fetching Data Inside Code Execution

**Wrong**:
```typescript
const code = `
  // This will NOT work - code cannot call MCP tools
  const data = await mcp__supabase__execute_sql({ query: '...' });
`;
```

**Why it fails**: Code execution has no access to MCP tools

**Correct**:
```typescript
// Fetch FIRST with MCP
const data = await mcp__supabase__execute_sql({ query: '...' });

// THEN process with code
const code = `
  const data = ${JSON.stringify(data)};
  // Process here
`;
```

---

### ❌ Mistake 4: Not Fetching Related Data Upfront

**Wrong**:
```typescript
// Fetch only assessments
const assessments = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM assessments'
});

// Now you can't get engineers in code execution!
const code = `
  const assessments = ${JSON.stringify(assessments)};

  // ❌ Can't fetch engineers here!
  for (const a of assessments) {
    // Need engineer name but don't have it
  }
`;
```

**Correct**:
```typescript
// Fetch with JOIN to get related data
const assessments = await mcp__supabase__execute_sql({
  query: `
    SELECT a.*, e.name as engineer_name
    FROM assessments a
    LEFT JOIN engineers e ON a.engineer_id = e.id
  `
});

// Now code has all needed data
const code = `
  const assessments = ${JSON.stringify(assessments)};

  for (const a of assessments) {
    console.log(\`Assessment \${a.id} assigned to \${a.engineer_name}\`);
  }
`;
```

---

## Troubleshooting

### Error: "Cannot import '/servers/...'"

**Cause**: Trying to use `/servers/` imports in code execution

**Solution**: Use Architecture A pattern - fetch with MCP, process with code

**See**: Common Mistake #1 above

---

### Error: "Data is undefined"

**Cause**: Data not properly embedded via JSON.stringify()

**Solution**: Always use `${JSON.stringify(data)}`

**See**: Common Mistake #2 above

---

### Error: "fetch is not defined" or "mcp__* is not defined"

**Cause**: Trying to call MCP tools or make HTTP requests in code execution

**Solution**: Fetch all data in Phase 1 with MCP tools

**See**: Common Mistake #3 above

---

### Error: "Token limit exceeded"

**Cause**: Dataset too large to embed in code via JSON.stringify()

**Solution**: Limit query results or select only needed fields
```typescript
// ✅ GOOD: Limit and select specific fields
const data = await mcp__supabase__execute_sql({
  query: 'SELECT id, stage, created_at FROM assessments LIMIT 1000'
});

// ❌ BAD: Fetching all rows with all columns
const data = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM assessments'
});
```

---

## Performance Tips

### 1. Fetch Related Data with JOINs

```typescript
// ✅ GOOD: One query with JOIN
const data = await mcp__supabase__execute_sql({
  query: `
    SELECT a.*, e.name as engineer_name, c.client_name
    FROM assessments a
    LEFT JOIN engineers e ON a.engineer_id = e.id
    LEFT JOIN clients c ON a.client_id = c.id
  `
});

// ❌ BAD: Multiple queries (and can't do in code execution anyway!)
const assessments = await mcp__supabase__execute_sql({ query: 'SELECT * FROM assessments' });
// Can't fetch engineers in code execution!
```

### 2. Use Parallel MCP Calls

```typescript
// ✅ GOOD: Parallel fetching
const [assessments, engineers, clients] = await Promise.all([
  mcp__supabase__execute_sql({ query: 'SELECT * FROM assessments' }),
  mcp__supabase__execute_sql({ query: 'SELECT * FROM engineers' }),
  mcp__supabase__execute_sql({ query: 'SELECT * FROM clients' })
]);

// ❌ BAD: Sequential fetching
const assessments = await mcp__supabase__execute_sql({ query: '...' });
const engineers = await mcp__supabase__execute_sql({ query: '...' });
const clients = await mcp__supabase__execute_sql({ query: '...' });
```

### 3. Use SQL Aggregations

```typescript
// ✅ GOOD: Calculate in SQL
const stats = await mcp__supabase__execute_sql({
  query: `
    SELECT stage, COUNT(*) as count, AVG(duration) as avg_duration
    FROM assessments
    GROUP BY stage
  `
});

// ❌ BAD: Fetch all and calculate in code
const assessments = await mcp__supabase__execute_sql({ query: 'SELECT * FROM assessments' });
const code = `
  const assessments = ${JSON.stringify(assessments)};
  // Calculate averages in code (slower, uses more tokens)
`;
```

---

## Related Documentation

- **Architecture**: `.agent/System/code_execution_architecture.md` - Complete architecture guide
- **Patterns**: `.agent/System/code_execution_patterns.md` - 6 common patterns with examples
- **API Reference**: `.agent/System/mcp_code_api_reference.md` - MCP tool reference
- **Research**: `.agent/Tasks/active/mcp_bridge_research.md` - Architecture findings

---

**Document Version**: 2.0 (Architecture A)
**Last Review**: November 9, 2025
**Next Review**: December 2025
