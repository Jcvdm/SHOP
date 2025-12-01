# Photo Labeling Patterns - Reusable Implementation Guide

**Created**: November 6, 2025
**Status**: Active Standard
**Related**: [photo_labeling_implementation_nov_6_2025.md](../System/photo_labeling_implementation_nov_6_2025.md), [creating-components.md](./creating-components.md)

---

## Overview

This SOP provides reusable patterns for implementing inline photo labeling functionality in other ClaimTech photo components. Based on the successful PhotoViewer implementation, these patterns ensure consistency across the application.

**Use this guide when**:
- Adding label editing to photo galleries
- Implementing photo metadata editing
- Creating new photo viewer components
- Enhancing existing photo components with labeling

---

## Quick Decision Matrix

| Component Type | Recommended Pattern | Example |
|---------------|---------------------|---------|
| **Fullscreen Viewer** | Fixed Bottom Bar | EstimatePhotosPanel → PhotoViewer |
| **Modal/Dialog** | Footer with Actions | AdditionalsPhotosPanel, PreIncidentPhotosPanel |
| **Inline Gallery** | Thumbnail Overlay | Vehicle photo grid |
| **Carousel** | Caption Bar Below | Inspection photo carousel |

---

## Pattern 1: Fixed Bottom Bar (Fullscreen Viewers)

**Best For**: Components using bigger-picture or similar fullscreen libraries

### Component Structure

```typescript
// State management
let isEditingLabel = $state(false);
let tempLabel = $state('');
let savingLabel = $state(false);
let labelError = $state<string | null>(null);

// Current item tracking (CRITICAL)
let currentIndex = $state(props.startIndex);
const currentPhoto = $derived(props.photos[currentIndex]);
```

**Key Points**:
- Use `$state` for mutable values
- Use `$derived` for computed values that depend on reactive state
- Track `currentIndex` carefully to avoid "wrong item updated" bugs

### Template Structure

```svelte
{#if isOpen && currentPhoto}
    <div class="photo-viewer-info">
        <!-- Label Editor Section -->
        {#if isEditingLabel}
            <!-- Edit Mode -->
            <div class="label-edit-container">
                <input
                    type="text"
                    class="label-input"
                    bind:value={tempLabel}
                    onkeydown={handleLabelKeydown}
                    onblur={saveLabel}
                    placeholder="Enter photo description..."
                    disabled={savingLabel}
                    maxlength="200"
                />
                <div class="edit-actions">
                    <button onclick={saveLabel} class="save-button">
                        {savingLabel ? 'Saving...' : '✓ Save'}
                    </button>
                    <button onclick={cancelEditingLabel} class="cancel-button">
                        ✕ Cancel
                    </button>
                </div>
                {#if labelError}
                    <div class="label-error">{labelError}</div>
                {/if}
            </div>
        {:else}
            <!-- View Mode -->
            <button onclick={startEditingLabel} class="photo-description">
                {currentPhoto.label || 'No description (click to add)'}
                {#if props.onLabelUpdate}
                    <span class="edit-hint">✎ Press E to edit</span>
                {/if}
            </button>
        {/if}

        <!-- Actions Row -->
        <div class="bottom-actions">
            <div class="photo-counter">{currentIndex + 1} / {props.photos.length}</div>
            <button onclick={handleDelete} class="delete-button">
                🗑️ Delete
            </button>
        </div>
    </div>
{/if}
```

### CSS Foundation

```css
.photo-viewer-info {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.92);
    color: white;
    padding: 16px 24px;
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
    border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.label-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 14px;
}

.label-input:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.8);
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.bottom-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

@media (max-width: 768px) {
    .photo-viewer-info {
        padding: 12px 16px;
    }

    .bottom-actions {
        flex-direction: column;
        gap: 8px;
    }
}
```

### Core Functions

#### 1. Start Editing

```typescript
function startEditingLabel() {
    if (!currentPhoto || !props.onLabelUpdate) return;

    tempLabel = currentPhoto.label || '';
    isEditingLabel = true;
    labelError = null;

    // Focus and select input
    setTimeout(() => {
        const input = document.querySelector('.label-input') as HTMLInputElement;
        if (input) {
            input.focus();
            input.select();
        }
    }, 50);
}
```

**Why setTimeout**: DOM needs time to render input before focusing.

#### 2. Save Label

```typescript
async function saveLabel() {
    if (!currentPhoto || !props.onLabelUpdate || savingLabel) return;

    const newLabel = tempLabel.trim();

    // Skip if no changes
    if (newLabel === (currentPhoto.label || '')) {
        cancelEditingLabel();
        return;
    }

    savingLabel = true;
    labelError = null;

    try {
        console.log('[Component] Saving label for photo:', {
            currentIndex,
            photoId: currentPhoto.id,
            currentLabel: currentPhoto.label,
            newLabel
        });

        await props.onLabelUpdate(currentPhoto.id, newLabel);
        isEditingLabel = false;
        console.log('[Component] Label updated successfully:', currentPhoto.id);
    } catch (err) {
        console.error('[Component] Error saving label:', err);
        labelError = 'Failed to save label. Please try again.';
    } finally {
        savingLabel = false;
    }
}
```

**Critical Features**:
- Log photo ID and index (debugging "wrong photo" bugs)
- Trim whitespace
- Validate no changes (prevents unnecessary DB calls)
- Comprehensive error handling
- Loading state prevents double-saves

#### 3. Cancel Editing

```typescript
function cancelEditingLabel() {
    isEditingLabel = false;
    tempLabel = '';
    labelError = null;
}
```

#### 4. Keyboard Shortcuts

```typescript
function handleLabelKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveLabel();
    } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditingLabel();
    }
}

function handleKeydown(e: KeyboardEvent) {
    if (!isOpen) return;

    // Ignore if currently editing label (except Escape)
    if (isEditingLabel && e.key !== 'Escape') return;

    if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        startEditingLabel();
    }
}

// Setup listener
onMount(() => {
    if (browser) {
        document.addEventListener('keydown', handleKeydown);
    }

    return () => {
        if (browser) {
            document.removeEventListener('keydown', handleKeydown);
        }
    };
});
```

**Keyboard Map**:
- `E` - Start editing
- `Enter` - Save (during edit)
- `Escape` - Cancel
- Arrow keys - Navigate (handled by photo library)

---

## Pattern 2: Modal Footer (Dialog-Based Viewers)

**Best For**: Components using shadcn/ui Dialog or similar modal libraries

### Component Structure

```svelte
<Dialog.Root bind:open={isViewerOpen}>
    <Dialog.Content class="max-w-4xl">
        <!-- Photo Display -->
        <div class="photo-container">
            <img src={currentPhoto.url} alt={currentPhoto.label || 'Photo'} />
        </div>

        <!-- Footer with Label Editor -->
        <Dialog.Footer>
            {#if isEditingLabel}
                <!-- Edit Mode -->
                <div class="label-editor-footer">
                    <Input
                        bind:value={tempLabel}
                        onkeydown={handleLabelKeydown}
                        placeholder="Enter photo description..."
                        disabled={savingLabel}
                        maxlength="200"
                        class="flex-1"
                    />
                    <Button onclick={saveLabel} disabled={savingLabel}>
                        {savingLabel ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" onclick={cancelEditingLabel} disabled={savingLabel}>
                        Cancel
                    </Button>
                </div>
            {:else}
                <!-- View Mode -->
                <div class="label-display-footer">
                    <button onclick={startEditingLabel} class="flex-1 text-left">
                        {currentPhoto.label || 'No description (click to add)'}
                    </button>
                    <Button variant="destructive" onclick={handleDelete}>
                        Delete
                    </Button>
                </div>
            {/if}
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
```

**Key Differences from Pattern 1**:
- Uses Dialog component instead of fixed positioning
- Leverages shadcn/ui Button and Input components
- Footer constrained by Dialog width
- Better for smaller/medium-sized photo views

---

## Pattern 3: Thumbnail Overlay (Inline Galleries)

**Best For**: Photo grids where labels appear on hover/focus

### Component Structure

```svelte
<div class="photo-grid">
    {#each photos as photo (photo.id)}
        <div class="photo-item">
            <img src={photo.url} alt={photo.label || 'Photo'} />

            <!-- Label overlay -->
            <div class="photo-overlay">
                {#if editingPhotoId === photo.id}
                    <!-- Edit Mode -->
                    <input
                        type="text"
                        bind:value={tempLabel}
                        onkeydown={(e) => handleLabelKeydown(e, photo.id)}
                        onblur={() => saveLabel(photo.id)}
                        placeholder="Label..."
                        class="label-input-overlay"
                    />
                {:else}
                    <!-- View Mode -->
                    <button
                        onclick={() => startEditingLabel(photo.id, photo.label)}
                        class="label-display-overlay"
                    >
                        {photo.label || 'Add label'}
                    </button>
                {/if}
            </div>
        </div>
    {/each}
</div>

<style>
.photo-item {
    position: relative;
}

.photo-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    padding: 8px;
}

.label-input-overlay {
    width: 100%;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 4px 8px;
    font-size: 12px;
}
</style>
```

**Key Differences**:
- Individual edit state per photo (not single `currentPhoto`)
- Inline editing without modal/fullscreen
- Compact design for grid layouts

---

## Optimistic Updates Pattern (REQUIRED)

**Use in ALL implementations** - Provides instant UI feedback

### Parent Component Implementation

```typescript
async function handleLabelUpdate(photoId: string, label: string) {
    console.log('[ParentComponent] Label update requested:', {
        photoId,
        newLabel: label,
        currentPhotos: photos.value.map((p) => ({ id: p.id, label: p.label }))
    });

    try {
        // 1. IMMEDIATE optimistic update (instant UI feedback)
        photos.update(photoId, { label });
        console.log('[ParentComponent] Optimistic update applied');

        // 2. Update database
        await photoService.updatePhotoLabel(photoId, label);
        console.log('[ParentComponent] Database updated');

        // 3. Refresh from source of truth
        await onUpdate();
        console.log('[ParentComponent] Photos refreshed from parent');

        console.log('[ParentComponent] Label update complete:', photoId);
    } catch (error) {
        console.error('[ParentComponent] Error updating label:', error);

        // Revert optimistic update on error
        await onUpdate();

        throw error; // Re-throw to let child component handle error display
    }
}
```

**Flow**:
1. **Instant UI Update**: User sees change immediately
2. **Database Update**: Persist to backend
3. **Source Refresh**: Sync with database state
4. **Error Recovery**: Revert on failure

**Benefits**:
- Zero perceived latency
- Maintains data consistency
- Graceful error handling
- Better UX than loading spinners

### Using useOptimisticArray Utility

```typescript
import { useOptimisticArray } from '$lib/utils/useOptimisticArray.svelte';

// ⚠️ CRITICAL: Pass getter function () => props.photos for reactivity
// This ensures the utility tracks changes when parent updates the prop
const photos = useOptimisticArray(() => props.photos);

// Optimistic update
photos.update(photoId, { label: 'New label' });

// Optimistic add
photos.add(newPhoto);

// Optimistic remove
photos.remove(photoId);

// Access current array
const currentPhotos = photos.value;
```

**Reactivity**: Updates to `photos.value` automatically trigger UI re-renders.

### ⚠️ CRITICAL: Getter Function Requirement

**ALWAYS pass a getter function** to `useOptimisticArray`:

```typescript
// ✅ CORRECT - Reactive
const photos = useOptimisticArray(() => props.photos);

// ❌ WRONG - Not reactive (captures initial value)
const photos = useOptimisticArray(props.photos);
```

**Why**: Svelte 5's `$effect` only tracks dependencies that are read inside the effect. The getter function ensures the utility detects when `props.photos` changes (e.g., after data loads from database).

**Bug Symptom**: Without getter function, photos won't display after page reload or tab switch, even though parent has the data.

**Root Cause**: The utility captures the initial empty array `[]` and doesn't sync when parent updates the prop with actual photos.

**Fix Applied**: November 9, 2025 - All 5 photo panels updated to use getter functions. See `.agent/Tasks/completed/OPTIMISTIC_ARRAY_BUG_FIX_RESEARCH_NOV_9_2025.md` for full technical details.

---

## Navigation Tracking Pattern (CRITICAL)

**Prevents "wrong photo updated" bug** - Use correct navigation tracking

### For bigger-picture Library

```typescript
function handlePositionUpdate(container: any, activeItem: any) {
    try {
        // ✅ CORRECT: Use container.position directly
        const newPosition = container?.position;

        if (newPosition !== undefined && newPosition !== currentIndex) {
            currentIndex = newPosition;
            console.log('[Component] Navigated to position:', currentIndex, 'Photo ID:', props.photos[currentIndex]?.id);
        }
    } catch (err) {
        console.error('[Component] Error updating position:', err);
    }
}
```

**Why This Matters**:
- Libraries often transform objects, making `indexOf()` unreliable
- Always use library's native position tracking
- Log photo ID to verify correct tracking

### ❌ INCORRECT Pattern (Don't Do This)

```typescript
// DON'T USE THIS - indexOf fails with transformed objects
function handlePositionUpdate(container: any, activeItem: any) {
    const items = container.items;
    const activeIndex = items.indexOf(activeItem); // ❌ FAILS
    if (activeIndex !== -1) {
        currentIndex = activeIndex; // Wrong index!
    }
}
```

### For Custom Carousels

```typescript
function handleNext() {
    currentIndex = Math.min(currentIndex + 1, props.photos.length - 1);
    console.log('[Component] Navigated to position:', currentIndex, 'Photo ID:', props.photos[currentIndex]?.id);
}

function handlePrevious() {
    currentIndex = Math.max(currentIndex - 1, 0);
    console.log('[Component] Navigated to position:', currentIndex, 'Photo ID:', props.photos[currentIndex]?.id);
}
```

**Key Points**:
- Bounds checking (don't go out of range)
- Log position AND photo ID
- Update `currentIndex` in state

---

## Component Communication Pattern

### Props Interface (Child Component)

```typescript
interface Props {
    photos: Photo[];
    startIndex: number;
    onClose: () => void;
    onDelete: (photoId: string, photoPath: string) => Promise<void>;
    onLabelUpdate?: (photoId: string, label: string) => Promise<void>; // Optional for backward compatibility
}

let props: Props = $props();
```

**Key Points**:
- `onLabelUpdate` is optional (component works without it)
- Async callbacks (parent handles database operations)
- Strong typing with TypeScript

### Callback Usage (Child Component)

```typescript
// Check if callback is provided
if (!props.onLabelUpdate) {
    console.warn('[Component] onLabelUpdate not provided - label editing disabled');
    return;
}

// Invoke callback
try {
    await props.onLabelUpdate(currentPhoto.id, newLabel);
} catch (error) {
    // Parent throws error, child displays it
    labelError = 'Failed to save label. Please try again.';
}
```

### Parent Implementation

```typescript
import PhotoViewer from '$lib/components/photo-viewer/PhotoViewer.svelte';

let selectedPhotoIndex = $state<number | null>(null);

function openPhotoViewer(index: number) {
    selectedPhotoIndex = index;
}

function closePhotoViewer() {
    selectedPhotoIndex = null;
}

async function handleLabelUpdate(photoId: string, label: string) {
    // Optimistic update + database + refresh
    photos.update(photoId, { label });
    await photoService.updatePhotoLabel(photoId, label);
    await onUpdate();
}

<!-- Template -->
{#if selectedPhotoIndex !== null}
    <PhotoViewer
        photos={photos.value}
        startIndex={selectedPhotoIndex}
        onClose={closePhotoViewer}
        onDelete={handlePhotoDelete}
        onLabelUpdate={handleLabelUpdate}
    />
{/if}
```

**Pattern**: Props down (data + callbacks), events up (callbacks invoked)

---

## Comprehensive Logging Pattern

**Add logging at critical points** - Essential for debugging

### Standard Log Format

```typescript
console.log('[ComponentName] Action:', {
    currentIndex,
    photoId: currentPhoto.id,
    relevantState: value
});
```

### Recommended Log Points

#### 1. Navigation Events

```typescript
function handlePositionUpdate(container: any, activeItem: any) {
    const newPosition = container?.position;
    if (newPosition !== undefined && newPosition !== currentIndex) {
        currentIndex = newPosition;
        console.log('[PhotoViewer] Navigated to position:', currentIndex, 'Photo ID:', props.photos[currentIndex]?.id);
    }
}
```

#### 2. Label Save Operations

```typescript
async function saveLabel() {
    console.log('[PhotoViewer] Saving label for photo:', {
        currentIndex,
        photoId: currentPhoto.id,
        currentLabel: currentPhoto.label,
        newLabel
    });

    await props.onLabelUpdate(currentPhoto.id, newLabel);

    console.log('[PhotoViewer] Label updated successfully:', currentPhoto.id);
}
```

#### 3. Parent Update Handler

```typescript
async function handleLabelUpdate(photoId: string, label: string) {
    console.log('[EstimatePhotosPanel] Label update requested:', {
        photoId,
        newLabel: label,
        currentPhotos: photos.value.map((p) => ({ id: p.id, label: p.label }))
    });

    photos.update(photoId, { label });
    console.log('[EstimatePhotosPanel] Optimistic update applied');

    await estimatePhotosService.updatePhotoLabel(photoId, label);
    console.log('[EstimatePhotosPanel] Database updated');

    await onUpdate();
    console.log('[EstimatePhotosPanel] Photos refreshed from parent');
}
```

#### 4. Error Cases

```typescript
catch (err) {
    console.error('[PhotoViewer] Error saving label:', err);
    labelError = 'Failed to save label. Please try again.';
}
```

**Benefits**:
- Easy to trace data flow
- Quick identification of "wrong photo" bugs
- Verify navigation tracking
- Debug state synchronization issues

---

## Testing Checklist

Use this checklist for ALL photo labeling implementations:

### Basic Functionality
- [ ] Can enter edit mode (click or press E)
- [ ] Can type label (200 char limit)
- [ ] Can save with Enter key
- [ ] Can save with Save button
- [ ] Can cancel with Escape key
- [ ] Can cancel with Cancel button
- [ ] Label updates immediately (optimistic update)
- [ ] Label persists after closing viewer
- [ ] Label survives page refresh

### Navigation Tracking (CRITICAL)
- [ ] Open viewer on first photo
- [ ] Navigate to third photo (arrow keys or buttons)
- [ ] Edit label
- [ ] Verify console: `currentIndex` should be 2
- [ ] Verify console: `photoId` matches third photo's ID
- [ ] Check database: Correct photo updated
- [ ] Close and reopen viewer: Correct photo shows label

### Multiple Photos
- [ ] Label multiple photos in single session
- [ ] Each photo gets correct label
- [ ] No cross-contamination between photos
- [ ] Thumbnails all show correct labels

### Error Handling
- [ ] Network failure shows error message
- [ ] Failed save doesn't lose user's input
- [ ] Error recovery allows retry
- [ ] Optimistic update reverts on error

### Mobile Responsive (if applicable)
- [ ] Layout adapts on mobile viewport (< 768px)
- [ ] Touch interactions work
- [ ] Input remains usable
- [ ] Buttons are appropriately sized

### Keyboard Accessibility
- [ ] Tab navigation works
- [ ] Keyboard shortcuts work (E, Enter, Escape)
- [ ] Screen reader accessible
- [ ] Focus states visible

---

## Common Mistakes to Avoid

### 1. Using indexOf() for Navigation Tracking

❌ **WRONG**:
```typescript
const activeIndex = items.indexOf(activeItem); // Fails with transformed objects
```

✅ **CORRECT**:
```typescript
const newPosition = container?.position; // Use library's native position
```

### 2. Not Using Optimistic Updates

❌ **WRONG**:
```typescript
await photoService.updatePhotoLabel(photoId, label); // User waits
await onUpdate(); // Then UI updates
```

✅ **CORRECT**:
```typescript
photos.update(photoId, { label }); // UI updates instantly
await photoService.updatePhotoLabel(photoId, label); // Then DB
await onUpdate(); // Then sync
```

### 3. Not Logging Photo IDs

❌ **WRONG**:
```typescript
console.log('Saving label'); // No context
```

✅ **CORRECT**:
```typescript
console.log('[Component] Saving label for photo:', {
    currentIndex,
    photoId: currentPhoto.id,
    newLabel
});
```

### 4. Direct State Mutation Instead of $state

❌ **WRONG**:
```typescript
let currentIndex = props.startIndex; // Not reactive!
currentIndex = 2; // No re-render
```

✅ **CORRECT**:
```typescript
let currentIndex = $state(props.startIndex); // Reactive
currentIndex = 2; // Triggers re-render
```

### 5. Not Using $derived for Computed Values

❌ **WRONG**:
```typescript
let currentPhoto = props.photos[currentIndex]; // Stale closure
```

✅ **CORRECT**:
```typescript
const currentPhoto = $derived(props.photos[currentIndex]); // Auto-updates
```

### 6. Missing Error Recovery

❌ **WRONG**:
```typescript
try {
    photos.update(photoId, { label });
    await service.updatePhotoLabel(photoId, label);
} catch (error) {
    alert('Error'); // Optimistic update not reverted!
}
```

✅ **CORRECT**:
```typescript
try {
    photos.update(photoId, { label });
    await service.updatePhotoLabel(photoId, label);
} catch (error) {
    await onUpdate(); // Revert optimistic update
    throw error;
}
```

---

## Integration with Existing Services

### Photo Service Pattern

All photo services should implement:

```typescript
export class PhotoService extends BaseService {
    // ... other methods

    /**
     * Update photo label
     * @param photoId - Photo UUID
     * @param label - New label text (max 200 chars)
     * @returns Updated photo record
     */
    async updatePhotoLabel(photoId: string, label: string): Promise<Photo> {
        const { data, error } = await this.client
            .from('photos') // Replace with actual table name
            .update({ label: label.trim() })
            .eq('id', photoId)
            .select()
            .single();

        if (error) {
            console.error('[PhotoService] Error updating label:', error);
            throw error;
        }

        // Log audit trail
        await this.logAudit({
            entity_id: photoId,
            entity_type: 'photo',
            action: 'update',
            action_details: 'Updated photo label',
            metadata: { label }
        });

        return data;
    }
}
```

**Key Points**:
- Trim whitespace
- Single record return
- Error logging
- Audit trail
- TypeScript typing

### Table Schema Requirements

Ensure photo tables have:

```sql
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- ... other columns
    label TEXT, -- Photo description/label
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE TRIGGER update_photos_updated_at
    BEFORE UPDATE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Real-World Implementation Examples

### Example 1: EstimatePhotosPanel (Fullscreen)

**Context**: Large estimate photos viewed fullscreen with bigger-picture

**Implementation**:
- Pattern 1: Fixed Bottom Bar
- Optimistic updates via useOptimisticArray
- Keyboard shortcuts (E, Enter, Escape, Delete)
- Navigation tracking via container.position

**Files**:
- `src/lib/components/photo-viewer/PhotoViewer.svelte` (child)
- `src/lib/components/assessment/EstimatePhotosPanel.svelte` (parent)
- `src/lib/services/estimate-photos.service.ts` (service)

**Lessons Learned**:
- Fixed bottom bar more professional than floating overlay
- Comprehensive logging essential for debugging
- Navigation tracking must use library's native API

### Example 2: AdditionalsPhotosPanel (Modal)

**Context**: Additional damage photos in Dialog modal

**Implementation**:
- Pattern 2: Modal Footer
- shadcn/ui Dialog component
- Smaller image display (doesn't need fullscreen)

**Files**:
- `src/lib/components/assessment/AdditionalsPhotosPanel.svelte`

**Why Different**: Smaller photos don't need fullscreen immersive experience. Dialog is more appropriate.

### Example 3: Vehicle Photo Grid (Inline)

**Context**: Multiple vehicle photos in grid layout

**Implementation**:
- Pattern 3: Thumbnail Overlay
- Inline editing without modal
- Hover to reveal label editor

**Files**:
- `src/lib/components/vehicle/VehiclePhotoGrid.svelte`

**Use Case**: Quick labeling of many photos without opening viewer.

---

## Migration Guide

### Upgrading Existing Components

#### Step 1: Add State Management

```typescript
// Add to component script
let isEditingLabel = $state(false);
let tempLabel = $state('');
let savingLabel = $state(false);
let labelError = $state<string | null>(null);
```

#### Step 2: Add Props Interface

```typescript
interface Props {
    // ... existing props
    onLabelUpdate?: (photoId: string, label: string) => Promise<void>;
}
```

#### Step 3: Implement Core Functions

Copy from Pattern 1, 2, or 3 depending on component type:
- `startEditingLabel()`
- `saveLabel()`
- `cancelEditingLabel()`
- `handleLabelKeydown()`

#### Step 4: Update Template

Add label editor UI based on chosen pattern.

#### Step 5: Wire Up Parent

```typescript
// In parent component
async function handleLabelUpdate(photoId: string, label: string) {
    photos.update(photoId, { label });
    await photoService.updatePhotoLabel(photoId, label);
    await onUpdate();
}

// Pass to child
<PhotoComponent
    {...existingProps}
    onLabelUpdate={handleLabelUpdate}
/>
```

#### Step 6: Test

Run through testing checklist (above).

---

## Performance Considerations

### 1. Debounce for Auto-Save (Optional)

If implementing auto-save on input change:

```typescript
import { debounce } from '$lib/utils/debounce';

const debouncedSave = debounce(async (photoId: string, label: string) => {
    await props.onLabelUpdate(photoId, label);
}, 500);

function handleInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    tempLabel = value;
    debouncedSave(currentPhoto.id, value);
}
```

**Tradeoff**: Better UX (no explicit save) but more database calls.

### 2. Batch Updates (Advanced)

For bulk labeling operations:

```typescript
async function saveBulkLabels(updates: Array<{ id: string; label: string }>) {
    // Optimistic update all
    updates.forEach(({ id, label }) => photos.update(id, { label }));

    // Batch database update
    await photoService.updatePhotoLabelsBatch(updates);

    // Single refresh
    await onUpdate();
}
```

### 3. Virtual Scrolling for Large Sets

For components with 100+ photos, use virtual scrolling:

```typescript
import { VirtualList } from 'svelte-virtual-list';

<VirtualList items={photos.value} let:item>
    <PhotoItem photo={item} onLabelUpdate={handleLabelUpdate} />
</VirtualList>
```

---

## Related Documentation

### System Documentation
- **[Photo Labeling Implementation](../System/photo_labeling_implementation_nov_6_2025.md)** - Complete implementation details, bug fixes
- **[UI Loading Patterns](../System/ui_loading_patterns.md)** - Optimistic updates pattern
- **[Project Architecture](../System/project_architecture.md)** - Storage architecture

### Standard Operating Procedures
- **[Creating Components](./creating-components.md)** - Svelte 5 component patterns
- **[Working with Services](./working_with_services.md)** - Service layer patterns

### Code Examples
- `src/lib/components/photo-viewer/PhotoViewer.svelte` - Reference implementation
- `src/lib/components/assessment/EstimatePhotosPanel.svelte` - Parent component example
- `src/lib/utils/useOptimisticArray.svelte.ts` - Optimistic update utility

---

## Support and Troubleshooting

### Issue: Wrong Photo Gets Updated

**Symptoms**: Edit photo #3, but photo #1 gets the label

**Cause**: Navigation tracking not working correctly

**Fix**:
1. Check `handlePositionUpdate` (or equivalent) function
2. Verify using library's native position API
3. Add logging: `console.log('currentIndex:', currentIndex, 'photoId:', currentPhoto.id)`
4. Ensure `$derived` used for `currentPhoto`

### Issue: Thumbnails Don't Update

**Symptoms**: Label saves but thumbnails show old label

**Cause 1**: Not using optimistic updates

**Fix**: Add `photos.update(photoId, { label })` before database call

**Cause 2**: Parent not passing updated photos

**Fix**: Ensure parent calls `onUpdate()` after database update

### Issue: Label Edit Mode Stuck

**Symptoms**: Can't exit edit mode, or stuck in edit mode

**Cause**: State not resetting properly

**Fix**:
```typescript
function cancelEditingLabel() {
    isEditingLabel = false;
    tempLabel = '';
    labelError = null; // Don't forget to clear errors
}
```

### Issue: Input Not Focusing

**Symptoms**: Click to edit but input doesn't focus

**Cause**: DOM not ready when focus() called

**Fix**:
```typescript
setTimeout(() => {
    const input = document.querySelector('.label-input') as HTMLInputElement;
    if (input) {
        input.focus();
        input.select();
    }
}, 50); // Give DOM time to render
```

---

**Document Maintainer**: ClaimTech Engineering Team
**Last Review**: November 6, 2025
**Next Review**: After 3rd implementation using this guide
