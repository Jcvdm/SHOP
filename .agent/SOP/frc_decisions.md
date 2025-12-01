# SOP: FRC Decisions (Agree/Adjust/Removed)

## Agree
- Copies quoted components to actuals and sets nett actual total `src/lib/services/frc.service.ts:516–536`.

## Adjust
- Requires `adjust_reason` and `actual_total`; stores component actuals; recomputes aggregates `src/lib/services/frc.service.ts:537–557, 598–637`.

## Removed/Declined
- Original removed rows are read-only with “Agreed (Removed)” badge `src/lib/components/assessment/FRCLinesTable.svelte:139–149`.
- Removal additions auto-agreed during merge; hidden in UI; deduction displayed on the original row `src/lib/services/frc.service.ts:154–201`.
- Declined additions show as read-only; included in totals via negative breakdown when applicable.

## Completion
- Only actionable lines must be decided (excludes removed/declined) `src/lib/services/frc.service.ts:692–698`.

## Related Docs
- System: [FRC Mechanics](../System/frc_mechanics.md)
- SOP: [FRC Refresh](./frc_refresh.md)