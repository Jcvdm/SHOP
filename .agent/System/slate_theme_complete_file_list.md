# Slate Theme - Complete File List & Update Guide

**Date**: November 23, 2025  
**Total Files**: 40+  
**Estimated Time**: 4-5 hours

---

## 📋 COMPLETE FILE INVENTORY

### TIER 1: CRITICAL (Update First)

#### 1. Global Theme System
- **File**: `src/app.css`
- **Lines**: 9-76
- **Changes**: CSS variables (`:root` and `.dark`)
- **Type**: CSS variables
- **Impact**: Affects all components

#### 2. Document Generation (2 files)
- **File**: `src/lib/components/assessment/DocumentGenerationProgress.svelte`
  - Lines: 46-63
  - Changes: 3 color references
  
- **File**: `src/lib/components/ui/progress/DocumentProgressBar.svelte`
  - Lines: 43-55
  - Changes: 4 color references

#### 3. Document Card
- **File**: `src/lib/components/assessment/DocumentCard.svelte`
- **Lines**: 82-105
- **Changes**: 8 rose color references

---

### TIER 2: HIGH PRIORITY (Photo Components)

#### 4-9. Photo Upload Components (6 files)
- **File**: `src/lib/components/forms/PhotoUpload.svelte`
  - Lines: 251-297
  - Changes: 8 rose references
  
- **File**: `src/lib/components/assessment/PreIncidentPhotosPanel.svelte`
  - Changes: Rose theme colors
  
- **File**: `src/lib/components/assessment/EstimatePhotosPanel.svelte`
  - Changes: Rose theme colors
  
- **File**: `src/lib/components/assessment/AdditionalsPhotosPanel.svelte`
  - Changes: Rose theme colors
  
- **File**: `src/lib/components/assessment/Exterior360PhotosPanel.svelte`
  - Changes: Rose theme colors
  
- **File**: `src/lib/components/assessment/TyrePhotosPanel.svelte`
  - Changes: Rose theme colors

---

### TIER 3: HIGH PRIORITY (Tab Loading)

#### 10-12. Tab Loading Components (3 files)
- **File**: `src/lib/components/ui/tab-loading/TabContentLoader.svelte`
  - Line: 29
  - Changes: 1 rose reference
  
- **File**: `src/lib/components/ui/tab-loading/TabProgressBar.svelte`
  - Lines: 17-18
  - Changes: 2 rose references
  
- **File**: `src/lib/components/layout/NavigationLoadingBar.svelte`
  - Line: 16
  - Changes: 1 blue reference

---

### TIER 4: MEDIUM PRIORITY (Data Display)

#### 13-15. Data Display Components (3 files)
- **File**: `src/lib/components/assessment/EstimateTab.svelte`
  - Lines: 1195-1203
  - Changes: 1 blue reference (preserve thresholds)
  
- **File**: `src/lib/components/data/TableCell.svelte`
  - Line: 26
  - Changes: 1 blue reference
  
- **File**: `src/lib/components/data/GradientBadge.svelte`
  - Lines: 15, 20
  - Changes: 2 gradient references

#### 16. Work Page
- **File**: `src/routes/(app)/work/+page.svelte`
- **Lines**: 79-87
- **Changes**: Color classes object

---

### TIER 5: MEDIUM PRIORITY (PDF Templates)

#### 17-21. PDF Template Files (5 files)
- **File**: `src/lib/templates/report-template.ts`
  - Lines: 99-105, 122, 129
  - Changes: 6 hex color references
  
- **File**: `src/lib/templates/additionals-letter-template.ts`
  - Lines: 140-154
  - Changes: 3 hex color references
  
- **File**: `src/lib/templates/estimate-template.ts`
  - Changes: Check for hardcoded colors
  
- **File**: `src/lib/templates/frc-report-template.ts`
  - Changes: Check for hardcoded colors
  
- **File**: `src/lib/templates/photos-template.ts`
  - Changes: Check for hardcoded colors

---

### TIER 6: AUTO-UPDATE (UI Primitives)

#### 22-40+. shadcn-svelte Components (15+ files)
**Auto-update via CSS variables** - No manual changes needed:
- `src/lib/components/ui/alert/*`
- `src/lib/components/ui/badge/*`
- `src/lib/components/ui/button/*`
- `src/lib/components/ui/card/*`
- `src/lib/components/ui/dialog/*`
- `src/lib/components/ui/input/*`
- `src/lib/components/ui/progress/*`
- `src/lib/components/ui/select/*`
- `src/lib/components/ui/sidebar/*`
- `src/lib/components/ui/tabs/*`
- `src/lib/components/ui/textarea/*`
- `src/lib/components/ui/tooltip/*`

**Verify after CSS update**:
- Color variants work correctly
- Contrast ratios maintained
- Dark mode (if applicable) works

---

## 🔍 VERIFICATION CHECKLIST

### Build & Lint
- [ ] `npm run build` - No errors
- [ ] `npm run check` - No type errors
- [ ] `npm run lint` - No lint errors

### Visual Testing
- [ ] Dashboard loads correctly
- [ ] Sidebar displays dark theme
- [ ] Logo visible on all backgrounds
- [ ] Photo uploads show progress
- [ ] Document generation displays
- [ ] Navigation loading visible
- [ ] All badges display correctly
- [ ] Estimate tab colors correct
- [ ] Work page colors correct

### PDF Testing
- [ ] Assessment report generates
- [ ] Estimate PDF generates
- [ ] FRC report generates
- [ ] Additionals letter generates
- [ ] Photos PDF generates
- [ ] All PDFs display correctly

### Accessibility
- [ ] Text contrast ≥ 4.5:1 (AA)
- [ ] Focus states visible
- [ ] Color not only indicator
- [ ] Responsive design works

---

## 📊 CHANGE SUMMARY

| Category | Files | Changes | Type |
|----------|-------|---------|------|
| Global | 1 | CSS vars | Critical |
| Documents | 3 | Colors | High |
| Photos | 6 | Colors | High |
| Loading | 3 | Colors | High |
| Data | 4 | Colors | Medium |
| Templates | 5 | Hex | Medium |
| UI Primitives | 15+ | Auto | Low |
| **TOTAL** | **40+** | - | - |

---

## 🚀 IMPLEMENTATION ORDER

1. Update `src/app.css` (global theme)
2. Update document components (3 files)
3. Update photo components (6 files)
4. Update loading components (3 files)
5. Update data display (4 files)
6. Update PDF templates (5 files)
7. Verify UI primitives
8. Run full test suite
9. Visual regression testing

---

**Related Documentation**:
- `.agent/System/slate_theme_migration_checklist.md`
- `.agent/System/slate_theme_detailed_components.md`
- `.agent/System/slate_theme_implementation_summary.md`
- `.agent/System/slate_theme_visual_reference.md`

