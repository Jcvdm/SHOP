# Slate Theme Migration - Quick Start Guide

**Date**: November 23, 2025  
**Status**: Ready for Implementation  
**Time**: 4-5 hours total

---

## 🎯 WHAT'S CHANGING?

ClaimTech is transitioning from a **Rose/Blue theme** to a **Premium Slate/Neutral palette** with a dark sidebar aesthetic.

**Visual Impact**:
- Rose (#e11d48) → Slate-600 (#475569)
- Blue (#1e40af) → Slate-700 (#334155)
- Dark Blue → Slate-900 (#0f172a)
- All UI components updated for cohesive look

---

## 📊 SCOPE AT A GLANCE

| Metric | Count |
|--------|-------|
| Total Components | 40+ |
| Files to Update | 25 |
| Auto-Update Files | 15+ |
| Lines of Code | 500+ |
| Estimated Time | 4-5 hours |
| Risk Level | Low |

---

## 🚀 QUICK START (5 Steps)

### Step 1: Update Global Theme (30 min)
```bash
# Edit: src/app.css
# Update lines 9-76 (CSS variables)
# Replace oklch values with slate colors
```

### Step 2: Update Document Components (45 min)
```bash
# Files:
# - DocumentGenerationProgress.svelte
# - DocumentProgressBar.svelte
# - DocumentCard.svelte
# Replace: rose-* → slate-*
```

### Step 3: Update Photo Components (60 min)
```bash
# Files: 6 photo upload components
# PhotoUpload.svelte
# PreIncidentPhotosPanel.svelte
# EstimatePhotosPanel.svelte
# AdditionalsPhotosPanel.svelte
# Exterior360PhotosPanel.svelte
# TyrePhotosPanel.svelte
# Replace: rose-* → slate-*
```

### Step 4: Update Other Components (105 min)
```bash
# Tab loading, navigation, data display
# PDF templates (5 files)
# Replace: rose-* → slate-*, blue-* → slate-*
# Replace hex: #e11d48 → #64748b
```

### Step 5: Verify & Test (30 min)
```bash
npm run build
npm run check
npm run lint
# Visual testing + accessibility audit
```

---

## 🎨 COLOR QUICK REFERENCE

### Find & Replace Patterns

**Tailwind Classes**:
```
rose-50   → slate-50
rose-100  → slate-100
rose-200  → slate-200
rose-500  → slate-600
rose-600  → slate-700
rose-700  → slate-800
blue-50   → slate-50
blue-500  → slate-600
blue-600  → slate-700
```

**Hex Colors**:
```
#e11d48 → #64748b (rose-500 → slate-500)
#1e40af → #475569 (blue-600 → slate-600)
```

---

## 📋 FILES TO UPDATE (Priority Order)

### MUST UPDATE (16 files)
1. `src/app.css` - Global theme
2. `DocumentGenerationProgress.svelte`
3. `DocumentProgressBar.svelte`
4. `DocumentCard.svelte`
5. `PhotoUpload.svelte`
6. `PreIncidentPhotosPanel.svelte`
7. `EstimatePhotosPanel.svelte`
8. `AdditionalsPhotosPanel.svelte`
9. `Exterior360PhotosPanel.svelte`
10. `TyrePhotosPanel.svelte`
11. `TabContentLoader.svelte`
12. `TabProgressBar.svelte`
13. `NavigationLoadingBar.svelte`
14. `EstimateTab.svelte`
15. `TableCell.svelte`
16. `GradientBadge.svelte`

### SHOULD UPDATE (9 files)
17. `work/+page.svelte`
18. `report-template.ts`
19. `additionals-letter-template.ts`
20. `estimate-template.ts`
21. `frc-report-template.ts`
22. `photos-template.ts`
23-25. Other template files

### AUTO-UPDATE (15+ files)
- All shadcn-svelte UI components
- No manual changes needed
- Verify after CSS update

---

## ✅ VERIFICATION CHECKLIST

- [ ] `npm run build` passes
- [ ] `npm run check` passes
- [ ] `npm run lint` passes
- [ ] Dashboard displays correctly
- [ ] Sidebar dark theme visible
- [ ] Logo visible on all backgrounds
- [ ] Photo uploads show progress
- [ ] Document generation works
- [ ] PDF documents render
- [ ] All badges display
- [ ] Text contrast ≥ 4.5:1 (AA)
- [ ] Responsive design works

---

## 📚 DETAILED DOCUMENTATION

For comprehensive guides, see:

1. **slate_theme_migration_checklist.md**
   - Complete component checklist
   - All 40+ components listed
   - Verification steps

2. **slate_theme_detailed_components.md**
   - Line-by-line breakdown
   - Specific file locations
   - Code examples

3. **slate_theme_implementation_summary.md**
   - 7-phase plan
   - Risk analysis
   - Testing strategy

4. **slate_theme_visual_reference.md**
   - Color codes
   - Contrast ratios
   - Component examples

5. **slate_theme_complete_file_list.md**
   - All 40+ files
   - Line numbers
   - Change counts

---

## 🔧 IMPLEMENTATION TIPS

1. **Use Find & Replace**
   - Search for `rose-500`, replace with `slate-600`
   - Repeat for all color variants
   - Verify each replacement

2. **Test Incrementally**
   - Update one tier at a time
   - Test after each phase
   - Catch issues early

3. **Preserve Thresholds**
   - Keep red/orange/yellow/green
   - Only replace rose/blue
   - Maintain status indicators

4. **Check Contrast**
   - Ensure text readable
   - Test on all backgrounds
   - Verify accessibility

5. **Update Documentation**
   - Update changelog
   - Update README
   - Document any issues

---

## ⚡ QUICK COMMANDS

```bash
# Check for rose colors
grep -r "rose-" src/lib/components/ src/routes/

# Check for blue colors
grep -r "blue-" src/lib/components/ src/routes/

# Check for hex colors
grep -r "#e11d48\|#1e40af" src/

# Run full test suite
npm run build && npm run check && npm run lint

# Build and preview
npm run build && npm run preview
```

---

## 🎯 SUCCESS CRITERIA

✅ All components updated  
✅ Build passes with 0 errors  
✅ No type errors  
✅ No lint errors  
✅ Visual consistency maintained  
✅ Logo visible on all backgrounds  
✅ Text contrast meets WCAG AA  
✅ Responsive design works  
✅ PDF documents render correctly  
✅ All tests pass  

---

**Status**: Ready to start  
**Complexity**: Medium  
**Risk**: Low  
**Estimated Time**: 4-5 hours

**Start with**: `src/app.css` (global theme)  
**Then**: Document components → Photo components → Other components → Verify

