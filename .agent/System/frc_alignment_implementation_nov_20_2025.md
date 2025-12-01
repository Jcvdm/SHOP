# FRC Alignment Implementation (Nov 20, 2025)

## Overview
This document records the implementation aligning the FRC tab and FRC report with the intended semantics:
- Baseline = Original Estimate only (estimate-only breakdown + VAT).
- Final Settlement = Combined aggregates after Additionals and FRC decisions (persisted in `assessment_frc.actual_*`).
- Report and Tab should present consistent numbers for Baseline vs Final (aka New Total on tab).

## Changes Implemented

### 1) FRC Tab – New Total alignment (no API changes)
- FRCTab now derives the “New Total” card directly from the persisted aggregates on `FinalRepairCosting`:
  - `parts_nett = actual_estimate_parts_nett + actual_additionals_parts_nett`
  - `labour = actual_estimate_labour + actual_additionals_labour`
  - `paint = actual_estimate_paint + actual_additionals_paint`
  - `outwork_nett = actual_estimate_outwork_nett + actual_additionals_outwork_nett`
  - `markup = actual_estimate_markup + actual_additionals_markup`
  - `subtotal = actual_subtotal`, `vat_amount = actual_vat_amount`, `total = actual_total`
- Baseline is computed from `quoted_estimate_subtotal` + VAT at `frc.vat_percentage`.
- Effect: The tab’s New Total and the report’s settlement now use the same persisted aggregates and match under stable conditions.

### 2) FRC Report – Baseline vs Final category breakdown
- The “Quoted vs Actual Totals” section was updated to reflect Baseline vs Final, not Combined quoted vs actual.
- New objects in `generateFRCReportHTML`:
  - `baseline.*` from estimate-only quoted fields and VAT over `quoted_estimate_subtotal`.
  - `finalTotals.*` from combined actual fields (estimate + additionals) and persisted VAT/total.
- The category table rows now show:
  - Quoted (Baseline) vs Actual (Final) with Variance = Final − Baseline for:
    - Parts (Nett), Labour, Paint, Outwork (Nett), Markup, Subtotal, VAT, Total.
- Header cards already show Baseline vs Final Settlement, now consistent with the table.

### 3) FRC Report – Removed lines grouping
- Line Items Breakdown now groups removals to avoid duplicate rows:
  - Skips raw negative removal additional lines.
  - Renders a single logical row for the original removed estimate line with:
    - Decision badge: “AGREED (REMOVED)”.
    - Notes: “Removed via Additionals (deduction R X)”.
    - Actual shown as original + removal (typically → 0); variance shows the deduction.
- Totals remain unchanged; grouping is presentation-only.

## Rationale
- Reduces confusion by aligning report presentation with the engineer-facing FRC tab model.
- Preserves the audit trail and math while simplifying the insurer-facing representation.
- Uses persisted `assessment_frc` aggregates as the single source of truth.

## Verification
- Mirror example: Baseline R 2 889,60 vs Final R 8 495,40 now matches across tab and report.
- Category rows mirror the tab’s Baseline/New subtotals, VAT, and totals.
- Removed items appear once with clear deduction labeling.

## Related Docs
- System: `frc_mechanics.md`
- SOP: `frc_refresh.md`, `frc_decisions.md`
- Implementation Task: `Tasks/FRC_UI_logic_refinement.md`
