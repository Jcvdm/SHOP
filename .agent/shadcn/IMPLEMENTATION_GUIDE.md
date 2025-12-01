# Svelte 5 Error Fixes - Implementation Guide

**Current Status**: 94 errors, 37 warnings (79% reduction from 449 baseline)  
**Last Updated**: November 22, 2025

---

## Quick Start

1. **Read the error patterns first**: `.agent/shadcn/svelte5-error-patterns.md`
2. **Pick a phase** from the list below
3. **Apply the patterns** from the error patterns doc
4. **Test after each phase**: `npm run check`
5. **Track progress** in this document

---

## Implementation Phases

### Phase 1: Calendar Components (9 errors) ⚠️ HIGH PRIORITY

**Files**:
- `src/lib/components/ui/calendar/calendar.svelte`
- `src/lib/components/ui/calendar/calendar-month-select.svelte`
- `src/lib/components/ui/calendar/calendar-year-select.svelte`
- `src/lib/components/ui/calendar/calendar-caption.svelte`

**Error Types**:
- Snippet parameters implicitly have 'any' type
- Event handler parameters need explicit typing
- `<svelte:component>` deprecation warnings

**Patterns to Apply**:
- Pattern #1: Snippet Type Errors
- Pattern #3: `<svelte:component>` Deprecation
- Pattern #8: Event Handler Types

**Estimated Time**: 30 minutes

---

### Phase 2: Date Picker & Dropdown (3 errors) ⚠️ HIGH PRIORITY

**Files**:
- `src/lib/components/ui/date-picker/date-picker.svelte`
- `src/lib/components/ui/dropdown-menu/dropdown-menu-checkbox-group.svelte`

**Error Types**:
- Bits UI v3 API changes (`disableAutoClose` removed)
- CheckboxGroup component removed

**Patterns to Apply**:
- Pattern #2: Bits UI v3 Migration

**Estimated Time**: 15 minutes

---

### Phase 3: Assessment Components (6 errors) 🔵 MEDIUM PRIORITY

**Files**:
- `src/lib/components/assessment/ReversalReasonModal.svelte`
- `src/lib/components/assessment/OriginalEstimateLinesPanel.svelte`
- `src/lib/components/assessment/AdditionalsTab.svelte`

**Error Types**:
- Type definition mismatches (string vs number)
- Missing type exports
- Null safety issues

**Patterns to Apply**:
- Pattern #5: Type Mismatches
- Pattern #9: Service Input Nullability

**Estimated Time**: 30 minutes

---

### Phase 4: Form Components (5 errors) 🔵 MEDIUM PRIORITY

**Files**:
- `src/lib/components/forms/ClientForm.svelte`
- `src/lib/components/forms/IncidentInfoSection.svelte`
- `src/lib/components/forms/PhotoUploadV2.svelte`

**Error Types**:
- Shadcn component prop mismatches
- Service signature changes
- DateValue type conversions

**Patterns to Apply**:
- Pattern #5: Type Mismatches
- Pattern #6: Form Label Accessibility
- Pattern #9: Service Input Nullability

**Estimated Time**: 30 minutes

---

### Phase 5: Route Components - DataTable (25 errors) 🟢 LOW PRIORITY

**Files**:
- `src/routes/(app)/clients/+page.svelte`
- `src/routes/(app)/engineers/+page.svelte`
- `src/routes/(app)/work/additionals/+page.svelte`
- ... and 10+ more route pages

**Error Types**:
- DataTable generic constraints
- Column key typing issues
- Render function nullability

**Patterns to Apply**:
- Pattern #7: DataTable Generic Constraints

**Estimated Time**: 1 hour

---

### Phase 6: Route Components - Templates (20 errors) 🟢 LOW PRIORITY

**Files**:
- `src/routes/(app)/print/estimate/[id]/+page.svelte`
- `src/routes/(app)/print/frc/[id]/+page.svelte`
- Template functions in `src/lib/templates/`

**Error Types**:
- Template data type mismatches
- Enum vs string type issues

**Patterns to Apply**:
- Pattern #10: Template Data Type Mismatches

**Estimated Time**: 45 minutes

---

### Phase 7: Route Components - Misc (26 errors) 🟢 LOW PRIORITY

**Files**:
- Various route pages with mixed issues
- Service calls with nullability issues
- Form components with accessibility warnings

**Error Types**:
- Mixed type issues
- Accessibility warnings
- Service input nullability

**Patterns to Apply**:
- Pattern #5: Type Mismatches
- Pattern #6: Form Label Accessibility
- Pattern #9: Service Input Nullability

**Estimated Time**: 1 hour

---

## Testing Commands

```bash
# Check current error count
npm run check 2>&1 | Select-String "found.*errors"

# View errors for specific file
npm run check 2>&1 | Select-String "calendar.svelte"

# Save full output for comparison
npm run check 2>&1 > ".agent/logs/check-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

# Count errors by type
npm run check 2>&1 | Select-String "Error:" | Group-Object | Measure-Object
```

---

## Progress Tracking

| Phase | Status | Errors Fixed | Notes |
|-------|--------|--------------|-------|
| Phase 1: Calendar | ⏳ Not Started | 0/9 | High priority |
| Phase 2: Date Picker | ⏳ Not Started | 0/3 | High priority |
| Phase 3: Assessment | ⏳ Not Started | 0/6 | Medium priority |
| Phase 4: Forms | ⏳ Not Started | 0/5 | Medium priority |
| Phase 5: DataTable | ⏳ Not Started | 0/25 | Low priority |
| Phase 6: Templates | ⏳ Not Started | 0/20 | Low priority |
| Phase 7: Misc | ⏳ Not Started | 0/26 | Low priority |
| **Total** | **0% Complete** | **0/94** | **Target: 0 errors** |

---

## Related Documentation

- **Error Patterns**: `.agent/shadcn/svelte5-error-patterns.md` - Detailed solutions
- **PDR**: `.agent/shadcn/pdr.md` - Project development report
- **Upgrade Checklist**: `.agent/shadcn/svelte5-upgrade-checklist.md` - Migration tracker

