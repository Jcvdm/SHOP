# Vehicle & Request Information Panel - Code Reference

**Purpose**: Complete code reference for the panel  
**Status**: 📖 Reference document  

---

## 1️⃣ Panel Display Code

**File**: `src/lib/components/assessment/VehicleValuesTab.svelte`  
**Lines**: 342-389  

### Complete Panel Code
```typescript
<!-- Section 1: Vehicle & Source Information -->
{#if requestInfo}
  <Card class="bg-blue-50 p-6">
    <h3 class="mb-4 text-lg font-semibold text-gray-900">Vehicle & Request Information</h3>
    <div class="grid gap-4 md:grid-cols-3">
      <div>
        <p class="text-sm text-gray-600">Report No.</p>
        <p class="font-medium text-gray-900">{requestInfo.request_number || 'N/A'}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600">Insurer</p>
        <p class="font-medium text-gray-900">{client?.name || 'N/A'}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600">Date of Loss</p>
        <p class="font-medium text-gray-900">
          {requestInfo.date_of_loss
            ? new Date(requestInfo.date_of_loss).toLocaleDateString()
            : 'N/A'}
        </p>
      </div>
    </div>
    <div class="mt-4 grid gap-4 md:grid-cols-4">
      <div>
        <p class="text-sm text-gray-600">Make</p>
        <p class="font-medium text-gray-900">{requestInfo.vehicle_make || 'N/A'}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600">Model</p>
        <p class="font-medium text-gray-900">{requestInfo.vehicle_model || 'N/A'}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600">Year</p>
        <p class="font-medium text-gray-900">{requestInfo.vehicle_year || 'N/A'}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600">Mileage</p>
        <p class="font-medium text-gray-900">
          {requestInfo.vehicle_mileage
            ? requestInfo.vehicle_mileage.toLocaleString() + ' km'
            : 'N/A'}
        </p>
      </div>
    </div>
    <div class="mt-4">
      <p class="text-sm text-gray-600">VIN</p>
      <p class="font-medium text-gray-900">{requestInfo.vehicle_vin || 'N/A'}</p>
    </div>
  </Card>
{/if}
```

### Key Features
- ✅ Conditional rendering (`{#if requestInfo}`)
- ✅ Blue card styling (`bg-blue-50`)
- ✅ Responsive grid (3 cols, then 4 cols)
- ✅ Date formatting (`toLocaleDateString()`)
- ✅ Number formatting (`toLocaleString()`)
- ✅ Fallback values (`|| 'N/A'`)

---

## 2️⃣ Props Interface

**File**: `src/lib/components/assessment/VehicleValuesTab.svelte`  
**Lines**: 25-40  

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

### Props Breakdown
| Prop | Type | Purpose |
|------|------|---------|
| `data` | VehicleValues | Vehicle values record |
| `assessmentId` | string | Assessment ID |
| `client` | Client | Client info (for insurer name) |
| `requestInfo` | object | Vehicle & request data |
| `onUpdate` | function | Save handler |

### RequestInfo Fields
| Field | Type | Currently Used |
|-------|------|-----------------|
| `request_number` | string | ✅ Yes (Report No.) |
| `claim_number` | string | ❌ No |
| `date_of_loss` | string | ✅ Yes (Date of Loss) |
| `vehicle_make` | string | ✅ Yes (Make) |
| `vehicle_model` | string | ✅ Yes (Model) |
| `vehicle_year` | number | ✅ Yes (Year) |
| `vehicle_vin` | string | ✅ Yes (VIN) |
| `vehicle_mileage` | number | ✅ Yes (Mileage) |

---

## 3️⃣ Data Passing

**File**: `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte`  
**Lines**: 798-814  

```typescript
{:else if currentTab === 'values'}
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

### Data Sources
- `data.vehicleValues` - From server load
- `data.assessment.id` - From server load
- `data.client` - From server load
- `data.request` - From server load

---

## 4️⃣ Data Loading

**File**: `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts`  
**Lines**: 98-130  

```typescript
const [
  vehicleIdentification,
  exterior360,
  accessories,
  interiorMechanical,
  tyres,
  damageRecord,
  vehicleValues,
  preIncidentEstimate,
  estimate,
  notes,
  inspection,
  request,
  repairers,
  companySettings,
  engineer
] = await Promise.all([
  vehicleIdentificationService.getByAssessment(assessment.id, locals.supabase),
  exterior360Service.getByAssessment(assessment.id, locals.supabase),
  accessoriesService.listByAssessment(assessment.id, locals.supabase),
  interiorMechanicalService.getByAssessment(assessment.id, locals.supabase),
  tyresService.listByAssessment(assessment.id, locals.supabase),
  damageService.getByAssessment(assessment.id, locals.supabase),
  vehicleValuesService.getByAssessment(assessment.id, locals.supabase),
  preIncidentEstimateService.getByAssessment(assessment.id, locals.supabase),
  estimateService.getByAssessment(assessment.id, locals.supabase),
  assessmentNotesService.getNotesByAssessment(assessment.id, locals.supabase),
  inspectionService.getInspection(appointment.inspection_id, locals.supabase),
  requestService.getRequest(appointment.request_id, locals.supabase),
  repairerService.listRepairers(true, locals.supabase),
  companySettingsService.getSettings(locals.supabase),
  appointment.engineer_id ? engineerService.getEngineer(appointment.engineer_id, locals.supabase) : null
]);
```

### Key Data Loaded
- ✅ `request` - Contains all vehicle & request info
- ✅ `vehicleValues` - Assessment vehicle values
- ✅ `inspection` - Inspection details
- ✅ `engineer` - Engineer assignment

---

## 5️⃣ Request Type Definition

**File**: `src/lib/types/request.ts`  

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

## 6️⃣ Client Type Definition

**File**: `src/lib/types/client.ts`  

```typescript
export interface Client {
  id: string;
  name: string;
  type: ClientType;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  notes?: string | null;

  // Write-off percentages for vehicle valuation
  borderline_writeoff_percentage: number;
  total_writeoff_percentage: number;
  salvage_percentage: number;

  // Terms & Conditions fields
  assessment_terms_and_conditions?: string | null;
  estimate_terms_and_conditions?: string | null;
  frc_terms_and_conditions?: string | null;

  created_at: string;
  updated_at: string;
  is_active: boolean;
}
```

---

## 📊 Data Flow Diagram

```
Page Server Load (+page.server.ts)
    ↓
requestService.getRequest()
    ↓
Request object with all fields
    ↓
Page Component (+page.svelte)
    ↓
Extract requestInfo fields
    ↓
Pass to VehicleValuesTab
    ↓
Component Display (VehicleValuesTab.svelte)
    ↓
Render in blue card
```

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `VehicleValuesTab.svelte` | Panel display |
| `+page.svelte` | Data passing |
| `+page.server.ts` | Data loading |
| `request.ts` | Type definitions |
| `client.ts` | Client type |

---

*Code reference complete.*

