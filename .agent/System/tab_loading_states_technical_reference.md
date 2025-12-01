# Tab Loading States - Technical Reference

**Last Updated**: November 23, 2025
**Status**: Context Gathering Complete
**Related**: [ui_loading_patterns.md](./ui_loading_patterns.md), [photo_compression_implementation.md](./photo_compression_implementation.md)

---

## Current Tab Implementation

### AssessmentLayout.svelte Structure
```svelte
<Tabs bind:value={currentTab} onValueChange={(value) => onTabChange(value)}>
  <TabsList class="grid h-auto w-full grid-cols-2 gap-1.5 bg-transparent p-0">
    {#each tabs() as tab}
      <TabsTrigger value={tab.id} class="...data-[state=active]:bg-rose-500...">
        {#if tab.icon}
          <Icon class="h-4 w-4" />
        {/if}
        <span>{tab.label}</span>
        {#if missingCount > 0}
          <Badge>{missingCount}</Badge>
        {/if}
      </TabsTrigger>
    {/each}
  </TabsList>
</Tabs>
```

### Tab Change Flow
1. User clicks `TabsTrigger`
2. `onValueChange` fires → calls `onTabChange(tabId)`
3. Parent `handleTabChange()` executes:
   - Auto-save current tab (if dirty)
   - Call `handleSave()` (global save)
   - Refresh notes from DB
   - Update current tab
   - Save tab preference to DB

**Duration**: 500ms - 2s (varies by data size)

---

## Shadcn-Svelte Components Available

### Progress Component
```svelte
<script>
  import { Progress } from "$lib/components/ui/progress";
  let value = $state(50);
</script>
<Progress {value} max={100} class="w-[60%]" />
```

### Spinner Component
```svelte
<script>
  import { Spinner } from "$lib/components/ui/spinner";
</script>
<Spinner />
<Spinner class="size-6 text-rose-500" />
```

---

## Implementation Options

### Option 1: Inline Spinner on Active Tab
**Pros**: Minimal UI change, clear feedback
**Cons**: Small space, might be missed
**Location**: Inside active TabsTrigger
**Code**:
```svelte
{#if isLoadingTab(tab.id)}
  <Spinner class="size-3 text-white" />
{:else if tab.icon}
  <Icon class="h-4 w-4" />
{/if}
```

### Option 2: Loading Overlay
**Pros**: Clear, prominent, professional
**Cons**: Covers content, might feel heavy
**Location**: Above tab content
**Code**:
```svelte
{#if tabLoading}
  <div class="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
    <Spinner class="size-6 text-rose-500" />
  </div>
{/if}
```

### Option 3: Progress Bar Below Tabs
**Pros**: Subtle, non-intrusive, familiar pattern
**Cons**: Might be missed if small
**Location**: Below TabsList
**Code**:
```svelte
{#if tabLoading}
  <div class="h-1 bg-rose-100">
    <div class="h-full w-1/3 bg-rose-500 animate-pulse"></div>
  </div>
{/if}
```

---

## State Management Pattern

### In +page.svelte
```typescript
let tabLoading = $state(false);

async function handleTabChange(tabId: string) {
  tabLoading = true;
  try {
    // Auto-save logic
    // Refresh notes
    // Update tab
  } finally {
    tabLoading = false;
  }
}
```

### Pass to AssessmentLayout
```svelte
<AssessmentLayout
  {tabLoading}
  onTabChange={handleTabChange}
  ...
/>
```

---

## Styling Reference

### Rose Theme Colors
- `bg-rose-500` - Primary action
- `bg-rose-50` - Light background
- `text-rose-500` - Text
- `border-rose-200` - Borders

### Disabled State
```css
opacity-50
pointer-events-none
cursor-not-allowed
```

### Animation Classes
```css
animate-spin (Spinner)
animate-pulse (Progress)
transition-all (Smooth changes)
```

---

## Files to Create/Modify

### New Components
- `src/lib/components/ui/tab-loading/TabLoadingIndicator.svelte`
- `src/lib/components/ui/tab-loading/TabContentLoader.svelte`

### Modify Existing
- `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte`
- `src/lib/components/assessment/AssessmentLayout.svelte`
- `.agent/System/ui_loading_patterns.md` (add Pattern 6)

---

## Import Paths

```typescript
import { Progress } from '$lib/components/ui/progress';
import { Spinner } from '$lib/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
```

---

## Testing Checklist

- [ ] Tab click shows loading indicator
- [ ] Indicator disappears when tab loads
- [ ] Multiple rapid clicks don't break state
- [ ] Works on all 10+ assessment tabs
- [ ] Works on filter tabs (requests, additionals, frc)
- [ ] Mobile responsive (small screens)
- [ ] Keyboard navigation still works
- [ ] Accessibility (aria-busy, role="status")

