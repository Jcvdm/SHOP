# Common Code Execution Mistakes

Detailed solutions for frequently encountered issues when using code execution.

---

## Mistake 1: Trying to Import from `/servers/`

### ❌ Wrong Code

```typescript
const code = `
  import { executeSQL } from '/servers/supabase/database';
  import { listPRs } from '/servers/github/pulls';

  const data = await executeSQL({
    projectId: 'xyz',
    query: 'SELECT * FROM assessments'
  });

  console.log(data);
`;

await mcp__ide__executeCode({ code });
```

### Why It Fails

1. **Code execution runs in isolated sandbox**: The Deno sandbox does NOT have access to the `/servers/` directory
2. **MCP tools are not available**: Code cannot call `mcp__*` functions
3. **No MCP bridge exists**: There's no mechanism for code to invoke MCP servers

### ✅ Correct Approach

```typescript
// Phase 1: Claude calls MCP tool to fetch data
const data = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: 'SELECT * FROM assessments WHERE stage = $1',
  params: ['completed']
});

console.log(`Fetched ${data.length} assessments`);

// Phase 2: Claude embeds data and executes processing code
const code = `
  const data = ${JSON.stringify(data)};

  // Process the data (no imports needed!)
  const analysis = data.map(item => {
    // Transform/analyze
    return transformedItem;
  });

  console.log(JSON.stringify(analysis, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Key Takeaway

**Code execution is for PROCESSING data, not FETCHING data.**

Fetch with MCP → Process with code → Return results

---

## Mistake 2: Not Using JSON.stringify()

### ❌ Wrong Code

```typescript
const assessments = await mcp__supabase__execute_sql({...});

const code = `
  const data = ${assessments}; // WRONG! Direct interpolation

  const result = data.map(item => item.stage);
  console.log(result);
`;

await mcp__ide__executeCode({ code });
```

### Why It Fails

1. **Direct interpolation doesn't serialize objects**: `${assessments}` produces `[object Object]` not valid JavaScript
2. **Quotes and special characters break**: String values with quotes will break the code string
3. **Arrays don't serialize properly**: Arrays become string representations

### Error You'll See

```
SyntaxError: Unexpected token in JavaScript
```

### ✅ Correct Approach

```typescript
const assessments = await mcp__supabase__execute_sql({...});

const code = `
  const data = ${JSON.stringify(assessments)}; // CORRECT!

  const result = data.map(item => item.stage);
  console.log(JSON.stringify(result, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Key Takeaway

**ALWAYS use `JSON.stringify()` when embedding data into code.**

This properly serializes:
- Objects and arrays
- Strings with quotes
- Nested structures
- null and undefined
- Numbers and booleans

---

## Mistake 3: Fetching Data Inside Code Execution

### ❌ Wrong Code

```typescript
const code = `
  // Trying to call MCP tool from inside code execution
  const data = await mcp__supabase__execute_sql({
    project_id: 'xyz',
    query: 'SELECT * FROM assessments'
  });

  console.log(data);
`;

await mcp__ide__executeCode({ code });
```

### Why It Fails

1. **MCP tools are not available in code execution**: The sandbox has no access to `mcp__*` functions
2. **No network access**: Code cannot make HTTP requests to MCP servers
3. **Isolated environment**: Code runs separately from Claude's tool calling context

### Error You'll See

```
ReferenceError: mcp__supabase__execute_sql is not defined
```

### ✅ Correct Approach

```typescript
// Fetch FIRST with MCP (outside code execution)
const data = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: 'SELECT * FROM assessments'
});

// THEN process with code
const code = `
  const data = ${JSON.stringify(data)};

  const processed = data.map(item => {
    // Processing logic
    return item;
  });

  console.log(JSON.stringify(processed, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Key Takeaway

**Fetch ALL needed data BEFORE code execution.**

If you discover you need more data during processing, you must:
1. Stop code execution
2. Fetch additional data with MCP
3. Re-run code with all data

---

## Mistake 4: Not Fetching Related Data Upfront

### ❌ Wrong Code

```typescript
// Only fetch assessments
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: 'SELECT * FROM assessments WHERE stage = $1',
  params: ['completed']
});

// Try to get engineer names in code
const code = `
  const assessments = ${JSON.stringify(assessments)};

  const enriched = assessments.map(a => {
    // ❌ Can't fetch engineer data here!
    // Need engineer.name but only have engineer_id
    return {
      id: a.id,
      engineer: a.engineer_id, // Just the ID, not the name
      stage: a.stage
    };
  });

  console.log(JSON.stringify(enriched, null, 2));
`;
```

### Why It's a Problem

1. **Missing data**: You only have IDs, not the related data
2. **Can't make additional queries**: Code execution can't fetch engineers
3. **N+1 query pattern**: Even if you could, it would be inefficient

### ✅ Correct Approach

```typescript
// Fetch with JOIN to get all related data upfront
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      a.*,
      e.name as engineer_name,
      e.email as engineer_email,
      c.name as client_name
    FROM assessments a
    LEFT JOIN engineers e ON a.engineer_id = e.id
    LEFT JOIN clients c ON a.client_id = c.id
    WHERE a.stage = $1
  `,
  params: ['completed']
});

// Now code has all needed data
const code = `
  const assessments = ${JSON.stringify(assessments)};

  const enriched = assessments.map(a => ({
    id: a.id,
    engineer: a.engineer_name, // Have the name!
    client: a.client_name,     // Have the client!
    stage: a.stage
  }));

  console.log(JSON.stringify(enriched, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Key Takeaway

**Use JOINs to fetch ALL related data in Phase 1.**

Think ahead: What data will you need during processing?
- Engineer names? JOIN engineers table
- Photo counts? JOIN and COUNT photos
- Related metadata? JOIN related tables

---

## Mistake 5: Fetching Too Much Data

### ❌ Wrong Code

```typescript
// Fetch ALL assessments (could be millions!)
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: 'SELECT * FROM assessments' // No LIMIT!
});

const code = `
  const data = ${JSON.stringify(assessments)}; // May exceed token limits!

  const stats = /* calculate */;
  console.log(stats);
`;
```

### Why It's a Problem

1. **Token limits**: JSON.stringify() of huge datasets may exceed context limits
2. **Slow performance**: Serializing and parsing large data is slow
3. **Memory usage**: Large data structures consume memory in sandbox
4. **Unnecessary data**: You probably don't need all columns/rows

### Error You'll See

```
Error: Maximum string length exceeded
Error: Token limit exceeded
```

### ✅ Correct Approach

```typescript
// Fetch only what you need
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      id,
      stage,
      created_at,
      updated_at
      -- Only select needed columns
    FROM assessments
    WHERE created_at >= NOW() - INTERVAL '30 days'
      -- Filter to relevant timeframe
    LIMIT 1000
      -- Limit result count
  `
});

const code = `
  const data = ${JSON.stringify(assessments)};

  const stats = /* calculate */;
  console.log(JSON.stringify(stats, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Best Practices

1. **LIMIT results**: Use `LIMIT 1000` or appropriate number
2. **SELECT specific columns**: Avoid `SELECT *`
3. **Filter with WHERE**: Only fetch relevant data
4. **Use time ranges**: `WHERE created_at >= NOW() - INTERVAL '30 days'`
5. **Aggregate in SQL**: Use `GROUP BY`, `COUNT()`, `SUM()` when possible

### Key Takeaway

**Fetch ONLY what you need to process.**

Ask yourself:
- Do I need all columns? → SELECT specific fields
- Do I need all rows? → Add LIMIT
- Can I filter earlier? → Use WHERE clause
- Can SQL do this? → Use aggregations

---

## Mistake 6: Not Handling Errors in Code

### ❌ Wrong Code

```typescript
const data = await mcp__supabase__execute_sql({...});

const code = `
  const data = ${JSON.stringify(data)};

  // No error handling!
  const processed = data.map(item => {
    const parsed = JSON.parse(item.json_field); // Might fail!
    return {
      id: item.id,
      value: parsed.someField.nestedField // Might be undefined!
    };
  });

  console.log(JSON.stringify(processed));
`;

await mcp__ide__executeCode({ code });
```

### Why It's a Problem

1. **Silent failures**: Errors stop execution without helpful messages
2. **No partial results**: One bad item fails entire batch
3. **Hard to debug**: Don't know which item caused the error

### Error You'll See

```
Error: Cannot read property 'nestedField' of undefined
SyntaxError: Unexpected token in JSON
```

### ✅ Correct Approach

```typescript
const data = await mcp__supabase__execute_sql({...});

const code = `
  const data = ${JSON.stringify(data)};

  const results = {
    success: [],
    failed: []
  };

  for (const item of data) {
    try {
      // Validate before parsing
      if (!item.json_field) {
        results.failed.push({
          id: item.id,
          error: 'Missing json_field'
        });
        continue;
      }

      // Parse with error handling
      const parsed = JSON.parse(item.json_field);

      // Validate nested access
      if (!parsed.someField || !parsed.someField.nestedField) {
        results.failed.push({
          id: item.id,
          error: 'Missing required nested field'
        });
        continue;
      }

      // Process successfully
      results.success.push({
        id: item.id,
        value: parsed.someField.nestedField
      });

    } catch (error) {
      results.failed.push({
        id: item.id,
        error: error.message
      });
    }
  }

  console.log('Summary:', JSON.stringify({
    total: data.length,
    successful: results.success.length,
    failed: results.failed.length
  }, null, 2));

  console.log('Results:', JSON.stringify(results, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Key Takeaway

**Always use try/catch and validate data.**

1. Wrap risky operations in try/catch
2. Validate before accessing nested properties
3. Track successes and failures separately
4. Return detailed error information

---

## Mistake 7: Not Returning Structured Results

### ❌ Wrong Code

```typescript
const data = await mcp__supabase__execute_sql({...});

const code = `
  const data = ${JSON.stringify(data)};

  // Just logging raw values
  console.log('Total:', data.length);
  console.log('First item:', data[0]);
  console.log('Average:', data.reduce((a,b) => a + b.value, 0) / data.length);
`;

await mcp__ide__executeCode({ code });
```

### Why It's a Problem

1. **Hard to parse**: Unstructured output is difficult to work with
2. **No standard format**: Can't reliably extract results
3. **Poor for automation**: Can't pipe to other processes

### ✅ Correct Approach

```typescript
const data = await mcp__supabase__execute_sql({...});

const code = `
  const data = ${JSON.stringify(data)};

  // Calculate metrics
  const metrics = {
    total: data.length,
    average: data.reduce((sum, item) => sum + item.value, 0) / data.length,
    min: Math.min(...data.map(d => d.value)),
    max: Math.max(...data.map(d => d.value))
  };

  // Build structured result
  const result = {
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      metrics,
      items: data.map(item => ({
        id: item.id,
        value: item.value,
        processed: true
      }))
    },
    summary: {
      total: data.length,
      processed: data.length,
      failed: 0
    }
  };

  // Return as JSON
  console.log(JSON.stringify(result, null, 2));
`;

const result = await mcp__ide__executeCode({ code });

// Parse the structured output
const output = JSON.parse(result.stdout);
console.log(`Processed ${output.summary.processed} items`);
console.log(`Average: ${output.data.metrics.average}`);
```

### Key Takeaway

**Always return structured JSON with:**

1. `success`: boolean indicating if processing succeeded
2. `data`: the processed results
3. `summary`: counts and metadata
4. `errors`: array of any errors encountered
5. `timestamp`: when processing occurred

Standard structure makes results easy to:
- Parse and use programmatically
- Display to users
- Log and audit
- Chain to other operations

---

## Mistake 8: Sequential Instead of Parallel Fetching

### ❌ Wrong Code

```typescript
// Fetching sequentially (SLOW)
console.log('Fetching assessments...');
const assessments = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM assessments'
});

console.log('Fetching engineers...');
const engineers = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM engineers'
});

console.log('Fetching PRs...');
const prs = await mcp__github__list_pull_requests({...});

// Total time: 3 seconds (1s + 1s + 1s)
```

### Why It's a Problem

1. **Slower**: Waits for each query to complete before starting next
2. **Wasted time**: Queries could run simultaneously
3. **Poor UX**: User waits longer than necessary

### ✅ Correct Approach

```typescript
// Fetching in parallel (FAST)
console.log('Fetching from multiple sources...');

const [assessments, engineers, prs] = await Promise.all([
  mcp__supabase__execute_sql({
    query: 'SELECT * FROM assessments'
  }),
  mcp__supabase__execute_sql({
    query: 'SELECT * FROM engineers'
  }),
  mcp__github__list_pull_requests({...})
]);

// Total time: 1 second (max of 1s, 1s, 1s)
console.log('All data fetched!');
```

### Performance Impact

Sequential:
- Query 1: 1 second
- Query 2: 1 second (waits for Query 1)
- Query 3: 1 second (waits for Query 2)
- **Total: 3 seconds**

Parallel:
- Query 1: 1 second
- Query 2: 1 second (runs simultaneously)
- Query 3: 1 second (runs simultaneously)
- **Total: 1 second**

**67% faster!**

### Key Takeaway

**Use `Promise.all()` for independent queries.**

Only use sequential when queries depend on each other:
```typescript
// Sequential when dependent
const user = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM users WHERE id = $1',
  params: [userId]
});

// Need user.company_id from first query
const company = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM companies WHERE id = $1',
  params: [user.company_id]
});
```

---

## Mistake 9: Not Logging Progress

### ❌ Wrong Code

```typescript
const data = await mcp__supabase__execute_sql({...}); // 1000 items

const code = `
  const data = ${JSON.stringify(data)};

  // Long running operation with no feedback
  const results = data.map(item => {
    // Complex processing (takes 5+ seconds)
    return processedItem;
  });

  console.log(JSON.stringify(results));
`;

await mcp__ide__executeCode({ code });
// User sees nothing for 5+ seconds... are we stuck?
```

### Why It's a Problem

1. **No feedback**: User doesn't know if processing is working
2. **Looks frozen**: Appears hung or crashed
3. **Can't monitor**: No visibility into progress
4. **Hard to debug**: Can't tell where it's slow

### ✅ Correct Approach

```typescript
const data = await mcp__supabase__execute_sql({...});

const code = `
  const data = ${JSON.stringify(data)};

  console.log(\`Processing \${data.length} items...\`);

  const results = [];

  for (let i = 0; i < data.length; i++) {
    // Log progress every 100 items
    if (i % 100 === 0) {
      console.log(\`Progress: \${i}/\${data.length} (\${Math.round(i/data.length*100)}%)\`);
    }

    // Process item
    const processed = /* complex processing */;
    results.push(processed);
  }

  console.log('Processing complete!');
  console.log(JSON.stringify({ success: true, results }, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Output

```
Processing 1000 items...
Progress: 0/1000 (0%)
Progress: 100/1000 (10%)
Progress: 200/1000 (20%)
Progress: 300/1000 (30%)
...
Progress: 900/1000 (90%)
Processing complete!
```

### Key Takeaway

**Log progress for long operations.**

1. Log start: "Processing X items..."
2. Log milestones: Every N items or N%
3. Log completion: "Processing complete!"
4. Log errors: Any failures encountered

---

## Quick Reference: Common Errors

| Error Message | Cause | Fix |
|--------------|-------|-----|
| `Cannot import '/servers/...'` | Trying to import from /servers/ | Use MCP fetch → code process pattern |
| `Data is undefined` | Not using JSON.stringify() | Use `${JSON.stringify(data)}` |
| `mcp__* is not defined` | Trying to call MCP tools in code | Fetch with MCP first, then process |
| `Maximum string length exceeded` | Dataset too large | Use LIMIT, SELECT specific fields |
| `Token limit exceeded` | Too much data | Filter data, reduce result size |
| `fetch is not defined` | Trying to make HTTP requests | Fetch data in Phase 1 with MCP |
| `Cannot read property of undefined` | Missing error handling | Use try/catch, validate data |
| `Unexpected token in JSON` | Bad JSON.stringify() usage | Always use JSON.stringify() |

---

**Last Updated**: November 9, 2025
**Version**: 1.0
