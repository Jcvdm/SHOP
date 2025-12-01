# 🧪 Audit Log System - Testing Guide

**Date**: January 30, 2025  
**Purpose**: Verify audit logging works across the complete assessment workflow

---

## ✅ Pre-Testing Checklist

- [ ] Logged in as **admin user** (required to see Audit Trail tab)
- [ ] Assessment in progress or finalized
- [ ] Browser console open to check for errors
- [ ] Supabase dashboard open to verify audit_logs table entries

---

## 🔍 Test Scenarios

### Test 1: Assessment Creation Audit
**Steps**:
1. Create a new request
2. Accept request to create inspection
3. Create appointment
4. Start assessment

**Expected Audit Logs**:
- ✅ `request` entity: `created` action
- ✅ `assessment` entity: `assessment_created` action
- ✅ `assessment` entity: `stage_transition` (request_submitted)

**Verification**:
- Open assessment detail page
- Click "Audit Trail" tab (admin only)
- Should see assessment creation and stage transition

---

### Test 2: Vehicle Tab Updates
**Steps**:
1. Open assessment detail page
2. Go to "Vehicle ID" tab
3. Update vehicle identification fields
4. Save changes

**Expected Audit Logs**:
- ✅ `vehicle_identification` entity: `updated` action
- ✅ Metadata includes field names and old/new values

**Verification**:
- Click "Audit Trail" tab
- Should see vehicle identification update with field details

---

### Test 3: Estimate Line Item Operations
**Steps**:
1. Go to "Estimate" tab
2. Add a new line item
3. Update the line item
4. Delete the line item

**Expected Audit Logs**:
- ✅ `estimate` entity: `line_item_added` action
- ✅ `estimate` entity: `line_item_updated` action
- ✅ `estimate` entity: `line_item_deleted` action

**Verification**:
- Click "Audit Trail" tab
- Should see all three operations with descriptions

---

### Test 4: Additionals Approval Workflow
**Steps**:
1. Finalize estimate
2. Go to "Additionals" tab
3. Add a new line item
4. Approve the line item
5. Add another line item
6. Decline with reason

**Expected Audit Logs**:
- ✅ `estimate` entity: `line_item_added` (first item)
- ✅ `estimate` entity: `line_item_approved`
- ✅ `estimate` entity: `line_item_added` (second item)
- ✅ `estimate` entity: `line_item_declined` (with reason)

**Verification**:
- Click "Audit Trail" tab
- Should see all approval/decline actions with reasons

---

### Test 5: FRC Workflow
**Steps**:
1. Finalize estimate
2. Go to "FRC" tab
3. Click "Start FRC"
4. Agree to a line item
5. Adjust another line item
6. Complete FRC with sign-off

**Expected Audit Logs**:
- ✅ `frc` entity: `created` action (FRC started)
- ✅ `frc` entity: `updated` action (line decisions)
- ✅ `assessment` entity: `status_changed` (to archived)

**Verification**:
- Click "Audit Trail" tab
- Should see FRC creation, line decisions, and completion

---

### Test 6: Assessment Cancellation
**Steps**:
1. Open assessment detail page
2. Click "Cancel Assessment" button
3. Confirm cancellation

**Expected Audit Logs**:
- ✅ `assessment` entity: `cancelled` action
- ✅ `assessment` entity: `stage_transition` (to cancelled)

**Verification**:
- Click "Audit Trail" tab
- Should see cancellation and stage transition

---

### Test 7: Cross-Entity History
**Steps**:
1. Open assessment detail page
2. Click "Audit Trail" tab

**Expected Display**:
- ✅ All operations from request creation through current state
- ✅ Mixed entity types (request, assessment, estimate, frc, etc.)
- ✅ Chronological order (newest first)
- ✅ Icons and colors for each action type

**Verification**:
- Timeline should show complete workflow history
- All actions should have descriptive text
- Metadata badges should show context

---

## 🔧 Debugging Tips

### Check Audit Logs in Database
```sql
-- View all audit logs for an assessment
SELECT * FROM audit_logs 
WHERE entity_id = 'assessment-id-here'
ORDER BY created_at DESC;

-- View specific action type
SELECT * FROM audit_logs 
WHERE action = 'line_item_approved'
ORDER BY created_at DESC;

-- View by entity type
SELECT * FROM audit_logs 
WHERE entity_type = 'estimate'
ORDER BY created_at DESC;
```

### Browser Console Checks
- Look for any `Error logging audit change:` messages
- Check for `Error fetching assessment audit history:` messages
- Verify no 403 (permission) errors on audit_logs table

### Common Issues

**Issue**: Audit Trail tab not visible
- **Solution**: Verify you're logged in as admin user
- **Check**: `userRole === 'admin'` in AssessmentLayout

**Issue**: No audit logs showing
- **Solution**: Verify operations are being performed
- **Check**: Supabase audit_logs table has entries
- **Check**: entity_id matches assessment ID

**Issue**: Metadata not showing
- **Solution**: Verify metadata is being passed to logChange()
- **Check**: Browser console for any JSON serialization errors

---

## 📊 Expected Audit Log Count

For a complete assessment workflow:
- Request creation: 1-2 logs
- Assessment creation: 1-2 logs
- Vehicle tabs (7 tabs): 7-10 logs
- Estimate operations: 5-20 logs (depends on line items)
- Additionals operations: 3-10 logs (depends on approvals)
- FRC operations: 3-5 logs
- **Total**: 25-60 logs per assessment

---

## ✨ Success Criteria

- [ ] Audit Trail tab visible for admin users
- [ ] All operations logged with correct action types
- [ ] Metadata includes relevant context
- [ ] Timeline displays in chronological order
- [ ] Icons and colors render correctly
- [ ] No console errors during operations
- [ ] Audit logging doesn't slow down operations

---

## 🚀 Ready for Production

Once all tests pass, the audit log system is production-ready!

