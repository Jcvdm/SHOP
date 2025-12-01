# Task: Add User Context to Audit Trail

**Created**: 2025-11-29
**Status**: Completed
**Complexity**: Moderate
**Completed**: 2025-11-29

## Overview
The audit trail shows "System" for all events instead of the actual user who performed actions. Fix this by extracting user info from Supabase auth context in the audit service.

## Root Cause
- `changed_by` defaults to 'System' in audit.service.ts
- Services don't pass user information when calling `auditService.logChange()`
- Auth context IS available via ServiceClient but not used

## Solution
Extract user from ServiceClient's auth context in audit service. Single point of change.

## Files to Modify

### 1. `src/lib/services/audit.service.ts` (PRIMARY)

**Current `logChange()` method** (lines ~22-40):
```typescript
async logChange(input: CreateAuditLogInput, client?: ServiceClient): Promise<AuditLog | null> {
    const db = client ?? supabase;
    // ... insert with changed_by: input.changed_by || 'System'
}
```

**Updated `logChange()` method**:
```typescript
async logChange(input: CreateAuditLogInput, client?: ServiceClient): Promise<AuditLog | null> {
    const db = client ?? supabase;

    try {
        // Determine changed_by: explicit > auth user > 'System'
        let changedBy = input.changed_by;
        if (!changedBy && client) {
            try {
                const { data: { user } } = await client.auth.getUser();
                if (user) {
                    changedBy = user.email || user.id;
                }
            } catch {
                // Auth call failed, will use default
            }
        }
        changedBy = changedBy || 'System';

        const { data, error } = await db
            .from('audit_logs')
            .insert({
                entity_type: input.entity_type,
                entity_id: input.entity_id,
                action: input.action,
                field_name: input.field_name || null,
                old_value: input.old_value || null,
                new_value: input.new_value || null,
                changed_by: changedBy,
                metadata: input.metadata || null
            })
            .select()
            .single();

        // ... rest unchanged
    } catch (error) {
        console.error('Audit log error:', error);
        return null;
    }
}
```

### 2. Verify Services Pass Client

Check these services pass `client` parameter to `auditService.logChange()`:
- `accessories.service.ts` - MAY NEED FIX if using global supabase
- Other services should already pass client

**Pattern to look for**:
```typescript
// BAD - no client passed
await auditService.logChange({...});

// GOOD - client passed
await auditService.logChange({...}, client);
```

## Implementation Steps

1. Read `src/lib/services/audit.service.ts` to understand current structure
2. Update `logChange()` to extract user from auth context
3. Grep for `auditService.logChange({` to find any calls missing client param
4. Fix any services not passing client
5. Run `npm run check` to verify no TypeScript errors

## Verification
- [x] `npm run check` passes
- [ ] Make a change in assessment UI as logged-in user (requires manual testing)
- [ ] Check Audit Trail tab shows user email instead of "System" (requires manual testing)

## Implementation Summary

### Changes Made

**1. Updated `src/lib/services/audit.service.ts`**
- Modified `logChange()` method to extract user from Supabase auth context
- Priority hierarchy: explicit `changed_by` > auth user email > auth user ID > 'System'
- Falls back to global browser client when no client parameter passed
- Non-blocking: wrapped in try/catch to prevent audit failures from breaking main flow

**Key logic**:
```typescript
let changedBy = input.changed_by;
if (!changedBy) {
    const authClient = client ?? supabase; // Use passed client OR global browser client
    const { data: { user } } = await authClient.auth.getUser();
    if (user) {
        changedBy = user.email || user.id;
    }
}
changedBy = changedBy || 'System';
```

**2. Refactored `src/lib/services/accessories.service.ts`**
- Added `client?: ServiceClient` parameter to all methods (create, get, listByAssessment, update, updateValue, delete)
- Added `import type { ServiceClient } from '$lib/types/service'`
- Updated all methods to use `const db = client ?? supabase` pattern
- Pass client parameter to all `auditService.logChange()` calls

**Why accessories.service.ts was refactored**:
While the audit service fix works for ALL services (even those not passing client), refactoring accessories.service.ts to follow the ServiceClient pattern:
- Makes it consistent with other services (assessment.service.ts, etc.)
- Enables future server-side usage with service role client
- Provides explicit control over which Supabase client is used
- Demonstrates the proper pattern for other services to follow

**Note on other services**:
Found 18 services calling `auditService.logChange()`. Most don't pass the client parameter, but the audit service fix handles this by falling back to the global browser client. These services should be gradually refactored to follow the ServiceClient pattern, but it's not blocking for the audit user context feature to work.

## Notes
- Keep operation non-blocking (already in try/catch)
- Fallback to 'System' for unauthenticated/system operations
- No database changes needed - `changed_by` is TEXT column
- Works immediately for ALL services, even those not yet refactored to pass client
