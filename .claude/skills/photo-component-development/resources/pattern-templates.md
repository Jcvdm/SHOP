# Photo Component Pattern Templates

**Copy-paste ready templates for each pattern. Customize placeholder values for your use case.**

---

## Template 1: Fixed Bottom Bar (Fullscreen Viewer)

**Use For:** Components with bigger-picture or similar fullscreen libraries

```svelte
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import type { Photo } from '$lib/types'; // Adjust import

    interface Props {
        photos: Photo[];
        startIndex: number;
        onClose: () => void;
        onDelete: (photoId: string, photoPath: string) => Promise<void>;
        onLabelUpdate?: (photoId: string, label: string) => Promise<void>;
    }

    let props: Props = $props();

    // State management
    let currentIndex = $state(props.startIndex);
    const currentPhoto = $derived(props.photos[currentIndex]);
    let isEditingLabel = $state(false);
    let tempLabel = $state('');
    let savingLabel = $state(false);
    let labelError = $state<string | null>(null);
    let isOpen = $state(false);
    let isDeleting = $state(false);

    // Library instance
    let bp: any = null;
    let BiggerPicture: any;

    // Initialize library
    onMount(async () => {
        if (!browser) return;

        try {
            const biggerPictureModule = await import('bigger-picture');
            BiggerPicture = biggerPictureModule.default;

            bp = BiggerPicture({ target: document.body });
            openViewer();
        } catch (err) {
            console.error('[PhotoViewer] Initialization failed:', err);
        }
    });

    onDestroy(() => {
        if (bp) {
            try {
                bp.close();
            } catch (err) {
                console.error('[PhotoViewer] Error closing:', err);
            }
        }
    });

    // Open viewer
    function openViewer() {
        if (!bp || !browser) return;
        if (!props.photos || props.photos.length === 0) return;

        isOpen = true;

        bp.open({
            items: props.photos.map((photo) => ({
                img: photo.url, // Adjust property name
                thumb: photo.url,
                alt: photo.label || 'Photo',
                caption: photo.label || ''
            })),
            position: currentIndex,
            intro: 'fadeup',
            onClose: handleClose,
            onUpdate: handlePositionUpdate
        });

        console.log('[PhotoViewer] Opened at position:', currentIndex);
    }

    // CRITICAL: Navigation tracking
    function handlePositionUpdate(container: any, activeItem: any) {
        try {
            const newPosition = container?.position;

            if (newPosition !== undefined && newPosition !== currentIndex) {
                currentIndex = newPosition;
                console.log(
                    '[PhotoViewer] Navigated to:',
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

    // Delete photo
    async function handleDelete() {
        if (isDeleting || !currentPhoto) return;

        if (!confirm('Are you sure you want to delete this photo?')) {
            return;
        }

        isDeleting = true;

        try {
            await props.onDelete(currentPhoto.id, currentPhoto.photo_path);
            console.log('[PhotoViewer] Photo deleted:', currentPhoto.id);

            if (bp) bp.close();
            props.onClose();
        } catch (err) {
            console.error('[PhotoViewer] Error deleting:', err);
            alert('Failed to delete photo. Please try again.');
        } finally {
            isDeleting = false;
        }
    }

    // Label editing: Start
    function startEditingLabel() {
        if (!currentPhoto || !props.onLabelUpdate) return;

        tempLabel = currentPhoto.label || '';
        isEditingLabel = true;
        labelError = null;

        setTimeout(() => {
            const input = document.querySelector('.label-input') as HTMLInputElement;
            if (input) {
                input.focus();
                input.select();
            }
        }, 50);
    }

    // Label editing: Save
    async function saveLabel() {
        if (!currentPhoto || !props.onLabelUpdate || savingLabel) return;

        const newLabel = tempLabel.trim();

        if (newLabel === (currentPhoto.label || '')) {
            cancelEditingLabel();
            return;
        }

        savingLabel = true;
        labelError = null;

        try {
            console.log('[PhotoViewer] Saving label:', {
                currentIndex,
                photoId: currentPhoto.id,
                currentLabel: currentPhoto.label,
                newLabel
            });

            await props.onLabelUpdate(currentPhoto.id, newLabel);
            isEditingLabel = false;
            console.log('[PhotoViewer] Label saved:', currentPhoto.id);
        } catch (err) {
            console.error('[PhotoViewer] Error saving:', err);
            labelError = 'Failed to save label. Please try again.';
        } finally {
            savingLabel = false;
        }
    }

    // Label editing: Cancel
    function cancelEditingLabel() {
        isEditingLabel = false;
        tempLabel = '';
        labelError = null;
    }

    // Keyboard handlers
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
</script>

<!-- Fixed Bottom Bar UI -->
{#if isOpen && currentPhoto}
    <div class="photo-viewer-info">
        {#if isEditingLabel}
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

        <div class="bottom-actions">
            <div class="photo-counter">
                {currentIndex + 1} / {props.photos.length}
            </div>
            <button
                onclick={handleDelete}
                disabled={isDeleting}
                class="delete-button"
                type="button"
            >
                {isDeleting ? 'Deleting...' : '🗑️ Delete'}
            </button>
        </div>
    </div>
{/if}

<style>
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

    .photo-description.has-label {
        font-weight: 600;
    }

    .edit-hint {
        font-size: 11px;
        opacity: 0.6;
        font-weight: 400;
    }

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

    .label-error {
        color: #fca5a5;
        font-size: 11px;
        margin-top: 4px;
        font-weight: 500;
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

    :global(.bp-wrap) {
        z-index: 999;
    }
</style>
```

---

## ⚠️ CRITICAL: useOptimisticArray Reactivity Pattern

**IMPORTANT**: When using `useOptimisticArray`, you MUST pass a **getter function**, not a direct prop reference.

### ✅ CORRECT Pattern
```typescript
const photos = useOptimisticArray(() => props.photos);
```

### ❌ WRONG Pattern (Causes Bug)
```typescript
const photos = useOptimisticArray(props.photos);  // ❌ Photos won't display after reload
```

### Why This Matters

**Bug Symptom**: Photos don't display after page reload or tab switch, even though parent has loaded the data from the database.

**Root Cause**: Without the getter function, Svelte 5's `$effect` captures the initial value of `props.photos` (which is `[]` on mount) and doesn't track changes when the parent updates the prop with actual data.

**Solution**: The getter function `() => props.photos` ensures:
1. The function is called fresh each time
2. Svelte 5's `$derived.by()` detects when the returned array changes
3. The `$effect` re-runs and syncs `localArray` with new data
4. UI updates automatically when parent loads photos

### Implementation Details

The utility uses Svelte 5 runes internally:
```typescript
// Inside useOptimisticArray
const parentArrayValue = $derived.by(() => {
  return typeof parentArray === 'function'
    ? parentArray()           // Call getter if function
    : parentArray;            // Use directly if array
});

$effect(() => {
  const currentParent = parentArrayValue;  // Reads $derived value
  localArray = [...currentParent];         // Syncs when parent changes
});
```

**Fixed**: November 9, 2025 - All 5 photo panels updated to use getter functions.

---

## Template 2: Parent Component (Optimistic Updates)

```typescript
// Parent component implementation

import PhotoViewer from '$lib/components/photo-viewer/PhotoViewer.svelte';
import { useOptimisticArray } from '$lib/utils/useOptimisticArray.svelte';
import { photoService } from '$lib/services/photo.service'; // Adjust import

interface Props {
    photos: Photo[];
    onUpdate: () => void;
}

let props: Props = $props();

// ⚠️ CRITICAL: Pass getter function () => props.photos for reactivity
// This ensures the utility tracks changes when parent updates the prop
// Without the getter, the utility captures the initial value and won't sync
const photos = useOptimisticArray(() => props.photos);

// Photo viewer state
let selectedPhotoIndex = $state<number | null>(null);

function openPhotoViewer(index: number) {
    selectedPhotoIndex = index;
}

function closePhotoViewer() {
    selectedPhotoIndex = null;
}

async function handlePhotoDelete(photoId: string, photoPath: string) {
    try {
        // Optimistic remove
        photos.remove(photoId);

        // Delete from storage
        await storageService.deletePhoto(photoPath);

        // Delete from database
        await photoService.deletePhoto(photoId);

        // Refresh from parent
        await props.onUpdate();
    } catch (error) {
        console.error('[ParentComponent] Error deleting:', error);
        alert('Failed to delete photo.');
        // Revert optimistic update
        await props.onUpdate();
    }
}

async function handleLabelUpdate(photoId: string, label: string) {
    console.log('[ParentComponent] Label update requested:', {
        photoId,
        newLabel: label
    });

    try {
        // STEP 1: Optimistic update (instant UI)
        photos.update(photoId, { label });
        console.log('[ParentComponent] Optimistic update applied');

        // STEP 2: Database update
        await photoService.updatePhotoLabel(photoId, label);
        console.log('[ParentComponent] Database updated');

        // STEP 3: Refresh from source
        await props.onUpdate();
        console.log('[ParentComponent] Refreshed');
    } catch (error) {
        console.error('[ParentComponent] Error updating label:', error);
        // Revert optimistic update
        await props.onUpdate();
        throw error; // Let child show error
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

## Template 3: Photo Service

```typescript
// Photo service with label update method

import { BaseService } from './base.service';
import type { ServiceClient } from '$lib/types';
import type { Photo } from '$lib/types/photo'; // Adjust import

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
            .update({
                label: label.trim(),
                updated_at: new Date().toISOString()
            })
            .eq('id', photoId)
            .select()
            .single();

        if (error) {
            console.error('[PhotoService] Error updating label:', error);
            throw error;
        }

        // Optional: Audit logging
        if (this.auditService) {
            await this.auditService.logChange({
                entity_id: photoId,
                entity_type: 'photo',
                action: 'label_updated',
                action_details: 'Updated photo label',
                metadata: { label }
            });
        }

        return data;
    }

    /**
     * Delete photo
     */
    async deletePhoto(photoId: string, client?: ServiceClient): Promise<void> {
        const db = client ?? this.client;

        const { error } = await db
            .from('estimate_photos') // Adjust table name
            .delete()
            .eq('id', photoId);

        if (error) {
            console.error('[PhotoService] Error deleting photo:', error);
            throw error;
        }

        // Optional: Audit logging
        if (this.auditService) {
            await this.auditService.logChange({
                entity_id: photoId,
                entity_type: 'photo',
                action: 'deleted'
            });
        }
    }
}

// Export singleton instance
export const photoService = new PhotoService(supabase);
```

---

## Customization Checklist

When using these templates:

- [ ] Update import paths for your project structure
- [ ] Adjust `Photo` type to match your schema
- [ ] Change table name in service (`estimate_photos` → your table)
- [ ] Update property names (`photo.url`, `photo.label`, etc.)
- [ ] Add/remove fields as needed
- [ ] Adjust RLS client injection if needed
- [ ] Customize error messages
- [ ] Add/remove keyboard shortcuts
- [ ] Adjust styling to match your design system
- [ ] Test thoroughly with your data

---

**Last Updated**: November 6, 2025
