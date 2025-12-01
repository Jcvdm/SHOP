# Navigation Loading States - Technical Reference

**Date:** November 23, 2025  
**Status:** Context Complete

---

## Current Implementation

### NavigationLoadingBar.svelte (Existing)
```svelte
<script lang="ts">
  import { navigating } from '$app/stores';
  const isNavigating = $derived($navigating !== null);
</script>

{#if isNavigating}
  <div class="fixed top-0 left-0 right-0 h-1 z-50 overflow-hidden">
    <div class="h-full w-full bg-gradient-to-r from-transparent via-blue-600 to-transparent animate-loading-bar"></div>
  </div>
{/if}
```

**Problem:** Too subtle - users don't notice it

---

## Proposed: NavigationLoadingModal.svelte

```svelte
<script lang="ts">
  import { navigating } from '$app/stores';
  import { Spinner } from '$lib/components/ui/spinner';
  
  const isNavigating = $derived($navigating !== null);
</script>

{#if isNavigating}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
    <div class="flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow-lg">
      <Spinner class="size-8 text-rose-500" />
      <p class="text-sm font-medium text-gray-700">Loading...</p>
    </div>
  </div>
{/if}
```

---

## Sidebar Navigation Structure

### Current Links (15 total)
```typescript
const allNavigation = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'All Clients', href: '/clients', icon: Users },
  { label: 'New Requests', href: '/requests', icon: FileText },
  { label: 'Inspections', href: '/work/inspections', icon: ClipboardCheck },
  { label: 'Appointments', href: '/work/appointments', icon: Calendar },
  { label: 'Open Assessments', href: '/work/assessments', icon: ClipboardList },
  { label: 'Finalized Assessments', href: '/work/finalized-assessments', icon: FileCheck },
  { label: 'FRC', href: '/work/frc', icon: FileCheck },
  { label: 'Additionals', href: '/work/additionals', icon: Plus },
  { label: 'Archive', href: '/work/archive', icon: Archive },
  { label: 'All Engineers', href: '/engineers', icon: Users },
  { label: 'New Engineer', href: '/engineers/new', icon: UserPlus },
  { label: 'All Repairers', href: '/repairers', icon: Wrench },
  { label: 'Company Settings', href: '/settings', icon: Settings }
];
```

### Navigation Rendering
```svelte
{#each group.items as item}
  <SidebarMenuItem>
    <SidebarMenuButton isActive={isActive(item.href)}>
      {#snippet child({ props })}
        <a href={item.href} {...props}>
          <item.icon />
          <span>{item.label}</span>
          <!-- Badges for counts -->
        </a>
      {/snippet}
    </SidebarMenuButton>
  </SidebarMenuItem>
{/each}
```

---

## Spinner Component (shadcn-svelte)

### Installation
```bash
npx shadcn-svelte@latest add spinner
```

### Usage
```svelte
import { Spinner } from '$lib/components/ui/spinner';

<!-- Default -->
<Spinner />

<!-- Sizes -->
<Spinner class="size-3" />
<Spinner class="size-4" />
<Spinner class="size-6" />
<Spinner class="size-8" />

<!-- Colors -->
<Spinner class="size-6 text-rose-500" />
<Spinner class="size-6 text-blue-500" />
```

### Implementation
```svelte
<script lang="ts">
  import { cn } from '$lib/utils';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  
  let { class: className, ...restProps } = $props();
</script>

<LoaderIcon
  role="status"
  aria-label="Loading"
  class={cn('size-4 animate-spin', className)}
  {...restProps}
/>
```

---

## Integration Points

### Root Layout (+layout.svelte)
```svelte
<script lang="ts">
  import NavigationLoadingBar from '$lib/components/layout/NavigationLoadingBar.svelte';
  import NavigationLoadingModal from '$lib/components/layout/NavigationLoadingModal.svelte';
</script>

<NavigationLoadingBar />
<NavigationLoadingModal />
{@render children?.()}
```

### App Layout ((app)/+layout.svelte)
- Already has SidebarProvider
- Navigation links are in Sidebar component
- Modal will work globally

---

## $navigating Store

### What it provides
```typescript
$navigating: {
  from: { route: { id: string }, url: URL },
  to: { route: { id: string }, url: URL },
  type: 'link' | 'popstate' | 'goto'
} | null
```

### When it changes
- `null` → object: Navigation starts
- object → `null`: Navigation completes
- Automatically managed by SvelteKit

### Usage
```svelte
import { navigating } from '$app/stores';

const isNavigating = $derived($navigating !== null);
```

---

## Styling Options

### Option 1: Centered Modal (RECOMMENDED)
- Full-screen semi-transparent overlay
- Centered white card with spinner
- Professional, very visible
- Blocks interaction

### Option 2: Corner Indicator
- Small spinner in corner
- Less intrusive
- Still visible
- Doesn't block interaction

### Option 3: Sidebar Button Loading
- Spinner on active sidebar item
- Shows which page is loading
- Subtle but effective
- Good for fast navigation

---

## Performance Considerations

- Modal appears instantly (no delay)
- Spinner uses CSS animation (GPU-accelerated)
- No JavaScript overhead
- Works with prefetching
- Dismisses automatically when navigation completes

