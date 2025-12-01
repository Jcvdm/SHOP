# Tab Loading States - Context Analysis & Implementation Plan

**Date**: November 23, 2025
**Status**: Context Gathering Complete - Ready for Implementation
**Scope**: Add clear loading indicators for tab changes across ClaimTech

---

## Current State Analysis

### ✅ Existing Loading Infrastructure
1. **Global Navigation Bar** - `NavigationLoadingBar.svelte` (top-of-page progress bar)
2. **SaveIndicator** - `SaveIndicator.svelte` (silent auto-save feedback)
3. **LoadingButton** - `LoadingButton.svelte` (button-level spinners)
4. **Skeleton Loaders** - `SkeletonCard.svelte` (initial page load states)
5. **useNavigationLoading** - Utility for table row loading states

### ❌ Gap Identified
**Tab changes lack clear loading indicators** - When users click tabs, there's no visual feedback that:
- Data is being fetched/saved
- Tab content is loading
- Auto-save is in progress

---

## Pages Using Tabs (Identified)

### Assessment Detail Page (CRITICAL)
- **Path**: `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte`
- **Tabs**: 10+ tabs (Summary, Vehicle ID, 360°, Interior, Tyres, Damage, Values, Pre-Incident, Estimate, Finalize, Additionals, FRC, Audit)
- **Tab Change Handler**: `handleTabChange()` - Performs auto-save + note refresh + DB update
- **Current Issue**: No loading indicator during tab switch

### List/Filter Pages (SECONDARY)
- `src/routes/(app)/requests/+page.svelte` - Status filter tabs
- `src/routes/(app)/work/additionals/+page.svelte` - Filter tabs
- `src/routes/(app)/work/frc/+page.svelte` - Status tabs
- `src/routes/(app)/work/appointments/+page.svelte` - Type filter tabs
- `src/routes/(app)/work/archive/+page.svelte` - Type filter tabs

---

## Shadcn-Svelte Components Available

### Progress Component
- **Path**: `$lib/components/ui/progress`
- **Usage**: `<Progress value={33} />`
- **Features**: Animated progress bar, customizable max value
- **Styling**: Tailwind classes (w-[60%], etc.)

### Spinner Component
- **Path**: `$lib/components/ui/spinner`
- **Usage**: `<Spinner />` or `<Spinner class="size-6 text-blue-500" />`
- **Features**: Animated loading spinner, customizable size/color
- **Variants**: size-3, size-4, size-6, size-8 + text-* colors

### Tabs Component (Current)
- **Path**: `$lib/components/ui/tabs`
- **Structure**: Tabs, TabsList, TabsTrigger, TabsContent
- **Styling**: Rose-500 active state, border-b-2 underline style

---

## Implementation Strategy

### Option A: Inline Tab Loading Indicator (RECOMMENDED)
**Location**: Inside `TabsTrigger` or next to active tab
**Component**: New `TabLoadingIndicator.svelte`
**Behavior**:
- Show spinner on active tab during load
- Disable tab clicks during loading
- Auto-hide when complete

### Option B: Page-Level Loading Overlay
**Location**: Above tab content area
**Component**: New `TabContentLoader.svelte`
**Behavior**:
- Blur content + show spinner
- Positioned over tab content
- Smooth fade in/out

### Option C: Progress Bar Below Tabs
**Location**: Below TabsList
**Component**: Reuse `Progress` component
**Behavior**:
- Show progress during tab change
- Indeterminate mode (no specific %)
- Auto-hide when complete

---

## Code Areas to Modify

### Assessment Detail Page
- **File**: `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte`
- **Lines**: 75-97 (`handleTabChange` function)
- **Change**: Add `tabLoading` state, pass to `AssessmentLayout`

### AssessmentLayout Component
- **File**: `src/lib/components/assessment/AssessmentLayout.svelte`
- **Lines**: 238-260 (Tabs section)
- **Change**: Add loading indicator to TabsTrigger or create overlay

### Tab Components (All)
- **Files**: `VehicleIdentificationTab.svelte`, `EstimateTab.svelte`, etc.
- **Change**: Accept `loading` prop, show skeleton/blur during load

---

## Styling Patterns (Rose Theme)

### Active Tab Color
```css
data-[state=active]:bg-rose-500
data-[state=active]:text-white
```

### Loading State Colors
```css
text-rose-500 (spinner)
bg-rose-50 (overlay background)
border-rose-200 (borders)
```

### Disabled State
```css
opacity-50
pointer-events-none
```

---

## Next Steps

1. **Create TabLoadingIndicator.svelte** - Reusable loading component
2. **Update AssessmentLayout.svelte** - Add loading state management
3. **Update +page.svelte** - Track tab loading state
4. **Test on all tab pages** - Verify UX across different scenarios
5. **Document pattern** - Add to `.agent/System/ui_loading_patterns.md`

