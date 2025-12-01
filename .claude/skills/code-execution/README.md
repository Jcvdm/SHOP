# Code Execution Skill - Quick Reference

Efficient data processing using two-phase Architecture A pattern.

**Token Savings**: 73-94% reduction for data workflows

---

## When to Use

### ✅ Use Code Execution For:

- **Data Analysis**: Calculate statistics, find patterns, aggregate data
- **Batch Processing**: Validate/transform multiple records
- **Report Generation**: Format data as Markdown/HTML
- **Complex Calculations**: Multi-step math, statistical analysis
- **Cross-Source Correlation**: Combine Supabase + GitHub data

### ❌ Don't Use For:

- Single simple operations (use direct MCP call)
- Making additional queries (code can't call MCP tools)
- Streaming responses (use conversation)

---

## Quick Decision Tree

```
Need to process data?
  ├─ YES → Will you transform/analyze after fetching?
  │   ├─ YES → Use Code Execution ✓
  │   └─ NO → Use MCP directly
  └─ NO → Use MCP directly
```

---

## The Two-Phase Pattern

### Phase 1: Fetch Data (MCP Tools)

```typescript
// Claude calls MCP tool
const data = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `SELECT * FROM assessments WHERE stage = 'completed' LIMIT 1000`
});
```

### Phase 2: Process Data (Code Execution)

```typescript
// Claude embeds data and executes
const code = `
  const data = ${JSON.stringify(data)};

  // Processing logic
  const result = data.map(item => {
    // Transform/analyze/calculate
    return transformedItem;
  });

  console.log(JSON.stringify(result, null, 2));
`;

await mcp__ide__executeCode({ code });
```

---

## Pattern Cheat Sheet

### 1. Data Analysis
```typescript
// Fetch → Analyze → Calculate stats
const assessments = await mcp__supabase__execute_sql({...});
const code = `const data = ${JSON.stringify(assessments)}; /* analyze */`;
await mcp__ide__executeCode({ code });
```

### 2. Batch Validation
```typescript
// Fetch with JOINs → Validate → Return valid IDs
const assessments = await mcp__supabase__execute_sql({...});
const code = `const data = ${JSON.stringify(assessments)}; /* validate */`;
const result = await mcp__ide__executeCode({ code });
// Update valid ones via MCP
```

### 3. Cross-Source Correlation
```typescript
// Fetch from multiple sources in parallel → Correlate
const [db, gh] = await Promise.all([mcp__supabase__*(...), mcp__github__*(...)]);
const code = `const db = ${JSON.stringify(db)}; const gh = ${JSON.stringify(gh)}; /* correlate */`;
await mcp__ide__executeCode({ code });
```

### 4. Report Generation
```typescript
// Fetch with JOINs → Format as Markdown
const data = await mcp__supabase__execute_sql({...});
const code = `const data = ${JSON.stringify(data)}; /* generate markdown */`;
await mcp__ide__executeCode({ code });
```

---

## Common Mistakes

### ❌ Mistake 1: Importing from `/servers/`

```typescript
// WRONG - This will fail
const code = `
  import { executeSQL } from '/servers/supabase/database';
  const data = await executeSQL({...});
`;
```

**Fix**: Fetch with MCP first, then process

```typescript
// CORRECT
const data = await mcp__supabase__execute_sql({...});
const code = `const data = ${JSON.stringify(data)}; /* process */`;
```

### ❌ Mistake 2: Not Using JSON.stringify()

```typescript
// WRONG - Will break
const code = `const data = ${fetchedData};`;
```

**Fix**: Always use JSON.stringify()

```typescript
// CORRECT
const code = `const data = ${JSON.stringify(fetchedData)};`;
```

### ❌ Mistake 3: Not Fetching Related Data

```typescript
// WRONG - Can't get engineers in code
const assessments = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM assessments'
});
```

**Fix**: Use JOINs to get all needed data

```typescript
// CORRECT
const assessments = await mcp__supabase__execute_sql({
  query: `
    SELECT a.*, e.name as engineer_name
    FROM assessments a
    LEFT JOIN engineers e ON a.engineer_id = e.id
  `
});
```

### ❌ Mistake 4: Fetching Too Much Data

```typescript
// WRONG - May hit token limits
const data = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM assessments'
});
```

**Fix**: Limit and select specific fields

```typescript
// CORRECT
const data = await mcp__supabase__execute_sql({
  query: 'SELECT id, stage, created_at FROM assessments LIMIT 1000'
});
```

---

## Best Practices

### 1. Fetch in Parallel

```typescript
// ✅ GOOD
const [a, b, c] = await Promise.all([
  mcp__supabase__execute_sql({...}),
  mcp__supabase__execute_sql({...}),
  mcp__github__list_pull_requests({...})
]);

// ❌ BAD (sequential)
const a = await mcp__supabase__execute_sql({...});
const b = await mcp__supabase__execute_sql({...});
```

### 2. Use JOINs Not N+1

```typescript
// ✅ GOOD (single JOIN query)
SELECT a.*, e.name
FROM assessments a
LEFT JOIN engineers e ON a.engineer_id = e.id

// ❌ BAD (N+1 queries - can't do in code anyway!)
SELECT * FROM assessments
// Then fetch each engineer (not possible in code execution)
```

### 3. Handle Errors

```typescript
const code = `
  const data = ${JSON.stringify(data)};

  try {
    const result = processData(data);
    console.log(JSON.stringify({ success: true, data: result }));
  } catch (error) {
    console.error(JSON.stringify({ success: false, error: error.message }));
  }
`;
```

### 4. Return Structured Results

```typescript
const code = `
  const result = {
    success: true,
    data: processedData,
    summary: { total: 100, processed: 95, failed: 5 }
  };
  console.log(JSON.stringify(result, null, 2));
`;
```

---

## Token Savings

| Pattern | Traditional | Code Exec | Savings |
|---------|------------|-----------|---------|
| Data Analysis | 3,000 | 850 | 73% |
| Batch Validation | 16,500 | 1,400 | 92% |
| Cross-Source | 6,000 | 1,550 | 74% |
| Report Generation | 6,000 | 1,000 | 83% |

**Average**: 81% token reduction

---

## Troubleshooting

### "Cannot import '/servers/...'"
**Fix**: Use MCP fetch → code process pattern

### "Data is undefined"
**Fix**: Use `${JSON.stringify(data)}`

### "Token limit exceeded"
**Fix**: Limit query results (`LIMIT 1000`)

### "fetch is not defined"
**Fix**: Fetch all data in Phase 1 with MCP

---

## Quick Examples

### Example 1: Analyze Bottlenecks

```typescript
const assessments = await mcp__supabase__execute_sql({
  query: `SELECT id, stage_history FROM assessments WHERE stage = 'completed'`
});

const code = `
  const assessments = ${JSON.stringify(assessments)};

  const stageDurations = assessments.map(a => {
    const history = JSON.parse(a.stage_history || '[]');
    // Calculate durations...
  });

  const bottlenecks = stageDurations.filter(d => d.avg > 24);
  console.log(JSON.stringify(bottlenecks, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Example 2: Validate Assessments

```typescript
const assessments = await mcp__supabase__execute_sql({
  query: `
    SELECT a.id, COUNT(p.id) as photo_count
    FROM assessments a
    LEFT JOIN photos p ON p.assessment_id = a.id
    GROUP BY a.id
  `
});

const code = `
  const assessments = ${JSON.stringify(assessments)};

  const validation = { valid: [], invalid: [] };

  for (const a of assessments) {
    if (a.photo_count >= 5) {
      validation.valid.push(a.id);
    } else {
      validation.invalid.push({ id: a.id, reason: 'Not enough photos' });
    }
  }

  console.log(JSON.stringify(validation, null, 2));
`;

const result = await mcp__ide__executeCode({ code });
```

### Example 3: Generate Report

```typescript
const data = await mcp__supabase__execute_sql({
  query: `
    SELECT e.name, COUNT(a.id) as total
    FROM engineers e
    LEFT JOIN assessments a ON a.engineer_id = e.id
    GROUP BY e.name
  `
});

const code = `
  const data = ${JSON.stringify(data)};

  const report = \`
# Engineer Report

\${data.map(e => \`- **\${e.name}**: \${e.total} assessments\`).join('\\n')}
\`;

  console.log(report);
`;

await mcp__ide__executeCode({ code });
```

---

## Related Resources

- **Full Skill**: `SKILL.md` - Complete patterns and examples
- **Templates**: `resources/pattern-templates.md` - Copy-paste ready code
- **Common Mistakes**: `resources/common-mistakes.md` - Detailed solutions
- **Architecture**: `.agent/System/code_execution_architecture.md` - Technical details
- **Patterns**: `.agent/System/code_execution_patterns.md` - 6 complete patterns
- **Usage Guide**: `.agent/SOP/using_code_executor.md` - Step-by-step procedures

---

**Version**: 1.0 (Architecture A)
**Last Updated**: November 9, 2025
