# TODO Before Production

## Critical Items to Address Before Going Live

### 1. ⚠️ Disable Force Finalize Testing Mode

**File:** `src/lib/components/assessment/FinalizeTab.svelte`  
**Line:** 72

**Current State:**
```typescript
const ENABLE_FORCE_FINALIZE = true; // Set to false to enforce completion check
```

**Action Required:**
```typescript
const ENABLE_FORCE_FINALIZE = false; // Set to false to enforce completion check
```

**Why:** The "Force Finalize" button bypasses the requirement that all 9 assessment sections must be completed before finalizing an estimate. This was added for testing the Additionals feature during development.

**Impact:** When set to `false`, users will only be able to finalize estimates after completing all required sections (Summary, Vehicle ID, 360° Exterior, Interior & Mechanical, Tyres, Damage ID, Values, Pre-Incident, Estimate).

**Testing Checklist Before Disabling:**
- [ ] Verify all 9 assessment sections can be completed properly
- [ ] Test that the completion tracking works correctly
- [ ] Ensure the progress indicator shows accurate completion status
- [ ] Confirm the regular "Mark Estimate Finalized & Sent" button works when all sections are complete

---

## How to Verify

1. Open an assessment
2. Navigate to the Finalize tab
3. Check the progress indicator at the top (should show "X of 9 sections complete")
4. Complete all 9 sections
5. Return to Finalize tab
6. Verify the regular blue button is now enabled
7. Set `ENABLE_FORCE_FINALIZE = false`
8. Test that incomplete assessments cannot be finalized

---

## Additional Notes

- The force finalize button is styled with an orange border and 🚧 emoji to indicate it's for testing
- A yellow warning banner appears when force finalize is available
- Both the warning and the force finalize button will disappear when `ENABLE_FORCE_FINALIZE` is set to `false`

---

**Last Updated:** 2025-01-14  
**Feature:** Additionals Implementation  
**Priority:** HIGH - Must be addressed before production deployment

