# Task: FRC UI & Logic Refinement

## Summary
- Replaced Combined totals with Baseline (Original) and New Total (Decided + Removals) and Delta.
- Grouped removal rows (single visible original with Deduction badge); auto-agreed removal additions.
- Added per-line invoice attach/match metadata and UI.

## Files Changed
- FRCTab: `src/lib/components/assessment/FRCTab.svelte:689–714, 839–893`
- FRCLinesTable: `src/lib/components/assessment/FRCLinesTable.svelte:121–156, 139–149`
- frc.service: `src/lib/services/frc.service.ts:154–201, 172–224`
- frcCalculations: `src/lib/utils/frcCalculations.ts:60–83, 110–158, 169–207, 458–527`
- types: `src/lib/types/assessment.ts:928–970`

## Verification
- Removed line → refresh: Baseline unchanged; New includes deduction; Delta negative.
- Additional agreed line → New increases; Delta positive.
- Refresh preserves decisions; removed rows show “Agreed (Removed)”.

## Related Docs
- System: [FRC Mechanics](../System/frc_mechanics.md)
- SOP: [FRC Decisions](../SOP/frc_decisions.md), [FRC Refresh](../SOP/frc_refresh.md)