# Bug #8 - UI Component Implementation Guide

**Date**: January 31, 2025  
**Task**: Create Per-Document Progress UI Component  
**Priority**: High  
**Estimated Time**: 2 hours

---

## Overview

Create a new component `DocumentGenerationProgress.svelte` to display real-time progress for each document type during batch generation.

---

## Component Requirements

### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ Generating Documents                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ✓ Report                          [████████████] 100%       │
│   Generated successfully                                     │
│                                                              │
│ ⟳ Estimate                        [████████░░░░]  75%       │
│   Calculating line items...                                  │
│                                                              │
│ ⏳ Photos PDF                      [░░░░░░░░░░░░]   0%       │
│   Waiting...                                                 │
│                                                              │
│ ✗ Photos ZIP                      [████░░░░░░░░]  35%       │
│   Failed: Connection timeout                                 │
│   [Retry]                                                    │
│                                                              │
│ Overall Progress: 3/4 documents completed                    │
└─────────────────────────────────────────────────────────────┘
```

### Status Icons

- ⏳ **Pending**: Gray, waiting to start
- ⟳ **Processing**: Blue, animated spinner
- ✓ **Success**: Green, checkmark
- ✗ **Error**: Red, X mark

---

## Component Interface

**File**: `src/lib/components/assessment/DocumentGenerationProgress.svelte`

```typescript
<script lang="ts">
    import { FileText, FileSpreadsheet, Image, Archive, CheckCircle, XCircle, Loader2, Clock } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button';
    import { Progress } from '$lib/components/ui/progress';
    import { Card } from '$lib/components/ui/card';

    interface DocumentProgress {
        status: 'pending' | 'processing' | 'success' | 'error';
        progress: number;
        message: string;
        url: string | null;
        error: string | null;
    }

    interface Props {
        report: DocumentProgress;
        estimate: DocumentProgress;
        photosPdf: DocumentProgress;
        photosZip: DocumentProgress;
        onRetry?: (documentType: string) => void;
    }

    let { report, estimate, photosPdf, photosZip, onRetry }: Props = $props();

    const documents = [
        { key: 'report', label: 'Assessment Report', icon: FileText, data: report },
        { key: 'estimate', label: 'Estimate', icon: FileSpreadsheet, data: estimate },
        { key: 'photosPdf', label: 'Photos PDF', icon: Image, data: photosPdf },
        { key: 'photosZip', label: 'Photos ZIP', icon: Archive, data: photosZip }
    ];

    const completedCount = $derived(
        documents.filter(d => d.data.status === 'success').length
    );

    function getStatusIcon(status: string) {
        switch (status) {
            case 'pending': return Clock;
            case 'processing': return Loader2;
            case 'success': return CheckCircle;
            case 'error': return XCircle;
            default: return Clock;
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'pending': return 'text-gray-400';
            case 'processing': return 'text-blue-500';
            case 'success': return 'text-green-500';
            case 'error': return 'text-red-500';
            default: return 'text-gray-400';
        }
    }
</script>

<Card class="p-6">
    <h3 class="text-lg font-semibold mb-4">Generating Documents</h3>
    
    <div class="space-y-4">
        {#each documents as doc}
            <div class="space-y-2">
                <!-- Document Header -->
                <div class="flex items-center gap-3">
                    <svelte:component 
                        this={getStatusIcon(doc.data.status)} 
                        class="w-5 h-5 {getStatusColor(doc.data.status)} {doc.data.status === 'processing' ? 'animate-spin' : ''}"
                    />
                    <svelte:component this={doc.icon} class="w-4 h-4 text-gray-500" />
                    <span class="font-medium">{doc.label}</span>
                    <span class="ml-auto text-sm text-gray-500">{doc.data.progress}%</span>
                </div>

                <!-- Progress Bar -->
                <Progress value={doc.data.progress} class="h-2" />

                <!-- Status Message -->
                <p class="text-sm text-gray-600">{doc.data.message}</p>

                <!-- Error Message & Retry Button -->
                {#if doc.data.status === 'error'}
                    <div class="flex items-center gap-2">
                        <p class="text-sm text-red-600">{doc.data.error}</p>
                        {#if onRetry}
                            <Button 
                                size="sm" 
                                variant="outline"
                                onclick={() => onRetry?.(doc.key)}
                            >
                                Retry
                            </Button>
                        {/if}
                    </div>
                {/if}

                <!-- Success - View Document Link -->
                {#if doc.data.status === 'success' && doc.data.url}
                    <a 
                        href={doc.data.url} 
                        target="_blank"
                        class="text-sm text-blue-600 hover:underline"
                    >
                        View Document →
                    </a>
                {/if}
            </div>
        {/each}
    </div>

    <!-- Overall Progress -->
    <div class="mt-6 pt-4 border-t">
        <p class="text-sm font-medium text-gray-700">
            Overall Progress: {completedCount}/4 documents completed
        </p>
    </div>
</Card>
```

---

## Integration with FinalizeTab

**File**: `src/lib/components/assessment/FinalizeTab.svelte`

### Step 1: Add State Management

```typescript
// Add to existing state
let documentProgress = $state({
    report: { status: 'pending', progress: 0, message: 'Waiting...', url: null, error: null },
    estimate: { status: 'pending', progress: 0, message: 'Waiting...', url: null, error: null },
    photosPdf: { status: 'pending', progress: 0, message: 'Waiting...', url: null, error: null },
    photosZip: { status: 'pending', progress: 0, message: 'Waiting...', url: null, error: null }
});

let showProgress = $state(false);
```

### Step 2: Update Generate All Handler

```typescript
async function handleGenerateAll() {
    generating.all = true;
    showProgress = true;
    error = null;

    try {
        // Call streaming service
        await documentGenerationService.generateAllDocumentsStreaming(
            assessmentId,
            (type, progress, message, url, error) => {
                // Update progress for specific document
                documentProgress[type] = {
                    status: error ? 'error' : (progress === 100 ? 'success' : 'processing'),
                    progress,
                    message,
                    url,
                    error
                };
            }
        );

        // Refresh assessment data
        await loadGenerationStatus();
        await invalidateAll();
    } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to generate documents';
    } finally {
        generating.all = false;
    }
}
```

### Step 3: Add Retry Handler

```typescript
async function handleRetryDocument(documentType: string) {
    // Reset progress for this document
    documentProgress[documentType] = {
        status: 'processing',
        progress: 0,
        message: 'Retrying...',
        url: null,
        error: null
    };

    try {
        // Call individual document generator
        const url = await documentGenerationService.generateDocument(
            assessmentId,
            documentType,
            (progress, message) => {
                documentProgress[documentType] = {
                    status: 'processing',
                    progress,
                    message,
                    url: null,
                    error: null
                };
            }
        );

        // Update with success
        documentProgress[documentType] = {
            status: 'success',
            progress: 100,
            message: 'Generated successfully',
            url,
            error: null
        };

        await loadGenerationStatus();
    } catch (err) {
        documentProgress[documentType] = {
            status: 'error',
            progress: 0,
            message: 'Failed',
            url: null,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}
```

### Step 4: Update Template

```svelte
<!-- Replace existing Generate All button section -->
{#if showProgress}
    <DocumentGenerationProgress
        report={documentProgress.report}
        estimate={documentProgress.estimate}
        photosPdf={documentProgress.photosPdf}
        photosZip={documentProgress.photosZip}
        onRetry={handleRetryDocument}
    />
{:else}
    <Button onclick={handleGenerateAll} disabled={generating.all}>
        {generating.all ? 'Generating...' : 'Generate All Documents'}
    </Button>
{/if}
```

---

## Testing Checklist

- [ ] Progress bars update smoothly (0-100%)
- [ ] Status icons change correctly (pending → processing → success/error)
- [ ] Messages display for each document
- [ ] Retry buttons appear only for failed documents
- [ ] View Document links work for successful documents
- [ ] Overall progress count is accurate
- [ ] Component is responsive on mobile
- [ ] Animations are smooth (spinner, progress bars)

---

## Related Files

**Will Create**:
- `src/lib/components/assessment/DocumentGenerationProgress.svelte`

**Will Modify**:
- `src/lib/components/assessment/FinalizeTab.svelte`
- `src/lib/services/document-generation.service.ts`

---

*Implementation Guide Created: January 31, 2025*

