# Slate Theme - Detailed Component Breakdown

**Date**: November 23, 2025  
**Purpose**: Line-by-line component update guide

---

## GLOBAL THEME SYSTEM

### `src/app.css` (Lines 9-76)

**Light Mode `:root` Block**:
```
Line 17: --primary: oklch(0.13 0.02 260) → Slate-600
Line 19: --secondary: oklch(0.967 0.001 286.375) → Slate-100
Line 23: --accent: oklch(0.967 0.001 286.375) → Slate-100
Line 34: --sidebar: oklch(0.13 0.02 260) → Slate-900 (dark)
Line 38: --sidebar-accent: oklch(0.2 0.02 260) → Slate-700
```

**Dark Mode `.dark` Block**:
```
Line 51: --primary: oklch(0.13 0.02 260) → Slate-400
Line 53: --secondary: oklch(0.274 0.006 286.033) → Slate-700
Line 57: --accent: oklch(0.274 0.006 286.033) → Slate-700
Line 68: --sidebar: oklch(0.1 0.02 260) → Slate-950
Line 72: --sidebar-accent: oklch(0.18 0.02 260) → Slate-800
```

---

## DOCUMENT GENERATION COMPONENTS

### `DocumentGenerationProgress.svelte` (Lines 46-63)

**Status Color Function**:
```javascript
case 'processing': return 'text-rose-500' → 'text-slate-600'
```

**Progress Background Function**:
```javascript
case 'processing': return 'bg-rose-100' → 'bg-slate-100'
case 'default': return 'bg-rose-100' → 'bg-slate-100'
```

---

### `DocumentProgressBar.svelte` (Lines 43-55)

**Status Colors Object**:
```javascript
processing: 'text-rose-500' → 'text-slate-600'
```

**Progress Backgrounds Object**:
```javascript
pending: 'bg-rose-100' → 'bg-slate-100'
processing: 'bg-rose-100' → 'bg-slate-100'
```

---

## TAB LOADING COMPONENTS

### `TabContentLoader.svelte` (Line 29)
```
<Loader2 class="... text-rose-500" />
→ <Loader2 class="... text-slate-600" />
```

### `TabProgressBar.svelte` (Lines 17-18)
```
class="... bg-rose-100 ..."
→ class="... bg-slate-100 ..."

class="... bg-rose-500"
→ class="... bg-slate-600"
```

---

## PHOTO UPLOAD COMPONENTS (6 Files)

### `PhotoUpload.svelte` (Lines 251-297)
- Line 251: `border-rose-500` → `border-slate-500`
- Line 252: `bg-rose-50` → `bg-slate-50`
- Line 267: `text-rose-600` → `text-slate-600`
- Line 268: `bg-rose-200` → `bg-slate-200`
- Line 280: `text-rose-500` → `text-slate-600`
- Line 281: `bg-rose-100` → `bg-slate-100`
- Line 296: `text-rose-700` → `text-slate-700`
- Line 297: `text-rose-600` → `text-slate-600`

### Photo Panels (5 files)
- `PreIncidentPhotosPanel.svelte` - Same pattern as PhotoUpload
- `EstimatePhotosPanel.svelte` - Same pattern as PhotoUpload
- `AdditionalsPhotosPanel.svelte` - Same pattern as PhotoUpload
- `Exterior360PhotosPanel.svelte` - Same pattern as PhotoUpload
- `TyrePhotosPanel.svelte` - Same pattern as PhotoUpload

---

## DOCUMENT CARD COMPONENT

### `DocumentCard.svelte` (Lines 82-105)

**8 Rose Color References**:
- Progress indicator colors
- Status badge colors
- Background colors
- Text colors

All `rose-*` → `slate-*` equivalents

---

## NAVIGATION COMPONENTS

### `NavigationLoadingBar.svelte` (Line 16)
```
via-blue-600 → via-slate-600
```

### `Sidebar.svelte`
- Already updated to dark slate (verify)
- Check badge styling

---

## DATA DISPLAY COMPONENTS

### `EstimateTab.svelte` (Lines 1195-1203)
```
text-blue-600 → text-slate-600
```
Keep red/orange/yellow/green for threshold indicators

### `TableCell.svelte` (Line 26)
```
primary: 'text-blue-600' → 'text-slate-600'
```

### `GradientBadge.svelte` (Lines 15, 20)
```
blue: 'from-blue-500 to-indigo-600' → 'from-slate-500 to-slate-600'
indigo: 'from-indigo-500 to-blue-600' → 'from-slate-600 to-slate-700'
```

---

## PDF TEMPLATE FILES

### `report-template.ts` (Lines 99-105, 122, 129)
```css
.bg-rose { background-color: #e11d48 } → #64748b (slate-500)
.text-rose { color: #e11d48 } → #64748b
.border-rose { border-color: #e11d48 } → #64748b
.bg-blue { background-color: #1e40af } → #475569 (slate-600)
.text-blue { color: #1e40af } → #475569
.border-blue { border-color: #1e40af } → #475569
border-bottom: 4px solid #e11d48 → #64748b
color: #e11d48 → #64748b
```

### `additionals-letter-template.ts` (Lines 140-154)
```css
color: #e11d48 → #64748b
```

### `estimate-template.ts`
- Check for hardcoded rose/blue colors

### `frc-report-template.ts`
- Check for hardcoded rose/blue colors

### `photos-template.ts`
- Check for hardcoded rose/blue colors

---

## WORK PAGE

### `src/routes/(app)/work/+page.svelte` (Lines 79-87)

**Color Classes Object**:
```javascript
blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }
→ slate: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
```

---

## SHADCN-SVELTE COMPONENTS

**Auto-Update via CSS Variables**:
- Alert
- Badge
- Button
- Progress
- Sidebar components
- All UI primitives

**Manual Check**:
- Verify variants still work
- Check color contrast
- Test dark mode

---

**Implementation Order**: Global → Document → Photos → Data → Templates → Utilities

