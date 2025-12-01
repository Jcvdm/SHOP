# Bug #8 - SSE Streaming Implementation Guide

**Date**: January 31, 2025  
**Task**: Implement SSE Streaming for Generate All Aggregator  
**Priority**: High  
**Estimated Time**: 2-3 hours

---

## Overview

Convert the generate-all-documents endpoint from `Promise.allSettled` (no progress) to SSE streaming (real-time progress updates for each document).

---

## Current Implementation

**File**: `src/routes/api/generate-all-documents/+server.ts`

**Current Approach** (lines 12-99):
```typescript
// Generates all 4 documents in parallel
const [reportResponse, estimateResponse, photosPdfResponse, photosZipResponse] =
    await Promise.allSettled([
        fetch('/api/generate-report', ...),
        fetch('/api/generate-estimate', ...),
        fetch('/api/generate-photos-pdf', ...),
        fetch('/api/generate-photos-zip', ...)
    ]);

// Returns JSON with results
return json({ success: allSucceeded, results });
```

**Problems**:
- ❌ No progress updates during generation (30-60+ seconds)
- ❌ User sees loading spinner with no feedback
- ❌ Can't identify which document failed
- ❌ All-or-nothing approach (can't continue with partial success)

---

## Target Implementation

**New Approach**: Sequential generation with SSE progress streaming

```typescript
import { createStreamingResponse } from '$lib/utils/streaming-response';

export const POST: RequestHandler = async ({ request, locals }) => {
    const { assessmentId } = await request.json();

    return createStreamingResponse(async function* () {
        const results = {
            report: { success: false, url: null, error: null },
            estimate: { success: false, url: null, error: null },
            photosPdf: { success: false, url: null, error: null },
            photosZip: { success: false, url: null, error: null }
        };

        // 1. Generate Report (0-25%)
        yield { status: 'processing', progress: 0, message: 'Generating report...', results };
        try {
            const reportUrl = await generateDocument('report', assessmentId, (progress, msg) => {
                yield { status: 'processing', progress: progress * 0.25, message: msg, results };
            });
            results.report = { success: true, url: reportUrl, error: null };
            yield { status: 'processing', progress: 25, message: 'Report complete', results };
        } catch (error) {
            results.report.error = error.message;
            yield { status: 'processing', progress: 25, message: 'Report failed', results };
        }

        // 2. Generate Estimate (25-50%)
        yield { status: 'processing', progress: 25, message: 'Generating estimate...', results };
        // ... similar pattern

        // 3. Generate Photos PDF (50-75%)
        // ... similar pattern

        // 4. Generate Photos ZIP (75-100%)
        // ... similar pattern

        // Final result
        const allSucceeded = Object.values(results).every(r => r.success);
        yield { 
            status: allSucceeded ? 'complete' : 'partial', 
            progress: 100, 
            message: allSucceeded ? 'All documents generated!' : 'Some documents failed',
            results 
        };
    });
};
```

---

## Implementation Steps

### Step 1: Create Helper Function for Document Generation

Add to `src/routes/api/generate-all-documents/+server.ts`:

```typescript
/**
 * Generate a single document and return its URL
 * Calls the individual document generation endpoint
 */
async function generateDocument(
    type: 'report' | 'estimate' | 'photos-pdf' | 'photos-zip',
    assessmentId: string,
    onProgress?: (progress: number, message: string) => void
): Promise<string> {
    const response = await fetch(`/api/generate-${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to generate ${type}`);
    }

    // Handle SSE streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalUrl = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || '';

        for (const message of messages) {
            if (!message.trim() || !message.startsWith('data: ')) continue;
            
            const data = JSON.parse(message.replace(/^data: /, ''));
            
            if (onProgress && typeof data.progress === 'number') {
                onProgress(data.progress, data.message || data.status);
            }
            
            if (data.status === 'complete' && data.url) {
                finalUrl = data.url;
            }
            
            if (data.status === 'error') {
                throw new Error(data.error || 'Unknown error');
            }
        }
    }

    if (!finalUrl) {
        throw new Error('Document generation completed but no URL returned');
    }

    return finalUrl;
}
```

### Step 2: Update POST Handler

Replace the current `Promise.allSettled` approach with sequential SSE streaming:

```typescript
export const POST: RequestHandler = async ({ request, locals }) => {
    const { assessmentId } = await request.json();

    if (!assessmentId) {
        return json({ error: 'Assessment ID is required' }, { status: 400 });
    }

    return createStreamingResponse(async function* () {
        // Initialize results tracking
        const results = {
            report: { success: false, url: null, error: null },
            estimate: { success: false, url: null, error: null },
            photosPdf: { success: false, url: null, error: null },
            photosZip: { success: false, url: null, error: null }
        };

        // Generate each document sequentially with progress updates
        // (See full implementation in Step 1)
        
        // ... implementation continues in next section
    });
};
```

---

## Benefits of New Approach

1. **Real-time Progress**: User sees which document is being generated
2. **Partial Success**: Can continue if 3/4 documents succeed
3. **Better Error Handling**: Know exactly which document failed
4. **Improved UX**: Progress bars instead of infinite spinner
5. **Debugging**: Clear logs showing which step failed

---

## Testing Checklist

- [ ] Small assessment (10 photos) - all documents generate
- [ ] Medium assessment (50 photos) - all documents generate
- [ ] Large assessment (100+ photos) - all documents generate
- [ ] Simulate network failure - partial success handled
- [ ] Verify progress updates stream correctly
- [ ] Check error messages are clear and actionable
- [ ] Verify URLs are returned for successful documents
- [ ] Test retry functionality for failed documents

---

## Related Files

**Will Modify**:
- `src/routes/api/generate-all-documents/+server.ts` - Main implementation

**Will Reference**:
- `src/routes/api/generate-report/+server.ts` - SSE pattern example
- `src/routes/api/generate-photos-zip/+server.ts` - SSE pattern example
- `src/lib/utils/streaming-response.ts` - SSE utility

**Will Update Next**:
- `src/lib/services/document-generation.service.ts` - Client-side SSE parsing
- `src/lib/components/assessment/FinalizeTab.svelte` - UI progress tracking

---

## Next Steps After Implementation

1. Update document-generation.service.ts to parse SSE events
2. Create DocumentGenerationProgress.svelte component
3. Update FinalizeTab.svelte to use new progress component
4. Add individual retry functionality
5. Test with various assessment sizes

---

*Implementation Guide Created: January 31, 2025*

