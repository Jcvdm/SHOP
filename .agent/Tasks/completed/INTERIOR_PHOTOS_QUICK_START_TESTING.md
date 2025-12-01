# Interior Photos - Quick Start Testing Guide
**Date**: November 9, 2025  
**Purpose**: Fast reference for testing the new interior photos feature

---

## 🚀 Quick Start

### 1. Start Development Server
```bash
npm run dev
```

### 2. Navigate to Assessment
1. Go to `/work/assessments/[appointment_id]`
2. Click "Interior" tab
3. Scroll down past the 3 required photos

### 3. You Should See
- **Section 1**: "Interior Photos (Required)" - 3 fixed photo uploads
- **Section 2**: "Upload Additional Interior Photos" - New drag-drop zone

---

## 🧪 Test Scenarios

### Scenario 1: Upload Single Photo
1. Drag a photo onto the upload zone
2. ✅ Photo appears in grid immediately (optimistic update)
3. ✅ Photo persists after page reload

### Scenario 2: Upload Multiple Photos
1. Drag 3-5 photos at once
2. ✅ All photos appear in grid
3. ✅ Progress bar shows upload progress
4. ✅ Photos ordered by display_order

### Scenario 3: View Photo Fullscreen
1. Click any photo thumbnail
2. ✅ PhotoViewer opens fullscreen
3. ✅ Shows current photo with label (if set)
4. ✅ Arrow keys navigate between photos
5. ✅ Escape key closes viewer

### Scenario 4: Edit Photo Label
1. Open PhotoViewer (click photo)
2. Press 'E' key
3. Type new label (e.g., "Damage on door")
4. Press Enter to save
5. ✅ Label updates immediately
6. ✅ Label persists after reload

### Scenario 5: Delete Photo
1. Open PhotoViewer
2. Click trash icon or press Delete key
3. Confirm deletion
4. ✅ Photo removed from grid
5. ✅ Photo removed from storage
6. ✅ Photo removed from database

### Scenario 6: Export to PDF
1. Go to "Finalize" tab
2. Click "Generate Photos PDF"
3. Wait for generation
4. ✅ PDF includes "Additional Interior Photos" section
5. ✅ Photos appear with labels

### Scenario 7: Export to ZIP
1. Go to "Finalize" tab
2. Click "Generate Photos ZIP"
3. Wait for generation
4. Download ZIP file
5. ✅ Extract ZIP
6. ✅ Folder `03_Interior_Additional` contains photos
7. ✅ Filenames include labels

---

## 🔍 What to Check

### UI/UX
- [ ] Drag-drop zone has clear visual feedback
- [ ] Upload progress bar shows percentage
- [ ] Photos grid is responsive (2-4 columns)
- [ ] PhotoViewer displays correctly
- [ ] Label editing is intuitive
- [ ] Delete confirmation prevents accidents

### Functionality
- [ ] Photos upload to correct storage path
- [ ] Photos saved to database with correct assessment_id
- [ ] Labels are optional (can be empty)
- [ ] Display order is maintained
- [ ] Optimistic updates work (instant UI feedback)
- [ ] Page reload preserves all photos

### Performance
- [ ] Upload is fast (< 5 seconds for typical photo)
- [ ] Grid renders smoothly with 10+ photos
- [ ] PhotoViewer navigation is responsive
- [ ] No console errors

### Integration
- [ ] PDF export includes interior photos
- [ ] ZIP export includes interior photos
- [ ] Photos appear in correct folder in ZIP
- [ ] Labels appear in PDF captions

---

## 📁 Storage Path

Photos are stored at:
```
assessments/{assessmentId}/interior/additional/{timestamp}.jpg
```

Example:
```
assessments/550e8400-e29b-41d4-a716-446655440000/interior/additional/1699532400000.jpg
```

---

## 🗄️ Database

### Table: `assessment_interior_photos`
```sql
SELECT * FROM assessment_interior_photos 
WHERE assessment_id = '{assessmentId}'
ORDER BY display_order;
```

### Expected Columns
- `id` - UUID primary key
- `assessment_id` - FK to assessments
- `photo_url` - Proxy URL for display
- `photo_path` - Storage path
- `label` - Optional label (e.g., "Damage on door")
- `display_order` - Sort order
- `created_at` - Timestamp
- `updated_at` - Timestamp

---

## 🐛 Troubleshooting

### Photos not appearing after upload
- Check browser console for errors
- Verify Supabase storage bucket exists
- Check RLS policies allow authenticated users

### Label not saving
- Check network tab for failed requests
- Verify assessment_id is correct
- Check database for label update

### PDF/ZIP export missing photos
- Verify photos exist in database
- Check storage paths are correct
- Look for errors in server logs

### Performance issues with many photos
- Consider pagination if > 50 photos
- Check image sizes (should be < 5MB each)
- Monitor database query performance

---

## 📞 Support

If issues occur:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify database records exist
4. Check storage bucket permissions
5. Review RLS policies

---

## ✅ Sign-Off Checklist

- [ ] All 7 test scenarios pass
- [ ] No console errors
- [ ] PDF export works
- [ ] ZIP export works
- [ ] Photos persist after reload
- [ ] Performance is acceptable
- [ ] Ready for production

**Status**: Ready for testing ✅

