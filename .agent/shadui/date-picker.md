# Date Picker Modernization

This document explains how the ClaimTech date picker now uses the shadcn-svelte `Popover` + `Calendar` primitives instead of the legacy `bits-ui` `DatePicker` root. The change keeps the control compatible with **Svelte 5 / Runes** while keeping the rose-themed styling from the rest of the UI.

## Why
- `bits-ui@2` components rely on the legacy Svelte 4 runtime, which prevents the trigger button from receiving events when rendered under the new Runes runtime. The previous `DatePicker` wrapper rendered fine but the calendar would not open.
- Shadcn-svelte’s `Popover` + `Calendar` stack is already compatible with our Svelte 5 setup and ships in the `.agent/shadcn` registry we mirror. The new structure also makes the markup predictable (`Trigger` → `Content` → `Calendar`) and easier to theme.

## Implementation
1. `src/lib/components/ui/date-picker/date-picker.svelte` now composes:
   - `Popover.Root/Trigger/Content` from `src/lib/components/ui/popover/index.ts`.
   - `Calendar` from `src/lib/components/ui/calendar/index.ts`.
   - `buttonVariants` from the `Button` compound to style the trigger (`outline` variant, truncated text, calendar icon).
   - A hidden `<input>` so forms still serialize `name` + ISO value.
   - A `triggerId` + `labelId` wire-up so any outside `<label for="...">` can link to the button for a11y.
2. `IncidentInfoSection` now renders a `<label for="incident-date-of-loss-trigger">` and passes the matching `labelId`/`triggerId` down to the date picker. This satisfies the `a11y_label_has_associated_control` rule and ensures screen readers announce “Date of Loss”.
3. Calendar selection updates the iso string via `$effect`, and `FormattedValue` keeps the button text synced across props/locales. We also cap the calendar between 1900 and today for reasonable incident dates.

## Reuse guidance
- Use the same pattern whenever a date field appears outside of the Incident form: pass `name`, `labelId`, and `triggerId`; bind to a string ISO value; wrap your copy+icon inside the provided `Popover.Trigger`.
- If a form needs custom min/max ranges, add new props to the component and forward them to the `Calendar`.
- Keep the hidden `<input>` for forms that submit normally (non-SPA). For purely controlled forms, you can bind `value` directly from the parent store.

## Related docs
- `.agent/shadui/sidebar-modernization.md`
- `.agent/shadui/top-bar-research.md`
- `.agent/shadui/login-modernization.md`
