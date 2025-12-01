# Bug Post-Mortem: Finalization and FRC Stage Transition Failures

**Date**: January 29, 2025
**Severity**: Critical
**Status**: Fixed
**Bug IDs**: ASM-2025-STAGE-FINALIZE-001, ASM-2025-STAGE-FRC-001, ASM-2025-FRC-VISIBILITY-001

---

## Executive Summary

Three critical bugs were preventing assessments from appearing in the correct list pages after finalization and FRC operations:

1. **Finalization Stage Missing**: Finalized assessments remained in Open Assessments instead of moving to Finalized Assessments
2. **FRC Stage Missing**: Assessments with FRC started didn't appear in the FRC list page
3. **Removed/Declined Lines Invisible**: Lines removed or declined via additionals were completely hidden in FRC instead of being shown with visual indicators

**Impact**: Core assessment workflow broken for finalization and FRC stages
**Duration**: Unknown (discovered January 29, 2025)
**Fix Time**: 85 minutes (research + implementation)
**Users Affected**: All admins using finalization and FRC workflows

---

## Timeline

**2025-10-29 ~20:00** - User reports: "when we finalize assessment - force finalize click the assessment stays open and is not moved to Finalized assessments"

**2025-10-29 20:05** - User reports: "then when additionals are added and FRC is opened it also does not show in that table"

**2025-10-29 20:10** - User reports: "if a line is removed and declined those lines should pull through to FRC"

**2025-10-29 20:15** - Research phase begins using research-context-gatherer and Explore agents

**2025-10-29 20:30** - Root causes identified:
- `finalizeEstimate()` doesn't update stage to `estimate_finalized`
- `startFRC()` doesn't update stage to `frc_in_progress`
- `composeFinalEstimateLines()` excludes removed/declined lines entirely

**2025-10-29 20:35** - Implementation begins

**2025-10-29 21:00** - All fixes applied and type-checked

---

## Root Causes

### Bug 1: Missing Stage Transition in Finalization

**File**: `src/lib/services/assessment.service.ts`
**Method**: `finalizeEstimate()`
**Lines**: 630-702

**Problem**:
```typescript
async finalizeEstimate(id: string, options?) {
    // ... fetch estimate and snapshot rates ...

    // Update assessment
    await supabase
        .from('assessments')
        .update({
            estimate_finalized_at: timestamp,
            status: 'submitted',
            submitted_at: timestamp,
            // ... snapshot rates ...
        })
        .eq('id', id);

    // ❌ MISSING: No stage update here

    // Log audit trail
    await auditService.logChange({...});

    return data;
}
```

**Why It Failed**:
- Finalized Assessments page queries by `stage = 'estimate_finalized'` (line 13 in +page.server.ts)
- `finalizeEstimate()` only updates `estimate_finalized_at` and `status`, not `stage`
- Assessments remain at their current stage (usually `estimate_sent`)
- Query returns empty results because stage never changes to `estimate_finalized`

**Architecture Flaw**:
- Stage transitions are handled by separate `updateStage()` method
- `finalizeEstimate()` didn't call `updateStage()` after updating other fields
- Inconsistent pattern: Some operations update stage inline, others don't

---

### Bug 2: Missing Stage Transition in FRC Start

**File**: `src/lib/services/frc.service.ts`
**Method**: `startFRC()`
**Lines**: 44-198

**Problem**:
```typescript
async startFRC(assessmentId, estimate, additionals, client?) {
    // ... compose line items ...

    // Create FRC record
    const { data, error } = await db
        .from('assessment_frc')
        .insert({
            assessment_id: assessmentId,
            status: 'in_progress',
            // ... all FRC fields ...
        });

    // ❌ MISSING: No assessment stage update here

    // Log audit
    await auditService.logChange({...});

    return data;
}
```

**Why It Failed**:
- FRC list page queries by `assessment.stage = 'frc_in_progress'` (line 577 in frc.service.ts listFRC method)
- `startFRC()` creates FRC record but doesn't update assessment stage
- Assessments remain at `estimate_finalized` stage
- Query returns empty results because stage never changes to `frc_in_progress`

**Architecture Flaw**:
- FRC service operates on FRC table but doesn't update parent assessment
- Stage transition responsibility unclear (should FRC service update assessment stage?)
- Cross-service coordination not enforced

---

### Bug 3: Removed/Declined Lines Excluded from FRC

**File**: `src/lib/utils/frcCalculations.ts`
**Function**: `composeFinalEstimateLines()`
**Lines**: 19-155

**Problem**:
```typescript
/**
 * Compose the final estimate lines from original estimate + approved additionals
 * Excludes:
 * - Removed lines (action='removed' from additionals)
 * - Reversed lines (lines that have been reversed by a reversal action)
 * - Declined additional lines (status='declined')
 */
export function composeFinalEstimateLines(estimate, additionals, frozenRates?) {
    const removedOriginalIds = new Set<string>();

    // Build removed set
    additionals.line_items
        .filter((item) => item.action === 'removed')
        .forEach((item) => removedOriginalIds.add(item.original_estimate_line_id));

    // ❌ EXCLUDES removed lines entirely
    estimate.line_items.forEach((line) => {
        if (line.id && !removedOriginalIds.has(line.id)) {
            finalLines.push({...});
        }
    });

    // ❌ EXCLUDES declined lines entirely
    additionals.line_items
        .filter((item) =>
            item.status === 'approved' &&
            item.action !== 'removed' &&
            item.action !== 'reversal'
        )
        .forEach((line) => {
            finalLines.push({...});
        });
}
```

**Why It Failed**:
- Function explicitly excludes removed and declined lines
- No metadata to mark lines as removed/declined
- FRC UI had no way to show these lines for transparency

**Architecture Flaw**:
- Initial design decision: Only show approved/active lines
- Lacks visibility into what changed between estimate and FRC
- No audit trail in FRC view for removed/declined items

---

## Fixes Applied

### Fix 1: Add Stage Transition to Finalization

**File**: `src/lib/services/assessment.service.ts`
**Location**: After line 676, before audit log

```typescript
if (error) {
    console.error('Error finalizing estimate:', error);
    throw error;
}

// ✅ FIX: Update assessment stage to 'estimate_finalized'
await this.updateStage(id, 'estimate_finalized', supabase);

// Log audit trail
await auditService.logChange({...});
```

**Result**:
- Assessments now update to `estimate_finalized` stage after finalization
- Finalized Assessments page query returns correct results
- Assessments move from Open Assessments to Finalized Assessments immediately

---

### Fix 2: Add Stage Transition to FRC Start

**File**: `src/lib/services/frc.service.ts`
**Location**: After line 180, before audit log

**Import Added**:
```typescript
import { assessmentService } from './assessment.service';
```

**Code Added**:
```typescript
if (error) {
    console.error('Error creating FRC:', error);
    throw new Error(`Failed to create FRC: ${error.message}`);
}

// ✅ FIX: Update assessment stage to 'frc_in_progress'
await assessmentService.updateStage(assessmentId, 'frc_in_progress', db);

// Log audit
await auditService.logChange({...});
```

**Result**:
- Assessments now update to `frc_in_progress` stage when FRC starts
- FRC list page query returns correct results
- Assessments move from Finalized Assessments to FRC list immediately

---

### Fix 3: Include Removed/Declined Lines with Metadata

**A. Update FRC Line Type**

**File**: `src/lib/types/assessment.ts`
**Location**: After line 826

```typescript
export interface FRCLineItem {
    id: string;
    source: FRCLineSource;
    // ... existing fields ...
    decision: FRCDecision;
    adjust_reason?: string | null;

    // ✅ NEW: Metadata for removed/declined lines
    removed_via_additionals?: boolean;
    declined_via_additionals?: boolean;
    decline_reason?: string;

    // ... component breakdown fields ...
}
```

**B. Update composeFinalEstimateLines Function**

**File**: `src/lib/utils/frcCalculations.ts`
**Changes**:

1. **Update Documentation** (lines 10-21):
```typescript
/**
 * Compose the final estimate lines from original estimate + approved additionals
 * Includes ALL lines with metadata markers for:
 * - Removed lines (marked with removed_via_additionals=true)
 * - Declined lines (marked with declined_via_additionals=true + reason)
 *
 * Excludes only:
 * - Reversed lines (lines that have been reversed by a reversal action)
 * - Reversal lines themselves (action='reversal')
 */
```

2. **Include Removed Estimate Lines** (lines 60-81):
```typescript
// ✅ CHANGED: Include ALL estimate lines (removed ones marked)
estimate.line_items.forEach((line) => {
    if (line.id) {
        const isRemoved = removedOriginalIds.has(line.id);
        finalLines.push({
            // ... all fields ...
            removed_via_additionals: isRemoved || undefined,  // ✅ NEW
            // ... breakdown fields ...
        });
    }
});
```

3. **Include Declined Additional Lines** (lines 159-208):
```typescript
// ✅ NEW: Add declined additional lines with markers
additionals.line_items
    .filter((item) =>
        item.status === 'declined' &&
        item.action !== 'removed' &&
        item.action !== 'reversal' &&
        item.id &&
        !reversedTargets.has(item.id)
    )
    .forEach((line) => {
        finalLines.push({
            // ... all fields ...
            declined_via_additionals: true,  // ✅ NEW
            decline_reason: line.decline_reason || 'No reason provided',  // ✅ NEW
            // ... breakdown fields ...
        });
    });
```

4. **Exclude from Calculations** (lines 235-239):
```typescript
lineItems.forEach((line) => {
    // ✅ NEW: Skip removed/declined lines from totals
    if (line.removed_via_additionals || line.declined_via_additionals) {
        return;
    }
    // ... sum components ...
});
```

**C. Update FRC UI**

**File**: `src/lib/components/assessment/FRCLinesTable.svelte`
**Changes**:

1. **Add Row Styling** (lines 102-103):
```svelte
{@const isRemovedOrDeclined = line.removed_via_additionals || line.declined_via_additionals}
<Table.Row class="hover:bg-gray-50 {isRemovedOrDeclined ? 'opacity-60 bg-gray-50/50' : ''}">
```

2. **Add Strikethrough to Description** (lines 119-121):
```svelte
<p class="text-sm font-medium text-gray-900 {line.removed_via_additionals || line.declined_via_additionals ? 'line-through' : ''}">
    {line.description}
</p>
```

3. **Add Status Badges** (lines 122-130):
```svelte
<p class="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
    <span>Source: {line.source === 'estimate' ? 'Original Estimate' : 'Additional'}</span>
    {#if line.removed_via_additionals}
        <Badge variant="destructive" class="text-[10px] py-0 px-1.5">REMOVED</Badge>
    {/if}
    {#if line.declined_via_additionals}
        <Badge variant="destructive" class="text-[10px] py-0 px-1.5" title={line.decline_reason}>DECLINED</Badge>
    {/if}
</p>
```

**Result**:
- Removed lines appear with strikethrough + "REMOVED" badge + grayed out
- Declined lines appear with strikethrough + "DECLINED" badge (with reason tooltip) + grayed out
- Lines are visible for audit/transparency but excluded from totals
- Admin can see complete picture of what changed

---

## Testing Performed

1. **Type Checking**: `npm run check` - No new TypeScript errors introduced
2. **Visual Code Review**: All changes reviewed for correctness
3. **Integration Test Plan** (to be performed by user):
   - Complete assessment and finalize estimate
   - Verify appears in Finalized Assessments list
   - Add additionals (approved + declined), remove estimate line
   - Start FRC from Finalized Assessments
   - Verify assessment appears in FRC list
   - Verify FRC shows removed/declined lines with visual indicators
   - Verify totals exclude removed/declined lines
   - Complete FRC and verify moves to Archive

---

## Prevention Measures

### Immediate Actions

1. **✅ DONE**: Document pattern in this postmortem
2. **✅ DONE**: Update SOP for assessment-centric architecture
3. **PENDING**: Create centralized stage transition constants
4. **PENDING**: Add integration tests for full workflow
5. **PENDING**: Add stage transition logging/warnings

### Code Patterns to Follow

**Pattern 1: Always Update Stage After Major State Changes**

```typescript
// ❌ BAD: Update state without stage transition
async finalizeEstimate(id: string) {
    await supabase.from('assessments').update({
        estimate_finalized_at: new Date().toISOString(),
        status: 'submitted'
    }).eq('id', id);
}

// ✅ GOOD: Update stage after state change
async finalizeEstimate(id: string) {
    await supabase.from('assessments').update({
        estimate_finalized_at: new Date().toISOString(),
        status: 'submitted'
    }).eq('id', id);

    // Stage transition MUST follow state change
    await this.updateStage(id, 'estimate_finalized', supabase);
}
```

**Pattern 2: Cross-Service Stage Updates**

```typescript
// ❌ BAD: Service updates own table but doesn't update assessment
async startFRC(assessmentId: string) {
    await db.from('assessment_frc').insert({
        assessment_id: assessmentId,
        status: 'in_progress'
    });
}

// ✅ GOOD: Service coordinates with assessment service
async startFRC(assessmentId: string) {
    await db.from('assessment_frc').insert({
        assessment_id: assessmentId,
        status: 'in_progress'
    });

    // Update parent assessment stage
    await assessmentService.updateStage(assessmentId, 'frc_in_progress', db);
}
```

**Pattern 3: Include Metadata for Visibility**

```typescript
// ❌ BAD: Exclude lines entirely
const lines = allLines.filter(line => !line.removed);

// ✅ GOOD: Include with metadata marker
const lines = allLines.map(line => ({
    ...line,
    removed_via_additionals: line.removed,
    declined_via_additionals: line.declined,
    decline_reason: line.decline_reason
}));

// Then exclude from calculations but show in UI
const total = lines
    .filter(line => !line.removed_via_additionals && !line.declined_via_additionals)
    .reduce((sum, line) => sum + line.total, 0);
```

### Future Improvements

1. **Centralized Stage Constants** (High Priority):
```typescript
// Create src/lib/constants/assessment-stages.ts
export const ASSESSMENT_STAGES = {
    REQUEST_SUBMITTED: 'request_submitted',
    // ... all stages ...
} as const;

export const STAGE_TRANSITIONS = {
    FINALIZE_ESTIMATE: {
        from: ['estimate_sent', 'estimate_review'],
        to: 'estimate_finalized'
    },
    START_FRC: {
        from: ['estimate_finalized'],
        to: 'frc_in_progress'
    }
} as const;
```

2. **Integration Tests** (High Priority):
```typescript
// Test full workflow
test('assessment moves through stages correctly', async () => {
    // 1. Create assessment
    // 2. Finalize estimate -> verify in Finalized Assessments
    // 3. Add additionals
    // 4. Start FRC -> verify in FRC list
    // 5. Complete FRC -> verify in Archive
});
```

3. **Stage Transition Logging** (Medium Priority):
```typescript
async updateStage(id: string, newStage: AssessmentStage, client?) {
    const { data: assessment } = await client
        .from('assessments')
        .select('stage')
        .eq('id', id)
        .single();

    if (assessment.stage === newStage) {
        console.warn(`Stage transition skipped: already at ${newStage}`);
        return;
    }

    console.log(`Stage transition: ${assessment.stage} -> ${newStage}`);
    // ... update ...
}
```

---

## Lessons Learned

1. **Stage transitions must be explicit**: Don't assume stage updates happen automatically
2. **Cross-service coordination required**: When one service affects another's state, coordinate explicitly
3. **Visibility over hiding**: Show removed/declined items with markers rather than hiding them
4. **Query filters must match update logic**: If page queries by stage, ensure operations update that stage
5. **Test complete workflows**: Unit tests aren't enough, need full integration tests

---

## Related Documentation

- `.agent/SOP/working_with_assessment_centric_architecture.md` - Assessment stage pipeline
- `.agent/SOP/navigation_based_state_transitions.md` - Server-side stage transition pattern
- `.agent/System/project_architecture.md` - Complete system overview
- `.agent/System/bug_postmortem_appointment_stage_transition.md` - Similar stage transition bug
- `.agent/SOP/frc_removed_lines.md` - Follow-up: Removal lines calculation fix (Jan 30, 2025)

---

## Status: RESOLVED ✅

All three bugs have been fixed and type-checked. Implementation is complete and ready for user testing.

**Next Steps**:
1. User performs end-to-end testing
2. If successful, create follow-up issues for prevention measures
3. Update team on new patterns to follow

---

## Addendum: Removal Lines Evolution (January 30, 2025)

### Follow-up Discovery

The January 29 fix implemented visual indicators for removed/declined lines but **excluded them from calculations** (lines 235-239):

```typescript
lineItems.forEach((line) => {
    // Skip removed/declined lines from totals
    if (line.removed_via_additionals || line.declined_via_additionals) {
        return;
    }
    // ... sum components ...
});
```

**This was incorrect behavior**. Testing revealed that:

1. **Original line** (+R12,000) appeared with "REMOVED" badge
2. **Removal additional line** was filtered out entirely (never appeared in FRC)
3. **Result**: Net total of +R12,000 instead of R0

### Root Cause of Exclusion Logic

The January 29 fix had two filters that excluded removal lines:

**Line 116** (approved additionals):
```typescript
.filter((item) =>
    item.status === 'approved' &&
    item.action !== 'removed' &&  // ❌ This excluded negative removal lines
    item.action !== 'reversal'
)
```

**Line 164** (declined additionals):
```typescript
.filter((item) =>
    item.status === 'declined' &&
    item.action !== 'removed' &&  // ❌ This excluded negative removal lines
    item.action !== 'reversal'
)
```

These filters prevented **removal additional lines** (with negative amounts) from appearing in the FRC, while the **original estimate line** remained visible (marked with `removed_via_additionals: true`).

### Correct Behavior (January 30 Fix)

**Dual-Line Pattern**: Both lines must appear for correct audit trail and calculations:

1. **Original Estimate Line**:
   - Source: `estimate`
   - Total: +R12,000
   - Flag: `removed_via_additionals: true`
   - Badge: "REMOVED" (gray)
   - **Included in calculations**: Yes (positive amount adds to estimate breakdown)

2. **Removal Additional Line**:
   - Source: `additional`
   - Total: -R12,000 (negative)
   - Action: `removed`
   - Badge: "REMOVAL (-)" (red)
   - **Included in calculations**: Yes (negative amount subtracts from additionals breakdown)

3. **Net Effect**: +R12,000 + (-R12,000) = R0 ✓

### Changes Made (January 30, 2025)

**File**: `src/lib/utils/frcCalculations.ts`

1. **Line 116-120**: Removed `item.action !== 'removed'` filter
```typescript
// ✅ INCLUDES removal lines with negative amounts
.filter(
  (item) =>
    item.status === 'approved' &&
    // Removed: item.action !== 'removed' filter
)
```

2. **Line 164-168**: Removed `item.action !== 'removed'` filter
```typescript
// ✅ INCLUDES declined removal lines
.filter(
  (item) =>
    item.status === 'declined' &&
    // Removed: item.action !== 'removed' filter
)
```

3. **Lines 214-226**: Updated documentation explaining negative value handling
```typescript
/**
 * Calculate breakdown totals from line items (NETT-BASED)
 *
 * IMPORTANT: INCLUDES ALL LINES (removed/declined) with proper negative handling
 * - Removed lines: Two lines appear in FRC for audit trail:
 *   1. Original estimate line: +R12,000 (marked as removed_via_additionals)
 *   2. Removal additional line: -R12,000 (negative amounts from additionals)
 *   Result: Net R0 (both lines sum correctly)
 */
```

**File**: `src/lib/components/assessment/FRCLinesTable.svelte`

4. **Lines 132-136**: Added "REMOVAL (-)" badge for negative additional lines
```svelte
{#if line.source === 'additional' && (line.quoted_total ?? 0) < 0}
  <Badge variant="outline" class="text-[10px] py-0 px-1.5 border-red-400 text-red-600">
    REMOVAL (-)
  </Badge>
{/if}
```

### Why Negative Amounts Must Be Included

The removal line represents an **additional operation** that subtracts from the estimate. The calculation pattern is:

```
ESTIMATE BREAKDOWN:
  Original line: +R12,000

ADDITIONALS BREAKDOWN:
  Removal line: -R12,000

COMBINED TOTAL: R0
```

If we exclude the removal line:
- Estimate breakdown: +R12,000
- Additionals breakdown: R0 (excluded)
- Combined total: +R12,000 ❌ WRONG

If we include the removal line:
- Estimate breakdown: +R12,000
- Additionals breakdown: -R12,000
- Combined total: R0 ✓ CORRECT

### New Documentation

**Created**: `.agent/SOP/frc_removed_lines.md` (~350 lines)
- Complete guide to dual-line pattern
- Testing procedures
- Database schema for removal lines
- Troubleshooting common issues

**Updated**: `.agent/README/sops.md` - Added FRC removed lines SOP to index

**Updated**: `.agent/README/changelog.md` - Documented January 30 fix

### Lesson Learned

**Don't confuse visual indicators with calculation exclusion**:
- Visual indicators (strikethrough, badges) show line status
- Calculation logic must process ALL lines including negative amounts
- Removal lines are not "removed from FRC" - they are "additional operations that remove value"

The January 29 fix correctly showed visual indicators but incorrectly excluded removal lines from appearing in FRC entirely. The January 30 fix ensures both lines appear with proper negative amount calculations.
