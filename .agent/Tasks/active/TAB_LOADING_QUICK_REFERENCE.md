# Tab Loading States - Quick Reference

**Status**: Context Complete ✅ | Ready for Implementation
**Created**: November 23, 2025

---

## The Problem
Tab changes lack loading indicators. Users don't see feedback during:
- Auto-save operations (500ms-2s)
- Note refresh from DB
- Tab preference updates

---

## The Solution
Create 3 reusable components + integrate into 6 pages

---

## 3 Implementation Options

### Option 1: Inline Spinner (RECOMMENDED)
```svelte
{#if tabLoading && currentTab === tab.id}
  <Spinner class="size-3 text-white" />
{:else}
  <Icon class="h-4 w-4" />
{/if}
```
**Pros**: Minimal, clear, familiar
**Cons**: Small space
**Best for**: Assessment tabs

### Option 2: Loading Overlay
```svelte
{#if tabLoading}
  <div class="absolute inset-0 flex items-center justify-center bg-white/50">
    <Spinner class="size-6 text-rose-500" />
  </div>
{/if}
```
**Pros**: Prominent, professional
**Cons**: Covers content
**Best for**: Heavy operations

### Option 3: Progress Bar
```svelte
{#if tabLoading}
  <div class="h-1 bg-rose-100">
    <div class="h-full w-1/3 bg-rose-500 animate-pulse"></div>
  </div>
{/if}
```
**Pros**: Subtle, familiar
**Cons**: Might be missed
**Best for**: Filter tabs

---

## Pages to Update

### TIER 1 (Critical)
- `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte`
  - 10+ tabs, 500ms-2s operations
  - Highest impact

### TIER 2 (Secondary)
- `src/routes/(app)/requests/+page.svelte`
- `src/routes/(app)/work/additionals/+page.svelte`
- `src/routes/(app)/work/frc/+page.svelte`
- `src/routes/(app)/work/appointments/+page.svelte`
- `src/routes/(app)/work/archive/+page.svelte`

---

## Components to Create

### 1. TabLoadingIndicator.svelte
- Inline spinner on active tab
- ~30 lines
- Props: `isLoading`, `icon`, `class`

### 2. TabContentLoader.svelte
- Loading overlay
- ~40 lines
- Props: `loading`, `message`, `class`

### 3. TabProgressBar.svelte
- Progress bar below tabs
- ~25 lines
- Props: `loading`, `class`

---

## Key Files to Modify

### AssessmentLayout.svelte
- Lines 238-260 (Tabs section)
- Add loading indicator
- Disable tabs during load

### +page.svelte (Assessment)
- Lines 75-97 (handleTabChange)
- Add `tabLoading` state
- Set true/false around operations

---

## Styling (Rose Theme)

```css
/* Active tab */
bg-rose-500 text-white

/* Loading spinner */
text-rose-500 animate-spin

/* Overlay */
bg-white/50 backdrop-blur-sm

/* Progress bar */
bg-rose-500 animate-pulse
```

---

## Shadcn Components

```typescript
import { Spinner } from '$lib/components/ui/spinner';
import { Progress } from '$lib/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
```

---

## State Management Pattern

```typescript
let tabLoading = $state(false);

async function handleTabChange(tabId: string) {
  tabLoading = true;
  try {
    // Auto-save, refresh, update
  } finally {
    tabLoading = false;
  }
}
```

---

## Documentation Files

1. **TAB_LOADING_CONTEXT_ANALYSIS.md** - Overview & strategy
2. **tab_loading_states_technical_reference.md** - Technical details
3. **tab_loading_component_patterns.md** - Code examples
4. **tab_loading_visual_reference.md** - Styling & visuals
5. **TAB_LOADING_IMPLEMENTATION_SCOPE.md** - Full scope

---

## Estimated Effort

- Components: 2-3 hours
- Integration: 1-2 hours
- Testing: 1-2 hours
- **Total**: 4-7 hours

---

## Success Criteria

- [ ] Tab click shows loading indicator
- [ ] Indicator disappears when loaded
- [ ] Works on all 6 pages
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Accessible (aria-busy, role="status")

---

**Ready to implement when approved.** ✅

