# Code Execution Patterns

**Last Updated**: November 9, 2025
**Version**: 2.0

---

## Overview

This document contains common code execution patterns for ClaimTech data processing tasks. Each pattern includes a real-world scenario, complete implementation, and expected output.

---

## Architecture Note

**IMPORTANT**: Code execution uses a two-phase pattern:

1. **Phase 1 - Data Fetching**: Claude calls MCP tools (`mcp__supabase__*`, `mcp__github__*`, etc.) to gather data
2. **Phase 2 - Data Processing**: Claude embeds data into code and executes processing via `mcp__ide__executeCode`

**Why this pattern?**
- Code executing inside `mcp__ide__executeCode` runs in an isolated Deno sandbox
- This sandbox does NOT have access to MCP tools
- All data must be fetched BEFORE code execution
- Code processes pre-fetched data without making additional MCP calls

**All patterns below follow this two-phase approach.**

---

## When to Use Code Execution vs. Direct Tool Calls

### ✅ Use Code Execution When:

1. **Multiple data transformations** needed
   - Fetch → filter → map → aggregate → format

2. **Complex filtering/aggregation** required
   - Custom calculations, statistical analysis

3. **Batch processing** many items
   - Process 10+ records, analyze 100+ files

4. **Data analysis** with calculations
   - Averages, percentages, correlations

5. **Multi-step workflows** with conditional logic
   - If/else branching, validation logic

6. **Report generation** with formatting
   - Markdown/HTML output, charts, summaries

### ❌ Use Direct Tool Calls When:

1. **Single operation** (e.g., create one file)
2. **Simple CRUD** (e.g., update one record)
3. **Tool-specific features** not exposed in API
4. **Immediate feedback** needed (streaming)

---

## Pattern 1: Data Analysis Pipeline

### Scenario
Analyze assessment completion times by stage, calculating average duration and identifying bottlenecks.

### Implementation

```typescript
// ============================================
// Phase 1: Fetch Data (Claude calls MCP)
// ============================================

const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      id,
      stage,
      created_at,
      updated_at,
      stage_history
    FROM assessments
    WHERE stage IN ('completed', 'archived')
      AND created_at >= NOW() - INTERVAL '30 days'
    ORDER BY updated_at DESC
    LIMIT 1000
  `
});

console.log(`Fetched ${assessments.length} assessments`);

// ============================================
// Phase 2: Process Data (Claude executes code)
// ============================================

const analysisCode = `
  // Data embedded by Claude
  const assessments = ${JSON.stringify(assessments)};

  console.log(\`Processing \${assessments.length} assessments\`);

  // Step 1: Calculate stage durations
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

  // Step 2: Aggregate statistics by stage
  const stageNames = [
    'inspection_scheduled',
    'inspection_in_progress',
    'report_in_progress',
    'pending_review'
  ];

  const stats = stageNames.map(stage => {
    const durations = stageDurations
      .map(d => d.stages[stage])
      .filter(d => d !== undefined && d > 0);

    if (durations.length === 0) {
      return { stage, count: 0, avg_hours: 0, min_hours: 0, max_hours: 0, median_hours: 0 };
    }

    const sorted = durations.sort((a, b) => a - b);

    return {
      stage,
      count: durations.length,
      avg_hours: Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length * 10) / 10,
      min_hours: Math.round(Math.min(...durations) * 10) / 10,
      max_hours: Math.round(Math.max(...durations) * 10) / 10,
      median_hours: Math.round(sorted[Math.floor(sorted.length / 2)] * 10) / 10
    };
  });

  // Step 3: Identify bottlenecks (stages with > 24h average)
  const bottlenecks = stats.filter(s => s.avg_hours > 24);

  // Step 4: Generate report
  console.log('\\n=== ASSESSMENT STAGE DURATION ANALYSIS ===\\n');
  console.log('Period: Last 30 days');
  console.log(\`Total Assessments Analyzed: \${assessments.length}\\n\`);

  console.log('## Stage Statistics\\n');
  for (const stat of stats) {
    console.log(\`### \${stat.stage}\`);
    console.log(\`- Count: \${stat.count}\`);
    console.log(\`- Average: \${stat.avg_hours}h\`);
    console.log(\`- Min: \${stat.min_hours}h\`);
    console.log(\`- Max: \${stat.max_hours}h\`);
    console.log(\`- Median: \${stat.median_hours}h\`);
    console.log('');
  }

  if (bottlenecks.length > 0) {
    console.log('## ⚠️ Bottlenecks Detected\\n');
    console.log('Stages with average duration > 24 hours:\\n');
    for (const b of bottlenecks) {
      console.log(\`- **\${b.stage}**: \${b.avg_hours}h average\`);
    }
  } else {
    console.log('## ✅ No Bottlenecks\\n');
    console.log('All stages are completing within 24 hours on average.');
  }
`;

await mcp__ide__executeCode({ code: analysisCode });
```

### Expected Output

```
Fetched 237 assessments

=== ASSESSMENT STAGE DURATION ANALYSIS ===

Period: Last 30 days
Total Assessments Analyzed: 237

## Stage Statistics

### inspection_scheduled
- Count: 237
- Average: 18.3h
- Min: 2.1h
- Max: 72.5h
- Median: 16.5h

### inspection_in_progress
- Count: 235
- Average: 4.2h
- Min: 1.3h
- Max: 12.8h
- Median: 3.8h

### report_in_progress
- Count: 229
- Average: 31.5h
- Min: 8.2h
- Max: 96.3h
- Median: 28.4h

### pending_review
- Count: 227
- Average: 6.1h
- Min: 0.5h
- Max: 24.2h
- Median: 4.3h

## ⚠️ Bottlenecks Detected

Stages with average duration > 24 hours:

- **report_in_progress**: 31.5h average
```

---

## Pattern 2: Batch Operations with Validation

### Scenario
Update multiple assessments from 'pending_review' to 'completed', but only if they meet validation criteria (sufficient photos, engineer assigned, etc.).

### Implementation

```typescript
// ============================================
// Phase 1: Fetch Data (Claude calls MCP)
// ============================================

// Fetch assessments with related counts
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      a.id,
      a.stage,
      a.engineer_id,
      COUNT(DISTINCT p.id) FILTER (WHERE p.label IS NOT NULL) as labeled_photo_count,
      COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'open') as open_issue_count
    FROM assessments a
    LEFT JOIN assessment_photos p ON p.assessment_id = a.id
    LEFT JOIN assessment_issues i ON i.assessment_id = a.id
    WHERE a.stage = 'pending_review'
    GROUP BY a.id
    ORDER BY a.created_at ASC
    LIMIT 100
  `
});

console.log(`Found ${assessments.length} assessments in pending_review\n`);

// ============================================
// Phase 2: Identify Valid Updates (Claude executes code)
// ============================================

const validationCode = `
  // Data embedded by Claude
  const assessments = ${JSON.stringify(assessments)};

  const results = {
    toUpdate: [],
    skipped: []
  };

  for (const assessment of assessments) {
    // Validation 1: Check photo count
    if (assessment.labeled_photo_count < 5) {
      results.skipped.push({
        id: assessment.id,
        reason: \`Insufficient labeled photos (\${assessment.labeled_photo_count}/5)\`
      });
      continue;
    }

    // Validation 2: Check engineer assignment
    if (!assessment.engineer_id) {
      results.skipped.push({
        id: assessment.id,
        reason: 'No engineer assigned'
      });
      continue;
    }

    // Validation 3: Check for pending issues
    if (assessment.open_issue_count > 0) {
      results.skipped.push({
        id: assessment.id,
        reason: \`\${assessment.open_issue_count} open issues remaining\`
      });
      continue;
    }

    // All validations passed
    results.toUpdate.push(assessment.id);
  }

  // Generate summary report
  console.log('=== VALIDATION RESULTS ===\\n');
  console.log(\`✅ Valid for Update: \${results.toUpdate.length}\`);
  console.log(\`⏭️ Skipped: \${results.skipped.length}\`);
  console.log(\`📊 Total: \${assessments.length}\\n\`);

  if (results.skipped.length > 0) {
    console.log('## Skipped Assessments\\n');
    const skipReasons = results.skipped.reduce((acc, s) => {
      acc[s.reason] = (acc[s.reason] || 0) + 1;
      return acc;
    }, {});

    for (const [reason, count] of Object.entries(skipReasons)) {
      console.log(\`- \${reason}: \${count}\`);
    }
    console.log('');
  }

  // Return IDs to update
  console.log('IDs to update:');
  console.log(JSON.stringify(results.toUpdate));
`;

const validationResult = await mcp__ide__executeCode({ code: validationCode });

// Extract IDs from output
const idsToUpdate = JSON.parse(
  validationResult.output.split('IDs to update:')[1].trim()
);

// ============================================
// Phase 3: Apply Updates (Claude calls MCP)
// ============================================

const updateResults = { success: [], failed: [] };

for (const id of idsToUpdate) {
  try {
    await mcp__supabase__execute_sql({
      project_id: env.SUPABASE_PROJECT_ID,
      query: `
        UPDATE assessments
        SET
          stage = 'completed',
          updated_at = NOW(),
          stage_history = jsonb_insert(
            COALESCE(stage_history, '[]'::jsonb),
            '{0}',
            jsonb_build_object(
              'stage', 'completed',
              'timestamp', NOW()::text,
              'automated', true
            ),
            true
          )
        WHERE id = $1
      `,
      params: [id]
    });

    updateResults.success.push(id);
  } catch (error) {
    updateResults.failed.push({ id, error: error.message });
  }
}

console.log('\n=== BATCH UPDATE RESULTS ===\n');
console.log(`✅ Successful: ${updateResults.success.length}`);
console.log(`❌ Failed: ${updateResults.failed.length}`);

if (updateResults.failed.length > 0) {
  console.log('\n## Failed Updates\n');
  for (const f of updateResults.failed) {
    console.log(`- ${f.id}: ${f.error}`);
  }
}
```

### Expected Output

```
Found 47 assessments in pending_review

=== VALIDATION RESULTS ===

✅ Valid for Update: 32
⏭️ Skipped: 15
📊 Total: 47

## Skipped Assessments

- Insufficient labeled photos (3/5): 8
- No engineer assigned: 4
- 3 open issues remaining: 3

=== BATCH UPDATE RESULTS ===

✅ Successful: 32
❌ Failed: 0
```

---

## Pattern 3: Cross-Source Data Correlation

### Scenario
Correlate GitHub PR activity with assessment completions to identify if development activity impacts assessment throughput.

### Implementation

```typescript
// ============================================
// Phase 1: Fetch Data (Claude calls MCP in parallel)
// ============================================

console.log('Fetching data from Supabase and GitHub...\n');

const [assessments, prs] = await Promise.all([
  mcp__supabase__execute_sql({
    project_id: env.SUPABASE_PROJECT_ID,
    query: `
      SELECT id, created_at, stage, updated_at
      FROM assessments
      WHERE created_at >= NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
    `
  }),
  mcp__github__list_pull_requests({
    owner: 'claimtech',
    repo: 'platform',
    state: 'closed',
    perPage: 100
  })
]);

console.log(`Assessments: ${assessments.length}`);
console.log(`PRs: ${prs.length}\n`);

// ============================================
// Phase 2: Correlate Data (Claude executes code)
// ============================================

const correlationCode = `
  // Data embedded by Claude
  const assessments = ${JSON.stringify(assessments)};
  const prs = ${JSON.stringify(prs)};

  // Filter PRs to same 7-day timeframe
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentPRs = prs.filter(pr => {
    const mergedAt = new Date(pr.merged_at || pr.closed_at);
    return mergedAt >= sevenDaysAgo;
  });

  console.log(\`Recent PRs (last 7 days): \${recentPRs.length}\\n\`);

  // Group assessments by day
  const assessmentsByDay = {};
  for (const a of assessments) {
    const day = a.created_at.split('T')[0];
    if (!assessmentsByDay[day]) assessmentsByDay[day] = [];
    assessmentsByDay[day].push(a);
  }

  // Group PRs by day
  const prsByDay = {};
  for (const pr of recentPRs) {
    const day = (pr.merged_at || pr.closed_at).split('T')[0];
    if (!prsByDay[day]) prsByDay[day] = [];
    prsByDay[day].push(pr);
  }

  // Correlate by day
  const allDays = [...new Set([
    ...Object.keys(assessmentsByDay),
    ...Object.keys(prsByDay)
  ])].sort();

  const correlation = allDays.map(day => ({
    date: day,
    assessments_created: (assessmentsByDay[day] || []).length,
    prs_merged: (prsByDay[day] || []).length,
    pr_titles: (prsByDay[day] || []).map(pr => pr.title)
  }));

  // Calculate correlation coefficient
  const assessmentCounts = correlation.map(c => c.assessments_created);
  const prCounts = correlation.map(c => c.prs_merged);

  const avgAssessments = assessmentCounts.reduce((sum, n) => sum + n, 0) / assessmentCounts.length;
  const avgPRs = prCounts.reduce((sum, n) => sum + n, 0) / prCounts.length;

  let numerator = 0;
  let denomAssessments = 0;
  let denomPRs = 0;

  for (let i = 0; i < correlation.length; i++) {
    const diffA = assessmentCounts[i] - avgAssessments;
    const diffP = prCounts[i] - avgPRs;
    numerator += diffA * diffP;
    denomAssessments += diffA * diffA;
    denomPRs += diffP * diffP;
  }

  const correlationCoef = numerator / Math.sqrt(denomAssessments * denomPRs);

  // Generate report
  console.log('=== DEVELOPMENT ACTIVITY CORRELATION ===\\n');
  console.log('## Daily Breakdown\\n');

  for (const day of correlation) {
    console.log(\`### \${day.date}\`);
    console.log(\`- Assessments Created: \${day.assessments_created}\`);
    console.log(\`- PRs Merged: \${day.prs_merged}\`);
    if (day.pr_titles.length > 0) {
      console.log(\`- PR Titles:\`);
      day.pr_titles.forEach(title => console.log(\`  - \${title}\`));
    }
    console.log('');
  }

  console.log('## Correlation Analysis\\n');
  console.log(\`Correlation Coefficient: \${correlationCoef.toFixed(3)}\\n\`);

  if (correlationCoef > 0.5) {
    console.log('✅ **Strong Positive Correlation**');
    console.log('More PR merges correlate with more assessment creations.');
  } else if (correlationCoef < -0.5) {
    console.log('⚠️ **Strong Negative Correlation**');
    console.log('More PR merges correlate with fewer assessment creations.');
  } else {
    console.log('ℹ️ **Weak/No Correlation**');
    console.log('PR activity does not significantly correlate with assessment volume.');
  }
`;

await mcp__ide__executeCode({ code: correlationCode });
```

### Expected Output

```
Fetching data from Supabase and GitHub...

Assessments: 156
PRs: 23

Recent PRs (last 7 days): 18

=== DEVELOPMENT ACTIVITY CORRELATION ===

## Daily Breakdown

### 2025-11-03
- Assessments Created: 18
- PRs Merged: 1
- PR Titles:
  - fix: resolve photo viewer navigation bug

### 2025-11-04
- Assessments Created: 25
- PRs Merged: 3
- PR Titles:
  - feat: add inline photo labeling
  - fix: assessment stage update race condition
  - docs: update migration guide

...

## Correlation Analysis

Correlation Coefficient: 0.127

ℹ️ **Weak/No Correlation**
PR activity does not significantly correlate with assessment volume.
```

---

## Pattern 4: Report Generation

### Scenario
Generate comprehensive monthly claims report with statistics, trends, and insights.

### Implementation

```typescript
// ============================================
// Phase 1: Fetch Data (Claude calls MCP)
// ============================================

const startDate = '2025-10-01';
const endDate = '2025-11-01';

console.log(`Generating report for ${startDate} to ${endDate}\n`);

// Fetch claims data with related information
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
  params: [startDate, endDate]
});

console.log(`Fetched ${claims.length} claims\n`);

// ============================================
// Phase 2: Generate Report (Claude executes code)
// ============================================

const reportCode = `
  // Data embedded by Claude
  const claims = ${JSON.stringify(claims)};
  const startDate = '${startDate}';
  const endDate = '${endDate}';

  // Group by status
  const grouped = claims.reduce((acc, claim) => {
    const status = claim.assessment_stage || 'no_assessment';
    if (!acc[status]) acc[status] = [];
    acc[status].push(claim);
    return acc;
  }, {});

  // Calculate engineer performance
  const engineerStats = {};

  for (const claim of claims) {
    if (!claim.engineer_name || !claim.assessment_created) continue;

    if (!engineerStats[claim.engineer_name]) {
      engineerStats[claim.engineer_name] = { count: 0, totalHours: 0 };
    }

    engineerStats[claim.engineer_name].count++;

    if (claim.assessment_updated) {
      const created = new Date(claim.assessment_created);
      const updated = new Date(claim.assessment_updated);
      const hours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
      engineerStats[claim.engineer_name].totalHours += hours;
    }
  }

  // Calculate average completion time for completed assessments
  const completedClaims = claims.filter(c =>
    c.assessment_stage === 'completed' && c.assessment_created && c.assessment_updated
  );

  const avgCompletionHours = completedClaims.length > 0
    ? completedClaims.reduce((sum, c) => {
        const created = new Date(c.assessment_created);
        const updated = new Date(c.assessment_updated);
        return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
      }, 0) / completedClaims.length
    : 0;

  // Generate Markdown report
  const markdown = \`
# Monthly Claims Report

**Period**: \${startDate} to \${endDate}
**Generated**: \${new Date().toISOString()}

---

## Executive Summary

- **Total Claims**: \${claims.length}
- **Completed Assessments**: \${completedClaims.length}
- **Average Completion Time**: \${Math.round(avgCompletionHours * 10) / 10} hours
- **Active Engineers**: \${Object.keys(engineerStats).length}

---

## Claims by Status

\${Object.entries(grouped)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([status, items]) => {
    const percentage = ((items.length / claims.length) * 100).toFixed(1);
    return \`- **\${status}**: \${items.length} (\${percentage}%)\`;
  })
  .join('\\n')}

---

## Engineer Performance

\${Object.entries(engineerStats)
  .sort((a, b) => b[1].count - a[1].count)
  .map(([name, stats]) => {
    const avgHours = stats.count > 0
      ? Math.round(stats.totalHours / stats.count * 10) / 10
      : 0;
    return \`### \${name}
- **Assessments**: \${stats.count}
- **Avg Time**: \${avgHours} hours\`;
  })
  .join('\\n\\n')}

---

## Top Clients

\${Object.entries(
  claims.reduce((acc, c) => {
    if (c.client_name) {
      acc[c.client_name] = (acc[c.client_name] || 0) + 1;
    }
    return acc;
  }, {})
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([name, count], idx) => \`\${idx + 1}. **\${name}**: \${count} claims\`)
  .join('\\n')}

---

## Insights

\${avgCompletionHours < 24
  ? '✅ **Excellent**: Average completion time is under 24 hours.'
  : avgCompletionHours < 48
    ? '⚠️ **Good**: Average completion time is under 48 hours, but could be improved.'
    : '❌ **Needs Improvement**: Average completion time exceeds 48 hours.'}

\${completedClaims.length / claims.length > 0.8
  ? '✅ **High Completion Rate**: Over 80% of claims have completed assessments.'
  : '⚠️ **Low Completion Rate**: Less than 80% of claims have completed assessments.'}

---

*Report generated by ClaimTech Analytics*
\`;

  console.log(markdown);
`;

await mcp__ide__executeCode({ code: reportCode });
```

### Expected Output

```
Generating report for 2025-10-01 to 2025-11-01

Fetched 342 claims

# Monthly Claims Report

**Period**: 2025-10-01 to 2025-11-01
**Generated**: 2025-11-09T15:34:21.123Z

---

## Executive Summary

- **Total Claims**: 342
- **Completed Assessments**: 287
- **Average Completion Time**: 28.4 hours
- **Active Engineers**: 8

---

## Claims by Status

- **completed**: 287 (83.9%)
- **pending_review**: 23 (6.7%)
- **report_in_progress**: 18 (5.3%)
- **no_assessment**: 14 (4.1%)

---

## Engineer Performance

### John Smith
- **Assessments**: 89
- **Avg Time**: 24.3 hours

### Sarah Johnson
- **Assessments**: 76
- **Avg Time**: 26.8 hours

...

---

## Insights

⚠️ **Good**: Average completion time is under 48 hours, but could be improved.

✅ **High Completion Rate**: Over 80% of claims have completed assessments.

---

*Report generated by ClaimTech Analytics*
```

---

## Pattern 5: Error Handling with Graceful Degradation

### Scenario
Fetch data from multiple sources (database, GitHub) and provide partial results if some sources fail.

### Implementation

```typescript
// ============================================
// Phase 1: Fetch Data with Error Handling (Claude calls MCP)
// ============================================

const results = {
  database: null,
  github: null,
  errors: []
};

// Try database
console.log('Fetching from database...');
try {
  results.database = await mcp__supabase__execute_sql({
    project_id: env.SUPABASE_PROJECT_ID,
    query: 'SELECT COUNT(*) as count FROM assessments'
  });
  console.log('✅ Database: Success');
} catch (error) {
  results.errors.push({
    source: 'database',
    error: error.message
  });
  console.log('❌ Database: Failed');
}

// Try GitHub
console.log('Fetching from GitHub...');
try {
  results.github = await mcp__github__list_pull_requests({
    owner: 'claimtech',
    repo: 'platform',
    state: 'open'
  });
  console.log('✅ GitHub: Success');
} catch (error) {
  results.errors.push({
    source: 'github',
    error: error.message
  });
  console.log('❌ GitHub: Failed');
}

// ============================================
// Phase 2: Process Partial Results (Claude executes code)
// ============================================

const processingCode = `
  // Data embedded by Claude
  const results = ${JSON.stringify(results)};

  console.log('\\n=== RESULTS ===\\n');

  if (results.database || results.github) {
    console.log('✅ Partial results available:\\n');

    if (results.database) {
      console.log(\`- Database: \${results.database[0].count} assessments\`);
    }

    if (results.github) {
      console.log(\`- GitHub: \${results.github.length} open PRs\`);
    }

    if (results.errors.length > 0) {
      console.log('\\n⚠️ Some sources failed:');
      for (const err of results.errors) {
        console.log(\`- \${err.source}: \${err.error}\`);
      }
    }
  } else {
    console.log('❌ All sources failed:\\n');
    for (const err of results.errors) {
      console.log(\`- \${err.source}: \${err.error}\`);
    }
  }
`;

await mcp__ide__executeCode({ code: processingCode });
```

---

## Pattern 6: Performance Optimization

### Scenario
Optimize slow queries by using parallel execution, efficient querying, and batch operations.

### Implementation

```typescript
// ============================================
// Phase 1: Fetch Data (Claude calls MCP)
// ============================================

// ❌ BAD: Sequential queries (SLOW)
console.log('=== BAD APPROACH (Sequential) ===\n');
const start1 = Date.now();

const assessments1 = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: 'SELECT * FROM assessments LIMIT 100'
});

const engineers1 = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: 'SELECT * FROM engineers'
});

const clients1 = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: 'SELECT * FROM clients'
});

console.log(`Time: ${Date.now() - start1}ms\n`);

// ✅ GOOD: Parallel queries (FAST)
console.log('=== GOOD APPROACH (Parallel) ===\n');
const start2 = Date.now();

const [assessments2, engineers2, clients2] = await Promise.all([
  mcp__supabase__execute_sql({
    project_id: env.SUPABASE_PROJECT_ID,
    query: 'SELECT * FROM assessments LIMIT 100'
  }),
  mcp__supabase__execute_sql({
    project_id: env.SUPABASE_PROJECT_ID,
    query: 'SELECT * FROM engineers'
  }),
  mcp__supabase__execute_sql({
    project_id: env.SUPABASE_PROJECT_ID,
    query: 'SELECT * FROM clients'
  })
]);

console.log(`Time: ${Date.now() - start2}ms`);
console.log(`Improvement: ${Math.round((1 - (Date.now() - start2) / (Date.now() - start1)) * 100)}% faster\n`);

// ❌ BAD: N+1 queries
console.log('=== BAD APPROACH (N+1 Queries) ===\n');
const start3 = Date.now();

const assessments3 = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: 'SELECT * FROM assessments LIMIT 10'
});

for (const a of assessments3) {
  await mcp__supabase__execute_sql({
    project_id: env.SUPABASE_PROJECT_ID,
    query: 'SELECT * FROM engineers WHERE id = $1',
    params: [a.engineer_id]
  });
}

console.log(`Time: ${Date.now() - start3}ms\n`);

// ✅ GOOD: Single JOIN query
console.log('=== GOOD APPROACH (Single JOIN) ===\n');
const start4 = Date.now();

const enriched = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT a.*, e.name as engineer_name
    FROM assessments a
    LEFT JOIN engineers e ON a.engineer_id = e.id
    LIMIT 10
  `
});

console.log(`Time: ${Date.now() - start4}ms`);
console.log(`Improvement: ${Math.round((1 - (Date.now() - start4) / (Date.now() - start3)) * 100)}% faster\n`);
```

---

## Best Practices Summary

### 1. Two-Phase Pattern
```typescript
// Phase 1: Fetch with MCP
const data = await mcp__supabase__execute_sql({ query: '...' });

// Phase 2: Process with code
const code = `
  const data = ${JSON.stringify(data)};
  // Processing logic here
`;
await mcp__ide__executeCode({ code });
```

### 2. Use Parallel Fetching
```typescript
const [data1, data2, data3] = await Promise.all([
  mcp__supabase__execute_sql({ query: 'query1' }),
  mcp__supabase__execute_sql({ query: 'query2' }),
  mcp__github__list_pull_requests({ ... })
]);
```

### 3. Handle Errors Gracefully
```typescript
const results = { success: [], errors: [] };

try {
  const data = await mcp__supabase__execute_sql({ query: '...' });
  results.success = data;
} catch (error) {
  results.errors.push({ source: 'database', error: error.message });
}
```

### 4. Log Progress for Long Operations
```typescript
const code = `
  for (let i = 0; i < items.length; i++) {
    console.log(\`Processing \${i + 1}/\${items.length}...\`);
    // Process item
  }
`;
```

### 5. Return Structured Results
```typescript
const code = `
  const results = {
    success: true,
    data: processedData,
    errors: [],
    metadata: {
      total: items.length,
      processed: successful.length,
      failed: errors.length
    }
  };

  console.log(JSON.stringify(results));
`;
```

### 6. Validate Inputs in Code
```typescript
const code = `
  const assessments = ${JSON.stringify(assessments)};

  for (const a of assessments) {
    if (!a.id) {
      console.error('Invalid assessment: missing ID');
      continue;
    }

    // Process valid assessment
  }
`;
```

### 7. Optimize SQL Queries
```typescript
// Use JOINs instead of N+1 queries
// Use indexes for filtering
// Limit result sets appropriately
// Use aggregations in SQL instead of JavaScript

const data = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT a.*, COUNT(p.id) as photo_count
    FROM assessments a
    LEFT JOIN photos p ON p.assessment_id = a.id
    GROUP BY a.id
    LIMIT 100
  `
});
```

### 8. Embed Data Efficiently
```typescript
// For large datasets, select only needed fields
const data = await mcp__supabase__execute_sql({
  query: 'SELECT id, stage, created_at FROM assessments' // Not SELECT *
});

const code = `const data = ${JSON.stringify(data)}; ...`;
```

---

## Token Efficiency Comparison

### Pattern 1 (Data Analysis)
- **Traditional**: ~3000 tokens (5 MCP calls + processing in conversation)
- **Two-Phase**: ~800 tokens (1 MCP fetch + 1 code execution)
- **Savings**: 73%

### Pattern 2 (Batch Updates)
- **Traditional**: ~8000 tokens (10+ MCP calls + validation)
- **Two-Phase**: ~1200 tokens (2 MCP fetches + 1 code + updates)
- **Savings**: 85%

### Pattern 3 (Cross-Source)
- **Traditional**: ~5000 tokens (6 MCP calls + correlation)
- **Two-Phase**: ~1000 tokens (2 parallel MCP + 1 code)
- **Savings**: 80%

### Pattern 4 (Report Generation)
- **Traditional**: ~6000 tokens (8 MCP calls + formatting)
- **Two-Phase**: ~1000 tokens (1 MCP fetch + 1 code)
- **Savings**: 83%

**Overall Token Efficiency**: 73-85% reduction for multi-step workflows

---

## Related Documentation

- **Architecture**: `.agent/System/code_execution_architecture.md`
- **API Reference**: `.agent/System/mcp_code_api_reference.md`
- **Usage Guide**: `.agent/SOP/using_code_executor.md`

---

**Document Version**: 2.0
**Last Review**: November 9, 2025
**Next Review**: December 2025
