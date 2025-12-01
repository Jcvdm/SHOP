# Document Loading Progress - Implementation Guide

**Date:** November 23, 2025  
**Status:** DESIGN & PLANNING  
**Component:** shadcn-svelte Progress Bar + Document Loading UI

---

## 🎯 Implementation Plan

### Phase 1: Create Reusable Components (2-3 hours)
1. **DocumentLoadingModal.svelte** - Full-screen modal with progress
2. **DocumentProgressBar.svelte** - Reusable progress component
3. **FileUploadProgress.svelte** - File upload progress indicator

### Phase 2: Update Existing Components (2-3 hours)
1. Update **DocumentGenerationProgress.svelte** - Use shadcn Progress
2. Update **FileDropzone.svelte** - Use shadcn Progress
3. Update **PhotoUpload.svelte** - Use shadcn Progress
4. Update **PdfUpload.svelte** - Use shadcn Progress

### Phase 3: Testing & Documentation (1-2 hours)
1. Test all document generation scenarios
2. Test all file upload scenarios
3. Update ui_loading_patterns.md with Pattern 8
4. Create testing checklist

---

## 📐 Component Designs

### 1. DocumentLoadingModal.svelte (NEW)

**Purpose:** Full-screen modal for document generation with progress  
**Location:** `src/lib/components/layout/DocumentLoadingModal.svelte`  
**Props:**
- `isOpen: boolean` - Show/hide modal
- `title: string` - Modal title
- `progress: number` - Progress 0-100
- `message: string` - Status message
- `isError: boolean` - Error state

**Code Pattern:**
```svelte
<script lang="ts">
  import { Progress } from '$lib/components/ui/progress';
  import { Loader2, AlertCircle } from 'lucide-svelte';

  interface Props {
    isOpen?: boolean;
    title?: string;
    progress?: number;
    message?: string;
    isError?: boolean;
  }

  let { isOpen = false, title = 'Processing...', progress = 0, message = '', isError = false }: Props = $props();
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
    <div class="flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow-lg w-96">
      <h2 class="text-lg font-semibold">{title}</h2>
      
      {#if isError}
        <AlertCircle class="size-8 text-red-500" />
      {:else}
        <Loader2 class="size-8 text-rose-500 animate-spin" />
      {/if}
      
      <Progress value={progress} class="w-full" />
      
      <div class="text-center">
        <p class="text-sm font-medium text-gray-700">{message}</p>
        <p class="text-xs text-gray-500 mt-1">{progress}%</p>
      </div>
    </div>
  </div>
{/if}
```

### 2. DocumentProgressBar.svelte (NEW)

**Purpose:** Reusable progress bar with status indicator  
**Location:** `src/lib/components/ui/progress/DocumentProgressBar.svelte`  
**Props:**
- `value: number` - Progress 0-100
- `status: 'pending' | 'processing' | 'success' | 'error'`
- `label: string` - Progress label
- `showPercentage: boolean` - Show % text

**Code Pattern:**
```svelte
<script lang="ts">
  import { Progress } from '$lib/components/ui/progress';
  import { Clock, Loader2, CheckCircle, AlertCircle } from 'lucide-svelte';

  interface Props {
    value?: number;
    status?: 'pending' | 'processing' | 'success' | 'error';
    label?: string;
    showPercentage?: boolean;
  }

  let { value = 0, status = 'pending', label = '', showPercentage = true }: Props = $props();

  const statusIcons = {
    pending: Clock,
    processing: Loader2,
    success: CheckCircle,
    error: AlertCircle
  };

  const statusColors = {
    pending: 'text-gray-400',
    processing: 'text-rose-500',
    success: 'text-green-500',
    error: 'text-red-500'
  };

  const progressColors = {
    pending: 'bg-rose-100',
    processing: 'bg-rose-100',
    success: 'bg-green-100',
    error: 'bg-red-100'
  };
</script>

<div class="space-y-2">
  <div class="flex items-center gap-2">
    {@const Icon = statusIcons[status]}
    <Icon class="size-4 {statusColors[status]} {status === 'processing' ? 'animate-spin' : ''}" />
    <span class="text-sm font-medium">{label}</span>
    {#if showPercentage}
      <span class="ml-auto text-xs text-gray-500">{value}%</span>
    {/if}
  </div>
  <Progress value={value} class={progressColors[status]} />
</div>
```

### 3. FileUploadProgress.svelte (NEW)

**Purpose:** File upload progress with compression + upload phases  
**Location:** `src/lib/components/ui/progress/FileUploadProgress.svelte`  
**Props:**
- `compressionProgress: number` - Compression 0-100
- `uploadProgress: number` - Upload 0-100
- `isCompressing: boolean` - Compression phase
- `isUploading: boolean` - Upload phase
- `fileName: string` - File name

**Code Pattern:**
```svelte
<script lang="ts">
  import { Progress } from '$lib/components/ui/progress';
  import { Loader2 } from 'lucide-svelte';

  interface Props {
    compressionProgress?: number;
    uploadProgress?: number;
    isCompressing?: boolean;
    isUploading?: boolean;
    fileName?: string;
  }

  let { compressionProgress = 0, uploadProgress = 0, isCompressing = false, isUploading = false, fileName = '' }: Props = $props();
</script>

<div class="space-y-3">
  <div class="flex items-center gap-2">
    <Loader2 class="size-4 text-rose-500 animate-spin" />
    <span class="text-sm font-medium">
      {#if isCompressing}
        Compressing {fileName}...
      {:else if isUploading}
        Uploading {fileName}...
      {:else}
        Processing...
      {/if}
    </span>
  </div>

  {#if isCompressing}
    <div class="space-y-1">
      <div class="flex justify-between text-xs text-gray-600">
        <span>Compression</span>
        <span>{compressionProgress}%</span>
      </div>
      <Progress value={compressionProgress} class="bg-rose-100" />
    </div>
  {/if}

  {#if isUploading}
    <div class="space-y-1">
      <div class="flex justify-between text-xs text-gray-600">
        <span>Upload</span>
        <span>{uploadProgress}%</span>
      </div>
      <Progress value={uploadProgress} class="bg-rose-100" />
    </div>
  {/if}
</div>
```

---

## 🔄 Update Existing Components

### Update 1: DocumentGenerationProgress.svelte

**Change:** Replace custom progress bars with shadcn Progress  
**Lines to Replace:** 89-94 (custom progress bar)

**Before:**
```svelte
<div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
  <div 
    class="h-full transition-all duration-300 {getProgressColor(doc.data.status)}"
    style="width: {doc.data.progress}%"
  ></div>
</div>
```

**After:**
```svelte
<Progress 
  value={doc.data.progress} 
  class="bg-rose-100"
/>
```

### Update 2: FileDropzone.svelte

**Change:** Replace custom progress bar with shadcn Progress  
**Lines to Replace:** 345-350

**Before:**
```svelte
<div class="mx-auto mt-2 h-2 w-32 overflow-hidden rounded-full bg-gray-200">
  <div
    class="h-full bg-blue-500 transition-all duration-300"
    style="width: {progress}%"
  ></div>
</div>
```

**After:**
```svelte
<Progress value={progress} class="mx-auto w-32 bg-rose-100" />
```

### Update 3: PhotoUpload.svelte

**Change:** Use FileUploadProgress component  
**Location:** Around line 130-140

**Before:**
```svelte
<!-- Custom progress display -->
```

**After:**
```svelte
<FileUploadProgress
  isCompressing={compressing}
  isUploading={uploading}
  compressionProgress={compressionProgress}
  uploadProgress={uploadProgress}
  fileName={file?.name}
/>
```

### Update 4: PdfUpload.svelte

**Change:** Use FileUploadProgress component  
**Location:** Around line 115-120

---

## 🎨 Styling & Theme

**Rose Theme (App Primary):**
```css
/* Progress bar background */
bg-rose-100

/* Progress fill */
bg-rose-500

/* Status colors */
text-rose-500 (processing)
text-green-500 (success)
text-red-500 (error)
text-gray-400 (pending)
```

**Customization Examples:**
```svelte
<!-- Large progress bar -->
<Progress value={66} class="h-3 bg-rose-100" />

<!-- Small progress bar -->
<Progress value={33} class="h-1 bg-rose-100" />

<!-- Full width -->
<Progress value={50} class="w-full bg-rose-100" />
```

---

## 📋 Implementation Checklist

- [ ] Create DocumentLoadingModal.svelte
- [ ] Create DocumentProgressBar.svelte
- [ ] Create FileUploadProgress.svelte
- [ ] Update DocumentGenerationProgress.svelte
- [ ] Update FileDropzone.svelte
- [ ] Update PhotoUpload.svelte
- [ ] Update PdfUpload.svelte
- [ ] Test document generation
- [ ] Test file uploads
- [ ] Test photo uploads
- [ ] Update ui_loading_patterns.md
- [ ] Create testing checklist

---

**Status:** ✅ DESIGN COMPLETE - READY FOR IMPLEMENTATION

