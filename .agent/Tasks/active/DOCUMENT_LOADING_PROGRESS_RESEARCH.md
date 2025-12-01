# Document Loading Progress - Research & Context Gathering

**Date:** November 23, 2025  
**Status:** RESEARCH COMPLETE  
**Focus:** shadcn-svelte Progress Bar + Document Loading UI

---

## 📊 Research Summary

### 1. shadcn-svelte Progress Component

**Status:** ✅ Already installed in project  
**Location:** `src/lib/components/ui/progress/progress.svelte`  
**API:** Simple and clean

```svelte
<script lang="ts">
  import { Progress } from "$lib/components/ui/progress/index.js";
</script>

<Progress value={33} max={100} />
```

**Features:**
- `value` prop (0-100)
- `max` prop (default: 100)
- `class` prop for customization
- ARIA attributes: `role="progressbar"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- Smooth transition animation (300ms ease-in-out)
- Default styling: `h-2 w-full bg-gray-200 dark:bg-gray-800`
- Fill bar: `bg-blue-600` with transform animation

**Customization:**
```svelte
<Progress value={66} class="h-3 bg-rose-100" />
```

---

## 📁 Document Loading Operations in ClaimTech

### 1. Document Generation (4 types)
- **Assessment Report** - PDF with claim summary, assessor info, captured data
- **Estimate** - PDF with line items, totals, T&Cs
- **Photos PDF** - Compilation of all assessment photos
- **Photos ZIP** - Downloadable archive of photos

**Location:** `src/lib/components/assessment/FinalizeTab.svelte`  
**Service:** `src/lib/services/document-generation.service.ts`  
**API Endpoints:** `src/routes/api/generate-*`

### 2. File Uploads (3 types)
- **Photo Upload** - Vehicle photos, damage photos, interior photos
- **PDF Upload** - Assessment PDFs, FRC documents
- **File Dropzone** - Generic file upload with drag-and-drop

**Components:**
- `src/lib/components/forms/PhotoUpload.svelte`
- `src/lib/components/forms/PdfUpload.svelte`
- `src/lib/components/ui/file-dropzone/FileDropzone.svelte`

### 3. Existing Progress UI

**DocumentGenerationProgress.svelte** (137 lines)
- Per-document progress tracking
- Status icons (pending, processing, success, error)
- Progress bars (custom inline, not shadcn)
- Retry buttons for failed documents
- Success links to download documents

**Current Progress Bar Implementation:**
```svelte
<div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
  <div 
    class="h-full transition-all duration-300 {getProgressColor(doc.data.status)}"
    style="width: {doc.data.progress}%"
  ></div>
</div>
```

---

## 🎯 Document Loading Scenarios

### Scenario 1: Generate All Documents
**Trigger:** FinalizeTab "Generate All Documents" button  
**Flow:**
1. User clicks button
2. Modal/overlay shows with progress
3. 4 documents generate sequentially (0-100%)
4. Each document shows individual progress
5. Success/error states displayed
6. Download links appear on success

**Current State:** Uses custom progress bars  
**Opportunity:** Replace with shadcn Progress component

### Scenario 2: Generate Single Document
**Trigger:** Individual "Generate" button per document  
**Flow:**
1. User clicks generate for one document
2. Progress shown inline or in modal
3. Document generates (0-100%)
4. Success/error state shown
5. Download link appears

### Scenario 3: Photo Upload
**Trigger:** Photo upload in assessment tabs  
**Flow:**
1. User selects/drags photo
2. Compression progress shown (0-100%)
3. Upload progress shown (0-100%)
4. Success state shown
5. Photo displayed

**Current:** Uses custom inline progress bar  
**Location:** `FileDropzone.svelte:345-350`

### Scenario 4: PDF Upload
**Trigger:** PDF upload in FRC/Additionals  
**Flow:**
1. User selects PDF
2. Upload progress shown (0-100%)
3. Success/error state shown

---

## 🔧 Current Implementation Patterns

### Pattern 1: Custom Inline Progress (FileDropzone)
```svelte
{#if progress > 0}
  <div class="mx-auto mt-2 h-2 w-32 overflow-hidden rounded-full bg-gray-200">
    <div
      class="h-full bg-blue-500 transition-all duration-300"
      style="width: {progress}%"
    ></div>
  </div>
{/if}
```

### Pattern 2: Custom Progress with Status (DocumentGenerationProgress)
```svelte
<div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
  <div 
    class="h-full transition-all duration-300 {getProgressColor(status)}"
    style="width: {progress}%"
  ></div>
</div>
```

### Pattern 3: Simulated Progress (PdfUpload)
```svelte
const progressInterval = setInterval(() => {
  if (uploadProgress < 90) {
    uploadProgress += 10;
  }
}, 100);
```

---

## 🎨 App Style & Theme

**Primary Colors:**
- Rose: `text-rose-500`, `bg-rose-500`, `border-rose-500`
- Blue: `text-blue-500`, `bg-blue-500` (current progress bars)
- Gray: `text-gray-700`, `bg-gray-200` (backgrounds)

**Recommended for Progress Bars:**
- **Primary:** Rose theme (matches app branding)
- **Background:** `bg-rose-100` (light rose)
- **Fill:** `bg-rose-500` (rose)
- **Alternative:** Keep blue for document generation (distinct from navigation)

---

## 📋 Files to Modify/Create

### To Create
1. **DocumentLoadingModal.svelte** - Full-screen modal with progress
2. **DocumentProgressBar.svelte** - Reusable progress bar component
3. **FileUploadProgress.svelte** - File upload progress indicator

### To Modify
1. **DocumentGenerationProgress.svelte** - Replace custom progress with shadcn
2. **FileDropzone.svelte** - Replace custom progress with shadcn
3. **PdfUpload.svelte** - Replace custom progress with shadcn
4. **PhotoUpload.svelte** - Replace custom progress with shadcn

---

## 🔗 Related Components & Services

**Services:**
- `document-generation.service.ts` - Handles SSE streaming
- `storage.service.ts` - Handles file uploads with progress callbacks
- `image-compression.service.ts` - Handles photo compression

**Components:**
- `FinalizeTab.svelte` - Document generation UI
- `FileDropzone.svelte` - File upload with progress
- `PhotoUpload.svelte` - Photo upload with compression
- `PdfUpload.svelte` - PDF upload

---

## ✅ Next Steps

1. **Create DocumentLoadingModal** - Modal overlay with shadcn Progress
2. **Create DocumentProgressBar** - Reusable progress component
3. **Update DocumentGenerationProgress** - Use shadcn Progress
4. **Update FileDropzone** - Use shadcn Progress
5. **Update PhotoUpload** - Use shadcn Progress
6. **Update PdfUpload** - Use shadcn Progress
7. **Test all scenarios** - Verify progress displays correctly
8. **Update documentation** - Add Pattern 8 to ui_loading_patterns.md

---

**Status:** ✅ RESEARCH COMPLETE - READY FOR IMPLEMENTATION PLANNING

