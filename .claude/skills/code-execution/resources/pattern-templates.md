# Code Execution Pattern Templates

Copy-paste ready templates for common data processing patterns. Replace placeholders with your specific logic.

---

## Template 1: Data Analysis Pipeline

### Use When:
- Calculating statistics
- Finding patterns
- Aggregating data

### Template:

```typescript
// ============================================
// Phase 1: Fetch Data
// ============================================

const data = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      -- SELECT YOUR FIELDS HERE
      id,
      field1,
      field2,
      jsonb_field
    FROM your_table
    WHERE created_at >= NOW() - INTERVAL '30 days'
      -- ADD YOUR WHERE CONDITIONS
    ORDER BY created_at DESC
    LIMIT 1000
  `
});

console.log(`Fetched ${data.length} records`);

// ============================================
// Phase 2: Process and Analyze
// ============================================

const code = `
  const data = ${JSON.stringify(data)};

  console.log(\`Processing \${data.length} records\`);

  // Step 1: Transform/parse data
  const processed = data.map(item => {
    // PARSE JSON FIELDS IF NEEDED
    const jsonData = JSON.parse(item.jsonb_field || '{}');

    // CALCULATE METRICS
    const metric = /* YOUR CALCULATION */;

    return {
      id: item.id,
      // YOUR TRANSFORMED FIELDS
      metric: metric
    };
  });

  // Step 2: Aggregate statistics
  const stats = {
    total: processed.length,
    // CALCULATE YOUR AGGREGATES
    avg: processed.reduce((sum, p) => sum + p.metric, 0) / processed.length,
    min: Math.min(...processed.map(p => p.metric)),
    max: Math.max(...processed.map(p => p.metric))
  };

  // Step 3: Identify outliers or special cases
  const special = processed.filter(p => /* YOUR CONDITION */);

  // Step 4: Generate output
  console.log('Statistics:', JSON.stringify(stats, null, 2));
  console.log('Special Cases:', JSON.stringify(special, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Placeholders to Replace:
- `your_table` - Your database table name
- `field1, field2` - Your column names
- `jsonb_field` - Your JSON column (if applicable)
- `WHERE conditions` - Your filtering logic
- `YOUR CALCULATION` - Your metric calculation
- `YOUR TRANSFORMED FIELDS` - Your output structure
- `YOUR AGGREGATES` - Your statistical calculations
- `YOUR CONDITION` - Your special case filter

---

## Template 2: Batch Validation

### Use When:
- Validating multiple records
- Identifying items needing updates
- Checking business rules

### Template:

```typescript
// ============================================
// Phase 1: Fetch with JOINs (Get All Needed Data)
// ============================================

const items = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      main.*,
      -- JOIN RELATED DATA
      COUNT(DISTINCT related1.id) as related1_count,
      COUNT(DISTINCT related2.id) as related2_count
    FROM your_main_table main
    LEFT JOIN related_table1 related1 ON related1.main_id = main.id
    LEFT JOIN related_table2 related2 ON related2.main_id = main.id
    WHERE main.status = 'pending'
      -- YOUR WHERE CONDITIONS
    GROUP BY main.id
    LIMIT 100
  `
});

console.log(`Found ${items.length} items to validate\n`);

// ============================================
// Phase 2: Validate in Code
// ============================================

const validationCode = `
  const items = ${JSON.stringify(items)};

  const validation = {
    valid: [],
    invalid: []
  };

  for (const item of items) {
    const reasons = [];

    // VALIDATION RULE 1
    if (/* YOUR CONDITION */) {
      reasons.push('Reason 1');
    }

    // VALIDATION RULE 2
    if (/* YOUR CONDITION */) {
      reasons.push('Reason 2');
    }

    // VALIDATION RULE 3
    if (/* YOUR CONDITION */) {
      reasons.push('Reason 3');
    }

    // Categorize
    if (reasons.length === 0) {
      validation.valid.push(item.id);
    } else {
      validation.invalid.push({ id: item.id, reasons });
    }
  }

  // Generate summary
  console.log('=== VALIDATION RESULTS ===\\n');
  console.log(\`Valid: \${validation.valid.length}\`);
  console.log(\`Invalid: \${validation.invalid.length}\`);
  console.log(\`Total: \${items.length}\\n\`);

  if (validation.invalid.length > 0) {
    console.log('Invalid Reasons Breakdown:\\n');
    const reasonCounts = validation.invalid.reduce((acc, item) => {
      item.reasons.forEach(r => {
        acc[r] = (acc[r] || 0) + 1;
      });
      return acc;
    }, {});

    for (const [reason, count] of Object.entries(reasonCounts)) {
      console.log(\`- \${reason}: \${count}\`);
    }
  }

  // Return results
  console.log('\\nValid IDs:', JSON.stringify(validation.valid));
`;

const result = await mcp__ide__executeCode({ code: validationCode });

// ============================================
// Phase 3: Apply Updates (MCP)
// ============================================

// Parse output to get valid IDs
const output = result.stdout;
const validIds = JSON.parse(output.split('Valid IDs:')[1].trim());

if (validIds.length > 0) {
  console.log(`\nUpdating ${validIds.length} valid items...`);

  await mcp__supabase__execute_sql({
    project_id: env.SUPABASE_PROJECT_ID,
    query: `
      UPDATE your_main_table
      SET
        status = 'updated_status',
        updated_at = NOW()
        -- YOUR UPDATE FIELDS
      WHERE id = ANY($1)
    `,
    params: [validIds]
  });

  console.log('Updates complete!');
}
```

### Placeholders to Replace:
- `your_main_table` - Main table name
- `related_table1, related_table2` - Related tables
- `status = 'pending'` - Your filter condition
- `YOUR CONDITION` - Validation rules
- `Reason 1, 2, 3` - Descriptive validation failure reasons
- `updated_status` - Target status after update
- `YOUR UPDATE FIELDS` - Additional fields to update

---

## Template 3: Cross-Source Correlation

### Use When:
- Combining Supabase + GitHub data
- Correlating multiple data sources
- Finding relationships

### Template:

```typescript
// ============================================
// Phase 1: Fetch from Multiple Sources (Parallel)
// ============================================

console.log('Fetching from multiple sources...\n');

const [source1Data, source2Data] = await Promise.all([
  // Source 1: Supabase
  mcp__supabase__execute_sql({
    project_id: env.SUPABASE_PROJECT_ID,
    query: `
      SELECT id, created_at, field1, field2
      FROM your_table1
      WHERE created_at >= NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
    `
  }),

  // Source 2: GitHub (or another Supabase query)
  mcp__github__list_pull_requests({
    owner: 'your-org',
    repo: 'your-repo',
    state: 'closed',
    perPage: 100
  })
]);

console.log(`Source 1: ${source1Data.length} items`);
console.log(`Source 2: ${source2Data.length} items\n`);

// ============================================
// Phase 2: Correlate in Code
// ============================================

const code = `
  const source1 = ${JSON.stringify(source1Data)};
  const source2 = ${JSON.stringify(source2Data)};

  // Filter source2 to same timeframe
  const timeframeDays = 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);

  const recentSource2 = source2.filter(item => {
    const itemDate = new Date(item.created_at || item.merged_at);
    return itemDate >= cutoffDate;
  });

  console.log(\`Recent Source 2 (last \${timeframeDays} days): \${recentSource2.length}\\n\`);

  // Group by time period (e.g., day)
  const source1ByDay = source1.reduce((acc, item) => {
    const day = item.created_at.split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  const source2ByDay = recentSource2.reduce((acc, item) => {
    const day = (item.created_at || item.merged_at).split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  // Combine
  const allDays = [...new Set([
    ...Object.keys(source1ByDay),
    ...Object.keys(source2ByDay)
  ])].sort();

  const correlation = allDays.map(day => ({
    date: day,
    source1_count: (source1ByDay[day] || []).length,
    source2_count: (source2ByDay[day] || []).length,
    // CALCULATE YOUR CORRELATION METRICS
    ratio: (source1ByDay[day] || []).length / ((source2ByDay[day] || []).length || 1)
  }));

  // Generate report
  console.log('=== CORRELATION ANALYSIS ===\\n');
  console.log('## Daily Breakdown\\n');

  for (const day of correlation) {
    console.log(\`### \${day.date}\`);
    console.log(\`- Source 1: \${day.source1_count}\`);
    console.log(\`- Source 2: \${day.source2_count}\`);
    console.log(\`- Ratio: \${day.ratio.toFixed(2)}\`);
    console.log('');
  }

  // Calculate overall statistics
  const avgSource1 = correlation.reduce((sum, c) => sum + c.source1_count, 0) / correlation.length;
  const avgSource2 = correlation.reduce((sum, c) => sum + c.source2_count, 0) / correlation.length;

  console.log('## Overall Statistics\\n');
  console.log(\`Average Source 1 per day: \${avgSource1.toFixed(1)}\`);
  console.log(\`Average Source 2 per day: \${avgSource2.toFixed(1)}\`);
`;

await mcp__ide__executeCode({ code });
```

### Placeholders to Replace:
- `your_table1` - Database table name
- `field1, field2` - Your database fields
- `your-org, your-repo` - GitHub organization/repo
- `timeframeDays` - Days to analyze
- `YOUR CORRELATION METRICS` - Your correlation calculations

---

## Template 4: Report Generation

### Use When:
- Creating formatted reports
- Generating Markdown/HTML
- Producing dashboards

### Template:

```typescript
// ============================================
// Phase 1: Fetch with JOINs
// ============================================

const reportStartDate = '2025-10-01';
const reportEndDate = '2025-11-01';

console.log(`Generating report for ${reportStartDate} to ${reportEndDate}\n`);

const data = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      main.*,
      -- JOIN RELATED DATA
      related1.name as related1_name,
      related2.name as related2_name
    FROM your_main_table main
    LEFT JOIN related_table1 related1 ON related1.id = main.related1_id
    LEFT JOIN related_table2 related2 ON related2.id = main.related2_id
    WHERE main.created_at >= $1 AND main.created_at < $2
    ORDER BY main.created_at DESC
  `,
  params: [reportStartDate, reportEndDate]
});

console.log(`Fetched ${data.length} records\n`);

// ============================================
// Phase 2: Generate Report
// ============================================

const code = `
  const data = ${JSON.stringify(data)};
  const startDate = '${reportStartDate}';
  const endDate = '${reportEndDate}';

  // Group by category
  const grouped = data.reduce((acc, item) => {
    const category = item.category || 'uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // Calculate metrics
  const metrics = {
    total: data.length,
    // YOUR METRIC CALCULATIONS
    completed: data.filter(d => d.status === 'completed').length,
    avg_duration: data.reduce((sum, d) => {
      const created = new Date(d.created_at);
      const updated = new Date(d.updated_at);
      return sum + (updated - created) / (1000 * 60 * 60); // hours
    }, 0) / data.length
  };

  // Generate Markdown report
  const report = \`
# YOUR REPORT TITLE

**Period**: \${startDate} to \${endDate}
**Generated**: \${new Date().toISOString()}

---

## Executive Summary

- **Total Records**: \${metrics.total}
- **Completed**: \${metrics.completed}
- **Average Duration**: \${Math.round(metrics.avg_duration * 10) / 10} hours
<!-- ADD YOUR SUMMARY METRICS -->

---

## Breakdown by Category

\${Object.entries(grouped)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([category, items]) => {
    const percentage = ((items.length / data.length) * 100).toFixed(1);
    return \`- **\${category}**: \${items.length} (\${percentage}%)\`;
  })
  .join('\\n')}

---

## Detailed Analysis

<!-- ADD YOUR DETAILED SECTIONS -->

\${Object.entries(grouped)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 5) // Top 5 categories
  .map(([category, items]) => \`
### \${category}

- Count: \${items.length}
- Avg Duration: \${Math.round(
    items.reduce((sum, i) => {
      const created = new Date(i.created_at);
      const updated = new Date(i.updated_at);
      return sum + (updated - created) / (1000 * 60 * 60);
    }, 0) / items.length * 10
  ) / 10}h
<!-- ADD CATEGORY-SPECIFIC METRICS -->
\`)
  .join('\\n')}

---

## Insights

<!-- ADD YOUR INSIGHTS -->
\${metrics.avg_duration < 24
  ? '✅ Excellent: Average duration under 24 hours'
  : metrics.avg_duration < 48
    ? '⚠️ Good: Average duration under 48 hours'
    : '❌ Needs Improvement: Average duration exceeds 48 hours'}

---

*Report generated by ClaimTech Analytics*
\`;

  console.log(report);
`;

await mcp__ide__executeCode({ code });
```

### Placeholders to Replace:
- `reportStartDate, reportEndDate` - Your date range
- `your_main_table` - Main table
- `related_table1, related_table2` - Related tables
- `YOUR REPORT TITLE` - Report name
- `YOUR METRIC CALCULATIONS` - Your metrics
- `YOUR SUMMARY METRICS` - Summary content
- `YOUR DETAILED SECTIONS` - Detailed analysis
- `category` - Your grouping field
- `YOUR INSIGHTS` - Insight rules

---

## Template 5: Multi-Step Transformation

### Use When:
- Reshaping data structures
- Parsing complex JSON
- Multi-level transformations

### Template:

```typescript
// ============================================
// Phase 1: Fetch Raw Data
// ============================================

const rawData = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      id,
      -- YOUR FIELDS
      metadata_jsonb,
      history_jsonb,
      related_data_jsonb
    FROM your_table
    WHERE updated_at >= NOW() - INTERVAL '1 day'
    LIMIT 1000
  `
});

console.log(`Fetched ${rawData.length} records for transformation\n`);

// ============================================
// Phase 2: Transform in Code
// ============================================

const code = `
  const rawData = ${JSON.stringify(rawData)};

  const transformed = rawData.map(item => {
    // Step 1: Parse JSON fields
    const metadata = JSON.parse(item.metadata_jsonb || '{}');
    const history = JSON.parse(item.history_jsonb || '[]');
    const relatedData = JSON.parse(item.related_data_jsonb || '[]');

    // Step 2: Extract values
    const field1 = metadata.field1 || 'default';
    const field2 = metadata.field2 || null;

    // Step 3: Calculate derived values
    const derivedValue1 = /* YOUR CALCULATION */;
    const derivedValue2 = /* YOUR CALCULATION */;

    // Step 4: Transform nested arrays
    const transformedHistory = history.map(h => ({
      // YOUR TRANSFORMATION
      timestamp: h.timestamp,
      value: h.value,
      formatted: /* YOUR FORMATTING */
    }));

    const transformedRelated = relatedData.map(r => ({
      // YOUR TRANSFORMATION
      id: r.id,
      calculated: /* YOUR CALCULATION */
    }));

    // Step 5: Build final structure
    return {
      id: item.id,
      // YOUR OUTPUT STRUCTURE
      metadata: {
        field1,
        field2,
        derived: derivedValue1
      },
      timeline: transformedHistory,
      related: transformedRelated,
      summary: {
        total: transformedHistory.length,
        latest: transformedHistory[transformedHistory.length - 1],
        avg: derivedValue2
      }
    };
  });

  // Validate transformations
  const valid = transformed.filter(t => /* YOUR VALIDATION */);
  const invalid = transformed.filter(t => /* YOUR VALIDATION */);

  console.log('=== TRANSFORMATION RESULTS ===\\n');
  console.log(\`Total: \${transformed.length}\`);
  console.log(\`Valid: \${valid.length}\`);
  console.log(\`Invalid: \${invalid.length}\\n\`);

  console.log('Transformed Data:', JSON.stringify(valid, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Placeholders to Replace:
- `your_table` - Table name
- `metadata_jsonb, history_jsonb` - Your JSON columns
- `YOUR CALCULATION` - Derived value calculations
- `YOUR TRANSFORMATION` - Nested data transformations
- `YOUR FORMATTING` - Value formatting logic
- `YOUR OUTPUT STRUCTURE` - Target data structure
- `YOUR VALIDATION` - Validation rules

---

## Template 6: Statistical Analysis

### Use When:
- Calculating averages, percentiles, correlations
- Performance metrics
- Trend analysis

### Template:

```typescript
// ============================================
// Phase 1: Fetch Data for Analysis
// ============================================

const data = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      group_by_field,
      numeric_field,
      timestamp_field,
      status_field
    FROM your_table
    WHERE created_at >= NOW() - INTERVAL '30 days'
    ORDER BY group_by_field, timestamp_field
  `
});

console.log(`Analyzing ${data.length} records\n`);

// ============================================
// Phase 2: Calculate Statistics
// ============================================

const code = `
  const data = ${JSON.stringify(data)};

  // Group by category
  const grouped = data.reduce((acc, item) => {
    const key = item.group_by_field;
    if (!acc[key]) {
      acc[key] = {
        key,
        items: [],
        values: []
      };
    }
    acc[key].items.push(item);
    acc[key].values.push(item.numeric_field);
    return acc;
  }, {});

  // Calculate statistics for each group
  const stats = Object.values(grouped).map(group => {
    const values = group.values.filter(v => v != null && !isNaN(v));
    const sorted = values.sort((a, b) => a - b);

    // Basic statistics
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = count > 0 ? sum / count : 0;
    const min = count > 0 ? Math.min(...values) : 0;
    const max = count > 0 ? Math.max(...values) : 0;

    // Percentiles
    const p25 = count > 0 ? sorted[Math.floor(count * 0.25)] : 0;
    const p50 = count > 0 ? sorted[Math.floor(count * 0.50)] : 0; // median
    const p75 = count > 0 ? sorted[Math.floor(count * 0.75)] : 0;
    const p90 = count > 0 ? sorted[Math.floor(count * 0.90)] : 0;
    const p95 = count > 0 ? sorted[Math.floor(count * 0.95)] : 0;

    // Variance and standard deviation
    const variance = count > 0
      ? values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / count
      : 0;
    const stdDev = Math.sqrt(variance);

    return {
      category: group.key,
      count,
      sum: Math.round(sum * 100) / 100,
      avg: Math.round(avg * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      median: Math.round(p50 * 100) / 100,
      percentiles: {
        p25: Math.round(p25 * 100) / 100,
        p50: Math.round(p50 * 100) / 100,
        p75: Math.round(p75 * 100) / 100,
        p90: Math.round(p90 * 100) / 100,
        p95: Math.round(p95 * 100) / 100
      },
      stdDev: Math.round(stdDev * 100) / 100,
      // ADD YOUR CUSTOM METRICS
      customMetric1: /* YOUR CALCULATION */,
      customMetric2: /* YOUR CALCULATION */
    };
  });

  // Sort by count descending
  stats.sort((a, b) => b.count - a.count);

  // Identify outliers (> 2 std deviations from mean)
  const overallAvg = stats.reduce((sum, s) => sum + s.avg, 0) / stats.length;
  const overallStdDev = Math.sqrt(
    stats.reduce((sum, s) => sum + Math.pow(s.avg - overallAvg, 2), 0) / stats.length
  );

  const outliers = stats.filter(s =>
    Math.abs(s.avg - overallAvg) > (2 * overallStdDev)
  );

  // Generate report
  console.log('=== STATISTICAL ANALYSIS ===\\n');
  console.log('## Summary Statistics\\n');

  for (const stat of stats) {
    console.log(\`### \${stat.category}\`);
    console.log(\`- Count: \${stat.count}\`);
    console.log(\`- Average: \${stat.avg}\`);
    console.log(\`- Median: \${stat.median}\`);
    console.log(\`- Min/Max: \${stat.min} / \${stat.max}\`);
    console.log(\`- Std Dev: \${stat.stdDev}\`);
    console.log(\`- P90/P95: \${stat.percentiles.p90} / \${stat.percentiles.p95}\`);
    console.log('');
  }

  if (outliers.length > 0) {
    console.log('## Outliers Detected\\n');
    for (const outlier of outliers) {
      console.log(\`- **\${outlier.category}**: avg=\${outlier.avg} (overall avg=\${Math.round(overallAvg * 100) / 100})\`);
    }
  }

  console.log('\\nFull Stats:', JSON.stringify(stats, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Placeholders to Replace:
- `your_table` - Table name
- `group_by_field` - Grouping column
- `numeric_field` - Value to analyze
- `timestamp_field, status_field` - Additional fields
- `YOUR CALCULATION` - Custom metric calculations

---

## General Template Structure

All templates follow this pattern:

```typescript
// Phase 1: Fetch
const data = await mcp__*__*({...});

// Phase 2: Process
const code = `
  const data = ${JSON.stringify(data)};

  // Your processing logic

  console.log(JSON.stringify(result, null, 2));
`;

await mcp__ide__executeCode({ code });
```

### Key Points:
1. Always fetch in Phase 1
2. Always embed with `${JSON.stringify(data)}`
3. Always return structured JSON
4. Always handle errors
5. Always log progress

---

**Last Updated**: November 9, 2025
**Version**: 1.0
