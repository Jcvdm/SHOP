# TYRES PHOTO REFACTORING - IMPLEMENTATION PLAN
**Status**: IN_PROGRESS  
**Created**: November 10, 2025  
**Objective**: Refactor tyres photo system from 3 fixed columns to unlimited photos per tyre using unified PhotosPanel pattern

---

## 📋 REQUIREMENTS SUMMARY

- **Pattern**: PhotosPanel Component (Pattern B) - unlimited photos with drag-and-drop
- **Organization**: Per-Tyre Photos (Option 1) - each tyre has its own photo panel
- **Photo Count**: Unlimited photos per tyre with custom labels
- **UI Layout**: Keep current layout - replace 3 PhotoUpload components with one TyrePhotosPanel per tyre
- **Report Changes**: Update photo PDF generation to fetch from new table

---

## 🎯 IMPLEMENTATION PHASES

### PHASE 1: Database Migration
- [ ] Create `assessment_tyre_photos` table with unified schema
- [ ] Migrate existing photo data (Face, Tread, Measurement)
- [ ] Drop old photo columns from `assessment_tyres`
- [ ] Add RLS policies and triggers
- [ ] Verify migration with test data

### PHASE 2: Service Layer
- [ ] Create `tyre-photos.service.ts` (clone from interior-photos.service.ts)
- [ ] Implement CRUD operations with ServiceClient injection
- [ ] Add audit logging for all operations
- [ ] Test service methods

### PHASE 3: TypeScript Types
- [ ] Add `TyrePhoto`, `CreateTyrePhotoInput`, `UpdateTyrePhotoInput` interfaces
- [ ] Remove photo URL fields from `Tyre` interface
- [ ] Update type exports

### PHASE 4: Component Creation
- [ ] Create `TyrePhotosPanel.svelte` (clone from InteriorPhotosPanel.svelte)
- [ ] Implement drag-and-drop upload
- [ ] Integrate PhotoViewer for fullscreen viewing
- [ ] Add label editing and deletion
- [ ] Test component with multiple photos

### PHASE 5: Update TyresTab Component
- [ ] Remove old photo state management
- [ ] Import TyrePhotosPanel
- [ ] Replace 3 PhotoUpload components with TyrePhotosPanel
- [ ] Add photo update handler with direct state update pattern
- [ ] Test with all tyre positions

### PHASE 6: Update Page Server Load
- [ ] Add tyre photos fetch to +page.server.ts
- [ ] Return tyrePhotos in data object
- [ ] Verify data loading

### PHASE 7: Update Report Generation
- [ ] Update generate-photos-pdf to fetch from new table
- [ ] Update generate-photos-zip to fetch from new table
- [ ] Test PDF generation with tyre photos
- [ ] Test ZIP generation with tyre photos

### PHASE 8: Documentation Updates
- [ ] Update database_schema.md with new table
- [ ] Update unified_photo_panel_pattern.md
- [ ] Add TyrePhotosPanel to pattern list

### PHASE 9: Testing & Verification
- [ ] Manual upload/delete/label tests
- [ ] Multi-tyre testing
- [ ] Tab switching persistence
- [ ] Page reload verification
- [ ] Report generation tests
- [ ] Data migration verification

### PHASE 10: Cleanup & Finalization
- [ ] Remove old PhotoUpload usage
- [ ] Archive old migration
- [ ] Final code review
- [ ] Commit changes

---

## 📊 FILES TO CREATE (3)

1. `supabase/migrations/XXX_create_assessment_tyre_photos.sql` (~100 lines)
2. `src/lib/services/tyre-photos.service.ts` (~180 lines)
3. `src/lib/components/assessment/TyrePhotosPanel.svelte` (~250 lines)

---

## 📊 FILES TO MODIFY (7)

1. `src/lib/types/assessment.ts` - Add TyrePhoto types, remove photo URLs
2. `src/lib/components/assessment/TyresTab.svelte` - Replace PhotoUpload with TyrePhotosPanel
3. `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts` - Fetch tyre photos
4. `src/routes/api/generate-photos-pdf/+server.ts` - Update tyre photo fetching
5. `src/routes/api/generate-photos-zip/+server.ts` - Update tyre photo fetching
6. `.agent/System/database_schema.md` - Document new table
7. `.agent/System/unified_photo_panel_pattern.md` - Add TyrePhotosPanel

---

## ⚠️ CRITICAL IMPLEMENTATION NOTES

1. **Direct State Update Pattern**: Use `data.tyrePhotos = updatedPhotos` (not `invalidateAll()`)
2. **Getter Function Pattern**: Pass `() => props.photos` to `useOptimisticArray`
3. **ServiceClient Injection**: All service methods accept optional `client` parameter
4. **Audit Logging**: All CRUD operations must call `auditService.logChange()`
5. **Storage Paths**: Use tyre position as subcategory (e.g., `front_left`, `rear_right`)
6. **Migration Safety**: Migrate existing data before dropping columns
7. **RLS Policies**: Enable RLS on new table with authenticated user policy

---

## 📈 PROGRESS TRACKING

- **Total Phases**: 10
- **Total Files**: 10 (3 create, 7 modify)
- **Estimated LOC**: ~730 lines
- **Estimated Time**: 2-3 hours

---

## 🔗 RELATED DOCUMENTATION

- `.agent/System/unified_photo_panel_pattern.md` - Photo panel patterns
- `.agent/System/database_schema.md` - Database structure
- `.claude/skills/photo-component-development/SKILL.md` - Photo component patterns
- `.claude/skills/supabase-development/SKILL.md` - Database patterns

