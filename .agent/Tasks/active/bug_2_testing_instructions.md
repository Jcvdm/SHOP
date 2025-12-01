# Bug #2 Testing Instructions - Damage ID Outstanding Fields Badge

## Overview
Test that the outstanding fields badge on the Damage ID section automatically closes/disappears when all required fields are completed.

## Prerequisites
- Development server running (`npm run dev`)
- Access to an assessment page with Damage tab
- Browser DevTools console open (F12)

## Test Cases

### Test Case 1: Badge Appears When Incomplete ✅
**Objective**: Verify badge displays when required fields are missing

**Steps**:
1. Navigate to any assessment page
2. Click on "Damage ID" tab
3. Observe the page

**Expected Result**:
- Red warning banner appears at top of tab
- Banner shows "Required Fields Missing"
- Lists two missing fields:
  - "Damage matches description (Yes/No)"
  - "Severity"

**Pass/Fail**: ___________

---

### Test Case 2: Badge Closes When Complete ✅ (CRITICAL)
**Objective**: Verify badge immediately disappears when all fields are filled

**Steps**:
1. With badge visible (from Test Case 1)
2. Click "Yes, Matches" button
3. Observe badge (should still show - severity missing)
4. Click "Severe" in Severity dropdown
5. Observe badge immediately

**Expected Result**:
- After clicking "Yes, Matches": Badge still visible (severity missing)
- After selecting "Severe": **Badge immediately disappears** (no delay, no page refresh needed)
- No console errors

**Pass/Fail**: ___________

---

### Test Case 3: Badge Reappears When Field Cleared ✅
**Objective**: Verify badge reappears when a required field is cleared

**Steps**:
1. With both fields filled and badge hidden (from Test Case 2)
2. Click "Severe" dropdown again
3. Select empty option (clear severity)
4. Observe badge immediately

**Expected Result**:
- Badge immediately reappears
- Shows "Severity" as missing field
- No delay or page refresh needed

**Pass/Fail**: ___________

---

### Test Case 4: Persistence Across Tab Changes ✅
**Objective**: Verify badge state persists when switching tabs

**Steps**:
1. Fill both required fields (badge hidden)
2. Click on "Interior & Mechanical" tab
3. Click back on "Damage ID" tab
4. Observe badge state

**Expected Result**:
- Badge remains hidden (fields still complete)
- Data is preserved
- No console errors

**Pass/Fail**: ___________

---

### Test Case 5: Persistence After Page Reload ✅
**Objective**: Verify badge state persists after page refresh

**Steps**:
1. Fill both required fields (badge hidden)
2. Press F5 to reload page
3. Wait for page to load
4. Navigate to Damage ID tab
5. Observe badge state

**Expected Result**:
- Badge remains hidden (data loaded from database)
- Fields show previously entered values
- No console errors

**Pass/Fail**: ___________

---

## Edge Cases

### Edge Case 1: "No, Does Not Match" with Mismatch Notes
**Steps**:
1. Click "No, Does Not Match" button
2. Observe badge (should still show - mismatch_notes missing)
3. Fill in "Explain Mismatch" textarea
4. Select "Severe" severity
5. Observe badge

**Expected Result**:
- Badge disappears when all fields filled
- Mismatch notes field appears/disappears correctly

**Pass/Fail**: ___________

---

### Edge Case 2: Rapid Field Changes
**Steps**:
1. Rapidly click between "Yes" and "No" buttons
2. Rapidly change severity dropdown
3. Observe badge behavior

**Expected Result**:
- Badge updates smoothly without lag
- No console errors
- No duplicate renders

**Pass/Fail**: ___________

---

## Console Checks

**During all tests, verify**:
- [ ] No console errors (red X)
- [ ] No console warnings related to validation
- [ ] No "state_referenced_locally" warnings
- [ ] Auto-save logs appear after 2 seconds of inactivity

---

## Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. Badge appears when incomplete | _____ | |
| 2. Badge closes when complete | _____ | **CRITICAL** |
| 3. Badge reappears when cleared | _____ | |
| 4. Persists across tab changes | _____ | |
| 5. Persists after page reload | _____ | |
| Edge Case 1: Mismatch notes | _____ | |
| Edge Case 2: Rapid changes | _____ | |

---

## Troubleshooting

**If Test Case 2 fails (badge doesn't close)**:
1. Check browser console for errors
2. Verify code change was applied (line 119-135 in DamageTab.svelte)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Restart dev server
5. Check if validation.ts validateDamage() function is correct

**If badge closes but then reappears**:
1. Check if auto-save is overwriting values
2. Verify parent component isn't resetting damageRecord prop
3. Check browser console for errors

**If page reload loses data**:
1. Verify database save completed before reload
2. Check browser console for save errors
3. Verify damageService.update() is working correctly

---

## Sign-Off

**Tested By**: _______________
**Date**: _______________
**All Tests Passed**: [ ] Yes [ ] No

**Notes**:

