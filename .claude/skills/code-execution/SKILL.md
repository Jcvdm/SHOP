---
name: code-execution
description: Efficient data processing using two-phase code execution pattern. Use when analyzing data, batch processing, generating reports, calculating statistics, or performing complex multi-step transformations. Achieves 73-94% token reduction for data workflows.
keywords: analyze, batch, process, calculate, generate report, statistics, transform, aggregate, correlation, validation, data analysis, metrics, trends, insights
autoInvoke: true
---

# Code Execution Skill

Expert guidance for using ClaimTech's code execution capabilities to achieve 73-94% token reduction for data processing tasks through the two-phase Architecture A pattern.

## Overview

Code execution allows you to process data efficiently using a two-phase approach:

1. **Phase 1 - Data Fetching**: Claude calls MCP tools (`mcp__supabase__*`, `mcp__github__*`, etc.) to gather data
2. **Phase 2 - Data Processing**: Claude embeds data into code and executes processing via `mcp__ide__executeCode`

**Token Efficiency**: 73-94% reduction compared to traditional multi-tool chaining

**Critical**: Code execution runs in an isolated Deno sandbox and **CANNOT call MCP tools directly**. All data must be fetched in Phase 1.

---

## When to Use Code Execution

### ✅ Use Code Execution When:

1. **Data Analysis**
   - Calculating statistics (averages, percentages, trends)
   - Finding patterns or correlations
   - Aggregating data from multiple sources
   - Example: "Analyze assessment completion times by stage"

2. **Batch Processing**
   - Validating multiple records
   - Transforming data structures
   - Filtering large datasets
   - Example: "Identify assessments ready for completion"

3. **Report Generation**
   - Formatting data as Markdown/HTML
   - Creating summaries or dashboards
   - Generating charts or visualizations
   - Example: "Generate monthly performance report"

4. **Complex Calculations**
   - Multi-step mathematical operations
   - Statistical analysis
   - Custom algorithms
   - Example: "Calculate engineer performance scores"

5. **Data Transformation**
   - Reshaping data structures
   - Combining multiple data sources
   - JSON manipulation
   - Example: "Merge assessment and photo data"

6. **Cross-Source Correlation**
   - Combining data from Supabase + GitHub
   - Comparing multiple timeframes
   - Finding relationships between datasets
   - Example: "Correlate PR activity with assessment volume"

### ❌ Don't Use Code Execution When:

1. **Single Simple Operation**
   - Reading one record
   - Simple CRUD operation
   - Use direct MCP tool call instead

2. **Streaming Responses**
   - Need immediate feedback
   - Real-time updates
   - Use conversation context instead

3. **Interactive Queries**
   - User needs to see intermediate results
   - Multiple back-and-forth decisions
   - Use conversation with MCP tools instead

4. **Making Additional Queries**
   - Code cannot call MCP tools
   - Fetch all needed data in Phase 1

---

## Core Pattern: Architecture A

### The Two-Phase Approach

**Phase 1: Fetch Data** (Claude calls MCP tools)
```typescript
// Claude calls MCP tool to fetch data
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT id, stage, created_at, stage_history
    FROM assessments
    WHERE created_at >= NOW() - INTERVAL '30 days'
      AND stage IN ('completed', 'archived')
    ORDER BY created_at DESC
    LIMIT 1000
  `
});

console.log(`Fetched ${assessments.length} assessments`);
```

**Phase 2: Process Data** (Claude executes code)
```typescript
// Claude embeds data and executes processing code
const code = `
  // Data embedded via JSON.stringify()
  const assessments = ${JSON.stringify(assessments)};

  // Calculate stage durations
  const analysis = assessments.map(a => {
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
  const stages = ['inspection_scheduled', 'inspection_in_progress', 'report_in_progress'];
  const stats = stages.map(stage => {
    const times = analysis.map(a => a.stages[stage]).filter(t => t != null);
    return {
      stage,
      count: times.length,
      avg: times.reduce((a,b) => a+b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times)
    };
  });

  console.log(JSON.stringify(stats, null, 2));
`;

await mcp__ide__executeCode({ code });
```

**Token Efficiency**: ~500 tokens (vs ~2000 traditional) = **75% savings**

---

## Common Patterns

### Pattern 1: Data Analysis Pipeline

**Scenario**: Analyze assessment stage durations to identify bottlenecks

**Phase 1: Fetch Data**
```typescript
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

**Phase 2: Process and Analyze**
```typescript
const code = `
  const assessments = ${JSON.stringify(assessments)};

  // Calculate stage durations
  const stageDurations = assessments.map(a => {
    const history = JSON.parse(a.stage_history || '[]');
    const durations = {};

    for (let i = 1; i < history.length; i++) {
      const prev = new Date(history[i-1].timestamp);
      const curr = new Date(history[i].timestamp);
      const hours = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60);
      durations[history[i].stage] = hours;
    }

    return { id: a.id, stages: durations };
  });

  // Aggregate statistics
  const stages = ['inspection_scheduled', 'inspection_in_progress', 'report_in_progress'];
  const stats = stages.map(stage => {
    const times = stageDurations
      .map(d => d.stages[stage])
      .filter(t => t !== undefined && t > 0);

    if (times.length === 0) return { stage, count: 0, avg: 0, min: 0, max: 0 };

    return {
      stage,
      count: times.length,
      avg: Math.round(times.reduce((a,b) => a+b, 0) / times.length * 10) / 10,
      min: Math.round(Math.min(...times) * 10) / 10,
      max: Math.round(Math.max(...times) * 10) / 10
    };
  });

  // Identify bottlenecks
  const bottlenecks = stats.filter(s => s.avg > 24);

  console.log('Stage Statistics:', JSON.stringify(stats, null, 2));
  console.log('Bottlenecks (>24h avg):', JSON.stringify(bottlenecks, null, 2));
`;

await mcp__ide__executeCode({ code });
```

**Token Savings**: 73% (850 vs 3000 tokens)

---

### Pattern 2: Batch Validation

**Scenario**: Validate assessments before updating stage

**Phase 1: Fetch with JOINs (get all needed data)**
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
    LEFT JOIN assessment_photos p ON p.assessment_id = a.id
    LEFT JOIN assessment_issues i ON i.assessment_id = a.id
    WHERE a.stage = 'pending_review'
    GROUP BY a.id
    LIMIT 100
  `
});
```

**Phase 2: Validate in Code**
```typescript
const code = `
  const assessments = ${JSON.stringify(assessments)};

  const validation = { valid: [], invalid: [] };

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

**Phase 3: Update valid ones via MCP**
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

**Token Savings**: 92% (1400 vs 16500 tokens)

---

### Pattern 3: Cross-Source Correlation

**Scenario**: Correlate GitHub PR activity with assessment completions

**Phase 1: Fetch from Multiple Sources (Parallel)**
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
  mcp__github__list_pull_requests({
    owner: 'claimtech',
    repo: 'platform',
    state: 'closed',
    perPage: 100
  })
]);
```

**Phase 2: Correlate in Code**
```typescript
const code = `
  const assessments = ${JSON.stringify(assessments)};
  const prs = ${JSON.stringify(prs)};

  // Filter PRs to same timeframe
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

**Token Savings**: 74% (1550 vs 6000 tokens)

---

### Pattern 4: Report Generation

**Scenario**: Generate monthly performance report

**Phase 1: Fetch with JOINs**
```typescript
const claims = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      c.*,
      a.stage as assessment_stage,
      a.created_at as assessment_created,
      a.updated_at as assessment_updated,
      e.name as engineer_name,
      cl.name as client_name
    FROM claims c
    LEFT JOIN assessments a ON a.claim_id = c.id
    LEFT JOIN engineers e ON a.engineer_id = e.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    WHERE c.created_at >= $1 AND c.created_at < $2
    ORDER BY c.created_at DESC
  `,
  params: ['2025-10-01', '2025-11-01']
});
```

**Phase 2: Generate Report**
```typescript
const code = `
  const claims = ${JSON.stringify(claims)};

  // Group by status
  const grouped = claims.reduce((acc, c) => {
    const status = c.assessment_stage || 'no_assessment';
    if (!acc[status]) acc[status] = [];
    acc[status].push(c);
    return acc;
  }, {});

  // Calculate metrics
  const completedClaims = claims.filter(c =>
    c.assessment_stage === 'completed' && c.assessment_created && c.assessment_updated
  );

  const avgHours = completedClaims.length > 0
    ? completedClaims.reduce((sum, c) => {
        const created = new Date(c.assessment_created);
        const updated = new Date(c.assessment_updated);
        return sum + (updated - created) / (1000 * 60 * 60);
      }, 0) / completedClaims.length
    : 0;

  // Generate Markdown
  const report = \`
# Monthly Claims Report

**Period**: 2025-10-01 to 2025-11-01
**Generated**: \${new Date().toISOString()}

## Executive Summary

- **Total Claims**: \${claims.length}
- **Completed**: \${completedClaims.length}
- **Average Time**: \${Math.round(avgHours * 10) / 10}h

## Claims by Status

\${Object.entries(grouped)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([status, items]) => {
    const pct = ((items.length / claims.length) * 100).toFixed(1);
    return \`- **\${status}**: \${items.length} (\${pct}%)\`;
  })
  .join('\\n')}
\`;

  console.log(report);
`;

await mcp__ide__executeCode({ code });
```

**Token Savings**: 83% (1000 vs 6000 tokens)

---

### Pattern 5: Multi-Step Transformation

**Scenario**: Transform raw data into structured format

**Phase 1: Fetch Raw Data**
```typescript
const rawData = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT id, metadata, stage_history, photos_metadata
    FROM assessments
    WHERE updated_at >= NOW() - INTERVAL '1 day'
  `
});
```

**Phase 2: Transform in Code**
```typescript
const code = `
  const rawData = ${JSON.stringify(rawData)};

  const transformed = rawData.map(item => {
    // Parse JSON fields
    const metadata = JSON.parse(item.metadata || '{}');
    const history = JSON.parse(item.stage_history || '[]');
    const photos = JSON.parse(item.photos_metadata || '[]');

    // Calculate metrics
    const stageCount = history.length;
    const photoCount = photos.length;
    const hasLocation = !!metadata.location;

    // Build transformed object
    return {
      id: item.id,
      metrics: {
        stage_count: stageCount,
        photo_count: photoCount,
        has_location: hasLocation
      },
      timeline: history.map(h => ({
        stage: h.stage,
        timestamp: h.timestamp,
        duration_hours: h.duration ? Math.round(h.duration / 3600) : null
      })),
      photo_summary: photos.map(p => ({
        id: p.id,
        label: p.label,
        timestamp: p.timestamp
      }))
    };
  });

  console.log(JSON.stringify({ success: true, data: transformed }, null, 2));
`;

await mcp__ide__executeCode({ code });
```

**Token Savings**: 80% for complex transformations

---

### Pattern 6: Statistical Analysis

**Scenario**: Calculate engineer performance statistics

**Phase 1: Fetch Engineer Data**
```typescript
const engineerData = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      e.id,
      e.name,
      a.id as assessment_id,
      a.created_at,
      a.updated_at,
      a.stage
    FROM engineers e
    LEFT JOIN assessments a ON a.engineer_id = e.id
    WHERE a.created_at >= NOW() - INTERVAL '30 days'
    ORDER BY e.name, a.created_at
  `
});
```

**Phase 2: Calculate Statistics**
```typescript
const code = `
  const data = ${JSON.stringify(engineerData)};

  // Group by engineer
  const byEngineer = data.reduce((acc, row) => {
    if (!acc[row.name]) {
      acc[row.name] = { id: row.id, name: row.name, assessments: [] };
    }
    if (row.assessment_id) {
      acc[row.name].assessments.push(row);
    }
    return acc;
  }, {});

  // Calculate statistics
  const stats = Object.values(byEngineer).map(engineer => {
    const assessments = engineer.assessments;
    const completed = assessments.filter(a => a.stage === 'completed');

    // Calculate average completion time
    const times = completed
      .filter(a => a.created_at && a.updated_at)
      .map(a => {
        const created = new Date(a.created_at);
        const updated = new Date(a.updated_at);
        return (updated - created) / (1000 * 60 * 60); // hours
      });

    const avgTime = times.length > 0
      ? times.reduce((sum, t) => sum + t, 0) / times.length
      : 0;

    return {
      name: engineer.name,
      total_assessments: assessments.length,
      completed: completed.length,
      completion_rate: assessments.length > 0
        ? Math.round((completed.length / assessments.length) * 100)
        : 0,
      avg_completion_hours: Math.round(avgTime * 10) / 10,
      min_hours: times.length > 0 ? Math.round(Math.min(...times) * 10) / 10 : 0,
      max_hours: times.length > 0 ? Math.round(Math.max(...times) * 10) / 10 : 0
    };
  });

  // Sort by total assessments
  stats.sort((a, b) => b.total_assessments - a.total_assessments);

  console.log(JSON.stringify({ success: true, stats }, null, 2));
`;

await mcp__ide__executeCode({ code });
```

**Token Savings**: 85% for statistical workflows

---

## Best Practices

### 1. Fetch All Needed Data in Phase 1

**Use JOINs to get related data upfront**:
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

// ❌ BAD: Fetching only assessments (can't get engineers in code!)
const assessments = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM assessments'
});
```

### 2. Use JSON.stringify() for Data Embedding

```typescript
// ✅ CORRECT: Proper JSON embedding
const code = `
  const data = ${JSON.stringify(fetchedData)};
  // Process data
`;

// ❌ WRONG: Direct interpolation breaks
const code = `
  const data = ${fetchedData}; // Will fail!
`;
```

### 3. Fetch Data in Parallel

```typescript
// ✅ GOOD: Parallel fetching
const [assessments, engineers, clients] = await Promise.all([
  mcp__supabase__execute_sql({ query: 'SELECT * FROM assessments' }),
  mcp__supabase__execute_sql({ query: 'SELECT * FROM engineers' }),
  mcp__supabase__execute_sql({ query: 'SELECT * FROM clients' })
]);

// ❌ BAD: Sequential (slower)
const assessments = await mcp__supabase__execute_sql({ query: '...' });
const engineers = await mcp__supabase__execute_sql({ query: '...' });
```

### 4. Handle Large Datasets

```typescript
// ✅ GOOD: Limit results
const data = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM assessments LIMIT 1000'
});

// ❌ BAD: Fetching all (may hit token limits)
const data = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM assessments'
});
```

### 5. Return Structured Results

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

### 6. Log Progress for Long Operations

```typescript
const code = `
  const items = ${JSON.stringify(items)};

  for (let i = 0; i < items.length; i++) {
    console.log(\`Processing \${i + 1}/\${items.length}...\`);
    // Process item
  }
`;
```

### 7. Use Error Handling

```typescript
const code = `
  const data = ${JSON.stringify(data)};

  try {
    // Processing logic
    const result = processData(data);
    console.log(JSON.stringify({ success: true, data: result }));
  } catch (error) {
    console.error(JSON.stringify({ success: false, error: error.message }));
  }
`;
```

---

## Token Efficiency Summary

| Pattern | Traditional Tokens | Code Exec Tokens | Savings |
|---------|-------------------|------------------|---------|
| Data Analysis | 3,000 | 850 | 73% |
| Batch Validation | 16,500 | 1,400 | 92% |
| Cross-Source | 6,000 | 1,550 | 74% |
| Report Generation | 6,000 | 1,000 | 83% |
| Transformation | 4,000 | 800 | 80% |
| Statistics | 5,000 | 750 | 85% |

**Average Savings**: 81% token reduction

---

## Security Model

### Architecture A is Secure

- ✅ No credentials in code execution
- ✅ Data already authorized via MCP tools
- ✅ Code only processes pre-fetched data
- ✅ Minimal attack surface

### Data Size Limits

- Keep fetched data < 1000 records typically
- Be mindful of JSON.stringify() size
- If data is too large, process in batches

### Sandboxing

Code execution runs in isolated Deno sandbox with:
- No network access
- No file write access (except logs)
- 60 second timeout
- 512MB memory limit

---

## Troubleshooting

### Error: "Cannot import '/servers/...'"

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

### Error: "Data is undefined in code"

**Cause**: Data not properly embedded via JSON.stringify()

**Solution**: Always use JSON.stringify()

```typescript
// ✅ CORRECT
const code = `
  const data = ${JSON.stringify(fetchedData)};
`;
```

### Error: "Token limit exceeded"

**Cause**: Dataset too large to embed in code

**Solution**: Filter in SQL or process in batches

```typescript
// ✅ CORRECT: Limit results
const data = await mcp__supabase__execute_sql({
  query: 'SELECT id, name FROM assessments LIMIT 1000'
});
```

### Error: "fetch is not defined"

**Cause**: Trying to make HTTP requests in code execution

**Solution**: Fetch all data in Phase 1 with MCP tools

---

## Integration with Other Skills

### Works with claimtech-development

Use code execution in implementation phase for:
- Data analysis during feature development
- Batch operations in migrations
- Report generation for testing

### Works with supabase-development

Use code execution for:
- Testing services with complex queries
- Validating data integrity
- Analyzing query performance

### Works with assessment-centric-specialist

Use code execution for:
- Workflow analysis
- Stage duration calculations
- Assessment validation

---

## Related Documentation

- **Architecture**: `.agent/System/code_execution_architecture.md` - Complete architecture guide
- **Patterns**: `.agent/System/code_execution_patterns.md` - 6 common patterns
- **Usage Guide**: `.agent/SOP/using_code_executor.md` - Step-by-step procedures
- **API Reference**: `.agent/System/mcp_code_api_reference.md` - MCP tool reference

---

## Examples by Use Case

### Use Case 1: Analyze Assessment Bottlenecks

```typescript
// Phase 1: Fetch
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT id, stage, stage_history, created_at
    FROM assessments
    WHERE created_at >= NOW() - INTERVAL '30 days'
      AND stage IN ('completed', 'archived')
    LIMIT 1000
  `
});

// Phase 2: Analyze
const code = `
  const assessments = ${JSON.stringify(assessments)};

  const stageDurations = assessments.map(a => {
    const history = JSON.parse(a.stage_history || '[]');
    const durations = {};

    for (let i = 1; i < history.length; i++) {
      const prev = new Date(history[i-1].timestamp);
      const curr = new Date(history[i].timestamp);
      durations[history[i].stage] = (curr - prev) / (1000 * 60 * 60);
    }

    return { id: a.id, stages: durations };
  });

  const stages = ['inspection_scheduled', 'inspection_in_progress', 'report_in_progress'];
  const stats = stages.map(stage => {
    const times = stageDurations.map(d => d.stages[stage]).filter(t => t != null);
    return {
      stage,
      avg: times.reduce((a,b) => a+b, 0) / times.length,
      count: times.length
    };
  });

  const bottlenecks = stats.filter(s => s.avg > 24);

  console.log('Bottlenecks:', JSON.stringify(bottlenecks, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Use Case 2: Generate Engineer Performance Report

```typescript
// Phase 1: Fetch
const data = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      e.name,
      COUNT(a.id) as total,
      COUNT(a.id) FILTER (WHERE a.stage = 'completed') as completed,
      AVG(EXTRACT(EPOCH FROM (a.updated_at - a.created_at)) / 3600) as avg_hours
    FROM engineers e
    LEFT JOIN assessments a ON a.engineer_id = e.id
    WHERE a.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY e.name
  `
});

// Phase 2: Format Report
const code = `
  const data = ${JSON.stringify(data)};

  const report = \`
# Engineer Performance Report

\${data.map(e => \`
## \${e.name}

- Total Assessments: \${e.total}
- Completed: \${e.completed}
- Average Time: \${Math.round(e.avg_hours * 10) / 10}h
\`).join('\\n')}
\`;

  console.log(report);
`;

await mcp__ide__executeCode({ code });
```

### Use Case 3: Identify Missing Photos

```typescript
// Phase 1: Fetch
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      a.id,
      a.assessment_number,
      COUNT(p.id) as photo_count
    FROM assessments a
    LEFT JOIN assessment_photos p ON p.assessment_id = a.id
    WHERE a.stage IN ('pending_review', 'report_in_progress')
    GROUP BY a.id
    HAVING COUNT(p.id) < 5
  `
});

// Phase 2: Analyze
const code = `
  const assessments = ${JSON.stringify(assessments)};

  const missing = assessments.map(a => ({
    number: a.assessment_number,
    current: a.photo_count,
    needed: 5 - a.photo_count
  }));

  console.log('Missing Photos:', JSON.stringify(missing, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Use Case 4: Calculate Monthly Statistics

```typescript
// Phase 1: Fetch
const claims = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      DATE_TRUNC('day', created_at) as day,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE status = 'completed') as completed
    FROM claims
    WHERE created_at >= $1 AND created_at < $2
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY day
  `,
  params: ['2025-10-01', '2025-11-01']
});

// Phase 2: Calculate Stats
const code = `
  const claims = ${JSON.stringify(claims)};

  const stats = {
    total: claims.reduce((sum, d) => sum + d.count, 0),
    completed: claims.reduce((sum, d) => sum + d.completed, 0),
    avg_per_day: claims.reduce((sum, d) => sum + d.count, 0) / claims.length,
    completion_rate: claims.reduce((sum, d) => sum + d.completed, 0) /
                     claims.reduce((sum, d) => sum + d.count, 0)
  };

  console.log(JSON.stringify(stats, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Use Case 5: Validate Assessment Workflow

```typescript
// Phase 1: Fetch
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      a.*,
      r.id as request_id,
      COUNT(DISTINCT a2.id) as assessment_count
    FROM assessments a
    INNER JOIN requests r ON a.request_id = r.id
    LEFT JOIN assessments a2 ON a2.request_id = r.id
    GROUP BY a.id, r.id
  `
});

// Phase 2: Validate
const code = `
  const assessments = ${JSON.stringify(assessments)};

  const violations = assessments.filter(a => a.assessment_count > 1);

  if (violations.length > 0) {
    console.log('VIOLATIONS: Multiple assessments per request');
    console.log(JSON.stringify(violations.map(v => ({
      request_id: v.request_id,
      assessment_count: v.assessment_count
    })), null, 2));
  } else {
    console.log('OK: One assessment per request constraint satisfied');
  }
`;

await mcp__ide__executeCode({ code });
```

---

**Last Updated**: November 9, 2025
**Version**: 1.0 (Architecture A)
**Status**: Active
