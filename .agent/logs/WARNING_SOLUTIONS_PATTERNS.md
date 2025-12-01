# Warning Solutions & Code Patterns
**Date**: November 23, 2025
**Purpose**: Reference guide for fixing 24 warnings

---

## Pattern 1: Accessibility - Click Events + Keyboard Handlers

**Problem**: Div with onclick needs keyboard support
```svelte
<!-- ❌ WRONG -->
<div onclick={handleClick} class="cursor-pointer">
  Click me
</div>

<!-- ✅ CORRECT -->
<div 
  onclick={handleClick}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  role="button"
  tabindex={0}
  class="cursor-pointer"
>
  Click me
</div>
```

**Files to Fix**: 
- `ReversalReasonModal.svelte:45`
- `EstimatePhotosPanel.svelte:278`
- `Exterior360PhotosPanel.svelte:274`

---

## Pattern 2: Accessibility - ARIA Roles for Drag Zones

**Problem**: Drag zone div needs ARIA role
```svelte
<!-- ❌ WRONG -->
<div ondrop={handleDrop} ondragover={handleDragOver}>
  Drop here
</div>

<!-- ✅ CORRECT -->
<div 
  ondrop={handleDrop}
  ondragover={handleDragOver}
  role="button"
  aria-label="Upload zone - drag and drop files here"
  tabindex={0}
>
  Drop here
</div>
```

**Files to Fix**:
- `EstimatePhotosPanel.svelte:278`
- `Exterior360PhotosPanel.svelte:224`

---

## Pattern 3: Deprecation - Replace `<svelte:component>`

**Problem**: `<svelte:component>` deprecated in Svelte 5
```svelte
<!-- ❌ WRONG -->
<svelte:component this={icon} class="h-4 w-4" />

<!-- ✅ CORRECT -->
<svelte:component this={icon} class="h-4 w-4" />
<!-- OR if icon is known at compile time -->
{@const Icon = icon}
<Icon class="h-4 w-4" />
```

**Files to Fix**:
- `DocumentCard.svelte:50`
- `AssessmentLayout.svelte:231`
- `NoteBubble.svelte:139`
- `DocumentGenerationProgress.svelte:74,78`

---

## Pattern 4: Deprecation - Replace `<slot>`

**Problem**: `<slot>` deprecated, use `{@render}`
```svelte
<!-- ❌ WRONG -->
<div class="container">
  <slot />
</div>

<!-- ✅ CORRECT -->
<div class="container">
  {@render children?.()}
</div>
```

**File to Fix**: `AssessmentLayout.svelte:247`

---

## Pattern 5: State Reactivity - Prop Synchronization

**Problem**: Props captured at initialization
```svelte
<!-- ❌ WRONG -->
let { assessmentId } = $props();
const draft = useDraft(`assessment-${assessmentId}-notes`);

<!-- ✅ CORRECT -->
let { assessmentId } = $props();
const draft = $derived.by(() => 
  useDraft(`assessment-${assessmentId}-notes`)
);
```

**File to Fix**: `DamageTab.svelte:30-42`

---

## Pattern 6: HTML Structure - Explicit Closing Tags

**Problem**: Missing closing tag causes implicit closure
```svelte
<!-- ❌ WRONG -->
<Card>
  <div>
    Content
  <!-- Missing </div> -->
</Card>

<!-- ✅ CORRECT -->
<Card>
  <div>
    Content
  </div>
</Card>
```

**File to Fix**: `EstimateTab.svelte:690`

---

## Implementation Priority

1. **High**: Accessibility (5 warnings) - User-facing
2. **Medium**: State Reactivity (9 warnings) - Data consistency
3. **Low**: Deprecation (6 warnings) - Framework compliance
4. **Low**: HTML Structure (1 warning) - Code quality

---

## Testing After Fixes

```bash
npm run check  # Verify warnings reduced
npm run dev    # Test functionality
npm run test:e2e  # Verify user interactions
```

