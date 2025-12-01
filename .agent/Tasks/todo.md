# ClaimTech TODO - Features & Enhancements

## Pending Features

### 1. Add Sundries to Quotes
**Status**: Not Started  
**Priority**: Medium  
**Component**: Estimate Tab / Quote Generation  
**Description**:
Implement functionality to add sundries (miscellaneous items/charges) to quotes/estimates. Sundries should be included in the estimate calculations and appear in generated PDF documents.

**Requirements**:
- Add sundries section to Estimate Tab
- Allow users to add/edit/remove sundry items
- Include sundries in estimate totals and calculations
- Display sundries in PDF quote generation
- Persist sundries to database

**Related Components**:
- EstimateTab.svelte
- Estimate service/database
- PDF generation/templates
- Line items table/calculations

**Notes**:
- Determine if sundries should be separate from line items or integrated into existing line item system
- Consider how sundries affect totals (parts, labor, paint, other categories)
- May need new database fields or table structure

---

### 2. Implement Excess into App
**Status**: Not Started  
**Priority**: Medium  
**Component**: Assessment / Estimate Calculations  
**Description**:
Implement excess/deductible functionality into the application. Excess should be tracked, calculated, and displayed in estimates and reports.

**Requirements**:
- Add excess field to assessment or client data
- Calculate excess impact on estimate totals
- Display excess in estimate summaries
- Include excess in PDF documents
- Handle excess in financial calculations

**Related Components**:
- Assessment data model
- Estimate calculations
- PDF generation/templates
- Estimate Tab display
- Financial summary components

**Notes**:
- Determine where excess is stored (client level, assessment level, or both)
- Consider how excess interacts with estimate totals and write-off thresholds
- May need to update color-coded visual indicators (RED/YELLOW/GREEN) to account for excess
- Excess should be clearly visible in all financial summaries

