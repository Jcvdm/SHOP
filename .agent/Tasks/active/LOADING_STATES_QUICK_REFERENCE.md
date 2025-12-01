# Loading States Implementation - Quick Reference Guide

**Created**: November 23, 2025
**Purpose**: Fast lookup for implementing loading states
**Related**: LOADING_STATES_IMPLEMENTATION_PDR.md

---

## Quick Decision Tree

```
Is the action a navigation to another page?
├─ YES → Use Pattern 2: Table Row Loading (useNavigationLoading)
│        Already implemented on all 7 list pages ✅
│
└─ NO → Is it a form submission?
         ├─ YES → Use FormActions with loading prop
         │        Component: FormActions.svelte
         │        Pattern: <FormActions loading={loading} ... />
         │
         └─ NO → Is it a modal action?
                  ├─ YES → Use LoadingButton
                  │        Component: LoadingButton.svelte
                  │        Pattern: <LoadingButton loading={loading} onclick={handler}>
                  │
                  └─ NO → Is it a silent auto-save?
                           └─ YES → Use SaveIndicator
                                    Component: SaveIndicator.svelte (to be created)
                                    Pattern: <SaveIndicator saving={saving} saved={saved} />
```

---

## Pattern A: Form Submission Loading

**When to Use**: Any form with submit button (New Request, New Client, Edit forms)

**Implementation**:
```svelte
<script lang="ts">
  let loading = $state(false);
  
  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    try {
      await service.create(formData);
      goto('/success');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      loading = false;
    }
  }
</script>

<form onsubmit={handleSubmit}>
  <!-- form fields -->
  <FormActions primaryLabel="Submit" loading={loading} onCancel={handleCancel} />
</form>
```

**Files Using This Pattern**:
- `src/routes/(app)/requests/new/+page.svelte`
- `src/routes/(app)/clients/new/+page.svelte`
- `src/routes/(app)/clients/[id]/edit/+page.svelte`
- `src/routes/(app)/repairers/new/+page.svelte`

---

## Pattern B: Modal Action Loading

**When to Use**: Any modal with confirm/submit button (Appoint Engineer, Create Appointment)

**Implementation**:
```svelte
<script lang="ts">
  import LoadingButton from '$lib/components/ui/button/LoadingButton.svelte';
  
  let loading = $state(false);
  let showModal = $state(false);
  
  async function handleConfirm() {
    loading = true;
    try {
      await service.performAction();
      showModal = false;
    } catch (error) {
      console.error('Error:', error);
    } finally {
      loading = false;
    }
  }
</script>

<Dialog bind:open={showModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
    </DialogHeader>
    <!-- modal content -->
    <DialogFooter>
      <Button variant="outline" onclick={() => showModal = false}>Cancel</Button>
      <LoadingButton loading={loading} onclick={handleConfirm}>Confirm</LoadingButton>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Files Using This Pattern**:
- `src/routes/(app)/work/inspections/[id]/+page.svelte` (2 modals)
- `src/routes/(app)/requests/new/+page.svelte` (Quick Add Client)
- `src/lib/components/assessment/RatesAndRepairerConfiguration.svelte` (Quick Add Repairer)

---

## Pattern C: Silent Auto-Save with Indicator

**When to Use**: Assessment tabs with auto-save (Vehicle ID, 360 Exterior)

**Implementation**:
```svelte
<script lang="ts">
  import SaveIndicator from '$lib/components/ui/SaveIndicator.svelte';
  
  let saving = $state(false);
  let saved = $state(false);
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  
  function handleChange() {
    saved = false;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      saving = true;
      try {
        await service.update(data);
        saved = true;
        setTimeout(() => saved = false, 2000);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        saving = false;
      }
    }, 1000);
  }
</script>

<div class="flex items-center justify-between">
  <input onchange={handleChange} />
  <SaveIndicator {saving} {saved} />
</div>
```

**Files Using This Pattern**:
- `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte` (Vehicle ID, 360 Exterior)

---

## Pattern D: Action Button with Per-Row Loading

**When to Use**: Table actions like Generate PDF, Delete (already implemented)

**Implementation**:
```svelte
<script lang="ts">
  import ActionIconButton from '$lib/components/data/ActionIconButton.svelte';
  import { FileDown } from 'lucide-svelte';
  
  let generatingPdf = $state<string | null>(null);
  
  async function handleGeneratePdf(recordId: string) {
    generatingPdf = recordId;
    try {
      await fetch(`/api/pdf/${recordId}`, { method: 'POST' });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      generatingPdf = null;
    }
  }
</script>

{#each records as record}
  <ActionIconButton
    icon={FileDown}
    label="Generate PDF"
    onclick={() => handleGeneratePdf(record.id)}
    loading={generatingPdf === record.id}
  />
{/each}
```

**Status**: ✅ Already implemented across the app

---

## Component Import Paths

```typescript
// Existing components
import LoadingButton from '$lib/components/ui/button/LoadingButton.svelte';
import ActionIconButton from '$lib/components/data/ActionIconButton.svelte';
import FormActions from '$lib/components/forms/FormActions.svelte';
import { Skeleton } from '$lib/components/ui/skeleton';

// To be created
import SaveIndicator from '$lib/components/ui/SaveIndicator.svelte';
import SkeletonCard from '$lib/components/ui/SkeletonCard.svelte';

// Icons
import { Loader2, CheckCircle } from 'lucide-svelte';
```

---

## Common Mistakes to Avoid

❌ **Forgetting finally block**
```svelte
async function handleSubmit() {
  loading = true;
  await service.create(data);
  loading = false; // ❌ Won't run if error occurs
}
```

✅ **Always use try/finally**
```svelte
async function handleSubmit() {
  loading = true;
  try {
    await service.create(data);
  } finally {
    loading = false; // ✅ Always runs
  }
}
```

---

❌ **Single loading state for multiple actions**
```svelte
let loading = $state(false); // ❌ Ambiguous
```

✅ **Specific loading states**
```svelte
let generatingPdf = $state<string | null>(null);
let deletingRecord = $state<string | null>(null);
```

---

## Testing Checklist

For each implementation:
- [ ] Loading state appears immediately on action
- [ ] Loading state shows spinner/indicator
- [ ] Button/form is disabled during loading
- [ ] Loading state resets on success
- [ ] Loading state resets on error
- [ ] No console errors during loading
- [ ] User cannot trigger action twice

---

**Quick Links**:
- Full PDR: `.agent/Tasks/active/LOADING_STATES_IMPLEMENTATION_PDR.md`
- System Docs: `.agent/System/ui_loading_patterns.md`
- Task List: Use `view_tasklist` command

