# Estimate Threshold Indicators Implementation

## Overview
Added visual indicators to the Estimate tab that show:
1. **Warranty Status Hint** - Displays vehicle warranty information at the top
2. **Estimate Total Color Coding** - Colors the estimate total based on proximity to retail borderline write-off value

---

## Features Implemented

### **1. Warranty Status Hint**

Displays warranty information at the top of the Estimate tab with:
- **Status Badge** with color coding:
  - 🟢 **Green** - Active warranty
  - 🔴 **Red** - Expired or Void warranty
  - 🔵 **Blue** - Transferred warranty
  - ⚪ **Gray** - Unknown or Not Set
- **Warranty Period** - Shows start and end dates
- **Mileage Limit** - Displays warranty expiry mileage (unlimited or specific km)
- **Icon Indicators** - Visual icons for quick status recognition

**Example Display:**
```
┌─────────────────────────────────────────────────────┐
│ ✓ Warranty Status: Active                          │
│ Valid from 01/03/2022 to 01/03/2027                │
│ Mileage limit: 100,000 km                          │
└─────────────────────────────────────────────────────┘
```

---

### **2. Estimate Total Color Coding**

The estimate total is color-coded based on its percentage relative to the **Retail Borderline Write-off** value:

#### **Color Thresholds:**

| Percentage Range | Color | Meaning | Visual Indicator |
|-----------------|-------|---------|------------------|
| **≥ 90%** | 🔴 **RED** | Critical - Within 10% of write-off | ⚠️ Warning message |
| **60-90%** | 🟠 **ORANGE** | Warning - Approaching threshold | ⚠️ Warning message |
| **25-60%** | 🟡 **YELLOW** | Moderate - Mid-range estimate | ℹ️ Info message |
| **< 25%** | 🟢 **GREEN** | Low - Well below threshold | ℹ️ Info message |

#### **Warning Messages:**

- **RED (≥90%)**: "⚠️ Critical: Estimate is within 10% of borderline write-off (92.5%)"
- **ORANGE (60-90%)**: "⚠️ Warning: Estimate is 75.3% of borderline write-off"
- **YELLOW (25-60%)**: "Estimate is 45.2% of borderline write-off"
- **GREEN (<25%)**: "Estimate is 18.7% of borderline write-off"

---

## Technical Implementation

### **Files Created:**

#### **1. `src/lib/utils/estimateThresholds.ts`**
Utility functions for threshold calculations and color coding:

```typescript
export type ThresholdColor = 'green' | 'yellow' | 'orange' | 'red' | 'normal';

export interface ThresholdResult {
  color: ThresholdColor;
  percentage: number;
  message: string;
  showWarning: boolean;
}

// Calculate threshold and return color/message
export function calculateEstimateThreshold(
  estimateTotal: number,
  retailBorderline: number | null | undefined
): ThresholdResult

// Get Tailwind CSS classes for colors
export function getThresholdColorClasses(color: ThresholdColor)

// Format warranty status for display
export function formatWarrantyStatus(status: string | null | undefined)

// Get warranty status badge classes
export function getWarrantyStatusClasses(color: 'green' | 'red' | 'gray' | 'yellow' | 'blue')
```

---

### **Files Modified:**

#### **1. `src/lib/components/assessment/EstimateTab.svelte`**

**Added Props:**
```typescript
interface Props {
  // ... existing props
  vehicleValues: VehicleValues | null; // NEW
}
```

**Added Derived Calculations:**
```typescript
// Calculate threshold for estimate total vs retail borderline
const thresholdResult = $derived(() => {
  if (!estimate || !vehicleValues) return null;
  return calculateEstimateThreshold(estimate.total, vehicleValues.borderline_writeoff_retail);
});

// Format warranty status
const warrantyInfo = $derived(() => {
  if (!vehicleValues) return null;
  return formatWarrantyStatus(vehicleValues.warranty_status);
});
```

**Added UI Components:**
1. **Warranty Status Card** - Displayed at top of Estimate tab
2. **Color-Coded Total** - Estimate total with dynamic color
3. **Threshold Warning Box** - Shows percentage and borderline value

---

#### **2. `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte`**

**Updated EstimateTab Call:**
```typescript
<EstimateTab
  estimate={data.estimate}
  assessmentId={data.assessment.id}
  estimatePhotos={data.estimatePhotos}
  vehicleValues={data.vehicleValues} // NEW - Pass vehicle values
  onUpdateEstimate={handleUpdateEstimate}
  // ... other props
/>
```

---

## Visual Examples

### **Example 1: Critical - Red (95% of borderline)**

```
┌─────────────────────────────────────────────────────┐
│ Total (Inc VAT)                    R 95,000.00 🔴   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ ⚠️ Critical: Estimate is within 10% of       │   │
│ │    borderline write-off (95.0%)              │   │
│ │    Retail Borderline: R 100,000.00           │   │
│ └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### **Example 2: Warning - Orange (75% of borderline)**

```
┌─────────────────────────────────────────────────────┐
│ Total (Inc VAT)                    R 75,000.00 🟠   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ ⚠️ Warning: Estimate is 75.0% of borderline  │   │
│ │    write-off                                 │   │
│ │    Retail Borderline: R 100,000.00           │   │
│ └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### **Example 3: Moderate - Yellow (45% of borderline)**

```
┌─────────────────────────────────────────────────────┐
│ Total (Inc VAT)                    R 45,000.00 🟡   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ ℹ️ Estimate is 45.0% of borderline write-off │   │
│ │    Retail Borderline: R 100,000.00           │   │
│ └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### **Example 4: Low - Green (20% of borderline)**

```
┌─────────────────────────────────────────────────────┐
│ Total (Inc VAT)                    R 20,000.00 🟢   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ ℹ️ Estimate is 20.0% of borderline write-off │   │
│ │    Retail Borderline: R 100,000.00           │   │
│ └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Calculation Logic

### **Threshold Percentage Calculation:**

```typescript
percentage = (estimateTotal / retailBorderline) × 100
```

**Example:**
- Estimate Total: R 85,000
- Retail Borderline: R 100,000
- Percentage: (85,000 / 100,000) × 100 = **85%**
- Result: **ORANGE** (60-90% range)

---

## Use Cases

### **Use Case 1: Prevent Write-offs**
**Scenario**: Estimate is approaching write-off threshold
- **Display**: RED total with critical warning
- **Action**: Assessor can review line items to reduce costs
- **Benefit**: Avoid unnecessary write-offs

### **Use Case 2: Warranty Coverage**
**Scenario**: Vehicle has active warranty
- **Display**: Green warranty badge at top
- **Action**: Assessor considers warranty coverage for repairs
- **Benefit**: Proper handling of warranty claims

### **Use Case 3: Cost Monitoring**
**Scenario**: Estimate is mid-range (yellow)
- **Display**: Yellow total with info message
- **Action**: Assessor monitors costs as work progresses
- **Benefit**: Proactive cost management

### **Use Case 4: Low-Cost Repairs**
**Scenario**: Minor damage, low estimate
- **Display**: Green total
- **Action**: Quick approval, no write-off concerns
- **Benefit**: Faster processing

---

## Benefits

1. ✅ **Visual Clarity** - Instant understanding of estimate status
2. ✅ **Proactive Alerts** - Warns before reaching write-off threshold
3. ✅ **Warranty Awareness** - Shows warranty status upfront
4. ✅ **Decision Support** - Helps assessors make informed decisions
5. ✅ **Cost Control** - Encourages cost-conscious estimating
6. ✅ **Risk Management** - Identifies high-risk estimates early
7. ✅ **Professional Presentation** - Clean, color-coded interface

---

## Testing Scenarios

### **Test 1: Red Threshold (≥90%)**
```
Retail Borderline: R 100,000
Estimate Total: R 95,000
Expected: RED total, critical warning
```

### **Test 2: Orange Threshold (60-90%)**
```
Retail Borderline: R 100,000
Estimate Total: R 75,000
Expected: ORANGE total, warning message
```

### **Test 3: Yellow Threshold (25-60%)**
```
Retail Borderline: R 100,000
Estimate Total: R 45,000
Expected: YELLOW total, info message
```

### **Test 4: Green Threshold (<25%)**
```
Retail Borderline: R 100,000
Estimate Total: R 20,000
Expected: GREEN total, info message
```

### **Test 5: Active Warranty**
```
Warranty Status: active
Start Date: 2022-03-01
End Date: 2027-03-01
Mileage: 100,000 km
Expected: Green warranty badge with dates
```

### **Test 6: Expired Warranty**
```
Warranty Status: expired
Start Date: 2018-06-15
End Date: 2021-06-15
Expected: Red warranty badge
```

---

## Future Enhancements

1. **Adjustable Thresholds** - Allow clients to customize percentage thresholds
2. **Historical Tracking** - Track how often estimates approach write-off
3. **Email Alerts** - Notify managers when estimates exceed thresholds
4. **Comparison View** - Show estimate vs all three borderlines (Trade/Market/Retail)
5. **Trend Analysis** - Show if estimate is increasing/decreasing over time
6. **Warranty Integration** - Link to warranty claim submission if applicable
7. **Cost Optimization Suggestions** - AI-powered suggestions to reduce costs

---

**Status:** ✅ **COMPLETE**  
**Date:** 2025-01-08  
**Impact:** High - Critical decision-support feature  
**Location:** Estimate Tab (Main Assessment Flow)

