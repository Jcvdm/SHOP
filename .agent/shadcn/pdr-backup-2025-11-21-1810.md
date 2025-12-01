# Project Development Report (PDR) — Shadcn Svelte Alignment

**Last updated**: 2025-11-21

## What we accomplished

| Area | Status | Notes |
| --- | --- | --- |
| Legacy page migration | ✅ | `(app)/work/[type]/+page.svelte` now uses runes (`$props`, `$derived`). |
| UI primitive refresh | ✅ | `label`, `separator`, `avatar`, `breadcrumb`, `popover`, `tooltip`, `dropdown-menu`, `select`, `tabs`, `dialog`, `sheet`, `calendar`, `date-picker` regenerated from the latest Svelte 5 templates. |
| New Requests UX | ✅ | Side bar tabs, Alerts, dialog, and date picker now use shadcn-style components; client dropdown sourced from `$state` list. |
| Date picker rework | ✅ | Rebuilt as Svelte 5 popover + calendar combo with hidden ISO input and label linking. |
| Bits UI dependency | ✅ | Removed `bits-ui@2`, updated `package.json`/`package-lock.json`; regenerated calendar, popover, etc., to target v3-compatible APIs. |
| Supabase type generation | ✅ | Regenerated `src/lib/types/database.ts` from Supabase database; fixed `PostgrestFilterBuilder<never>` errors; added type assertions in services. |
| Check infrastructure | ⚠️ | `npm run check` now passes Supabase typing (0 `PostgrestFilterBuilder<never>` errors); 449 remaining errors are Svelte 5 component/prop issues (unrelated to Supabase). |

## Remaining work

1. **QA sweep** – validate all refreshed primitives (popover/dropdown/select/tabs/dialog/sheet/calendar) in the running app to catch Runes-specific edge cases.
2. **Svelte 5 patterns guide** – document `$state`, `$derived`, `$effect`, and binding best practices for new UI primitives.
3. **Fix Svelte 5 component/prop issues** – resolve 449 remaining `npm run check` errors:
   - Icon component type mismatches (Lucide icons in Svelte 5 components)
   - DataTable column key type mismatches
   - Missing component props (e.g., `onComplete` in EstimateTab, PreIncidentEstimateTab)
   - Service update input type mismatches (e.g., `outwork_markup_percentage` vs `oem_markup_percentage`)
   - Request type issues (e.g., `notes` property doesn't exist on Request)
4. **Regression tests** – once component/prop errors are resolved, run `npm run check`/`npm run lint` and extend the suite around date pickers/dialogs if needed.

## Manual testing performed

- Requests list filtering tabs (with badges) and alert handling.
- New Request page with Quick Add dialog, date picker, and client dropdown.
- Calendar/date picker to ensure user selection persists in the hidden ISO field.
- Confirmed package build still runs.
- Verified Supabase type generation fix: `npm run check 2>&1 | Select-String "PostgrestFilterBuilder.*never"` returns 0 matches ✅

## Supabase Type Generation Fix (Nov 21, 2025)

**Issue**: `npm run check` was blocked by `PostgrestFilterBuilder<never>` errors (493+ errors total)

**Root Cause**: Custom Database interface missing `__InternalSupabase` field required by Supabase's type system

**Solution**:
- Regenerated `src/lib/types/database.ts` from actual Supabase database using CLI
- Replaced custom Database interface with generated types
- Added domain type re-exports and type assertions in services
- Files modified: `client.service.ts`, `audit.service.ts`, `assessment.service.ts`

**Result**: ✅ All `PostgrestFilterBuilder<never>` errors resolved

**Documentation**: See `.agent/System/supabase_type_generation.md` for full details

---

## Notes for the next phase

- Use this PDR and `.agent/shadcn/svelte5-upgrade-checklist.md` as the canonical tracker when touching additional primitives.
- Retain the shadcn component wiring (`data-slot`, `buttonVariants`, `cn`) so future regenerations don’t drift visually.
- Focus on resolving the 449 remaining Svelte 5 component/prop issues (see "Remaining work" section above).
- When regenerating types after schema migrations, follow the process in `.agent/System/supabase_type_generation.md`.
