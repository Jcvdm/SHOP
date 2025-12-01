# SSE Streaming Pattern for Long-Running Operations

**Date**: January 31, 2025  
**Status**: ✅ Implemented in Bug #8 Fix  
**Use Case**: Batch document generation with real-time progress feedback

---

## Overview

Server-Sent Events (SSE) streaming enables real-time progress updates for long-running operations. Instead of waiting for all work to complete, clients receive incremental updates as each item completes.

**When to Use**:
- ✅ Batch operations (generate 4 documents)
- ✅ Multi-step workflows (report → estimate → photos)
- ✅ Operations taking 30+ seconds
- ✅ Need partial success handling (3/4 succeed)
- ❌ Simple single operations (use regular fetch)
- ❌ Operations completing in <5 seconds

---

## Architecture Pattern

### Backend: Sequential Generation with SSE

```typescript
// src/routes/api/generate-all-documents/+server.ts
export const POST: RequestHandler = async ({ request, fetch }) => {
	return createStreamingResponse(async function* () {
		const results = { report: {...}, estimate: {...}, photosPdf: {...}, photosZip: {...} };
		
		// 1. Generate Report (0-25%)
		yield { status: 'processing', progress: 0, message: 'Generating report...', results };
		try {
			const reportUrl = await generateDocument('report', assessmentId, fetch);
			results.report = { success: true, url: reportUrl, error: null };
			yield { status: 'processing', progress: 25, message: 'Report complete ✓', results };
		} catch (err) {
			results.report = { success: false, url: null, error: err.message };
			yield { status: 'processing', progress: 25, message: 'Report failed ✗', results };
		}
		
		// 2-4. Similar for estimate, photos-pdf, photos-zip
		
		// Final result
		yield { status: allSucceeded ? 'complete' : 'partial', progress: 100, message: '...', results };
	});
};
```

### Client: SSE Parsing with Progress Callback

```typescript
// src/lib/services/document-generation.service.ts
async generateAllDocuments(
	assessmentId: string,
	onProgress?: (documentType: string, progress: number, message: string, url: string | null, error: string | null) => void
) {
	const response = await fetch('/api/generate-all-documents', { method: 'POST', body: JSON.stringify({ assessmentId }) });
	const reader = response.body?.getReader();
	let buffer = '';
	
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		
		buffer += decoder.decode(value, { stream: true });
		const messages = buffer.split('\n\n');
		buffer = messages.pop() || '';
		
		for (const message of messages) {
			const data = JSON.parse(message.replace(/^data: /, ''));
			
			// Invoke callback for each document
			if (data.results && onProgress) {
				if (data.results.report) {
					onProgress('report', data.results.report.success ? 100 : 0, '...', data.results.report.url, data.results.report.error);
				}
				// Similar for estimate, photosPdf, photosZip
			}
		}
	}
	
	return { success, reportUrl, estimateUrl, photosPdfUrl, photosZipUrl, errors };
}
```

### UI: Progress Tracking Component

```svelte
<!-- src/lib/components/assessment/DocumentGenerationProgress.svelte -->
<script lang="ts">
	interface DocumentProgress {
		status: 'pending' | 'processing' | 'success' | 'error';
		progress: number;
		message: string;
		url: string | null;
		error: string | null;
	}
	
	let { report, estimate, photosPdf, photosZip, onRetry }: Props = $props();
	
	const documents = $derived([
		{ key: 'report', label: 'Assessment Report', data: report },
		{ key: 'estimate', label: 'Estimate', data: estimate },
		{ key: 'photosPdf', label: 'Photos PDF', data: photosPdf },
		{ key: 'photosZip', label: 'Photos ZIP', data: photosZip }
	]);
</script>

<!-- Progress bars, status icons, retry buttons -->
```

---

## Key Concepts

### 1. Sequential vs Parallel
- **Sequential**: One document at a time (0-25%, 25-50%, etc.)
- **Benefit**: Predictable progress, easier to debug, partial success support
- **Trade-off**: Slower overall (but better UX)

### 2. Partial Success
- If report fails, estimate/photos still generate
- Results object tracks success/error per document
- UI shows which documents succeeded/failed

### 3. Progress Callback Pattern
- Service calls endpoint with progress callback
- Callback invoked for each document update
- Component state updates reactively

---

## Implementation Checklist

- [x] Backend: Create SSE streaming endpoint
- [x] Backend: Sequential generation with progress yields
- [x] Service: Parse SSE events and invoke callbacks
- [x] UI: Create progress component with bars/icons
- [x] UI: Integrate into parent component
- [x] Error: Handle partial failures gracefully
- [x] Retry: Add individual retry buttons

---

## Related Documentation

- [UI Loading Patterns](./ui_loading_patterns.md) - Loading state patterns
- [Project Architecture](./project_architecture.md) - System design
- [Bug #8 Implementation](../Tasks/completed/BUG_8_IMPLEMENTATION_COMPLETE.md) - Complete implementation details

