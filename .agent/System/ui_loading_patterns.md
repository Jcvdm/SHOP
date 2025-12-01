# UI Loading Patterns - ClaimTech

**Last Updated:** January 30, 2025
**Status:** Active Standard
**Related Docs:** [navigation_based_state_transitions.md](../SOP/navigation_based_state_transitions.md), [creating-components.md](../SOP/creating-components.md), [table_utilities.md](./table_utilities.md)

---

## Overview

ClaimTech uses eight standardized loading patterns to provide user feedback during asynchronous operations:

1. **Global Navigation Bar** - Automatic progress bar for all page navigations
2. **Table Row Loading** - Visual feedback when navigating from list pages (RECOMMENDED for navigation)
3. **Button Loading States** - Individual button spinners for non-navigation actions
4. **Silent Auto-Save Indicator** - Subtle feedback for background saves (NEW: Jan 30, 2025)
5. **Skeleton Loaders** - Placeholder content during initial page loads (NEW: Jan 30, 2025)
6. **Tab Loading States** - In-page loading indicators for tab changes (NEW: Nov 23, 2025)
7. **Navigation Loading Modal** - Full-screen modal with spinner for page navigations (NEW: Nov 23, 2025)
8. **Document Loading Progress** - Progress bars for document generation and file uploads (NEW: Nov 23, 2025)

---

## Pattern Decision Tree

```
Is the action a navigation to another page?
├─ YES → Use Pattern 2: Table Row Loading (useNavigationLoading)
│        Best for: List pages with row clicks, action buttons that navigate
│        Examples: Assessments list, Inspections list, Appointments list
│
└─ NO → Is it a form submission or API call?
         ├─ YES → Use Pattern 3: Button Loading (ActionIconButton prop)
         │        Best for: Delete actions, downloads, status updates
         │        Examples: Generate PDF, Archive record, Send email
         │
         └─ NO → Pattern 1: Global Navigation Bar (automatic)
                  Best for: Standard page navigation without specific triggers
                  Examples: Clicking navigation menu items, breadcrumbs
```

---

## Pattern 1: Global Navigation Bar

**Status:** ✅ Fully Implemented
**Scope:** Automatic - no configuration needed
**Location:** `src/lib/components/layout/NavigationLoadingBar.svelte`

### Description
A thin blue progress bar that appears at the top of the viewport during all SvelteKit page navigations. Automatically tracks the `$navigating` store.

### Implementation
```svelte
<!-- Already integrated in src/routes/+layout.svelte -->
<NavigationLoadingBar />
```

### When It Appears
- User clicks navigation menu items
- Browser back/forward buttons
- Programmatic `goto()` calls
- Form submissions with page redirects

### Styling
```css
.loading-bar {
  @apply fixed top-0 left-0 right-0 h-1 z-50;
  background: linear-gradient(to right, transparent, rgb(37, 99, 235), transparent);
  animation: loading-bar 1.5s ease-in-out infinite;
}
```

---

## Pattern 2: Table Row Loading (RECOMMENDED)

**Status:** ✅ Fully Implemented
**Scope:** List pages with navigation actions
**Utility:** `src/lib/utils/useNavigationLoading.svelte.ts`
**Component:** `src/lib/components/data/ModernDataTable.svelte`

### When to Use
- ✅ List pages where rows navigate to detail pages
- ✅ Action buttons in table cells that trigger navigation
- ✅ Any scenario where user clicks an item to see more details
- ✅ Prevents double-clicks during navigation

### When NOT to Use
- ❌ Non-navigation actions (use Pattern 3 instead)
- ❌ Simple page links (Pattern 1 is sufficient)
- ❌ Modal/dialog triggers (no navigation)

### Complete Implementation Example

```svelte
<script lang="ts">
  import { useNavigationLoading } from '$lib/utils/useNavigationLoading.svelte';
  import ModernDataTable from '$lib/components/data/ModernDataTable.svelte';
  import ActionButtonGroup from '$lib/components/ui/ActionButtonGroup.svelte';
  import ActionIconButton from '$lib/components/ui/ActionIconButton.svelte';
  import { Eye, Play } from 'lucide-svelte';

  // 1. Initialize the utility
  const { loadingId, startNavigation } = useNavigationLoading();

  // Sample data
  let assessments = $state([
    { id: '123', name: 'Assessment 1', status: 'pending' },
    { id: '456', name: 'Assessment 2', status: 'completed' }
  ]);

  // 2. Use startNavigation() in click handlers
  function handleRowClick(row: typeof assessments[0]) {
    startNavigation(row.id, `/work/assessments/${row.id}`);
  }

  function handleStartAssessment(assessmentId: string) {
    // Note: Table handles row-level loading via loadingRowId
    // No need for button-level loading prop
    startNavigation(assessmentId, `/work/assessments/${assessmentId}/start`);
  }

  // Define columns
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions' }
  ];
</script>

<!-- 3. Pass loadingId and rowIdKey to table -->
<ModernDataTable
  data={assessments}
  {columns}
  onRowClick={handleRowClick}
  loadingRowId={loadingId}
  rowIdKey="id"
  striped
>
  {#snippet cellContent(column, row)}
    {#if column.key === 'actions'}
      <ActionButtonGroup align="right">
        <ActionIconButton
          icon={Eye}
          label="View Details"
          onclick={() => handleRowClick(row)}
        />
        <ActionIconButton
          icon={Play}
          label="Start Assessment"
          onclick={() => handleStartAssessment(row.id)}
          variant="primary"
          <!-- NO loading prop needed - table handles it -->
        />
      </ActionButtonGroup>
    {:else}
      {row[column.key]}
    {/if}
  {/snippet}
</ModernDataTable>
```

### API Reference

#### `useNavigationLoading()`

Returns an object with:

```typescript
{
  loadingId: string | null;           // ID of currently loading row
  startNavigation: (id: string, path: string) => void;  // Start navigation with loading
  isLoading: (id: string) => boolean; // Check if specific row is loading
}
```

**Features:**
- ✅ Automatic double-click prevention
- ✅ Auto-reset after navigation (300ms delay)
- ✅ Error handling with cleanup
- ✅ Compatible with `.svelte.ts` files (manual store subscription)
- ✅ Works seamlessly with SvelteKit's `goto()` function

**Implementation Notes:**
- Uses `navigating` store from `$app/stores`
- Subscribes when `startNavigation()` is called
- Automatically unsubscribes and resets on completion
- Cleans up on errors to prevent memory leaks

#### ModernDataTable Loading Props

```typescript
interface LoadingProps<T> {
  loadingRowId?: string | null;           // ID of row currently loading
  loadingIndicator?: 'spinner' | 'pulse' | 'none';  // Style (default: 'spinner')
  rowIdKey?: keyof T;                     // Row identifier property (default: 'id')
}
```

**Visual Behavior:**
- **Loading Row:** Blue background (`bg-blue-50`), pulse animation, spinner in first cell
- **Other Rows:** Faded to 60% opacity (`opacity-60`)
- **Row Clicks:** Disabled while any row is loading
- **Auto-Reset:** 300ms after navigation completes

### Common Row ID Keys by Page

| Page | `rowIdKey` Value | Data Type | Notes |
|------|-----------------|-----------|-------|
| Assessments | `"appointment_id"` | UUID | Links to appointment |
| Inspections | `"id"` | UUID | Direct record ID |
| Appointments | `"appointment_id"` | UUID | Primary identifier |
| Finalized Assessments | `"appointmentId"` | UUID | camelCase variant |
| FRC | `"id"` | UUID | Direct record ID |
| Additionals | `"id"` | UUID | Direct record ID |
| Requests | `"id"` | UUID | Direct record ID |

### Implementation Checklist

When adding loading states to a new list page:

- [ ] Import `useNavigationLoading` utility
- [ ] Destructure `{ loadingId, startNavigation }`
- [ ] Update `handleRowClick` to use `startNavigation(id, path)`
- [ ] Add `loadingRowId={loadingId}` to ModernDataTable
- [ ] Add `rowIdKey="appropriate_key"` to ModernDataTable (see table above)
- [ ] Remove any button-level `loading` props (table handles it)
- [ ] Test double-click prevention
- [ ] Test loading state auto-reset
- [ ] Test error handling

### Pages Using This Pattern

**Reference Implementations:**
- ✅ `src/routes/(app)/work/assessments/+page.svelte`
- ✅ `src/routes/(app)/work/inspections/+page.svelte`
- ✅ `src/routes/(app)/work/appointments/+page.svelte` (Fixed Jan 30, 2025)
- ✅ `src/routes/(app)/work/finalized-assessments/+page.svelte`
- ✅ `src/routes/(app)/work/frc/+page.svelte`
- ✅ `src/routes/(app)/work/additionals/+page.svelte`
- ✅ `src/routes/(app)/requests/+page.svelte`

---

## Pattern 3: Button Loading States

**Status:** ✅ Fully Implemented
**Scope:** Individual actions that don't navigate
**Component:** `src/lib/components/ui/ActionIconButton.svelte`
**Form Actions:** `src/lib/components/forms/FormActions.svelte`
**LoadingButton:** `src/lib/components/ui/button/LoadingButton.svelte`

### When to Use
- ✅ API calls that don't navigate (delete, update, download)
- ✅ Form submissions that stay on the same page
- ✅ Actions that show success/error toasts
- ✅ PDF generation, file downloads
- ✅ Email sending, notifications

### When NOT to Use
- ❌ Navigation actions (use Pattern 2 instead)
- ❌ Actions in table rows that navigate (use Pattern 2)
- ❌ Simple links to other pages (Pattern 1 is sufficient)

### Implementation Example

```svelte
<script lang="ts">
  import ActionIconButton from '$lib/components/ui/ActionIconButton.svelte';
  import { FileDown, Trash2 } from 'lucide-svelte';

  // Track loading state per action type
  let generatingPdf = $state<string | null>(null);
  let deletingRecord = $state<string | null>(null);

  async function handleGeneratePdf(recordId: string) {
    generatingPdf = recordId;
    try {
      const response = await fetch(`/api/reports/${recordId}/pdf`, {
        method: 'POST'
      });
      if (response.ok) {
        const blob = await response.blob();
        // Download logic...
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      generatingPdf = null;
    }
  }

  async function handleDelete(recordId: string) {
    deletingRecord = recordId;
    try {
      await fetch(`/api/records/${recordId}`, { method: 'DELETE' });
      // Remove from list, show toast, etc.
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      deletingRecord = null;
    }
  }
</script>

<ActionIconButton
  icon={FileDown}
  label="Generate PDF"
  onclick={() => handleGeneratePdf(record.id)}
  loading={generatingPdf === record.id}
/>

<ActionIconButton
  icon={Trash2}
  label="Delete"
  onclick={() => handleDelete(record.id)}
  loading={deletingRecord === record.id}
  variant="danger"
/>
```

### ActionIconButton Loading Prop

```typescript
interface ActionIconButtonProps {
  loading?: boolean;  // Shows spinner instead of icon when true
  // ... other props
}
```

**Visual Behavior:**
- Shows `<Loader2>` spinner with `animate-spin` class
- Replaces the normal icon while loading
- Button remains clickable (prevent in handler with early return)
- No automatic double-click prevention (handle manually)

### Best Practices

1. **One Loading State Per Action Type:**
   ```typescript
   // ✅ GOOD: Separate states for different actions
   let generatingPdf = $state<string | null>(null);
   let deletingRecord = $state<string | null>(null);

   // ❌ BAD: Single state for multiple action types
   let loading = $state<string | null>(null); // Ambiguous
   ```

2. **Always Reset in Finally Block:**
   ```typescript
   try {
     await performAction();
   } catch (error) {
     // Handle error
   } finally {
     loadingState = null; // ✅ Always reset
   }
   ```

3. **Track by ID for List Pages:**
   ```typescript
   // ✅ GOOD: Can load multiple records independently
   loading={generatingPdf === record.id}

   // ❌ BAD: All buttons show loading
   loading={generatingPdf === true}
   ```

---

## Pattern 4: Silent Auto-Save Indicator

**Status:** ✅ Newly Implemented (Jan 30, 2025)
**Scope:** Silent background saves without blocking UI
**Component:** `src/lib/components/ui/save-indicator/SaveIndicator.svelte`

### When to Use
- ✅ Auto-save operations on form fields
- ✅ Debounced database updates
- ✅ Background synchronization
- ✅ Non-blocking save feedback
- ✅ Assessment tab updates (vehicle info, rates, etc.)

### When NOT to Use
- ❌ Critical operations requiring user confirmation
- ❌ Form submissions (use Pattern 3 instead)
- ❌ Operations that need to block user interaction

### Implementation Example

```svelte
<script lang="ts">
  import SaveIndicator from '$lib/components/ui/save-indicator/SaveIndicator.svelte';

  let saving = $state(false);
  let saved = $state(false);
  let error = $state(false);

  async function handleAutoSave(value: string) {
    saving = true;
    error = false;
    try {
      await fetch('/api/update', {
        method: 'POST',
        body: JSON.stringify({ value })
      });
      saved = true;
      setTimeout(() => { saved = false; }, 2000); // Hide after 2s
    } catch (err) {
      error = true;
    } finally {
      saving = false;
    }
  }
</script>

<div class="flex items-center gap-4">
  <input
    type="text"
    onchange={(e) => handleAutoSave(e.currentTarget.value)}
  />
  <SaveIndicator {saving} {saved} {error} />
</div>
```

### SaveIndicator Props

```typescript
interface SaveIndicatorProps {
  saving?: boolean;    // Show "Saving..." with spinner
  saved?: boolean;     // Show "Saved" with checkmark
  error?: boolean;     // Show "Save failed" with error icon
  class?: string;      // Additional CSS classes
}
```

**Visual States:**
- **Saving:** Gray spinner + "Saving..." text
- **Saved:** Green checkmark + "Saved" text
- **Error:** Red alert icon + "Save failed" text
- **Idle:** Nothing displayed

### Best Practices

1. **Auto-Hide Success State:**
   ```typescript
   saved = true;
   setTimeout(() => { saved = false; }, 2000);
   ```

2. **Debounce Auto-Save:**
   ```typescript
   let saveTimeout: ReturnType<typeof setTimeout>;

   function handleChange(value: string) {
     clearTimeout(saveTimeout);
     saveTimeout = setTimeout(() => {
       handleAutoSave(value);
     }, 1000); // Wait 1s after user stops typing
   }
   ```

3. **Persist Error State:**
   ```typescript
   // Keep error visible until user acknowledges
   error = true;
   // User must click retry or fix the issue
   ```

---

## Pattern 5: Skeleton Loaders

**Status:** ✅ Newly Implemented (Jan 30, 2025)
**Scope:** Initial page load states
**Components:**
- `src/lib/components/ui/skeleton/skeleton.svelte` - Base skeleton
- `src/lib/components/ui/skeleton/SkeletonCard.svelte` - Card placeholder

### When to Use
- ✅ Dashboard initial load
- ✅ List pages before data arrives
- ✅ Detail pages with async data
- ✅ Perceived performance improvement
- ✅ Better UX than blank page

### When NOT to Use
- ❌ Quick operations (< 200ms)
- ❌ Already-loaded data
- ❌ Error states (show error message instead)

### Implementation Example

```svelte
<script lang="ts">
  import SkeletonCard from '$lib/components/ui/skeleton/SkeletonCard.svelte';
  import { onMount } from 'svelte';

  let loading = $state(true);
  let data = $state(null);

  onMount(async () => {
    const response = await fetch('/api/data');
    data = await response.json();
    loading = false;
  });
</script>

{#if loading}
  <div class="grid gap-4 md:grid-cols-2">
    <SkeletonCard lines={4} />
    <SkeletonCard lines={4} />
    <SkeletonCard lines={4} />
  </div>
{:else}
  <!-- Actual content -->
{/if}
```

### SkeletonCard Props

```typescript
interface SkeletonCardProps {
  lines?: number;  // Number of content lines (default: 3)
  class?: string;  // Additional CSS classes
}
```

**Visual Structure:**
- Header (2 lines)
- Content (configurable lines)
- Footer (2 action buttons)

### Skeleton Component

Base skeleton for custom layouts:

```svelte
<script lang="ts">
  import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
</script>

<div class="space-y-4">
  <Skeleton class="h-12 w-full rounded" />
  <Skeleton class="h-4 w-3/4 rounded" />
  <Skeleton class="h-4 w-1/2 rounded" />
</div>
```

---

## Common Bug: Missing Variable Declaration

### The Problem

**Symptom:** `Uncaught ReferenceError: [variable] is not defined`

**Example from appointments/+page.svelte (Fixed Jan 30, 2025):**

```svelte
<script lang="ts">
  // ❌ WRONG: Variable never declared
  // let startingAssessment = $state<string | null>(null); // Missing!

  async function handleStartAssessment(assessmentId: string) {
    startNavigation(assessmentId, `/work/assessments/${assessmentId}`);
  }
</script>

<!-- ❌ ERROR: startingAssessment is not defined -->
<ActionIconButton
  loading={startingAssessment === row.assessment_id}
  onclick={() => handleStartAssessment(row.id)}
/>
```

### The Root Cause

Developer tried to implement custom loading state for navigation action instead of using the standardized `useNavigationLoading()` utility. This creates:
- Undefined variable references
- Redundant loading state management
- Inconsistent patterns across pages
- No double-click prevention

### The Solution

**Option 1: Remove Button Loading (RECOMMENDED):**
```svelte
<script lang="ts">
  const { loadingId, startNavigation } = useNavigationLoading();

  function handleStartAssessment(assessmentId: string) {
    // Note: Table handles row-level loading via loadingRowId
    startNavigation(assessmentId, `/work/assessments/${assessmentId}`);
  }
</script>

<ModernDataTable loadingRowId={loadingId} rowIdKey="id" />

<!-- ✅ CORRECT: No loading prop - table handles it -->
<ActionIconButton
  onclick={() => handleStartAssessment(row.id)}
/>
```

**Option 2: Add Custom State (NOT RECOMMENDED):**
```svelte
<script lang="ts">
  const { loadingId, startNavigation } = useNavigationLoading();
  let startingAssessment = $state<string | null>(null); // ✅ Now declared

  async function handleStartAssessment(assessmentId: string) {
    startingAssessment = assessmentId;
    try {
      startNavigation(assessmentId, `/work/assessments/${assessmentId}`);
    } finally {
      setTimeout(() => { startingAssessment = null; }, 300);
    }
  }
</script>

<!-- ✅ Works but redundant with table loading -->
<ActionIconButton
  loading={startingAssessment === row.assessment_id}
  onclick={() => handleStartAssessment(row.id)}
/>
```

**Why Option 1 is Better:**
- ✅ Simpler code (no extra state management)
- ✅ Consistent with other pages (inspections, FRC, etc.)
- ✅ Less redundancy (table already handles loading)
- ✅ Better UX (entire row highlights)
- ✅ Proper double-click prevention

---

## Troubleshooting

### Loading State Doesn't Appear

**Symptoms:**
- No visual feedback when clicking row/button
- Navigation happens but no loading animation

**Checklist:**
1. ✅ Verify `loadingRowId={loadingId}` is passed to ModernDataTable
2. ✅ Check that `rowIdKey` matches actual property name in data
3. ✅ Ensure `startNavigation()` is called (not bare `goto()`)
4. ✅ Check browser console for errors
5. ✅ Verify data items have the ID property specified in `rowIdKey`

### Double-Clicks Still Navigate Twice

**Symptoms:**
- Clicking quickly navigates to same page twice
- Browser history has duplicate entries
- Loading state shows briefly then repeats

**Solutions:**
1. ✅ Use `startNavigation()` not `goto()` directly
2. ✅ Ensure `useNavigationLoading()` is properly imported
3. ✅ Verify `loadingId` is passed to ModernDataTable
4. ✅ Check no other click handlers are calling navigation

### Loading State Doesn't Reset

**Symptoms:**
- Row stays in loading state after navigation
- Blue background and spinner persist
- Have to refresh page to clear

**Checklist:**
1. ✅ Verify navigation actually completes (check URL)
2. ✅ Check browser console for JavaScript errors
3. ✅ Ensure `$navigating` store is working (SvelteKit feature)
4. ✅ Check that 300ms timeout isn't being interrupted
5. ✅ Verify no errors in navigation target page

### Wrong Row Shows Loading

**Symptoms:**
- Different row lights up than the one clicked
- Multiple rows show loading state
- No rows show loading state

**Solution:**
Verify `rowIdKey` matches the actual property name:

```svelte
<!-- ❌ WRONG: rowIdKey doesn't match data -->
<ModernDataTable
  data={appointments}
  rowIdKey="id"  <!-- But data has "appointment_id"! -->
/>

<!-- ✅ CORRECT: rowIdKey matches data property -->
<ModernDataTable
  data={appointments}
  rowIdKey="appointment_id"
/>
```

### Button Loading Prop Has No Effect

**Symptoms:**
- `loading={true}` but button still shows icon
- Spinner never appears

**Checklist:**
1. ✅ Verify using `ActionIconButton` not regular `<button>`
2. ✅ Check that `loading` prop is actually `true` (use console.log)
3. ✅ Ensure Loader2 icon is available (from lucide-svelte)
4. ✅ Check no CSS overrides hiding the spinner
5. ✅ Verify component is latest version with loading support

---

## Technical Implementation Details

### Why Manual Store Subscription?

The `useNavigationLoading` utility uses manual store subscription instead of Svelte 5 runes because:

1. **File Type:** Utility is in `.svelte.ts` file, not `.svelte` component
2. **Auto-Subscription:** `$navigating` syntax only works in `.svelte` files
3. **Effect Context:** `$effect` requires component context to run
4. **Reliability:** Manual `subscribe()` works in utility functions

### Store Subscription Lifecycle

```typescript
export function useNavigationLoading() {
  let loadingId = $state<string | null>(null);
  let unsubscribe: (() => void) | null = null;
  let resetTimeout: ReturnType<typeof setTimeout> | null = null;

  function startNavigation(id: string, path: string) {
    if (loadingId === id) return; // Prevent double-click

    loadingId = id;

    // Clean up previous subscription
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    // Subscribe to navigation state changes
    unsubscribe = navigating.subscribe((nav) => {
      if (nav === null && loadingId) {
        // Navigation completed, reset after delay
        resetTimeout = setTimeout(() => {
          loadingId = null;
        }, 300);
      }
    });

    // Navigate
    try {
      goto(path);
    } catch (error) {
      console.error('Navigation error:', error);
      loadingId = null;
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    }
  }

  return {
    get loadingId() { return loadingId; },
    startNavigation,
    isLoading: (id: string) => loadingId === id
  };
}
```

### ModernDataTable Integration

The table component applies loading styles based on `loadingRowId`:

```svelte
<script lang="ts">
  let { loadingRowId, rowIdKey = 'id', ... } = $props();

  function getRowId(item: T): string {
    return String(item[rowIdKey]);
  }

  function isRowLoading(item: T): boolean {
    return loadingRowId !== null && getRowId(item) === loadingRowId;
  }
</script>

<tr
  class:loading-row={isRowLoading(item)}
  class:dimmed-row={loadingRowId !== null && !isRowLoading(item)}
>
  {#if isRowLoading(item)}
    <!-- Show spinner in first cell -->
  {/if}
  <!-- ... rest of row -->
</tr>
```

---

## Performance Considerations

### Memory
- Loading state is automatically cleaned up after navigation
- Store subscriptions are properly unsubscribed
- Timeouts are cleared on unmount

### CPU
- CSS animations are GPU-accelerated
- Minimal JavaScript overhead (subscribe/unsubscribe)
- No polling or intervals

### Bundle Size
- ~2KB gzipped for utility + component updates
- Leverages existing SvelteKit navigation infrastructure
- No additional dependencies

### Network
- No extra API calls
- Uses standard SvelteKit navigation
- No additional requests for loading states

---

## Pattern 6: Tab Loading States

**Status:** ✅ Newly Implemented (Nov 23, 2025)
**Scope:** In-page tab changes with async operations
**Components:**
- `src/lib/components/ui/tab-loading/TabLoadingIndicator.svelte` - Inline spinner on active tab
- `src/lib/components/ui/tab-loading/TabContentLoader.svelte` - Loading overlay for content
- `src/lib/components/ui/tab-loading/TabProgressBar.svelte` - Progress bar below tabs

### When to Use
- ✅ Assessment detail page tab changes (auto-save + data refresh)
- ✅ Tab changes that trigger async operations (500ms+)
- ✅ Filter tabs that load data from API
- ✅ Any tab switch with noticeable delay

### When NOT to Use
- ❌ Instant client-side filter tabs (<200ms)
- ❌ Tabs that only show/hide content (no async work)
- ❌ Navigation to different pages (use Pattern 1 instead)

### Implementation Example (Assessment Detail Page)

```svelte
<script lang="ts">
  import AssessmentLayout from '$lib/components/assessment/AssessmentLayout.svelte';
  import { assessmentService } from '$lib/services/assessment.service';

  let currentTab = $state('identification');
  let tabLoading = $state(false);
  let saving = $state(false);

  // Store references to tab save functions
  let estimateTabSaveFn: (() => Promise<void>) | null = null;
  let tyresTabSaveFn: (() => Promise<void>) | null = null;

  async function handleTabChange(tabId: string) {
    // Prevent concurrent tab changes
    if (tabLoading || currentTab === tabId) return;

    tabLoading = true;
    try {
      // Auto-save current tab if leaving it
      if (currentTab === 'estimate' && estimateTabSaveFn) {
        await estimateTabSaveFn();
      } else if (currentTab === 'tyres' && tyresTabSaveFn) {
        await tyresTabSaveFn();
      }

      // Global save
      await handleSave();

      // Refresh notes from database
      const updatedNotes = await assessmentNotesService.getNotesByAssessment(
        data.assessment.id
      );
      data.notes = updatedNotes;

      // Update current tab
      currentTab = tabId;
      await assessmentService.updateCurrentTab(data.assessment.id, tabId);
    } catch (error) {
      console.error('Error changing tab:', error);
    } finally {
      tabLoading = false;
    }
  }
</script>

<AssessmentLayout
  assessment={data.assessment}
  bind:currentTab
  onTabChange={handleTabChange}
  {saving}
  {tabLoading}
  ...
>
  <!-- Tab content -->
</AssessmentLayout>
```

### AssessmentLayout Integration

```svelte
<script lang="ts">
  import { TabLoadingIndicator } from '$lib/components/ui/tab-loading';
  import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';

  interface Props {
    currentTab: string;
    onTabChange: (tabId: string) => void;
    tabLoading?: boolean;
    // ... other props
  }

  let { currentTab, onTabChange, tabLoading = false, ... }: Props = $props();
</script>

<Tabs bind:value={currentTab} onValueChange={onTabChange}>
  <TabsList>
    {#each tabs() as tab}
      <TabsTrigger
        value={tab.id}
        disabled={tabLoading}
        class="..."
      >
        <TabLoadingIndicator
          isLoading={tabLoading && currentTab === tab.id}
          icon={tab.icon}
        />
        <span>{tab.label}</span>
      </TabsTrigger>
    {/each}
  </TabsList>
</Tabs>
```

### Component APIs

#### TabLoadingIndicator

```typescript
interface TabLoadingIndicatorProps {
  isLoading?: boolean;  // Show spinner instead of icon
  icon?: Component;     // Lucide icon to show when not loading
  class?: string;       // Additional CSS classes
}
```

**Visual Behavior:**
- Shows `Loader2` spinner with `animate-spin` when loading
- Shows provided icon when not loading
- Responsive sizing: `h-3 w-3` on mobile, `h-4 w-4` on desktop

#### TabContentLoader

```typescript
interface TabContentLoaderProps {
  loading?: boolean;   // Show/hide overlay
  message?: string;    // Text below spinner (default: "Loading...")
  class?: string;      // Additional CSS classes
}
```

**Visual Behavior:**
- Absolute positioned overlay over tab content
- Semi-transparent white background with backdrop blur
- Centered spinner + message
- `role="status"` and `aria-busy` for accessibility

#### TabProgressBar

```typescript
interface TabProgressBarProps {
  loading?: boolean;  // Show/hide progress bar
  class?: string;     // Additional CSS classes
}
```

**Visual Behavior:**
- Thin bar (h-1) below TabsList
- Rose-100 background with rose-500 animated progress
- Pulse animation for indeterminate progress

### Best Practices

1. **Always Use try/finally:**
   ```typescript
   tabLoading = true;
   try {
     // Async operations
   } finally {
     tabLoading = false; // Always reset
   }
   ```

2. **Prevent Concurrent Changes:**
   ```typescript
   if (tabLoading || currentTab === tabId) return;
   ```

3. **Disable All Tabs During Loading:**
   ```svelte
   <TabsTrigger disabled={tabLoading} />
   ```

4. **Show Spinner Only on Active Tab:**
   ```svelte
   <TabLoadingIndicator
     isLoading={tabLoading && currentTab === tab.id}
   />
   ```

### Pages Using This Pattern

**Reference Implementations:**
- ✅ `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte` - Assessment detail tabs

**Potential Future Use:**
- ⏳ Filter tabs on list pages (if async filtering added)
- ⏳ Settings pages with tab-based sections
- ⏳ Dashboard with data-loading tabs

---

## Accessibility

**Current State:**
- ✅ Loading state is visual
- ✅ Disabled row clicks prevent double-submission
- ✅ Spinner uses inline SVG (visible to screen readers)
- ✅ Color contrast meets WCAG AA standards
- ✅ Tab loading uses `role="status"` and `aria-busy` (NEW: Nov 23, 2025)
- ✅ Tabs disabled during loading with `disabled` attribute (NEW: Nov 23, 2025)

**Future Enhancements:**
- ⏳ Add `aria-busy="true"` to loading rows
- ⏳ Add `aria-label` describing loading state
- ⏳ Announce navigation start/completion to screen readers
- ⏳ Add keyboard shortcuts for navigation

---

## Pattern 7: Navigation Loading Modal

**Status:** ✅ Fully Implemented (Nov 23, 2025)
**Scope:** Global - automatic for all page navigations
**Location:** `src/lib/components/layout/NavigationLoadingModal.svelte`
**Component:** `NavigationLoadingModal` (shadcn-svelte Spinner)

### Description
A full-screen modal overlay with centered spinner that appears during all SvelteKit page navigations. Provides highly visible loading feedback, especially useful when the thin navigation bar is too subtle or when prefetching makes navigation appear instant.

### When to Use
- ✅ Automatic for all sidebar navigation clicks
- ✅ Automatic for all page-to-page navigation
- ✅ Works alongside Pattern 1 (Global Navigation Bar)
- ✅ Provides clear visual feedback on slow networks
- ✅ Prevents accidental double-clicks during navigation

### Implementation

#### Component Structure
```svelte
<!-- src/lib/components/layout/NavigationLoadingModal.svelte -->
<script lang="ts">
  import { navigating } from '$app/stores';
  import { Spinner } from '$lib/components/ui/spinner';

  const isNavigating = $derived($navigating !== null);
</script>

{#if isNavigating}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
    role="status"
    aria-busy="true"
    aria-label="Loading page"
  >
    <div class="flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow-lg animate-in zoom-in-95 duration-200">
      <Spinner class="size-8 text-rose-500" />
      <p class="text-sm font-medium text-gray-700">Loading...</p>
    </div>
  </div>
{/if}
```

#### Integration (Root Layout)
```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import NavigationLoadingBar from '$lib/components/layout/NavigationLoadingBar.svelte';
  import NavigationLoadingModal from '$lib/components/layout/NavigationLoadingModal.svelte';
</script>

<NavigationLoadingBar />
<NavigationLoadingModal />

{@render children?.()}
```

### Features
- **Automatic Detection** - Uses SvelteKit's `$navigating` store
- **Highly Visible** - Full-screen overlay with backdrop blur
- **Professional Appearance** - Centered white card with rose spinner
- **Smooth Animations** - Fade-in and zoom-in effects
- **Accessible** - Proper ARIA attributes (role="status", aria-busy, aria-label)
- **Non-Blocking** - Doesn't prevent browser back button
- **Works with Prefetching** - Shows even on fast navigations

### Styling
```css
/* Modal overlay */
fixed inset-0 z-50 flex items-center justify-center
bg-black/20 backdrop-blur-sm
animate-in fade-in duration-200

/* Modal card */
flex flex-col items-center gap-4
rounded-lg bg-white p-8 shadow-lg
animate-in zoom-in-95 duration-200

/* Spinner */
size-8 text-rose-500 animate-spin

/* Loading text */
text-sm font-medium text-gray-700
```

### Comparison with Pattern 1

| Aspect | Pattern 1 (Nav Bar) | Pattern 7 (Modal) |
|--------|---------------------|-------------------|
| Visibility | ⭐ (Thin bar) | ⭐⭐⭐⭐⭐ (Full screen) |
| Intrusiveness | Low | Medium |
| Use Case | Subtle feedback | Clear feedback |
| Blocks Interaction | No | Yes (overlay) |
| Best For | Fast navigation | Slow networks |

### Usage Across ClaimTech

#### Sidebar Navigation (15 Links)
- Dashboard → `/dashboard`
- All Clients → `/clients`
- New Requests → `/requests`
- Inspections → `/work/inspections`
- Appointments → `/work/appointments`
- Open Assessments → `/work/assessments`
- Finalized Assessments → `/work/finalized-assessments`
- FRC → `/work/frc`
- Additionals → `/work/additionals`
- Archive → `/work/archive`
- All Engineers → `/engineers`
- New Engineer → `/engineers/new`
- All Repairers → `/repairers`
- Company Settings → `/settings`

All sidebar navigation automatically shows the modal during page transitions.

### Accessibility
```svelte
<div
  role="status"
  aria-busy="true"
  aria-label="Loading page"
>
  <Spinner aria-label="Loading" />
  <p>Loading...</p>
</div>
```

- **Screen Reader Announcement** - "Loading page" when modal appears
- **ARIA Attributes** - Proper role and aria-busy state
- **Keyboard Navigation** - Doesn't trap focus, allows Escape
- **Visual Feedback** - High contrast spinner and text

### Testing Checklist
- [ ] Modal appears when clicking sidebar links
- [ ] Modal disappears when page loads
- [ ] Works on all 15 sidebar navigation items
- [ ] Works on slow networks (DevTools throttle)
- [ ] Accessible (screen reader announces loading)
- [ ] No performance regression
- [ ] Smooth animations (fade-in, zoom-in)
- [ ] Professional appearance

### Dependencies
- **shadcn-svelte Spinner** - `src/lib/components/ui/spinner/spinner.svelte`
- **SvelteKit $navigating store** - Automatic navigation tracking
- **Lucide Icons** - Loader2 icon for spinner
- **Tailwind CSS** - Styling and animations

### Installation
```bash
# Install spinner component (if not already installed)
npx shadcn-svelte@latest add spinner
```

### Best Practices
1. **Use alongside Pattern 1** - Both can coexist for redundant feedback
2. **Don't customize per-page** - Keep consistent across all navigation
3. **Test on slow networks** - Use DevTools throttle to verify visibility
4. **Maintain accessibility** - Keep ARIA attributes intact
5. **Keep animations smooth** - Use GPU-accelerated CSS animations

### Future Enhancements
- ⏳ Add configurable delay (only show if navigation takes >500ms)
- ⏳ Add progress percentage for long navigations
- ⏳ Add cancel button for slow navigations
- ⏳ Add custom loading messages per route

---

## Related Documentation

- **[navigation_based_state_transitions.md](../SOP/navigation_based_state_transitions.md)** - Server-side state changes during navigation
- **[creating-components.md](../SOP/creating-components.md)** - ActionIconButton component API
- **[table_utilities.md](./table_utilities.md)** - Table formatting and utility functions
- **[project_architecture.md](./project_architecture.md)** - Overall system architecture

---

## Reference Files

### Source Code
- `src/lib/utils/useNavigationLoading.svelte.ts` - Loading utility implementation
- `src/lib/components/layout/NavigationLoadingBar.svelte` - Global progress bar
- `src/lib/components/layout/NavigationLoadingModal.svelte` - Navigation modal overlay (NEW: Nov 23, 2025)
- `src/lib/components/data/ModernDataTable.svelte` - Table component with loading support
- `src/lib/components/ui/ActionIconButton.svelte` - Button with loading prop
- `src/lib/components/ui/button/LoadingButton.svelte` - Button with spinner (NEW: Jan 30, 2025)
- `src/lib/components/forms/FormActions.svelte` - Form actions with loading support
- `src/lib/components/ui/save-indicator/SaveIndicator.svelte` - Auto-save indicator (NEW: Jan 30, 2025)
- `src/lib/components/ui/skeleton/skeleton.svelte` - Base skeleton component
- `src/lib/components/ui/skeleton/SkeletonCard.svelte` - Card skeleton (NEW: Jan 30, 2025)
- `src/lib/components/ui/spinner/spinner.svelte` - Spinner component (NEW: Nov 23, 2025)
- `src/lib/components/ui/tab-loading/TabLoadingIndicator.svelte` - Tab inline spinner (NEW: Nov 23, 2025)
- `src/lib/components/ui/tab-loading/TabContentLoader.svelte` - Tab content overlay (NEW: Nov 23, 2025)
- `src/lib/components/ui/tab-loading/TabProgressBar.svelte` - Tab progress bar (NEW: Nov 23, 2025)

### Historical Documentation
- `LOADING_PATTERNS_GUIDE.md` (root) - Original comprehensive guide
- `LOADING_ANIMATIONS_DEPLOYMENT.md` (root) - Deployment history
- `LOADING_ANIMATIONS_TESTING.md` (root) - Testing procedures
- `LOADING_ANIMATIONS_FIXES.md` (root) - Technical fixes log

---

## Pattern 8: Document Loading Progress

**Status:** ✅ Fully Implemented (Nov 23, 2025)
**Scope:** Document generation and file uploads
**Location:** `src/lib/components/ui/progress/`

### Description

Reusable progress components for document generation (reports, estimates, PDFs) and file uploads (photos, PDFs, generic files). Uses shadcn-svelte Progress component with rose theme for consistency.

### Components

#### 1. DocumentProgressBar.svelte
**Purpose:** Reusable progress bar with status icon
**Props:**
- `value?: number` - Progress 0-100
- `status?: 'pending' | 'processing' | 'success' | 'error'`
- `label?: string` - Progress label
- `showPercentage?: boolean` - Show % text
- `class?: string` - Additional CSS classes

**Features:**
- Status icons: Clock (pending), Spinner (processing), CheckCircle (success), AlertCircle (error)
- Animated spinner during processing
- Rose theme background (`bg-rose-100`, `bg-green-100`, `bg-red-100`)
- Responsive and accessible

**Usage:**
```svelte
<DocumentProgressBar
  value={progress}
  status="processing"
  label="Assessment Report"
  showPercentage={true}
/>
```

#### 2. FileUploadProgress.svelte
**Purpose:** Two-phase progress (compression + upload)
**Props:**
- `compressionProgress?: number` - Compression 0-100
- `uploadProgress?: number` - Upload 0-100
- `isCompressing?: boolean` - Compression phase
- `isUploading?: boolean` - Upload phase
- `fileName?: string` - File name
- `class?: string` - Additional CSS classes

**Features:**
- Shows compression phase with progress
- Shows upload phase with progress
- Animated spinner
- Rose theme styling
- Displays file name

**Usage:**
```svelte
<FileUploadProgress
  isCompressing={compressing}
  isUploading={uploading}
  compressionProgress={compressionProgress}
  uploadProgress={uploadProgress}
  fileName={file?.name}
/>
```

#### 3. DocumentLoadingModal.svelte
**Purpose:** Full-screen modal for document generation
**Props:**
- `isOpen?: boolean` - Show/hide modal
- `title?: string` - Modal title
- `progress?: number` - Progress 0-100
- `message?: string` - Status message
- `isError?: boolean` - Error state

**Features:**
- Full-screen overlay with backdrop blur
- Centered white card
- Large spinner (size-8)
- Progress bar with rose theme
- Error state with alert icon
- Smooth animations

**Usage:**
```svelte
<DocumentLoadingModal
  isOpen={generating}
  title="Generating Documents"
  progress={overallProgress}
  message={statusMessage}
  isError={hasError}
/>
```

### Updated Components

#### DocumentGenerationProgress.svelte
- **Change:** Replaced custom progress bars with shadcn Progress
- **Theme:** Rose (`bg-rose-100`, `bg-green-100`, `bg-red-100`)
- **Status:** ✅ Updated Nov 23, 2025

#### FileDropzone.svelte
- **Change:** Replaced custom progress bar with shadcn Progress
- **Theme:** Rose (`bg-rose-100`)
- **Status:** ✅ Updated Nov 23, 2025

#### PhotoUpload.svelte
- **Change:** Replaced custom progress display with FileUploadProgress component
- **Theme:** Rose theme
- **Status:** ✅ Updated Nov 23, 2025

#### PdfUpload.svelte
- **Change:** Replaced custom progress bar with shadcn Progress
- **Theme:** Rose (`bg-rose-100`)
- **Status:** ✅ Updated Nov 23, 2025

### Styling & Theme

**Rose Theme (App Primary):**
```css
bg-rose-100    /* Progress background */
bg-rose-500    /* Progress fill */
text-rose-500  /* Status text */
```

**Status Colors:**
```css
text-rose-500    /* Processing */
text-green-500   /* Success */
text-red-500     /* Error */
text-gray-400    /* Pending */
```

**Size Variants:**
```svelte
<!-- Large -->
<Progress value={50} class="h-3 bg-rose-100" />

<!-- Normal (default) -->
<Progress value={50} class="bg-rose-100" />

<!-- Small -->
<Progress value={50} class="h-1 bg-rose-100" />
```

### Implementation Details

**Document Generation Flow:**
1. User clicks "Generate Documents" button
2. DocumentLoadingModal appears with 0% progress
3. Service streams progress via SSE
4. Modal updates with progress and message
5. On completion, modal closes and documents available

**File Upload Flow:**
1. User selects file
2. FileUploadProgress shows compression phase
3. After compression, shows upload phase
4. On completion, file saved to storage
5. Parent component receives URL

### Best Practices

1. **Use DocumentProgressBar** for per-document progress tracking
2. **Use FileUploadProgress** for two-phase uploads (compression + upload)
3. **Use DocumentLoadingModal** for full-screen document generation
4. **Always provide meaningful messages** for user feedback
5. **Use rose theme** for consistency with app branding
6. **Show percentage** for transparency on long operations

### Testing Checklist

- [ ] Document generation shows progress 0-100%
- [ ] File upload shows compression then upload phases
- [ ] Progress bars use rose theme
- [ ] Status icons animate during processing
- [ ] Error state displays correctly
- [ ] Modal closes on completion
- [ ] All 4 document types tracked separately
- [ ] Photo compression + upload tracked separately
- [ ] PDF upload shows progress
- [ ] File dropzone shows progress

### Related Files

**Components:**
- `src/lib/components/ui/progress/DocumentProgressBar.svelte`
- `src/lib/components/ui/progress/FileUploadProgress.svelte`
- `src/lib/components/layout/DocumentLoadingModal.svelte`
- `src/lib/components/ui/progress/index.ts` - Exports

**Updated Components:**
- `src/lib/components/assessment/DocumentGenerationProgress.svelte`
- `src/lib/components/ui/file-dropzone/FileDropzone.svelte`
- `src/lib/components/forms/PhotoUpload.svelte`
- `src/lib/components/forms/PdfUpload.svelte`

**Services:**
- `src/lib/services/document-generation.service.ts` - Document generation with SSE
- `src/lib/services/storage.service.ts` - File uploads with progress callbacks

---

**Document Version:** 1.4
**Last Reviewed:** November 23, 2025
**Changes:** Added Pattern 8 (Document Loading Progress) with 3 reusable components and updated 4 existing components to use shadcn-svelte Progress
**Next Review:** December 2025 or when patterns change
