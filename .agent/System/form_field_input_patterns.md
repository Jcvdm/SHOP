# Form Field Input Patterns - ClaimTech

**Date**: November 28, 2025
**Status**: ✅ ESTABLISHED - Based on B008/B009/B010 bug fixes
**Build**: ✅ Pattern verified across DamageTab, Exterior360Tab, and other working tabs

---

## Overview

This document establishes the standardized patterns for text fields, select dropdowns, and other form inputs across ClaimTech. These patterns emerged from fixing responsive input issues and ensuring data persists correctly through navigation.

**Key Principle**: Different input types have different save strategies. Discrete inputs (selects) save immediately on change. Continuous inputs (text) debounce to avoid excessive database writes.

---

## Text Fields (Continuous Input)

### Pattern: Extract → Update State → Debounce Save

Use one-way binding with manual value extraction and debounced saves.

#### ✅ Correct Pattern

```svelte
<script>
  import { debounce } from 'lodash-es';

  let data = {
    exterior360: {
      vehicle_color: 'White'
    }
  };

  const handleSave = async () => {
    // Persist to database
    await exterior360Service.update(assessment_id, data.exterior360);
  };

  const debouncedSave = debounce(handleSave, 500);

  const handleColorChange = (event: Event) => {
    const value = (event.currentTarget as HTMLInputElement).value;
    // 1. Update state immediately for responsive UI
    data.exterior360.vehicle_color = value;
    // 2. Debounce database save (prevents thrashing)
    debouncedSave();
  };
</script>

<!-- ONE-WAY BINDING with manual extraction -->
<input
  type="text"
  value={data.exterior360.vehicle_color}
  oninput={handleColorChange}
  placeholder="e.g., White, Silver, Blue"
/>
```

#### ❌ Anti-Pattern: bind:value + oninput

```svelte
<!-- CAUSES LAG - Don't use this pattern! -->
<input
  type="text"
  bind:value={data.exterior360.vehicle_color}
  oninput={(e) => {
    data.exterior360.vehicle_color = e.currentTarget.value;
    debouncedSave();
  }}
/>
```

**Why it's bad**:
- `bind:value` creates two-way binding (reactive)
- `oninput` manually updates same state (also reactive)
- Both fire simultaneously, causing multiple re-renders per keystroke
- Svelte 5's tighter reactivity makes this very apparent as lag

### Text Field Rules

1. **Always use `value={}` not `bind:value={}`** for controlled inputs
2. **Extract value from event**: `(event.currentTarget as HTMLInputElement).value`
3. **Update state immediately**: `data.field = value` (gives instant visual feedback)
4. **Debounce the save**: `debouncedSave()` with 500ms debounce (prevents DB thrashing)
5. **Keep the pattern consistent** across all text inputs in a component

### Debounce Configuration

```typescript
// Standard debounce for form fields (500ms is proven safe)
const debouncedSave = debounce(handleSave, 500);

// Use lodash-es for tree-shaking support
import { debounce } from 'lodash-es';
```

**Why 500ms?**
- Fast enough to feel responsive (user sees change immediately)
- Slow enough to prevent excessive database writes while typing
- Proven pattern across DamageTab and working tabs

### Components Using This Pattern

- **DamageTab.svelte** - All text fields (damage_description, notes, etc.)
- **Exterior360Tab.svelte** - Vehicle color, other text fields
- **VehicleIdentificationTab.svelte** - All text input fields
- **InteriorMechanicalTab.svelte** - Notes and text fields

---

## Select/Dropdown Fields (Discrete Input)

### Pattern: Immediate Save on Change

Use `onchange` to capture selection completion and save immediately.

#### ✅ Correct Pattern

```svelte
<script>
  let data = {
    exterior360: {
      overall_condition: 'good'
    }
  };

  const handleSave = async () => {
    await exterior360Service.update(assessment_id, data.exterior360);
  };

  const handleConditionChange = (event: Event) => {
    const value = (event.currentTarget as HTMLSelectElement).value;
    // 1. Update state immediately
    data.exterior360.overall_condition = value;
    // 2. Save immediately (no debounce needed)
    handleSave();
  };
</script>

<!-- onchange with immediate save -->
<select
  value={data.exterior360.overall_condition}
  onchange={handleConditionChange}
>
  <option value="">-- Select condition --</option>
  <option value="poor">Poor</option>
  <option value="fair">Fair</option>
  <option value="good">Good</option>
  <option value="excellent">Excellent</option>
</select>
```

#### ❌ Anti-Pattern: oninput on Select

```svelte
<!-- WRONG - oninput fires multiple times on select, loses change on nav -->
<select
  value={data.exterior360.overall_condition}
  oninput={(e) => {
    data.exterior360.overall_condition = e.currentTarget.value;
    debouncedSave(); // Debounce causes loss on navigation!
  }}
>
```

**Why it's bad**:
- Select fields have discrete values, no "intermediate" states
- User makes ONE choice per interaction
- Debounce on dropdowns means user can navigate before save fires
- The change gets lost when component unmounts before debounce completes

### Select Field Rules

1. **Always use `onchange` not `oninput`** on select/dropdown elements
2. **Save immediately, no debounce** (selections are discrete, not continuous)
3. **Update state before save**: `data.field = value; handleSave()`
4. **Include fallback option**: `<option value="">-- Select --</option>`
5. **Handle null/empty values** properly in database (allow NULL or have default)

### Components Using This Pattern

- **Exterior360Tab.svelte** - Overall condition select (lines 228-233)
- **DamageTab.svelte** - Status/severity selects
- **RatesAndRepairerConfiguration.svelte** - Repairer dropdown
- **FormField.svelte** - Generic select component (lines 82-87)

---

## Checkbox Fields (Boolean Input)

### Pattern: Immediate Save on Change

```svelte
<script>
  let data = {
    exterior360: {
      has_dents: false
    }
  };

  const handleDentsChange = (event: Event) => {
    const checked = (event.currentTarget as HTMLInputElement).checked;
    data.exterior360.has_dents = checked;
    handleSave();
  };
</script>

<input
  type="checkbox"
  checked={data.exterior360.has_dents}
  onchange={handleDentsChange}
/>
```

**Rules**: Same as select fields - `onchange` with immediate save, no debounce.

---

## FormField Component

The reusable `FormField.svelte` component should implement these patterns:

### For Text Inputs

```svelte
<!-- lines ~50-70 -->
<input
  {type}
  value={value}
  oninput={(e) => {
    onValueChange?.(e.currentTarget.value);
  }}
/>
```

- Parent handles debounce
- Component just extracts and reports value

### For Select Inputs

```svelte
<!-- lines 82-87 -->
<select
  value={value ?? ''}
  onchange={(e) => {
    onValueChange?.(e.currentTarget.value);
    // Let parent handle save immediately
  }}
>
```

- Use `onchange` for discrete selection
- Parent should call save immediately without debounce

---

## Common Mistakes & Solutions

### Mistake 1: Using bind:value with oninput

```svelte
<!-- ❌ WRONG -->
<input
  type="text"
  bind:value={data.field}
  oninput={debouncedSave}
/>
```

**Problem**: Double-binding causes re-renders on each keystroke

**Fix**: Use value + extract from event

```svelte
<!-- ✅ RIGHT -->
<input
  type="text"
  value={data.field}
  oninput={(e) => {
    data.field = e.currentTarget.value;
    debouncedSave();
  }}
/>
```

### Mistake 2: Debouncing select field saves

```svelte
<!-- ❌ WRONG -->
<select
  value={data.field}
  onchange={(e) => {
    data.field = e.currentTarget.value;
    debouncedSave(); // Lost if user navigates!
  }}
>
```

**Problem**: Debounce delays save, component unmounts before save completes

**Fix**: Save immediately on select change

```svelte
<!-- ✅ RIGHT -->
<select
  value={data.field}
  onchange={(e) => {
    data.field = e.currentTarget.value;
    handleSave(); // No debounce
  }}
>
```

### Mistake 3: Forgetting to update state before saving

```svelte
<!-- ❌ WRONG -->
<input
  type="text"
  value={data.field}
  oninput={() => {
    handleSave(); // Saves old value!
  }}
/>
```

**Problem**: State not updated, so save writes old value to database

**Fix**: Update state THEN save

```svelte
<!-- ✅ RIGHT -->
<input
  type="text"
  value={data.field}
  oninput={(e) => {
    data.field = e.currentTarget.value; // Update FIRST
    debouncedSave(); // Then save
  }}
/>
```

### Mistake 4: Not extracting from event properly

```svelte
<!-- ❌ WRONG - TypeScript error -->
<input
  type="text"
  oninput={(e) => {
    data.field = e.target.value; // e.target might be wrong node
  }}
/>
```

**Problem**: `e.target` can be wrong element, `e.currentTarget` is safer

**Fix**: Cast and use currentTarget

```svelte
<!-- ✅ RIGHT -->
<input
  type="text"
  oninput={(e) => {
    data.field = (e.currentTarget as HTMLInputElement).value;
  }}
/>
```

---

## Testing Patterns

### For Text Fields

```typescript
// Test that typing updates state immediately
const input = container.querySelector('input[type="text"]');
input.value = 'test';
input.dispatchEvent(new Event('input', { bubbles: true }));
expect(component.data.field).toBe('test'); // Immediate!

// Test that debounce delays database call
expect(mockSave).not.toHaveBeenCalled(); // Not yet
await new Promise(resolve => setTimeout(resolve, 600)); // Wait for debounce
expect(mockSave).toHaveBeenCalled(); // Now called
```

### For Select Fields

```typescript
// Test that changing select saves immediately
const select = container.querySelector('select');
select.value = 'new-value';
select.dispatchEvent(new Event('change', { bubbles: true }));
expect(mockSave).toHaveBeenCalled(); // Immediate!
```

---

## Impact on Bug Fixes

### B008: Database Schema Mismatch
- **Fix**: Removed obsolete column reference
- **Pattern**: Validates schema stays in sync with service code

### B009: Select Field Not Saving
- **Root Cause**: Using `oninput` with debounce on select field
- **Fix**: Changed to `onchange` with immediate save
- **Pattern**: Different input types need different save strategies

### B010: Text Field Lag
- **Root Cause**: Using `bind:value` + `oninput` together
- **Fix**: Changed to `value` + manual extraction + debounce
- **Pattern**: Clean separation between state updates and database saves

---

## Best Practices Summary

| Input Type | Event | Debounce | Reason |
|-----------|-------|----------|--------|
| Text field | `oninput` | Yes (500ms) | Continuous input, user types multiple characters |
| Select/dropdown | `onchange` | No | Discrete selection, one value per interaction |
| Checkbox | `onchange` | No | Boolean toggle, immediate feedback |
| Textarea | `oninput` | Yes (500ms) | Continuous input, like text field |
| Number input | `oninput` | Yes (500ms) | Continuous input |
| Date picker | `onchange` | No | Discrete selection via calendar |
| File upload | Custom | No | File selection is discrete event |

---

## Related Documentation

- **[DamageTab Implementation](../System/tabs_standardization_guide.md)** - Working reference implementation
- **[Exterior360Tab Bug Fixes](../README/changelog.md)** - B008/B009/B010 fixes
- **[FormField Component](../SOP/creating-components.md)** - Generic form field patterns

---

## Maintenance Notes

- **Last Updated**: November 28, 2025
- **Established By**: B008/B009/B010 bug fixes
- **Verified In**: Exterior360Tab, DamageTab, RatesAndRepairerConfiguration
- **Next**: Standardize all remaining forms to use these patterns

---
