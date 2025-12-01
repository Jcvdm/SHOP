# Slate Theme - Visual Reference & Color Codes

**Date**: November 23, 2025  
**Purpose**: Quick reference for color values and visual hierarchy

---

## 🎨 SLATE COLOR PALETTE

### Tailwind Slate Scale
```
slate-50   #f8fafc  (Lightest - backgrounds)
slate-100  #f1f5f9  (Light - hover states)
slate-200  #e2e8f0  (Light borders)
slate-300  #cbd5e1  (Medium borders)
slate-400  #94a3b8  (Medium text)
slate-500  #64748b  (Primary accent)
slate-600  #475569  (Secondary accent)
slate-700  #334155  (Dark text)
slate-800  #1e293b  (Darker text)
slate-900  #0f172a  (Darkest - sidebar)
slate-950  #020617  (Ultra dark)
```

---

## 🔄 DIRECT COLOR REPLACEMENTS

### Hex Color Mapping
```
#e11d48 (Rose-500)    → #64748b (Slate-500)
#f43f5e (Rose-600)    → #475569 (Slate-600)
#be123c (Rose-700)    → #334155 (Slate-700)
#1e40af (Blue-600)    → #475569 (Slate-600)
#1e3a8a (Blue-700)    → #334155 (Slate-700)
#3b82f6 (Blue-500)    → #64748b (Slate-500)
```

### Tailwind Class Mapping
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
blue-700  → slate-800
```

---

## 📐 COMPONENT COLOR USAGE

### Document Generation
```
Processing: slate-600 (primary action)
Success: green-500 (unchanged)
Error: red-500 (unchanged)
Pending: gray-400 (unchanged)
Background: slate-100 (light)
```

### Photo Upload
```
Border (active): slate-500
Background (active): slate-50
Text (active): slate-600
Progress bar: slate-600
Progress background: slate-200
```

### Navigation
```
Loading bar: slate-600 gradient
Sidebar: slate-900 (dark)
Sidebar text: slate-50 (light)
Sidebar accent: slate-700
```

### Data Display
```
Primary text: slate-900
Secondary text: slate-600
Borders: slate-200
Hover: slate-100
```

### Thresholds (PRESERVE)
```
Red: red-600 (write-off risk)
Orange: orange-600 (high)
Yellow: yellow-600 (medium)
Green: green-600 (low)
```

---

## 🎯 VISUAL HIERARCHY

### Light Mode
```
Background:     slate-50 (white-ish)
Cards:          white
Text Primary:   slate-900
Text Secondary: slate-600
Borders:        slate-200
Accents:        slate-600
```

### Dark Mode (Sidebar)
```
Background:     slate-900
Cards:          slate-800
Text Primary:   slate-50
Text Secondary: slate-300
Borders:        slate-700
Accents:        slate-400
```

---

## 🔍 CONTRAST RATIOS (WCAG AA)

### Recommended Combinations
```
✅ slate-900 on slate-50   (19.5:1 - AAA)
✅ slate-600 on white      (7.5:1 - AAA)
✅ slate-700 on slate-50   (12.6:1 - AAA)
✅ slate-50 on slate-900   (19.5:1 - AAA)
✅ slate-600 on slate-100  (6.8:1 - AA)
```

---

## 📊 COMPONENT EXAMPLES

### Button States
```
Default:  bg-slate-600 text-white
Hover:    bg-slate-700
Disabled: bg-slate-200 text-slate-400
```

### Badge States
```
Primary:  bg-slate-100 text-slate-700
Success:  bg-green-100 text-green-700
Warning:  bg-yellow-100 text-yellow-700
Error:    bg-red-100 text-red-700
```

### Input States
```
Default:  border-slate-200 bg-white
Focus:    border-slate-600 ring-slate-500
Error:    border-red-500 ring-red-500
Disabled: border-slate-100 bg-slate-50
```

### Progress Indicators
```
Background: bg-slate-200
Fill:       bg-slate-600
Text:       text-slate-700
```

---

## 🎨 GRADIENT EXAMPLES

### Primary Gradient
```
from-slate-500 to-slate-600
```

### Secondary Gradient
```
from-slate-600 to-slate-700
```

### Subtle Gradient
```
from-slate-50 to-slate-100
```

---

## 📱 RESPONSIVE CONSIDERATIONS

### Mobile
- Maintain contrast ratios
- Ensure touch targets (44px minimum)
- Preserve color meaning

### Tablet
- Same color palette
- Adjust spacing as needed

### Desktop
- Full color palette
- Hover states visible
- Sidebar fully visible

---

## ✨ SPECIAL CASES

### Logo
- Ensure visibility on slate-900 sidebar
- Consider white or light slate-50
- Test on all backgrounds

### Disabled States
- Use slate-200 or slate-300
- Reduce opacity if needed
- Maintain 3:1 contrast minimum

### Focus States
- Use slate-600 ring
- Maintain 3px minimum width
- Visible on all backgrounds

---

## 🔗 RELATED RESOURCES

- Tailwind Slate: https://tailwindcss.com/docs/customizing-colors#using-css-variables
- WCAG Contrast: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
- Color Accessibility: https://www.a11y-101.com/design/color-contrast

---

**Last Updated**: November 23, 2025  
**Version**: 1.0  
**Status**: Ready for Implementation

