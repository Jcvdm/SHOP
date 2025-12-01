# Table Utilities Reference

## Overview

This document describes the utility functions in `src/lib/utils/table-helpers.ts` - a collection of helper functions designed specifically for table components and data display in the ClaimTech application.

**Location:** `src/lib/utils/table-helpers.ts`

**Related Files:**
- `src/lib/utils/formatters.ts` - General formatting utilities (currency, dates, vehicle)
- `src/lib/components/data/GradientBadge.svelte` - Uses BadgeVariant type
- See also: [Creating Components SOP](../SOP/creating-components.md)

---

## When to Use Table Helpers

Use `table-helpers.ts` for:
- **Stage Display** - Converting assessment stages to badges with colors and labels
- **Type Display** - Converting client types to badges (insurance/private)
- **Appointment Display** - Formatting appointment times and checking if overdue
- **Table-Specific Formatting** - Date/time displays specific to table rows

Use `formatters.ts` instead for:
- Currency formatting
- General date/time formatting (not appointment-specific)
- Vehicle formatting with year/make/model
- PDF report formatting

---

## Function Reference

### Stage Utilities

#### `getStageVariant(stage: AssessmentStage): BadgeVariant`

Maps assessment stages to badge color variants for visual differentiation.

**Parameters:**
- `stage` - Assessment stage enum value

**Returns:** Badge variant color string

**Badge Colors:**
- `gray` - request_submitted, request_reviewed, archived
- `yellow` - inspection_scheduled
- `blue` - appointment_scheduled
- `indigo` - assessment_in_progress
- `purple` - estimate_review, estimate_sent
- `green` - estimate_finalized
- `pink` - frc_in_progress
- `red` - cancelled

**Example:**
```typescript
import { getStageVariant } from '$lib/utils/table-helpers';

const variant = getStageVariant('appointment_scheduled'); // 'blue'
const cancelledVariant = getStageVariant('cancelled'); // 'red'
```

**Usage in Components:**
```svelte
<GradientBadge
  variant={getStageVariant(assessment.stage)}
  label={getStageLabel(assessment.stage)}
/>
```

---

#### `getStageLabel(stage: AssessmentStage): string`

Converts assessment stage enum values to human-readable labels.

**Parameters:**
- `stage` - Assessment stage enum value

**Returns:** Human-readable stage label

**Stage Labels:**
- `request_submitted` → "Request Submitted"
- `request_reviewed` → "Request Reviewed"
- `inspection_scheduled` → "Inspection Scheduled"
- `appointment_scheduled` → "Appointment Scheduled"
- `assessment_in_progress` → "Assessment In Progress"
- `estimate_review` → "Estimate Review"
- `estimate_sent` → "Estimate Sent"
- `estimate_finalized` → "Estimate Finalized"
- `frc_in_progress` → "FRC In Progress"
- `archived` → "Archived"
- `cancelled` → "Cancelled"

**Example:**
```typescript
import { getStageLabel } from '$lib/utils/table-helpers';

const label = getStageLabel('appointment_scheduled'); // 'Appointment Scheduled'
```

---

### Type Utilities

#### `getTypeVariant(type: 'insurance' | 'private'): BadgeVariant`

Maps request/client type to badge color variant.

**Parameters:**
- `type` - Client type ('insurance' or 'private')

**Returns:** Badge variant color

**Mapping:**
- `insurance` → `blue`
- `private` → `purple`

**Example:**
```typescript
import { getTypeVariant } from '$lib/utils/table-helpers';

const variant = getTypeVariant('insurance'); // 'blue'
const privateVariant = getTypeVariant('private'); // 'purple'
```

---

#### `getTypeLabel(type: 'insurance' | 'private'): string`

Converts type to human-readable label (capitalizes).

**Parameters:**
- `type` - Client type

**Returns:** Capitalized label

**Example:**
```typescript
import { getTypeLabel } from '$lib/utils/table-helpers';

const label = getTypeLabel('insurance'); // 'Insurance'
```

**Usage in Components:**
```svelte
<GradientBadge
  variant={getTypeVariant(client.type)}
  label={getTypeLabel(client.type)}
/>
```

---

### Vehicle Formatting

#### `formatVehicleDisplay(make?: string | null, model?: string | null): string`

Formats vehicle display for table cells (make + model only, no year).

**Parameters:**
- `make` - Vehicle make (optional)
- `model` - Vehicle model (optional)

**Returns:** Formatted string "Make Model" or "-"

**Example:**
```typescript
import { formatVehicleDisplay } from '$lib/utils/table-helpers';

formatVehicleDisplay('Toyota', 'Corolla'); // 'Toyota Corolla'
formatVehicleDisplay(null, null); // '-'
formatVehicleDisplay('BMW', null); // 'BMW'
```

**Note:** For vehicle display WITH year, use `formatVehicle()` from `formatters.ts`:
```typescript
import { formatVehicle } from '$lib/utils/formatters';

formatVehicle(2020, 'Toyota', 'Corolla'); // '2020 Toyota Corolla'
```

---

### Date & Time Formatting

#### `formatDateDisplay(date: string): string`

Formats ISO date string to locale-specific short format.

**Parameters:**
- `date` - ISO date string

**Returns:** Formatted date (e.g., "15 Jan 2025")

**Example:**
```typescript
import { formatDateDisplay } from '$lib/utils/table-helpers';

formatDateDisplay('2025-01-15T10:30:00Z'); // '15 Jan 2025'
```

**Note:** This is similar to `formatDate()` from `formatters.ts`, but doesn't handle null values. Use `formatters.ts` version when you need null handling.

---

#### `formatTimeDisplay(time?: string | null, duration?: number): string`

Formats appointment time with optional duration to show time range.

**Parameters:**
- `time` - Time string in HH:MM format (optional)
- `duration` - Duration in minutes (optional)

**Returns:** Formatted time or time range

**Examples:**
```typescript
import { formatTimeDisplay } from '$lib/utils/table-helpers';

formatTimeDisplay('14:30'); // '14:30'
formatTimeDisplay('14:30', 60); // '14:30 - 15:30'
formatTimeDisplay(null); // 'No time set'
```

**Usage in Tables:**
```typescript
const tableData = appointments.map(apt => ({
  timeSlot: formatTimeDisplay(apt.appointment_time, apt.duration_minutes)
}));
```

---

#### `formatDateTimeDisplay(date: string, time?: string | null): string`

Combines date and time into single display string.

**Parameters:**
- `date` - ISO date string
- `time` - Time string in HH:MM format (optional)

**Returns:** Formatted datetime string

**Examples:**
```typescript
import { formatDateTimeDisplay } from '$lib/utils/table-helpers';

formatDateTimeDisplay('2025-01-15', '14:30'); // '15 Jan 2025 at 14:30'
formatDateTimeDisplay('2025-01-15'); // '15 Jan 2025'
```

---

### Appointment Utilities

#### `isAppointmentOverdue(date: string, time?: string | null): boolean`

Checks if an appointment date/time has passed.

**Parameters:**
- `date` - ISO date string
- `time` - Time string in HH:MM format (optional)

**Returns:** `true` if appointment is overdue, `false` otherwise

**Logic:**
- With time: Combines date + time and compares to now
- Without time: Considers overdue if date has passed (end of day 23:59:59)

**Examples:**
```typescript
import { isAppointmentOverdue } from '$lib/utils/table-helpers';

// Assuming current time is 2025-01-15 16:00
isAppointmentOverdue('2025-01-15', '14:30'); // true (past)
isAppointmentOverdue('2025-01-15', '18:00'); // false (future)
isAppointmentOverdue('2025-01-14'); // true (yesterday)
isAppointmentOverdue('2025-01-16'); // false (tomorrow)
```

**Usage in Components:**
```svelte
{#if isAppointmentOverdue(appointment.date, appointment.time)}
  <GradientBadge variant="red" label="Overdue" />
{/if}
```

---

## Types

### `BadgeVariant`

Type definition for GradientBadge component color variants.

```typescript
export type BadgeVariant =
  | 'blue'
  | 'green'
  | 'yellow'
  | 'red'
  | 'purple'
  | 'indigo'
  | 'pink'
  | 'gray';
```

**Usage:**
```typescript
import type { BadgeVariant } from '$lib/utils/table-helpers';

let variant: BadgeVariant = 'blue';
```

---

## Common Patterns

### Stage-Based Badges

Always use `getStageVariant()` + `getStageLabel()` together for consistent stage display:

```svelte
<script lang="ts">
  import GradientBadge from '$lib/components/data/GradientBadge.svelte';
  import { getStageVariant, getStageLabel } from '$lib/utils/table-helpers';

  let { assessment } = $props();
</script>

<GradientBadge
  variant={getStageVariant(assessment.stage)}
  label={getStageLabel(assessment.stage)}
/>
```

### Client Type Badges

```svelte
<GradientBadge
  variant={getTypeVariant(client.type)}
  label={getTypeLabel(client.type)}
/>
```

### Appointment Time Display with Overdue Indicator

```svelte
<script lang="ts">
  import { formatDateTimeDisplay, isAppointmentOverdue } from '$lib/utils/table-helpers';
  import GradientBadge from '$lib/components/data/GradientBadge.svelte';
</script>

<div class="flex items-center gap-2">
  <span>{formatDateTimeDisplay(appointment.date, appointment.time)}</span>
  {#if isAppointmentOverdue(appointment.date, appointment.time)}
    <GradientBadge variant="red" label="Overdue" />
  {/if}
</div>
```

---

## Migration Guide

### Before: Inline Stage Formatting

```typescript
// ❌ Old way - inline switch statement
const stageBadgeColor = (() => {
  switch (assessment.stage) {
    case 'appointment_scheduled': return 'blue';
    case 'assessment_in_progress': return 'indigo';
    case 'cancelled': return 'red';
    default: return 'gray';
  }
})();

const stageLabel = assessment.stage
  .split('_')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');
```

### After: Using Table Helpers

```typescript
// ✅ New way - use table helpers
import { getStageVariant, getStageLabel } from '$lib/utils/table-helpers';

const stageBadgeColor = getStageVariant(assessment.stage);
const stageLabel = getStageLabel(assessment.stage);
```

---

### Before: Inline Vehicle Formatting

```typescript
// ❌ Old way - inline template string
const vehicle = `${assessment.request?.vehicle_make || ''} ${assessment.request?.vehicle_model || ''}`.trim() || '-';
```

### After: Using Table Helpers

```typescript
// ✅ New way - use helper
import { formatVehicleDisplay } from '$lib/utils/table-helpers';

const vehicle = formatVehicleDisplay(
  assessment.request?.vehicle_make,
  assessment.request?.vehicle_model
);
```

---

### Before: Inline Date/Time Logic

```typescript
// ❌ Old way - inline date logic
const appointmentTime = appointment.time
  ? new Date(appointment.date).toLocaleDateString('en-ZA', {...}) + ' at ' + appointment.time
  : new Date(appointment.date).toLocaleDateString('en-ZA', {...});

const isOverdue = new Date() > new Date(appointment.date + ' ' + appointment.time);
```

### After: Using Table Helpers

```typescript
// ✅ New way - use helpers
import { formatDateTimeDisplay, isAppointmentOverdue } from '$lib/utils/table-helpers';

const appointmentTime = formatDateTimeDisplay(appointment.date, appointment.time);
const isOverdue = isAppointmentOverdue(appointment.date, appointment.time);
```

---

## Best Practices

### 1. Use Table Helpers for Table-Specific Logic

Table helpers are designed for table row display:
```typescript
// ✅ Good - table-specific logic
import { formatDateTimeDisplay, getStageVariant } from '$lib/utils/table-helpers';
```

### 2. Use General Formatters for Other UI

For non-table UI elements, use `formatters.ts`:
```typescript
// ✅ Good - general formatting
import { formatCurrency, formatDate, formatVehicle } from '$lib/utils/formatters';
```

### 3. Always Pair Variant + Label Functions

When displaying badges, always use both functions together:
```svelte
<!-- ✅ Good - consistent pairing -->
<GradientBadge
  variant={getStageVariant(stage)}
  label={getStageLabel(stage)}
/>

<!-- ❌ Bad - manual label -->
<GradientBadge
  variant={getStageVariant(stage)}
  label={stage}
/>
```

### 4. Handle Null Values Appropriately

Table helpers assume non-null dates for date formatting. Use optional chaining and fallbacks:
```typescript
// ✅ Good - handle null
const dateDisplay = appointment.date
  ? formatDateTimeDisplay(appointment.date, appointment.time)
  : 'No date set';

// ❌ Bad - may crash on null
const dateDisplay = formatDateTimeDisplay(appointment.date, appointment.time);
```

### 5. Use Type Imports When Needed

Import types separately from functions:
```typescript
// ✅ Good - explicit type import
import type { BadgeVariant } from '$lib/utils/table-helpers';
import { getStageVariant, getStageLabel } from '$lib/utils/table-helpers';
```

---

## Related Documentation

- **[Creating Components SOP](../SOP/creating-components.md)** - Component patterns and usage guidelines
- **[Assessment-Centric Architecture](../SOP/working_with_assessment_centric_architecture.md)** - Stage-based queries and transitions
- **[Project Architecture](./project_architecture.md)** - Overall system architecture

---

## Function Summary Table

| Function | Purpose | Returns |
|----------|---------|---------|
| `getStageVariant(stage)` | Get badge color for stage | `BadgeVariant` |
| `getStageLabel(stage)` | Get human label for stage | `string` |
| `getTypeVariant(type)` | Get badge color for client type | `BadgeVariant` |
| `getTypeLabel(type)` | Get human label for client type | `string` |
| `formatVehicleDisplay(make, model)` | Format vehicle (no year) | `string` |
| `formatDateDisplay(date)` | Format date to locale | `string` |
| `formatTimeDisplay(time, duration)` | Format time with optional range | `string` |
| `formatDateTimeDisplay(date, time)` | Combine date and time | `string` |
| `isAppointmentOverdue(date, time)` | Check if appointment passed | `boolean` |

---

## Version History

**Created:** January 29, 2025
**Last Updated:** January 29, 2025
**Related Task:** [Unified Table UI Modernization](../Tasks/active/unified_table_ui_modernization.md) - Phase 6.5

---

## Notes

- All date formatting uses `en-ZA` locale (South African English)
- Stage colors follow a visual progression (gray → yellow → blue → indigo → purple → green)
- Overdue appointments consider end-of-day for dateless comparisons
- Vehicle display functions exist in both files for different use cases:
  - `table-helpers.ts` → `formatVehicleDisplay()` - No year (table rows)
  - `formatters.ts` → `formatVehicle()` - With year (full display)
