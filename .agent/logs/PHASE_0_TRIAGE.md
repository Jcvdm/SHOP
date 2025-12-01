# Phase 0: Error Triage & Baseline

**Date**: 2025-11-22  
**Baseline Error Count**: ~50 errors  
**Status**: IN_PROGRESS

## Error Categories

### Category 1: Enum/String Literal Mismatches (13 errors)
Supabase returns `string`, but types expect specific enums/literals.

**Files & Lines**:
- `assessment.service.ts:773` - `status: string` → `AssessmentStatus`
- `inspection.service.ts:108, 143, 188, 196, 219, 240, 347` (7 errors) - `type: string` → `"insurance" | "private"`
- `appointment.service.ts:247, 492` (2 errors) - `appointment_type: string` → `AppointmentType`

**Fix Strategy**: Cast Supabase string returns to proper enums using `as` or type guards.

---

### Category 2: Nullability Mismatches (3 errors)
Type expects non-null, but Supabase returns nullable.

**Files & Lines**:
- `estimate.service.ts:101, 207, 308, 503, 551` (5 errors) - `labour_rate: number | null` → `number`
- `appointment.service.ts:447, 456` (2 errors) - `appointment_time: string | null` → `string | undefined`

**Fix Strategy**: Update type definitions to allow null, or provide defaults.

---

### Category 3: Json Casting Issues (11 errors)
Supabase `Json` type doesn't match typed arrays.

**Files & Lines**:
- `additionals.service.ts:39, 79, 155, 224, 249, 277, 302, 340, 365, 408, 434, 457, 480, 555, 581` (15 errors)
  - `line_items: Json` → `AdditionalLineItem[]`
  - `excluded_line_item_ids: Json` → needs casting

**Fix Strategy**: Cast `Json` to typed arrays using `as AdditionalLineItem[]`.

---

### Category 4: Enum Value Not in Definition (1 error)
- `appointment.service.ts:476` - `'rescheduled'` not in `AuditAction` enum

**Fix Strategy**: Add `'rescheduled'` to AuditAction enum or use different action.

---

## Next Steps

1. **Phase 1**: Fix enum/string mismatches (13 errors) - QUICK WIN
2. **Phase 2**: Fix nullability (7 errors)
3. **Phase 3**: Fix Json casting (15 errors)
4. **Phase 4**: Fix AuditAction enum (1 error)
5. **Re-run** `npm run check` after each phase

**Total Errors to Fix**: ~50

