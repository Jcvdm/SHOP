# Database Patterns - ClaimTech

Production-ready patterns for database migrations, RLS policies, and schema management in ClaimTech.

---

## Migration Templates

### Standard Table Creation

```sql
-- Migration: YYYYMMDD_create_table_name.sql
-- Description: [What this migration does]

-- Create table with IF NOT EXISTS for idempotency
CREATE TABLE IF NOT EXISTS table_name (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  -- Foreign keys
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES parent_table(id) ON DELETE CASCADE,

  -- Data columns
  name text NOT NULL,
  description text,
  status text CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Audit columns (ALWAYS include these)
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for foreign keys (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_table_name_user_id
  ON table_name(user_id);

CREATE INDEX IF NOT EXISTS idx_table_name_parent_id
  ON table_name(parent_id);

-- Create index for frequently filtered columns
CREATE INDEX IF NOT EXISTS idx_table_name_status
  ON table_name(status);

-- Create index for JSONB searches (if needed)
CREATE INDEX IF NOT EXISTS idx_table_name_metadata
  ON table_name USING gin(metadata);

-- Enable RLS (MANDATORY for all tables)
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (see RLS Policies section below)
CREATE POLICY "Users can view own records"
  ON table_name
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records"
  ON table_name
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records"
  ON table_name
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own records"
  ON table_name
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger (MANDATORY for all tables)
CREATE TRIGGER update_table_name_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Association Table (Many-to-Many)

```sql
-- Migration: YYYYMMDD_create_entity_relation.sql

CREATE TABLE IF NOT EXISTS entity_a_entity_b (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  -- Foreign keys (composite unique constraint)
  entity_a_id uuid REFERENCES entity_a(id) ON DELETE CASCADE NOT NULL,
  entity_b_id uuid REFERENCES entity_b(id) ON DELETE CASCADE NOT NULL,

  -- Optional metadata
  role text, -- e.g., 'owner', 'member', 'viewer'

  -- Audit columns
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Prevent duplicate associations
  UNIQUE(entity_a_id, entity_b_id)
);

-- Indexes for both directions of the relationship
CREATE INDEX IF NOT EXISTS idx_entity_a_entity_b_a_id
  ON entity_a_entity_b(entity_a_id);

CREATE INDEX IF NOT EXISTS idx_entity_a_entity_b_b_id
  ON entity_a_entity_b(entity_b_id);

-- Enable RLS
ALTER TABLE entity_a_entity_b ENABLE ROW LEVEL SECURITY;

-- RLS policies based on parent entities
CREATE POLICY "Users can view associations for their entities"
  ON entity_a_entity_b
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entity_a
      WHERE id = entity_a_id AND user_id = auth.uid()
    )
  );

-- Add trigger
CREATE TRIGGER update_entity_a_entity_b_updated_at
  BEFORE UPDATE ON entity_a_entity_b
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### JSONB Document Table (ClaimTech Estimates Pattern)

```sql
-- Migration: YYYYMMDD_create_estimates_table.sql
-- Description: Document-oriented estimates with JSONB arrays

CREATE TABLE IF NOT EXISTS assessment_estimates (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  -- 1:1 relationship with assessment
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- JSONB array of line items (document-oriented approach)
  line_items jsonb DEFAULT '[]'::jsonb NOT NULL,

  -- Computed totals (can be derived from line_items)
  total_parts decimal(10,2) DEFAULT 0,
  total_labour decimal(10,2) DEFAULT 0,
  total_paint decimal(10,2) DEFAULT 0,
  grand_total decimal(10,2) DEFAULT 0,

  -- Audit columns
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index for foreign key
CREATE INDEX IF NOT EXISTS idx_assessment_estimates_assessment_id
  ON assessment_estimates(assessment_id);

-- GIN index for JSONB searches
CREATE INDEX IF NOT EXISTS idx_assessment_estimates_line_items
  ON assessment_estimates USING gin(line_items);

-- Enable RLS
ALTER TABLE assessment_estimates ENABLE ROW LEVEL SECURITY;

-- RLS based on assessment ownership
CREATE POLICY "Users can view estimates for their assessments"
  ON assessment_estimates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN requests r ON a.request_id = r.id
      WHERE a.id = assessment_id
        AND (r.client_id = auth.uid() OR r.engineer_id = auth.uid())
    )
  );

-- Add trigger
CREATE TRIGGER update_assessment_estimates_updated_at
  BEFORE UPDATE ON assessment_estimates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**JSONB Line Item Structure:**
```json
[
  {
    "id": "unique-id",
    "process_type": "N",
    "part_type": "OEM",
    "description": "Front bumper",
    "part_price_nett": 450.00,
    "part_price": 500.00,
    "labour_hours": 2.5,
    "labour_rate": 120.00,
    "paint_hours": 1.0,
    "betterment_part_percentage": 0,
    "betterment_labour_percentage": 0
  }
]
```

---

## RLS Policy Patterns

### User-Owned Resources

```sql
-- Users can only access their own records
CREATE POLICY "policy_name"
  ON table_name
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Organization/Client-Based Access

```sql
-- Users can access records belonging to their organization
CREATE POLICY "Users can view organization records"
  ON table_name
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND organization_id = table_name.organization_id
    )
  );
```

### Role-Based Access (Admin Override)

```sql
-- Regular users see own records, admins see all
CREATE POLICY "Users view own, admins view all"
  ON table_name
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### ClaimTech Pattern (Client + Engineer Access)

```sql
-- Both client and assigned engineer can view assessment
CREATE POLICY "Client and engineer can view assessment"
  ON assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_id
        AND (r.client_id = auth.uid() OR r.engineer_id = auth.uid())
    )
  );
```

### Insert Policy with Validation

```sql
-- Users can only insert records for themselves
CREATE POLICY "Users can insert own records"
  ON table_name
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Update Policy (Ownership + Status Check)

```sql
-- Users can update own records only if not finalized
CREATE POLICY "Users can update own non-finalized records"
  ON table_name
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status != 'finalized'
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status != 'finalized'
  );
```

### Delete Policy with Cascade Protection

```sql
-- Prevent deletion if related records exist
CREATE POLICY "Users can delete if no dependencies"
  ON table_name
  FOR DELETE
  USING (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM dependent_table
      WHERE parent_id = table_name.id
    )
  );
```

### Public Read, Authenticated Write

```sql
-- Anyone can read, authenticated users can write
CREATE POLICY "Public read"
  ON table_name
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated insert"
  ON table_name
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

---

## Index Strategies

### Foreign Key Indexes (MANDATORY)

```sql
-- ALWAYS create indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_table_fk_column
  ON table_name(fk_column);
```

### Composite Indexes (Order Matters)

```sql
-- Index for queries like: WHERE user_id = X ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_table_user_created
  ON table_name(user_id, created_at DESC);
```

### Partial Indexes (For Status Filters)

```sql
-- Index only active records (faster for common queries)
CREATE INDEX IF NOT EXISTS idx_table_active
  ON table_name(user_id)
  WHERE status = 'active';
```

### JSONB Indexes

```sql
-- GIN index for JSONB containment queries
CREATE INDEX IF NOT EXISTS idx_table_jsonb_data
  ON table_name USING gin(jsonb_column);

-- GIN index with jsonb_path_ops (faster, less flexible)
CREATE INDEX IF NOT EXISTS idx_table_jsonb_paths
  ON table_name USING gin(jsonb_column jsonb_path_ops);
```

### Full-Text Search Indexes

```sql
-- Create tsvector column
ALTER TABLE table_name
  ADD COLUMN search_vector tsvector;

-- Create GIN index on tsvector
CREATE INDEX IF NOT EXISTS idx_table_search
  ON table_name USING gin(search_vector);

-- Add trigger to auto-update search vector
CREATE TRIGGER update_table_search_vector
  BEFORE INSERT OR UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION tsvector_update_trigger(
    search_vector, 'pg_catalog.english', name, description
  );
```

---

## Trigger Patterns

### Updated At Trigger (MANDATORY)

```sql
-- Function (create once, reuse everywhere)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger (create for each table)
CREATE TRIGGER update_table_name_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Audit Log Trigger

```sql
-- Log all changes to audit table
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    user_id,
    changed_at
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    to_jsonb(OLD),
    to_jsonb(NEW),
    auth.uid(),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_table_name
  AFTER INSERT OR UPDATE OR DELETE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION audit_table_changes();
```

### Validation Trigger

```sql
-- Validate data before insert/update
CREATE OR REPLACE FUNCTION validate_assessment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check status transition
  IF OLD.status = 'finalized' AND NEW.status != 'finalized' THEN
    RAISE EXCEPTION 'Cannot unfinalise assessment';
  END IF;

  -- Ensure totals match
  IF NEW.grand_total < 0 THEN
    RAISE EXCEPTION 'Grand total cannot be negative';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_assessment_changes
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION validate_assessment();
```

---

## Migration Best Practices

### Idempotency (CRITICAL)

```sql
-- ✅ GOOD: Idempotent (can run multiple times safely)
CREATE TABLE IF NOT EXISTS table_name (...);
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column);
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS new_column text;

-- ❌ BAD: Not idempotent (fails on second run)
CREATE TABLE table_name (...);
CREATE INDEX idx_name ON table_name(column);
```

### Column Additions (Safe)

```sql
-- Add column with default (backfills existing rows)
ALTER TABLE table_name
  ADD COLUMN IF NOT EXISTS new_column text DEFAULT 'default_value';
```

### Column Removals (Dangerous)

```sql
-- NEVER drop columns in production without backup
-- Instead, use a two-step process:

-- Step 1: Stop using column in code
-- Step 2 (later): Drop column in separate migration
ALTER TABLE table_name DROP COLUMN IF EXISTS old_column;
```

### Data Migrations

```sql
-- Update existing data based on new requirements
UPDATE table_name
SET new_column = computed_value
WHERE new_column IS NULL;
```

### Rollback Considerations

```sql
-- Include rollback instructions in comments
-- Rollback: DROP TABLE IF EXISTS table_name;

CREATE TABLE IF NOT EXISTS table_name (...);
```

---

## Common Patterns

### Soft Delete

```sql
-- Add deleted_at column
ALTER TABLE table_name
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Create index for non-deleted records
CREATE INDEX IF NOT EXISTS idx_table_active
  ON table_name(id)
  WHERE deleted_at IS NULL;

-- Update RLS to exclude deleted
CREATE POLICY "Exclude deleted records"
  ON table_name
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND auth.uid() = user_id
  );
```

### Enum-Like Constraints

```sql
-- Use CHECK constraint for allowed values
ALTER TABLE table_name
  ADD CONSTRAINT check_status
  CHECK (status IN ('pending', 'active', 'completed', 'cancelled'));
```

### UUID Generation

```sql
-- Use uuid_generate_v4() for random UUIDs
id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4()

-- For ordered UUIDs (better for indexes), use uuid_generate_v7() if available
```

### Timestamps with Timezone

```sql
-- ALWAYS use timestamptz (not timestamp)
created_at timestamptz DEFAULT now() NOT NULL,
updated_at timestamptz DEFAULT now() NOT NULL
```

---

## ClaimTech-Specific Patterns

### Estimates Architecture (JSONB)

Use JSONB for complex, variable-structure data like estimates:

```sql
-- Single row per assessment with JSONB array
line_items jsonb DEFAULT '[]'::jsonb

-- Benefits:
-- - Flexible schema (different fields per line item)
-- - Atomic updates (entire estimate updated together)
-- - Easier versioning (entire document is a version)

-- Query examples:
-- Get all line items
SELECT line_items FROM assessment_estimates WHERE assessment_id = 'X';

-- Filter line items by property
SELECT jsonb_array_elements(line_items) as item
FROM assessment_estimates
WHERE assessment_id = 'X'
  AND (item->>'process_type') = 'N';
```

### Assessment Relationships

```sql
-- Cascade pattern: request → inspection → assessment → estimates
request_id uuid REFERENCES requests(id) ON DELETE CASCADE

-- This means: deleting a request deletes all its inspections,
-- assessments, and estimates automatically
```

### Client/Engineer Access Pattern

```sql
-- Both client and engineer can access assessment data
EXISTS (
  SELECT 1 FROM requests r
  WHERE r.id = request_id
    AND (r.client_id = auth.uid() OR r.engineer_id = auth.uid())
)
```

---

## Security Checklist

Before deploying any migration:

- [ ] RLS is enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] RLS policies are created (not just enabled without policies)
- [ ] Policies cover all operations (SELECT, INSERT, UPDATE, DELETE)
- [ ] Foreign keys have `ON DELETE` behavior specified
- [ ] All foreign keys have indexes
- [ ] `updated_at` trigger is added
- [ ] Migration is idempotent (uses IF NOT EXISTS)
- [ ] Default values are provided where appropriate
- [ ] NOT NULL constraints are used where required
- [ ] CHECK constraints validate data integrity

---

## Testing Migrations Locally

```bash
# Apply migration
supabase migration up

# Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

# List policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public';

# Test as different user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid';

# Query to verify RLS works
SELECT * FROM table_name;
```

---

**Reference**: See `.agent/System/database_schema.md` for current ClaimTech schema
