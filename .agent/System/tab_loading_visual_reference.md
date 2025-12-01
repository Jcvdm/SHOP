# Tab Loading States - Visual & Styling Reference

**Last Updated**: November 23, 2025
**Purpose**: Visual examples and styling patterns for tab loading indicators

---

## Current Tab Styling (Rose Theme)

### Active Tab
```css
data-[state=active]:bg-rose-500
data-[state=active]:text-white
data-[state=active]:shadow-sm
```

### Inactive Tab
```css
text-muted-foreground
hover:bg-muted
hover:text-foreground
```

### Tab Container
```css
grid h-auto w-full grid-cols-2 gap-1.5 bg-transparent p-0
sm:grid-cols-4 sm:gap-2 md:grid-cols-6 lg:grid-cols-6
```

---

## Loading Indicator Styling

### Inline Spinner (Option 1)
```css
/* On active tab */
size-3 text-white animate-spin

/* Replaces icon when loading */
h-4 w-4 text-white animate-spin
```

### Loading Overlay (Option 2)
```css
/* Container */
absolute inset-0 flex flex-col items-center justify-center
bg-white/50 backdrop-blur-sm z-40

/* Spinner */
size-6 text-rose-500 mb-2 animate-spin

/* Message */
text-sm text-gray-600
```

### Progress Bar (Option 3)
```css
/* Container */
h-1 bg-rose-100 overflow-hidden

/* Progress */
h-full w-1/3 bg-rose-500 animate-pulse
```

---

## Tailwind Classes Reference

### Sizing
```
size-3 = 12px (extra small)
size-4 = 16px (small)
size-6 = 24px (medium)
size-8 = 32px (large)
```

### Colors
```
text-rose-500 = Primary rose
text-white = On dark backgrounds
text-gray-500 = Secondary
text-gray-600 = Tertiary
bg-rose-50 = Light background
bg-rose-100 = Lighter background
bg-white/50 = Semi-transparent white
```

### Animations
```
animate-spin = Continuous rotation (Spinner)
animate-pulse = Fade in/out (Progress)
transition-all = Smooth transitions
```

### Opacity & Disabled
```
opacity-50 = 50% opacity
pointer-events-none = No interaction
cursor-not-allowed = Disabled cursor
disabled:opacity-50 = Disabled state
```

### Flexbox
```
flex items-center justify-center = Center content
flex-col = Column direction
gap-2 = 8px gap
```

### Positioning
```
absolute inset-0 = Full coverage
z-40 = Above content
fixed top-0 left-0 right-0 = Fixed positioning
```

---

## Responsive Breakpoints

### Mobile (< 640px)
```css
grid-cols-2 gap-1.5
h-8 px-2 py-1.5 text-xs
hide tab labels, show icons only
```

### Tablet (640px - 1024px)
```css
sm:grid-cols-4 sm:gap-2
sm:h-9 sm:px-3 sm:py-2 sm:text-sm
show abbreviated labels
```

### Desktop (> 1024px)
```css
md:grid-cols-6 lg:grid-cols-6
lg:px-4 lg:py-3
show full labels
```

---

## Icon Sizing

### Lucide Icons
```svelte
<!-- Small (mobile) -->
<Icon class="h-3 w-3 sm:h-4 sm:w-4" />

<!-- Medium (default) -->
<Icon class="h-4 w-4" />

<!-- Large (overlay) -->
<Icon class="h-6 w-6" />

<!-- Extra large (full page) -->
<Icon class="h-8 w-8" />
```

---

## Badge Styling (Missing Fields Count)

```css
/* Current implementation */
<Badge variant="secondary">
  {missingCount}
</Badge>

/* Styling */
bg-gray-100 text-gray-700 text-xs rounded-full
```

---

## Accessibility Classes

```svelte
<!-- Loading status -->
role="status"
aria-busy={tabLoading}
aria-label="Loading tab content"

<!-- Disabled tabs -->
disabled={tabLoading}
aria-disabled={tabLoading}

<!-- Screen reader only -->
class="sr-only"
```

---

## Animation Timing

### Spinner
```css
animation: spin 1s linear infinite;
```

### Progress Pulse
```css
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

### Fade In/Out
```css
transition: opacity 200ms ease-in-out;
```

---

## Color Palette (Rose Theme)

```
rose-50   = #fdf2f8 (lightest)
rose-100  = #fce7f3
rose-200  = #fbcfe8
rose-300  = #f9a8d4
rose-400  = #f472b6
rose-500  = #ec4899 (primary)
rose-600  = #be185d
rose-700  = #9d174d
rose-800  = #831843
rose-900  = #500724 (darkest)
```

---

## Component Import Paths

```typescript
import { Spinner } from '$lib/components/ui/spinner';
import { Progress } from '$lib/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
import { Badge } from '$lib/components/ui/badge';
```

---

## Example: Complete Tab with Loading

```svelte
<TabsTrigger 
  value={tab.id}
  disabled={tabLoading}
  class="relative flex h-8 items-center justify-center gap-1.5 rounded-md 
         border border-transparent px-2 py-1.5 text-xs font-medium 
         text-muted-foreground transition-all hover:bg-muted hover:text-foreground
         data-[state=active]:bg-rose-500 data-[state=active]:text-white 
         data-[state=active]:shadow-sm disabled:opacity-50 disabled:pointer-events-none
         sm:h-9 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
>
  {#if tabLoading && currentTab === tab.id}
    <Spinner class="size-3 sm:size-4" />
  {:else if tab.icon}
    <Icon class="h-4 w-4" />
  {/if}
  <span class="hidden sm:inline">{tab.label}</span>
  <span class="sm:hidden">{getShortLabel(tab.label)}</span>
  {#if missingCount > 0}
    <Badge variant="secondary">{missingCount}</Badge>
  {/if}
</TabsTrigger>
```

