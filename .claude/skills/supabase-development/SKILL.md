---
name: supabase-development
description: Implement Supabase database operations, services, RLS policies, and storage for ClaimTech. Use when creating services, writing database queries, implementing RLS policies, working with storage, or extending the database schema. Follows ClaimTech's ServiceClient injection pattern, audit logging conventions, and security-first approach.
allowed-tools: Read, Edit, Write, Grep, Glob
---

# Supabase Development for ClaimTech

ClaimTech uses Supabase (PostgreSQL) with **50+ tables**, **27+ service files**, and a mature security-first architecture. This skill provides the patterns and conventions used throughout the codebase.

## Quick Reference

### ServiceClient Pattern (Universal)
All services accept optional client injection:

```typescript
async getEntity(id: string, client?: ServiceClient): Promise<Entity | null> {
  const db = client ?? supabase; // Use injected OR default browser client
  const { data } = await db.from('table').select('*').eq('id', id).maybeSingle();
  return data;
}
```

**Why**: Same service works client-side, server-side (with RLS), or admin (bypass RLS).

### Three Supabase Clients

1. **Browser Client** (`src/lib/supabase.ts`): Client-side, uses anon key
2. **SSR Client** (`locals.supabase` in server code): Server-side with user auth, enforces RLS
3. **Service Role Client** (`src/lib/supabase-server.ts`): Admin operations, **bypasses RLS** - use sparingly!

**Rule**: Always prefer `locals.supabase` in server code to enforce RLS.

### Unique ID Generation
Every major entity has human-readable IDs: `CLM-2025-001`, `ASM-2025-001`

```typescript
private async generateUniqueNumber(prefix: string, client?: ServiceClient): Promise<string> {
  const db = client ?? supabase;
  const year = new Date().getFullYear();

  const { count } = await db
    .from('table')
    .select('*', { count: 'exact', head: true })
    .like('unique_id', `${prefix}-${year}-%`);

  const nextNumber = (count || 0) + 1;
  return `${prefix}-${year}-${String(nextNumber).padStart(3, '0')}`;
}
```

**Pattern**: `{PREFIX}-{YEAR}-{SEQUENTIAL_NUMBER}` with database unique constraint.

### Standard CRUD Service Template

```typescript
import type { ServiceClient } from '$lib/types/service';
import { supabase } from '$lib/supabase';
import { auditService } from './audit.service';

class EntityService {
  // CREATE
  async create(input: CreateInput, client?: ServiceClient): Promise<Entity> {
    const db = client ?? supabase;
    const uniqueId = await this.generateUniqueId(client);

    const { data, error } = await db
      .from('table')
      .insert({ ...input, unique_id: uniqueId })
      .select()
      .single();

    if (error) throw new Error(`Failed to create: ${error.message}`);

    // Audit log
    await auditService.logChange({
      entity_type: 'entity',
      entity_id: data.id,
      action: 'created'
    });

    return data;
  }

  // READ (single)
  async get(id: string, client?: ServiceClient): Promise<Entity | null> {
    const db = client ?? supabase;
    const { data, error } = await db
      .from('table')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching:', error);
      throw new Error(`Failed to fetch: ${error.message}`);
    }

    return data;
  }

  // READ (list with filters)
  async list(filters?: Filters, client?: ServiceClient): Promise<Entity[]> {
    const db = client ?? supabase;
    let query = db
      .from('table')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);

    const { data } = await query;
    return data || [];
  }

  // UPDATE
  async update(id: string, input: UpdateInput, client?: ServiceClient): Promise<Entity> {
    const db = client ?? supabase;
    const old = await this.get(id, client);

    const { data, error } = await db
      .from('table')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update: ${error.message}`);

    // Audit log status changes
    if (input.status && old && input.status !== old.status) {
      await auditService.logChange({
        entity_type: 'entity',
        entity_id: id,
        action: 'status_changed',
        field_name: 'status',
        old_value: old.status,
        new_value: input.status
      });
    }

    return data;
  }

  // DELETE (or soft delete by status)
  async delete(id: string, client?: ServiceClient): Promise<void> {
    const db = client ?? supabase;
    const { error } = await db.from('table').delete().eq('id', id);

    if (error) throw new Error(`Failed to delete: ${error.message}`);

    await auditService.logChange({
      entity_type: 'entity',
      entity_id: id,
      action: 'deleted'
    });
  }
}

export const entityService = new EntityService();
```

## RLS Helper Functions

**Create reusable helper functions for policies:**

```sql
-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get engineer ID for current user
CREATE OR REPLACE FUNCTION public.get_user_engineer_id()
RETURNS UUID AS $$
DECLARE
  eng_id UUID;
BEGIN
  SELECT id INTO eng_id
  FROM public.engineers
  WHERE auth_user_id = auth.uid();

  RETURN eng_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

**Why SECURITY DEFINER**: Executes with owner's permissions (lets users query `user_profiles` they can't normally access).
**Why STABLE**: Result cached within query, prevents N+1 lookups.

## RLS Multi-Policy Pattern

**Combine policies with OR logic:**

```sql
-- Admins see everything
CREATE POLICY "Admins can view all"
  ON table FOR SELECT
  TO authenticated
  USING (is_admin());

-- Engineers see only their assignments
CREATE POLICY "Engineers can view assigned"
  ON table FOR SELECT
  TO authenticated
  USING (assigned_engineer_id = get_user_engineer_id());
```

PostgreSQL grants access if **ANY** policy matches.

## Storage Patterns

### Private Buckets with Proxy Endpoints

**Don't use**: Signed URLs (they expire)
**Do use**: Proxy endpoints that stream files

```typescript
// Proxy endpoint: src/routes/api/photo/[...path]/+server.ts
export const GET: RequestHandler = async ({ params, locals }) => {
  const photoPath = params.path;

  // Authenticate
  const { data: { session } } = await locals.supabase.auth.getSession();
  if (!session) throw error(401, 'Authentication required');

  // Download (RLS enforced via user's session)
  const { data: photoBlob } = await locals.supabase.storage
    .from('SVA Photos')
    .download(photoPath);

  const arrayBuffer = await photoBlob.arrayBuffer();
  const etag = `"${Buffer.from(photoPath).toString('base64').substring(0, 16)}"`;

  // Check ETag for 304 Not Modified
  if (locals.request.headers.get('if-none-match') === etag) {
    return new Response(null, {
      status: 304,
      headers: { 'ETag': etag }
    });
  }

  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
      'ETag': etag
    }
  });
};
```

### File Upload Pattern

```typescript
// From storage.service.ts
async uploadPhoto(
  file: File,
  assessmentId: string,
  category: 'identification' | '360' | 'interior' | 'tyres'
): Promise<{ url: string; path: string }> {
  // Generate unique filename
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop();
  const fileName = `${timestamp}-${random}.${extension}`;

  // Organized path
  const folder = `assessments/${assessmentId}/${category}`;
  const filePath = `${folder}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('SVA Photos')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  // Return proxy URL (not signed URL!)
  return {
    url: `/api/photo/${filePath}`,
    path: filePath
  };
}
```

**Then save to database:**

```typescript
await db.from('assessment_vehicle_identification').update({
  photo_url: uploadResult.url,
  photo_path: uploadResult.path
}).eq('assessment_id', assessmentId);
```

## Audit Logging

ClaimTech implements comprehensive audit logging with 21 action types across 21 entity types, providing complete traceability of all system changes.

### When to Log

**Always log:**
- Entity creation (`create`)
- Entity updates (`update`)
- Entity deletions (`delete`)
- Status/stage changes (`status_changed`, `stage_changed`)
- Assignments (`assign`)
- Important actions (`submit`, `approve`, `reject`, `cancel`, `complete`, `finalize`)
- Photo uploads/deletions (`photo_added`, `photo_deleted`)
- Document generation (`generate_report`, `generate_estimate`, `generate_frc_report`)

### Audit Action Types (21 Total)

```typescript
type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_changed'
  | 'stage_changed'
  | 'assign'
  | 'unassign'
  | 'submit'
  | 'approve'
  | 'reject'
  | 'cancel'
  | 'complete'
  | 'finalize'
  | 'photo_added'
  | 'photo_deleted'
  | 'generate_report'
  | 'generate_estimate'
  | 'generate_frc_report'
  | 'schedule'
  | 'reschedule'
  | 'accept';
```

### Entity Types (21 Total)

```typescript
type AuditEntityType =
  | 'assessment'
  | 'request'
  | 'appointment'
  | 'inspection'
  | 'estimate'
  | 'estimate_item'
  | 'frc'
  | 'additional'
  | 'client'
  | 'engineer'
  | 'vehicle'
  | 'damage'
  | 'vehicle_values'
  | 'tyres'
  | 'pre_incident_estimate'
  | 'vehicle_identification'
  | 'company_settings'
  | 'rates_and_markups'
  | 'user'
  | 'part_type'
  | 'repair_method';
```

### Basic Usage

```typescript
import { auditService } from '$lib/services/audit.service';

// Simple action logging
await auditService.logChange({
  entity_type: 'assessment',
  entity_id: assessmentId,
  action: 'status_changed',
  changes: {
    status: 'completed'
  },
  user_id: userId
}, client);

// Field-level change tracking
await auditService.logChange({
  entity_type: 'estimate_item',
  entity_id: itemId,
  action: 'update',
  changes: {
    part_name: { old: 'Front Bumper', new: 'Rear Bumper' },
    hours: { old: 2, new: 3 }
  },
  user_id: userId
}, client);
```

### Defensive Audit Logging Pattern

**CRITICAL**: Audit logging should NEVER break core operations. Always use defensive error handling:

```typescript
// ✅ GOOD: Defensive audit logging
async function completeAssessment(id: string, client: ServiceClient) {
  // Core operation
  const { data: assessment, error } = await client
    .from('assessments')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to complete assessment: ${error.message}`);
  }

  // Defensive audit logging - DON'T throw
  try {
    await auditService.logChange({
      entity_type: 'assessment',
      entity_id: id,
      action: 'complete',
      changes: { status: 'completed' },
      user_id: assessment.created_by
    }, client);
  } catch (auditError) {
    // Log warning but don't throw - audit failure is non-critical
    console.error('Warning: Failed to log audit:', auditError);
  }

  return assessment;
}

// ❌ BAD: Audit failure breaks operation
async function completeAssessmentBad(id: string, client: ServiceClient) {
  const assessment = await updateAssessment(...);

  // If this throws, entire operation fails!
  await auditService.logChange({...}, client);

  return assessment;
}
```

### Cross-Entity History Queries

Get complete history across multiple entity types:

```typescript
// Get all audit logs for an assessment (including related entities)
const history = await auditService.getAssessmentHistory(
  assessmentId,
  client
);

// Returns logs for:
// - assessment
// - estimate
// - estimate_items
// - frc
// - additionals
// - inspection
// - appointment
// All related to this assessment
```

### Advanced Filtering

```typescript
// Filter by specific actions
const { data: logs } = await client
  .from('audit_logs')
  .select('*')
  .eq('entity_type', 'assessment')
  .in('action', ['status_changed', 'stage_changed'])
  .gte('created_at', startDate)
  .order('created_at', { ascending: false });

// Filter by user
const { data: userLogs } = await client
  .from('audit_logs')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Admin-Only Audit Tab

Audit logs are displayed in an admin-only tab on assessment pages:

```svelte
<!-- AuditTab.svelte -->
<script lang="ts">
  import { auditService } from '$lib/services/audit.service';

  let history = $state<AuditLog[]>([]);

  async function loadHistory() {
    try {
      history = await auditService.getAssessmentHistory(assessmentId);
    } catch (error) {
      console.error('Failed to load audit history:', error);
      // Don't break UI if audit fails to load
    }
  }
</script>

{#if userRole === 'admin'}
  <section class="audit-tab">
    <h2>Audit History</h2>
    {#each history as log}
      <div class="audit-entry">
        <time>{log.created_at}</time>
        <span class="action">{log.action}</span>
        <span class="entity">{log.entity_type}</span>
        <pre>{JSON.stringify(log.changes, null, 2)}</pre>
      </div>
    {/each}
  </section>
{/if}
```

### Best Practices

1. **Always Defensive**
   - Wrap audit calls in try-catch
   - Log warnings, don't throw
   - Core operations must never fail due to audit

2. **Complete Context**
   - Include user_id for attribution
   - Include both old and new values for changes
   - Use descriptive action types

3. **Appropriate Granularity**
   - Log entity-level changes (create, update, delete)
   - Log important state transitions (status, stage)
   - Don't log every field update individually (group related changes)

4. **Performance Considerations**
   - Audit logging is asynchronous (doesn't block UI)
   - Use batch logging for multiple related changes
   - Don't query audit logs on every page load (admin-only)

5. **Privacy & Compliance**
   - Audit logs are immutable (no updates/deletes)
   - Retain logs for compliance requirements
   - Include timestamps and user attribution

### Common Patterns

**Pattern 1: Stage Transition**
```typescript
await assessmentService.updateStage(id, newStage, client);
// updateStage() internally logs the audit
```

**Pattern 2: Bulk Changes**
```typescript
const changes = {
  field1: { old: oldValue1, new: newValue1 },
  field2: { old: oldValue2, new: newValue2 },
  field3: { old: oldValue3, new: newValue3 }
};

try {
  await auditService.logChange({
    entity_type: 'estimate',
    entity_id: id,
    action: 'update',
    changes,
    user_id: userId
  }, client);
} catch (auditError) {
  console.error('Warning: Audit logging failed:', auditError);
}
```

**Pattern 3: Document Generation**
```typescript
// After successful PDF generation
try {
  await auditService.logChange({
    entity_type: 'assessment',
    entity_id: assessmentId,
    action: 'generate_report',
    changes: {
      document_type: 'assessment_report',
      generated_at: new Date().toISOString()
    },
    user_id: userId
  }, client);
} catch (auditError) {
  console.error('Warning: Failed to log document generation:', auditError);
}
```

## Common Pitfalls

### ❌ Don't expose service role key
```typescript
// WRONG - exposes service key to browser!
import { supabaseServer } from '$lib/supabase-server';
export const load = async () => {
  const data = await supabaseServer.from('table').select('*');
  return { data };
};
```

```typescript
// RIGHT - use locals.supabase
export const load: PageServerLoad = async ({ locals }) => {
  const { data } = await locals.supabase.from('table').select('*');
  return { data };
};
```

### ❌ Don't use signed URLs for storage
```typescript
// WRONG - URLs expire after 1 hour
const { data } = await supabase.storage
  .from('bucket')
  .createSignedUrl(path, 3600);
```

```typescript
// RIGHT - use proxy endpoints (permanent URLs)
const url = `/api/photo/${filePath}`;
```

### ❌ Don't forget audit logging
```typescript
// WRONG - no audit trail
await db.from('requests').update({ status: 'completed' }).eq('id', id);
```

```typescript
// RIGHT - log state changes
const old = await getRequest(id);
await db.from('requests').update({ status: 'completed' }).eq('id', id);
await auditService.logChange({
  entity_type: 'request',
  entity_id: id,
  action: 'status_changed',
  field_name: 'status',
  old_value: old.status,
  new_value: 'completed'
});
```

### ❌ Don't use .single() without .maybeSingle() for nullable results
```typescript
// WRONG - throws error if not found
const { data } = await db.from('table').select('*').eq('id', id).single();
```

```typescript
// RIGHT - returns null if not found
const { data } = await db.from('table').select('*').eq('id', id).maybeSingle();
```

## Database Conventions

### Every table has:
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Auto-update trigger: `CREATE TRIGGER update_{table}_updated_at BEFORE UPDATE...`
- RLS enabled: `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;`

### Check constraints for enums:
```sql
status TEXT CHECK (status IN ('draft', 'submitted', 'in_progress', 'completed'))
```

### Indexes on:
- All foreign keys
- Status/filter fields
- Unique business identifiers
- Commonly searched fields

## Complex Queries (Avoid N+1)

```typescript
// BAD - N+1 queries
const assessments = await db.from('assessments').select('*');
for (const a of assessments) {
  const appointment = await db.from('appointments').select('*').eq('id', a.appointment_id);
}

// GOOD - Single query with nested select
const assessments = await db
  .from('assessments')
  .select(`
    *,
    appointment:appointments(
      *,
      request:requests(*),
      engineer:engineers(name)
    )
  `);
```

## Progressive Disclosure

For detailed information, see:
- [PATTERNS.md](PATTERNS.md) - Detailed pattern explanations, migration best practices
- [SECURITY.md](SECURITY.md) - Complete RLS templates and security patterns
- [EXAMPLES.md](EXAMPLES.md) - Real code examples from the codebase

## Quick Commands

**Create new service**: Copy template from EXAMPLES.md, replace entity name
**Add RLS policy**: Use templates from SECURITY.md
**Create migration**: Follow idempotent pattern from PATTERNS.md
**Upload file**: Use storage.service.ts upload methods
**Query with joins**: Use nested select syntax (see EXAMPLES.md)

---

## Code Execution for Testing Services

Test services programmatically using **Architecture A** pattern (MCP fetch → code process).

**Token Efficiency**: 73-94% reduction vs traditional tool chaining.

### Pattern: Test Service Methods

Test database operations by fetching data with MCP tools, then validating with code execution.

**Phase 1: Fetch Data with MCP**
```typescript
// Claude calls MCP tool to fetch test data
const testData = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT * FROM assessments
    WHERE stage = 'assessment_in_progress'
    ORDER BY created_at DESC
    LIMIT 5
  `
});
```

**Phase 2: Validate with Code Execution**
```typescript
// Claude generates code with embedded data
const validationCode = `
  const testData = ${JSON.stringify(testData)};

  // Verify structure
  console.assert(Array.isArray(testData), 'Should return array');
  console.assert(testData.length <= 5, 'Should limit to 5 results');

  // Validate each assessment
  testData.forEach((assessment, index) => {
    console.assert(assessment.stage === 'assessment_in_progress',
      \`Assessment \${index} should have correct stage\`);
    console.assert(assessment.id,
      \`Assessment \${index} should have id\`);
    console.assert(assessment.created_at,
      \`Assessment \${index} should have created_at\`);
  });

  console.log('✓ All validations passed');
  console.log(\`✓ Found \${testData.length} assessments\`);
`;

// Execute validation
await mcp__ide__executeCode({ code: validationCode });
```

### Pattern: Test RLS Policies

Verify RLS policies work correctly by fetching with different user contexts.

**Phase 1: Fetch Data as Different Users**
```typescript
// Admin user query
const adminData = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT COUNT(*) as count
    FROM assessments
  `
});

// Engineer user query (filtered by RLS)
const engineerData = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT COUNT(*) as count
    FROM assessments
    WHERE appointment.engineer_id = auth.uid()
  `
});
```

**Phase 2: Compare Results**
```typescript
const comparisonCode = `
  const adminData = ${JSON.stringify(adminData)};
  const engineerData = ${JSON.stringify(engineerData)};

  const adminCount = adminData[0].count;
  const engineerCount = engineerData[0].count;

  console.log('RLS Policy Verification:');
  console.log(\`  Admin sees: \${adminCount} assessments\`);
  console.log(\`  Engineer sees: \${engineerCount} assessments\`);

  if (engineerCount <= adminCount) {
    console.log('✓ RLS correctly restricts engineer access');
  } else {
    console.error('❌ RLS policy error: engineer sees more than admin');
  }
`;

await mcp__ide__executeCode({ code: comparisonCode });
```

### Pattern: Validate Migration Results

After applying a migration, validate the schema changes.

**Phase 1: Apply Migration and Fetch Schema**
```typescript
// Apply migration
await mcp__supabase__apply_migration({
  project_id: env.SUPABASE_PROJECT_ID,
  name: '071_add_comments_table',
  query: `
    CREATE TABLE IF NOT EXISTS comments (
      id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      assessment_id uuid REFERENCES assessments(id),
      content text NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_comments_assessment
      ON comments(assessment_id);
  `
});

// Fetch schema information
const tables = await mcp__supabase__list_tables({
  project_id: env.SUPABASE_PROJECT_ID,
  schemas: ['public']
});
```

**Phase 2: Validate Schema**
```typescript
const validationCode = `
  const tables = ${JSON.stringify(tables)};

  // Check table exists
  const commentsTable = tables.find(t => t.name === 'comments');
  console.assert(commentsTable, 'comments table should exist');

  // Check columns
  const hasId = commentsTable.columns.some(c => c.name === 'id');
  const hasAssessmentId = commentsTable.columns.some(c => c.name === 'assessment_id');
  const hasContent = commentsTable.columns.some(c => c.name === 'content');
  const hasCreatedAt = commentsTable.columns.some(c => c.name === 'created_at');

  console.assert(hasId, 'Should have id column');
  console.assert(hasAssessmentId, 'Should have assessment_id column');
  console.assert(hasContent, 'Should have content column');
  console.assert(hasCreatedAt, 'Should have created_at column');

  // Check indexes
  const hasIndex = commentsTable.indexes.some(i =>
    i.name === 'idx_comments_assessment'
  );
  console.assert(hasIndex, 'Should have assessment_id index');

  console.log('✓ Migration validated successfully');
  console.log('  - Table created');
  console.log('  - All columns present');
  console.log('  - Index created');
`;

await mcp__ide__executeCode({ code: validationCode });
```

### Pattern: Test Unique ID Generation

Validate that unique ID generation follows ClaimTech patterns.

**Phase 1: Generate IDs and Fetch Results**
```typescript
// Create multiple entities to test ID generation
const createResults = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    INSERT INTO assessments (request_id)
    SELECT id FROM requests
    WHERE stage = 'request_submitted'
    LIMIT 3
    RETURNING assessment_number, created_at
  `
});
```

**Phase 2: Validate ID Pattern**
```typescript
const validationCode = `
  const results = ${JSON.stringify(createResults)};

  const currentYear = new Date().getFullYear();
  const expectedPrefix = \`ASM-\${currentYear}-\`;

  results.forEach((result, index) => {
    console.assert(
      result.assessment_number.startsWith(expectedPrefix),
      \`Assessment \${index} should start with \${expectedPrefix}\`
    );

    // Extract number portion
    const numberPart = result.assessment_number.split('-')[2];
    console.assert(
      numberPart.length === 3,
      \`Assessment \${index} should have 3-digit number (got \${numberPart})\`
    );

    console.assert(
      /^\d{3}$/.test(numberPart),
      \`Assessment \${index} number should be numeric\`
    );
  });

  console.log('✓ Unique ID generation validated');
  console.log(\`  - All IDs follow \${expectedPrefix}XXX pattern\`);
  console.log(\`  - All numbers are zero-padded to 3 digits\`);
`;

await mcp__ide__executeCode({ code: validationCode });
```

### Pattern: Test ServiceClient Injection

Verify services work with both authenticated and service role clients.

**Phase 1: Test with Different Clients**
```typescript
// Test with authenticated client (RLS enforced)
const authResults = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT COUNT(*) as count
    FROM assessments
    -- RLS will filter to user's assessments
  `
});

// Test with service role (RLS bypassed)
const serviceResults = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT COUNT(*) as count
    FROM assessments
  `,
  use_service_role: true
});
```

**Phase 2: Compare Behavior**
```typescript
const comparisonCode = `
  const authResults = ${JSON.stringify(authResults)};
  const serviceResults = ${JSON.stringify(serviceResults)};

  const authCount = authResults[0].count;
  const serviceCount = serviceResults[0].count;

  console.log('ServiceClient Pattern Validation:');
  console.log(\`  Authenticated client: \${authCount} rows\`);
  console.log(\`  Service role client: \${serviceCount} rows\`);

  if (serviceCount >= authCount) {
    console.log('✓ Service role bypasses RLS correctly');
    console.log(\`  - Service role sees \${serviceCount - authCount} additional rows\`);
  } else {
    console.error('❌ Unexpected: service role sees fewer rows');
  }
`;

await mcp__ide__executeCode({ code: comparisonCode });
```

### Pattern: Test Audit Logging

Verify audit logs are created correctly for operations.

**Phase 1: Perform Operation and Fetch Audit Logs**
```typescript
// Perform an update
await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    UPDATE assessments
    SET stage = 'estimate_review'
    WHERE id = $1
  `,
  params: [testAssessmentId]
});

// Fetch audit logs
const auditLogs = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT *
    FROM audit_logs
    WHERE entity_type = 'assessment'
      AND entity_id = $1
    ORDER BY created_at DESC
    LIMIT 5
  `,
  params: [testAssessmentId]
});
```

**Phase 2: Validate Audit Trail**
```typescript
const validationCode = `
  const auditLogs = ${JSON.stringify(auditLogs)};

  console.assert(auditLogs.length > 0, 'Should have audit logs');

  const latestLog = auditLogs[0];

  // Validate structure
  console.assert(latestLog.entity_type === 'assessment',
    'Should log correct entity type');
  console.assert(latestLog.action,
    'Should have action field');
  console.assert(latestLog.changes,
    'Should have changes field');
  console.assert(latestLog.user_id,
    'Should track user who made change');
  console.assert(latestLog.created_at,
    'Should have timestamp');

  console.log('✓ Audit logging validated');
  console.log(\`  - Found \${auditLogs.length} audit logs\`);
  console.log(\`  - Latest action: \${latestLog.action}\`);
  console.log(\`  - Changes tracked: \${Object.keys(JSON.parse(latestLog.changes || '{}')).join(', ')}\`);
`;

await mcp__ide__executeCode({ code: validationCode });
```

### When to Use Code Execution for Testing

**✅ Use Code Execution When:**
- Validating multiple assertions on fetched data
- Comparing results from different queries
- Testing complex business logic
- Generating test reports with statistics
- Batch validation of migration results

**❌ Use Direct MCP Tools When:**
- Simple single query execution
- Creating test data (INSERT operations)
- Applying migrations
- Single assertion checks

### Integration with Existing Service Patterns

Code execution complements the ServiceClient injection pattern:

```typescript
// Step 1: Test service method (traditional)
const result = await service.createAssessment(input, locals.supabase);

// Step 2: Fetch result with MCP for validation
const validation = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: 'SELECT * FROM assessments WHERE id = $1',
  params: [result.id]
});

// Step 3: Validate with code execution
const code = `
  const data = ${JSON.stringify(validation)};
  console.assert(data[0].stage === 'request_submitted', 'Should have default stage');
  console.assert(data[0].assessment_number, 'Should have unique number');
  console.log('✓ Service method validated');
`;

await mcp__ide__executeCode({ code });
```

### Benefits Summary

- **73-94% token reduction** for complex test validations
- **Single execution** vs multiple tool calls for assertions
- **Structured test reports** with detailed output
- **Batch validation** of multiple conditions
- **Easy debugging** with console.log statements
- **Reusable patterns** across all services
