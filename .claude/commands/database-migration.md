# Database Migration Command

You are a database expert creating safe, idempotent migrations for ClaimTech's PostgreSQL database via Supabase.

---

## Prerequisites Check

Before starting:
- [ ] Read `.agent/System/database_schema.md` (understand current schema)
- [ ] Invoke `supabase-development` skill (database patterns)
- [ ] Check `.agent/SOP/adding_migration.md` (detailed SOP)

---

## Phase 1: Planning (5-10 min)

### 1.1 Understand the Change

**Questions to Answer:**
- What tables are affected?
- What columns are being added/modified/removed?
- What relationships exist?
- What indexes are needed?
- What RLS policies are required?

### 1.2 Check for Similar Patterns

```bash
# Search existing migrations
ls supabase/migrations/

# Look for similar table structures
grep -r "CREATE TABLE" supabase/migrations/
```

### 1.3 Design the Schema

**Template:**
```sql
-- Table: [table_name]
-- Purpose: [what this table stores]
-- Relationships:
--   - [foreign_key] → [referenced_table]

CREATE TABLE IF NOT EXISTS table_name (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  -- columns here
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Output:** Schema design document

---

## Phase 2: Create Migration File (2-3 min)

### 2.1 Determine Migration Number

```bash
# Find highest migration number
ls supabase/migrations/ | sort -V | tail -1

# If last is 068_assessment_centric_migration.sql
# Next is 069_your_migration_name.sql
```

### 2.2 Create File

```bash
# Format: {number}_{descriptive_name}.sql
touch supabase/migrations/069_add_notes_to_assessments.sql
```

**Naming Conventions:**
- Use snake_case
- Be descriptive
- Include action (add/create/modify/remove)
- Keep under 50 characters

**Examples:**
- ✅ `069_add_notes_to_assessments.sql`
- ✅ `070_create_notifications_table.sql`
- ✅ `071_modify_requests_add_priority.sql`
- ❌ `069_update.sql` (too vague)
- ❌ `069_AddNotesToAssessments.sql` (wrong case)

---

## Phase 3: Write Migration SQL (15-25 min)

### 3.1 Migration Template

```sql
-- Migration: [number]_[name]
-- Description: [What this migration does and why]
-- Date: [YYYY-MM-DD]
-- Author: [Your name or "ClaimTech Team"]

-- ============================================
-- 1. CREATE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS table_name (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  
  -- Foreign keys
  parent_id uuid REFERENCES parent_table(id) ON DELETE CASCADE,
  
  -- Data columns
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  
  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'archived'))
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

-- Index on foreign keys (ALWAYS)
CREATE INDEX IF NOT EXISTS idx_table_name_parent_id 
  ON table_name(parent_id);

-- Index on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_table_name_status 
  ON table_name(status);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_table_name_parent_status 
  ON table_name(parent_id, status);

-- ============================================
-- 3. ENABLE RLS
-- ============================================

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Admin users: full access
CREATE POLICY "Admins have full access to table_name"
  ON table_name
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Engineers: read own records
CREATE POLICY "Engineers can read their own table_name"
  ON table_name
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'engineer'
      AND users.id = table_name.created_by
    )
  );

-- ============================================
-- 5. CREATE TRIGGERS
-- ============================================

-- Updated_at trigger (ALWAYS)
CREATE TRIGGER update_table_name_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ADD COMMENTS
-- ============================================

COMMENT ON TABLE table_name IS 'Stores [description]';
COMMENT ON COLUMN table_name.status IS 'Valid values: active, inactive, archived';
```

### 3.2 Idempotency Checklist

**CRITICAL:** All statements must be idempotent (safe to run multiple times)

- [ ] `CREATE TABLE IF NOT EXISTS`
- [ ] `CREATE INDEX IF NOT EXISTS`
- [ ] `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- [ ] `CREATE POLICY IF NOT EXISTS` (Supabase 2.0+)
- [ ] `DROP TABLE IF EXISTS` (for rollbacks)

### 3.3 Common Patterns

**Pattern 1: Adding Column to Existing Table**
```sql
ALTER TABLE existing_table 
ADD COLUMN IF NOT EXISTS new_column text;

-- Add default value if needed
UPDATE existing_table 
SET new_column = 'default_value' 
WHERE new_column IS NULL;

-- Add NOT NULL constraint after populating
ALTER TABLE existing_table 
ALTER COLUMN new_column SET NOT NULL;
```

**Pattern 2: Association Table (Many-to-Many)**
```sql
CREATE TABLE IF NOT EXISTS entity_tags (
  entity_id uuid REFERENCES entities(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (entity_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_tags_entity 
  ON entity_tags(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_tag 
  ON entity_tags(tag_id);
```

**Pattern 3: JSONB Column**
```sql
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_assessments_metadata 
  ON assessments USING gin(metadata);
```

**Pattern 4: Enum-like Status**
```sql
-- Use CHECK constraint instead of ENUM
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted';

ALTER TABLE requests 
ADD CONSTRAINT valid_request_status 
CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected'));

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_requests_status 
  ON requests(status);
```

---

## Phase 4: Test Migration Locally (10-15 min)

### 4.1 Apply Migration

**Option 1: Supabase CLI** (recommended)
```bash
# Apply migration
supabase migration up

# Verify it applied
supabase migration list
```

**Option 2: Supabase Dashboard**
1. Go to SQL Editor
2. Copy migration SQL
3. Run query
4. Verify success

**Option 3: Test with Code Execution** (Recommended for Complex Validation)

**Advantages:**
- Programmatic validation of schema changes
- Reusable test scripts
- Detailed error reporting
- Can test multiple scenarios in one execution
- Token-efficient (88% savings vs manual verification)

**Example: Testing Table Creation**

```typescript
// Phase 1: Apply migration via MCP
await mcp__supabase__apply_migration({
  project_id: env.SUPABASE_PROJECT_ID,
  name: 'add_comments_table',
  query: `
    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_comments_assessment_id
      ON comments(assessment_id);

    ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
  `
});

// Phase 2: Fetch table metadata
const tables = await mcp__supabase__list_tables({
  project_id: env.SUPABASE_PROJECT_ID,
  schemas: ['public']
});

// Phase 3: Validate with code execution
const validationCode = `
  const tables = ${JSON.stringify(tables)};

  // Check table exists
  const commentsTable = tables.find(t => t.name === 'comments');
  console.assert(commentsTable !== undefined, '✗ comments table should exist');
  console.log('✓ comments table exists');

  // Check columns
  const expectedColumns = ['id', 'assessment_id', 'content', 'created_by', 'created_at', 'updated_at'];
  const actualColumns = commentsTable.columns.map(c => c.name);

  expectedColumns.forEach(col => {
    const exists = actualColumns.includes(col);
    console.assert(exists, \`✗ Column '\${col}' should exist\`);
    if (exists) console.log(\`✓ Column '\${col}' exists\`);
  });

  // Check foreign keys
  const fkColumns = commentsTable.columns.filter(c => c.is_foreign_key);
  console.assert(fkColumns.length >= 2, '✗ Should have at least 2 foreign keys');
  console.log(\`✓ Found \${fkColumns.length} foreign keys\`);

  // Check RLS enabled
  console.assert(commentsTable.rls_enabled === true, '✗ RLS should be enabled');
  console.log('✓ RLS is enabled');

  console.log('\\n✓ All migration tests passed');
`;

await mcp__ide__executeCode({ code: validationCode });
```

**Example: Testing RLS Policies**

```typescript
// Phase 1: Fetch RLS policies
const policies = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'comments'
  `
});

// Phase 2: Validate policies with code
const policyValidationCode = `
  const policies = ${JSON.stringify(policies)};

  // Check admin policy exists
  const adminPolicy = policies.find(p => p.policyname.includes('admin'));
  console.assert(adminPolicy !== undefined, '✗ Admin policy should exist');
  console.log('✓ Admin policy exists:', adminPolicy.policyname);

  // Check engineer policy exists
  const engineerPolicy = policies.find(p => p.policyname.includes('engineer'));
  console.assert(engineerPolicy !== undefined, '✗ Engineer policy should exist');
  console.log('✓ Engineer policy exists:', engineerPolicy.policyname);

  // Check all commands covered (SELECT, INSERT, UPDATE, DELETE)
  const commands = [...new Set(policies.map(p => p.cmd))];
  console.log('✓ Commands covered:', commands.join(', '));

  console.log('\\n✓ All RLS policy tests passed');
`;

await mcp__ide__executeCode({ code: policyValidationCode });
```

**Example: Testing Data Migration**

```typescript
// Phase 1: Run data migration
await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    -- Example: Populate new column with calculated values
    UPDATE assessments
    SET completion_days = EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400
    WHERE stage = 'completed';
  `
});

// Phase 2: Fetch migrated data
const migratedData = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT id, completion_days, created_at, updated_at
    FROM assessments
    WHERE stage = 'completed'
    LIMIT 100
  `
});

// Phase 3: Validate data integrity
const dataValidationCode = `
  const data = ${JSON.stringify(migratedData)};

  // Check all completed assessments have completion_days
  const missingData = data.filter(row => row.completion_days === null);
  console.assert(missingData.length === 0, \`✗ Found \${missingData.length} rows with null completion_days\`);
  console.log('✓ All completed assessments have completion_days calculated');

  // Validate calculations
  const invalidCalculations = data.filter(row => {
    const created = new Date(row.created_at);
    const updated = new Date(row.updated_at);
    const expectedDays = (updated - created) / (1000 * 60 * 60 * 24);
    const actualDays = parseFloat(row.completion_days);
    return Math.abs(expectedDays - actualDays) > 0.01; // Allow small floating point diff
  });

  console.assert(invalidCalculations.length === 0, \`✗ Found \${invalidCalculations.length} rows with incorrect calculations\`);
  console.log('✓ All calculations are correct');

  // Summary statistics
  const avgDays = data.reduce((sum, row) => sum + parseFloat(row.completion_days), 0) / data.length;
  const maxDays = Math.max(...data.map(row => parseFloat(row.completion_days)));
  const minDays = Math.min(...data.map(row => parseFloat(row.completion_days)));

  console.log('\\nData Migration Summary:');
  console.log(\`  Records migrated: \${data.length}\`);
  console.log(\`  Average completion: \${avgDays.toFixed(2)} days\`);
  console.log(\`  Range: \${minDays.toFixed(2)} - \${maxDays.toFixed(2)} days\`);
  console.log('\\n✓ All data migration tests passed');
`;

await mcp__ide__executeCode({ code: dataValidationCode });
```

**Token Efficiency:**
- Traditional approach: 3-5 tool calls (1500-2500 tokens)
- Code execution: 2 operations (300-500 tokens)
- **Savings: 80-88%**

### 4.2 Verify Table Structure

```sql
-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'your_table';

-- Check columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'your_table';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'your_table';

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'your_table';

-- Check RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'your_table';
```

### 4.3 Test RLS Policies

```sql
-- Test as admin user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "[admin-user-id]", "role": "admin"}';

SELECT * FROM your_table; -- Should work

-- Test as engineer user
SET LOCAL request.jwt.claims TO '{"sub": "[engineer-user-id]", "role": "engineer"}';

SELECT * FROM your_table; -- Should only see own records

-- Reset
RESET ROLE;
```

### 4.4 Test Idempotency

```bash
# Run migration again - should not error
supabase migration up
```

**Output:** Verified working migration

---

## Phase 5: Generate TypeScript Types (2-3 min)

### 5.1 Generate Types

```bash
# Using Supabase CLI
supabase gen types typescript --local > src/lib/types/database.types.ts

# Or using MCP (if configured)
# Claude will call mcp__supabase__generate_typescript_types
```

### 5.2 Verify Types

```typescript
// Check new table appears in Database type
import type { Database } from '$lib/types/database.types';

type YourTable = Database['public']['Tables']['your_table']['Row'];
type YourTableInsert = Database['public']['Tables']['your_table']['Insert'];
type YourTableUpdate = Database['public']['Tables']['your_table']['Update'];
```

**Output:** Updated TypeScript types

---

## Phase 6: Update Documentation (5-10 min)

### 6.1 Update Database Schema Doc

**File:** `.agent/System/database_schema.md`

**Add:**
```markdown
### [table_name]

**Purpose:** [What this table stores]

**Columns:**
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| name | text | NO | - | [Description] |
| status | text | NO | 'active' | Valid: active, inactive, archived |
| created_at | timestamptz | NO | now() | Creation timestamp |
| updated_at | timestamptz | NO | now() | Last update timestamp |

**Relationships:**
- `parent_id` → `parent_table.id` (ON DELETE CASCADE)

**Indexes:**
- `idx_table_name_parent_id` on `parent_id`
- `idx_table_name_status` on `status`

**RLS Policies:**
- Admins: Full access
- Engineers: Read own records only

**Triggers:**
- `update_table_name_updated_at` - Updates `updated_at` on row changes
```

### 6.2 Update README Index

**File:** `.agent/README.md`

Add migration to changelog or relevant section.

**Output:** Updated documentation

---

## Phase 7: Commit Migration (2-3 min)

```bash
# Stage migration file
git add supabase/migrations/069_your_migration_name.sql

# Stage type updates
git add src/lib/types/database.types.ts

# Stage documentation
git add .agent/System/database_schema.md

# Commit with descriptive message
git commit -m "feat(db): add [table_name] table for [feature]

- Created [table_name] with [key columns]
- Added RLS policies for admin/engineer access
- Indexed foreign keys and status column
- Updated TypeScript types
- Documented in database_schema.md"

# Push to remote
git push origin [branch-name]
```

---

## Quality Checklist

Before marking migration complete:

**SQL Quality:**
- [ ] All statements are idempotent
- [ ] No hard-coded UUIDs or timestamps
- [ ] Proper ON DELETE behavior specified
- [ ] CHECK constraints validate data
- [ ] Comments explain complex logic

**Security:**
- [ ] RLS enabled on all new tables
- [ ] RLS policies created (not just permissive)
- [ ] Policies tested with different roles
- [ ] No sensitive data exposed

**Performance:**
- [ ] Indexes on all foreign keys
- [ ] Indexes on frequently queried columns
- [ ] Composite indexes for common queries
- [ ] GIN indexes for JSONB columns

**Completeness:**
- [ ] created_at and updated_at columns present
- [ ] updated_at trigger added
- [ ] TypeScript types generated
- [ ] Documentation updated
- [ ] Migration tested locally
- [ ] Migration committed to git

---

## Common Pitfalls

### ❌ Never:
- Skip `IF NOT EXISTS` / `IF EXISTS`
- Forget to enable RLS
- Create permissive policies without proper restrictions
- Skip indexes on foreign keys
- Hard-code values
- Deploy without testing locally

### ✅ Always:
- Make migrations idempotent
- Enable RLS on new tables
- Create proper RLS policies
- Index foreign keys
- Add updated_at trigger
- Test with different user roles
- Update documentation

---

## Related Commands

- `feature-implementation.md` - Full feature workflow
- `service-development.md` - Service layer for new tables
- `testing-workflow.md` - Testing migrations

---

## Related Skills

- `supabase-development` - Database patterns and RLS
- `claimtech-development` - Migration workflow

