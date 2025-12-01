# SOP: Adding Database Migrations

## Overview

This document describes how to create and apply database migrations for ClaimTech using Supabase.

---

## Prerequisites

- Supabase project set up
- Access to Supabase dashboard or Supabase CLI
- Understanding of SQL and PostgreSQL

---

## Migration Naming Convention

Migrations are numbered sequentially and stored in `supabase/migrations/`:

```
001_initial_schema.sql
002_create_inspections.sql
003_add_provinces_and_company_details.sql
...
043_auth_setup.sql
044_secure_storage_policies.sql
```

**Format:** `{number}_{descriptive_name}.sql`

**Special Cases:**
- Timestamp-based: `20250116_add_frozen_rates_markups.sql` (used for date-specific migrations)
- Descriptive: `007_damage_record_unique_constraint.sql`

---

## Step-by-Step Guide

### 1. Determine Next Migration Number

Check the `supabase/migrations/` directory for the highest number:

```bash
ls supabase/migrations/
```

If the last migration is `047_add_auth_to_engineers.sql`, your new migration will be `048_your_migration_name.sql`.

---

### 2. Create Migration File

Create a new `.sql` file in `supabase/migrations/`:

```bash
# Example:
touch supabase/migrations/048_add_status_to_requests.sql
```

---

### 3. Write Migration SQL

#### Template Structure

```sql
-- Migration Description
-- Brief explanation of what this migration does

-- Example: Adding a new column
ALTER TABLE table_name
ADD COLUMN new_column_name TYPE DEFAULT value;

-- Example: Creating a new table
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_new_table_name ON new_table(name);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on new_table for now"
  ON new_table
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_new_table_updated_at
  BEFORE UPDATE ON new_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE new_table IS 'Description of what this table stores';
COMMENT ON COLUMN new_table.name IS 'Description of this column';
```

---

### 4. Common Migration Patterns

#### Adding a Column

```sql
-- Add column with default value
ALTER TABLE assessments
ADD COLUMN cancelled_at TIMESTAMPTZ;

-- Add column with constraint
ALTER TABLE clients
ADD COLUMN writeoff_percentage DECIMAL(5,2) CHECK (writeoff_percentage >= 0 AND writeoff_percentage <= 100);
```

#### Modifying a Column

```sql
-- Change column type
ALTER TABLE requests
ALTER COLUMN vehicle_year TYPE INTEGER USING vehicle_year::INTEGER;

-- Add NOT NULL constraint
ALTER TABLE appointments
ALTER COLUMN client_id SET NOT NULL;

-- Drop column
ALTER TABLE old_table
DROP COLUMN deprecated_column;
```

#### Creating a Table

```sql
CREATE TABLE assessment_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  source_tab TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_assessment_notes_assessment ON assessment_notes(assessment_id);

-- Enable RLS
ALTER TABLE assessment_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on assessment_notes for now"
  ON assessment_notes FOR ALL USING (true) WITH CHECK (true);

-- Create trigger
CREATE TRIGGER update_assessment_notes_updated_at
  BEFORE UPDATE ON assessment_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Creating an Index

```sql
-- Single column index
CREATE INDEX idx_requests_status ON requests(status);

-- Composite index
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Unique index
CREATE UNIQUE INDEX idx_user_profiles_email ON user_profiles(email);
```

#### Adding Foreign Key

```sql
ALTER TABLE appointments
ADD CONSTRAINT fk_appointments_client
FOREIGN KEY (client_id) REFERENCES clients(id);
```

#### Creating a Function

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Creating RLS Policies

```sql
-- Authenticated users can read all
CREATE POLICY "Authenticated users can read all"
  ON table_name
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own records
CREATE POLICY "Users can update own records"
  ON table_name
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins can manage all"
  ON table_name
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

### 5. Test Migration Locally

If using Supabase CLI:

```bash
# Apply migration locally
supabase db reset

# Or apply specific migration
supabase migration up
```

If using Supabase dashboard:
1. Go to SQL Editor
2. Paste migration SQL
3. Run to test

---

### 6. Apply Migration to Remote Database

#### Option A: Supabase CLI (Recommended)

```bash
# Push migration to remote
supabase db push
```

#### Option B: Supabase Dashboard

1. Go to **Database** → **Migrations** in Supabase dashboard
2. Upload or paste your migration SQL
3. Click **Run migration**

#### Option C: SQL Editor

1. Go to **SQL Editor** in Supabase dashboard
2. Paste migration SQL
3. Click **Run**

---

### 7. Verify Migration

After applying:

1. Check tables exist:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_schema = 'public';
   ```

2. Check columns:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'your_table_name';
   ```

3. Check indexes:
   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'your_table_name';
   ```

4. Test RLS policies:
   - Try SELECT/INSERT/UPDATE/DELETE as different user roles

---

### 8. Update TypeScript Types (if needed)

If you added/modified tables, update TypeScript types:

**Option A: Auto-generate from Supabase**
```bash
supabase gen types typescript --local > src/lib/types/database.ts
```

**Option B: Manually update `src/lib/types/`**
- Update relevant type files in `src/lib/types/`
- Add new interfaces for new tables
- Update existing interfaces for modified tables

Example:
```typescript
// src/lib/types/assessment.ts
export interface AssessmentNote {
  id: string
  assessment_id: string
  note_text: string
  source_tab: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}
```

---

### 9. Commit to Git

```bash
git add supabase/migrations/048_your_migration_name.sql
git commit -m "feat: add migration for [feature description]"
git push
```

---

## Best Practices

### 1. Make Migrations Idempotent

Use `IF NOT EXISTS` / `IF EXISTS` to make migrations safe to run multiple times:

```sql
CREATE TABLE IF NOT EXISTS my_table (...);

ALTER TABLE my_table ADD COLUMN IF NOT EXISTS new_column TEXT;

DROP TABLE IF EXISTS old_table;

CREATE INDEX IF NOT EXISTS idx_my_table_field ON my_table(field);
```

### 2. Always Enable RLS

For security, enable RLS on all new tables:

```sql
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
```

### 3. Create Permissive Policies for Development

During development, use permissive policies:

```sql
CREATE POLICY "Allow all operations for now"
  ON new_table FOR ALL USING (true) WITH CHECK (true);
```

**Production:** Tighten policies based on role/ownership.

### 4. Add Indexes for Foreign Keys

Always create indexes on foreign key columns:

```sql
CREATE INDEX idx_table_foreign_key_id ON table(foreign_key_id);
```

### 5. Use Triggers for `updated_at`

Always add `updated_at` trigger for tables with that column:

```sql
CREATE TRIGGER update_table_name_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 6. Add Comments for Documentation

Use `COMMENT ON` for better documentation:

```sql
COMMENT ON TABLE assessments IS 'Main assessment records for vehicle inspections';
COMMENT ON COLUMN assessments.status IS 'Assessment workflow status';
```

### 7. Use Transactions for Complex Migrations

Wrap complex migrations in transactions to ensure atomicity:

```sql
BEGIN;

-- Multiple DDL statements here

COMMIT;
```

### 8. Test Rollback Strategy

Before applying to production, ensure you can rollback:

```sql
-- Create rollback migration (optional)
-- e.g., 048_rollback_add_status_to_requests.sql

ALTER TABLE requests DROP COLUMN status;
```

---

## Common Pitfalls

### 1. Forgetting to Update RLS Policies

When adding new tables, RLS is enabled but no policies exist → all queries fail.

**Solution:** Add permissive policies during development.

### 2. Not Creating Indexes on Foreign Keys

Missing indexes on FK columns → slow queries.

**Solution:** Always index foreign keys.

### 3. Breaking Changes Without Migration Plan

Dropping columns or changing types can break the app.

**Solution:**
- Add new column first
- Migrate data
- Update application code
- Remove old column in separate migration

### 4. Not Testing Migration Locally

Applying untested migrations to production → potential downtime.

**Solution:** Always test migrations locally first.

---

## Examples from ClaimTech

### Example 1: Adding Auth System (043_auth_setup.sql)

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'engineer')),
  province TEXT,
  company TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Create trigger for auto-profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'engineer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Example 2: Securing Storage (044_secure_storage_policies.sql)

```sql
-- Change buckets to private
UPDATE storage.buckets
SET public = false
WHERE id IN ('documents', 'SVA Photos');

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Create authenticated-only policies
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');
```

---

## Related Documentation
- Database Schema: `../System/database_schema.md`
- Project Architecture: `../System/project_architecture.md`
