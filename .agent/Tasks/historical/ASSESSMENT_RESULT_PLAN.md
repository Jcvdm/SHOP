# Assessment Result Feature - Implementation Plan

## Overview
Add assessment result selection to the Estimate tab, allowing users to classify the final outcome of the assessment as: **Repair**, **Code 2**, **Code 3**, or **Total Loss**.

---

## 📋 Requirements

### Business Context
In South African vehicle insurance assessments:
- **Repair**: Vehicle can be economically repaired and returned to service
- **Code 2**: Repairable write-off - vehicle was written off but can be repaired (salvage title)
- **Code 3**: Non-repairable write-off - vehicle cannot be economically repaired (scrap)
- **Total Loss**: Vehicle is a complete loss (alternative term for write-off)

### User Story
> As an assessor, I want to select the final assessment result after completing the estimate, so that the outcome is clearly documented and can be used for reporting and decision-making.

### Acceptance Criteria
- [ ] Assessment result field added to estimate
- [ ] Four options available: Repair, Code 2, Code 3, Total Loss
- [ ] Result selector appears at bottom of estimate tab (after totals, before actions)
- [ ] Visual indicators (colors/icons) for each result type
- [ ] Result is saved with estimate
- [ ] Result appears in summary component
- [ ] Result can be changed and updated
- [ ] Default value is null/unselected

---

## 🗄️ Database Schema

### Migration: `032_add_assessment_result_to_estimates.sql`

```sql
-- Create enum type for assessment results
CREATE TYPE assessment_result_type AS ENUM ('repair', 'code_2', 'code_3', 'total_loss');

-- Add assessment_result column to assessment_estimates
ALTER TABLE assessment_estimates
ADD COLUMN assessment_result assessment_result_type;

-- Add index for filtering by result
CREATE INDEX idx_assessment_estimates_result ON assessment_estimates(assessment_result);

-- Add comment
COMMENT ON COLUMN assessment_estimates.assessment_result IS 'Final assessment outcome: repair, code_2 (repairable write-off), code_3 (non-repairable write-off), or total_loss';
```

---

## 📐 TypeScript Types

### Update `src/lib/types/assessment.ts`

```typescript
// Assessment result type
export type AssessmentResultType = 'repair' | 'code_2' | 'code_3' | 'total_loss';

// Assessment result display info
export interface AssessmentResultInfo {
	value: AssessmentResultType;
	label: string;
	description: string;
	color: 'green' | 'yellow' | 'orange' | 'red';
	icon: 'check' | 'alert' | 'x' | 'ban';
}

// Update Estimate interface
export interface Estimate {
	id: string;
	assessment_id: string;
	repairer_id?: string | null;
	// ... existing fields ...
	assessment_result?: AssessmentResultType | null; // NEW
	// ... rest of fields ...
}

// Update CreateEstimateInput
export interface CreateEstimateInput {
	assessment_id: string;
	// ... existing fields ...
	assessment_result?: AssessmentResultType | null; // NEW
}

// Update UpdateEstimateInput
export interface UpdateEstimateInput extends Partial<Omit<CreateEstimateInput, 'assessment_id'>> {
	// ... existing fields ...
	assessment_result?: AssessmentResultType | null; // NEW
}
```

---

## 🎨 UI Component Design

### New Component: `src/lib/components/assessment/AssessmentResultSelector.svelte`

**Purpose**: Allow user to select the final assessment result

**Props**:
```typescript
interface Props {
	assessmentResult?: AssessmentResultType | null;
	onUpdate: (result: AssessmentResultType | null) => void;
	disabled?: boolean;
}
```

**Design**:
- Card component with title "Assessment Result"
- Radio button group with 4 options
- Each option shows:
  - Icon (CheckCircle, AlertCircle, XCircle, Ban)
  - Label (Repair, Code 2, Code 3, Total Loss)
  - Description (brief explanation)
  - Color coding (green, yellow, orange, red)
- "Clear Selection" button to reset to null
- Responsive grid layout (2x2 on desktop, stacked on mobile)

**Visual Layout**:
```
┌─────────────────────────────────────────────────┐
│ Assessment Result                                │
├─────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐             │
│ │ ✓ Repair     │  │ ⚠ Code 2     │             │
│ │ Economic to  │  │ Repairable   │             │
│ │ repair       │  │ write-off    │             │
│ └──────────────┘  └──────────────┘             │
│ ┌──────────────┐  ┌──────────────┐             │
│ │ ✗ Code 3     │  │ ⊗ Total Loss │             │
│ │ Non-repairable│  │ Complete loss│             │
│ │ write-off    │  │              │             │
│ └──────────────┘  └──────────────┘             │
│                                                  │
│ [Clear Selection]                                │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. **Component Integration**

**EstimateTab.svelte** (lines 750-767):
```svelte
<!-- Current structure -->
</Card> <!-- Totals card ends at line 750 -->

<!-- NEW: Assessment Result Selector -->
<AssessmentResultSelector
	assessmentResult={estimate.assessment_result}
	onUpdate={handleUpdateAssessmentResult}
	disabled={!estimate || estimate.line_items.length === 0}
/>

<!-- Incident Photos -->
<EstimatePhotosPanel ... />

<!-- Actions -->
<div class="flex justify-between">
	...
</div>
```

### 2. **Handler Function**

**EstimateTab.svelte** - Add to Props:
```typescript
interface Props {
	// ... existing props ...
	onUpdateAssessmentResult: (result: AssessmentResultType | null) => void;
}

// Add handler
function handleUpdateAssessmentResult(result: AssessmentResultType | null) {
	onUpdateAssessmentResult(result);
}
```

### 3. **Page-Level Handler**

**src/routes/(app)/work/assessments/[appointment_id]/+page.svelte**:
```typescript
async function handleUpdateAssessmentResult(result: AssessmentResultType | null) {
	try {
		if (data.estimate) {
			await estimateService.update(data.estimate.id, {
				assessment_result: result
			});
			await invalidateAll();
		}
	} catch (error) {
		console.error('Error updating assessment result:', error);
	}
}
```

### 4. **Service Layer**

**src/lib/services/estimate.service.ts** - Update `update()` method:
```typescript
async update(id: string, input: UpdateEstimateInput): Promise<Estimate> {
	// ... existing code ...
	
	const updateData: any = {
		// ... existing fields ...
		assessment_result: input.assessment_result !== undefined ? input.assessment_result : undefined
	};
	
	// ... rest of update logic ...
}
```

---

## 🎨 Visual Design Specifications

### Color Coding
| Result | Color | Hex | Tailwind Class | Icon |
|--------|-------|-----|----------------|------|
| **Repair** | Green | #10B981 | `bg-green-50 border-green-200 text-green-700` | CheckCircle |
| **Code 2** | Yellow | #F59E0B | `bg-yellow-50 border-yellow-200 text-yellow-700` | AlertCircle |
| **Code 3** | Orange | #F97316 | `bg-orange-50 border-orange-200 text-orange-700` | XCircle |
| **Total Loss** | Red | #EF4444 | `bg-red-50 border-red-200 text-red-700` | Ban |

### Radio Button States
- **Unselected**: White background, gray border
- **Selected**: Colored background (light), colored border (medium), colored text
- **Hover**: Slight shadow, border color intensifies
- **Disabled**: Gray background, cursor not-allowed

---

## 📊 Summary Component Integration

### Update `src/lib/components/shared/SummaryComponent.svelte`

Add assessment result display after estimate totals:

```svelte
<!-- After Repair Estimate section -->
{#if estimate && estimate.assessment_result}
	{@const resultInfo = getAssessmentResultInfo(estimate.assessment_result)}
	<Card class="p-4 {resultInfo.bgClass} border-2 {resultInfo.borderClass}">
		<div class="flex items-center gap-3">
			<resultInfo.icon class="h-6 w-6 {resultInfo.textClass}" />
			<div>
				<h3 class="text-sm font-semibold {resultInfo.textClass}">
					Assessment Result: {resultInfo.label}
				</h3>
				<p class="text-xs {resultInfo.textClass} opacity-80">
					{resultInfo.description}
				</p>
			</div>
		</div>
	</Card>
{/if}
```

---

## 🔧 Helper Functions

### Create `src/lib/utils/assessmentResults.ts`

```typescript
import { CheckCircle, AlertCircle, XCircle, Ban } from 'lucide-svelte';
import type { AssessmentResultType, AssessmentResultInfo } from '$lib/types/assessment';

export const ASSESSMENT_RESULTS: Record<AssessmentResultType, AssessmentResultInfo> = {
	repair: {
		value: 'repair',
		label: 'Repair',
		description: 'Vehicle can be economically repaired',
		color: 'green',
		icon: 'check'
	},
	code_2: {
		value: 'code_2',
		label: 'Code 2',
		description: 'Repairable write-off (salvage title)',
		color: 'yellow',
		icon: 'alert'
	},
	code_3: {
		value: 'code_3',
		label: 'Code 3',
		description: 'Non-repairable write-off (scrap)',
		color: 'orange',
		icon: 'x'
	},
	total_loss: {
		value: 'total_loss',
		label: 'Total Loss',
		description: 'Complete loss of vehicle',
		color: 'red',
		icon: 'ban'
	}
};

export function getAssessmentResultInfo(result: AssessmentResultType): AssessmentResultInfo {
	return ASSESSMENT_RESULTS[result];
}

export function getAssessmentResultColorClasses(color: 'green' | 'yellow' | 'orange' | 'red') {
	const classes = {
		green: {
			bg: 'bg-green-50',
			border: 'border-green-200',
			text: 'text-green-700',
			hover: 'hover:bg-green-100'
		},
		yellow: {
			bg: 'bg-yellow-50',
			border: 'border-yellow-200',
			text: 'text-yellow-700',
			hover: 'hover:bg-yellow-100'
		},
		orange: {
			bg: 'bg-orange-50',
			border: 'border-orange-200',
			text: 'text-orange-700',
			hover: 'hover:bg-orange-100'
		},
		red: {
			bg: 'bg-red-50',
			border: 'border-red-200',
			text: 'text-red-700',
			hover: 'hover:bg-red-100'
		}
	};
	return classes[color];
}
```

---

## 📝 Implementation Checklist

### Phase 1: Database & Types
- [ ] Create migration `032_add_assessment_result_to_estimates.sql`
- [ ] Apply migration to database
- [ ] Add `AssessmentResultType` type to `assessment.ts`
- [ ] Add `AssessmentResultInfo` interface to `assessment.ts`
- [ ] Update `Estimate` interface with `assessment_result` field
- [ ] Update `CreateEstimateInput` and `UpdateEstimateInput`

### Phase 2: Helper Functions
- [ ] Create `src/lib/utils/assessmentResults.ts`
- [ ] Implement `ASSESSMENT_RESULTS` constant
- [ ] Implement `getAssessmentResultInfo()` function
- [ ] Implement `getAssessmentResultColorClasses()` function

### Phase 3: UI Component
- [ ] Create `AssessmentResultSelector.svelte` component
- [ ] Implement radio button group with 4 options
- [ ] Add color coding and icons
- [ ] Add "Clear Selection" button
- [ ] Make responsive (2x2 grid on desktop, stacked on mobile)

### Phase 4: Integration
- [ ] Update `estimate.service.ts` to handle `assessment_result`
- [ ] Add `onUpdateAssessmentResult` prop to `EstimateTab`
- [ ] Add `AssessmentResultSelector` to `EstimateTab` (after totals)
- [ ] Add `handleUpdateAssessmentResult` to assessment page
- [ ] Pass handler to `EstimateTab`

### Phase 5: Summary Display
- [ ] Update `SummaryComponent.svelte` to show assessment result
- [ ] Add color-coded card with icon and description
- [ ] Position after estimate totals

### Phase 6: Documentation & Testing
- [ ] Create `ASSESSMENT_RESULT_IMPLEMENTATION.md`
- [ ] Test selecting each result type
- [ ] Test clearing selection
- [ ] Test saving and reloading
- [ ] Test display in summary component
- [ ] Verify audit logging

---

## 🚀 Future Enhancements

1. **Automatic Suggestion**: Based on estimate total vs vehicle value, suggest appropriate result
2. **Validation Rules**: Warn if result doesn't match estimate threshold (e.g., Total Loss but estimate is low)
3. **Reporting**: Filter assessments by result type in reports
4. **Workflow Integration**: Require result selection before completing assessment
5. **Email Notifications**: Include result in assessment completion emails
6. **Dashboard Stats**: Show breakdown of results (X% Repair, Y% Code 2, etc.)

---

**Status**: Planning Complete - Ready for Implementation  
**Estimated Time**: 2-3 hours  
**Priority**: High  
**Dependencies**: None (standalone feature)

