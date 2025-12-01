# Supabase Type Generation & Database Typing

**Last Updated**: November 21, 2025 (Type Inference Fix - PostgrestFilterBuilder<never> Resolution)  
**Status**: ✅ RESOLVED - All Supabase type inference working correctly

---

## Overview

ClaimTech uses Supabase's TypeScript type generation system to provide compile-time type safety for all database operations. This document explains how types are generated, maintained, and why the current approach was chosen.

---

## Type Generation Process

### How It Works

1. **Generate from Database Schema**
   ```bash
   npx supabase gen types typescript --project-id cfblmkzleqtvtfxujikf --schema public
   ```

2. **Output Structure**
   - `__InternalSupabase` field with PostgrestVersion (REQUIRED for type inference)
   - `Tables` object with Row/Insert/Update/Relationships for each table
   - Explicit field definitions (not helper types)

3. **Integration**
   - Generated types replace custom Database interface in `src/lib/types/database.ts`
   - Domain type aliases re-exported for convenience (Client, Assessment, etc.)
   - Type assertions used in services where domain types are stricter than generated types

---

## Critical Fix: PostgrestFilterBuilder<never> (Nov 21, 2025)

### Problem
Custom Database interface was missing `__InternalSupabase` field, causing all database operations to infer `PostgrestFilterBuilder<never>`, breaking type safety completely.

### Solution
- Regenerated types from actual Supabase database using CLI
- Replaced custom structure with generated types
- Added domain type re-exports and type assertions in services

### Files Modified
- `src/lib/types/database.ts` - Replaced with generated types
- `src/lib/services/client.service.ts` - Added type assertions (5 locations)
- `src/lib/services/audit.service.ts` - Added type assertions (5 locations)
- `src/lib/services/assessment.service.ts` - Added type assertions (2 locations)

### Verification
```bash
npm run check 2>&1 | Select-String "PostgrestFilterBuilder.*never"
# Result: No matches found ✅
```

---

## Domain Types vs Generated Types

### Why Both?

**Generated Types** (from Supabase):
- Use `string` for enum fields (e.g., `type: string`)
- Provide accurate database schema representation
- Enable proper type inference for queries

**Domain Types** (custom):
- Use specific union types (e.g., `ClientType = 'insurance' | 'private'`)
- Provide better type safety in application code
- Prevent invalid enum values at compile time

### Pattern Used

```typescript
// In database.ts - re-export domain types
export type { Client, ClientType } from './client';

// In services - use type assertions
return (data || []) as Client[];
```

---

## Maintenance

### When to Regenerate Types

1. **After schema migrations** - Always regenerate to stay in sync
2. **When adding new tables** - Regenerate to include new tables
3. **When modifying columns** - Regenerate to reflect changes

### How to Regenerate

```bash
# Set access token
$env:SUPABASE_ACCESS_TOKEN="sbp_..."

# Generate types
npx supabase gen types typescript --project-id cfblmkzleqtvtfxujikf --schema public > src/lib/types/database.ts

# Add domain type re-exports at end of file
# (see current database.ts for example)
```

---

## Related Documentation

- [Project Architecture](./project_architecture.md) - ServiceClient pattern
- [Database Schema](./database_schema.md) - All tables and relationships
- [SOP: Adding Migrations](../SOP/adding_migration.md) - When to regenerate types

