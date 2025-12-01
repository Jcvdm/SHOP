# Requests Flow Alignment

This note documents the shadcn-svelte alignment work done on the Requests list (`src/routes/(app)/requests/+page.svelte`) and the New Request form (`src/routes/(app)/requests/new/+page.svelte`). It explains which primitives we adopted, why they help with Svelte 5 + shadui consistency, and how future screens should follow the same patterns.

## Why these changes?
- The Requests list still relied on ad-hoc Tailwind buttons for filtering and bespoke error banners. That made it hard to keep focus styles, aria attributes, and the new rose palette aligned with the rest of the app.
- The New Request form used a custom modal overlay that lacked focus trapping and mixed server data (`data.clients`) with client mutations. We needed the dialog, alert, and form state patterns used elsewhere in the rose refresh.

## Key shadcn components introduced
1. **Tabs (`src/lib/components/ui/tabs/`)** – wraps the Bits UI tabs primitive so the status filter behaves like the other segmented controls in ClaimTech. Active state, keyboard navigation, and aria roles are now handled by the primitive.
2. **Alert (`src/lib/components/ui/alert/`)** – consolidates error banners so page-level alerts share spacing, typography, icon slot, and destructive variants.
3. **Dialog (`src/lib/components/ui/dialog/`)** – powers the Quick Add Client flow with a proper overlay, focus trap, and escape key handling instead of a hand-rolled modal.

## Requests list updates (`src/routes/(app)/requests/+page.svelte:1`)
1. **Status Filters → Tabs**
   - Added the `Tabs`, `TabsList`, and `TabsTrigger` components with derived counts. The segmented appearance now comes from the primitive instead of conditional Tailwind strings.
   - The triggers still support badges via slots, but hover/focus/active handling is centralized and keyboard access “just works”.
2. **Error Banner → Alert**
   - The `data.error` notice now uses `<Alert variant="destructive">` with `<AlertTitle>` and `<AlertDescription>` so every page-level error banner matches the global style guide.
3. **Page naming**
   - Header now reads **Requests** to avoid confusion with the “New Request” creation flow and to match other resource list pages (Clients, Repairers, etc.).

## New Request page updates (`src/routes/(app)/requests/new/+page.svelte:1`)
1. **Quick Add Client → Dialog**
   - Wrapped the form in `<Dialog bind:open={showClientModal}>` plus `DialogContent/DialogHeader/DialogFooter` for consistent spacing, backdrop, and keyboard behavior.
   - The CTA button still toggles `showClientModal`, but the heavy lifting (focus trap, overlay, close button) comes from the dialog primitive.
2. **Clients state management**
   - Introduced `let clients = $state(data.clients);` so newly created clients live in local state instead of mutating `data`. `clientOptions` is now a `$derived` array from `clients`, making the dropdown reactive and easier to follow.
3. **Alert reuse**
   - Both load errors (`data.error`) and runtime form errors (`error`) render via the new Alert primitive for consistent styling.
4. **FormField audit**
   - Confirmed that `FormField` continues to wrap the shadcn `Label`, `Input`, `Textarea`, and `Select` components. Its structure stays unchanged, but future validation wiring will benefit from the consistent markup.

## Follow-up guidelines
- Reuse the same Tabs primitive for any other segmented filters (e.g., Inspections or Assessments). It already supports arbitrary child content (icons, badges, etc.).
- Share the Alert component for info/warning states to avoid bespoke Tailwind blocks.
- Prefer the Dialog primitive for modals instead of ad-hoc overlays so accessibility holds up during the modernization push.
- Initialize mutable UI collections (like clients) from `data` but manage them in their own `$state` variables to keep server data immutable inside components.

## Related docs
- `.agent/shadui/date-picker.md`
- `.agent/shadui/sidebar-modernization.md`
- `.agent/shadui/login-modernization.md`
- `.agent/shadui/top-bar-research.md`
