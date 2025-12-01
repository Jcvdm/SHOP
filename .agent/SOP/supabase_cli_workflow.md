# Supabase CLI Workflow Guide

## Overview

This guide covers common development workflows using the Supabase CLI for ClaimTech (SVA project).

**Project**: SVA (ClaimTech)  
**Project Ref**: `cfblmkzleqtvtfxujikf`  
**Region**: eu-central-1

---

## Prerequisites

1. **Supabase CLI installed**:
   ```bash
   npm install -g supabase
   supabase --version
   ```

2. **Authenticated with PAT**:
   ```bash
   supabase login --token <YOUR_PAT>
   ```

3. **Project linked** (already done):
   ```bash
   supabase link --project-ref cfblmkzleqtvtfxujikf
   ```

---

## Workflow 1: Generate TypeScript Types

**When**: After making schema changes in Supabase dashboard or applying migrations

**Steps**:

1. Make schema changes (add column, create table, etc.)
2. Generate types:
   ```bash
   npm run generate:types
   ```
3. Types are saved to `src/lib/types/database.generated.ts`
4. Import in your code:
   ```typescript
   import type { Database } from '$lib/types/database.generated';
   type Assessment = Database['public']['Tables']['assessments']['Row'];
   ```

**Troubleshooting**:
- If script fails, ensure you're logged in: `supabase login --token <PAT>`
- If types file has escape codes, re-link: `supabase link --project-ref cfblmkzleqtvtfxujikf`

---

## Workflow 2: Create and Apply Migration

**When**: Adding tables, columns, RLS policies, indexes, or triggers

**Steps**:

1. **Create migration from diff**:
   ```bash
   supabase db diff -f add_new_column
   ```
   Creates: `supabase/migrations/XXX_add_new_column.sql`

2. **Review the generated SQL**:
   ```bash
   cat supabase/migrations/XXX_add_new_column.sql
   ```
   - Verify column names, types, constraints
   - Add RLS policies if needed
   - Add indexes for performance

3. **Test locally** (optional):
   ```bash
   supabase start
   supabase db push
   supabase stop
   ```

4. **Apply to remote**:
   ```bash
   supabase db push
   ```
   ⚠️ This runs against the **linked remote database**

5. **Generate updated types**:
   ```bash
   npm run generate:types
   ```

**Best Practices**:
- Always review migration SQL before pushing
- Test on a branch first (see Workflow 3)
- Keep migrations small and focused
- Add comments explaining complex changes

---

## Workflow 3: Work on Feature Branch

**When**: Developing features that require schema changes

**Steps**:

1. **Create database branch**:
   ```bash
   supabase db branch create feature-new-assessment-type
   ```

2. **Switch to branch**:
   ```bash
   supabase db branch switch feature-new-assessment-type
   ```

3. **Make schema changes**:
   ```bash
   supabase db diff -f add_assessment_type_column
   supabase db push
   ```

4. **Generate types for branch**:
   ```bash
   npm run generate:types
   ```

5. **Develop and test** on the branch

6. **When ready, merge via Supabase dashboard**:
   - Go to Supabase dashboard
   - Navigate to Branching
   - Merge branch to main

7. **Switch back to main**:
   ```bash
   supabase db branch switch main
   ```

8. **Delete branch**:
   ```bash
   supabase db branch delete feature-new-assessment-type
   ```

9. **Pull latest changes**:
   ```bash
   supabase db pull
   npm run generate:types
   ```

**Benefits**:
- Isolated database for testing
- No impact on production
- Easy rollback if needed
- Team can review changes before merge

---

## Workflow 4: Execute SQL Queries

**When**: Testing queries, debugging data issues, running one-off operations

**Steps**:

1. **Create query file**:
   ```sql
   -- queries/test_assessment_count.sql
   SELECT COUNT(*) as total_assessments
   FROM assessments
   WHERE stage = 'assessment_in_progress';
   ```

2. **Execute query**:
   ```bash
   supabase db execute --file queries/test_assessment_count.sql
   ```

3. **Or use interactive shell**:
   ```bash
   supabase db shell
   # Then type SQL commands
   ```

---

## Workflow 5: Pull Remote Changes

**When**: Team member pushed migrations, need to sync local

**Steps**:

1. **Pull migrations**:
   ```bash
   supabase db pull
   ```

2. **Review pulled migrations**:
   ```bash
   ls supabase/migrations/
   ```

3. **Generate updated types**:
   ```bash
   npm run generate:types
   ```

4. **Commit changes**:
   ```bash
   git add supabase/migrations/ src/lib/types/database.generated.ts
   git commit -m "chore: sync database schema from remote"
   ```

---

## Workflow 6: Troubleshoot Migration Issues

**When**: Migration fails or gets stuck

**Steps**:

1. **Check migration status**:
   ```bash
   supabase db remote list
   ```

2. **View recent migrations**:
   ```bash
   supabase db remote list --limit 10
   ```

3. **If migration failed**:
   - Check Supabase dashboard for error details
   - Fix the migration SQL
   - Create a new migration to fix the issue
   - Never modify existing migrations

4. **If stuck in local state**:
   ```bash
   supabase db reset
   supabase db push
   ```

---

## Common Commands Reference

```bash
# Authentication
supabase login --token <PAT>
supabase logout

# Setup
supabase init
supabase link --project-ref cfblmkzleqtvtfxujikf

# Types
npm run generate:types

# Migrations
supabase db diff -f migration_name
supabase db push
supabase db pull
supabase db execute --file query.sql
supabase db shell

# Branching
supabase db branch list
supabase db branch create <name>
supabase db branch switch <name>
supabase db branch delete <name>

# Local Development
supabase start
supabase status
supabase stop
supabase db reset
```

---

## Security Reminders

1. **Never commit PATs** to git
2. **Review migrations** before pushing to production
3. **Test on branches** before merging to main
4. **Use `.gitignore`** for `.env` files
5. **Rotate tokens** if accidentally exposed

---

## Related Documentation

- [System/supabase_cli.md](../System/supabase_cli.md) - Complete CLI reference
- [SOP/adding_migration.md](../SOP/adding_migration.md) - Detailed migration guide
- [System/database_schema.md](../System/database_schema.md) - Database structure
- [System/project_architecture.md](../System/project_architecture.md) - System design

---

*Last Updated: November 21, 2025*

