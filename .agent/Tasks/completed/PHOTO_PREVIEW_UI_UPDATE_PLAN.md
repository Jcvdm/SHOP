# Photo Preview UI Update Plan

**Date**: November 9, 2025  
**Status**: Planning Phase  
**Objective**: Update photo preview and upload components with improved look and feel

---

## Context Summary

### Current Components

**1. PhotoUpload.svelte** (`src/lib/components/forms/PhotoUpload.svelte`)
- **Purpose**: Single photo upload with preview modal
- **Current Styling**:
  - Upload buttons: `border-2 border-dashed`, `border-gray-300 bg-gray-50 hover:bg-gray-100`
  - Drag state: `border-blue-500 bg-blue-50`
  - Icons: Camera (h-8 w-8 text-gray-400), Upload (h-8 w-8 text-gray-400)
  - Text: "Take Photo" / "Upload File"
  - Preview: `bg-gray-100 rounded-lg`, clickable image with Change/Remove buttons
  - Modal: Zoom controls, Change/Remove/Close buttons

**2. PhotoViewer.svelte** (`src/lib/components/photo-viewer/PhotoViewer.svelte`)
- **Purpose**: Fullscreen photo gallery with bigger-picture library
- **Current**: Uses bigger-picture library for immersive viewing
- **Features**: Label editing, navigation tracking, optimistic updates
- **Styling**: Managed by bigger-picture CSS (imported in app.css)

**3. PreIncidentPhotosPanel.svelte** (`src/lib/components/assessment/PreIncidentPhotosPanel.svelte`)
- **Purpose**: Multi-photo upload panel for pre-incident photos
- **Current Styling**:
  - Upload area: `border-2 border-dashed border-gray-300 bg-gray-50`
  - Drag state: `border-blue-500 bg-blue-50`
  - Icons: Upload (h-12 w-12 text-gray-400)
  - Text: "Drag & drop photos or browse"
  - Upload button: Standard button with Upload icon

---

## Design System Reference

### Color Palette (from app.css)
- **Primary**: `oklch(0.208 0.042 265.755)` (dark blue)
- **Primary Foreground**: `oklch(0.984 0.003 247.858)` (white)
- **Secondary**: `oklch(0.968 0.007 247.896)` (light gray)
- **Accent**: `oklch(0.968 0.007 247.896)` (light gray)
- **Border**: `oklch(0.929 0.013 255.508)` (light gray)
- **Destructive**: `oklch(0.577 0.245 27.325)` (red)

### Tailwind Utilities Used
- **Buttons**: `bg-primary text-primary-foreground`, `bg-white`, `outline` variant
- **Cards**: `bg-card rounded-xl border py-6 shadow-sm`
- **Badges**: `bg-green-100 text-green-700`, `bg-yellow-100 text-yellow-700`
- **Icons**: Lucide-svelte (Camera, Upload, X, Loader2, ZoomIn, ZoomOut, etc.)

### Current Design Patterns
- **Dashed borders** for upload areas (border-2 border-dashed)
- **Gray backgrounds** for inactive states (bg-gray-50, bg-gray-100)
- **Blue accents** for active/drag states (border-blue-500, bg-blue-50, text-blue-500)
- **Rounded corners** (rounded-lg, rounded-xl)
- **Smooth transitions** (transition-all, transition-opacity)

---

## Photo Component Architecture

### Pattern 1: Fixed Bottom Bar (PhotoViewer)
- **Library**: bigger-picture (fullscreen)
- **Use Case**: Large photos requiring immersive viewing
- **Current**: Works well, uses bigger-picture CSS
- **Styling**: Managed by bigger-picture library

### Pattern 2: Modal Footer (PhotoUpload)
- **Library**: shadcn/ui Dialog
- **Use Case**: Single photo preview in modal
- **Current**: Modal with zoom controls
- **Styling**: Dialog.Content with custom modal size classes

### Pattern 3: Thumbnail Overlay (PreIncidentPhotosPanel)
- **Library**: Custom grid layout
- **Use Case**: Multi-photo upload with thumbnails
- **Current**: Grid of uploaded photos with labels
- **Styling**: Grid layout with hover effects

---

## Update Scope

### Components to Update
1. **PhotoUpload.svelte** - Single photo upload/preview
2. **PreIncidentPhotosPanel.svelte** - Multi-photo upload panel
3. **PhotoViewer.svelte** - Fullscreen viewer (if needed)

### Areas to Improve
- [ ] Upload button styling (more prominent, better visual hierarchy)
- [ ] Drag & drop visual feedback (more engaging)
- [ ] Icon styling (size, color, consistency)
- [ ] Text labels (clarity, consistency)
- [ ] Preview styling (borders, shadows, spacing)
- [ ] Modal styling (consistency with design system)
- [ ] Loading states (progress bar, spinner)
- [ ] Error states (if applicable)

---

## Design Considerations

### Current Strengths
✅ Clean, minimal design  
✅ Good use of Tailwind utilities  
✅ Consistent with shadcn-svelte foundation  
✅ Responsive layout  
✅ Clear visual feedback (drag states)

### Potential Improvements
- More prominent primary color usage
- Better visual hierarchy for buttons
- Enhanced drag & drop feedback
- Consistent icon sizing
- Better spacing/padding
- More polished preview styling

---

## Related Documentation

- **Photo Component Skill**: `.claude/skills/photo-component-development/`
- **Photo Labeling Patterns**: `.agent/SOP/photo_labeling_patterns.md`
- **Component Patterns**: `.claude/skills/claimtech-development/resources/component-patterns.md`
- **UI Loading Patterns**: `.agent/System/ui_loading_patterns.md`
- **Design System**: `src/app.css`, `components.json`

---

## Next Steps

1. **Define specific visual updates** - What exactly should change?
2. **Create mockups/examples** - Show desired look and feel
3. **Update components** - Apply new styling
4. **Test across browsers** - Verify responsive design
5. **Update documentation** - Record design decisions

---

**Status**: Ready for detailed design specification

