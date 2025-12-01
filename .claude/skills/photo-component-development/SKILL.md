# Photo Component Development Skill

**Specialized patterns for implementing photo components with inline editing, optimistic updates, and navigation tracking. Ensures consistent photo management across ClaimTech's assessment platform, preventing common bugs and delivering professional user experiences.**

---

## Skill Overview

### Purpose
Provides proven patterns for implementing photo viewing, editing, and management features in ClaimTech. Focuses on preventing critical bugs (like "wrong photo updated"), delivering instant UI feedback through optimistic updates, and maintaining professional UX standards.

### When This Skill Auto-Invokes

This skill automatically activates when you're working with:
- Photo viewer components (fullscreen, modal, inline)
- Inline photo label editing
- Photo galleries with metadata
- Navigation tracking in image carousels
- Optimistic updates for photo data
- Keyboard shortcuts for photo editing
- Photo component debugging

**Keywords:** photo, image, label, gallery, viewer, thumbnail, carousel, inline edit, navigation tracking, optimistic update, bigger-picture

### Scope

**Included:**
- Photo viewer component patterns (3 core patterns)
- Inline label editing functionality
- Optimistic update patterns (instant UI feedback)
- Navigation tracking (preventing "wrong photo" bugs)
- Component communication (parent-child callbacks)
- Keyboard shortcuts for photo editing
- Photo service integration
- Testing requirements for photo features

**Not Included:**
- Photo upload implementation → Use storage patterns from supabase-development
- Image processing/compression → Separate concern
- PDF generation with photos → Use claimtech-development PDF patterns
- General Svelte component patterns → Use claimtech-development
- Database schema design → Use supabase-development

### Integration with Other Skills

**Works Alongside:**
- **claimtech-development**: General SvelteKit patterns, overall feature workflow
- **supabase-development**: Photo storage, database operations, service layer
- **assessment-centric-specialist**: When photos are part of assessment workflow

**Typical Flow:**
```
claimtech-development (feature planning)
    ↓
photo-component-development (photo component implementation)
    ↓
supabase-development (storage & database)
    ↓
claimtech-development (testing & deployment)
```

---

## Quick Decision Matrix

**Choose the right pattern for your photo component:**

| Component Context | Pattern | Best For | Example |
|------------------|---------|----------|---------|
| **Fullscreen Library** (bigger-picture) | Fixed Bottom Bar | Large photos requiring immersive viewing | EstimatePhotosPanel |
| **Modal Dialog** (shadcn/ui) | Modal Footer | Medium photos in constrained space | AdditionalsPhotosPanel |
| **Grid Gallery** (thumbnails) | Thumbnail Overlay | Quick labeling of many photos | Vehicle photo grid |
| **Custom Carousel** | Caption Bar Below | Sequential photo viewing | Inspection photos |

### Decision Tree

```
Does your component use a fullscreen photo library?
├─ YES → Use Pattern 1: Fixed Bottom Bar
│        Best with: bigger-picture, PhotoSwipe, similar libraries
│        Example: EstimatePhotosPanel
│
└─ NO → Is it a modal/dialog component?
        ├─ YES → Use Pattern 2: Modal Footer
        │        Best with: shadcn/ui Dialog, similar modals
        │        Example: AdditionalsPhotosPanel
        │
        └─ NO → Use Pattern 3: Thumbnail Overlay
                 Best for: Inline grids, compact galleries
                 Example: Vehicle photo grid
```

### When Each Pattern Works Best

**Pattern 1: Fixed Bottom Bar**
- ✅ Large photos (estimates, damage documentation)
- ✅ Immersive fullscreen viewing experience
- ✅ Professional appearance required
- ✅ Using libraries like bigger-picture
- ❌ Small thumbnails or compact layouts

**Pattern 2: Modal Footer**
- ✅ Medium-sized photos in modals
- ✅ Using UI component libraries (shadcn/ui)
- ✅ Constrained dialog space
- ✅ Consistent with existing modal patterns
- ❌ Fullscreen immersive viewing needed

**Pattern 3: Thumbnail Overlay**
- ✅ Many photos in grid layout
- ✅ Quick labeling without opening viewer
- ✅ Hover-to-reveal interactions
- ✅ Space-efficient design
- ❌ Detailed viewing or editing needed

---

## Core Principles (REQUIRED FOR ALL PATTERNS)

### Principle 1: Optimistic Updates (REQUIRED)

**What:** Update UI immediately, then persist to database, then refresh from source of truth.

**Why:** Provides instant user feedback with zero perceived latency. Users see changes immediately while database operations happen in background.

**Standard Flow:**
```typescript
async function handleLabelUpdate(photoId: string, label: string) {
    try {
        // 1. IMMEDIATE optimistic update (instant UI)
        photos.update(photoId, { label });
        console.log('[Component] Optimistic update applied');

        // 2. Persist to database
        await photoService.updatePhotoLabel(photoId, label);
        console.log('[Component] Database updated');

        // 3. Refresh from source of truth
        await onUpdate();
        console.log('[Component] Refreshed from parent');
    } catch (error) {
        console.error('[Component] Error:', error);
        // CRITICAL: Revert optimistic update on error
        await onUpdate();
        throw error; // Let child component show error
    }
}
```

**Key Requirements:**
- ✅ Update local state FIRST (instant UI)
- ✅ Database update SECOND (persist)
- ✅ Refresh from parent THIRD (sync)
- ✅ Revert on error (maintain consistency)
- ✅ Log at each step (debugging)

**Benefits:**
- Zero perceived latency for users
- Professional, responsive feel
- Graceful error recovery
- Data consistency maintained

**Common Mistake:**
```typescript
// ❌ WRONG: User waits for database
await photoService.updatePhotoLabel(photoId, label);
await onUpdate(); // UI updates last

// ✅ CORRECT: UI updates first
photos.update(photoId, { label }); // Instant!
await photoService.updatePhotoLabel(photoId, label);
await onUpdate();
```

---

### Principle 2: Navigation Tracking (CRITICAL)

**What:** Track which photo is currently displayed using the library's native position API.

**Why:** Libraries often transform objects, making `indexOf()` unreliable. Using native APIs prevents the critical "wrong photo updated" bug.

**Correct Pattern (bigger-picture):**
```typescript
function handlePositionUpdate(container: any, activeItem: any) {
    try {
        // ✅ CORRECT: Use library's native position
        const newPosition = container?.position;

        if (newPosition !== undefined && newPosition !== currentIndex) {
            currentIndex = newPosition;

            // CRITICAL: Always log photo ID for verification
            console.log(
                '[PhotoViewer] Navigated to position:',
                currentIndex,
                'Photo ID:',
                props.photos[currentIndex]?.id
            );
        }
    } catch (err) {
        console.error('[PhotoViewer] Error updating position:', err);
    }
}
```

**Incorrect Pattern (Anti-Pattern):**
```typescript
// ❌ WRONG: indexOf fails with transformed objects
function handlePositionUpdate(container: any, activeItem: any) {
    const items = container.items;
    const activeIndex = items.indexOf(activeItem); // FAILS!

    if (activeIndex !== -1) {
        currentIndex = activeIndex; // Wrong index!
    }
}
```

**Why indexOf() Fails:**
1. Libraries transform item objects (add properties, wrap in proxies)
2. Object reference comparison fails
3. Returns -1 (not found)
4. `currentIndex` never updates
5. Always points to first photo (index 0)
6. Wrong photo gets updated

**Key Requirements:**
- ✅ Use library's native position/index API
- ✅ Log photo ID at every navigation
- ✅ Verify in console during testing
- ❌ Never use `indexOf()` for position tracking
- ❌ Never compare object references

**Verification:**
```typescript
// Expected console output when navigating to third photo:
// [PhotoViewer] Navigated to position: 2 Photo ID: abc-123-def-456

// If you see same photo ID every time → Navigation tracking broken!
```

---

### Principle 3: Component Communication (Props Down, Events Up)

**What:** Parent components pass data and callbacks as props. Child components invoke callbacks to communicate changes upward.

**Why:** Clear data flow, reusable components, TypeScript safety, easier testing.

**Props Interface (Child Component):**
```typescript
interface Props {
    photos: Photo[];
    startIndex: number;
    onClose: () => void;
    onDelete: (photoId: string, photoPath: string) => Promise<void>;
    onLabelUpdate?: (photoId: string, label: string) => Promise<void>; // Optional
}

let props: Props = $props();
```

**Key Patterns:**
- Make callbacks optional for backward compatibility
- Use `Promise<void>` for async operations
- Parent handles all database operations
- Child only displays UI and invokes callbacks

**Callback Usage (Child Component):**
```typescript
async function saveLabel() {
    if (!currentPhoto || !props.onLabelUpdate) {
        console.warn('[Component] onLabelUpdate not provided');
        return;
    }

    try {
        // Invoke parent callback
        await props.onLabelUpdate(currentPhoto.id, newLabel);
        isEditingLabel = false;
    } catch (error) {
        // Parent threw error, child displays it
        labelError = 'Failed to save label. Please try again.';
    }
}
```

**Parent Implementation:**
```typescript
import PhotoViewer from '$lib/components/photo-viewer/PhotoViewer.svelte';

async function handleLabelUpdate(photoId: string, label: string) {
    // Parent owns the data flow
    photos.update(photoId, { label });
    await photoService.updatePhotoLabel(photoId, label);
    await onUpdate();
}

<!-- Pass callback as prop -->
<PhotoViewer
    photos={photos.value}
    startIndex={selectedPhotoIndex}
    onClose={closePhotoViewer}
    onLabelUpdate={handleLabelUpdate}
/>
```

**Benefits:**
- Clear separation of concerns
- Child component is reusable
- Parent maintains control of data
- TypeScript enforces contracts
- Easy to test each layer

---

### Principle 4: Keyboard Accessibility (Standard Shortcuts)

**What:** Provide keyboard shortcuts for all photo editing actions.

**Why:** Faster for power users, accessible for keyboard-only users, professional application feel.

**Standard Shortcuts:**
- `E` - Start editing label
- `Enter` - Save label (during edit)
- `Escape` - Cancel editing
- `Delete` - Delete current photo
- `Arrow Keys` - Navigate photos (library handles)

**Implementation:**
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

    // Ignore if currently editing (except Escape)
    if (isEditingLabel && e.key !== 'Escape') return;

    if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        startEditingLabel();
    } else if (e.key === 'Delete') {
        e.preventDefault();
        handleDelete();
    }
}

// Setup keyboard listener
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

**Key Requirements:**
- ✅ Call `preventDefault()` to avoid browser defaults
- ✅ Check `isOpen` state before handling
- ✅ Ignore shortcuts during editing (except Escape)
- ✅ Cleanup listeners in `onMount` return
- ✅ Show hints in UI ("Press E to edit")

**UI Hints:**
```svelte
<button onclick={startEditingLabel} class="photo-description">
    {currentPhoto.label || 'No description (click to add)'}
    {#if props.onLabelUpdate}
        <span class="edit-hint">✎ Press E to edit</span>
    {/if}
</button>
```

---

### Principle 5: Comprehensive Logging (Debug-Friendly)

**What:** Log at all critical points with consistent format including photo IDs.

**Why:** Prevents and debugs "wrong photo" bugs, tracks data flow, essential for troubleshooting.

**Standard Format:**
```typescript
console.log('[ComponentName] Action:', {
    currentIndex,
    photoId: currentPhoto.id,
    relevantState: value
});
```

**Required Log Points:**

**1. Navigation Events:**
```typescript
console.log('[PhotoViewer] Navigated to position:', currentIndex, 'Photo ID:', photo.id);
```

**2. Label Save Operations:**
```typescript
console.log('[PhotoViewer] Saving label for photo:', {
    currentIndex,
    photoId: currentPhoto.id,
    currentLabel: currentPhoto.label,
    newLabel
});
```

**3. Parent Update Handler:**
```typescript
console.log('[EstimatePhotosPanel] Label update requested:', {
    photoId,
    newLabel: label,
    currentPhotos: photos.value.map((p) => ({ id: p.id, label: p.label }))
});
```

**4. Error Cases:**
```typescript
console.error('[PhotoViewer] Error saving label:', err);
```

**Benefits:**
- Easy to verify correct photo ID
- Track data flow across components
- Debug navigation tracking issues
- Identify optimistic update problems
- Production-ready debugging

**Verification Example:**
```
// Expected flow when editing third photo:
[PhotoViewer] Navigated to position: 2 Photo ID: abc-123
[PhotoViewer] Saving label for photo: { currentIndex: 2, photoId: 'abc-123', newLabel: 'New label' }
[EstimatePhotosPanel] Label update requested: { photoId: 'abc-123', newLabel: 'New label' }
[EstimatePhotosPanel] Optimistic update applied
[EstimatePhotosPanel] Database updated
[PhotoViewer] Label updated successfully: abc-123

// If you see different photo ID than expected → Navigation bug!
```

---

## Pattern 1: Fixed Bottom Bar (Fullscreen Viewers)

**Best For:** Components using bigger-picture or similar fullscreen photo libraries. Provides immersive viewing experience with professional fixed bottom bar UI.

### When to Use This Pattern

✅ **Use When:**
- Using bigger-picture, PhotoSwipe, or similar fullscreen libraries
- Large photos requiring immersive viewing (estimates, damage documentation)
- Professional appearance is priority
- Full viewport should be dedicated to photo
- Example: EstimatePhotosPanel

❌ **Don't Use When:**
- Small thumbnails or compact layouts
- Modal/dialog-based viewing (use Pattern 2)
- Inline grid without fullscreen (use Pattern 3)

### Component Structure

**State Management (Svelte 5 Runes):**
```typescript
// Current photo tracking (CRITICAL for preventing bugs)
let currentIndex = $state(props.startIndex);
const currentPhoto = $derived(props.photos[currentIndex]); // Auto-updates!

// Label editing state
let isEditingLabel = $state(false);
let tempLabel = $state('');
let savingLabel = $state(false);
let labelError = $state<string | null>(null);

// Viewer state
let isOpen = $state(false);
let error = $state<string | null>(null);
```

**Why This Works:**
- `$state` for mutable values (reactive)
- `$derived` for computed values (auto-updates when dependencies change)
- `currentPhoto` automatically updates when `currentIndex` or `props.photos` changes
- Prevents stale closures and "wrong photo" bugs

### Template Structure

```svelte
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import type { Photo } from '$lib/types';

    interface Props {
        photos: Photo[];
        startIndex: number;
        onClose: () => void;
        onDelete: (photoId: string, photoPath: string) => Promise<void>;
        onLabelUpdate?: (photoId: string, label: string) => Promise<void>;
    }

    let props: Props = $props();

    // State (see above)
    let currentIndex = $state(props.startIndex);
    const currentPhoto = $derived(props.photos[currentIndex]);
    // ... other state

    // Initialize library
    let bp: any = null;
    let BiggerPicture: any;

    onMount(async () => {
        if (!browser) return;

        const biggerPictureModule = await import('bigger-picture');
        BiggerPicture = biggerPictureModule.default;

        bp = BiggerPicture({ target: document.body });
        openViewer();
    });

    onDestroy(() => {
        if (bp) bp.close();
    });

    // Open viewer
    function openViewer() {
        if (!bp || !browser) return;

        isOpen = true;
        error = null;

        bp.open({
            items: props.photos.map((photo) => ({
                img: photo.url,
                thumb: photo.url,
                alt: photo.label || 'Photo',
                caption: photo.label || ''
            })),
            position: currentIndex,
            intro: 'fadeup',
            onClose: handleClose,
            onUpdate: handlePositionUpdate
        });
    }

    // CRITICAL: Navigation tracking
    function handlePositionUpdate(container: any, activeItem: any) {
        try {
            const newPosition = container?.position;

            if (newPosition !== undefined && newPosition !== currentIndex) {
                currentIndex = newPosition;
                console.log(
                    '[PhotoViewer] Navigated to position:',
                    currentIndex,
                    'Photo ID:',
                    props.photos[currentIndex]?.id
                );
            }
        } catch (err) {
            console.error('[PhotoViewer] Error updating position:', err);
        }
    }

    // Close handler
    function handleClose() {
        isOpen = false;
        props.onClose();
    }

    // Label editing functions (see below)
    // ...
</script>

<!-- Fixed Bottom Bar UI -->
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
                    <button
                        onclick={saveLabel}
                        disabled={savingLabel}
                        class="save-button"
                        type="button"
                    >
                        {savingLabel ? 'Saving...' : '✓ Save'}
                    </button>
                    <button
                        onclick={cancelEditingLabel}
                        disabled={savingLabel}
                        class="cancel-button"
                        type="button"
                    >
                        ✕ Cancel
                    </button>
                </div>
                {#if labelError}
                    <div class="label-error">{labelError}</div>
                {/if}
            </div>
        {:else}
            <!-- View Mode - Clickable to Edit -->
            <button
                onclick={startEditingLabel}
                class="photo-description"
                class:has-label={currentPhoto.label}
                disabled={!props.onLabelUpdate}
                type="button"
            >
                {currentPhoto.label || 'No description (click to add)'}
                {#if props.onLabelUpdate}
                    <span class="edit-hint">✎ Press E to edit</span>
                {/if}
            </button>
        {/if}

        <!-- Bottom Actions Row -->
        <div class="bottom-actions">
            <div class="photo-counter">
                {currentIndex + 1} / {props.photos.length}
            </div>
            <button
                onclick={handleDelete}
                disabled={isDeleting}
                class="delete-button"
                title="Delete Photo (Delete key)"
                type="button"
            >
                {isDeleting ? 'Deleting...' : '🗑️ Delete'}
            </button>
        </div>
    </div>
{/if}

<style>
    /* See CSS section below */
</style>
```

### Core Functions

#### Start Editing Label

```typescript
function startEditingLabel() {
    if (!currentPhoto || !props.onLabelUpdate) {
        console.warn('[PhotoViewer] onLabelUpdate not provided');
        return;
    }

    tempLabel = currentPhoto.label || '';
    isEditingLabel = true;
    labelError = null;

    // Focus and select input (needs setTimeout for DOM)
    setTimeout(() => {
        const input = document.querySelector('.label-input') as HTMLInputElement;
        if (input) {
            input.focus();
            input.select(); // Select all for easy editing
        }
    }, 50);
}
```

**Key Points:**
- Check callback exists (optional prop)
- Initialize temp label with current value
- Clear any previous errors
- Focus input after DOM renders
- Select all text for easy editing

#### Save Label

```typescript
async function saveLabel() {
    if (!currentPhoto || !props.onLabelUpdate || savingLabel) return;

    const newLabel = tempLabel.trim();

    // Skip if no changes (prevents unnecessary DB calls)
    if (newLabel === (currentPhoto.label || '')) {
        cancelEditingLabel();
        return;
    }

    savingLabel = true;
    labelError = null;

    try {
        console.log('[PhotoViewer] Saving label for photo:', {
            currentIndex,
            photoId: currentPhoto.id,
            currentLabel: currentPhoto.label,
            newLabel
        });

        // Invoke parent callback (optimistic update happens in parent)
        await props.onLabelUpdate(currentPhoto.id, newLabel);

        isEditingLabel = false;
        console.log('[PhotoViewer] Label updated successfully:', currentPhoto.id);
    } catch (err) {
        console.error('[PhotoViewer] Error saving label:', err);
        labelError = 'Failed to save label. Please try again.';
    } finally {
        savingLabel = false;
    }
}
```

**Key Points:**
- Validate before saving (no-op if no changes)
- Trim whitespace
- Comprehensive logging with photo ID
- Loading state prevents double-saves
- Error display in UI (not just console)
- Cleanup in finally block

#### Cancel Editing

```typescript
function cancelEditingLabel() {
    isEditingLabel = false;
    tempLabel = '';
    labelError = null;
}
```

#### Keyboard Handlers

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

    // Ignore if currently editing (except Escape)
    if (isEditingLabel && e.key !== 'Escape') return;

    if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        startEditingLabel();
    } else if (e.key === 'Delete') {
        e.preventDefault();
        handleDelete();
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

### CSS Foundation

```css
/* Fixed Bottom Bar */
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
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: auto;
}

/* Label Input */
.label-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.label-input:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.8);
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.label-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.label-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
}

/* Edit Actions */
.edit-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
}

.save-button,
.cancel-button {
    padding: 6px 14px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.save-button {
    background: rgba(34, 197, 94, 0.9);
    color: white;
}

.save-button:hover:not(:disabled) {
    background: rgba(34, 197, 94, 1);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
}

.cancel-button {
    background: rgba(100, 116, 139, 0.9);
    color: white;
}

.cancel-button:hover:not(:disabled) {
    background: rgba(100, 116, 139, 1);
    transform: translateY(-1px);
}

.save-button:disabled,
.cancel-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Photo Description (View Mode) */
.photo-description {
    font-size: 14px;
    font-weight: 500;
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 6px;
    transition: all 0.2s ease;
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.photo-description:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
}

.photo-description:disabled {
    cursor: default;
}

.photo-description.has-label {
    font-weight: 600;
}

.edit-hint {
    font-size: 11px;
    opacity: 0.6;
    font-weight: 400;
}

/* Bottom Actions Row */
.bottom-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

.photo-counter {
    font-size: 12px;
    opacity: 0.7;
}

.delete-button {
    background: rgba(239, 68, 68, 0.9);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.delete-button:hover:not(:disabled) {
    background: rgba(239, 68, 68, 1);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}

.delete-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Error Display */
.label-error {
    color: #fca5a5;
    font-size: 11px;
    margin-top: 4px;
    font-weight: 500;
}

/* Responsive: Mobile */
@media (max-width: 768px) {
    .photo-viewer-info {
        padding: 12px 16px;
    }

    .photo-description {
        font-size: 12px;
    }

    .photo-counter {
        font-size: 11px;
    }

    .delete-button {
        padding: 6px 12px;
        font-size: 12px;
    }

    .bottom-actions {
        flex-direction: column;
        gap: 8px;
    }
}

/* Ensure bigger-picture styles work */
:global(.bp-wrap) {
    z-index: 999;
}
```

### Integration with Parent

**Parent Component Setup:**

```typescript
import PhotoViewer from '$lib/components/photo-viewer/PhotoViewer.svelte';
import { useOptimisticArray } from '$lib/utils/useOptimisticArray.svelte';

// Use optimistic array for instant updates
const photos = useOptimisticArray(props.photos);

let selectedPhotoIndex = $state<number | null>(null);

function openPhotoViewer(index: number) {
    selectedPhotoIndex = index;
}

function closePhotoViewer() {
    selectedPhotoIndex = null;
}

async function handleLabelUpdate(photoId: string, label: string) {
    console.log('[ParentComponent] Label update requested:', { photoId, newLabel: label });

    try {
        // 1. Optimistic update
        photos.update(photoId, { label });
        console.log('[ParentComponent] Optimistic update applied');

        // 2. Database update
        await photoService.updatePhotoLabel(photoId, label);
        console.log('[ParentComponent] Database updated');

        // 3. Refresh from source
        await onUpdate();
        console.log('[ParentComponent] Refreshed');
    } catch (error) {
        console.error('[ParentComponent] Error:', error);
        await onUpdate(); // Revert optimistic update
        throw error;
    }
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

---

## Pattern 2: Modal Footer (Dialog-Based Viewers)

**Best For:** Components using shadcn/ui Dialog or similar modal libraries. Provides photo editing within constrained modal space.

### When to Use This Pattern

✅ **Use When:**
- Using shadcn/ui Dialog or similar modal components
- Medium-sized photos in constrained space
- Consistent with existing modal patterns in app
- Example: AdditionalsPhotosPanel, PreIncidentPhotosPanel

❌ **Don't Use When:**
- Fullscreen immersive viewing needed (use Pattern 1)
- Inline grid without modal (use Pattern 3)
- Very large photos requiring full viewport

### Component Structure

**State Management:**
```typescript
let isViewerOpen = $state(false);
let currentIndex = $state(0);
const currentPhoto = $derived(photos[currentIndex]);

let isEditingLabel = $state(false);
let tempLabel = $state('');
let savingLabel = $state(false);
let labelError = $state<string | null>(null);
```

### Template Structure (shadcn/ui Dialog)

```svelte
<script lang="ts">
    import { Dialog } from '$lib/components/ui/dialog';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';

    // State and functions similar to Pattern 1
    // ...
</script>

<Dialog.Root bind:open={isViewerOpen}>
    <Dialog.Content class="max-w-4xl">
        <Dialog.Header>
            <Dialog.Title>
                Photo {currentIndex + 1} of {photos.length}
            </Dialog.Title>
        </Dialog.Header>

        <!-- Photo Display -->
        <div class="photo-container">
            <img
                src={currentPhoto.url}
                alt={currentPhoto.label || 'Photo'}
                class="w-full h-auto max-h-[60vh] object-contain"
            />

            <!-- Navigation Buttons -->
            <div class="photo-navigation">
                <Button
                    variant="ghost"
                    onclick={handlePrevious}
                    disabled={currentIndex === 0}
                >
                    ← Previous
                </Button>
                <Button
                    variant="ghost"
                    onclick={handleNext}
                    disabled={currentIndex === photos.length - 1}
                >
                    Next →
                </Button>
            </div>
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
                    <Button
                        variant="outline"
                        onclick={cancelEditingLabel}
                        disabled={savingLabel}
                    >
                        Cancel
                    </Button>
                </div>
                {#if labelError}
                    <p class="text-destructive text-sm">{labelError}</p>
                {/if}
            {:else}
                <!-- View Mode -->
                <div class="label-display-footer">
                    <Button
                        variant="ghost"
                        onclick={startEditingLabel}
                        class="flex-1 justify-start"
                        disabled={!onLabelUpdate}
                    >
                        {currentPhoto.label || 'No description (click to add)'}
                    </Button>
                    <Button variant="destructive" onclick={handleDelete}>
                        Delete
                    </Button>
                </div>
            {/if}
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<style>
.label-editor-footer {
    display: flex;
    gap: 8px;
    width: 100%;
}

.label-display-footer {
    display: flex;
    gap: 8px;
    width: 100%;
}

.photo-container {
    position: relative;
}

.photo-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
}
</style>
```

### Navigation Tracking (Manual for Dialogs)

```typescript
function handleNext() {
    if (currentIndex < photos.length - 1) {
        currentIndex++;
        console.log('[PhotoViewer] Navigated to position:', currentIndex, 'Photo ID:', currentPhoto.id);
    }
}

function handlePrevious() {
    if (currentIndex > 0) {
        currentIndex--;
        console.log('[PhotoViewer] Navigated to position:', currentIndex, 'Photo ID:', currentPhoto.id);
    }
}
```

**Key Differences from Pattern 1:**
- Manual index tracking (not library-based)
- Bounds checking required
- Still log photo ID for verification
- $derived still auto-updates currentPhoto

---

## Pattern 3: Thumbnail Overlay (Inline Galleries)

**Best For:** Photo grids where labels appear on hover/focus without opening fullscreen or modal viewer.

### When to Use This Pattern

✅ **Use When:**
- Many photos in grid layout
- Quick labeling without opening viewer
- Hover-to-reveal interactions
- Space-efficient design needed
- Example: Vehicle photo grid

❌ **Don't Use When:**
- Detailed viewing needed (use Pattern 1 or 2)
- Photos too small for overlay text
- Fullscreen experience desired

### Component Structure

**State Management (Per-Photo):**
```typescript
// Different from Patterns 1 & 2: track which photo is being edited
let editingPhotoId = $state<string | null>(null);
let tempLabel = $state('');
let savingPhotoId = $state<string | null>(null);
let labelError = $state<string | null>(null);
```

### Template Structure

```svelte
<div class="photo-grid">
    {#each photos as photo (photo.id)}
        <div class="photo-item">
            <!-- Photo Image -->
            <img
                src={photo.url}
                alt={photo.label || 'Photo'}
                class="photo-image"
            />

            <!-- Label Overlay -->
            <div class="photo-overlay">
                {#if editingPhotoId === photo.id}
                    <!-- Edit Mode -->
                    <input
                        type="text"
                        bind:value={tempLabel}
                        onkeydown={(e) => handleLabelKeydown(e, photo.id)}
                        onblur={() => saveLabel(photo.id)}
                        placeholder="Label..."
                        disabled={savingPhotoId === photo.id}
                        class="label-input-overlay"
                        maxlength="200"
                    />
                    {#if savingPhotoId === photo.id}
                        <span class="saving-indicator">Saving...</span>
                    {/if}
                {:else}
                    <!-- View Mode -->
                    <button
                        onclick={() => startEditingLabel(photo.id, photo.label)}
                        class="label-display-overlay"
                        disabled={!onLabelUpdate}
                    >
                        {photo.label || 'Add label'}
                    </button>
                {/if}
            </div>
        </div>
    {/each}
</div>

<style>
.photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
}

.photo-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
}

.photo-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.photo-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    padding: 8px;
    backdrop-filter: blur(4px);
}

.label-input-overlay {
    width: 100%;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 4px 8px;
    font-size: 12px;
    border-radius: 4px;
}

.label-input-overlay:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.8);
}

.label-display-overlay {
    width: 100%;
    background: transparent;
    border: none;
    color: white;
    text-align: left;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.2s;
}

.label-display-overlay:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
}

.saving-indicator {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 2px;
}
</style>
```

### Functions (Per-Photo Editing)

```typescript
function startEditingLabel(photoId: string, currentLabel: string | null) {
    if (!onLabelUpdate) return;

    editingPhotoId = photoId;
    tempLabel = currentLabel || '';
    labelError = null;

    // Focus input
    setTimeout(() => {
        const input = document.querySelector('.label-input-overlay') as HTMLInputElement;
        if (input) {
            input.focus();
            input.select();
        }
    }, 50);
}

async function saveLabel(photoId: string) {
    if (savingPhotoId || !onLabelUpdate) return;

    const newLabel = tempLabel.trim();

    // Get current photo to check for changes
    const photo = photos.find(p => p.id === photoId);
    if (!photo || newLabel === (photo.label || '')) {
        editingPhotoId = null;
        return;
    }

    savingPhotoId = photoId;

    try {
        console.log('[PhotoGrid] Saving label:', { photoId, newLabel });

        await onLabelUpdate(photoId, newLabel);

        editingPhotoId = null;
        console.log('[PhotoGrid] Label saved:', photoId);
    } catch (err) {
        console.error('[PhotoGrid] Error saving:', err);
        labelError = 'Failed to save';
    } finally {
        savingPhotoId = null;
    }
}

function handleLabelKeydown(e: KeyboardEvent, photoId: string) {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveLabel(photoId);
    } else if (e.key === 'Escape') {
        e.preventDefault();
        editingPhotoId = null;
    }
}
```

**Key Differences from Patterns 1 & 2:**
- Track editing by photo ID, not currentIndex
- No navigation tracking needed
- Simpler state management
- Compact UI for grid layout

---

## Optimistic Updates Pattern (REQUIRED)

**Use in ALL photo component implementations** - This pattern is not optional.

### Why Optimistic Updates Matter

**Without Optimistic Updates:**
```
User clicks save → (waits) → Database updates → (waits) → UI updates
Perceived latency: 500ms - 2000ms
User experience: Feels slow, unresponsive
```

**With Optimistic Updates:**
```
User clicks save → UI updates instantly → Database updates in background
Perceived latency: 0ms
User experience: Instant, responsive, professional
```

**When to Use:**
- ✅ Label updates (high confidence operation)
- ✅ Photo deletion (with confirmation)
- ✅ Display order changes
- ✅ Metadata updates
- ❌ Complex validations (wait for server)
- ❌ Payment processing (never optimistic)

### Standard Implementation

**Parent Component (Data Owner):**

```typescript
import { useOptimisticArray } from '$lib/utils/useOptimisticArray.svelte';

// Initialize optimistic array
const photos = useOptimisticArray(props.photos);

async function handleLabelUpdate(photoId: string, label: string) {
    console.log('[ParentComponent] Label update requested:', {
        photoId,
        newLabel: label,
        currentPhotos: photos.value.map((p) => ({ id: p.id, label: p.label }))
    });

    try {
        // STEP 1: IMMEDIATE optimistic update (instant UI)
        photos.update(photoId, { label });
        console.log('[ParentComponent] Optimistic update applied');

        // STEP 2: Persist to database
        await photoService.updatePhotoLabel(photoId, label);
        console.log('[ParentComponent] Database updated');

        // STEP 3: Refresh from source of truth
        await onUpdate();
        console.log('[ParentComponent] Refreshed from parent');

        console.log('[ParentComponent] Label update complete:', photoId);
    } catch (error) {
        console.error('[ParentComponent] Error updating label:', error);

        // CRITICAL: Revert optimistic update on error
        await onUpdate();

        throw error; // Re-throw to let child component show error
    }
}
```

**Flow Diagram:**
```
User saves label
    ↓
photos.update(id, { label })  ← Instant! UI updates now
    ↓
await photoService.updatePhotoLabel()  ← Background database call
    ↓
await onUpdate()  ← Sync with source of truth
    ↓
Success: UI already updated, just confirmed
Error: Revert to original, show error
```

### useOptimisticArray Utility

**API Reference:**

```typescript
const photos = useOptimisticArray(initialPhotos);

// Update single item (optimistic label change)
photos.update(photoId, { label: 'New label' });

// Add item (optimistic photo upload)
photos.add(newPhoto);

// Remove item (optimistic photo deletion)
photos.remove(photoId);

// Access current array (reactive)
const currentPhotos = photos.value;

// Reset to source (on error or refresh)
// Happens automatically when props.photos changes
```

**Reactivity:**
```typescript
// photos.value is reactive
{#each photos.value as photo (photo.id)}
    <PhotoItem photo={photo} />
{/each}
```

### Error Recovery

**Critical Pattern:**
```typescript
try {
    // Optimistic update
    photos.update(photoId, { label });

    // Database call
    await photoService.updatePhotoLabel(photoId, label);

    // Success: sync with source
    await onUpdate();
} catch (error) {
    // MUST revert optimistic update
    await onUpdate(); // ← This reverts to database state

    throw error; // Let child show error
}
```

**Why This Works:**
- `onUpdate()` refreshes from parent/database
- Overwrites optimistic change
- Returns UI to correct state
- User sees error message
- Can retry if desired

### Testing Optimistic Updates

**Test Scenario: Network Failure**

```typescript
// 1. Open DevTools → Network tab
// 2. Set throttling to "Offline"
// 3. Edit photo label
// 4. Try to save
// 5. EXPECTED: Label appears to save (optimistic)
// 6. EXPECTED: Error appears "Failed to save"
// 7. EXPECTED: Label reverts to original

// OR simulate in code:
async function handleLabelUpdate(photoId: string, label: string) {
    photos.update(photoId, { label });

    // Simulate network error
    throw new Error('Network error');

    // This should revert:
    await onUpdate();
}
```

**Verification:**
```
Console should show:
[ParentComponent] Label update requested: { photoId: 'abc-123', newLabel: 'Test' }
[ParentComponent] Optimistic update applied
[ParentComponent] Error updating label: Network error
[ParentComponent] Refreshed from parent  ← Reverted!
```

---

## Testing Requirements

### Basic Functionality Checklist

- [ ] **Enter Edit Mode**
  - [ ] Click description area enters edit mode
  - [ ] Press `E` key enters edit mode
  - [ ] Input focuses and selects text

- [ ] **Type and Save Label**
  - [ ] Can type in input (200 char max)
  - [ ] Press `Enter` saves label
  - [ ] Click "Save" button saves label
  - [ ] Label updates immediately (optimistic)

- [ ] **Cancel Editing**
  - [ ] Press `Escape` cancels
  - [ ] Click "Cancel" button cancels
  - [ ] No changes saved

- [ ] **Persistence**
  - [ ] Label survives closing viewer
  - [ ] Label survives page refresh
  - [ ] Database has correct value

### Navigation Tracking Tests (CRITICAL)

**Test Procedure:**
1. Open photo viewer on first photo
2. Navigate to third photo (arrow keys or buttons)
3. **Check console**: `currentIndex` should show `2`
4. **Check console**: `photoId` should match third photo's ID
5. Edit and save label
6. **Verify database**: Correct photo record updated (not first photo!)
7. Close and reopen viewer
8. Navigate to third photo
9. **Verify**: Correct label displays

**Expected Console Output:**
```
[PhotoViewer] Navigated to position: 2 Photo ID: abc-123-def-456
[PhotoViewer] Saving label for photo: { currentIndex: 2, photoId: 'abc-123-def-456', newLabel: 'Test' }
[ParentComponent] Label update requested: { photoId: 'abc-123-def-456', newLabel: 'Test' }
[ParentComponent] Optimistic update applied
[ParentComponent] Database updated
```

**If Test Fails:**
- Navigation tracking not working
- Check `handlePositionUpdate` function
- Verify using library's native position API
- Add logging to track currentIndex changes

### Multiple Photos Test

**Test Procedure:**
1. Open viewer
2. Label photo 1: "First photo"
3. Navigate to photo 2
4. Label photo 2: "Second photo"
5. Navigate to photo 3
6. Label photo 3: "Third photo"
7. Close viewer
8. **Verify**: All three thumbnails show correct labels
9. Reopen viewer
10. **Verify**: Each photo shows its own label

**Common Failure:** All photos show same label
- **Cause:** Navigation tracking bug
- **Fix:** Check handlePositionUpdate

### Error Handling Test

**Test Procedure:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Edit photo label
4. Try to save
5. **Expected**: Error message appears
6. **Expected**: Label reverts to original
7. Enable network
8. **Expected**: Can save successfully

### Mobile Responsive Test

**Test Procedure:**
1. Open DevTools → Responsive mode
2. Set viewport to iPhone SE (375px width)
3. Open photo viewer
4. **Verify**: Bottom bar stacks vertically
5. **Verify**: Buttons are touch-friendly
6. **Verify**: Input remains usable
7. **Verify**: No horizontal scroll

### Accessibility Test

**Keyboard Navigation:**
- [ ] Tab to description button
- [ ] Enter activates button
- [ ] Tab moves through edit form
- [ ] Enter saves
- [ ] Escape cancels
- [ ] `E` key enters edit mode
- [ ] Delete key deletes photo

**Screen Reader:**
- [ ] Description button has accessible label
- [ ] Input has label/placeholder
- [ ] Error messages announced
- [ ] Counter announced ("Photo 1 of 5")

---

## Common Pitfalls & Troubleshooting

### Pitfall 1: Wrong Photo Gets Updated

**Symptoms:**
- Edit photo #3, but photo #1 gets the label
- All photos show same label after editing
- Console shows same photo ID every time

**Root Cause:**
Navigation tracking not working. `currentIndex` stays at 0, so `currentPhoto` always points to first photo.

**Fix:**
```typescript
// ❌ WRONG: Using indexOf
function handlePositionUpdate(container: any, activeItem: any) {
    const activeIndex = items.indexOf(activeItem); // Fails!
    currentIndex = activeIndex;
}

// ✅ CORRECT: Using library's native API
function handlePositionUpdate(container: any, activeItem: any) {
    const newPosition = container?.position; // Works!
    if (newPosition !== undefined && newPosition !== currentIndex) {
        currentIndex = newPosition;
        console.log('[PhotoViewer] Navigated to:', currentIndex, 'Photo ID:', currentPhoto.id);
    }
}
```

**Verification:**
```typescript
// Test: Navigate to photo 3
// Console should show:
// [PhotoViewer] Navigated to: 2 Photo ID: [correct-photo-id]

// If shows same photo ID every time → Navigation broken
```

### Pitfall 2: Thumbnails Don't Update After Save

**Symptoms:**
- Save label in viewer
- Close viewer
- Thumbnail shows old label or no label
- Hard refresh shows correct label

**Cause 1: Not Using Optimistic Updates**

**Fix:**
```typescript
// ❌ WRONG: No optimistic update
async function handleLabelUpdate(photoId: string, label: string) {
    await photoService.updatePhotoLabel(photoId, label);
    await onUpdate();
}

// ✅ CORRECT: Optimistic update first
async function handleLabelUpdate(photoId: string, label: string) {
    photos.update(photoId, { label }); // Instant update!
    await photoService.updatePhotoLabel(photoId, label);
    await onUpdate();
}
```

**Cause 2: Parent Not Passing Updated Photos**

**Fix:**
```typescript
// Ensure parent's onUpdate() refreshes photos
async function handleLabelUpdate(photoId: string, label: string) {
    photos.update(photoId, { label });
    await photoService.updatePhotoLabel(photoId, label);
    await onUpdate(); // ← Must call this to refresh
}
```

### Pitfall 3: Edit Mode Stuck

**Symptoms:**
- Click to edit label
- Can't exit edit mode
- Buttons don't work
- Page reload required

**Cause:**
State not resetting properly.

**Fix:**
```typescript
function cancelEditingLabel() {
    isEditingLabel = false;
    tempLabel = '';
    labelError = null; // ← Don't forget errors!
}

// Also ensure save function exits edit mode:
async function saveLabel() {
    // ...
    try {
        await props.onLabelUpdate(currentPhoto.id, newLabel);
        isEditingLabel = false; // ← Exit edit mode on success
    } catch (err) {
        // Stay in edit mode on error
        labelError = 'Failed to save';
        // isEditingLabel stays true
    }
}
```

### Pitfall 4: Input Not Focusing

**Symptoms:**
- Click to edit
- Input appears but doesn't focus
- Must click input manually

**Cause:**
DOM not ready when `focus()` called.

**Fix:**
```typescript
function startEditingLabel() {
    tempLabel = currentPhoto.label || '';
    isEditingLabel = true;

    // ❌ WRONG: Immediate focus (DOM not ready)
    // const input = document.querySelector('.label-input');
    // input.focus();

    // ✅ CORRECT: Wait for DOM
    setTimeout(() => {
        const input = document.querySelector('.label-input') as HTMLInputElement;
        if (input) {
            input.focus();
            input.select(); // Select all for easy editing
        }
    }, 50);
}
```

### Pitfall 5: Stale Closure with currentPhoto

**Symptoms:**
- Navigate to different photos
- Save always updates same photo
- Console logs show correct index but wrong photo

**Cause:**
Not using `$derived` for `currentPhoto`.

**Fix:**
```typescript
// ❌ WRONG: Stale closure
let currentPhoto = props.photos[currentIndex];

// ✅ CORRECT: Reactive derived value
const currentPhoto = $derived(props.photos[currentIndex]);
```

**Why This Works:**
- `$derived` creates computed value
- Auto-updates when dependencies change
- No stale closures

---

## Service Integration

### Photo Service Pattern

**Service Structure:**
```typescript
import { BaseService } from './base.service';
import type { ServiceClient } from '$lib/types';
import type { Photo } from '$lib/types/photo';

export class PhotoService extends BaseService {
    /**
     * Update photo label
     * @param photoId - Photo UUID
     * @param label - New label text (max 200 chars)
     * @param client - Optional ServiceClient for RLS
     * @returns Updated photo record
     */
    async updatePhotoLabel(
        photoId: string,
        label: string,
        client?: ServiceClient
    ): Promise<Photo> {
        const db = client ?? this.client;

        const { data, error } = await db
            .from('estimate_photos') // Adjust table name
            .update({ label: label.trim(), updated_at: new Date().toISOString() })
            .eq('id', photoId)
            .select()
            .single();

        if (error) {
            console.error('[PhotoService] Error updating label:', error);
            throw error;
        }

        // Optional: Audit logging
        await this.logAudit({
            entity_id: photoId,
            entity_type: 'photo',
            action: 'label_updated',
            metadata: { label }
        });

        return data;
    }
}
```

**Key Points:**
- Trim whitespace
- Update `updated_at` timestamp
- Single record return
- Error logging
- Optional audit trail
- ServiceClient injection for RLS

### ServiceClient Injection (from supabase-development)

**Why Optional Client:**
```typescript
// SSR: Use server-side client
const client = await createServerSupabaseClient(event);
await photoService.updatePhotoLabel(id, label, client);

// Browser: Use default client
await photoService.updatePhotoLabel(id, label);

// Service role: Use elevated client
await photoService.updatePhotoLabel(id, label, serviceRoleClient);
```

### Audit Logging Integration

**When to Log:**
- Photo label updated
- Photo deleted
- Photo uploaded
- Display order changed

**Audit Entry:**
```typescript
await auditService.logChange({
    entity_type: 'estimate_photo',
    entity_id: photoId,
    action: 'label_updated',
    action_details: 'Updated photo label',
    metadata: {
        old_label: currentPhoto.label,
        new_label: label,
        assessment_id: assessmentId // Context
    }
});
```

### Table Schema Requirements

**Minimum Schema:**
```sql
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Foreign keys
    assessment_id UUID REFERENCES assessments(id),
    estimate_id UUID REFERENCES estimates(id),

    -- Photo data
    photo_url TEXT NOT NULL,
    photo_path TEXT NOT NULL,
    label TEXT, -- ← Required for labeling
    display_order INTEGER NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE TRIGGER update_photos_updated_at
    BEFORE UPDATE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS policies (adjust for your use case)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own photos"
    ON photos FOR SELECT
    USING (assessment_id IN (
        SELECT id FROM assessments
        WHERE engineer_id = auth.uid() OR is_admin()
    ));

CREATE POLICY "Users can update own photos"
    ON photos FOR UPDATE
    USING (assessment_id IN (
        SELECT id FROM assessments
        WHERE engineer_id = auth.uid() OR is_admin()
    ));
```

---

## Real-World Examples

### Example 1: EstimatePhotosPanel (Pattern 1)

**Context:**
- Large estimate photos from vehicle damage assessments
- Users need immersive viewing to see damage details
- Professional appearance required for client-facing use

**Implementation:**
- **Pattern**: Fixed Bottom Bar
- **Library**: bigger-picture (fullscreen)
- **Navigation**: container.position API
- **Optimistic Updates**: Yes (instant label feedback)

**Files:**
- `src/lib/components/photo-viewer/PhotoViewer.svelte` - Child component
- `src/lib/components/assessment/EstimatePhotosPanel.svelte` - Parent component
- `src/lib/services/estimate-photos.service.ts` - Service layer

**Key Lessons:**
1. Fixed bottom bar more professional than floating overlay
2. Comprehensive logging essential for debugging navigation
3. Optimistic updates critical for responsive feel
4. Keyboard shortcuts improved power user experience

**Challenges Solved:**
- "Wrong photo updated" bug → Fixed navigation tracking
- Thumbnail labels not updating → Added optimistic updates
- Small description bar → Changed to full-width bottom bar

---

### Example 2: AdditionalsPhotosPanel (Pattern 2)

**Context:**
- Additional damage photos (not in original estimate)
- Modal viewing appropriate for supplementary photos
- Consistent with app's modal patterns

**Implementation:**
- **Pattern**: Modal Footer
- **Library**: shadcn/ui Dialog
- **Navigation**: Manual with bounds checking
- **Optimistic Updates**: Yes

**Why Different from EstimatePhotosPanel:**
- Additionals are supplementary, not primary documentation
- Modal fits better in workflow (less disruptive)
- Consistent with other modal interactions in app
- Medium-sized photos don't need fullscreen

---

### Example 3: Vehicle Photo Grid (Pattern 3)

**Context:**
- Multiple vehicle condition photos
- Quick labeling needed for many photos
- Users want to label without opening each photo

**Implementation:**
- **Pattern**: Thumbnail Overlay
- **UI**: Hover to reveal label
- **Editing**: Inline without modal
- **Optimistic Updates**: Yes

**Use Case:**
- Inspector uploads 20 vehicle photos
- Needs to quickly label each (front, rear, driver side, etc.)
- Opening viewer 20 times would be tedious
- Inline editing much faster

---

## Migration & Upgrade Guide

### Assessing Existing Components

**Checklist:**
- [ ] Does component display photos?
- [ ] Does it support editing (or should it)?
- [ ] What viewing approach does it use? (modal/fullscreen/inline)
- [ ] What navigation library (if any)?
- [ ] Does it use optimistic updates?
- [ ] Is navigation tracking correct?

### Step-by-Step Migration (Pattern 1)

**Step 1: Add State Management**

```typescript
// Add to component script
let currentIndex = $state(props.startIndex);
const currentPhoto = $derived(props.photos[currentIndex]);

let isEditingLabel = $state(false);
let tempLabel = $state('');
let savingLabel = $state(false);
let labelError = $state<string | null>(null);
```

**Step 2: Update Props Interface**

```typescript
interface Props {
    // ... existing props
    onLabelUpdate?: (photoId: string, label: string) => Promise<void>;
}
```

**Step 3: Implement Core Functions**

```typescript
function startEditingLabel() { /* ... */ }
async function saveLabel() { /* ... */ }
function cancelEditingLabel() { /* ... */ }
function handleLabelKeydown(e: KeyboardEvent) { /* ... */ }
```

**Step 4: Fix Navigation Tracking (CRITICAL)**

```typescript
// Replace this:
const activeIndex = items.indexOf(activeItem);

// With this:
const newPosition = container?.position;
```

**Step 5: Update Template**

Add label editor UI (see Pattern 1 template).

**Step 6: Wire Up Parent**

```typescript
async function handleLabelUpdate(photoId: string, label: string) {
    photos.update(photoId, { label });
    await photoService.updatePhotoLabel(photoId, label);
    await onUpdate();
}

<PhotoViewer
    {...existingProps}
    onLabelUpdate={handleLabelUpdate}
/>
```

**Step 7: Test Thoroughly**

Run through testing checklist (see Testing section).

---

## Appendix & References

### Related ClaimTech Documentation

**System Documentation:**
- [photo_labeling_implementation_nov_6_2025.md](../../.agent/System/photo_labeling_implementation_nov_6_2025.md) - Complete implementation details and bug fixes
- [ui_loading_patterns.md](../../.agent/System/ui_loading_patterns.md) - Optimistic update patterns
- [project_architecture.md](../../.agent/System/project_architecture.md) - Storage architecture

**Standard Operating Procedures:**
- [photo_labeling_patterns.md](../../.agent/SOP/photo_labeling_patterns.md) - Step-by-step implementation guide
- [creating-components.md](../../.agent/SOP/creating-components.md) - Svelte 5 component patterns
- [working_with_services.md](../../.agent/SOP/working_with_services.md) - Service layer patterns

### Related Skills

- **claimtech-development** - General SvelteKit patterns, feature workflow
- **supabase-development** - Storage, database, service layer
- **assessment-centric-specialist** - Assessment-specific patterns (if applicable)

### Code References

**Components:**
- `src/lib/components/photo-viewer/PhotoViewer.svelte` - Reference implementation (Pattern 1)
- `src/lib/components/assessment/EstimatePhotosPanel.svelte` - Parent component example
- `src/lib/components/assessment/AdditionalsPhotosPanel.svelte` - Modal pattern example

**Services:**
- `src/lib/services/estimate-photos.service.ts` - Photo service example
- `src/lib/services/storage.service.ts` - Storage operations

**Utilities:**
- `src/lib/utils/useOptimisticArray.svelte.ts` - Optimistic update utility

### External Resources

- [bigger-picture Documentation](https://github.com/henrygd/bigger-picture) - Fullscreen photo viewer library
- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog) - Modal component
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes) - Reactivity system

---

## Additional Resources

See `resources/` folder for:
- **pattern-templates.md** - Copy-paste ready templates for each pattern
- **testing-checklist.md** - Comprehensive testing guide with E2E examples
- **troubleshooting-guide.md** - Detailed debugging guide for common issues
- **migration-guide.md** - Detailed migration steps with before/after examples

---

**Skill Maintainer**: ClaimTech Engineering Team
**Last Updated**: November 6, 2025
**Next Review**: After 3rd implementation using this skill
