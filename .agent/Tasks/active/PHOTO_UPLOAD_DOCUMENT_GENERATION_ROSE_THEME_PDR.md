# PDR: Photo Upload & Document Generation Rose Theme Implementation

**Status**: Ready for Implementation  
**Priority**: High  
**Estimated Effort**: 2-3 hours  
**Created**: 2025-11-23

---

## 1. OBJECTIVE

Standardize ALL photo upload components and document generation progress indicators to use:
- **Rose theme** (`rose-500`, `rose-600`, `rose-100`) instead of blue
- **FileUploadProgress** component for consistent two-phase progress (compression + upload)
- **Camera input** for mobile photo capture
- **ARIA attributes** for accessibility

---

## 2. SCOPE

### 2.1 Photo Upload Components (6 components)

| Component | Location | Status | Lines |
|-----------|----------|--------|-------|
| PhotoUpload.svelte | `src/lib/components/forms/` | ❌ Blue theme | 355 |
| PreIncidentPhotosPanel.svelte | `src/lib/components/assessment/` | ❌ Blue theme | 361 |
| EstimatePhotosPanel.svelte | `src/lib/components/assessment/` | ❌ Blue theme | ~380 |
| AdditionalsPhotosPanel.svelte | `src/lib/components/assessment/` | ❌ Blue theme | 347 |
| Exterior360PhotosPanel.svelte | `src/lib/components/assessment/` | ❌ Blue theme | 380 |
| InteriorPhotosPanel.svelte | `src/lib/components/assessment/` | ✅ DONE | 424 |
| TyrePhotosPanel.svelte | `src/lib/components/assessment/` | ✅ DONE | 308 |

### 2.2 Document Generation Components (1 component)

| Component | Location | Status | Lines |
|-----------|----------|--------|-------|
| DocumentCard.svelte | `src/lib/components/assessment/` | ❌ Blue theme | 151 |

---

## 3. IMPLEMENTATION PLAN

### Phase 1: PhotoUpload.svelte (Single Photo Upload)
**Used in**: VehicleIdentificationTab (5 photos), InteriorMechanicalTab (4 photos)

#### Changes Required:
1. **Line 251-252**: Change drag state colors
   - `border-blue-500 bg-blue-50` → `border-rose-500 bg-rose-50`
2. **Line 267-268**: Change drag drop icon/text colors
   - `text-blue-500` → `text-rose-500`
   - `text-blue-600` → `text-rose-600`
3. **Line 280-281**: Change drag state colors (second button)
   - `border-blue-500 bg-blue-50` → `border-rose-500 bg-rose-50`
4. **Line 296-297**: Change drag drop icon/text colors (second button)
   - `text-blue-500` → `text-rose-500`
   - `text-blue-600` → `text-rose-600`

**Note**: Already uses FileUploadProgress (lines 258-264, 287-293) ✅

---

### Phase 2: PreIncidentPhotosPanel.svelte (Multi-Photo Gallery)
**Used in**: PreIncidentEstimateTab

#### Changes Required:
1. **Add imports** (line 4):
   ```svelte
   import { Upload, Camera } from 'lucide-svelte'; // Add Camera
   import { FileUploadProgress } from '$lib/components/ui/progress'; // Add
   ```

2. **Add state variables** (~line 30):
   ```svelte
   let compressing = $state(false);
   let compressionProgress = $state(0);
   let cameraInput: HTMLInputElement;
   ```

3. **Update uploadFiles() function** (~line 50):
   - Add compression progress callbacks
   - Update state: `compressing`, `compressionProgress`
   - Pattern from InteriorPhotosPanel lines 60-100

4. **Replace progress UI** (lines 220-231):
   - Remove: `<Loader2>` + custom blue progress bar
   - Add: `<FileUploadProgress>` component

5. **Replace progress UI in grid** (lines 278-289):
   - Remove: `<Loader2>` + custom blue progress bar
   - Add: `<FileUploadProgress>` component

6. **Add Camera button** (~line 250):
   - Add Camera icon button next to Upload button
   - Pattern from InteriorPhotosPanel lines 296-305

7. **Add camera input element** (after line 360):
   ```svelte
   <input
       bind:this={cameraInput}
       type="file"
       accept="image/*"
       capture="environment"
       multiple
       onchange={handleFileSelect}
       class="hidden"
   />
   ```

8. **Update drag colors** (~lines 234-235):
   - `text-blue-500` → `text-rose-500`
   - `text-blue-600` → `text-rose-600`

---

### Phase 3: EstimatePhotosPanel.svelte (Multi-Photo Gallery)
**Used in**: EstimateTab

#### Changes Required:
**IDENTICAL to Phase 2** - Same pattern as PreIncidentPhotosPanel

---

### Phase 4: AdditionalsPhotosPanel.svelte (Multi-Photo Gallery)
**Used in**: AdditionalsTab

#### Changes Required:
**IDENTICAL to Phase 2** - Same pattern as PreIncidentPhotosPanel

---

### Phase 5: Exterior360PhotosPanel.svelte (Multi-Photo Gallery)
**Used in**: Exterior360Tab

#### Changes Required:
**IDENTICAL to Phase 2** - Same pattern as PreIncidentPhotosPanel

---

### Phase 6: DocumentCard.svelte (Document Generation Progress)
**Used in**: FinalizeTab (4 individual document cards)

#### Changes Required:
1. **Line 82**: Background color
   - `bg-blue-50` → `bg-rose-50`

2. **Line 84**: Spinner color
   - `text-blue-600` → `text-rose-500`

3. **Line 85**: Text color
   - `text-blue-900` → `text-gray-900`

4. **Line 91**: Progress message color
   - `text-blue-700` → `text-rose-700`

5. **Line 92**: Percentage color
   - `text-blue-900` → `text-gray-900`

6. **Line 94**: Progress bar background
   - `bg-blue-200` → `bg-rose-200`

7. **Line 96**: Progress bar fill
   - `bg-blue-600` → `bg-rose-500`

8. **Lines 102-105**: Info text colors
   - `text-blue-700` → `text-rose-700`
   - `text-blue-600` → `text-rose-600`

---

## 4. TESTING CHECKLIST

### Photo Upload Testing:
- [ ] **VehicleIdentificationTab**: Upload 5 photos (registration, VIN, engine, license disc, driver license)
  - [ ] Verify rose theme on drag/drop
  - [ ] Verify FileUploadProgress shows compression → upload
  - [ ] Test camera button on mobile
- [ ] **InteriorMechanicalTab**: Upload 4 engine bay photos
  - [ ] Verify rose theme
  - [ ] Verify compression progress
- [ ] **PreIncidentEstimateTab**: Upload multiple photos
  - [ ] Verify FileUploadProgress in empty state
  - [ ] Verify FileUploadProgress in grid state
  - [ ] Test camera button
- [ ] **EstimateTab**: Upload damage photos
  - [ ] Same as PreIncidentEstimateTab
- [ ] **AdditionalsTab**: Upload additional photos
  - [ ] Same as PreIncidentEstimateTab
- [ ] **Exterior360Tab**: Upload 360° photos
  - [ ] Same as PreIncidentEstimateTab

### Document Generation Testing:
- [ ] **FinalizeTab**: Generate individual documents
  - [ ] Click "Generate Report" → verify rose progress
  - [ ] Click "Generate Estimate" → verify rose progress
  - [ ] Click "Generate Photos PDF" → verify rose progress
  - [ ] Click "Generate Photos ZIP" → verify rose progress
- [ ] **FinalizeTab**: Generate all documents
  - [ ] Click "Generate All Documents" → verify DocumentLoadingModal (already done ✅)

---

## 5. REFERENCE IMPLEMENTATION

**Source**: InteriorPhotosPanel.svelte (lines 1-424)

### Key Patterns:
1. **Imports**:
   ```svelte
   import { Camera } from 'lucide-svelte';
   import { FileUploadProgress } from '$lib/components/ui/progress';
   ```

2. **State**:
   ```svelte
   let compressing = $state(false);
   let compressionProgress = $state(0);
   let cameraInput: HTMLInputElement;
   ```

3. **Upload with callbacks**:
   ```svelte
   const result = await storageService.uploadAssessmentPhoto(
       file,
       assessmentId,
       category,
       subcategory,
       {
           onCompressionProgress: (progress) => {
               compressing = true;
               uploading = false;
               compressionProgress = progress;
           },
           onUploadProgress: (progress) => {
               compressing = false;
               uploading = true;
               uploadProgress = progress;
           }
       }
   );
   ```

4. **FileUploadProgress component**:
   ```svelte
   <FileUploadProgress
       isCompressing={compressing}
       isUploading={uploading}
       compressionProgress={compressionProgress}
       uploadProgress={uploadProgress}
       fileName={file.name}
   />
   ```

5. **Camera input**:
   ```svelte
   <input
       bind:this={cameraInput}
       type="file"
       accept="image/*"
       capture="environment"
       multiple
       onchange={handleFileSelect}
       class="hidden"
   />
   ```

---

## 6. VALIDATION

After implementation:
1. Run `npm run check` → Must pass with 0 errors
2. Test all 6 photo upload locations
3. Test all 4 document generation cards
4. Verify NO blue colors remain in progress indicators
5. Verify compression progress shows before upload progress
6. Verify camera button works on mobile devices

---

## 7. RELATED DOCUMENTATION

- `.agent/System/photo_compression_implementation.md` - Compression system
- `.agent/System/unified_photo_panel_pattern.md` - Photo panel patterns
- `.agent/Tasks/active/PHOTO_UPLOAD_QUICK_REFERENCE.md` - Quick reference

