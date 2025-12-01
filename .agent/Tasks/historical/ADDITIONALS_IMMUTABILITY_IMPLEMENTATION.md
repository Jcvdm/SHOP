# Additionals Immutability Implementation

## Overview

This document describes the implementation of strict immutability for additionals line items using an event-sourced approach with reversal entries. This ensures a complete audit trail and prevents data loss while allowing controlled adjustments.

## Problem Statement

Previously, additionals line items could be edited or deleted after creation, which:
- Made audit trails incomplete
- Could lead to data loss
- Made it difficult to track the history of changes
- Didn't support scenarios like "insurance later approves a declined part"

## Solution: Event-Sourced Reversals

Instead of editing or deleting finalized line items, we now create **reversal entries** that represent the opposite action. This provides:
- ✅ Complete immutability (no edits or deletes after creation)
- ✅ Full audit trail of all changes
- ✅ Ability to "undo" any action via reversals
- ✅ Simple calculation logic (sum all approved items)

## Pending Items Editing

Pending additional items are editable inline for productivity. Once approved, declined, removed, or reversed, entries become immutable and any future changes must be made via reversal entries.

**Editable Fields (pending only):** Description, Part Nett (N), S&A hours (N/R/P/B), Labour hours (N/R/A), Paint panels (N/R/P/B), Outwork Nett (O). Edits save on blur/Enter and recalculate derived costs and totals using the Additionals’ locked rates/markups.

**Service Method:** `updatePendingLineItem(assessmentId, lineItemId, patch)` computes:
- `strip_assemble = strip_assemble_hours × labour_rate`
- `labour_cost = labour_hours × labour_rate`
- `paint_cost = paint_panels × paint_rate`
- `part_price = calculatePartSellingPrice(part_price_nett, markup by part_type)`
- `outwork_charge = calculateOutworkSellingPrice(outwork_charge_nett, outwork_markup_percentage)`
- `betterment_total = calculateBetterment(updatedItem)`
- `total = calculateLineItemTotal(updatedItem, labour_rate, paint_rate)`

Approved totals are unaffected until approval. All pending edits are audit logged (`additionals_line_item_updated_pending`).

## Data Model Changes

### Type Definitions (`src/lib/types/assessment.ts`)

```typescript
// New action type added
export type AdditionalLineItemAction = 'added' | 'removed' | 'reversal';

export interface AdditionalLineItem extends EstimateLineItem {
  status: AdditionalLineItemStatus;
  action?: AdditionalLineItemAction;
  
  // Existing fields
  original_line_id?: string | null; // For 'removed' actions
  decline_reason?: string | null;
  
  // New fields for reversals
  reverses_line_id?: string | null; // Points to the line being reversed
  reversal_reason?: string | null; // Required reason for reversal
  
  // Timestamps
  approved_at?: string | null;
  declined_at?: string | null;
  approved_by?: string | null;
}
```

## Reversal Scenarios

### 1. Reverse an Approved Additional

**Use Case**: An approved additional needs to be excluded from the estimate.

**Process**:
1. User clicks "Reverse" button on approved item
2. System prompts for reversal reason
3. System creates new entry with:
   - `action: 'reversal'`
   - `reverses_line_id: <original_id>`
   - `status: 'approved'` (auto-approved)
   - All monetary values negated (to cancel out original)

**Example**:
```typescript
// Original
{ id: 'A', action: 'added', status: 'approved', total: 100 }

// Reversal
{ id: 'B', action: 'reversal', reverses_line_id: 'A', status: 'approved', total: -100 }

// Net effect: 100 + (-100) = 0
```

### 2. Reinstate a Declined Additional

**Use Case**: Insurance later approves a previously declined part.

**Process**:
1. User clicks "Reinstate" button on declined item
2. System prompts for reversal reason
3. System creates new entry with:
   - `action: 'reversal'`
   - `reverses_line_id: <original_id>`
   - `status: 'approved'`
   - Same positive values as original (to add back to total)

**Example**:
```typescript
// Original (declined, not counted in totals)
{ id: 'A', action: 'added', status: 'declined', total: 100 }

// Reversal (approved, counted in totals)
{ id: 'B', action: 'reversal', reverses_line_id: 'A', status: 'approved', total: 100 }

// Net effect: 0 (declined) + 100 (approved) = 100
```

### 3. Reinstate a Removed Original Line

**Use Case**: An original estimate line was removed but needs to be added back.

**Process**:
1. User clicks "Reinstate Original" button on removed line
2. System prompts for reversal reason
3. System creates new entry with:
   - `action: 'reversal'`
   - `reverses_line_id: <removal_entry_id>`
   - `status: 'approved'`
   - Positive values (to cancel the negative removal)

**Example**:
```typescript
// Removal entry (negative values)
{ id: 'A', action: 'removed', original_line_id: 'X', status: 'approved', total: -100 }

// Reversal (positive values to cancel removal)
{ id: 'B', action: 'reversal', reverses_line_id: 'A', status: 'approved', total: 100 }

// Net effect: -100 + 100 = 0 (original line is back)
```

## Service Methods

### New Methods in `additionals.service.ts`

#### `reverseApprovedLineItem(assessmentId, lineItemId, reason)`
- Reverses an approved additional
- Creates reversal entry with negative values
- Auto-approves the reversal
- Logs to audit trail

#### `reinstateDeclinedLineItem(assessmentId, lineItemId, reason)`
- Reinstates a declined additional
- Creates reversal entry with positive values
- Auto-approves the reversal
- Logs to audit trail

#### `reinstateRemovedOriginal(assessmentId, originalLineId, reason)`
- Reinstates a removed original estimate line
- Finds the removal entry and creates reversal
- Creates reversal entry with positive values
- Auto-approves the reversal
- Logs to audit trail

### Updated Method: `deleteLineItem()`
- Now restricted to **pending items only**
- Throws error if attempting to delete approved/declined items
- Error message directs users to use reversal methods instead

## UI Changes

### AdditionalsTab.svelte

#### New Components
- `ReversalReasonModal.svelte` - Modal for capturing reversal reasons

#### Visual Indicators
- **Blue background** for reversal entries
- **Blue text** for reversal line items
- **Reversal icon** (RotateCcw) for reversal entries
- **Reversal reason** displayed below description

#### Action Buttons by Status

| Status | Action | Button | Description |
|--------|--------|--------|-------------|
| Pending | Approve | ✓ (Check) | Approve the item |
| Pending | Decline | ✗ (X) | Decline with reason |
| Pending | Delete | 🗑️ (Trash) | Delete (only for errors) |
| Approved | Reverse | ↶ (Undo) | Reverse the approval |
| Declined | Reinstate | ↻ (RotateCcw) | Reinstate to approved |
| Removed | Reinstate | ↻ (RotateCcw) | Reinstate original line |
| Reversal | - | - | Immutable, no actions |

## Calculation Logic

The calculation logic remains simple and unchanged:

```typescript
const approvedItems = lineItems.filter(item => item.status === 'approved');
const subtotal = approvedItems.reduce((sum, item) => sum + item.total, 0);
```

This works because:
- Approved additions have positive totals
- Approved removals have negative totals
- Approved reversals have appropriate sign to cancel originals
- Declined items are not counted
- Pending items are not counted

## Audit Trail

All reversal actions are logged with:
- Entity type: 'estimate'
- Action: 'updated'
- Field name: 'additionals_line_reversed' | 'additionals_line_reinstated' | 'original_line_reinstated'
- Metadata includes:
  - Original line ID
  - Description
  - Reason for reversal
  - Total amount affected

## Benefits

1. **Complete Audit Trail**: Every change is recorded as a new entry
2. **No Data Loss**: Original entries are never modified or deleted
3. **Flexible Adjustments**: Any action can be reversed with proper reason
4. **Simple Calculations**: Just sum all approved items
5. **Clear History**: Visual indicators show reversal relationships
6. **Compliance**: Full traceability for insurance/regulatory requirements

## Edge Cases Handled

### Multiple Reversals
- System prevents reversing an already-reversed item
- Error message: "This item has already been reversed"

### Pending Item Deletion
- Still allowed for items created in error
- Only works for pending status
- Error for approved/declined items directs to reversal methods

### Reversal of Reversals
- Technically possible (creates another reversal)
- Effectively reinstates the original action
- Full chain is preserved in audit trail

## Testing Checklist

- [ ] Reverse an approved additional
- [ ] Reinstate a declined additional
- [ ] Reinstate a removed original line
- [ ] Verify totals calculate correctly after reversals
- [ ] Verify visual indicators (blue background, icons)
- [ ] Verify reversal reasons are displayed
- [ ] Verify audit log entries are created
- [ ] Test error handling (already reversed, wrong status)
- [ ] Test pending item deletion still works
- [ ] Verify approved/declined items cannot be deleted

## Future Enhancements

1. **Reversal History View**: Show full chain of reversals for a line item
2. **Bulk Reversals**: Reverse multiple items at once
3. **Reversal Approval Workflow**: Require approval for reversals above certain amounts
4. **Reversal Reports**: Generate reports showing all reversals in a period
5. **User Tracking**: Track which user performed each reversal (requires auth)

## Migration Notes

- No database migration required (JSONB field supports new structure)
- Existing line items continue to work (action field is optional)
- New reversal entries are clearly marked with `action: 'reversal'`
- Backward compatible with existing additionals

## Related Files

- `src/lib/types/assessment.ts` - Type definitions
- `src/lib/services/additionals.service.ts` - Service methods
- `src/lib/components/assessment/AdditionalsTab.svelte` - UI component
- `src/lib/components/assessment/ReversalReasonModal.svelte` - Modal component
- `src/lib/services/audit.service.ts` - Audit logging

---

**Implementation Date**: 2025-10-16  
**Status**: ✅ Complete - Ready for Testing

