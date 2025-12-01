# PhotoUpload vs TyrePhotosPanel - Detailed Code Comparison

**Purpose**: Show exact differences in styling and functionality

---

## 1. UPLOAD ZONE CONTAINER

### ❌ PhotoUpload.svelte (WRONG)
```svelte
<div class="flex gap-2" role="region" aria-label="Photo upload area">
  <!-- TWO BUTTONS SIDE BY SIDE -->
</div>
```

### ✅ TyrePhotosPanel.svelte (CORRECT)
```svelte
<div
  role="button"
  tabindex="0"
  class="relative rounded-lg border-2 border-dashed transition-colors 
    {isDragging ? 'border-rose-500 bg-rose-50' : 'border-gray-300 bg-gray-50'}"
  ondragenter={handleDragEnter}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  <div class="flex flex-col items-center justify-center p-6">
    <!-- CONTENT CENTERED -->
  </div>
</div>
```

**Differences**:
- PhotoUpload: `flex gap-2` (horizontal)
- TyrePanel: `flex flex-col items-center justify-center p-6` (vertical centered)
- PhotoUpload: No border/drag styling on container
- TyrePanel: Border + drag state styling on container

---

## 2. UPLOAD ZONE CONTENT (NO UPLOAD)

### ❌ PhotoUpload.svelte (WRONG)
```svelte
{:else}
  <Upload class="mx-auto h-8 w-8 text-gray-400" />
  <p class="mt-2 text-sm text-gray-600">Upload File</p>
  <p class="mt-1 text-xs text-gray-500">or drag & drop</p>
{/if}
```

### ✅ TyrePhotosPanel.svelte (CORRECT)
```svelte
{:else}
  <Upload class="h-8 w-8 text-gray-400" />
  <p class="mt-2 text-sm text-gray-600">
    Drag and drop photos here, or
    <button
      type="button"
      onclick={triggerFileInput}
      class="text-rose-600 hover:text-rose-700 font-medium"
    >
      browse
    </button>
  </p>
  <p class="mt-1 text-xs text-gray-500">Supports multiple files</p>
  <div class="flex gap-2 justify-center mt-3">
    <Button onclick={triggerCameraInput} variant="outline" size="sm">
      <Camera class="mr-2 h-4 w-4" />
      Camera
    </Button>
    <Button onclick={triggerFileInput} size="sm">
      <Upload class="mr-2 h-4 w-4" />
      Upload
    </Button>
  </div>
{/if}
```

**Differences**:
- PhotoUpload: Two separate lines ("Upload File" + "or drag & drop")
- TyrePanel: Single line with clickable "browse" link
- PhotoUpload: No "Supports multiple files" text
- TyrePanel: Clear support statement
- PhotoUpload: Buttons integrated in upload zone
- TyrePanel: Buttons below zone in separate div

---

## 3. BUTTON STYLING

### ❌ PhotoUpload.svelte (WRONG)
```svelte
<button
  type="button"
  class="flex {height} flex-1 items-center justify-center rounded-lg 
    border-2 border-dashed transition-all 
    {isDragging ? 'border-rose-500 bg-rose-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}"
  onclick={triggerCameraInput}
>
  <!-- BUTTON IS UPLOAD ZONE -->
</button>
```

### ✅ TyrePhotosPanel.svelte (CORRECT)
```svelte
<div class="flex gap-2 justify-center mt-3">
  <Button onclick={triggerCameraInput} variant="outline" size="sm">
    <Camera class="mr-2 h-4 w-4" />
    Camera
  </Button>
  <Button onclick={triggerFileInput} size="sm">
    <Upload class="mr-2 h-4 w-4" />
    Upload
  </Button>
</div>
```

**Differences**:
- PhotoUpload: Buttons ARE the upload zone (flex-1 width)
- TyrePanel: Buttons are separate UI elements below zone
- PhotoUpload: Custom styling on buttons
- TyrePanel: Uses Button component with variant/size props

---

## 4. CONTAINER PADDING

### ❌ PhotoUpload.svelte
- Uses `{height}` variable (h-32 default)
- Uses `flex-1` for width
- No explicit padding

### ✅ TyrePhotosPanel.svelte
- Uses `p-6` padding on inner div
- Uses `p-8` on outer container
- Full width container

---

## 5. DRAG STATE STYLING

### ❌ PhotoUpload.svelte
- Drag state on individual buttons
- Each button shows drag styling

### ✅ TyrePhotosPanel.svelte
- Drag state on container
- Single unified drag appearance
- `border-rose-500 bg-rose-50` when dragging

---

## Summary Table

| Aspect | PhotoUpload | TyrePanel |
|--------|------------|-----------|
| Container | `flex gap-2` | `flex flex-col items-center justify-center p-6` |
| Buttons | Integrated (flex-1) | Separate below zone |
| Text | "Upload File" + "or drag & drop" | "Drag and drop... or browse" |
| Browse | No link | Clickable link |
| Support text | None | "Supports multiple files" |
| Drag styling | Per button | Container-level |
| Button component | Custom styled | Button component |
| Padding | Variable height | p-6 / p-8 |

---

## Action Items

1. ✅ Understand the pattern differences
2. ⏳ Refactor PhotoUpload to match TyrePanel layout
3. ⏳ Update text content and instructions
4. ⏳ Move buttons below upload zone
5. ⏳ Add "browse" link
6. ⏳ Test styling matches across all components

