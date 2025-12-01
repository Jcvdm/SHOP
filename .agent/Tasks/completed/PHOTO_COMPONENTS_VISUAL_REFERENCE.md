# Photo Components - Visual Reference & Current Implementation

**Date**: November 9, 2025  
**Purpose**: Complete visual breakdown of photo upload/preview components

---

## Component 1: PhotoUpload.svelte

### Location
`src/lib/components/forms/PhotoUpload.svelte` (494 lines)

### Props Interface
```typescript
interface Props {
  value?: string | null;              // Current photo URL
  label?: string;                     // Photo label
  required?: boolean;
  assessmentId: string;               // For storage path
  category: 'identification' | '360' | 'interior' | 'tyres' | 'damage';
  subcategory?: string;
  onUpload: (url: string) => void;   // Callback when uploaded
  onRemove?: () => void;              // Callback when removed
  disabled?: boolean;
  height?: string;                    // Default: 'h-32'
}
```

### Visual States

#### State 1: Empty (No Photo)
```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │                      │  │                      │         │
│  │   📷 Camera Icon     │  │   📤 Upload Icon     │         │
│  │   (h-8 w-8)          │  │   (h-8 w-8)          │         │
│  │                      │  │                      │         │
│  │  Take Photo          │  │  Upload File         │         │
│  │                      │  │  or drag & drop      │         │
│  └──────────────────────┘  └──────────────────────┘         │
│  border-2 border-dashed    border-2 border-dashed           │
│  border-gray-300           border-gray-300                  │
│  bg-gray-50                bg-gray-50                       │
│  hover:bg-gray-100         hover:bg-gray-100                │
└─────────────────────────────────────────────────────────────┘
```

#### State 2: Dragging
```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │                      │  │                      │         │
│  │   📤 Upload Icon     │  │   📤 Upload Icon     │         │
│  │   (text-blue-500)    │  │   (text-blue-500)    │         │
│  │                      │  │                      │         │
│  │  Drop photo here     │  │  Drop photo here     │         │
│  │  (text-blue-600)     │  │  (text-blue-600)     │         │
│  └──────────────────────┘  └──────────────────────┘         │
│  border-blue-500           border-blue-500                  │
│  bg-blue-50                bg-blue-50                       │
└─────────────────────────────────────────────────────────────┘
```

#### State 3: Uploading
```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │                      │  │                      │         │
│  │   ⟳ Spinner          │  │   ⟳ Spinner          │         │
│  │   (animate-spin)     │  │   (animate-spin)     │         │
│  │                      │  │                      │         │
│  │  Uploading...        │  │  Uploading...        │         │
│  │  ▓▓▓▓▓░░░░░░░░░░░░░  │  │  ▓▓▓▓▓░░░░░░░░░░░░░  │         │
│  │  45%                 │  │  45%                 │         │
│  └──────────────────────┘  └──────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

#### State 4: Photo Uploaded
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │              [Photo Preview Image]                 │    │
│  │              (object-contain)                      │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │ [Change Button] [Remove Button (X)]         │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  │  (absolute right-2 top-2)                         │    │
│  └─────────────────────────────────────────────────────┘    │
│  bg-gray-100 rounded-lg                                     │
│  hover:opacity-90 transition-opacity                        │
└─────────────────────────────────────────────────────────────┘
```

### Current Styling Details
- **Upload buttons**: `flex h-32 flex-1 items-center justify-center rounded-lg border-2 border-dashed`
- **Inactive**: `border-gray-300 bg-gray-50 hover:bg-gray-100`
- **Dragging**: `border-blue-500 bg-blue-50`
- **Icons**: `h-8 w-8 text-gray-400` (inactive), `text-blue-500` (dragging)
- **Text**: `text-sm text-gray-600` (inactive), `text-sm font-medium text-blue-600` (dragging)
- **Preview**: `bg-gray-100 rounded-lg`, image with `object-contain`

---

## Component 2: PreIncidentPhotosPanel.svelte

### Location
`src/lib/components/assessment/PreIncidentPhotosPanel.svelte`

### Visual States

#### State 1: Empty Upload Area
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    📤 Upload Icon                          │
│                    (h-12 w-12 text-gray-400)               │
│                                                             │
│         Drag & drop photos or browse                       │
│         Supports: JPG, PNG, GIF • Multiple files           │
│                                                             │
│                  [Upload Photos Button]                    │
│                                                             │
│  border-2 border-dashed border-gray-300 bg-gray-50        │
└─────────────────────────────────────────────────────────────┘
```

#### State 2: Dragging
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    📤 Upload Icon                          │
│                    (h-12 w-12 text-blue-500)               │
│                                                             │
│         Drop photos here to upload                         │
│         (text-sm font-medium text-blue-600)                │
│                                                             │
│  border-2 border-dashed border-blue-500 bg-blue-50        │
└─────────────────────────────────────────────────────────────┘
```

#### State 3: Photos Uploaded
```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │          │  │          │  │          │  │          │   │
│  │  Photo   │  │  Photo   │  │  Photo   │  │  Photo   │   │
│  │  Thumb   │  │  Thumb   │  │  Thumb   │  │  Thumb   │   │
│  │          │  │          │  │          │  │          │   │
│  │ [Label]  │  │ [Label]  │  │ [Label]  │  │ [Label]  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  Grid layout with thumbnails and labels                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Component 3: PhotoViewer.svelte

### Location
`src/lib/components/photo-viewer/PhotoViewer.svelte` (346 lines)

### Features
- Fullscreen viewer using bigger-picture library
- Photo navigation (keyboard + mouse)
- Label editing with optimistic updates
- Delete functionality
- Keyboard shortcuts (E to edit, Enter to save, Escape to cancel)

### Styling
- Managed by bigger-picture CSS (imported in app.css)
- Fixed bottom bar for label editing
- Keyboard shortcuts display

---

## Design System Integration

### Colors Used
- **Gray**: `gray-50`, `gray-100`, `gray-300`, `gray-400`, `gray-600`, `gray-700`
- **Blue**: `blue-50`, `blue-500`, `blue-600`
- **White**: `bg-white` (buttons)

### Spacing
- **Icons**: `h-8 w-8` (PhotoUpload), `h-12 w-12` (PreIncidentPhotosPanel)
- **Padding**: `p-4` (modal), `p-6` (cards)
- **Gaps**: `gap-2` (button groups), `gap-3` (grids)

### Borders & Shadows
- **Upload areas**: `border-2 border-dashed`
- **Cards**: `rounded-xl border shadow-sm`
- **Buttons**: `rounded-md` (shadcn default)

### Transitions
- `transition-all` (general)
- `transition-opacity` (hover effects)
- `transition-transform` (zoom)

---

## Related Skills & Patterns

**Photo Component Development Skill**
- Pattern 1: Fixed Bottom Bar (PhotoViewer)
- Pattern 2: Modal Footer (PhotoUpload)
- Pattern 3: Thumbnail Overlay (PreIncidentPhotosPanel)

**Key Patterns**
- Optimistic updates for instant UI feedback
- Navigation tracking (prevents "wrong photo" bugs)
- Keyboard shortcuts for accessibility
- Responsive grid layouts

---

**Ready for**: Visual design updates and styling improvements

