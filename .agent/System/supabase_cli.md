# Supabase CLI Guide

## Overview

The Supabase CLI is a command-line tool for managing Supabase projects, running local development environments, managing database migrations, and generating TypeScript types.

**Project**: SVA (ClaimTech)  
**Project Ref**: `cfblmkzleqtvtfxujikf`  
**Region**: eu-central-1

---

## Installation

### Global Installation (Recommended)

```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

### Per-Command Usage (No Install)

```bash
npx supabase@latest <command>
```

---

## Authentication

### Option A: Interactive Login (Browser)

```bash
supabase login
```

Opens browser for authentication. Token is stored locally in `~/.supabase/access-token`.

### Option B: Login with Personal Access Token

```bash
supabase login --token <YOUR_PAT>
```

**Getting a PAT**:
1. Go to https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Name it (e.g., "ClaimTech CLI")
4. Copy the `sbp_...` token
5. **Never commit this token to git**

---

## Project Setup

### Initialize Supabase in Repository

From project root:

```bash
supabase init
```

Creates:
- `supabase/` directory
- `supabase/config.toml` (local configuration)
- `supabase/migrations/` (migration files)
- `.vscode/settings.json` (Deno settings, optional)

**Run this once per repository.**

### Link to Remote Project

```bash
supabase link --project-ref cfblmkzleqtvtfxujikf
```

Links local repo to the SVA project. You'll be prompted for:
- Database password (optional, can skip)

After linking, all CLI commands operate against this project unless overridden.

---

## Database Operations

### Generate TypeScript Types

Generate types from the remote database schema:

```bash
# Using the generate-types script (recommended)
npm run generate:types

# Or manually
supabase gen types typescript --project-id cfblmkzleqtvtfxujikf --schema public > src/lib/types/database.generated.ts
```

**Script location**: `scripts/generate-types.ps1`

### Create Migration from Schema Diff

```bash
supabase db diff -f migration_name
```

Creates a new migration file in `supabase/migrations/` with SQL changes.

### Push Migrations to Remote

```bash
supabase db push
```

**⚠️ Warning**: This runs migrations against the **linked remote database**. Always:
1. Review migration SQL files first
2. Test on a branch or dev environment
3. Have a backup plan

### Execute SQL Queries

```bash
# From a file
supabase db execute --file ./path/to/query.sql

# Interactive SQL shell
supabase db shell
```

---

## Database Branching

Supabase supports database branching for isolated development.

### List Branches

```bash
supabase db branch list
```

### Create New Branch

```bash
supabase db branch create feature-branch-name
```

### Switch to Branch

```bash
supabase db branch switch feature-branch-name
```

After switching, all `supabase db` commands operate on that branch.

### Delete Branch

```bash
supabase db branch delete feature-branch-name
```

---

## Local Development (Optional)

Run a local Supabase stack using Docker:

```bash
# Start local services (Postgres, Auth, Storage, etc.)
supabase start

# Check status
supabase status

# Stop services
supabase stop
```

**Requirements**: Docker Desktop must be running.

**Use case**: Testing migrations locally before pushing to remote.

---

## Common Workflows

### Workflow 1: Generate Types After Schema Changes

```bash
# After making schema changes in Supabase dashboard or via migrations
npm run generate:types
```

### Workflow 2: Create and Apply Migration

```bash
# 1. Make schema changes in Supabase dashboard
# 2. Generate migration from diff
supabase db diff -f add_new_column

# 3. Review the generated SQL in supabase/migrations/
# 4. Push to remote (if satisfied)
supabase db push
```

### Workflow 3: Work on Feature Branch

```bash
# 1. Create database branch
supabase db branch create feature-x

# 2. Switch to branch
supabase db branch switch feature-x

# 3. Make changes, test, iterate
# 4. When ready, merge branch via Supabase dashboard
# 5. Delete branch
supabase db branch delete feature-x
```

---

## Configuration

### Local Config: `supabase/config.toml`

Contains local development settings:
- API ports
- Auth settings
- Database settings
- Storage settings

**Note**: Local config may differ from remote project config. The CLI will warn you about differences after linking.

### Environment Variables

Store secrets in `.env` (never commit):

```bash
SUPABASE_ACCESS_TOKEN=sbp_...
SUPABASE_DB_PASSWORD=...
```

---

## Security Best Practices

1. **Never commit PATs or service_role keys** to git
2. **Review all migrations** before `supabase db push`
3. **Test on branches** before applying to production
4. **Use `.gitignore`** to exclude:
   - `.env`
   - `.supabase/` (if it contains secrets)
5. **Rotate tokens** if accidentally exposed

---

## Troubleshooting

### "Project not linked" Error

Run:
```bash
supabase link --project-ref cfblmkzleqtvtfxujikf
```

### Types Generation Prompts for Project

The CLI may prompt for project selection even with `--project-id`. Use the script:
```bash
npm run generate:types
```

### Migration Conflicts

If migrations are out of sync:
```bash
# Check migration status
supabase db remote list

# Pull remote migrations
supabase db pull
```

---

## Quick Reference

```bash
# Authentication
supabase login
supabase login --token <PAT>

# Setup
supabase init
supabase link --project-ref cfblmkzleqtvtfxujikf

# Types
npm run generate:types

# Migrations
supabase db diff -f migration_name
supabase db push
supabase db execute --file query.sql

# Branching
supabase db branch list
supabase db branch create <name>
supabase db branch switch <name>
supabase db branch delete <name>

# Local Development
supabase start
supabase status
supabase stop
```

---

## Related Documentation

- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Database Branching](https://supabase.com/docs/guides/platform/branching)
- `.agent/System/supabase_config.md` - Configuration details
- `.agent/SOP/supabase_cli_workflow.md` - Development workflows

---

*Last Updated: November 2025*

