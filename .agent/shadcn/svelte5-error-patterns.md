# Svelte 5 Error Patterns & Solutions

**Quick Reference for Fixing ClaimTech Errors**

---

## 1. Snippet Type Errors

**Error**: `Binding element 'months' implicitly has an 'any' type`

**Cause**: Svelte 5 snippets require explicit type annotations for parameters

**Solution**:
```svelte
<!-- ❌ WRONG: No types -->
{#snippet children({ months, weekdays })}
  ...
{/snippet}

<!-- ✅ CORRECT: Explicit types -->
{#snippet children({ months, weekdays }: { 
  months: Array<any>, 
  weekdays: Array<string> 
})}
  ...
{/snippet}
```

**Pattern**: Always type snippet parameters, especially in reusable UI components

**Files Affected**: `calendar.svelte`, `calendar-month-select.svelte`, `calendar-year-select.svelte`

---

## 2. Bits UI v3 Migration

**Error**: `Property 'disableAutoClose' does not exist in type`

**Cause**: Bits UI v3 removed/renamed props from v2

**Common Changes**:
- `disableAutoClose` → `closeOnSelect` (inverted logic)
- `CheckboxGroup` component removed from dropdown-menu
- Calendar snippet parameters changed structure

**Solution**:
```svelte
<!-- ❌ WRONG: v2 API -->
<Popover.Root disableAutoClose={true}>

<!-- ✅ CORRECT: v3 API -->
<Popover.Root closeOnSelect={false}>
```

**Pattern**: Check Bits UI v3 docs for prop renames; use individual CheckboxItem instead of CheckboxGroup

**Files Affected**: `date-picker.svelte`, `dropdown-menu-checkbox-group.svelte`

**Reference**: https://bits-ui.com/docs/components/popover

---

## 3. `<svelte:component>` Deprecation

**Warning**: `<svelte:component>` is deprecated in runes mode

**Cause**: Svelte 5 makes components dynamic by default

**Solution**:
```svelte
<!-- ❌ WRONG: Svelte 4 pattern -->
<svelte:component this={MyComponent} {...props} />

<!-- ✅ CORRECT: Svelte 5 pattern -->
<MyComponent {...props} />

<!-- For truly dynamic components: -->
<script>
  let Component = $state(MyComponent);
</script>
<Component {...props} />
```

**Pattern**: Remove `<svelte:component>` wrapper; components are already dynamic

**Files Affected**: `calendar.svelte`, `calendar-month-select.svelte`, `ActionIconButton.svelte`

---

## 4. State Referenced Locally Warning

**Warning**: `This reference only captures the initial value of 'data'. Did you mean to reference it inside a derived instead?`

**Cause**: Using props directly in `$state()` initializer captures initial value only

**Solution**:
```svelte
<!-- ❌ WRONG: Captures initial value -->
let count = $state(data?.count || 0);

<!-- ✅ CORRECT: Use $derived for reactive sync -->
let count = $derived(data?.count || 0);

<!-- OR: Use $effect to sync -->
let count = $state(0);
$effect(() => {
  count = data?.count || 0;
});
```

**Pattern**: Use `$derived` for computed values from props; use `$effect` for side effects

**Files Affected**: `VehicleIdentificationTab.svelte`, `VehicleValuesTab.svelte`, `Exterior360Tab.svelte`

---

## 5. Type Mismatches (string vs number, null vs undefined)

**Error**: `Type 'string' is not assignable to type 'number'`

**Cause**: Database types use `| null`, domain types use `| undefined`

**Solution**:
```typescript
// ❌ WRONG: Direct assignment
const value: number = dbRecord.value; // Error if value is null

// ✅ CORRECT: Convert null to undefined
const value: number | undefined = dbRecord.value ?? undefined;

// OR: Use non-null assertion after guard
if (dbRecord.value !== null) {
  const value: number = dbRecord.value;
}
```

**Pattern**: Convert `null` to `undefined` at service boundaries; use type guards

**Files Affected**: `ReversalReasonModal.svelte`, service input types

---

## 6. Form Label Accessibility

**Warning**: `A form label must be associated with a control`

**Cause**: Label without `for` attribute or not wrapping an input

**Solution**:
```svelte
<!-- ❌ WRONG: Label not associated -->
<label class="text-sm">Name</label>
<input type="text" />

<!-- ✅ CORRECT: Use for + id -->
<label for="name" class="text-sm">Name</label>
<input id="name" type="text" />

<!-- OR: Wrap input -->
<label class="text-sm">
  Name
  <input type="text" />
</label>

<!-- OR: Use div if not a real label -->
<div class="text-sm font-medium">Display Text</div>
```

**Pattern**: Always associate labels with controls; use `<div>` for display-only text

**Files Affected**: `PdfUpload.svelte`, `VehicleValuesTab.svelte`, `PhotoUploadV2.svelte`

---

## 7. DataTable Generic Constraints

**Error**: `Type 'string' is not assignable to type 'keyof Client'`

**Cause**: Column keys must match exact type keys; render functions must handle nullable values

**Solution**:
```typescript
// ❌ WRONG: Loose typing
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', render: (value: string) => ... }
];

// ✅ CORRECT: Strict typing
const columns: Column<Client>[] = [
  { key: 'name', label: 'Name' },
  {
    key: 'status',
    label: 'Status',
    render: (value: string | null | undefined) => value || 'N/A'
  }
];
```

**Pattern**: Use `Column<T>[]` type; handle nullable values in render functions

**Files Affected**: `clients/+page.svelte`, `engineers/+page.svelte`, `work/additionals/+page.svelte`

---

## 8. Event Handler Types

**Error**: `Parameter 'e' implicitly has an 'any' type`

**Cause**: Event handlers need explicit types in TypeScript strict mode

**Solution**:
```typescript
// ❌ WRONG: No type
onchange={(e) => {
  const value = e.currentTarget.value;
}}

// ✅ CORRECT: Explicit type
onchange={(e: Event) => {
  const target = e.currentTarget as HTMLSelectElement;
  const value = target.value;
}}

// OR: Use specific event type
onchange={(e: Event & { currentTarget: HTMLSelectElement }) => {
  const value = e.currentTarget.value;
}}
```

**Pattern**: Always type event parameters; cast `currentTarget` to specific element type

**Files Affected**: `calendar-caption.svelte`, form components

---

## 9. Service Input Nullability

**Error**: `Type 'null' is not assignable to type 'string | undefined'`

**Cause**: Service expects `undefined` but database returns `null`

**Solution**:
```typescript
// ❌ WRONG: Pass null directly
await service.update(id, {
  notes: dbRecord.notes // null
});

// ✅ CORRECT: Convert null to undefined
await service.update(id, {
  notes: dbRecord.notes ?? undefined
});

// OR: Use nullish coalescing in service
export async function update(id: string, data: UpdateInput) {
  const payload = {
    ...data,
    notes: data.notes ?? undefined
  };
  // ...
}
```

**Pattern**: Convert `null` to `undefined` before passing to services

**Files Affected**: `work/assessments/[appointment_id]/+page.svelte`, service calls

---

## 10. Template Data Type Mismatches

**Error**: `Type 'string' is not assignable to type 'AssessmentStatus'`

**Cause**: Database returns string, template expects enum type

**Solution**:
```typescript
// ❌ WRONG: Pass data directly
const html = generateTemplate(data);

// ✅ CORRECT: Cast to expected type
const html = generateTemplate({
  ...data,
  assessment: {
    ...data.assessment,
    status: data.assessment.status as AssessmentStatus
  }
});

// OR: Update template to accept string
export function generateTemplate(data: {
  assessment: { status: string }
}) {
  // ...
}
```

**Pattern**: Cast database strings to enum types at template boundaries

**Files Affected**: `print/estimate/[id]/+page.svelte`, `print/frc/[id]/+page.svelte`

---

## Svelte 5 Runes Quick Reference

### Core Runes

```typescript
// $state - Reactive state
let count = $state(0);
let user = $state({ name: 'John' });

// $derived - Computed values (auto-updates)
let doubled = $derived(count * 2);
let fullName = $derived(`${user.name} Doe`);

// $derived.by() - Complex computations
let status = $derived.by(() => {
  if (count > 10) return 'high';
  return 'low';
});

// $effect - Side effects (runs when dependencies change)
$effect(() => {
  console.log('Count changed:', count);
  document.title = `Count: ${count}`;
});

// $effect with cleanup
$effect(() => {
  const interval = setInterval(() => count++, 1000);
  return () => clearInterval(interval);
});

// $props - Component props
let { title, count = 0 }: Props = $props();

// $bindable - Two-way binding
let { value = $bindable(0) }: Props = $props();
```

### Common Patterns

```typescript
// Props to local state (reactive sync)
let props: Props = $props();
const data = $derived(props.data);

// Optimistic updates
const items = useOptimisticArray(() => props.items);
items.add(newItem); // Updates UI immediately

// Conditional reactivity
let visible = $state(false);
$effect(() => {
  if (visible) {
    console.log('Now visible');
  }
});

// Async in $effect
$effect(() => {
  async function load() {
    const data = await fetchData();
    items = data;
  }
  load();
});
```

---

## Key Takeaways

1. **Always type snippet parameters** - Svelte 5 requires explicit types
2. **Check Bits UI v3 docs** - Many props renamed or removed
3. **Remove `<svelte:component>`** - Components are dynamic by default
4. **Use `$derived` for props** - Don't capture initial values in `$state`
5. **Convert `null` to `undefined`** - At service boundaries
6. **Associate labels with controls** - Use `for` attribute or wrap
7. **Type DataTable columns strictly** - Use `Column<T>[]` type
8. **Type event handlers** - Always specify event parameter types
9. **Handle nullability** - Convert at boundaries, use type guards
10. **Cast enum types** - At template boundaries

---

## Testing After Fixes

```bash
# Check error count
npm run check 2>&1 | Select-String "found.*errors"

# View specific file errors
npm run check 2>&1 | Select-String "calendar.svelte"

# Save full output
npm run check 2>&1 > ".agent/logs/check-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
```

---

**Last Updated**: November 22, 2025
**Related**: `.agent/shadcn/pdr.md`, `.agent/shadcn/svelte5-upgrade-checklist.md`

