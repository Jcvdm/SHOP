# SOP: Page Updates and Badge Refresh Patterns

**Last Updated**: 2025-10-29
**Status**: Active Standard
**Related**: `navigation_based_state_transitions.md`, `working_with_assessment_centric_architecture.md`

---

## Overview

This document defines the standardized patterns for updating page data and refreshing sidebar badge counts in ClaimTech. These patterns ensure consistent UX and prevent stale data across the application.

---

## Core Principle: Navigation-First Pattern

**Standard Pattern**: When a mutation changes which list page an assessment belongs to (e.g., finalization moves it from Open to Finalized), navigate to the target list page instead of staying on the current page.

**Why**: Navigation triggers:
1. Full page refresh (loads new data from server)
2. Sidebar badge count updates (via polling mechanism)
3. User sees the result of their action immediately
4. No 10-second polling delay

**Used By**: 15+ files in production codebase

---

## Pattern 1: Navigate After List-Changing Mutations

### When to Use
- Assessment moves to a different stage (different list page)
- Examples: finalization, FRC completion, archiving

### Implementation

**✅ CORRECT - Navigate to target list**:
```typescript
// In FinalizeTab.svelte
async function handleFinalizeEstimate() {
    finalizing = true;
    error = null;
    try {
        await assessmentService.finalizeEstimate(
            assessment.id,
            undefined,
            $page.data.supabase  // Authenticated client
        );
        // Navigate to Finalized Assessments list
        // This triggers full refresh and badge update
        goto('/work/finalized-assessments');
    } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to finalize';
    } finally {
        finalizing = false;
    }
}
```

**❌ INCORRECT - Stay on page with invalidateAll()**:
```typescript
// DON'T DO THIS for list-changing mutations
await assessmentService.finalizeEstimate(assessment.id);
await invalidateAll(); // Only refreshes current page, not badges
// User still on assessment detail page, can't see it in new list
```

### Additional Example: Appointment Creation

**✅ CORRECT - Navigate with invalidateAll for cross-page mutations**:
```typescript
// In InspectionDetail.svelte - handleCreateAppointment()
async function handleCreateAppointment() {
    loading = true;
    error = null;
    try {
        // Create appointment in database
        await appointmentService.create({
            assessment_id: data.assessment.id,
            appointment_type: appointmentType,
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
            duration_minutes: duration,
            location_address: location
        }, $page.data.supabase);

        // Update assessment with appointment_id
        await assessmentService.update(
            data.assessment.id,
            { appointment_id: newAppointmentId },
            $page.data.supabase
        );

        // Update assessment stage
        await assessmentService.updateStage(
            data.assessment.id,
            'appointment_scheduled',
            $page.data.supabase
        );

        showCreateAppointmentModal = false;

        // Navigate to appointments list with cache invalidation
        // IMPORTANT: Must use { invalidateAll: true } to force fresh data load
        // Without it, SvelteKit serves cached data that doesn't include new appointment
        goto('/work/appointments', { invalidateAll: true });
    } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to create appointment';
    } finally {
        loading = false;
    }
}
```

**Why `{ invalidateAll: true }` is needed here**:
- Appointment is created in database ✅
- Assessment is updated with appointment_id ✅
- Assessment stage is updated to 'appointment_scheduled' ✅
- BUT: Without `invalidateAll`, SvelteKit may serve cached appointments list data
- Cached data was loaded BEFORE the appointment was created
- Result: New appointment doesn't appear in list until manual refresh
- Solution: `{ invalidateAll: true }` forces fresh query that includes new appointment

### Key Points
- Use `goto('/path/to/target-list')` after successful mutation
- Use `{ invalidateAll: true }` when navigating to a different page after mutation
- Don't use `await` before `goto()` (immediate navigation)
- Authenticated client passed from `$page.data.supabase`
- Navigation with invalidateAll handles all data refresh automatically

---

## Pattern 2: Same-Page Refresh for Non-List Mutations

### When to Use
- Mutation updates current page data but doesn't change list membership
- Examples: updating estimate line items, changing document status

### Implementation

**✅ CORRECT - Use invalidateAll() or goto with invalidateAll**:
```typescript
// Option A: Stay on same page
await someService.updateData(id, data, $page.data.supabase);
await invalidateAll();  // Refresh current page data

// Option B: Refresh current route
await someService.updateData(id, data, $page.data.supabase);
goto($page.url.pathname, { invalidateAll: true });  // Force refresh
```

### Key Points
- Only use for updates that don't change list membership
- Badges won't update until next polling interval (10 seconds)
- User stays on current page to continue working

---

## Pattern 3: Sidebar Badge Calculations

### Standard: Query by Stage

Sidebar badges must count assessments at the stage that their corresponding page queries.

**✅ CORRECT - Badge matches page query**:
```typescript
// Additionals page queries by stage
const { data } = await supabase
    .from('assessments')
    .select('*')
    .eq('stage', 'additionals_in_progress');

// Additionals badge counts same stage
additionalsCount = await additionalsService.getAssessmentsAtStageCount(
    $page.data.supabase,
    engineerIdFilter
);
```

**❌ INCORRECT - Badge uses different criteria**:
```typescript
// Page shows all assessments at stage
// Badge counts only pending items (different criteria)
additionalsCount = await additionalsService.getPendingCount(
    $page.data.supabase,
    engineerIdFilter
);
// Result: Badge count doesn't match page record count
```

### Badge Implementation Checklist

1. **Service Layer**: Add count method that matches page query
   ```typescript
   async getAssessmentsAtStageCount(client?: ServiceClient, engineer_id?: string | null): Promise<number> {
       const db = client ?? supabase;
       let query = db
           .from('assessments')
           .select('id', { count: 'exact', head: true })
           .eq('stage', 'stage_name');

       if (engineer_id) {
           query = query.eq('appointments.engineer_id', engineer_id);
       }

       const { count, error } = await query;
       return count || 0;
   }
   ```

2. **Sidebar Component**: Use service count method
   ```typescript
   async function loadBadgeCount() {
       try {
           const engineerIdFilter = role === 'engineer' ? engineer_id : undefined;
           badgeCount = await service.getAssessmentsAtStageCount(
               $page.data.supabase,
               engineerIdFilter
           );
       } catch (error) {
           console.error('Error loading badge:', error);
       }
   }
   ```

3. **UI Rendering**: Display badge conditionally
   ```svelte
   {#if item.href === '/work/page-name' && badgeCount > 0}
       <span class="inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
           {badgeCount}
       </span>
   {/if}
   ```

---

## Badge Colors by Category

Consistent color coding helps users quickly identify work types:

- **Blue** (`bg-blue-600`): Active workflow stages (Inspections, Appointments, Open Assessments)
- **Green** (`bg-green-600`): Completed/finalized stages (Finalized Assessments)
- **Purple** (`bg-purple-600`): Review stages (FRC)
- **Orange** (`bg-orange-600`): Client-driven stages (Additionals)

---

## Polling Mechanism

Sidebar badges update via 10-second polling interval:

```typescript
// In Sidebar.svelte onMount
pollingInterval = setInterval(() => {
    if (!isEditRoute($page.url.pathname)) {
        loadAllCounts();
    }
}, 10000);
```

**Key Points**:
- Polling disabled on edit/heavy-input routes (prevents conflicts)
- Edit routes: assessment detail pages, estimate builders
- Polling resumes when navigating away from edit routes
- Navigation triggers immediate badge refresh (no 10-second wait)

---

## Common Patterns Summary

| Scenario | Pattern | Method |
|----------|---------|--------|
| Assessment changes stage → different list | Navigate to new list | `goto('/work/new-list')` |
| Update on current page (no stage change) | Refresh current page | `await invalidateAll()` |
| Complete workflow → archive | Navigate to archive | `goto('/work/archive')` |
| FRC completion → finalized | Navigate to finalized | `goto('/work/finalized-assessments')` |
| Badge count refresh | Automatic via polling | 10-second interval |
| Immediate badge refresh | Navigate to any page | `goto('/work/any-page')` |

---

## Examples by Workflow Stage

### 1. Finalization (estimate_sent → estimate_finalized)
```typescript
// FinalizeTab.svelte
await assessmentService.finalizeEstimate(id, options, $page.data.supabase);
goto('/work/finalized-assessments');  // User sees their finalized assessment
```

### 2. Start FRC (estimate_finalized → frc_in_progress)
```typescript
// In finalized-assessments/+page.svelte
await frcService.startFRC(assessmentId, estimate, additionals, $page.data.supabase);
goto('/work/frc');  // Navigate to FRC list
```

### 3. Complete FRC (frc_in_progress → estimate_finalized)
```typescript
// FRC detail page
await frcService.completeFRC(frcId, $page.data.supabase);
goto('/work/finalized-assessments');  // Back to finalized list
```

### 4. Archive Assessment (any_stage → archived)
```typescript
// Archive action
await assessmentService.updateStage(id, 'archived', $page.data.supabase);
goto('/work/archive');  // Show in archive list
```

---

## Testing Checklist

When implementing page updates and badges:

- [ ] Service method accepts optional `client` parameter
- [ ] Component passes `$page.data.supabase` as client
- [ ] Navigation happens AFTER successful mutation (in try block)
- [ ] Error handling prevents navigation on failure
- [ ] Badge count method queries same stage as page
- [ ] Badge color follows category conventions
- [ ] Badge only displays when count > 0
- [ ] Engineer role filter applied to badge counts
- [ ] Manual test: Badge updates within 10 seconds
- [ ] Manual test: Navigation shows assessment in new list immediately

---

## Related Documentation

- `.agent/SOP/navigation_based_state_transitions.md` - Server-side state transitions
- `.agent/SOP/working_with_assessment_centric_architecture.md` - Assessment stage pipeline
- `.agent/System/bug_postmortem_finalization_frc_stage_transitions.md` - Historical bug from not following these patterns

---

## Version History

- **2025-10-29**: Initial creation - standardized navigation pattern and badge calculations
