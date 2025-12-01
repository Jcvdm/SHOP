# Bugs and Concerns Log

**Created**: 2025-11-28
**Purpose**: Track bugs, issues, and concerns discovered during app review

---

## How to Use This File

Log issues as you find them with the following format:

```markdown
### [Issue Title]
**Date**: YYYY-MM-DD
**Severity**: Critical / High / Medium / Low
**Location**: [File path or feature area]
**Status**: Open / In Progress / Resolved

**Description**:
[What's wrong]

**Steps to Reproduce** (if applicable):
1. Step 1
2. Step 2

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Notes**:
[Any additional context]
```

---

## Active Issues

<!-- Add issues below this line -->

*(No active issues)*

---

## Resolved Issues

### B003: Assessment Tab Validation Badge Persistence
**Date**: 2025-11-28
**Severity**: Medium
**Location**: Assessment tabs (8 components), AssessmentLayout.svelte
**Status**: Resolved (2025-11-28)

**Description**:
Error badges on assessment tabs showed "missing required fields" even after filling in the required data. The badges only updated after saving and navigating away.

**Root Cause**:
Two-validation architecture mismatch - AssessmentLayout validates against **prop data** (stale until DB save), while child tabs validate against **local state** (current). This caused a delay where badges showed errors even after fields were filled.

**Resolution**:
- Implemented callback-based validation reporting pattern
- Child tabs report validation state to parent via `onValidationUpdate` callback using `$effect`
- Parent stores child validations and prefers them over prop-based validations
- Updated all 8 assessment tabs:
  - VehicleIdentificationTab
  - VehicleValuesTab
  - Exterior360Tab
  - InteriorMechanicalTab
  - TyresTab
  - DamageTab
  - PreIncidentEstimateTab
  - EstimateTab
- Modified AssessmentLayout.svelte to accept and use child validations
- Wired up callbacks in +page.svelte

**Technical Details**:
- New `TabValidation` type with `tabId`, `isComplete`, and `missingFields` properties
- Child tabs use `$effect()` to report validation changes immediately
- Parent's `tabValidations` $derived prefers `childValidations` over prop-based calculations

---

### B002: Upload Component Drag-and-Drop Flickering
**Date**: 2025-11-28
**Severity**: Medium
**Location**: 10 upload components across assessment tabs
**Status**: Resolved (2025-11-28)

**Description**:
When dragging files over upload components on assessment tabs, the drop zone would flicker rapidly as the cursor moved over child elements (buttons, text, icons) inside the container.

**Root Cause**:
The `handleDragLeave` function fired when cursor left ANY element within the container, including child elements. It immediately set `isDragging = false` without checking if the cursor was still inside the container boundary.

**Resolution**:
- Created `src/lib/utils/drag-helpers.ts` utility with `shouldResetDragState()` function
- Function uses `getBoundingClientRect()` to check if cursor is actually outside container boundary
- Updated 10 components to use boundary detection:
  - PhotoUpload.svelte
  - PhotoUploadV2.svelte
  - PdfUpload.svelte
  - EstimatePhotosPanel.svelte
  - Exterior360PhotosPanel.svelte
  - InteriorPhotosPanel.svelte
  - AdditionalsPhotosPanel.svelte
  - TyrePhotosPanel.svelte
  - PreIncidentPhotosPanel.svelte
  - FileDropzone.svelte

**Technical Details**:
```typescript
export function shouldResetDragState(event: DragEvent): boolean {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    return (
        event.clientX <= rect.left ||
        event.clientX >= rect.right ||
        event.clientY <= rect.top ||
        event.clientY >= rect.bottom
    );
}
```



---

## Resolved Issues

<!-- Move resolved issues here with resolution notes -->

### C001: Update Vehicle Location Capturing
**Date**: 2025-11-28
**Severity**: Medium
**Location**: Request page, Appointment page
**Status**: Resolved (2025-11-28)

**Description**:
Vehicle location capturing needed to be updated on the request page and appointment page.

**Resolution**:
- Created AddressInput.svelte component with Google Places autocomplete (SA-only)
- Created AddressDisplay.svelte for consistent address rendering
- Created database migrations for structured address fields
- Pushed migrations and regenerated TypeScript types
- Integrated AddressInput into:
  - Request create page (new request)
  - Request edit page
  - Appointments list page (schedule modal)
  - Appointment detail page (reschedule modal)
- Added Google Places API key to environment

**Technical Details**:
- Uses Google Places API for autocomplete with fallback to manual entry
- Stores structured fields: street_address, suburb, city, province, postal_code, lat/lng, place_id
- Maintains backward compatibility with legacy text fields (incident_location, owner_address, location_address)
- Helper functions in request.ts convert between flat DB columns and StructuredAddress type

---

### B001: excess_amount TypeScript Errors (Pre-existing)
**Date**: 2025-11-28
**Severity**: Medium
**Location**: Multiple files
**Status**: Resolved (2025-11-28)

**Description**:
The `excess_amount` field was added via migration but TypeScript types weren't regenerated, causing build errors.

**Resolution**:
- Pushed migration to Supabase
- Regenerated TypeScript types
- Added type assertion in generate-frc-report/+server.ts for the query result

