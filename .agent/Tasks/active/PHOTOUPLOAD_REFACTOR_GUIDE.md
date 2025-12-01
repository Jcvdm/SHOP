# PhotoUpload Refactor Guide - Exact Changes Required

**File**: `src/lib/components/forms/PhotoUpload.svelte`  
**Lines to Change**: 237-306 (upload area section)  
**Pattern to Follow**: TyrePhotosPanel.svelte lines 182-240

---

## SECTION 1: Upload Area Container (Lines 237-247)

### CURRENT (WRONG)
```svelte
{:else}
  <!-- Upload Area with Drag & Drop -->
  <div
    class="flex gap-2"
    role="region"
    aria-label="Photo upload area"
    ondragenter={handleDragEnter}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
```

### SHOULD BE (CORRECT)
```svelte
{:else}
  <!-- Upload Area with Drag & Drop -->
  <div
    role="button"
    tabindex="0"
    class="relative border-2 border-dashed rounded-lg p-8 text-center transition-colors {isDragging
      ? 'border-rose-500 bg-rose-50'
      : 'border-gray-300 hover:border-gray-400'}"
    ondragenter={handleDragEnter}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerFileInput();
      }
    }}
    aria-label="Upload photo - drag and drop or click to select"
  >
    <div class="flex flex-col items-center justify-center p-6">
```

**Changes**:
- Remove `flex gap-2` layout
- Add `border-2 border-dashed` styling
- Add `p-8` padding
- Add drag state styling
- Add keyboard handler
- Add inner `flex flex-col items-center justify-center p-6` div

---

## SECTION 2: Upload Zone Content (Lines 248-305)

### CURRENT (WRONG)
```svelte
    <button
      type="button"
      class="flex {height} flex-1 items-center justify-center rounded-lg border-2 border-dashed transition-all {isDragging
        ? 'border-rose-500 bg-rose-50'
        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'} disabled:cursor-not-allowed disabled:opacity-50"
      onclick={triggerCameraInput}
      disabled={disabled || uploading || compressing}
    >
      <div class="pointer-events-none text-center">
        {#if compressing || uploading}
          <FileUploadProgress ... />
        {:else if isDragging}
          <div>
            <Upload class="mx-auto h-8 w-8 text-rose-500" />
            <p class="mt-2 text-sm font-medium text-rose-600">Drop photo here</p>
          </div>
        {:else}
          <Camera class="mx-auto h-8 w-8 text-gray-400" />
          <p class="mt-2 text-sm text-gray-600">Take Photo</p>
        {/if}
      </div>
    </button>

    <button
      type="button"
      class="flex {height} flex-1 items-center justify-center rounded-lg border-2 border-dashed transition-all {isDragging
        ? 'border-rose-500 bg-rose-50'
        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'} disabled:cursor-not-allowed disabled:opacity-50"
      onclick={triggerFileInput}
      disabled={disabled || uploading || compressing}
    >
      <div class="pointer-events-none text-center">
        {#if compressing || uploading}
          <FileUploadProgress ... />
        {:else if isDragging}
          <div>
            <Upload class="mx-auto h-8 w-8 text-rose-500" />
            <p class="mt-2 text-sm font-medium text-rose-600">Drop photo here</p>
          </div>
        {:else}
          <Upload class="mx-auto h-8 w-8 text-gray-400" />
          <p class="mt-2 text-sm text-gray-600">Upload File</p>
          <p class="mt-1 text-xs text-gray-500">or drag & drop</p>
        {/if}
      </div>
    </button>
  </div>
```

### SHOULD BE (CORRECT)
```svelte
      {#if compressing || uploading}
        <div class="space-y-3">
          <FileUploadProgress
            isCompressing={compressing}
            isUploading={uploading}
            compressionProgress={compressionProgress}
            uploadProgress={uploadProgress}
            fileName=""
          />
        </div>
      {:else if isDragging}
        <div>
          <Upload class="mx-auto h-8 w-8 text-rose-500" />
          <p class="mt-2 text-sm font-medium text-rose-600">Drop photo here</p>
        </div>
      {:else}
        <Upload class="mx-auto h-8 w-8 text-gray-400" />
        <p class="mt-2 text-sm text-gray-600">
          Drag and drop photo or
          <button
            type="button"
            onclick={triggerFileInput}
            class="text-rose-600 hover:text-rose-700 font-medium"
          >
            browse
          </button>
        </p>
        <p class="mt-1 text-xs text-gray-500">Supports: JPG, PNG, GIF</p>
        <div class="flex gap-2 justify-center mt-4">
          <Button onclick={triggerCameraInput} variant="outline">
            <Camera class="mr-2 h-4 w-4" />
            Camera
          </Button>
          <Button onclick={triggerFileInput}>
            <Upload class="mr-2 h-4 w-4" />
            Upload Photo
          </Button>
        </div>
      {/if}
    </div>
  </div>
```

**Changes**:
- Remove two separate button elements
- Replace with single conditional content
- Add "browse" link in text
- Add "Supports: JPG, PNG, GIF" text
- Move buttons below zone in separate div
- Use Button component instead of custom styling
- Close inner and outer divs properly

---

## SECTION 3: Closing Tag (Line 306)

### CURRENT
```svelte
  </div>
{/if}
```

### SHOULD BE
```svelte
{/if}
```

**Note**: Extra closing div removed (now part of inner div structure)

---

## Summary of Changes

| Line Range | Change | Type |
|-----------|--------|------|
| 237-247 | Container layout | Structure |
| 248-305 | Content structure | Major refactor |
| 306 | Closing tags | Cleanup |

**Total Lines Changed**: ~70 lines  
**Pattern Source**: TyrePhotosPanel.svelte (lines 182-240)

---

## Validation Checklist

After refactoring:
- [ ] Container has border-2 border-dashed
- [ ] Drag state shows rose-500 border + rose-50 background
- [ ] Upload zone is centered (flex flex-col items-center justify-center)
- [ ] Buttons are below zone (not integrated)
- [ ] "browse" link is clickable
- [ ] "Supports: JPG, PNG, GIF" text visible
- [ ] FileUploadProgress shows during upload
- [ ] Camera button works
- [ ] Upload button works
- [ ] Keyboard navigation works (Enter/Space)
- [ ] Matches TyrePanel styling
- [ ] npm run check passes

