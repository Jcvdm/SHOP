# Svelte 5 Upgrade & Legacy Component Checklist

_Last updated: 2025-11-21_

## 1. Framework Snapshot
- **Svelte** `^5.0.0`
- **SvelteKit** `^2.22.0`
- **bits-ui** `@next` (v3 APIs for Svelte 5)
- **UI kit**: shadcn-style wrappers in `src/lib/components/ui`, layered on top of `bits-ui` v3

### Current State
- Most UI primitives already use Svelte 5 runes (`$props`, `$state`, `$derived`, snippets).
- App now depends on `bits-ui@next` (v3), resolving previous missing-module failures; some API drift remains (calendar month/year selects, dropdown checkbox group).
- One route (`src/routes/(app)/work/[type]/+page.svelte`) was the last `export let data` holdout and is now migrated to runes.

## 2. Legacy/Risky Areas

### 2.1 bits-ui v2 wrappers
These components technically work in Svelte 5 but should be re-generated from the latest shadcn templates (bits-ui v3) to avoid future incompatibility.

- **Dialog**: `src/lib/components/ui/dialog/*`
- **Sheet**: `src/lib/components/ui/sheet/*`
- **Popover**: `src/lib/components/ui/popover/*`
- **Tooltip**: `src/lib/components/ui/tooltip/*`
- **Dropdown Menu**: `src/lib/components/ui/dropdown-menu/*`
- **Select**: `src/lib/components/ui/select/*`
- **Tabs**: `src/lib/components/ui/tabs/*`
- **Calendar & Date Picker**: `src/lib/components/ui/calendar/*`, `src/lib/components/ui/date-picker/date-picker.svelte`
- **Misc. primitives**: `label`, `separator`, `avatar`

> **Risk:** internal event/state implementations changed between bits-ui v2 and Svelte 5. We’ve already seen popovers/date pickers fail to open because of this.

### 2.2 Remaining page audits
- **`src/routes/(app)/work/[type]/+page.svelte`** is now using runes. Continue migrating any future pages immediately to prevent regressions.

## 3. Upgrade Plan

### Phase A – Short Term (stability while still on bits-ui v2)
1. **Manual QA on high-touch primitives** (Popover, Date Picker, Dialog). Confirm opening/closing and binding works via runes.
2. **Document current shim patterns** (data-slot, `cn`, `buttonVariants`) to ensure new wrappers follow them.
3. **Enforce runes** on any newly touched route or component (no `export let`).

### Phase B – Medium Term (bits-ui v3 / shadcn-svelte v2 migration)
1. **Identify migration order** (start with low-risk primitives: Label, Separator, Avatar → Tooltip/Popover → Dropdown/Select → Tabs → Dialog/Sheet → Calendar/Date Picker).
2. **Regenerate components** with `npx shadcn-svelte@latest add ...` targeting bits-ui v3 templates; compare diffs and keep local styling hooks.
3. **Remove `bits-ui@2`** once all primitives are updated; run `npm run check`, `npm run lint`, and smoke tests.

### Phase C – Long Term (DX & docs)
1. **Create Svelte 5 patterns guide** for new teammates (when to use `$state`, how to expose `bind:value`, etc.).
2. **Add regression tests** around complex primitives (Date Picker, Dialog forms) as they migrate.
3. **Monitor shadcn releases** for v3/v4 updates so the wrappers stay aligned.

## 4. Actionable Checklist

- [x] Migrate last legacy route (`(app)/work/[type]`) to runes.
- [ ] QA current bits-ui v2 primitives for Runes edge cases.
- [ ] Prioritize primitive migration order; capture in a tracker.
- [x] Re-generate `label`, `separator`, `avatar`, `breadcrumb` from Svelte 5 templates.
- [x] Re-generate `popover` from the latest template.
- [x] Re-generate tooltip/dropdown/select/tabs/dialog/sheet/calendar components.
- [ ] QA updated primitives for Runes edge cases (popover, dropdown, select, tabs, dialog, sheet, calendar).
- [ ] Remove `bits-ui@2` once all wrappers are updated.
- [ ] Publish the “Svelte 5 patterns” guide for future UI work.

Use this doc as the canonical reference when scheduling the next steps of the upgrade.
