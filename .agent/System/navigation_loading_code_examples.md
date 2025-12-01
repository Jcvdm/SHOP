# Navigation Loading States - Code Examples

**Date:** November 23, 2025

---

## Example 1: NavigationLoadingModal.svelte (To Create)

```svelte
<script lang="ts">
  import { navigating } from '$app/stores';
  import { Spinner } from '$lib/components/ui/spinner';
  
  const isNavigating = $derived($navigating !== null);
</script>

{#if isNavigating}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
    role="status"
    aria-busy="true"
    aria-label="Loading page"
  >
    <div class="flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow-lg">
      <Spinner class="size-8 text-rose-500" />
      <p class="text-sm font-medium text-gray-700">Loading...</p>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    overflow: hidden;
  }
</style>
```

---

## Example 2: Root Layout Integration

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import NavigationLoadingBar from '$lib/components/layout/NavigationLoadingBar.svelte';
  import NavigationLoadingModal from '$lib/components/layout/NavigationLoadingModal.svelte';
  import { SidebarProvider } from '$lib/components/ui/sidebar';
  
  let { children } = $props();
</script>

<NavigationLoadingBar />
<NavigationLoadingModal />

<SidebarProvider>
  {@render children?.()}
</SidebarProvider>
```

---

## Example 3: Sidebar with Loading (Optional)

```svelte
<!-- src/lib/components/layout/Sidebar.svelte -->
<script lang="ts">
  import { navigating } from '$app/stores';
  import { Spinner } from '$lib/components/ui/spinner';
  
  let loadingHref: string | null = $state(null);
  
  $effect(() => {
    if ($navigating) {
      loadingHref = $navigating.to?.url.pathname ?? null;
    } else {
      loadingHref = null;
    }
  });
  
  function isLoading(href: string): boolean {
    return loadingHref === href;
  }
</script>

{#each group.items as item}
  <SidebarMenuItem>
    <SidebarMenuButton 
      isActive={isActive(item.href)}
      disabled={loadingHref !== null}
    >
      {#snippet child({ props })}
        <a href={item.href} {...props}>
          {#if isLoading(item.href)}
            <Spinner class="size-4 text-rose-500" />
          {:else if item.icon}
            <item.icon />
          {/if}
          <span>{item.label}</span>
        </a>
      {/snippet}
    </SidebarMenuButton>
  </SidebarMenuItem>
{/each}
```

---

## Example 4: Using $navigating Store

```svelte
<script lang="ts">
  import { navigating } from '$app/stores';
  
  // Reactive derived value
  const isNavigating = $derived($navigating !== null);
  
  // Access navigation details
  const fromPath = $derived($navigating?.from?.url.pathname);
  const toPath = $derived($navigating?.to?.url.pathname);
  const navigationType = $derived($navigating?.type); // 'link' | 'popstate' | 'goto'
</script>

{#if isNavigating}
  <p>Navigating from {fromPath} to {toPath}</p>
{/if}
```

---

## Example 5: Spinner Component Usage

```svelte
<script lang="ts">
  import { Spinner } from '$lib/components/ui/spinner';
</script>

<!-- Default -->
<Spinner />

<!-- Different sizes -->
<Spinner class="size-3" />
<Spinner class="size-4" />
<Spinner class="size-6" />
<Spinner class="size-8" />

<!-- Different colors -->
<Spinner class="size-6 text-rose-500" />
<Spinner class="size-6 text-blue-500" />
<Spinner class="size-6 text-green-500" />

<!-- In button -->
<button disabled>
  <Spinner class="size-4 mr-2" />
  Loading...
</button>

<!-- In modal -->
<div class="flex flex-col items-center gap-4">
  <Spinner class="size-8 text-rose-500" />
  <p>Please wait...</p>
</div>
```

---

## Example 6: Installation Command

```bash
# Install spinner component from shadcn-svelte
npx shadcn-svelte@latest add spinner

# Or with other package managers
pnpm dlx shadcn-svelte@latest add spinner
bun x shadcn-svelte@latest add spinner
yarn dlx shadcn-svelte@latest add spinner
```

---

## Example 7: Spinner Component Source

```svelte
<!-- src/lib/components/ui/spinner/spinner.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import type { ComponentProps } from 'svelte';
  
  type Props = ComponentProps<typeof LoaderIcon>;
  
  let { class: className, ...restProps }: Props = $props();
</script>

<LoaderIcon
  role="status"
  aria-label="Loading"
  class={cn('size-4 animate-spin', className)}
  {...restProps}
/>
```

---

## Example 8: Styling with Tailwind

```css
/* Modal overlay */
.modal-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm;
}

/* Modal card */
.modal-card {
  @apply flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow-lg;
}

/* Spinner */
.spinner {
  @apply size-8 text-rose-500 animate-spin;
}

/* Loading text */
.loading-text {
  @apply text-sm font-medium text-gray-700;
}
```

---

## Example 9: Testing the Modal

```svelte
<!-- Test component -->
<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<div class="flex gap-4">
  <button on:click={() => goto('/dashboard')}>
    Go to Dashboard
  </button>
  <button on:click={() => goto('/clients')}>
    Go to Clients
  </button>
  <button on:click={() => goto('/requests')}>
    Go to Requests
  </button>
</div>

<!-- Modal should appear when clicking any button -->
```

---

## Example 10: Accessibility Checklist

```svelte
<!-- Proper ARIA attributes -->
<div
  role="status"
  aria-busy={isNavigating}
  aria-label="Loading page"
  aria-live="polite"
>
  <Spinner aria-label="Loading" />
  <p>Loading...</p>
</div>

<!-- Screen reader will announce:
  - "Loading page" when modal appears
  - "Loading" when spinner is focused
  - "Page loaded" when modal disappears
-->
```

---

## File Structure After Implementation

```
src/lib/components/
├── ui/
│   ├── spinner/
│   │   ├── spinner.svelte (installed via CLI)
│   │   └── index.ts
│   └── ...
└── layout/
    ├── NavigationLoadingBar.svelte (existing)
    ├── NavigationLoadingModal.svelte (NEW)
    └── Sidebar.svelte (optional: add loading state)

src/routes/
└── +layout.svelte (add NavigationLoadingModal)
```

---

## Key Imports

```svelte
// Spinner component
import { Spinner } from '$lib/components/ui/spinner';

// Navigation store
import { navigating } from '$app/stores';

// Navigation function
import { goto } from '$app/navigation';

// Utilities
import { cn } from '$lib/utils';
```

