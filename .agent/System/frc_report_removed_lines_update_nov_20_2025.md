# Fix FRC Report Line Items for Removed Lines (Deduplicate rows and add deduction notes)
- Date: November 20, 2025

## Problem
In the FRC report’s **Line Items Breakdown** section, a single removal event from the Additionals workflow appeared as **multiple rows**:
- Original estimate line (e.g., Left front door mirror complete ALT), marked as removed.
- Removal additional line with a negative total.
- Any replacement line (e.g., OEM version).

The FRC tab UI already groups removed items to one logical row with a “REMOVED” badge and a “Deduction” chip. The report, however, directly iterated all `frc.line_items`, so the extra negative removal row appeared for insurers, creating confusion and apparent duplication.

## Goal
- Show each removed item only once in the FRC report “Line Items Breakdown” table, with a clear deduction indicator.
- Preserve data and totals: keep the dual-line pattern (original + negative removal) in `assessment_frc.line_items` and all calculations.
- Align the presentation semantics with the FRC tab UI.

## Changes Made
### 1. Grouping helper before rendering
In `generateFRCReportHTML`:
- Build a `groupedLineItems` array that skips raw removal additional rows (`is_removal_additional`).
- For each original estimate line with `removed_via_additionals`, find its paired removal via `removal_for_source_line_id` and expose it as `removal`.

### 2. Rendering Line Items with grouped rows
- Render the table using `groupedLineItems` instead of a flat `frc.line_items` map.
- For removed-row entries (`isRemovedGroup` true):
  - Decision badge shows `AGREMOVED`.
  - Notes column shows: `Removed via Additionals (deduction R X)`.
  - Actual is set to `original + removal` (typically 0) and variance shows the deduction.
- Positive/normal items render as before.

### 3. Preserving totals and audit
- No changes were made to `frc.line_items`, calculations, persisted totals, or the aggregated totals section of the report.
- The dual-line pattern remains fully intact for data integrity and audit.

## Result
For a removed mirror with a replacement OEM:
- The report now shows:
   - One row for the removed ALT line with “AGREMOVED” badge and the deduction note.
  - One row for the OEM replacement line.
  - No extra raw removal-negative row.

Other sections (totals, Deductions, etc.) remain unchanged and consistent with the FRC tab.

## Related Docs
- System: `frc_mechanics.md`
- SOP: `frc_refresh.md`, `frc_decisions.md`
- Implementation Plan: `Fix FRC Report Line Items for Removed Lines (Avoid Confusing Duplicates)`
- Implementation Task: Tasks/FRC UI_logic_refinement.md