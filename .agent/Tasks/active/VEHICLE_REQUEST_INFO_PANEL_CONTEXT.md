# Vehicle & Request Information Panel - Context Gathering

**Date**: January 2025  
**Status**: 📋 Context gathering complete  
**Purpose**: Understand current vehicle/request info panel and identify enhancement opportunities  

---

## 📍 Current Location

**File**: `src/lib/components/assessment/VehicleValuesTab.svelte`  
**Lines**: 342-389  
**Component**: Vehicle & Request Information Card  

---

## 🎨 Current Display

### Panel Structure
```
┌─────────────────────────────────────────────────────────┐
│ Vehicle & Request Information (Blue Card - bg-blue-50)  │
├─────────────────────────────────────────────────────────┤
│ Row 1 (3 columns):                                      │
│  • Report No.        • Insurer           • Date of Loss │
│                                                         │
│ Row 2 (4 columns):                                      │
│  • Make              • Model             • Year         │
│  • Mileage                                              │
│                                                         │
│ Row 3 (1 column):                                       │
│  • VIN                                                  │
└─────────────────────────────────────────────────────────┘
```

### Current Fields Displayed

#### Row 1 (3 columns - md:grid-cols-3)
1. **Report No.** - `requestInfo.request_number`
2. **Insurer** - `client?.name`
3. **Date of Loss** - `requestInfo.date_of_loss` (formatted as locale date)

#### Row 2 (4 columns - md:grid-cols-4)
1. **Make** - `requestInfo.vehicle_make`
2. **Model** - `requestInfo.vehicle_model`
3. **Year** - `requestInfo.vehicle_year`
4. **Mileage** - `requestInfo.vehicle_mileage` (formatted with comma separator + " km")

#### Row 3 (1 column)
1. **VIN** - `requestInfo.vehicle_vin`

---

## 📊 Data Source

### Props Interface
**File**: `src/lib/components/assessment/VehicleValuesTab.svelte` (lines 25-40)

```typescript
interface Props {
  data: VehicleValues | null;
  assessmentId: string;
  client: Client | null;
  requestInfo?: {
    request_number?: string;
    claim_number?: string | null;
    date_of_loss?: string | null;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    vehicle_year?: number | null;
    vehicle_vin?: string | null;
    vehicle_mileage?: number | null;
  };
  onUpdate: (data: Partial<VehicleValues>) => void;
}
```

### Data Flow

**Step 1: Page Server Load**  
**File**: `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts` (lines 98-130)

```typescript
const [
  // ... other data
  request,
  // ... other data
] = await Promise.all([
  // ... other services
  requestService.getRequest(appointment.request_id, locals.supabase),
  // ... other services
]);
```

**Step 2: Page Component**  
**File**: `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte` (lines 798-814)

```typescript
<VehicleValuesTab
  data={data.vehicleValues}
  assessmentId={data.assessment.id}
  client={data.client}
  requestInfo={{
    request_number: data.request?.request_number,
    claim_number: data.request?.claim_number,
    date_of_loss: data.request?.date_of_loss,
    vehicle_make: data.request?.vehicle_make,
    vehicle_model: data.request?.vehicle_model,
    vehicle_year: data.request?.vehicle_year,
    vehicle_vin: data.request?.vehicle_vin,
    vehicle_mileage: data.request?.vehicle_mileage
  }}
  onUpdate={handleUpdateVehicleValues}
/>
```

**Step 3: Component Display**  
**File**: `src/lib/components/assessment/VehicleValuesTab.svelte` (lines 342-389)

Component receives `requestInfo` prop and displays in read-only card.

---

## 📋 Request Type Definition

**File**: `src/lib/types/request.ts` (lines 7-51)

```typescript
export interface Request {
  id: string;
  request_number: string;
  client_id: string;
  type: RequestType;
  claim_number?: string | null;
  status: RequestStatus;
  description?: string | null;

  // Incident Details
  date_of_loss?: string | null;
  insured_value?: number | null;
  incident_type?: string | null;
  incident_description?: string | null;
  incident_location?: string | null;

  // Vehicle Information
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  vehicle_vin?: string | null;
  vehicle_registration?: string | null;
  vehicle_color?: string | null;
  vehicle_mileage?: number | null;
  vehicle_province?: Province | null;

  // Owner Details
  owner_name?: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
  owner_address?: string | null;

  // Third Party Details
  third_party_name?: string | null;
  third_party_phone?: string | null;
  third_party_email?: string | null;
  third_party_insurance?: string | null;

  // Workflow
  current_step: RequestStep;
  assigned_engineer_id?: string | null;

  created_at: string;
  updated_at: string;
}
```

---

## 🔍 Available Data NOT Currently Displayed

### From Request Object
- ✅ `claim_number` - Available in requestInfo but NOT displayed
- ❌ `vehicle_registration` - NOT passed to component
- ❌ `vehicle_color` - NOT passed to component
- ❌ `vehicle_province` - NOT passed to component
- ❌ `insured_value` - NOT passed to component
- ❌ `incident_type` - NOT passed to component
- ❌ `incident_location` - NOT passed to component
- ❌ `owner_name` - NOT passed to component
- ❌ `owner_phone` - NOT passed to component

### From Client Object
- ✅ `client?.name` - Displayed as "Insurer"
- ❌ `client?.contact_name` - NOT displayed
- ❌ `client?.phone` - NOT displayed
- ❌ `client?.email` - NOT displayed

---

## 🎯 Current Limitations

### 1. Limited Information Display
- Only 8 fields displayed out of 20+ available
- Claim number available but not shown
- Vehicle registration not shown
- Vehicle color not shown

### 2. No Assessment Data Integration
- Panel shows only request data
- Assessment-specific data not displayed
- Vehicle identification data not shown
- Assessment notes not shown

### 3. No Dynamic Updates
- Panel is read-only
- No way to update vehicle info from assessment
- No link to edit request data

### 4. Missing Context
- No indication of assessment status
- No engineer assignment info
- No appointment details
- No inspection info

---

## 💡 Enhancement Opportunities

### Option 1: Add More Request Fields
- Add claim number
- Add vehicle registration
- Add vehicle color
- Add insured value

### Option 2: Integrate Assessment Data
- Show assessment vehicle identification data
- Show assessment status
- Show engineer assignment
- Show appointment details

### Option 3: Add Assessment Context
- Show assessment stage
- Show inspection status
- Show appointment date/time
- Show engineer name

### Option 4: Make Panel Interactive
- Add edit capability
- Link to request edit page
- Show update history
- Add quick actions

---

## 📝 Code Locations

| Item | File | Lines |
|------|------|-------|
| **Panel Display** | VehicleValuesTab.svelte | 342-389 |
| **Props Interface** | VehicleValuesTab.svelte | 25-40 |
| **Data Passing** | +page.svelte | 798-814 |
| **Data Loading** | +page.server.ts | 98-130 |
| **Request Type** | src/lib/types/request.ts | 7-51 |

---

## 🔗 Related Components

- **VehicleIdentificationTab** - Shows assessment vehicle data
- **RequestDetailPage** - Shows full request info
- **AssessmentLayout** - Parent component managing tabs

---

## ✅ Summary

### Current State
- ✅ Panel displays 8 key fields
- ✅ Read-only display
- ✅ Blue card styling (bg-blue-50)
- ✅ Responsive grid layout
- ✅ Proper data formatting

### Available Data
- ✅ 20+ fields available from request
- ✅ Client information available
- ✅ Assessment data available
- ✅ Appointment data available

### Enhancement Potential
- 💡 Add more request fields
- 💡 Integrate assessment data
- 💡 Add assessment context
- 💡 Make interactive

---

*Context gathering complete. Ready for enhancement planning.*

