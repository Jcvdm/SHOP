# Bug #1 Testing Instructions

**Status**: Ready for Manual Testing  
**Fix Applied**: Line 319 in `src/routes/(app)/work/inspections/[id]/+page.svelte`  
**Change**: `goto('/work/appointments')` → `goto('/work/appointments', { invalidateAll: true })`

---

## Pre-Testing Setup

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open browser DevTools** (F12) and go to Console tab to watch for any errors

3. **Have test data ready**:
   - At least one inspection with an assigned engineer
   - At least one inspection WITHOUT an assigned engineer
   - Note the current appointments badge count in sidebar

---

## Test Case 1: Create Appointment (PRIMARY TEST)

**Objective**: Verify new appointment appears immediately in list after creation

**Prerequisites**:
- Navigate to `/work/inspections/[id]` for an inspection WITH assigned engineer
- Verify "Schedule Appointment" button is visible

**Steps**:
1. Click "Schedule Appointment" button
2. Fill in appointment details:
   - Appointment type: **In-person**
   - Date: **Tomorrow's date**
   - Time: **10:00 AM**
   - Duration: **60 minutes**
   - Location: **Test Address, Test City, Province**
3. Click "Create Appointment" button
4. **CRITICAL**: Do NOT manually navigate or refresh

**Expected Results** ✅:
- [ ] Modal closes immediately
- [ ] Page navigates to `/work/appointments` automatically
- [ ] **NEW APPOINTMENT APPEARS IN LIST WITHOUT MANUAL REFRESH**
- [ ] Appointment shows correct details (date, time, engineer, location)
- [ ] Assessment stage is `appointment_scheduled`
- [ ] No console errors

**Failure Indicators** ❌:
- Appointments list is empty or doesn't show new appointment
- Need to navigate away and back to see appointment
- Console shows errors related to data loading
- Modal stays open or shows error

**Result**: [ ] PASS [ ] FAIL

---

## Test Case 2: Engineer Appointment (REGRESSION TEST)

**Objective**: Verify existing engineer appointment flow still works

**Prerequisites**:
- Navigate to `/work/inspections/[id]` for an inspection WITHOUT assigned engineer
- Verify "Appoint Engineer" button is visible

**Steps**:
1. Click "Appoint Engineer" button
2. Select an engineer from dropdown
3. Click "Appoint Engineer" button in modal
4. **CRITICAL**: Do NOT manually navigate or refresh

**Expected Results** ✅:
- [ ] Modal closes immediately
- [ ] Page refreshes automatically
- [ ] Engineer assignment shows immediately
- [ ] No console errors

**Failure Indicators** ❌:
- Engineer not assigned
- Need to refresh to see assignment
- Console errors

**Result**: [ ] PASS [ ] FAIL

---

## Test Case 3: Sidebar Badge Update (REGRESSION TEST)

**Objective**: Verify sidebar badge updates immediately after appointment creation

**Prerequisites**:
- Note current appointments badge count in sidebar (e.g., "3")

**Steps**:
1. Create a new appointment (use Test Case 1 steps)
2. Immediately observe sidebar badge count
3. Do NOT refresh page

**Expected Results** ✅:
- [ ] Badge count increases by 1 immediately
- [ ] Badge updates without page refresh
- [ ] No console errors

**Failure Indicators** ❌:
- Badge count doesn't change
- Need to refresh to see updated count
- Console errors

**Result**: [ ] PASS [ ] FAIL

---

## Test Case 4: Cancel Inspection (REGRESSION TEST)

**Objective**: Verify cancel inspection navigation still works

**Prerequisites**:
- Navigate to any inspection detail page

**Steps**:
1. Click "Cancel Inspection" button
2. Confirm cancellation in modal
3. Do NOT manually navigate

**Expected Results** ✅:
- [ ] Modal closes
- [ ] Navigates to `/work/inspections` automatically
- [ ] Cancelled inspection is removed from list
- [ ] No console errors

**Result**: [ ] PASS [ ] FAIL

---

## Test Case 5: Reactivate Inspection (REGRESSION TEST)

**Objective**: Verify reactivate inspection navigation still works

**Prerequisites**:
- Navigate to a cancelled inspection detail page

**Steps**:
1. Click "Reactivate" button
2. Do NOT manually navigate

**Expected Results** ✅:
- [ ] Navigates to `/work/inspections` automatically
- [ ] Reactivated inspection appears in list
- [ ] No console errors

**Result**: [ ] PASS [ ] FAIL

---

## Test Case 6: Accept Request (REGRESSION TEST)

**Objective**: Verify accept request navigation still works

**Prerequisites**:
- Navigate to a request detail page

**Steps**:
1. Click "Accept" button
2. Do NOT manually navigate

**Expected Results** ✅:
- [ ] Navigates to `/work/inspections/[id]` automatically
- [ ] Inspection detail page loads with fresh data
- [ ] No console errors

**Result**: [ ] PASS [ ] FAIL

---

## Test Case 7: Double Click (EDGE CASE)

**Objective**: Verify loading state prevents duplicate appointments

**Prerequisites**:
- Navigate to inspection with assigned engineer

**Steps**:
1. Click "Schedule Appointment" button
2. Fill in appointment details
3. Click "Create Appointment" button **TWICE RAPIDLY**
4. Observe loading state

**Expected Results** ✅:
- [ ] Loading state prevents second click
- [ ] Only ONE appointment created
- [ ] No duplicate appointments in list

**Result**: [ ] PASS [ ] FAIL

---

## Test Case 8: Network Delay (EDGE CASE)

**Objective**: Verify fix works with slow network

**Prerequisites**:
- Open DevTools (F12)
- Go to Network tab
- Set throttling to "Slow 3G"

**Steps**:
1. Navigate to inspection with assigned engineer
2. Click "Schedule Appointment" button
3. Fill in appointment details
4. Click "Create Appointment" button
5. Observe loading indicator

**Expected Results** ✅:
- [ ] Loading indicator shows during network delay
- [ ] After delay, navigates to appointments list
- [ ] New appointment appears in list
- [ ] No console errors

**Result**: [ ] PASS [ ] FAIL

---

## Summary

| Test Case | Type | Result | Notes |
|-----------|------|--------|-------|
| 1. Create Appointment | PRIMARY | [ ] | **MOST IMPORTANT** |
| 2. Engineer Appointment | REGRESSION | [ ] | |
| 3. Sidebar Badge | REGRESSION | [ ] | |
| 4. Cancel Inspection | REGRESSION | [ ] | |
| 5. Reactivate Inspection | REGRESSION | [ ] | |
| 6. Accept Request | REGRESSION | [ ] | |
| 7. Double Click | EDGE CASE | [ ] | |
| 8. Network Delay | EDGE CASE | [ ] | |

---

## Overall Result

**All Tests Passed**: [ ] YES [ ] NO

**If NO, describe failures**:
```
[Describe any failures here]
```

**Console Errors**: [ ] NONE [ ] YES (describe)

---

## Next Steps

After completing all tests:

1. If all tests PASS:
   - Mark Phase 3 as COMPLETE
   - Move to Phase 4: Documentation & Completion

2. If any test FAILS:
   - Document the failure above
   - Check console for errors
   - Review the fix in the code
   - Consider rollback if critical issue found

---

## Notes

- **Test Case 1 is the most critical** - it directly tests the fix
- **Regression tests ensure no side effects** - they verify existing functionality still works
- **Edge cases test robustness** - they verify the fix handles unusual scenarios
- **All tests should pass** - if any fail, the fix may need adjustment

---

## Troubleshooting

**If Test Case 1 fails (appointment doesn't appear)**:
1. Check browser console for errors
2. Verify the fix was applied correctly (line 319 should have `{ invalidateAll: true }`)
3. Check if appointment was actually created in database
4. Try clearing browser cache and reloading

**If regression tests fail**:
1. The fix may have introduced a side effect
2. Check console for errors
3. Consider reverting and investigating further

**If edge cases fail**:
1. May indicate performance or timing issues
2. Check network tab for slow requests
3. Verify loading states are working correctly

