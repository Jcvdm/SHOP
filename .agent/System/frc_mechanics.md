# FRC Mechanics & Totals Semantics

## Snapshot & Merge Flow
- Snapshot stored in `assessment_frc.line_items`; merges Additionals while preserving existing decisions via fingerprint (`source:source_line_id`).
- Auto-merge with optimistic locking (`line_items_version`) and totals recomputation `src/lib/services/frc.service.ts:172–224`.
- Manual Refresh Snapshot triggers unconditional merge `src/lib/services/frc.service.ts:...` and updates UI `src/lib/components/assessment/FRCTab.svelte:559–586`.

## Line Composition
- Original estimate lines included once; if removed via Additionals, marked `removed_via_additionals: true` `src/lib/utils/frcCalculations.ts:60–83`.
- Approved/declined Additionals included; removal lines carry negative totals and are flagged with pairing metadata:
  - `is_removal_additional: true`
  - `removal_for_source_line_id: <original estimate line id>` `src/lib/utils/frcCalculations.ts:110–158, 169–207`.

## UI Grouping
- FRCLinesTable hides removal additional rows and shows a Deduction badge on the original removed line `src/lib/components/assessment/FRCLinesTable.svelte:121–156`.
- Removed/declined lines are read-only; actions disabled.

## Decisions
- Removal additions normalized to `decision='agree'` during merge; actuals populated from quoted nett values `src/lib/services/frc.service.ts:154–201`.
- Original removed rows show “Agreed (Removed)” `src/lib/components/assessment/FRCLinesTable.svelte:139–149`.

## Totals Semantics
- Baseline = Original Estimate only (no Additionals): computed from `frc.quoted_estimate_subtotal` and `frc.vat_percentage` `src/lib/components/assessment/FRCTab.svelte:689–714`.
- New Total = Decided lines + automatic removals; excludes removed originals; aggregates nett, applies parts/outwork markups at aggregate level, then VAT `src/lib/utils/frcCalculations.ts:458–527`.
- Delta = `New Total − Baseline` with up/down indicator `src/lib/components/assessment/FRCTab.svelte:839–893`.

## Related Docs
- System: [Project Architecture](./project_architecture.md)
- SOP: [FRC Decisions](../SOP/frc_decisions.md), [FRC Refresh](../SOP/frc_refresh.md)