# Subprocess Stage Filtering Implementation - January 29, 2025

## Problem Summary

**User Requirement**: "When an assessment or report is finalized 'archived' - after FRC is done or assessment is cancelled, the additionals and FRC should not be listed - only active reports details should be listed here"

**Issue**: Additionals and FRC pages were showing ALL subprocess records, including those from archived/cancelled assessments, cluttering the active work lists.

## Solution Overview

Implemented **stage-based filtering** to show only subprocess records for **active assessments** (`stage = 'estimate_finalized'`).

### Assessment Stage Flow

```
Active Stages (show in subprocess pages):
8. estimate_finalized     ← Additionals/FRC work happens here

Terminal Stages (hide from subprocess pages):
10. archived              ← FRC completed, moved to Archive
11. cancelled             ← Assessment cancelled, moved to Archive
```

## Implementation Details

### 1. Additionals Service Updates

**File**: `src/lib/services/additionals.service.ts`

#### Method: `listAdditionals()` (lines 831-894)

**Added stage filter**:
```typescript
.eq('assessment.stage', 'estimate_finalized')  // Only active assessments
```

**Updated documentation**:
```typescript
/**
 * List all additionals records
 * Joins with assessments, appointments, inspections, requests, and clients
 * Pulls vehicle data from assessment_vehicle_identification (updated during assessment)
 * Only shows additionals for active assessments (stage = 'estimate_finalized')
 * Archived/cancelled assessments are excluded (moved to archive page)
 */
```

#### Method: `getAssessmentsAtStageCount()` (lines 975-1009)

**Added stage filter to badge count**:
```typescript
// Engineer view
.eq('stage', 'estimate_finalized')  // Only active assessments
.eq('appointments.engineer_id', engineer_id);

// Admin view
.eq('stage', 'estimate_finalized');  // Only active assessments
```

### 2. FRC Service Updates

**File**: `src/lib/services/frc.service.ts`

#### Method: `listFRC()` (lines 544-607)

**Added stage filter**:
```typescript
.eq('assessment.stage', 'estimate_finalized')  // Only active assessments
```

**Updated documentation**:
```typescript
/**
 * List all FRC records with optional status filter
 * Joins with assessments, appointments, inspections, requests, and clients
 * Only shows FRC for active assessments (stage = 'estimate_finalized')
 * Archived/cancelled assessments are excluded (moved to archive page)
 */
```

#### Method: `getCountByStatus()` (lines 609-649)

**Added stage filter to badge count**:
```typescript
// Engineer view
.eq('stage', 'estimate_finalized')  // Only active assessments
.eq('appointments.engineer_id', engineer_id)
.eq('assessment_frc.status', status);

// Admin view
.eq('stage', 'estimate_finalized')  // Only active assessments
.eq('assessment_frc.status', status);
```

## Stage-Based Page Visibility

### Current Implementation

| Page | Query Base | Stage Filter | Shows |
|------|-----------|--------------|-------|
| **Finalized Assessments** | `assessments` | `stage = 'estimate_finalized'` | Active finalized assessments ✅ |
| **Additionals** | `assessment_additionals` | `assessment.stage = 'estimate_finalized'` | Active additionals only ✅ |
| **FRC** | `assessment_frc` | `assessment.stage = 'estimate_finalized'` | Active FRC only ✅ |
| **Archive (Completed)** | `assessments` | `stage = 'archived'` | Completed assessments ✅ |
| **Archive (Cancelled)** | `assessments` | `stage = 'cancelled'` | Cancelled assessments ✅ |

### Assessment Lifecycle

```
Assessment Created → ... → estimate_finalized
                                    ↓
                          ┌─────────────────────┐
                          │  ACTIVE SUBPROCESS  │
                          │  - Additionals ✅   │
                          │  - FRC ✅           │
                          │  - Finalized ✅     │
                          └─────────────────────┘
                                    ↓
                    ┌─────────────────────────────────┐
                    │         COMPLETION              │
                    │  FRC Completed → archived       │
                    │  Assessment Cancelled → cancelled │
                    └─────────────────────────────────┘
                                    ↓
                          ┌─────────────────────┐
                          │   ARCHIVE PAGE      │
                          │  - Completed Tab ✅ │
                          │  - Cancelled Tab ✅ │
                          │  - Subprocess Hidden│
                          └─────────────────────┘
```

## Expected Behavior

### Before Implementation
- ❌ Additionals page: Shows all 7 additionals (including archived/cancelled)
- ❌ FRC page: Shows all FRC records (including archived/cancelled)
- ❌ Cluttered lists with completed work
- ❌ Confusing for engineers (seeing old work)

### After Implementation
- ✅ Additionals page: Shows only active additionals (`estimate_finalized` stage)
- ✅ FRC page: Shows only active FRC (`estimate_finalized` stage)
- ✅ Clean lists focused on current work
- ✅ Archived/cancelled work visible in Archive page
- ✅ Clear separation between active and completed work

## Code Pattern

### ✅ CORRECT - Subprocess List with Stage Filter

```typescript
async listSubprocess(client?: ServiceClient, engineer_id?: string | null): Promise<any[]> {
  const db = client ?? supabase;
  
  let query = db
    .from('subprocess_table')
    .select(`
      *,
      assessment:assessments!inner(
        id,
        assessment_number,
        stage,  // Include for debugging
        appointment:appointments!inner(...)
      )
    `)
    .eq('assessment.stage', 'estimate_finalized')  // ← Only active assessments
    .order('created_at', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error listing subprocess:', error);
    return [];
  }
  
  // Return subprocess records for active assessments only
  // Archived/cancelled assessments are filtered out by stage
  return data || [];
}
```

### ✅ CORRECT - Badge Count with Stage Filter

```typescript
async getSubprocessCount(client?: ServiceClient, engineer_id?: string | null): Promise<number> {
  const db = client ?? supabase;
  
  if (engineer_id) {
    // Engineer view - only their assigned active assessments with subprocess
    const { count, error } = await db
      .from('assessments')
      .select('id, appointments!inner(engineer_id), subprocess_table!inner(id)', { count: 'exact', head: true })
      .eq('stage', 'estimate_finalized')  // ← Only active assessments
      .eq('appointments.engineer_id', engineer_id);
    
    return count || 0;
  }
  
  // Admin view - all active assessments with subprocess
  const { count, error } = await db
    .from('assessments')
    .select('id, subprocess_table!inner(id)', { count: 'exact', head: true })
    .eq('stage', 'estimate_finalized');  // ← Only active assessments
  
  return count || 0;
}
```

## Testing Checklist

### Additionals Page
- [ ] Badge count shows only additionals for `estimate_finalized` assessments
- [ ] Table shows only additionals for `estimate_finalized` assessments
- [ ] Badge count matches table count
- [ ] Archived assessments with additionals do NOT appear
- [ ] Cancelled assessments with additionals do NOT appear
- [ ] Works for both admin and engineer users

### FRC Page
- [ ] Badge count shows only FRC for `estimate_finalized` assessments
- [ ] Table shows only FRC for `estimate_finalized` assessments
- [ ] Badge count matches table count
- [ ] Archived assessments with FRC do NOT appear
- [ ] Cancelled assessments with FRC do NOT appear
- [ ] Works for both admin and engineer users

### Archive Page
- [ ] Completed tab shows archived assessments (with FRC/additionals)
- [ ] Cancelled tab shows cancelled assessments (with FRC/additionals)
- [ ] Can navigate to assessment detail from archive
- [ ] Assessment detail shows FRC/additionals tabs (read-only)

### Workflow Integration
- [ ] Complete FRC → Assessment moves to `archived` → Disappears from Additionals/FRC lists → Appears in Archive
- [ ] Cancel assessment → Assessment moves to `cancelled` → Disappears from Additionals/FRC lists → Appears in Archive
- [ ] Reopen FRC → Assessment moves back to `estimate_finalized` → Reappears in Additionals/FRC lists

## Related Documentation

- [Additionals FRC Filtering Fix](./additionals_frc_filtering_fix_jan_29_2025.md) - Original subprocess pattern fix
- [FRC Stage Transition Fixes](./frc_stage_transition_fixes_jan_29_2025.md) - Stage transition logic
- [Database Schema](./database_schema.md) - Assessment stage definitions
- [Assessment-Centric Architecture SOP](../SOP/working_with_assessment_centric_architecture.md) - Stage patterns

## Key Principles

1. **Stage-Based Filtering**: Use `assessment.stage` to control subprocess visibility
2. **Active vs Terminal**: Only `estimate_finalized` is active for subprocess work
3. **Consistent Pattern**: Same stage filtering for both Additionals and FRC
4. **Badge/Table Alignment**: Badge counts must match table counts with same filtering
5. **Archive Visibility**: Archived/cancelled work still accessible in Archive page
6. **Clean Separation**: Active work vs completed work clearly separated

## Prevention

To prevent similar issues in future subprocess implementations:

1. **Document stage semantics** - Which stages should show subprocess records?
2. **Apply consistent filtering** - Use same stage filter for list and badge count
3. **Test stage transitions** - Verify records move between pages correctly
4. **Consider user workflow** - Should completed work be visible in active lists?
5. **Follow established pattern** - Use stage filtering for all subprocess pages

## Key Learnings

1. **Stage filtering is essential** - Subprocess pages need stage-based visibility control
2. **Active vs terminal stages** - Clear distinction between working and completed states
3. **Consistent implementation** - Same pattern for all subprocess pages
4. **User requirements drive design** - "only active reports" means stage filtering
5. **Badge/table alignment** - Both must use identical filtering logic
6. **Archive page importance** - Provides access to completed subprocess work
