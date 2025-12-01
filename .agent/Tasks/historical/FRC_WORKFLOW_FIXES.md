# FRC Workflow Fixes - Implementation Summary

## 🎯 **Overview**

Fixed critical workflow issues with FRC (Final Repair Costing) and Additionals to ensure proper data flow, prevent crashes, and improve user experience.

---

## ✅ **Issues Fixed**

### **1. FRC DataTable Null-Check Error** ✅

**Problem:**
```
Uncaught TypeError: can't access property "class", config is undefined
at frc/+page.svelte:123
```

**Root Cause:**
- FRC status render function didn't handle undefined or invalid status values
- When `statusBadgeConfig[value]` returned undefined, accessing `.class` caused crash

**Solution:**
- Added null-checking in render function with fallback gray badge
- Added console warning for debugging
- Filters out malformed FRC records with missing assessment data

**Files Modified:**
- `src/routes/(app)/work/frc/+page.svelte` (lines 117-129, 16-63)

**Code Changes:**
```typescript
render: (value: FRCStatus) => {
    const config = statusBadgeConfig[value];
    if (!config) {
        console.warn(`Unknown FRC status: ${value}`);
        return `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">${value || 'Unknown'}</span>`;
    }
    return `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.class}">${config.label}</span>`;
}
```

---

### **2. AssessmentLayout Undefined Assessment Error** ✅

**Problem:**
```
Uncaught (in promise) TypeError: can't access property "estimate_finalized_at", $props.assessment is undefined
at AssessmentLayout.svelte:64
```

**Root Cause:**
- When navigating to assessment page from FRC list, assessment data might not be loaded
- Derived `tabs()` function tried to access `assessment.estimate_finalized_at` without null-checking

**Solution:**
- Added optional chaining (`?.`) to all assessment property accesses
- Component now handles undefined assessment gracefully

**Files Modified:**
- `src/lib/components/assessment/AssessmentLayout.svelte` (lines 64, 69, 76, 77, 81)

**Code Changes:**
```typescript
// Add Additionals tab if estimate is finalized
if (assessment?.estimate_finalized_at) {
    baseTabs.push({ id: 'additionals', label: 'Additionals', icon: Plus });
}

// Add FRC tab if assessment is closed (submitted)
if (assessment?.status === 'submitted') {
    baseTabs.push({ id: 'frc', label: 'FRC', icon: FileCheck });
}

const completedCount = $derived(assessment?.tabs_completed?.length || 0);

function isTabCompleted(tabId: string): boolean {
    return assessment?.tabs_completed?.includes(tabId) || false;
}
```

---

### **3. Additionals Sidebar Logic - Exclude FRC-Started Assessments** ✅

**Problem:**
- Additionals sidebar showed assessments even after FRC was started
- Users couldn't tell which assessments needed additionals review vs which were already in FRC

**Expected Behavior:**
Additionals should only show assessments where:
1. ✅ Assessment has additionals
2. ✅ Additionals have pending items
3. ✅ **FRC has NOT been started** (was missing!)

**Solution:**
- Updated `getPendingCount()` to exclude assessments with FRC records
- Updated `listAdditionals()` to filter out assessments with FRC started
- Uses Set for efficient lookup of assessments with FRC

**Files Modified:**
- `src/lib/services/additionals.service.ts` (lines 801-853, 844-878)

**Code Changes:**
```typescript
async getPendingCount(): Promise<number> {
    // Get all additionals with pending items
    const { data: additionalsData, error } = await supabase
        .from('assessment_additionals')
        .select('assessment_id, line_items');

    if (error) return 0;

    // Filter to only those with pending items
    const withPending = (additionalsData || []).filter((record) => {
        const lineItems = record.line_items as AdditionalLineItem[];
        return lineItems.some((item) => item.status === 'pending');
    });

    // Get assessment IDs that have FRC started
    const { data: frcData } = await supabase
        .from('assessment_frc')
        .select('assessment_id');

    const assessmentsWithFRC = new Set((frcData || []).map((f) => f.assessment_id));

    // Count only additionals where FRC hasn't been started
    return withPending.filter(a => !assessmentsWithFRC.has(a.assessment_id)).length;
}

async listAdditionals(): Promise<any[]> {
    // ... fetch additionals ...

    // Get assessment IDs that have FRC started
    const { data: frcData } = await supabase.from('assessment_frc').select('assessment_id');
    const assessmentsWithFRC = new Set((frcData || []).map((f) => f.assessment_id));

    // Filter out additionals where FRC has been started
    return (data || []).filter(record => !assessmentsWithFRC.has(record.assessment_id));
}
```

---

### **4. FRC Status Properly Set When Created** ✅

**Verification:**
- Confirmed FRC is created with `status: 'in_progress'` (line 119 in frc.service.ts)
- Confirmed `started_at` timestamp is set (line 166 in frc.service.ts)
- FRC appears in FRC list immediately after creation
- Added data validation to filter out malformed FRC records

**Files Modified:**
- `src/routes/(app)/work/frc/+page.svelte` (added filter for malformed records)

---

### **5. FRC List Defaults to In-Progress Filter** ✅

**Problem:**
- FRC list defaulted to showing ALL FRCs (not_started, in_progress, completed)
- Users had to manually filter to see active FRCs they need to work on

**Solution:**
- Changed default filter from `'all'` to `'in_progress'`
- Users now see active FRCs by default
- Can still switch to other tabs to see all/completed FRCs

**Files Modified:**
- `src/routes/(app)/work/frc/+page.svelte` (line 14)

**Code Changes:**
```typescript
// Status filter state - default to 'in_progress' for better UX
let selectedStatus = $state<FRCStatus | 'all'>('in_progress');
```

---

## 🔄 **Correct Workflow After Fixes**

### **Phase 1: Finalized Assessment**
- **Assessment Status:** `submitted`
- **Appears in:** Finalized Assessments list
- **Can do:** Add additionals, Start FRC
- **Sidebar badges:**
  - ✅ Finalized Assessments: Shows count
  - ✅ Additionals: Shows count if additionals exist with pending items
  - ✅ FRC: Does NOT show this assessment yet

### **Phase 2: FRC Started**
- **Assessment Status:** `submitted` (unchanged)
- **FRC Status:** `in_progress`
- **Appears in:** 
  - ✅ Finalized Assessments list (still there)
  - ✅ FRC list (now appears here - defaults to in_progress tab)
- **Sidebar badges:**
  - ✅ Finalized Assessments: Still shows count
  - ✅ Additionals: **Does NOT show** (excluded because FRC started)
  - ✅ FRC: Shows count (in_progress only)

### **Phase 3: FRC Completed**
- **Assessment Status:** `archived` (changed by completeFRC)
- **FRC Status:** `completed`
- **Appears in:**
  - ✅ Archive (moved here)
  - ✅ FRC list (shows in completed tab, not in default in_progress tab)
- **Sidebar badges:**
  - ✅ Finalized Assessments: Count decreases (assessment removed)
  - ✅ Additionals: Not counted
  - ✅ FRC: Count decreases (only counts in_progress)

---

## 📊 **Summary of Changes**

| **File** | **Lines Changed** | **Purpose** |
|----------|------------------|-------------|
| `src/routes/(app)/work/frc/+page.svelte` | 14, 16-63, 117-129 | Null-checks, data validation, default filter |
| `src/lib/components/assessment/AssessmentLayout.svelte` | 64, 69, 76, 77, 81 | Optional chaining for undefined assessment |
| `src/lib/services/additionals.service.ts` | 801-853, 844-878 | Exclude FRC-started assessments |

---

## 🎯 **Benefits**

1. **No More Crashes** ✅
   - FRC DataTable handles undefined status gracefully
   - AssessmentLayout handles undefined assessment gracefully

2. **Clear Workflow** ✅
   - Additionals only show when FRC hasn't started
   - FRC list defaults to active (in_progress) items
   - Users can easily see what needs attention

3. **Better UX** ✅
   - Default filter shows relevant FRCs
   - Sidebar badges accurately reflect work status
   - No confusion about which phase an assessment is in

4. **Data Integrity** ✅
   - Malformed records are filtered out with warnings
   - Null-checks prevent crashes from bad data
   - Proper status tracking throughout workflow

---

## 🧪 **Testing Checklist**

- [ ] Navigate to `/work/frc` - should show in_progress FRCs by default
- [ ] Click on FRC in sidebar - should not crash
- [ ] Start FRC from finalized assessment - should appear in FRC list immediately
- [ ] Check Additionals sidebar - should not show assessments with FRC started
- [ ] Complete FRC - assessment should move to Archive
- [ ] FRC sidebar badge should only count in_progress FRCs
- [ ] Additionals sidebar badge should exclude assessments with FRC

---

**All fixes implemented and ready for testing!** 🚀

