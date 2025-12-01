# SOP: Handling Removed Lines in FRC

## Overview

When a line is removed from the original estimate via the Additionals tab, both the original line and the removal action appear in the FRC for complete audit trail. The removal line has negative amounts that correctly subtract from totals.

## Business Logic

### Dual-Line Pattern

When removing an estimate line:

1. **Original Estimate Line** remains in FRC:
   - Shows in "Estimate" breakdown
   - Marked with `removed_via_additionals: true`
   - Displays "REMOVED" badge (gray outline)
   - Keeps original positive values (e.g., +R12,000)

2. **Removal Additional Line** appears in FRC:
   - Shows in "Additionals" breakdown
   - Has `action: 'removed'` and `source: 'additional'`
   - Displays "REMOVAL (-)" badge (red outline)
   - Has negative amounts (e.g., -R12,000)

3. **Net Effect**: Original (+R12k) + Removal (-R12k) = R0

### Why Two Lines?

- **Audit Trail**: Shows what was originally quoted vs. what was removed
- **Transparency**: Client sees both the estimate and the reduction
- **Calculations**: Negative amounts properly subtract from totals

## Technical Implementation

### File: `src/lib/utils/frcCalculations.ts`

**Key Function**: `composeFinalEstimateLines()`

#### Approved Additionals (Line 116-120)
```typescript
// INCLUDES removal lines with negative amounts to correctly subtract from totals
.filter(
  (item) =>
    item.status === 'approved' &&
    // Removed: item.action !== 'removed' filter
)
```

**Before Fix**: Filter excluded removal lines → Original +R12k counted but removal -R12k excluded = Wrong total (+R12k)

**After Fix**: Removal lines included → Original +R12k + Removal -R12k = Correct total (R0)

#### Declined Additionals (Line 164-168)
```typescript
// INCLUDES declined removal lines with negative amounts
.filter(
  (item) =>
    item.status === 'declined' &&
    // Removed: item.action !== 'removed' filter
)
```

Same logic applies to declined additionals.

### File: `src/lib/components/assessment/FRCLinesTable.svelte`

**Visual Indicators** (Line 132-136):

```svelte
<!-- Badge for removal lines from additionals -->
{#if line.source === 'additional' && (line.quoted_total ?? 0) < 0}
  <Badge variant="outline" class="text-[10px] py-0 px-1.5 border-red-400 text-red-600">
    REMOVAL (-)
  </Badge>
{/if}
```

## Testing Procedure

### Setup Test Case

1. **Navigate** to assessment with estimate
2. **Go to Additionals tab**
3. **Remove a line** from original estimate (e.g., "Bonnet" for R12,000)
4. **Approve** the removal

### Verify FRC Behavior

1. **Navigate to FRC tab** (triggers auto-merge with latest additionals)

2. **Verify Dual Lines Appear**:
   - ✓ Original "Bonnet" line (+R12,000) with "REMOVED" badge
   - ✓ Removal "Bonnet" line (-R12,000) with "REMOVAL (-)" badge

3. **Verify Breakdown Totals**:
   ```
   ESTIMATE BREAKDOWN:
   Parts (Nett): R6,500.00
   Labour: R250.00
   Paint: R5,000.00
   Strip & Assemble: R250.00
   Markup: R125.00
   Subtotal: R12,000.00  ← Original line counted

   ADDITIONALS BREAKDOWN:
   Parts (Nett): -R6,500.00
   Labour: -R250.00
   Paint: -R5,000.00
   Strip & Assemble: -R250.00
   Markup: -R125.00
   Subtotal: -R12,000.00  ← Removal line subtracts

   COMBINED TOTAL: R0.00  ← Correct net zero
   ```

4. **Verify Visual Presentation**:
   - Original line has gray "REMOVED" badge
   - Removal line has red "REMOVAL (-)" badge
   - Both lines clearly visible in table

### Edge Cases

**Case 1: Removal then Re-add**
- Remove line A → Creates removal line with -R12k
- Add new line B for same part → Creates new line with +R5.5k
- Result: Net change is -R6.5k (correctly calculated)

**Case 2: Multiple Removals**
- Each removal creates separate negative line
- All negative amounts subtract correctly

**Case 3: Partial Removal** (Not Supported)
- System doesn't support partial removal
- Must remove entire line, then add new line with adjusted amount

## Database Schema

### `assessment_additionals.line_items` (JSONB Array)

Removal line structure:
```typescript
{
  id: string;                    // UUID for additional line
  action: 'removed';             // Identifies as removal
  status: 'approved' | 'declined';
  original_line_id: string;      // Links to estimate line being removed
  description: string;           // Matches original line
  process_type: string;          // Matches original (N, R, P, etc.)
  part_type?: string;            // Matches original if applicable

  // All amounts are NEGATIVE
  part_price_nett: number;       // e.g., -6500
  part_price: number;            // e.g., -8125
  strip_assemble_hours: number;  // e.g., 0.5
  strip_assemble: number;        // e.g., -250
  labour_hours: number;          // e.g., 0.5
  labour_cost: number;           // e.g., -250
  paint_panels: number;          // e.g., 2
  paint_cost: number;            // e.g., -5000
  total: number;                 // e.g., -12000

  approved_at?: string;          // ISO timestamp
}
```

### `assessment_frc.line_items` (JSONB Array)

After merge, FRC contains:

1. **Original Estimate Line** (from estimate):
```typescript
{
  id: string;                    // FRC line UUID (stable)
  source: 'estimate';
  source_line_id: string;        // Original estimate line ID
  removed_via_additionals: true; // Flag for UI badge
  decision: 'pending';
  quoted_total: 12000;           // Positive amount
  // ... other fields ...
}
```

2. **Removal Additional Line** (from additionals):
```typescript
{
  id: string;                    // FRC line UUID (stable)
  source: 'additional';
  source_line_id: string;        // Additional line ID
  decision: 'pending';
  quoted_total: -12000;          // NEGATIVE amount
  // ... other fields with negative values ...
}
```

## Common Issues

### Issue 1: Removal Line Not Appearing

**Symptom**: Only see original line with "REMOVED" badge, no negative removal line

**Cause**: FRC snapshot created before fix, needs re-merge

**Solution**:
```sql
-- Force re-merge on next load
UPDATE assessment_frc
SET last_merge_at = '2025-01-01 00:00:00'
WHERE assessment_id = '<assessment_id>';
```

Then reload FRC tab in UI.

### Issue 2: Totals Don't Net to Zero

**Symptom**: After removing R12k line, total is still +R12k or -R12k

**Cause**: Either:
- Old code filtering out removal lines (check `frcCalculations.ts` lines 116, 164)
- FRC not auto-merged (check `last_merge_at` vs `additionals.updated_at`)

**Solution**:
1. Verify no `item.action !== 'removed'` filters in `composeFinalEstimateLines()`
2. Force re-merge as above

### Issue 3: Badge Not Showing

**Symptom**: Removal line appears but has no "REMOVAL (-)" badge

**Cause**: Badge condition not met in `FRCLinesTable.svelte`

**Solution**: Verify line 132-136:
```svelte
{#if line.source === 'additional' && (line.quoted_total ?? 0) < 0}
```

## Related Files

- `src/lib/utils/frcCalculations.ts` - Core calculation logic (lines 116, 164, 214-226)
- `src/lib/components/assessment/FRCLinesTable.svelte` - Visual badges (lines 132-136)
- `src/lib/services/frc.service.ts` - Auto-merge logic (lines 52-109)
- `src/lib/types/assessment.ts` - Type definitions

## Migration History

- **Migration 037** (2025-10-30): Removed `excluded_line_item_ids` field, introduced `action: 'removed'` pattern
- **Code Fix** (2025-10-30): Removed filters blocking negative removal lines in calculations

## Documentation References

- `.agent/System/assessment_architecture.md` - Assessment-centric architecture
- `.agent/System/database_schema.md` - Database structure
- `.agent/SOP/additionals_workflow.md` - Additionals management
- `.agent/SOP/frc_workflow.md` - FRC workflow
