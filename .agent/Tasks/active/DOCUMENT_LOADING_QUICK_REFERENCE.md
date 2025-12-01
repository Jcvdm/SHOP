# Document Loading Progress - Quick Reference

**Date:** November 23, 2025  
**Status:** READY FOR IMPLEMENTATION  
**Time Estimate:** 5-8 hours

---

## 🎯 What We're Building

Replace custom progress bars with **shadcn-svelte Progress** component across:
- Document generation (4 documents)
- Photo uploads (compression + upload)
- PDF uploads
- File dropzone uploads

**Theme:** Rose (app primary color)

---

## 📦 shadcn-svelte Progress API

```svelte
<script lang="ts">
  import { Progress } from "$lib/components/ui/progress";
</script>

<!-- Basic usage -->
<Progress value={50} />

<!-- With max value -->
<Progress value={50} max={100} />

<!-- With custom styling -->
<Progress value={75} class="h-3 bg-rose-100" />
```

**Props:**
- `value?: number` - Progress 0-100
- `max?: number` - Max value (default: 100)
- `class?: string` - Custom CSS

---

## 🆕 Components to Create

### 1. DocumentLoadingModal.svelte
**Purpose:** Full-screen modal with progress  
**Props:** `isOpen`, `title`, `progress`, `message`, `isError`  
**Location:** `src/lib/components/layout/`

### 2. DocumentProgressBar.svelte
**Purpose:** Reusable progress with status icon  
**Props:** `value`, `status`, `label`, `showPercentage`  
**Location:** `src/lib/components/ui/progress/`

### 3. FileUploadProgress.svelte
**Purpose:** Two-phase progress (compression + upload)  
**Props:** `compressionProgress`, `uploadProgress`, `isCompressing`, `isUploading`, `fileName`  
**Location:** `src/lib/components/ui/progress/`

---

## 🔄 Components to Update

### 1. DocumentGenerationProgress.svelte
**Change:** Replace custom progress bars (lines 89-94)  
**Before:** Custom div with inline styles  
**After:** `<Progress value={doc.data.progress} class="bg-rose-100" />`

### 2. FileDropzone.svelte
**Change:** Replace custom progress bar (lines 345-350)  
**Before:** Custom div with inline styles  
**After:** `<Progress value={progress} class="mx-auto w-32 bg-rose-100" />`

### 3. PhotoUpload.svelte
**Change:** Use FileUploadProgress component  
**Before:** Custom progress display  
**After:** `<FileUploadProgress ... />`

### 4. PdfUpload.svelte
**Change:** Use FileUploadProgress component  
**Before:** Custom progress display  
**After:** `<FileUploadProgress ... />`

---

## 🎨 Styling

**Rose Theme (App Primary):**
```css
bg-rose-100    /* Background */
bg-rose-500    /* Fill */
text-rose-500  /* Text */
```

**Status Colors:**
```css
text-rose-500    /* Processing */
text-green-500   /* Success */
text-red-500     /* Error */
text-gray-400    /* Pending */
```

**Size Variants:**
```svelte
<!-- Large -->
<Progress value={50} class="h-3 bg-rose-100" />

<!-- Normal (default) -->
<Progress value={50} class="bg-rose-100" />

<!-- Small -->
<Progress value={50} class="h-1 bg-rose-100" />
```

---

## 📋 Implementation Checklist

**Phase 1: Create Components**
- [ ] DocumentLoadingModal.svelte
- [ ] DocumentProgressBar.svelte
- [ ] FileUploadProgress.svelte
- [ ] Create index.ts exports

**Phase 2: Update Components**
- [ ] DocumentGenerationProgress.svelte
- [ ] FileDropzone.svelte
- [ ] PhotoUpload.svelte
- [ ] PdfUpload.svelte

**Phase 3: Testing & Docs**
- [ ] Test document generation
- [ ] Test photo uploads
- [ ] Test PDF uploads
- [ ] Test file dropzone
- [ ] Update ui_loading_patterns.md
- [ ] Run npm run check
- [ ] Create testing checklist

---

## 🔗 Key Files

**To Create:**
- `src/lib/components/layout/DocumentLoadingModal.svelte`
- `src/lib/components/ui/progress/DocumentProgressBar.svelte`
- `src/lib/components/ui/progress/FileUploadProgress.svelte`

**To Update:**
- `src/lib/components/assessment/DocumentGenerationProgress.svelte`
- `src/lib/components/ui/file-dropzone/FileDropzone.svelte`
- `src/lib/components/forms/PhotoUpload.svelte`
- `src/lib/components/forms/PdfUpload.svelte`

**To Update Docs:**
- `.agent/System/ui_loading_patterns.md`

---

## 💡 Code Examples

### DocumentProgressBar Usage
```svelte
<DocumentProgressBar
  value={progress}
  status="processing"
  label="Assessment Report"
  showPercentage={true}
/>
```

### FileUploadProgress Usage
```svelte
<FileUploadProgress
  isCompressing={compressing}
  isUploading={uploading}
  compressionProgress={compressionProgress}
  uploadProgress={uploadProgress}
  fileName={file?.name}
/>
```

### DocumentLoadingModal Usage
```svelte
<DocumentLoadingModal
  isOpen={generating}
  title="Generating Documents"
  progress={overallProgress}
  message={statusMessage}
  isError={hasError}
/>
```

---

## 🚀 Ready to Start?

**All context gathered and documented!**

**Next:** Proceed with Phase 1 implementation

**Estimated Time:** 5-8 hours total

**Files Created:**
1. ✅ DOCUMENT_LOADING_PROGRESS_RESEARCH.md
2. ✅ DOCUMENT_LOADING_IMPLEMENTATION_GUIDE.md
3. ✅ DOCUMENT_LOADING_CONTEXT_SUMMARY.md
4. ✅ DOCUMENT_LOADING_QUICK_REFERENCE.md (this file)

---

**Status:** ✅ CONTEXT COMPLETE - READY FOR IMPLEMENTATION

