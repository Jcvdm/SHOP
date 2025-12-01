# Photo Preview UI Update - Context Summary

**Date**: November 9, 2025  
**Status**: Context Gathering Complete ✅

---

## What You Asked For

You want to update the look and feel of photo preview components:
1. The **photo preview div** (the one with `id="hzViewer"` - bigger-picture library element)
2. The **photo upload button** (the one with Camera icon and "Take Photo" text)

---

## What I Found

### 3 Main Photo Components

#### 1. **PhotoUpload.svelte** (Single Photo Upload)
- **File**: `src/lib/components/forms/PhotoUpload.svelte` (494 lines)
- **Purpose**: Upload single photo with preview modal
- **Current Styling**: Gray dashed borders, gray backgrounds, blue drag states
- **States**: Empty → Dragging → Uploading → Preview

#### 2. **PreIncidentPhotosPanel.svelte** (Multi-Photo Upload)
- **File**: `src/lib/components/assessment/PreIncidentPhotosPanel.svelte`
- **Purpose**: Upload multiple pre-incident photos
- **Current Styling**: Similar to PhotoUpload but larger icons
- **States**: Empty → Dragging → Uploading → Grid of photos

#### 3. **PhotoViewer.svelte** (Fullscreen Gallery)
- **File**: `src/lib/components/photo-viewer/PhotoViewer.svelte` (346 lines)
- **Purpose**: Fullscreen photo viewing with bigger-picture library
- **Current**: Uses bigger-picture CSS (imported in app.css)
- **Features**: Label editing, navigation, keyboard shortcuts

---

## Current Design System

### Colors
- **Primary**: Dark blue (`oklch(0.208 0.042 265.755)`)
- **Grays**: `gray-50`, `gray-100`, `gray-300`, `gray-400`, `gray-600`, `gray-700`
- **Blues**: `blue-50`, `blue-500`, `blue-600` (for active/drag states)
- **Whites**: `bg-white` (buttons, cards)

### Components
- **Buttons**: shadcn-svelte with variants (default, outline, ghost, destructive)
- **Icons**: Lucide-svelte (Camera, Upload, X, Loader2, ZoomIn, ZoomOut)
- **Cards**: `rounded-xl border shadow-sm`
- **Borders**: `border-2 border-dashed` for upload areas

### Patterns
- Dashed borders for upload areas
- Gray backgrounds for inactive states
- Blue accents for active/drag states
- Smooth transitions (`transition-all`, `transition-opacity`)

---

## Key Styling Details

### Upload Buttons (Current)
```tailwind
border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100
```
- Inactive: Gray dashed border, light gray background
- Dragging: Blue dashed border, light blue background
- Icons: `h-8 w-8 text-gray-400` (inactive), `text-blue-500` (dragging)

### Preview Container (Current)
```tailwind
bg-gray-100 rounded-lg flex items-center justify-center group
```
- Light gray background
- Rounded corners
- Clickable image with hover opacity effect

### Buttons (Current)
```tailwind
size="sm" variant="outline" class="bg-white"
```
- Small outline buttons with white background
- Change/Remove buttons on preview

---

## Related Documentation

### Skills
- **Photo Component Development Skill**: `.claude/skills/photo-component-development/`
  - 3 core patterns (Fixed Bottom Bar, Modal Footer, Thumbnail Overlay)
  - Optimistic updates, navigation tracking, keyboard shortcuts
  
### SOPs
- **Photo Labeling Patterns**: `.agent/SOP/photo_labeling_patterns.md`
- **Creating Components**: `.agent/SOP/creating-components.md`

### System Docs
- **Photo Labeling Implementation**: `.agent/System/photo_labeling_implementation_nov_6_2025.md`
- **UI Loading Patterns**: `.agent/System/ui_loading_patterns.md`

---

## Planning Documents Created

I've created 3 detailed planning documents in `.agent/Tasks/active/`:

1. **PHOTO_PREVIEW_UI_UPDATE_PLAN.md**
   - Overview of components and current styling
   - Design system reference
   - Architecture patterns
   - Next steps

2. **PHOTO_COMPONENTS_VISUAL_REFERENCE.md**
   - Visual breakdown of each component
   - ASCII diagrams of UI states
   - Current styling details
   - Design system integration

3. **PHOTO_UI_STYLING_RECOMMENDATIONS.md**
   - Current vs. recommended styling
   - 3 options for each element (buttons, icons, text, preview, etc.)
   - Implementation priority (Phase 1, 2, 3)
   - Testing checklist
   - Files to update

---

## What's Ready

✅ **Complete Context Gathered**
- All 3 photo components identified
- Current styling documented
- Design system understood
- Related patterns documented

✅ **Planning Documents Created**
- Visual reference with ASCII diagrams
- Styling recommendations with options
- Implementation roadmap

✅ **Ready for Next Steps**
- Define specific visual updates you want
- Choose styling options from recommendations
- Create mockups if needed
- Begin implementation

---

## Next Steps (Your Decision)

### Option 1: Specific Design Direction
Tell me:
- What specific visual changes do you want?
- Which styling options appeal to you?
- Any mockups or examples to reference?

### Option 2: Implement Recommendations
I can apply the recommended styling updates:
- Update upload button colors (gray → blue)
- Increase icon sizes (h-8 → h-10)
- Improve text hierarchy
- Add shadows to preview containers
- Update button variants

### Option 3: Explore More
- Research design inspiration
- Create detailed mockups
- Compare with other apps
- Define design system extensions

---

## Files to Update (When Ready)

1. `src/lib/components/forms/PhotoUpload.svelte`
   - Lines 294-329: First upload button
   - Lines 331-367: Second upload button
   - Lines 244-282: Preview container
   - Lines 259-280: Change/Remove buttons

2. `src/lib/components/assessment/PreIncidentPhotosPanel.svelte`
   - Lines 200-244: Upload area styling

3. `src/lib/components/photo-viewer/PhotoViewer.svelte`
   - If needed for consistency

---

**Status**: Context gathering complete. Ready for design decisions.

**Next Action**: Tell me what specific visual updates you'd like to make!

