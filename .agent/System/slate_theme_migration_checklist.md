# Slate Theme Migration - Complete Component Checklist

**Date**: November 23, 2025  
**Status**: Planning Phase  
**Objective**: Migrate from Rose/Blue theme to Premium Slate/Neutral palette

---

## 🎨 Theme Transition

**From**: Rose (#e11d48) + Blue (#1e40af) + Inconsistent colors  
**To**: Premium Slate/Neutral palette with dark sidebar aesthetic

---

## 📋 COMPONENTS REQUIRING UPDATES

### TIER 1: CRITICAL (High Visibility)

#### 1. **Global Theme System** - `src/app.css`
- [ ] Update `:root` CSS variables (lines 9-42)
- [ ] Update `.dark` CSS variables (lines 44-76)
- [ ] Replace oklch values with slate-based colors
- [ ] Update sidebar variables to dark slate
- [ ] Update chart colors to slate palette

#### 2. **Sidebar** - `src/lib/components/layout/Sidebar.svelte`
- [ ] Already updated to dark slate (verify)
- [ ] Check badge colors (currently role-based)
- [ ] Verify logo visibility on dark background

#### 3. **Login Page** - `src/routes/auth/login/+page.svelte`
- [ ] Already updated to dark aesthetic (verify)
- [ ] Check hero gradient colors
- [ ] Verify logo sizing and contrast

#### 4. **Navigation Bar** - `src/routes/(app)/+layout.svelte`
- [ ] Update breadcrumb colors
- [ ] Verify logo sizing (h-8 w-auto)
- [ ] Check background gradient

---

### TIER 2: HIGH PRIORITY (User-Facing)

#### 5. **Document Generation Progress**
- [ ] `DocumentGenerationProgress.svelte` - Lines 46-63
  - `text-rose-500` → slate equivalent
  - `bg-rose-100` → slate equivalent
  - `text-rose-700` → slate equivalent

#### 6. **Document Progress Bar** - `DocumentProgressBar.svelte`
- [ ] Lines 43-55: Status colors
  - `text-rose-500` → slate
  - `bg-rose-100` → slate

#### 7. **Tab Loading Components**
- [ ] `TabContentLoader.svelte` - Line 29: `text-rose-500` → slate
- [ ] `TabProgressBar.svelte` - Lines 17-18: `bg-rose-100`, `bg-rose-500` → slate

#### 8. **Photo Upload Components** (6 components)
- [ ] `PhotoUpload.svelte` - Lines 251-297 (4 rose references)
- [ ] `PreIncidentPhotosPanel.svelte` - Rose theme colors
- [ ] `EstimatePhotosPanel.svelte` - Rose theme colors
- [ ] `AdditionalsPhotosPanel.svelte` - Rose theme colors
- [ ] `Exterior360PhotosPanel.svelte` - Rose theme colors
- [ ] `TyrePhotosPanel.svelte` - Rose theme colors

#### 9. **Document Cards** - `DocumentCard.svelte`
- [ ] Lines 82-105: 8 rose color references
  - Progress indicators
  - Status badges
  - Background colors

---

### TIER 3: MEDIUM PRIORITY (Data Display)

#### 10. **Navigation Loading Bar** - `NavigationLoadingBar.svelte`
- [ ] Line 16: `via-blue-600` → slate equivalent
- [ ] Update gradient colors

#### 11. **Estimate Tab** - `EstimateTab.svelte`
- [ ] Lines 1195-1203: Color-coded totals
  - `text-blue-600` → slate
  - Keep red/orange/yellow/green for thresholds

#### 12. **Work Page** - `src/routes/(app)/work/+page.svelte`
- [ ] Lines 79-87: Color classes object
  - `blue` variant → `slate` variant
  - Update all color references

#### 13. **Table Cell** - `TableCell.svelte`
- [ ] Line 26: `text-blue-600` → slate equivalent
- [ ] Keep other variants (green, yellow, red)

#### 14. **Gradient Badge** - `GradientBadge.svelte`
- [ ] Line 15: `blue` variant - update gradient
- [ ] Line 20: `indigo` variant - update gradient
- [ ] Consider adding `slate` variant

---

### TIER 4: LOWER PRIORITY (Utility/Specialized)

#### 15. **PDF Templates** (4 files)
- [ ] `report-template.ts` - Lines 99-105: Rose/Blue colors
  - `.bg-rose`, `.text-rose`, `.border-rose`
  - `.bg-blue`, `.text-blue`, `.border-blue`
  - Line 122: Border color `#e11d48`
  - Line 129: Text color `#e11d48`

- [ ] `estimate-template.ts` - Check for hardcoded colors
- [ ] `frc-report-template.ts` - Check for hardcoded colors
- [ ] `additionals-letter-template.ts` - Lines 140-154: Rose colors
  - Line 143: `color: #e11d48`
  - Line 150-154: Logo styling

- [ ] `photos-template.ts` - Check for hardcoded colors

#### 16. **UI Components** (shadcn-svelte)
- [ ] `Alert.svelte` - Uses CSS variables (auto-update)
- [ ] `Badge.svelte` - Check variants
- [ ] `Button.svelte` - Check variants
- [ ] `Progress.svelte` - Check color usage
- [ ] `Sidebar` components - Already dark (verify)

---

## 🎯 COLOR MAPPING REFERENCE

| Component | Old Color | New Color | Notes |
|-----------|-----------|-----------|-------|
| Primary Accent | Rose (#e11d48) | Slate-600 | Main brand color |
| Secondary | Blue (#1e40af) | Slate-500 | Secondary actions |
| Background | White | Slate-50 | Light mode |
| Dark BG | Dark Blue | Slate-900 | Dark mode |
| Borders | Rose/Blue | Slate-200 | Neutral borders |
| Text Primary | Gray-900 | Slate-900 | Dark text |
| Text Secondary | Gray-600 | Slate-600 | Medium text |
| Sidebar | Dark Blue | Slate-900 | Dark sidebar |
| Sidebar Text | White | Slate-50 | Light text on dark |

---

## ✅ VERIFICATION CHECKLIST

- [ ] Build passes: `npm run build`
- [ ] No type errors: `npm run check`
- [ ] Lint passes: `npm run lint`
- [ ] Visual consistency across all pages
- [ ] Logo visible on all backgrounds
- [ ] Responsive design maintained
- [ ] Dark mode (if applicable) updated
- [ ] PDF documents render correctly
- [ ] All badges and status indicators visible
- [ ] Accessibility maintained (contrast ratios)

---

## 📝 IMPLEMENTATION NOTES

1. **CSS Variables First**: Update `src/app.css` before component changes
2. **Tailwind Classes**: Use Tailwind's slate palette (slate-50 to slate-950)
3. **Hex Colors**: Replace hardcoded hex with CSS variables where possible
4. **PDF Templates**: Update inline styles in template strings
5. **Test Incrementally**: Update one tier at a time, test after each

---

**Related Documentation**:
- `.agent/System/rose_theme_standardization.md` - Previous rose implementation
- `.agent/System/logo_branding_implementation.md` - Logo integration
- `src/app.css` - Global theme variables
- `components.json` - shadcn-svelte base color config

