# FRC Component Breakdown Implementation

## Overview
Enhanced the Final Repair Costing (FRC) feature to display and capture detailed component-level breakdowns for each line item, allowing verification of invoice pricing against quoted estimates.

## Changes Made

### 1. Type Extensions (`src/lib/types/assessment.ts`)

Extended `FRCLineItem` interface with:

**Quoted Component Breakdown (snapshot from estimate/additional):**
- `quoted_part_price_nett` - Nett part price without markup
- `quoted_part_price` - Selling price with markup
- `quoted_strip_assemble` - S&A cost
- `quoted_labour_cost` - Labour cost
- `quoted_paint_cost` - Paint cost
- `quoted_outwork_charge` - Outwork charge

**Quantities and Rates Snapshot (for traceability):**
- `part_type` - OEM/ALT/2ND
- `strip_assemble_hours` - S&A hours
- `labour_hours` - Labour hours
- `paint_panels` - Paint panels
- `labour_rate_snapshot` - Labour rate at FRC creation
- `paint_rate_snapshot` - Paint rate at FRC creation

**Actual Component Breakdown (from invoice):**
- `actual_part_price_nett` - Actual nett part price from invoice
- `actual_strip_assemble` - Actual S&A cost
- `actual_strip_assemble_hours` - Actual S&A hours
- `actual_labour_cost` - Actual labour cost
- `actual_labour_hours` - Actual labour hours
- `actual_paint_cost` - Actual paint cost
- `actual_paint_panels` - Actual paint panels
- `actual_outwork_charge` - Actual outwork charge

### 2. Snapshot Logic (`src/lib/utils/frcCalculations.ts`)

Updated `composeFinalEstimateLines()` to capture full component breakdown when creating FRC:
- Snapshots all quoted component values from source estimate/additional lines
- Captures quantities (hours, panels) and rates for traceability
- Initializes all actual component fields to null
- Works for both estimate and additional line sources

### 3. Service Layer (`src/lib/services/frc.service.ts`)

Enhanced `updateLineDecision()` method:
- Added optional `componentActuals` parameter to accept detailed component breakdowns
- For "agree" decisions: copies quoted components to actuals
- For "adjust" decisions: stores provided component actuals in JSONB line object
- Maintains backward compatibility with existing total-only approach

**Method Signature:**
```typescript
async updateLineDecision(
  frcId: string,
  lineId: string,
  decision: 'agree' | 'adjust',
  actualTotal?: number,
  adjustReason?: string,
  componentActuals?: {
    actual_part_price_nett?: number | null;
    actual_strip_assemble_hours?: number | null;
    actual_strip_assemble?: number | null;
    actual_labour_hours?: number | null;
    actual_labour_cost?: number | null;
    actual_paint_panels?: number | null;
    actual_paint_cost?: number | null;
    actual_outwork_charge?: number | null;
  }
): Promise<FinalRepairCosting>
```

### 4. UI Components (`src/lib/components/assessment/FRCTab.svelte`)

#### Line Items Table Enhancement
- Displays quoted component breakdown below each line description
- Shows: Parts (nett), S&A (with hours), Labour (with hours), Paint (with panels), Outwork
- Read-only display with formatted currency and quantities
- Only shows components that have values > 0

#### Enhanced Adjust Modal
**Quoted Breakdown Section (Read-only):**
- Shows all quoted components in a gray box at top
- Displays quantities in parentheses (hours/panels)
- Shows total quoted amount

**Actual Component Inputs:**
- Parts: Nett price input (matches invoice nett price)
- S&A: Hours input (calculates cost using labour rate)
- Labour: Hours input (calculates cost using labour rate)
- Paint: Panels input (calculates cost using paint rate)
- Outwork: Amount input

**Live Calculations:**
- Real-time derived actual total from component inputs
- Shows delta vs quoted amount (red for increase, green for decrease)
- Uses snapshotted rates for consistency

**Helper Functions:**
- `getRatesFor(line)` - Retrieves labour/paint rates from line snapshot
- `derivedActualTotal()` - Calculates total from component inputs using rates
- Component inputs initialized from existing actuals when reopening modal

## Key Features

### 1. Invoice Verification
- Parts show nett prices (matching invoice format)
- All amounts are exclusive of VAT
- Component-level comparison enables detailed variance analysis

### 2. Hours-Based S&A and Labour
- Enter hours from invoice
- System calculates cost using snapshotted rates
- Shows calculated cost below input for verification

### 3. Panels-Based Paint
- Enter panels from invoice
- System calculates cost using snapshotted paint rate
- Shows calculated cost below input for verification

### 4. Rate Consistency
- Rates are snapshotted at FRC creation time
- Ensures calculations remain consistent even if estimate rates change later
- Rates displayed in modal for transparency

### 5. Flexible Input
- Only shows inputs for components that exist in quoted breakdown
- Can adjust any combination of components
- Total derives automatically from entered components

## Data Flow

1. **FRC Creation:**
   - `composeFinalEstimateLines()` snapshots all component values from estimate/additionals
   - Stores quantities, rates, and component breakdowns in JSONB

2. **Display:**
   - Table shows quoted breakdown from snapshotted values
   - No need to look up source lines

3. **Adjustment:**
   - Modal displays quoted breakdown (read-only)
   - User enters actual component values from invoice
   - System calculates derived total using snapshotted rates
   - Saves both component actuals and derived total

4. **Persistence:**
   - All component data stored in JSONB `line_items` column
   - No database schema changes required
   - Backward compatible with existing FRC records

## Benefits

1. **Detailed Verification:** Can verify each component price against invoice
2. **Audit Trail:** Complete record of quoted vs actual for each component
3. **Transparency:** Shows exactly how totals are calculated
4. **Flexibility:** JSONB storage allows future enhancements without migrations
5. **Consistency:** Snapshotted rates ensure calculations don't change over time
6. **User-Friendly:** Familiar hours/panels inputs matching estimate workflow

## Testing Checklist

- [/] Create new FRC and verify component breakdown displays in table
- [ ] Click Adjust and verify quoted breakdown shows correctly in modal
- [ ] Enter actual component values and verify derived total calculates correctly
- [ ] Save adjustment and verify component actuals persist
- [ ] Reopen adjustment modal and verify saved actuals load correctly
- [ ] Click Agree and verify quoted components copy to actuals
- [ ] Verify component breakdown shows for both estimate and additional line sources
- [ ] Test with different process types (N, R, P, B, A, O)
- [ ] Verify rates snapshot correctly and calculations remain consistent
- [ ] Test with partial component inputs (not all fields filled)

## Future Enhancements

1. Display actual component breakdown in table after adjustment (similar to quoted)
2. Add component-level variance indicators (red/green badges per component)
3. Export component breakdown to PDF reports
4. Add component-level notes/comments
5. Support for rate overrides if invoice uses different rates (currently not needed per user)

