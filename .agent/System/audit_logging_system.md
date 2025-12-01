# Audit Logging System

**Last Updated**: November 29, 2025
**Status**: Comprehensive audit logging with automatic user context capture implemented across all assessment workflow operations

---

## Overview

ClaimTech implements comprehensive audit logging to track all interactions and changes within the assessment workflow. The audit system provides complete visibility into who did what, when, and why across all entities in the system.

### Key Features

- **Complete Coverage**: All assessment workflow operations are logged
- **Specific Actions**: 21 distinct audit action types for granular tracking
- **Metadata Context**: Rich metadata captures operation details
- **Admin-Only Access**: Audit trail visible only to admin users via dedicated tab
- **Non-Breaking**: Audit logging failures never interrupt main operations

---

## Architecture

### Database Schema

The `audit_logs` table structure:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,  -- Type of entity (assessment, estimate, etc.)
  entity_id UUID NOT NULL,     -- ID of the affected entity
  action TEXT NOT NULL,         -- Action performed (see AuditAction type)
  field_name TEXT,              -- Optional: specific field changed
  old_value TEXT,               -- Optional: previous value
  new_value TEXT,               -- Optional: new value
  changed_by TEXT,              -- User who made the change (auto-captured from auth)
  metadata JSONB,               -- Additional context (descriptions, totals, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### User Information Captured

The `changed_by` field now automatically captures user information using the following priority hierarchy:

1. **Explicit `changed_by`** - If explicitly passed in `CreateAuditLogInput`
2. **User Email** - Extracted from Supabase auth context
3. **User ID** - If email not available, falls back to user ID
4. **'System'** - Default for unauthenticated or system operations

**Example**:
```typescript
// User email automatically captured from auth context
await auditService.logChange({
  entity_type: 'estimate',
  entity_id: assessmentId,
  action: 'line_item_added',
  metadata: { /* context */ }
});
// Result: changed_by = "john@example.com" (extracted from auth, not passed explicitly)
```

This automatic capture works across ALL services without requiring individual refactoring. Services can pass their `ServiceClient` parameter to `logChange()` for better control, but the fallback to the global browser client's auth context ensures user attribution works everywhere.

### Indexes

```sql
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

### Entity Types

21 supported entity types tracked in the system:

```typescript
'request' | 'inspection' | 'task' | 'client' | 'engineer' | 
'appointment' | 'assessment' | 'vehicle_identification' | 
'exterior_360' | 'accessory' | 'interior_mechanical' | 
'tyre' | 'damage_record' | 'vehicle_values' | 'estimate' | 
'pre_incident_estimate' | 'frc' | 'frc_document' | 
'estimate_line_item' | 'assessment_notes'
```

---

## Audit Actions

### Basic Actions (9)
- `created` - Entity created
- `updated` - Generic update
- `status_changed` - Status field changed
- `assigned` - Assignment to user/engineer
- `cancelled` - Entity cancelled
- `accepted` - Entity accepted
- `appointed` - Engineer appointed
- `completed` - Entity completed
- `stage_transition` - Assessment stage changed

### Line Item Actions (7)
- `line_item_added` - Line item added to estimate/additionals
- `line_item_updated` - Line item modified
- `line_item_deleted` - Line item removed
- `line_item_approved` - Additionals line item approved
- `line_item_declined` - Additionals line item declined
- `line_item_reversed` - Approved line item reversed
- `line_item_reinstated` - Declined line item reinstated

### Specialized Actions (5)
- `original_line_removed` - Original estimate line removed in additionals
- `rates_updated` - Estimate/additionals rates/markups changed
- `frc_completed` - FRC sign-off completed
- `frc_merged` - FRC merged additionals into snapshot
- `assessment_created` - Assessment record created

**Total: 21 distinct audit action types**

---

## Service Layer Implementation

### AuditService

Location: `src/lib/services/audit.service.ts`

**Methods:**

```typescript
// Log a change (never throws, returns null on failure)
// Automatically extracts user from auth context
async logChange(input: CreateAuditLogInput, client?: ServiceClient): Promise<AuditLog | null>

// Get history for specific entity type
async getEntityHistory(entityType: EntityType, entityId: string, client?: ServiceClient): Promise<AuditLog[]>

// Get all logs for an assessment (cross-entity-type)
async getAssessmentHistory(assessmentId: string, client?: ServiceClient): Promise<AuditLog[]>

// Get recent logs across all entities
async getRecentLogs(limit: number = 50, client?: ServiceClient): Promise<AuditLog[]>

// Get logs by action type
async getLogsByAction(action: string, limit: number = 50, client?: ServiceClient): Promise<AuditLog[]>
```

**User Context Extraction in `logChange()`:**

The method automatically captures user information without requiring services to pass `changed_by`:

```typescript
async logChange(input: CreateAuditLogInput, client?: ServiceClient): Promise<AuditLog | null> {
  const db = client ?? supabase;

  try {
    // Priority: explicit changed_by > user email > user ID > 'System'
    let changedBy = input.changed_by;
    if (!changedBy) {
      const authClient = client ?? supabase;  // Use passed client OR global browser client
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        changedBy = user.email || user.id;
      }
    }
    changedBy = changedBy || 'System';

    // Insert with captured user information
    const { data, error } = await db
      .from('audit_logs')
      .insert({
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        action: input.action,
        field_name: input.field_name || null,
        old_value: input.old_value || null,
        new_value: input.new_value || null,
        changed_by: changedBy,  // Auto-captured user
        metadata: input.metadata || null
      })
      .select()
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error('Audit log error:', error);
    return null;  // Non-blocking
  }
}
```

**Key Patterns**:
- Always accepts optional `ServiceClient` parameter for explicit control
- Automatically falls back to global browser client for auth context
- Non-blocking: catches all errors and returns null instead of throwing
- Works across ALL services without individual refactoring required

### Error Handling Pattern

Audit logging uses defensive error handling:

```typescript
try {
  await auditService.logChange({
    entity_type: 'estimate',
    entity_id: assessmentId,
    action: 'line_item_added',
    metadata: { /* context */ }
  });
} catch (auditError) {
  console.error('Error logging audit change:', auditError);
  // Never throw - audit failures don't break main operations
}
```

**Rationale**: Audit logging is important but non-critical. Main operations must continue even if audit logging fails.

---

## Coverage by Service

### ✅ Fully Logged Services

#### Request Service
- ✅ Request creation (`created`)
- ✅ Request updates (`updated`, `status_changed`, `assigned`)
- ✅ Status changes (`status_changed`)

#### Inspection Service
- ✅ Inspection creation (`created`)
- ✅ Status changes (`status_changed`)
- ✅ Engineer appointment (`appointed`)
- ✅ Cancellation (`cancelled`)

#### Appointment Service
- ✅ Appointment creation (`created`)
- ✅ Status changes (`status_changed`)
- ✅ Rescheduling (`rescheduled`)
- ✅ Cancellation (`cancelled`)

#### Assessment Service
- ✅ Assessment creation (`assessment_created`)
- ✅ Stage transitions (`stage_transition`)
- ✅ Finalization (`updated`)
- ✅ Cancellation (`cancelled`)

#### Estimate Service
- ✅ Estimate creation (`created`)
- ✅ Rate updates (`rates_updated`) - tracks labour_rate, paint_rate, vat_percentage changes
- ✅ Line item added (`line_item_added`)
- ✅ Line item updated (`line_item_updated`)
- ✅ Line item deleted (`line_item_deleted`)
- ✅ Bulk deletion (`line_item_deleted` with count metadata)

#### Pre-Incident Estimate Service
- ✅ Estimate creation (`created`)
- ✅ Rate updates (`rates_updated`)
- ✅ Line item added (`line_item_added`)
- ✅ Line item updated (`line_item_updated`)
- ✅ Line item deleted (`line_item_deleted`)

#### Additionals Service
- ✅ Additionals creation (`created`)
- ✅ Rate sync (`rates_updated`)
- ✅ Line item added (`line_item_added`)
- ✅ Line item approved (`line_item_approved`)
- ✅ Line item declined (`line_item_declined`)
- ✅ Line item deleted (`line_item_deleted`)
- ✅ Line item reversed (`line_item_reversed`)
- ✅ Line item reinstated (`line_item_reinstated`)
- ✅ Original line removed (`original_line_removed`)

#### FRC Service
- ✅ FRC start (`created`)
- ✅ Additionals merge (`frc_merged`)
- ✅ Line decision updates (`updated`)
- ✅ FRC completion (`frc_completed`)

#### Vehicle Tab Services
- ✅ Vehicle identification updates (`updated` with fields_updated metadata)
- ✅ Exterior 360 updates (`updated` with fields_updated metadata)
- ✅ Interior mechanical updates (`updated` with fields_updated metadata)
- ✅ Vehicle values updates (`updated` with fields_updated metadata)

#### Assessment Notes Service
- ✅ Note creation (`created`)
- ✅ Note updates (`updated`)
- ✅ Note deletion (`cancelled`)

#### Damage Service
- ✅ Damage record creation (`created`)
- ✅ Damage record deletion (`cancelled`)

#### Tyres Service
- ✅ Tyre creation (`created`)
- ✅ Tyre updates (`updated`)
- ✅ Tyre deletion (`cancelled`)

---

## Metadata Patterns

### Line Item Operations

```typescript
{
  line_item_id: string,
  description: string,
  process_type?: string,
  total?: number,
  old_total?: number,  // For updates
  new_total?: number   // For updates
}
```

### Rate Updates

```typescript
{
  estimate_id: string,
  old_labour_rate: number,
  new_labour_rate: number,
  old_paint_rate: number,
  new_paint_rate: number,
  old_vat_percentage: number,
  new_vat_percentage: number
}
```

### Additionals Operations

```typescript
{
  line_item_id: string,
  description: string,
  reason?: string,      // For decline/reverse
  reversed_total?: number,
  reinstated_total?: number
}
```

### FRC Operations

```typescript
{
  frc_id: string,
  sign_off_by: string,
  completion_date: string,
  final_total: number,
  quoted_total: number,
  actual_total: number,
  delta: number,
  additionals_count?: number  // For merge operations
}
```

### Assessment Creation

```typescript
{
  assessment_number: string,
  request_id: string
}
```

### Vehicle Tab Updates

```typescript
{
  fields_updated: string[]  // Array of field names changed
}
```

---

## Entity ID Patterns

### Assessment-Centric Logging

Most operations use `assessment_id` as the `entity_id` regardless of the `entity_type`:

```typescript
// Estimate operations use assessment_id
await auditService.logChange({
  entity_type: 'estimate',      // Type of operation
  entity_id: assessmentId,        // Assessment context
  action: 'line_item_added',
  metadata: { /* details */ }
});
```

**Rationale**: This enables `getAssessmentHistory()` to retrieve all logs for an assessment across all entity types in a single query.

### Exception: Assessment Creation

Assessment creation uses the assessment's own ID:

```typescript
await auditService.logChange({
  entity_type: 'assessment',
  entity_id: data.id,  // Assessment's own ID
  action: 'assessment_created',
  metadata: { assessment_number, request_id }
});
```

This works because `getAssessmentHistory()` queries by `entity_id = assessmentId`, which matches both patterns.

---

## UI Components

### ActivityTimeline Component

Location: `src/lib/components/data/ActivityTimeline.svelte`

**Features:**
- Visual timeline with icons and colors
- Formatted action text with metadata display
- Relative time formatting
- Badge display for metadata fields
- Empty state handling

**Action Icons:**
- `created`, `line_item_added` → FileText/Plus (blue)
- `status_changed`, `line_item_approved`, `frc_completed` → CheckCircle (green)
- `cancelled`, `line_item_declined` → XCircle (red)
- `line_item_reversed` → RotateCcw (orange)
- `rates_updated` → DollarSign (purple)
- `updated`, `line_item_updated` → Edit (yellow)

### AuditTab Component

Location: `src/lib/components/assessment/AuditTab.svelte`

**Features:**
- Admin-only visibility (role check in AssessmentLayout)
- Fetches complete assessment history via `getAssessmentHistory()`
- Displays using ActivityTimeline component
- Loading state handling

**Access Control:**
- Only visible when `userRole === 'admin'`
- Tab appears dynamically in AssessmentLayout
- No server-side protection needed (client-side enforcement sufficient for read-only access)

---

## Querying Audit Logs

### Get All Assessment History

```typescript
const logs = await auditService.getAssessmentHistory(assessmentId, supabase);
// Returns all logs where entity_id = assessmentId
// Includes: assessment creation, estimate operations, FRC operations, etc.
```

### Get Entity-Specific History

```typescript
const logs = await auditService.getEntityHistory('estimate', estimateId, supabase);
// Returns only logs for specific entity type
```

### Get Recent Activity

```typescript
const logs = await auditService.getRecentLogs(50, supabase);
// Returns 50 most recent logs across all entities
```

### Get By Action Type

```typescript
const logs = await auditService.getLogsByAction('line_item_approved', 50, supabase);
// Returns all approval actions
```

---

## Best Practices

### 1. Always Use Assessment ID Context

For operations within an assessment workflow:

```typescript
// ✅ Good - Uses assessment_id for context
await auditService.logChange({
  entity_type: 'estimate',
  entity_id: estimate.assessment_id,  // Assessment context
  action: 'line_item_added',
  metadata: { /* ... */ }
});

// ❌ Bad - Uses estimate's own ID
await auditService.logChange({
  entity_type: 'estimate',
  entity_id: estimate.id,  // Loses assessment context
  action: 'line_item_added'
});
```

### 2. Include Descriptive Metadata

```typescript
// ✅ Good - Rich context
await auditService.logChange({
  entity_type: 'estimate',
  entity_id: assessmentId,
  action: 'line_item_deleted',
  metadata: {
    line_item_id: itemId,
    description: deletedItem.description,
    total: deletedItem.total
  }
});

// ❌ Bad - Minimal context
await auditService.logChange({
  entity_type: 'estimate',
  entity_id: assessmentId,
  action: 'line_item_deleted'
});
```

### 3. Use Specific Actions

```typescript
// ✅ Good - Specific action
await auditService.logChange({
  entity_type: 'estimate',
  entity_id: assessmentId,
  action: 'line_item_approved'  // Specific
});

// ❌ Bad - Generic action
await auditService.logChange({
  entity_type: 'estimate',
  entity_id: assessmentId,
  action: 'updated'  // Too generic
});
```

### 4. Never Break Main Operations

```typescript
// ✅ Good - Defensive error handling
try {
  await auditService.logChange({ /* ... */ });
} catch (auditError) {
  console.error('Error logging audit change:', auditError);
  // Continue - don't throw
}

// ❌ Bad - Could break operation
await auditService.logChange({ /* ... */ });  // Uncaught errors
```

### 5. Pass ServiceClient for RLS

```typescript
// ✅ Good - Authenticated client
await auditService.logChange({
  entity_type: 'estimate',
  entity_id: assessmentId,
  action: 'line_item_added'
}, client);  // ServiceClient for RLS

// ⚠️ Acceptable - Falls back to default client
await auditService.logChange({
  entity_type: 'estimate',
  entity_id: assessmentId,
  action: 'line_item_added'
});
```

---

## RLS Policies

The `audit_logs` table should have RLS enabled with appropriate policies:

**Admin Policy:**
```sql
CREATE POLICY "admin_all_audit_logs" ON audit_logs
FOR ALL USING (is_admin());
```

**Engineer Policy (if needed):**
```sql
CREATE POLICY "engineer_audit_logs" ON audit_logs
FOR SELECT USING (
  is_admin() OR
  entity_id IN (
    SELECT id FROM assessments 
    WHERE appointment_id IN (
      SELECT id FROM appointments WHERE engineer_id = auth.uid()
    )
  )
);
```

**Note**: Currently audit logs are admin-only in the UI, but policies should be configured for future engineer access needs.

---

## Migration History

### Initial Creation
- **Migration**: `004_create_audit_logs.sql`
- Created base table with initial entity types

### Entity Type Expansions
- **Migration**: `007_update_audit_logs_entity_types.sql` - Added assessment-related entities
- **Migration**: `020_add_estimate_to_audit_logs.sql` - Added estimate
- **Migration**: `023_add_pre_incident_estimate_to_audit_logs.sql` - Added pre-incident estimate
- **Migration**: `026_add_vehicle_values_to_audit_logs.sql` - Added vehicle values
- **Migration**: `032_add_frc_to_audit_logs.sql` - Added FRC entities

**Current**: 21 entity types supported (see Entity Types section above)

---

## Performance Considerations

### Indexing Strategy

Three indexes optimize common query patterns:

1. **Entity Queries**: `idx_audit_logs_entity` on `(entity_type, entity_id)`
   - Fast lookups for specific entity history

2. **Time-Based Queries**: `idx_audit_logs_created_at` on `created_at DESC`
   - Efficient recent log retrieval

3. **Action Filtering**: `idx_audit_logs_action` on `action`
   - Fast filtering by action type

### Query Performance

- `getAssessmentHistory()`: Single indexed query by `entity_id`
- `getEntityHistory()`: Indexed query by `(entity_type, entity_id)`
- `getRecentLogs()`: Indexed query by `created_at DESC`

**Recommendation**: Keep audit logs for active assessments. Archive old assessment audit logs to separate table if needed for compliance.

---

## Common Use Cases

### Viewing Assessment History

```typescript
// In AuditTab component
const logs = await auditService.getAssessmentHistory(assessmentId, supabase);
// Displays complete timeline of all assessment changes
```

### Debugging Line Item Issues

```typescript
// Get all line item operations
const added = await auditService.getLogsByAction('line_item_added', 100, supabase);
const deleted = await auditService.getLogsByAction('line_item_deleted', 100, supabase);
// Compare to identify discrepancies
```

### Tracking Rate Changes

```typescript
// Find when rates were modified
const rateChanges = await auditService.getLogsByAction('rates_updated', 50, supabase);
// Review metadata for old/new values
```

### Compliance Reporting

```typescript
// Get all changes by user
const userChanges = await auditService.getRecentLogs(1000, supabase);
const filtered = userChanges.filter(log => log.changed_by === userId);
// Generate compliance report
```

---

## Troubleshooting

### No Audit Logs Appearing

1. **Check service implementation**: Ensure service calls `auditService.logChange()`
2. **Verify entity_id**: Use `assessmentId` for assessment-related operations
3. **Check error logs**: Audit errors are logged but don't throw
4. **Verify RLS**: Ensure user has access to `audit_logs` table

### Missing Specific Actions

1. **Check action type**: Ensure action is in `AuditAction` type
2. **Verify service**: Service may not be logging that operation
3. **Review metadata**: Action may be logged with different metadata

### Performance Issues

1. **Check indexes**: Verify indexes exist on `audit_logs` table
2. **Limit queries**: Use `limit` parameter in retrieval methods
3. **Archive old logs**: Consider archiving logs for archived assessments

---

## Future Enhancements

### Potential Improvements

1. **User ID Integration**: Replace `changed_by` TEXT with UUID FK to `users`
2. **IP Address Tracking**: Add IP address column for security auditing
3. **Batch Logging**: Support bulk audit log inserts for high-volume operations
4. **Compression**: Archive old logs with compression for storage efficiency
5. **Real-time Notifications**: Alert admins on critical audit events
6. **Export Functionality**: CSV/PDF export for compliance reports

---

## Related Documentation

- **[Database Schema](./database_schema.md)** - Complete `audit_logs` table schema
- **[Project Architecture](./project_architecture.md)** - Overall system design
- **[Service Layer Pattern](../SOP/working_with_services.md)** - How services work
- **[Assessment-Centric Architecture](../SOP/working_with_assessment_centric_architecture.md)** - Assessment workflow patterns
- **[Database Quick Ref](../README/database_quick_ref.md)** - Quick schema reference

---

## Maintenance

**Last Updated**: January 30, 2025  
**Maintained By**: ClaimTech Engineering Team

**Update Triggers**:
- New entity types added
- New audit actions introduced
- Service layer changes affecting audit logging
- Performance optimizations

---

*This documentation reflects the comprehensive audit logging implementation completed January 30, 2025.*

