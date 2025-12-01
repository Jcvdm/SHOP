# SOP: FRC Refresh Snapshot

## When to Use
- Additionals changed and you want the latest snapshot reflected immediately.
- After reopening a completed FRC to incorporate new Additionals.

## How to Use
- Click “Refresh Snapshot” in the FRC banner `src/lib/components/assessment/FRCTab.svelte:559–586`.
- Handler calls `frcService.refreshFRC(assessmentId)` to force merge `src/lib/services/frc.service.ts:...`.

## Behavior
- Merge uses optimistic locking (`line_items_version`) and recomputes totals `src/lib/services/frc.service.ts:172–224`.
- Removal additions normalized to agreed with actuals populated from quoted nett values `src/lib/services/frc.service.ts:154–201`.

## Notes
- Completed FRC must be reopened before refresh.
- Decisions preserved via fingerprint matching in merge.

## Related Docs
- System: [FRC Mechanics](../System/frc_mechanics.md)
- SOP: [FRC Decisions](./frc_decisions.md)