# Photo Upload Implementation Roadmap

**Date**: November 23, 2025  
**Status**: CONTEXT GATHERING COMPLETE - Ready for Implementation  
**Estimated Duration**: 1.5 hours

---

## 🎯 Objective

Transfer 6 key features from PhotoUpload.svelte to InteriorPhotosPanel.svelte and TyrePhotosPanel.svelte:

1. **Compression** - Client-side image compression (60-75% reduction)
2. **Two-Phase Progress** - Separate compression and upload progress tracking
3. **FileUploadProgress** - Shadcn-svelte progress component (rose theme)
4. **Camera Input** - Mobile camera capture support
5. **Rose Theme** - Update from blue to rose color scheme
6. **ARIA Attributes** - Full accessibility support

---

## 📋 Phase 1: InteriorPhotosPanel.svelte (30 min)

### Step 1.1: Add State Variables (2 min)
```typescript
let compressing = $state(false);
let compressionProgress = $state(0);
let cameraInput: HTMLInputElement;
```

### Step 1.2: Add Import (1 min)
```typescript
import { FileUploadProgress } from '$lib/components/ui/progress';
```

### Step 1.3: Update uploadFiles() Function (10 min)
- Add compression callbacks to storageService.uploadAssessmentPhoto()
- Update finally block to reset compressing state

### Step 1.4: Replace Progress Bar (5 min)
- Remove custom progress bar HTML (lines 241-252, 300-310)
- Replace with FileUploadProgress component

### Step 1.5: Update Colors (5 min)
- Find & replace: blue → rose (6 occurrences)
- Verify rose theme consistency

### Step 1.6: Add Camera Input (5 min)
- Add camera input HTML element
- Add triggerCameraInput() function

### Step 1.7: Add ARIA Attributes (2 min)
- Add role, tabindex, aria-label to upload zone
- Add keyboard handler

---

## 📋 Phase 2: TyrePhotosPanel.svelte (30 min)

### Step 2.1-2.7: Repeat Phase 1 Steps
- Same changes as InteriorPhotosPanel
- Estimated: 30 minutes

---

## 📋 Phase 3: Testing & Verification (30 min)

### Step 3.1: Build Check (5 min)
```bash
npm run check
```
Expected: 0 errors

### Step 3.2: Visual Testing (10 min)
- [ ] Rose theme colors visible
- [ ] Progress bars display correctly
- [ ] Camera input available
- [ ] Drag & drop works
- [ ] File picker works

### Step 3.3: Compression Testing (10 min)
- [ ] Upload 5MB+ file
- [ ] Verify compression progress shows
- [ ] Verify upload progress shows
- [ ] Check final file size (should be ~1.8MB)

### Step 3.4: Mobile Testing (5 min)
- [ ] Test camera input on mobile
- [ ] Test drag & drop on mobile
- [ ] Test file picker on mobile

---

## 📊 Implementation Checklist

### InteriorPhotosPanel.svelte
- [ ] Add state variables (compressing, compressionProgress, cameraInput)
- [ ] Add FileUploadProgress import
- [ ] Update uploadFiles() with compression callbacks
- [ ] Replace custom progress bar with FileUploadProgress
- [ ] Update colors (blue → rose)
- [ ] Add camera input HTML
- [ ] Add triggerCameraInput() function
- [ ] Add ARIA attributes
- [ ] Add keyboard handler

### TyrePhotosPanel.svelte
- [ ] Add state variables (compressing, compressionProgress, cameraInput)
- [ ] Add FileUploadProgress import
- [ ] Update uploadFiles() with compression callbacks
- [ ] Replace custom progress bar with FileUploadProgress
- [ ] Update colors (blue → rose)
- [ ] Add camera input HTML
- [ ] Add triggerCameraInput() function
- [ ] Add ARIA attributes
- [ ] Add keyboard handler

### Testing
- [ ] npm run check (0 errors)
- [ ] Visual testing (rose theme, progress bars)
- [ ] Compression testing (5MB+ file)
- [ ] Mobile testing (camera, drag & drop)
- [ ] Accessibility testing (ARIA, keyboard)

---

## 🔍 Quality Gates

| Gate | Criteria | Status |
|------|----------|--------|
| Build | 0 errors | ⏳ Pending |
| Compression | 60-75% reduction | ⏳ Pending |
| Progress | Two-phase visible | ⏳ Pending |
| Theme | Rose colors | ⏳ Pending |
| Mobile | Camera works | ⏳ Pending |
| Accessibility | ARIA attributes | ⏳ Pending |

---

## 📚 Reference Documents

1. **PHOTO_UPLOAD_COMPONENT_ANALYSIS.md** - Detailed comparison
2. **PHOTO_UPLOAD_CONTEXT_GATHERING_SUMMARY.md** - Context summary
3. **PHOTO_UPLOAD_TECHNICAL_REFERENCE.md** - Technical patterns
4. **PHOTO_UPLOAD_QUICK_REFERENCE.md** - Copy-paste patterns

---

## 🚀 Success Criteria

✅ All 6 features transferred to both panels  
✅ Build passes with 0 errors  
✅ Rose theme applied consistently  
✅ Compression working (60-75% reduction)  
✅ Two-phase progress visible  
✅ Camera input available on mobile  
✅ ARIA attributes present  
✅ Manual testing completed  

---

## 📞 Support

- **Questions?** Review PHOTO_UPLOAD_QUICK_REFERENCE.md
- **Technical Details?** Review PHOTO_UPLOAD_TECHNICAL_REFERENCE.md
- **Comparison?** Review PHOTO_UPLOAD_COMPONENT_ANALYSIS.md


