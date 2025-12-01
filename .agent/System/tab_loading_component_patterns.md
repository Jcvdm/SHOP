# Tab Loading Component Patterns - Code Examples

**Last Updated**: November 23, 2025
**Purpose**: Reusable patterns for tab loading indicators
**Related**: [tab_loading_states_technical_reference.md](./tab_loading_states_technical_reference.md)

---

## Pattern 1: Inline Spinner on Active Tab

### Component: TabLoadingIndicator.svelte
```svelte
<script lang="ts">
  import { Spinner } from '$lib/components/ui/spinner';
  
  interface Props {
    isLoading?: boolean;
    icon?: any;
    class?: string;
  }
  
  let { isLoading = false, icon: Icon, class: className = '' }: Props = $props();
</script>

{#if isLoading}
  <Spinner class="size-3 text-white {className}" />
{:else if Icon}
  <Icon class="h-4 w-4 {className}" />
{/if}
```

### Usage in TabsTrigger
```svelte
<TabsTrigger value={tab.id} class="...data-[state=active]:bg-rose-500...">
  <TabLoadingIndicator 
    isLoading={tabLoading && currentTab === tab.id}
    icon={tab.icon}
  />
  <span>{tab.label}</span>
</TabsTrigger>
```

---

## Pattern 2: Loading Overlay

### Component: TabContentLoader.svelte
```svelte
<script lang="ts">
  import { Spinner } from '$lib/components/ui/spinner';
  
  interface Props {
    loading?: boolean;
    message?: string;
    class?: string;
  }
  
  let { loading = false, message = 'Loading...', class: className = '' }: Props = $props();
</script>

{#if loading}
  <div class="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-40 {className}">
    <Spinner class="size-6 text-rose-500 mb-2" />
    <p class="text-sm text-gray-600">{message}</p>
  </div>
{/if}
```

### Usage in AssessmentLayout
```svelte
<div class="relative flex-1">
  <TabsContent value={currentTab}>
    <!-- Tab content here -->
  </TabsContent>
  <TabContentLoader loading={tabLoading} message="Switching tab..." />
</div>
```

---

## Pattern 3: Progress Bar Below Tabs

### Component: TabProgressBar.svelte
```svelte
<script lang="ts">
  import { Progress } from '$lib/components/ui/progress';
  
  interface Props {
    loading?: boolean;
    class?: string;
  }
  
  let { loading = false, class: className = '' }: Props = $props();
</script>

{#if loading}
  <div class="h-1 bg-rose-100 overflow-hidden {className}">
    <div class="h-full w-1/3 bg-rose-500 animate-pulse"></div>
  </div>
{/if}
```

### Usage Below TabsList
```svelte
<TabsList class="grid h-auto w-full grid-cols-2 gap-1.5 bg-transparent p-0">
  <!-- Tabs here -->
</TabsList>
<TabProgressBar loading={tabLoading} />
```

---

## Pattern 4: State Management in +page.svelte

```typescript
let tabLoading = $state(false);
let currentTab = $state('summary');

async function handleTabChange(tabId: string) {
  if (tabLoading) return; // Prevent concurrent changes
  
  tabLoading = true;
  try {
    // Auto-save current tab
    if (currentTab === 'estimate' && estimateTabSaveFn) {
      await estimateTabSaveFn();
    }
    
    // Global save
    await handleSave();
    
    // Refresh notes
    const updatedNotes = await assessmentNotesService.getNotesByAssessment(data.assessment.id);
    data.notes = updatedNotes;
    
    // Update tab
    currentTab = tabId;
    await assessmentService.updateCurrentTab(data.assessment.id, tabId);
  } catch (error) {
    console.error('Tab change error:', error);
  } finally {
    tabLoading = false;
  }
}
```

---

## Pattern 5: Disabled Tabs During Loading

```svelte
<TabsTrigger 
  value={tab.id}
  disabled={tabLoading}
  class="...disabled:opacity-50 disabled:pointer-events-none..."
>
  <!-- Content -->
</TabsTrigger>
```

---

## Styling Classes Reference

### Spinner Sizes
- `size-3` - Extra small (12px)
- `size-4` - Small (16px)
- `size-6` - Medium (24px)
- `size-8` - Large (32px)

### Colors
- `text-rose-500` - Primary
- `text-gray-500` - Secondary
- `text-white` - On dark backgrounds

### Animations
- `animate-spin` - Continuous rotation
- `animate-pulse` - Fade in/out
- `transition-all` - Smooth changes

### Opacity/Disabled
- `opacity-50` - 50% opacity
- `pointer-events-none` - No interaction
- `cursor-not-allowed` - Disabled cursor

---

## Accessibility Attributes

```svelte
<!-- For loading indicator -->
<div role="status" aria-busy={tabLoading} aria-label="Loading tab content">
  <Spinner />
</div>

<!-- For disabled tabs -->
<TabsTrigger 
  value={tab.id}
  disabled={tabLoading}
  aria-disabled={tabLoading}
>
  {tab.label}
</TabsTrigger>
```

---

## Performance Considerations

1. **Debounce tab clicks** - Prevent rapid successive clicks
2. **Timeout fallback** - Auto-hide spinner after 5s if stuck
3. **Cleanup on unmount** - Cancel pending operations
4. **Memoize tab list** - Prevent unnecessary re-renders

---

## Mobile Responsive

```svelte
<!-- Hide text on mobile, show only icon -->
<span class="hidden sm:inline">{tab.label}</span>
<span class="sm:hidden">{getShortLabel(tab.label)}</span>

<!-- Adjust spinner size for mobile -->
<Spinner class="size-3 sm:size-4" />
```

