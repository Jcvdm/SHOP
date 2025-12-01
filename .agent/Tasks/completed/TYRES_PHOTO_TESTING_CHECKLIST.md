# TYRES PHOTO REFACTORING - TESTING CHECKLIST

**Phase**: PHASE 9 - Testing & Verification  
**Status**: Ready for Manual Testing  
**Created**: November 10, 2025

---

## 🔧 PRE-TESTING SETUP

### 1. Apply Migrations
```bash
# Run migrations 082 and 083 on Supabase
# These create the new assessment_tyre_photos table and migrate existing data
```

### 2. Verify Database
```sql
-- Check new table exists
SELECT * FROM assessment_tyre_photos LIMIT 1;

-- Check old columns removed from assessment_tyres
SELECT * FROM assessment_tyres LIMIT 1;
-- Should NOT have: face_photo_url, tread_photo_url, measurement_photo_url

-- Check data migration
SELECT COUNT(*) FROM assessment_tyre_photos;
-- Should match total of old photos
```

### 3. Start Dev Server
```bash
npm run dev
```

---

## ✅ TESTING CHECKLIST

### SECTION 1: Basic Photo Upload

- [ ] **Test 1.1: Single Photo Upload**
  - Navigate to assessment page
  - Go to Tyres tab
  - Click upload zone on first tyre
  - Select single photo
  - Verify: Photo appears in grid immediately (optimistic update)
  - Verify: Photo persists after page reload

- [ ] **Test 1.2: Multiple Photos Upload**
  - Upload 3+ photos to same tyre
  - Verify: All photos appear in grid
  - Verify: Photos maintain order (display_order)
  - Verify: Upload zone remains visible (compact mode)

- [ ] **Test 1.3: Drag & Drop Upload**
  - Drag photo file to upload zone
  - Verify: Photo uploads successfully
  - Verify: Progress indicator shows during upload

---

### SECTION 2: Photo Viewer & Navigation

- [ ] **Test 2.1: Open Fullscreen Viewer**
  - Click on any photo thumbnail
  - Verify: Fullscreen viewer opens
  - Verify: Photo displays at full size
  - Verify: Navigation arrows visible

- [ ] **Test 2.2: Navigate Between Photos**
  - Use arrow keys or click arrows
  - Verify: Photos cycle through correctly
  - Verify: Current photo index shown
  - Verify: Keyboard shortcuts work (arrow keys)

- [ ] **Test 2.3: Close Viewer**
  - Press Escape key
  - Click close button
  - Verify: Viewer closes and returns to grid

---

### SECTION 3: Photo Labels & Editing

- [ ] **Test 3.1: View Photo Label**
  - Open fullscreen viewer
  - Verify: Photo label displayed (Face, Tread, Measurement, etc.)
  - Verify: Label matches what was set during upload

- [ ] **Test 3.2: Edit Photo Label**
  - Open fullscreen viewer
  - Click on label to edit
  - Change label to new value
  - Verify: Label updates immediately
  - Verify: Label persists after page reload

- [ ] **Test 3.3: Custom Labels**
  - Edit label to custom value (e.g., "Damage", "Sidewall Wear")
  - Verify: Custom label saves correctly
  - Verify: Custom label appears in reports

---

### SECTION 4: Photo Deletion

- [ ] **Test 4.1: Delete from Viewer**
  - Open fullscreen viewer
  - Click delete button
  - Verify: Confirmation dialog appears
  - Confirm deletion
  - Verify: Photo removed from grid immediately
  - Verify: Photo removed from database

- [ ] **Test 4.2: Delete Multiple Photos**
  - Upload 3 photos
  - Delete 2 of them
  - Verify: Remaining photo still displays correctly
  - Verify: Display order updated

---

### SECTION 5: Multi-Tyre Testing

- [ ] **Test 5.1: Upload to Multiple Tyres**
  - Upload photos to Front Left tyre
  - Upload photos to Front Right tyre
  - Upload photos to Rear Left tyre
  - Upload photos to Rear Right tyre
  - Verify: Each tyre has its own photos
  - Verify: Photos don't mix between tyres

- [ ] **Test 5.2: Add Additional Tyres**
  - Add a 5th tyre (if supported)
  - Upload photos to new tyre
  - Verify: New tyre panel appears
  - Verify: Photos upload correctly

- [ ] **Test 5.3: Delete Tyre with Photos**
  - Delete a tyre that has photos
  - Verify: Photos cascade delete (ON DELETE CASCADE)
  - Verify: No orphaned photos in database

---

### SECTION 6: Tab Switching & Persistence

- [ ] **Test 6.1: Switch Tabs**
  - Upload photos to tyres
  - Switch to another tab (Vehicle ID, Interior, etc.)
  - Switch back to Tyres tab
  - Verify: Photos still visible
  - Verify: No data loss

- [ ] **Test 6.2: Page Reload**
  - Upload photos to tyres
  - Reload page (F5)
  - Verify: Photos load from database
  - Verify: All photos display correctly
  - Verify: Labels preserved

- [ ] **Test 6.3: Navigate Away & Back**
  - Upload photos to tyres
  - Navigate to different assessment
  - Navigate back to original assessment
  - Verify: Photos still there
  - Verify: Correct photos for correct assessment

---

### SECTION 7: Report Generation

- [ ] **Test 7.1: Generate Photos PDF**
  - Upload photos to multiple tyres
  - Click "Generate Photos PDF"
  - Verify: PDF generates successfully
  - Verify: Tyre photos appear in "Tires & Rims" section
  - Verify: Photos include position, label, tyre info
  - Verify: All photos included (not just first 3)

- [ ] **Test 7.2: Generate Photos ZIP**
  - Upload photos to multiple tyres
  - Click "Generate Photos ZIP"
  - Verify: ZIP generates successfully
  - Verify: Tyre photos in "04_Tires_and_Rims" folder
  - Verify: Filenames include position and label
  - Verify: All photos included

- [ ] **Test 7.3: Assessment Report**
  - Generate assessment report
  - Verify: Tyre data table still displays correctly
  - Verify: No errors in report generation

---

### SECTION 8: Data Migration Verification

- [ ] **Test 8.1: Existing Photos Migrated**
  - Check assessment with old photos
  - Verify: Photos appear in new TyrePhotosPanel
  - Verify: Labels preserved (Face, Tread, Measurement)
  - Verify: Display order maintained

- [ ] **Test 8.2: No Data Loss**
  - Count photos in assessment_tyre_photos
  - Verify: Count matches expected (3 per tyre with old data)
  - Verify: All tyre positions have photos

---

### SECTION 9: Edge Cases

- [ ] **Test 9.1: Large File Upload**
  - Upload large photo (5MB+)
  - Verify: Upload completes successfully
  - Verify: Progress indicator shows

- [ ] **Test 9.2: Rapid Uploads**
  - Upload multiple photos quickly
  - Verify: All uploads complete
  - Verify: No race conditions
  - Verify: All photos appear in grid

- [ ] **Test 9.3: Concurrent Edits**
  - Open same assessment in 2 browser tabs
  - Upload photo in tab 1
  - Verify: Photo appears in tab 2 (after refresh)
  - Verify: No conflicts

---

### SECTION 10: Performance & UX

- [ ] **Test 10.1: Optimistic Updates**
  - Upload photo
  - Verify: Photo appears immediately (before server response)
  - Verify: No loading spinner blocks interaction

- [ ] **Test 10.2: Responsive Design**
  - Test on mobile (375px width)
  - Test on tablet (768px width)
  - Test on desktop (1920px width)
  - Verify: Upload zone responsive
  - Verify: Grid layout responsive

- [ ] **Test 10.3: Accessibility**
  - Test keyboard navigation (Tab, Enter, Escape)
  - Test screen reader (if available)
  - Verify: All buttons have labels
  - Verify: Focus indicators visible

---

## 📋 SIGN-OFF

- [ ] All tests passed
- [ ] No data loss
- [ ] No errors in console
- [ ] Reports generate correctly
- [ ] Performance acceptable

**Tested By**: _______________  
**Date**: _______________  
**Notes**: _______________

---

## 🐛 BUG REPORT TEMPLATE

If issues found, use this template:

```
**Test**: [Test number and name]
**Expected**: [What should happen]
**Actual**: [What actually happened]
**Steps to Reproduce**: [Exact steps]
**Screenshots**: [If applicable]
**Browser**: [Chrome/Firefox/Safari]
**Device**: [Desktop/Mobile/Tablet]
```

---

## ✅ COMPLETION CRITERIA

- ✅ All 10 sections tested
- ✅ No critical bugs found
- ✅ Data migration verified
- ✅ Reports generate correctly
- ✅ Performance acceptable
- ✅ Ready for production

**Once all tests pass, proceed to PHASE 10: Cleanup & Finalization** 🚀

