# FileDropzone Visual Guide - November 9, 2025

## Component States

### 1. Empty State (No File)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    [Camera Icon]                        │
│                     Take Photo                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    [Upload Icon]                        │
│            Click to upload or drag and drop             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Two buttons side-by-side (if showCamera=true)
- Dashed border (gray-300)
- Hover effect (bg-gray-100)
- Icons centered with text below

---

### 2. Dragging State (File Over Dropzone)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                  [Upload Icon - Blue]                   │
│                   Drop file here                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Blue border (border-blue-500)
- Blue background (bg-blue-50)
- Blue icon and text
- Visual feedback for drag-over

---

### 3. Uploading State (Progress)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                  [Spinner - Animated]                   │
│                    Uploading...                         │
│                                                         │
│              ████████░░░░░░░░░░░░░░░░                  │
│                       45%                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Animated spinner (blue-500)
- Progress bar (blue-500 fill)
- Percentage display
- Disabled state (no interaction)

---

### 4. Preview State (Image Uploaded)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│                  [Image Preview]                        │
│                                                         │
│                                                         │
│                                                         │
│  [X]  ← Remove button (top-right)                      │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Full-width image preview (h-48)
- Hover effect (scale-105, dark overlay)
- Remove button (top-right, red)
- Click to change photo

---

### 5. Error State (Validation Failed)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    [Upload Icon]                        │
│            Click to upload or drag and drop             │
│                                                         │
└─────────────────────────────────────────────────────────┘
⚠️ File size must be less than 5.0MB
```

**Features:**
- Red error text below dropzone
- Clear error message
- Dropzone remains interactive

---

## Comparison: Old vs New

### Old PhotoUpload Component

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  [Camera Button]  [Upload Button]                      │
│  (with drag handlers)  (with drag handlers)            │
└─────────────────────────────────────────────────────────┘
        ↓                    ↓
   Overlapping handlers = FLICKER
```

**Issues:**
- ❌ Drag handlers on parent AND children
- ❌ Complex relatedTarget logic
- ❌ Custom modal (100+ lines)
- ❌ Not reusable
- ❌ 494 lines total

---

### New FileDropzone Component

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  (drag handlers on parent ONLY)                        │
│                                                         │
│  [Camera Button]  [Upload Button]                      │
│  (no drag handlers)  (no drag handlers)                │
│                                                         │
└─────────────────────────────────────────────────────────┘
        ↓
   Single handler = NO FLICKER
```

**Benefits:**
- ✅ Single drag handler on parent
- ✅ Simple drag logic (3 lines)
- ✅ Reuses PhotoViewer component
- ✅ Reusable for any file type
- ✅ 300 lines (focused)

---

## Usage Patterns

### Pattern 1: Photo Upload (with Camera)

```svelte
<FileDropzone
  accept={['image/jpeg', 'image/png']}
  maxSize={10 * 1024 * 1024}
  showCamera={true}
  height="h-32"
  label="Vehicle Photo"
  onUpload={handleUpload}
/>
```

**Visual:**
```
┌──────────────────────┐ ┌──────────────────────┐
│   [Camera Icon]      │ │   [Upload Icon]      │
│    Take Photo        │ │    Upload File       │
└──────────────────────┘ └──────────────────────┘
```

---

### Pattern 2: Document Upload (no Camera)

```svelte
<FileDropzone
  accept={['application/pdf']}
  maxSize={20 * 1024 * 1024}
  showCamera={false}
  height="h-40"
  label="Upload Document"
  showPreview={false}
  onUpload={handleUpload}
/>
```

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    [Upload Icon]                        │
│            Click to upload or drag and drop             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Pattern 3: Multiple Files

```svelte
<FileDropzone
  accept={['image/*']}
  maxFiles={10}
  maxSize={5 * 1024 * 1024}
  label="Upload Photos"
  onUpload={handleUpload}
/>
```

**Visual (after uploading 3 files):**
```
┌─────────────────────────────────────────────────────────┐
│  [Thumbnail 1]  [Thumbnail 2]  [Thumbnail 3]           │
│                                                         │
│                    [Upload Icon]                        │
│              Upload more (7 remaining)                  │
└─────────────────────────────────────────────────────────┘
```

---

## Accessibility Features

### ARIA Labels

```html
<div role="region" aria-label="Photo upload area">
  <!-- Dropzone content -->
</div>

<input type="file" aria-label="Photo upload" />
<input type="file" aria-label="Photo upload (camera)" />
```

### Keyboard Navigation

- **Tab**: Focus on upload button
- **Enter/Space**: Open file picker
- **Escape**: Cancel upload (if in progress)

### Screen Reader Announcements

- "Photo upload area"
- "Uploading... 45%"
- "Upload complete"
- "Error: File size must be less than 5.0MB"

---

## Responsive Design

### Desktop (≥768px)

```
┌──────────────────────┐ ┌──────────────────────┐
│   [Camera Icon]      │ │   [Upload Icon]      │
│    Take Photo        │ │    Upload File       │
└──────────────────────┘ └──────────────────────┘
```

### Mobile (<768px)

```
┌─────────────────────────────────────────────────────────┐
│                   [Camera Icon]                         │
│                    Take Photo                           │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                   [Upload Icon]                         │
│                    Upload File                          │
└─────────────────────────────────────────────────────────┘
```

---

## Color Scheme

### Default State
- Border: `border-gray-300`
- Background: `bg-gray-50`
- Hover: `hover:bg-gray-100`
- Icon: `text-gray-400`
- Text: `text-gray-600`

### Dragging State
- Border: `border-blue-500`
- Background: `bg-blue-50`
- Icon: `text-blue-500`
- Text: `text-blue-600`

### Uploading State
- Spinner: `text-blue-500`
- Progress bar: `bg-blue-500`
- Text: `text-gray-700`

### Error State
- Text: `text-red-600`

### Preview State
- Border: `border-gray-200`
- Hover border: `hover:border-gray-300`
- Overlay: `bg-black/50`
- Remove button: `variant="destructive"` (red)

---

## Animation & Transitions

### Hover Effects
```css
transition-all
hover:bg-gray-100
hover:border-gray-300
hover:scale-105
```

### Drag Effects
```css
transition-colors
border-blue-500 bg-blue-50 (when dragging)
```

### Progress Bar
```css
transition-all duration-300
width: {progress}%
```

### Spinner
```css
animate-spin
```

---

## Best Practices

### ✅ DO
- Use FileDropzone for all file uploads
- Provide clear labels for accessibility
- Show progress during upload
- Display clear error messages
- Use appropriate file type restrictions
- Set reasonable file size limits

### ❌ DON'T
- Add drag handlers to child elements
- Use complex relatedTarget logic
- Create custom modals for preview
- Hardcode file size/type restrictions
- Skip accessibility attributes
- Ignore error handling

---

**Date**: November 9, 2025  
**Status**: ✅ Complete

