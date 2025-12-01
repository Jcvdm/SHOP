# Changelog - Recent Updates

**Last Updated**: November 29, 2025 (Damage Inspection Report Enhancements | Accessories Report Integration | Vehicle Accessories Integration - Single Value System | B004: Repairer Selection Dropdown Reset Fix | B002/B003: Drag-Drop and Tab Badge Fixes)


---

## November 29, 2025 (Session 5)

### ✅ Logo UI Enhancements - Size Increase & Modern Animations
- **LOGO SIZE INCREASE**: Enlarged sidebar logo from 48px to 80px for improved visibility
  - File: `src/lib/components/layout/Sidebar.svelte` (line 315)
  - Changed `h-12` to `h-20` (48px → 80px)
  - Collapsed size: `h-8` to `h-10` (32px → 40px)
- **LOGO ANIMATION ENHANCEMENT**: Added modern hover effects with professional animations
  - Effects: `hover:scale-105` (scale on hover), `hover:brightness-110` (brightness boost), `cursor-pointer`
  - Collapse animation: Smooth transition with `opacity-90` when minimized
  - Matches app's 200ms/ease-linear animation pattern
  - Professional, subtle feedback without being intrusive
- **BENEFITS**:
  - Better brand visibility in expanded sidebar state
  - Improved visual feedback on user interaction
  - Consistent with app's animation design system
  - Professional presentation of company branding
- **VERIFICATION**: ✅ Sidebar logo displays correctly, animations smooth and responsive

---

## November 29, 2025 (Session 4)

### ✅ Audit Trail User Context - Auto-Capture from Auth
- **FEATURE**: Audit logs now capture actual user email/ID instead of defaulting to 'System'
- **IMPLEMENTATION**:
  - Updated `audit.service.ts` `logChange()` to extract user from Supabase auth context
  - Falls back to global browser client when no client parameter passed
  - Priority: explicit `changed_by` → user email → user ID → 'System'
- **COVERAGE**: Works for ALL 18 services automatically without individual refactoring needed
- **DEMONSTRATION**: Refactored `accessories.service.ts` to follow ServiceClient pattern
  - Added `client?: ServiceClient` parameter to all methods
  - Shows proper pattern for other services to follow
  - Not blocking - audit user context works with or without refactoring
- **BENEFITS**:
  - Complete user attribution in audit trail
  - Automatic without service-level changes
  - Backward compatible (still accepts explicit `changed_by`)
  - Non-blocking (audit failures don't interrupt main operations)
- **FILES MODIFIED**:
  - `src/lib/services/audit.service.ts` - Extract user from auth context
  - `src/lib/services/accessories.service.ts` - Refactored to ServiceClient pattern (demonstration)
- **VERIFICATION**: ✅ npm run check passes with 0 errors

---

## November 29, 2025 (Session 3)

### ✅ Additionals Letter - Notes Section Added
- **FEATURE**: Added "ADDITIONALS NOTES" section to additionals letter PDF
- **DATA SOURCE**: Fetches notes from `assessment_notes` table filtered by `source_tab === 'additionals'`
- **DISPLAY LOGIC**: Only shows section if additionals-specific notes exist
- **FORMATTING**: Note title (if present) displayed in bold, followed by note text
- **FILES MODIFIED**:
  - `src/routes/api/generate-additionals-letter/+server.ts` - Added notes fetch and filter logic
  - `src/lib/templates/additionals-letter-template.ts` - Added notes section before Terms & Conditions
- **BENEFITS**:
  - Additionals-specific notes now appear in additionals letter PDF
  - Matches pattern from assessment reports
  - Improves documentation completeness
- **VERIFICATION**: ✅ Additionals letter generates with notes section when applicable

---

## November 29, 2025 (Session 2)

### ✅ PDF Generation Enhancements: Damage Report, Estimate, Photos & Metadata Fixes - COMPLETE

#### 1. Damage Inspection Report - Insured Information & Assessor Details
- **FEATURE**: Added complete insured details section to Damage Inspection Report PDF
- **SECTIONS ADDED**:
  - "INSURED REPORT INFORMATION" (new section after CLAIM INFORMATION)
    - Insured Name, Contact Number, Email, Address
    - Date of Loss, Incident Type
    - Incident Description (displayed in notes box if present)
  - Enhanced "REPORT INFORMATION" section with assessor details
    - Assessor Name, Company, Phone, Email
- **DATA FIXES**:
  - Fixed silent query failure using `users!inner` join → now queries engineers table directly
  - Proper engineer data retrieval with company_name, phone, email fields
- **FILES MODIFIED**:
  - `src/routes/api/generate-report/+server.ts` (lines 191-196) - Fixed engineer query
  - `src/lib/templates/report-template.ts` (lines 444-461) - Added INSURED REPORT INFORMATION section
  - `src/lib/templates/report-template.ts` (lines 428-431) - Enhanced REPORT INFORMATION with assessor details
- **BENEFITS**:
  - Professional report format with complete insured details
  - Full assessor transparency with contact information
  - Better data accuracy (fixed silent join failure)
- **VERIFICATION**: ✅ Report generates with all insured and assessor information

#### 2. Estimate PDF - Assessor Details & Submission Instructions
- **FEATURES ADDED**:
  - New assessor info section below totals table
  - Document submission instructions with email addresses
  - Bold additionals disclaimer about approval requirement
- **CONTENT**:
  - Assessor Name, Company, Phone, Email (same pattern as Report)
  - Email submission addresses: `add@claimtech.co.za` (additionals), `frc@claimtech.co.za` (FRC)
  - Bold disclaimer: "All additionals require approval before commencing work"
- **FILES MODIFIED**:
  - `src/lib/templates/estimate-template.ts` - Added assessor section and instructions
- **BENEFITS**:
  - Complete professional presentation with assessor contact
  - Clear submission workflow for additionals/FRC
  - Prominent warning prevents unauthorized work
- **VERIFICATION**: ✅ Estimate PDF displays assessor info and instructions

#### 3. Additionals Letter - Assessor Details Fix
- **ISSUE**: Additionals Letter was showing "N/A" for assessor details
- **ROOT CAUSE**: Same silent join failure as Report (using non-existent `users!inner` relationship)
- **SOLUTION**: Updated to fetch from engineers table directly
- **FILES MODIFIED**:
  - `src/routes/api/generate-estimate/+server.ts` - Fixed engineer query
  - `src/lib/templates/additionals-letter-template.ts` - Now displays: Assessor, Company, Phone, Email
- **VERIFICATION**: ✅ Assessor details display correctly in Additionals Letter

#### 4. Photo PDF/ZIP - Comprehensive Missing Photos Added
- **NEW VEHICLE ID PHOTOS**:
  - Engine Number
  - License Disc
  - Driver License
- **NEW INTERIOR/MECHANICAL PHOTOS**:
  - Mileage Display
  - Battery Status
  - Oil Level Indicator
  - Coolant Level Indicator
- **NEW ACCESSORY SECTIONS**:
  - Folder 07: Additionals Photos (new category)
  - Folder 08: Accessories Photos (new category)
- **IMPACT**: Complete photo capture covering all vehicle assessment categories
- **FILES MODIFIED**:
  - `src/routes/api/generate-photos-pdf/+server.ts` - Added new vehicle ID sections
  - `src/lib/templates/photos-template.ts` - Added Interior/Mechanical section photos
  - `src/routes/api/generate-photos-zip/+server.ts` - Added folders 07 and 08
- **BENEFITS**:
  - Comprehensive photo checklist for assessments
  - Better documentation of vehicle condition
  - Organized categories for additionals and accessories
- **VERIFICATION**: ✅ Photo PDF/ZIP generate with all sections

#### 5. Tyre Position Order Standardization
- **CHANGE**: Reordered tyre positions to match vehicle assessment flow
- **OLD ORDER**: Left Front, Right Front, Left Rear, Right Rear, Spare
- **NEW ORDER**: Right Front → Right Rear → Left Rear → Left Front → Spare
- **LABEL CHANGES**: Updated to "Right Front" style (was using compass directions)
- **FILES MODIFIED**:
  - `src/routes/api/generate-photos-pdf/+server.ts` - Updated tyre order in photo PDF
  - `src/lib/templates/photos-template.ts` - Updated tyre positions in template
  - `src/routes/api/generate-photos-zip/+server.ts` - Updated folder naming order
- **BENEFITS**:
  - Consistent with vehicle assessment workflow
  - More intuitive naming convention
  - Better user mental model (right side → left side)
- **VERIFICATION**: ✅ Tyre positions follow new order in all photo outputs

---

## November 29, 2025 (Session 1)

### ✅ Damage Inspection Report Enhancements - COMPLETE

#### 1. Insured Report Information Section (NEW)
- **FEATURE**: Added new "INSURED REPORT INFORMATION" section after CLAIM INFORMATION
- **CONTENT**: Displays insured details with conditional incident description in notes
  - Insured Name
  - Contact Number
  - Email Address
  - Address
  - Date of Loss
  - Incident Type
  - Incident Description (if present, displayed in notes box)
- **DATA SOURCE**: Existing `insuredDetails` object (already fetched, now displayed)
- **FILE MODIFIED**:
  - `src/lib/templates/report-template.ts` (lines 444-461) - Added INSURED REPORT INFORMATION section
- **BENEFITS**:
  - Professional report format matches industry standards
  - Insured details clearly displayed for claim assessment
  - Flexible incident description display
- **VERIFICATION**: ✅ Section renders correctly with all insured information

#### 2. Assessor/Engineer Information Enhancement
- **ISSUE**: Report was missing full assessor details (company, phone, email)
- **ROOT CAUSE**: Query was using `users!inner` join which failed silently; assessor data not populated
- **SOLUTION**:
  - Fixed query to access engineers table directly instead of nested users join
  - Enhanced REPORT INFORMATION section with full assessor details
- **FILES MODIFIED**:
  - `src/routes/api/generate-report/+server.ts` (lines 191-196) - Fixed engineer query
  - `src/lib/templates/report-template.ts` (lines 428-431) - Added fields to section
- **FIELDS NOW DISPLAYED**:
  - Assessor (engineer name)
  - Company (engineer company_name)
  - Phone (engineer phone)
  - Email (engineer email)
- **REPORT SECTION** (REPORT INFORMATION):
  ```
  | Field           | Value                          |
  |-----------------|--------------------------------|
  | Assessor        | John Smith                     |
  | Company         | ABC Assessors                  |
  | Phone           | +27 123 456 7890              |
  | Email           | john@abcassessors.co.za       |
  | Report Date     | 2025-11-29                    |
  | Report ID       | RPN-2025-001                  |
  ```
- **BENEFITS**:
  - Full transparency on assessment professional
  - Contact information readily available for follow-up
  - Professional report appearance
  - Bug fix eliminates silent failures in query
- **VERIFICATION**: ✅ Query returns engineer data correctly, section displays all fields

---

## November 29, 2025

### ✅ B011: Assessment Result Selection Not Saving in EstimateTab - COMPLETE
- **ISSUE**: Assessment result (repair/code_2/code_3) selection in EstimateTab was not saving immediately to database
  - User selected a value in the dropdown
  - Selection appeared to save locally
  - Database showed null/previous value when page reloaded
- **ROOT CAUSE**: `handleUpdateAssessmentResult()` called `markDirty()` but didn't trigger any save
  - `markDirty()` only marks the tab as modified, doesn't persist to database
  - Differs from other working tabs that persist select field changes immediately
- **SOLUTION**: Created dedicated `saveAssessmentResult()` function for silent saving
  - Does NOT set `saving = true` (avoids full overlay popup)
  - Saves only the `assessment_result` field directly via `onUpdateEstimate()`
  - Provides subtle/silent save like other field changes in the app
- **FILE MODIFIED**:
  - `src/lib/components/assessment/EstimateTab.svelte`:
    - Added `saveAssessmentResult()` function (lines 537-544) - dedicated silent save
    - Updated `handleUpdateAssessmentResult()` (lines 546-551) - calls silent save function
- **PATTERN ESTABLISHED**: Assessment Result Select Field Save Strategy
  - Select fields: `onchange` → handler updates local state → dedicated save function (no overlay)
  - Avoids blocking UI with full `saveAll()` overlay
  - Matches user expectation of subtle background saves for field changes
- **BENEFITS**:
  - Assessment result selections persist correctly
  - No blocking overlay popup on field change
  - Silent save matches other field change patterns in app
  - Works reliably even with rapid navigation
- **VERIFICATION**: ✅ Assessment result dropdown saves silently on value change, no overlay shown
- **RELATED**: B009 (Exterior360Tab select field fix), B010 (text field binding fix)

---

### ✅ Accessories Integration into Damage Inspection Report - COMPLETE
- **FEATURE**: Vehicle accessories now included in Damage Inspection Report PDF generation
  - Accessories appear in **both** a dedicated section AND integrated into Vehicle Values
  - Text/values only (no photos in report)
- **API CHANGES** (`src/routes/api/generate-report/+server.ts`):
  - Added `assessment_accessories` fetch to Promise.all (line 178-183)
  - Added filtering for empty accessories records (line 202-205)
  - Passes `accessories: filteredAccessories` to template (line 237)
- **TEMPLATE CHANGES** (`src/lib/templates/report-template.ts`):
  - Added imports for `VehicleAccessory` and `AccessoryType` types
  - Added `accessories: VehicleAccessory[]` to ReportData interface
  - Added `getAccessoryDisplayName()` helper function (maps accessory types to display names)
  - Added `accessoriesTotal` calculation at function start
  - **NEW SECTION**: "VEHICLE ACCESSORIES" table after Tyres section (lines 524-561)
    - Columns: Accessory, Condition, Value
    - Shows total accessories value at bottom
    - Includes notes section if any accessories have notes
  - **UPDATED SECTION**: "WARRANTY & VEHICLE VALUES" table (lines 614-633)
    - Added "Adjusted Value" row (base from DB)
    - Added "Accessories" row showing `+R{total}` (only if accessories exist)
    - Added "Pre-Incident Value" row (adjusted + accessories, highlighted green)
    - Borderline Write-off, Total Write-off, Salvage rows unchanged
- **REPORT LAYOUT** (when accessories exist):
  ```
  VEHICLE ACCESSORIES
  | Accessory              | Condition | Value    |
  |------------------------|-----------|----------|
  | Mags / Alloy Wheels    | Good      | R5,000   |
  | Tow Bar                | -         | R2,500   |
  | Total Accessories      |           | R7,500   |

  WARRANTY & VEHICLE VALUES
  | Value Type           | Trade     | Market    | Retail    |
  |---------------------|-----------|-----------|-----------|
  | Adjusted Value      | R100,000  | R95,000   | R110,000  |
  | Accessories         | +R7,500   | +R7,500   | +R7,500   |
  | Pre-Incident Value  | R107,500  | R102,500  | R117,500  |
  | Borderline Write-off| ...       | ...       | ...       |
  ```
- **FOLLOWS EXISTING PATTERNS**:
  - Same table styling as Tyres section
  - Same value calculation logic as VehicleValuesTab (`totalAdjusted + accessoriesTotal`)
  - Same `getAccessoryDisplayName()` utility pattern
- **FILES MODIFIED**:
  - `src/routes/api/generate-report/+server.ts` - Fetch + pass accessories
  - `src/lib/templates/report-template.ts` - New section + updated values table
- **VERIFICATION**: ✅ npm run check passes with 0 errors (12 pre-existing warnings)

---

### ✅ Vehicle Accessories Integration - Single Value System - COMPLETE
- **FEATURE**: Unified vehicle accessories with single value per accessory across tabs
  - Accessories added in Exterior360Tab automatically appear in VehicleValuesTab
  - Each accessory has a single value (not three separate trade/market/retail values)
  - Single value applies equally to Trade/Market/Retail totals
  - Values can be entered in either tab (Exterior360Tab or VehicleValuesTab)
  - Deleting accessory from Exterior360Tab cascades removal from VehicleValuesTab
- **DATABASE**:
  - Migration `20251129_add_value_to_accessories.sql` - Added `value` numeric column to `assessment_accessories` table
  - Column type: NUMERIC(12,2), NULL for optional values
- **TYPES** (`src/lib/types/assessment.ts`):
  - Added `value?: number | null` to `VehicleAccessory` interface
  - Added `value?: number | null` to `CreateAccessoryInput` interface
- **SERVICES** (`src/lib/services/accessories.service.ts`):
  - Added `updateValue(id: string, value: number | null)` method for inline value editing
- **UTILITY FUNCTIONS** (`src/lib/utils/vehicleValuesCalculations.ts`):
  - Added `calculateAccessoriesTotal(accessories: VehicleAccessory[]): number`
  - Added `getAccessoryDisplayName(accessoryType: AccessoryType, customName?: string | null): string`
- **COMPONENTS**:
  - `VehicleValueExtrasTable.svelte` - Complete rewrite to use accessories-based system
    - Changed from extras-based (JSONB with 3 values) to accessories-based (single value)
    - Props: `accessories: VehicleAccessory[]`, `onUpdateAccessoryValue: (id, value) => void`
    - Displays accessory name and single value column
    - Info tooltip: "Value applies equally to Trade, Market, and Retail"
  - `VehicleValuesTab.svelte` - Updated integration
    - Props: `accessories: VehicleAccessory[]`, `onUpdateAccessoryValue`
    - Removed old extras state management
    - Added `accessoriesTotal` derived value
    - Updated totals: `tradeTotalAdjusted = tradeAdjusted + accessoriesTotal` (same for market/retail)
  - `Exterior360Tab.svelte` - Updated with value input
    - Added value input in "Add Accessory" modal
    - Added inline value editing in accessory list
    - Fixed bug: Pass `value` in optimistic queue onCreate callback
- **CALCULATION FLOW**:
  - Base Values (Trade/Market/Retail)
    - ↓
  - Valuation Adjustment (fixed + %)
    - ↓
  - Condition Adjustment
    - ↓
  - Adjusted Values
    - ↓
  - Accessories Total (SUM of assessment_accessories.value, applied equally to all three types)
    - ↓
  - Total Adjusted Values (same accessories total added to Trade + Market + Retail)
    - ↓
  - Write-off percentages
- **BUG FIXED**:
  - Value not saved when adding accessory - Fixed by:
    1. Adding `value` field to `CreateAccessoryInput` type
    2. Passing `value: draft.value ?? undefined` in optimistic queue onCreate callback
- **BENEFITS**:
  - Unified accessories system across both tabs
  - Simpler data model (single value per accessory vs. three separate values)
  - Values consistent across Trade/Market/Retail calculations
  - Can edit accessories from either tab
  - Better UX with inline value editing
- **VERIFICATION**: ✅ Accessories integrate between tabs, values calculate correctly, database persists properly
- **FILES MODIFIED**:
  - `supabase/migrations/20251129_add_value_to_accessories.sql` (NEW)
  - `src/lib/types/assessment.ts` - VehicleAccessory + CreateAccessoryInput interfaces
  - `src/lib/services/accessories.service.ts` - Added updateValue method
  - `src/lib/utils/vehicleValuesCalculations.ts` - Added utility functions
  - `src/lib/components/assessment/VehicleValueExtrasTable.svelte` - Complete rewrite
  - `src/lib/components/assessment/VehicleValuesTab.svelte` - Added accessories props + totals
  - `src/lib/components/assessment/Exterior360Tab.svelte` - Added value input + editing

---

## November 28, 2025

### ✅ B002: Upload Component Drag-and-Drop Flickering Fix - COMPLETE
- **ISSUE**: Drag-and-drop flickering on mouse enter/leave in 10 upload components
  - Drag state was not properly cleared when cursor left container
  - `handleDragLeave` fired on child element transitions without boundary checking
  - Visual feedback flickered as drag state reset unexpectedly
- **ROOT CAUSE**: Missing boundary validation in drag-leave handlers
  - Event bubbling from child elements triggered parent's drag-leave
  - No check to confirm cursor was actually outside container bounds
- **SOLUTION**: Implemented `shouldResetDragState()` utility function with boundary validation
  - Created `src/lib/utils/drag-helpers.ts` with `shouldResetDragState()` helper
  - Utility checks if cursor position is actually outside container using `getBoundingClientRect()`
  - Returns true only if cursor is genuinely outside the container boundaries
- **COMPONENTS UPDATED** (10 total):
  - `src/lib/components/forms/PhotoUpload.svelte` - Added boundary check in `handleDragLeave`
  - `src/lib/components/forms/PhotoUploadV2.svelte` - Added boundary check in `handleDragLeave`
  - `src/lib/components/forms/PdfUpload.svelte` - Added boundary check in `handleDragLeave`
  - `src/lib/components/assessment/EstimatePhotosPanel.svelte` - Added boundary check
  - `src/lib/components/assessment/Exterior360PhotosPanel.svelte` - Added boundary check
  - `src/lib/components/assessment/InteriorPhotosPanel.svelte` - Added boundary check
  - `src/lib/components/assessment/AdditionalsPhotosPanel.svelte` - Added boundary check
  - `src/lib/components/assessment/TyrePhotosPanel.svelte` - Added boundary check
  - `src/lib/components/assessment/PreIncidentPhotosPanel.svelte` - Added boundary check
  - `src/lib/components/forms/FileDropzone.svelte` - Added boundary check
- **PATTERN**: Drag-helpers utility for consistent drag-drop boundary handling
  - Can be reused in other components needing robust drag-leave detection
  - Single source of truth for boundary validation logic
- **BENEFITS**:
  - Smooth, flicker-free drag-and-drop experience
  - Consistent behavior across all upload components
  - More responsive UI with proper visual feedback
  - Reusable utility for future drag-drop implementations
- **VERIFICATION**: ✅ All 10 components tested, smooth drag-drop behavior confirmed

### ✅ B003: Assessment Tab Validation Badge Persistence Fix - COMPLETE
- **ISSUE**: Tab validation badges not updating consistently with actual tab state
  - Validation badge showed red (invalid) even when tab was complete
  - Badge state didn't match actual validation of local state
  - Parent component validating stale prop values instead of current local state
- **ROOT CAUSE**: Validation state mismatch between parent and child components
  - Parent component validated props (captured at load time, stale)
  - Children component validate local reactive state (current, accurate)
  - Parent validation results didn't reflect actual child state
- **SOLUTION**: Implemented callback-based validation reporting pattern
  - Added `onValidationUpdate` callback parameter to assessment tabs
  - Tabs report validation status to parent immediately via callback
  - Parent prefers child-reported validations over prop-based validations
- **PATTERN IMPLEMENTATION**:
  - Added `onValidationUpdate` prop to each assessment tab component
  - Tabs call `onValidationUpdate(isValid)` in `$effect` when validation state changes
  - `AssessmentLayout.svelte` stores child validations and uses those for badge display
  - Parent tabs use child-reported state: `childValidations[tabName] ?? computeParentValidation(props)`
- **TABS UPDATED** (8 total):
  - `VehicleIdentificationTab.svelte` - Reports validation on state changes
  - `InteriorMechanicalTab.svelte` - Reports validation on state changes
  - `DamageTab.svelte` - Reports validation on state changes
  - `VehicleValuesTab.svelte` - Reports validation on state changes
  - `EstimateTab.svelte` - Reports validation on state changes
  - `PreIncidentEstimateTab.svelte` - Reports validation on state changes
  - `AdditionalsTab.svelte` - Reports validation on state changes
  - `FRCTab.svelte` - Reports validation on state changes
- **PARENT UPDATES**:
  - `AssessmentLayout.svelte` - Added `childValidations` state, updated badge logic
  - `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte` - Passes `onValidationUpdate` callbacks
- **AUDIT TRAIL**: All validation state changes still logged to audit table
- **BENEFITS**:
  - Badges always reflect current tab state
  - Instant visual feedback on validation changes
  - Cleaner parent-child communication pattern
  - More responsive UI experience
- **VERIFICATION**: ✅ All 8 tabs tested, badges update correctly with local state changes

### ✅ AddressInput Integration in Inspection Page - COMPLETE
- **INTEGRATION**: Updated Create Appointment modal in inspection page
- **FILE**: `/work/inspections/[id]/+page.svelte`
- **CHANGES**:
  - Replaced manual text inputs for appointment location with AddressInput component
  - Now matches pattern used in appointments pages (schedule and reschedule modals)
  - Provides Google Places autocomplete for location entry
  - Maintains consistency across appointment creation flows
- **IMPACT**: Users get consistent, modern address entry across all appointment interfaces
- **BENEFITS**:
  - Structured location data capture
  - Google Places autocomplete support
  - Consistent UX with other appointment flows
  - Better location accuracy for scheduling

---

### ✅ B004: Repairer Selection Dropdown Reset Bug - COMPLETE
- **ISSUE**: Repairer dropdown in RatesAndRepairerConfiguration component would reset to "None selected" after the save cycle completed
  - User selects a repairer (e.g., "ABC Motors")
  - Selection is saved to database
  - Dropdown reverts to "None selected" 
  - User confused - appears as if selection was not saved despite correct database state
- **ROOT CAUSE**: Prop cascading and reactive effects that unintentionally reset user-controlled dropdown
  - Component had $effect.pre that continuously synced localRepairerId from parent's repairerId prop
  - When save triggered parent data refresh, prop update would fire $effect.pre
  - Effect would overwrite user's selection, resetting dropdown to "None selected"
  - Correct pattern for calculated values (like rates) but wrong for user-controlled dropdowns
- **SOLUTION**: Separate user-controlled inputs from prop-synced calculated values
  - Removed lastKnownRepairerId state variable (no longer needed)
  - Removed $effect.pre that synced localRepairerId from props (the root cause)
  - localRepairerId now initialized once from prop on mount, then fully controlled by user via bind:value
  - Parent prop changes no longer reset user's selection
  - Rates sync $effect.pre retained (rates are calculated, should update when props change)
- **PATTERN ESTABLISHED**: User-Controlled vs. Calculated Values
  - User-Controlled Inputs (dropdowns, text inputs, checkboxes user can change):
    - Initialize from prop once: let local = prop
    - Use bind:value to let user control
    - NO $effect.pre to sync from props
    - Component remount re-initializes from current prop
  - Calculated/Derived Values (rates, summaries, read-only fields):
    - Initialize from prop: let local = prop
    - KEEP $effect.pre to sync from props
    - Display as read-only
    - Updates whenever parent data changes
- **FILES MODIFIED**:
  - src/lib/components/assessment/RatesAndRepairerConfiguration.svelte - Removed prop sync for localRepairerId
- **BENEFITS**:
  - Dropdown selection persists after save
  - User's selection matches what they see in UI
  - No confusion between UI state and database state
  - Pattern applies to all future dropdown/user-input components
- **DOCUMENTATION CREATED**:
  - .agent/System/repairer_selection_dropdown_reset_fix.md - Complete analysis, pattern, and future reference
- **VERIFICATION**: ✅ Dropdown tested, selection persists after save, data correctly saved to database


### ✅ C001: Vehicle Location Capturing Feature - COMPLETE
- **FEATURE**: Modern address autocomplete with Google Places API integration for capturing structured location data
- **SCOPE**: Requests (incident and owner address), Appointments (appointment location)
- **COMPONENTS CREATED**:
  - **AddressInput.svelte** - Google Places autocomplete with fallback to manual entry
  - **AddressDisplay.svelte** - Consistent address rendering component
  - **address.ts** - StructuredAddress type definition
  - **google-places.ts** - Google Places API utilities with session token management
  - **address.service.ts** - Address parsing and validation functions
- **DATABASE MIGRATIONS APPLIED**:
  - `add_structured_addresses_to_requests` - Added 8 structured address fields to requests (incident + owner)
  - `enhance_appointments_addresses` - Added 8 structured address fields to appointments (location)
  - **Structured Fields**: street_address, suburb, city, province, postal_code, latitude, longitude, place_id
  - **Backward Compatibility**: Maintained legacy text fields (incident_location, owner_address, location_address)
- **INTEGRATIONS**:
  - **Request Create** (`requests/new/+page.svelte`) - IncidentInfoSection + OwnerInfoSection with AddressInput
  - **Request Edit** (`requests/[id]/edit/+page.svelte`) - Pre-populate existing addresses
  - **Appointments Schedule** (`appointments/+page.svelte`) - Schedule modal uses AddressInput for location
  - **Appointments Reschedule** (`appointments/[id]/+page.svelte`) - Reschedule modal updates location
- **FEATURES**:
  - Google Places Autocomplete (South Africa-only by default)
  - Manual entry fallback with address parsing
  - Session token caching for cost optimization
  - Full address extraction (street, suburb, city, province, postal, coordinates)
  - Graceful handling of partial addresses
  - Helper functions in request.ts for converting between flat columns and StructuredAddress type
- **ENVIRONMENT**: Requires `VITE_GOOGLE_PLACES_API_KEY` environment variable
- **DOCUMENTATION CREATED**:
  - `.agent/System/address_location_implementation.md` - Complete feature documentation
- **BENEFITS**:
  - Modern, user-friendly address entry
  - Structured data storage enables mapping, location-based queries
  - Accurate location capture vs free-text entry
  - Backward compatible with legacy systems
  - Cost-optimized with session tokens
- **VERIFICATION**: ✅ All components created, migrations applied, integrations completed

---

## November 28, 2025 (continued)

### ✅ B008: Database Schema Mismatch - exterior_360_photos Column - COMPLETE
- **ISSUE**: Exterior360 service attempted to insert into non-existent `additional_photos` column
  - Database error when creating or updating exterior 360 photos
  - Service layer out of sync with actual database schema
- **ROOT CAUSE**: Code referenced obsolete column removed during unified photo panel refactoring
  - `additional_photos` JSONB column was removed in migration 081
  - Service wasn't updated to match database changes
- **SOLUTION**: Removed obsolete column reference from service
  - Removed `additional_photos: input.additional_photos || []` from `exterior-360.service.ts` line 110
  - Service now only handles photo array, not additional metadata
- **FILE MODIFIED**:
  - `src/lib/services/exterior-360.service.ts` - Removed additional_photos insert
- **BENEFITS**:
  - Service calls succeed without database errors
  - Schema and code stay synchronized
- **VERIFICATION**: ✅ Exterior 360 photo creation/updates work without errors
- **PATTERN**: When refactoring database schema, verify all service references are updated

### ✅ B009: Select Field Not Saving on Navigation - COMPLETE
- **ISSUE**: Overall condition (select) field in Exterior360Tab didn't save when user navigated away
  - User selected a value in the dropdown
  - Field appeared to save but value was lost
  - Database showed null/previous value
- **ROOT CAUSE**: Working tabs use immediate save pattern, but select field used debounced save
  - `oninput={debouncedSave}` delays save by 500ms
  - User navigates away before debounce fires
  - Component unmounts, debounce cancelled, change discarded
- **SOLUTION**: Changed select fields to use `onchange` with immediate `handleSave()`
  - Select fields fire `onchange` once at end of interaction
  - Immediately calls `handleSave()` to persist to database
  - Pattern matches DamageTab and other working tabs
- **FILE MODIFIED**:
  - `src/lib/components/assessment/Exterior360Tab.svelte` (lines 228-233) - Changed from oninput to onchange + immediate save
  - `src/lib/components/forms/FormField.svelte` (lines 82-87) - Added immediate save for select onchange
- **PATTERN ESTABLISHED**: Form Field Save Strategies
  - Text fields: `oninput` with debounced save (500ms) → captures as user types
  - Select/dropdown fields: `onchange` with immediate save → captures on selection complete
  - Reason: Dropdowns have discrete selections, no intermediate values to save
- **BENEFITS**:
  - Select field values persist correctly
  - Works reliably even with rapid navigation
  - User experience matches other working tabs
- **VERIFICATION**: ✅ Select field saves on value change, persists through navigation

### ✅ B010: Text Field Binding Conflict & Lag - COMPLETE
- **ISSUE**: Vehicle color field didn't update when typing, felt laggy
  - User types in text field but text appears delayed or not at all
  - Field seems unresponsive despite proper event handling
- **ROOT CAUSE**: Using `bind:value` + `oninput` together created race condition
  - `bind:value` sets up two-way binding (reactive updates)
  - `oninput` event extracts value and updates state (also reactive)
  - Both trying to update same state variable simultaneously
  - Component re-renders on each update, causing sluggish behavior
  - Svelte 5's tighter reactivity made this more apparent
- **SOLUTION**: Adopted DamageTab pattern - one-way binding with manual extraction
  - Use `value` (one-way) instead of `bind:value`
  - Manually extract value from event: `event.currentTarget.value`
  - Update state immediately: `data.exterior360.vehicle_color = value`
  - Call `handleSave()` for database persistence
  - Keep debounce for repeated changes (prevents DB thrashing)
- **FILE MODIFIED**:
  - `src/lib/components/assessment/Exterior360Tab.svelte` (lines 238-247) - Changed from bind:value to manual extraction
- **PATTERN ESTABLISHED**: Text Field Value Binding
  - OLD (causes lag): `bind:value={data.field}` with event handlers
  - NEW (responsive): Extract from event → Update state immediately → Debounce DB save
  - Matches proven pattern in DamageTab component
- **BENEFITS**:
  - Text input feels responsive and immediate
  - No lag between typing and display
  - Follows proven pattern from working DamageTab
  - Clean separation between UI updates (immediate) and DB saves (debounced)
- **VERIFICATION**: ✅ Text field updates instantly as user types, no lag
- **RELATED**: DamageTab.svelte uses same pattern successfully across all text fields

---

## November 23, 2025

### ✅ Logo Branding Implementation - COMPLETE
- **FEATURE**: ClaimTech logo now integrated across all customer-facing surfaces
- **SCOPE**: Dashboard header, login hero, and PDF report output
- **IMPLEMENTATION**:
  - **Asset**: `src/lib/assets/logo.png` - PNG logo file
  - **Dashboard Header** (`src/routes/(app)/+layout.svelte`):
    - Line 12: Import logo asset
    - Line 52: Render logo image beside breadcrumbs with `h-8 w-auto` sizing
  - **Login Hero** (`src/routes/auth/login/+page.svelte`):
    - Line 5: Import logo asset
    - Line 20: Display logo next to "ClaimTech Platform" heading with `h-12 w-auto` sizing
  - **PDF Report Generation** (`src/routes/api/generate-report/+server.ts`):
    - Line 12: Define logo path using `process.cwd()`
    - Lines 14-18: Read PNG as base64 with error handling
    - Pass `logoBase64` to `generateReportHTML`
  - **Report Template** (`src/lib/templates/report-template.ts`):
    - Line 28: Add `logoBase64?: string | null` to ReportData interface
    - Line 51: Destructure `logoBase64` from data
    - Lines 71-75: Create `logoMarkup` with base64 image or text fallback
    - Lines 126-140: CSS styling for `.logo-placeholder` and `.report-logo`
    - Line 305: Render logo in summary header
    - Line 643: Footer displays company name from settings
- **STYLING**:
  - `.report-logo`: `max-height: 70px; width: auto; object-fit: contain;`
  - `.logo-placeholder`: Flex container with rose theme color (#e11d48)
  - Fallback to company name if logo unavailable
- **BENEFITS**:
  - Unified brand identity across all touchpoints
  - Professional appearance in customer-facing documents
  - Graceful fallback if logo file unavailable
  - Consistent sizing and styling
- **VERIFICATION**: ✅ All files verified, logo asset present, base64 encoding working
- **NEXT STEPS**:
  - Test PDF generation with `npm run dev`
  - Verify logo renders correctly in dashboard and login pages
  - Confirm PDF reports display logo in header



### ✅ PhotoUpload Layout Refactor - COMPLETE
- **ISSUE**: PhotoUpload.svelte styling didn't match TyrePhotosPanel pattern
  - Two side-by-side buttons instead of single centered upload zone
  - Buttons integrated in upload area instead of below
  - Missing "browse" link and support text
  - No container-level drag styling
- **SOLUTION**: Refactored to match unified photo panel pattern
  - Rebuilt empty-state zone into single dashed drop target with vertical layout
  - Centered icon and drag instructions matching TyrePhotosPanel
  - Added inline "browse" link in instructions
  - Added "Supports: JPG, PNG, GIF" support text
  - Moved Camera + Upload buttons below upload zone (not integrated)
  - Integrated FileUploadProgress for compression/upload states
  - Removed unused Loader2 import
- **IMPLEMENTATION**:
  - `src/lib/components/forms/PhotoUpload.svelte` (lines 240-306)
    - Line 240: New container with `flex flex-col items-center justify-center p-6`
    - Line 259: FileUploadProgress component for progress states
    - Line 274: Inline "browse" link in instructions
    - Line 286: Camera + Upload buttons below zone
    - Line 3: Removed Loader2 import
- **BENEFITS**:
  - Consistent UI/UX across all photo upload components
  - Matches TyrePhotosPanel and InteriorPhotosPanel patterns
  - Clearer user affordances with browse link
  - Professional, unified appearance
- **VERIFICATION**: ✅ Build passes with 0 errors
- **NEXT STEPS**:
  - Preview with `npm run dev` to confirm layout and drag behavior
  - Test upload functionality with compression progress
  - Run `npm run test:unit` for automated coverage (optional)

### ✅ Rose Theme Standardization - COMPLETE
- **FEATURE**: Unified rose theme across all photo upload components and document generation
- **IMPACT**: Consistent UI/UX styling, improved visual hierarchy
- **STATUS**: ✅ Production Ready - All 6 photo panels + document cards using rose theme
- **COMPONENTS UPDATED**:
  - `src/lib/components/forms/PhotoUpload.svelte` - 4 color changes
  - `src/lib/components/assessment/DocumentCard.svelte` - 8 color changes
  - `src/lib/components/assessment/PreIncidentPhotosPanel.svelte` - Full pattern
  - `src/lib/components/assessment/EstimatePhotosPanel.svelte` - Full pattern
  - `src/lib/components/assessment/AdditionalsPhotosPanel.svelte` - Full pattern
  - `src/lib/components/assessment/Exterior360PhotosPanel.svelte` - Full pattern
- **NEW FEATURES**:
  - FileUploadProgress component for consistent progress UI
  - Compression progress tracking (two-phase: compress → upload)
  - Camera input support on all photo panels
  - Rose theme colors: `border-rose-500`, `bg-rose-50`, `text-rose-600`, etc.
- **BUILD VERIFICATION**: ✅ 0 errors (9 pre-existing warnings in DamageTab.svelte)
- **DOCUMENTATION CREATED**:
  - `.agent/Tasks/active/ROSE_THEME_IMPLEMENTATION_COMPLETE.md` - Implementation summary

---

### ✅ Photo Compression Implementation - COMPLETE
- **FEATURE**: Client-side photo compression before upload to Supabase Storage
- **IMPACT**: 60-75% storage reduction (5MB → 1.8MB typical)
- **STATUS**: ✅ Production Ready - All 8 photo upload components using compression
- **COMPONENTS UPDATED**:
  - `src/lib/services/storage.service.ts` - Enhanced `uploadAssessmentPhoto()` with progress callbacks
  - `src/lib/components/forms/PhotoUpload.svelte` - Fixed missing functions + added compression UI
  - All photo panel components - Automatic compression via storage service
- **NEW FEATURES**:
  - Two-phase progress tracking: "Compressing..." → "Uploading..."
  - HEIC to JPEG conversion (iPhone photo support)
  - Graceful fallback if compression fails
  - Console logging of compression statistics
- **DOCUMENTATION CREATED**:
  - `.agent/System/photo_compression_implementation.md` - Complete implementation guide
  - Updated `.agent/README/system_docs.md` - Added photo compression section
  - Updated `.agent/System/CODEBASE_INDEX.md` - Added image compression service
- **BUILD VERIFICATION**: ✅ 0 errors (9 pre-existing warnings in DamageTab.svelte)

---

## November 21, 2025 (Continued)

### ✅ Svelte 5 Type Error Fixes - Phase 1-4 Complete (46 errors fixed)
- **PROGRESS**: Reduced error count from 449 to 403 (10.2% reduction)
- **COMMIT**: 8d1ab95 - "fix: Reduce Svelte 5 type errors from 449 to 403"
- **PHASE 1 - Icon Type Fixes** ✅
  - Fixed 7 icon component imports (select, calendar, dropdown-menu)
  - Updated `ActionIconButton.svelte` to accept `Component | any`
  - Updated `ModernDataTable.svelte` to accept `Component | any`
- **PHASE 2 - DataTable Column Fixes** ✅
  - Removed `actions` column from finalized-assessments, appointments, archive, frc pages
  - Added `as const` type assertions to all column keys
  - Removed actions checks from cellContent snippets
- **PHASE 3 - Missing Props** ✅
  - Added `onComplete` callbacks to parent components
  - Fixed GradientBadge usage (label prop instead of children)
- **PHASE 4 - Service Input Types** ✅
  - Added `outwork_markup_percentage` to `CreateEstimateInput`
  - Added `notes?: string | null` to estimate input types
  - Added `inspection_id?: string | null` to `UpdateAssessmentInput`
  - Added `assigned_engineer_id?: string | null` to `UpdateRequestInput`
  - Added `tyre_make`, `tyre_size` to `UpdateTyreInput`
  - Fixed `request.notes` → `request.description` reference
  - Added `Assessment` type import and assertions
  - Added explicit parameter types to `onValueChange` handlers
- **FILES MODIFIED**: 12 core files + 3 type definitions
- **DOCUMENTATION UPDATED**:
  - `.agent/Tasks/active/SVELTE5_ERROR_FIXES_TASK_LIST.md` - Progress tracking
  - `.agent/Tasks/active/PDR_CONTEXT_ENGINE_ANALYSIS.md` - Status update
  - `.agent/README.md` - Last updated timestamp
  - `.agent/README/changelog.md` - This entry

---

## November 21, 2025

### ✅ CRITICAL FIX - Supabase Type Generation - PostgrestFilterBuilder<never> Resolution
- **ISSUE**: All database operations inferred `PostgrestFilterBuilder<never>`, breaking type safety completely
  - Custom Database interface missing `__InternalSupabase` field required by Supabase's type system
  - All queries returned `never` type, preventing compile-time type checking
  - Services couldn't properly type database results
  - `npm run check` blocked with 493+ type errors
- **ROOT CAUSE**: Custom Database interface structure incompatible with Supabase's GenericSchema requirements
- **SOLUTION**: Regenerated types from actual Supabase database using CLI
  - Generated fresh types with proper `__InternalSupabase` field and Relationships structure
  - Replaced custom Database interface with generated types
  - Added domain type re-exports for convenience (Client, Assessment, etc.)
  - Added type assertions in services where domain types are stricter than generated types
- **IMPLEMENTATION**:
  - `src/lib/types/database.ts` - Replaced with generated types + domain type exports
  - `src/lib/services/client.service.ts` - Added type assertions (5 locations)
  - `src/lib/services/audit.service.ts` - Added type assertions (5 locations)
  - `src/lib/services/assessment.service.ts` - Added type assertions (2 locations)
- **VERIFICATION**: `npm run check 2>&1 | Select-String "PostgrestFilterBuilder.*never"` returns 0 matches ✅
- **BENEFITS**:
  - Full type safety restored for all database operations
  - Proper type inference for queries and mutations
  - Compile-time validation of database operations
  - Foundation for remaining Svelte 5 migration work
- **DOCUMENTATION**:
  - New: `.agent/System/supabase_type_generation.md` - Type generation process and maintenance
  - Updated: `.agent/README/system_docs.md` - Added new documentation index
  - Updated: `.agent/README.md` - Updated last modified date and file count
- **BACKUPS CREATED**:
  - `src/lib/types/database.ts.backup` - Original custom structure
  - `src/lib/types/database.ts.old` - Second backup before replacement
  - `database.generated.ts` - Generated types (root directory)

---

## January 31, 2025

### ✨ Bug #9 Enhancement - Assessment Report Notes Formatting by Section
- **ISSUE**: Assessment report notes displayed chronologically with timestamps and note type indicators
  - All notes in one section with "(Added: 2025/11/10)" timestamps
  - Included note type indicators like "[BETTERMENT]", "[SYSTEM]"
  - Unprofessional appearance for formal reports
  - Estimate/Additionals/FRC notes mixed with assessment notes
- **SOLUTION**: Implemented section-based notes grouping
  - Notes grouped by source_tab (Vehicle Identification, Interior, Damage, etc.)
  - Removed timestamps and note type indicators
  - Professional section headers in UPPERCASE
  - Filtered out document-specific notes (estimate, additionals, frc)
  - Consistent section order maintained
- **IMPLEMENTATION**:
  - `src/routes/api/generate-report/+server.ts` - New `formatAssessmentNotesBySection()` function
  - Replaced `formatAssessmentNotes()` with section-based grouping
  - Updated function call to use new formatter
- **BENEFITS**:
  - Professional, formal report appearance
  - Clear section organization
  - Cleaner, more readable notes
  - Proper separation of concerns (notes stay on their respective documents)
- **DOCUMENTATION**:
  - Implementation: `.augment/BUG_9_NOTES_FORMATTING_IMPLEMENTATION.md`
  - Plan: `.augment/bug_9_notes_formatting_plan.md`
  - Updated: `.agent/Tasks/completed/NOTES_AND_ASSESSMENT_DATA_FLOW.md` (Section 8)

### ✅ Bug #9 Fix - Report Generation - Most Information Shows N/A (COMPLETED)
- **ISSUE**: Assessment reports displayed "N/A" for most fields instead of actual data
- **ROOT CAUSES**:
  - Assessment notes used deprecated field (assessment.notes instead of assessment_notes table)
  - Vehicle values data not fetched
  - Assessor information missing
  - Nullable foreign keys not handled
- **SOLUTION**:
  - Fetch all notes from assessment_notes table with formatAssessmentNotes()
  - Added vehicle values fetch with new Warranty & Vehicle Values section
  - Fetch engineer data from appointment relationship
  - Conditional fetching for nullable foreign keys
- **IMPLEMENTATION**:
  - `src/routes/api/generate-report/+server.ts` - Added data fetches and helper function
  - `src/lib/templates/report-template.ts` - Updated interface, fixed assessor info, added warranty section
- **DOCUMENTATION**:
  - Completion Report: `.augment/BUG_9_COMPLETION_REPORT.md`
  - Implementation Summary: `.augment/bug_9_implementation_summary.md`

---

## January 31, 2025 (Earlier)

### ✅ Bug #8 Fix - Generate All Documents SSE Streaming & Progress Tracking
- **ISSUE**: Generate All Documents button showed no progress feedback during 30-60+ second generation
  - Generic loading spinner with no indication of progress
  - No way to identify which document failed
  - All-or-nothing approach (entire batch fails if one document fails)
  - Poor UX with long waits and no feedback
- **ROOT CAUSE**: Batch aggregator used `Promise.allSettled` with no streaming
  - Parallel generation with no progress updates
  - JSON response only returned after all documents completed
  - No partial success handling
- **SOLUTION**: Implemented SSE streaming with per-document progress tracking
  - Sequential generation with real-time progress updates (0-25% report, 25-50% estimate, 50-75% photos PDF, 75-100% photos ZIP)
  - New DocumentGenerationProgress component with status indicators
  - Individual retry buttons for failed documents
  - Partial success handling (continue with 3/4 documents)
  - Comprehensive logging with timestamps
- **IMPLEMENTATION**:
  - `src/routes/api/generate-all-documents/+server.ts` - Converted to SSE streaming (249 lines)
  - `src/lib/services/document-generation.service.ts` - Updated generateAllDocuments() with progress callback
  - `src/lib/components/assessment/DocumentGenerationProgress.svelte` - NEW progress UI component (133 lines)
  - `src/lib/components/assessment/FinalizeTab.svelte` - Integrated progress tracking with retry handlers
  - `src/lib/utils/streaming-response.ts` - Added 'partial' status support
- **BENEFITS**:
  - Real-time progress feedback (user sees which document is being generated)
  - Clear identification of failures (know exactly which document failed)
  - Individual retry functionality (no need to regenerate all documents)
  - Partial success support (3/4 documents can succeed)
  - Better debugging with detailed logs
- **VERIFICATION**:
  - ✅ Progress bars update smoothly (0-100%)
  - ✅ Status icons change correctly (pending → processing → success/error)
  - ✅ Messages display for each document
  - ✅ Retry buttons appear for failed documents
  - ✅ View Document links work for successful documents
  - ✅ Overall progress count is accurate
- **DOCUMENTATION**:
  - Investigation Report: `.agent/Tasks/active/BUG_8_INVESTIGATION_REPORT.md`
  - SSE Streaming Guide: `.agent/Tasks/active/BUG_8_SSE_STREAMING_IMPLEMENTATION_GUIDE.md`
  - UI Component Guide: `.agent/Tasks/active/BUG_8_UI_COMPONENT_IMPLEMENTATION_GUIDE.md`
  - Implementation Summary: `.agent/Tasks/active/BUG_8_IMPLEMENTATION_SUMMARY.md`
  - Next Actions: `.agent/Tasks/active/BUG_8_NEXT_ACTIONS.md`

---

## November 11, 2025

### ✅ Bug #4 Fix - Estimate Description Field Editing
- **ISSUE**: Description field in EstimateTab line items was not editable after creation
  - Users could add line items successfully
  - Description field appeared locked/read-only
  - Other fields (Part Price, S&A, Labour, Paint, Outwork) were editable
- **ROOT CAUSE**: Svelte 4 to Svelte 5 syntax migration issue
  - Line 884 used `on:blur` (Svelte 4 syntax) instead of `onblur` (Svelte 5 syntax)
  - Svelte 5 doesn't recognize `on:blur` directive
  - Blur handler never fired, preventing proper field updates
- **SOLUTION**: Changed event handler syntax on line 884
  - Changed `on:blur` to `onblur` (removed colon)
  - Single-character fix, no breaking changes
- **IMPLEMENTATION**:
  - File: `src/lib/components/assessment/EstimateTab.svelte` (line 884)
  - Pattern: Now matches PreIncidentEstimateTab and Svelte 5 syntax
- **VERIFICATION**:
  - ✅ Description field is editable after line item creation
  - ✅ Text updates as user types (oninput handler)
  - ✅ Blur handler fires when user tabs away
  - ✅ Changes persist after save
- **DOCUMENTATION**:
  - Context Report: `.augment/context_reports/BUG_4_ESTIMATE_DESCRIPTION_EDIT_CONTEXT.md`
  - Implementation Plan: `.augment/fixes/BUG_4_IMPLEMENTATION_PLAN.md`
  - Fix Summary: `.augment/fixes/BUG_4_FIX_SUMMARY.md`
  - Completion Report: `.augment/fixes/BUG_4_COMPLETE.md`

### ✅ Bug #3 Fix - Vehicle Values PDF Upload Persistence
- **ISSUE**: PDF uploads to Vehicle Values tab were not persisting to database
  - Upload completed successfully to storage
  - Validation badge showed "PDF required" even after upload
  - PDF disappeared when navigating away from tab
  - Data loss on page reload
- **ROOT CAUSE**: Missing auto-save after PDF upload
  - `handlePdfUpload()` updated local state but didn't call `handleSave()`
  - PDF only saved if user triggered debounced save by typing in another field
  - When navigating away, `$effect()` sync overwrote local state with database values (empty)
- **SOLUTION**: Added `handleSave()` calls after PDF operations
  - Added `handleSave()` in `handlePdfUpload()` (line 322)
  - Added `handleSave()` in `handlePdfRemove()` (line 329)
  - Matches auto-save pattern used elsewhere in assessment tabs
- **IMPLEMENTATION**:
  - File: `src/lib/components/assessment/VehicleValuesTab.svelte` (lines 322, 329)
  - Changes: 2 function calls + 2 explanatory comments
  - Pattern: Consistent with other tab auto-save implementations
- **VERIFICATION**:
  - ✅ PDF persists to database immediately after upload
  - ✅ Validation badge updates instantly
  - ✅ PDF remains visible when navigating between tabs
  - ✅ PDF loads correctly on page reload
  - ✅ PDF removal persists to database
- **DOCUMENTATION**:
  - Context Report: `.augment/context_reports/BUG_3_VEHICLE_VALUE_PDF_UPLOAD_CONTEXT.md`
  - Implementation Plan: `.augment/fixes/BUG_3_PDF_UPLOAD_FIX.md`
  - Fix Summary: `.augment/fixes/BUG_3_SUMMARY.md`

---

## November 9, 2025

### ✅ Photo Panel Display Fix - Reactivity Pattern
- **ISSUE**: Photo panels not displaying uploaded photos after upload or tab switching
  - Photos didn't appear in grid after upload
  - Upload corner wasn't visible (only large centered upload zone showed)
  - Tab switching showed empty photo panels
  - Page reload didn't load photos from database
- **ROOT CAUSE**: Generic `handleRefreshData()` callback used `invalidateAll()` which reloaded page data but didn't change prop references
  - `useOptimisticArray(() => props.photos)` getter didn't detect changes
  - Reactive dependency chain broken: prop reference → getter → $derived → $effect → UI
- **SOLUTION**: Updated `onPhotosUpdate` callbacks to directly update parent state
  - Changed from generic `handleRefreshData()` to specific state updates
  - `data.interiorPhotos = updatedPhotos` triggers prop reference change
  - Getter function detects change → $derived re-evaluates → $effect syncs → UI updates
- **IMPLEMENTATION**:
  - Added imports: `interiorPhotosService`, `exterior360PhotosService`
  - Updated `InteriorMechanicalTab` `onPhotosUpdate` callback (lines 748-753)
  - Optimized `Exterior360Tab` `onPhotosUpdate` callback (lines 735-740)
  - Removed dynamic import from Exterior360Tab for consistency
- **VERIFICATION**:
  - ✅ Photos display in grid immediately after upload
  - ✅ Upload corner visible in top-left of grid
  - ✅ Photos persist when switching tabs
  - ✅ Photos load correctly on page reload
  - ✅ Photo viewer opens when clicking photos
- **FILES**:
  - `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte` - Updated callbacks
  - `.agent/Tasks/completed/PHOTO_PANEL_DISPLAY_FIX_NOV_9_2025.md` - Complete documentation
- **KEY LEARNING**: Direct state updates are critical for reactive prop changes in Svelte 5
  - Generic refresh callbacks break optimistic array pattern
  - Always update specific state properties, not generic refresh
  - Consistency matters - all photo panels should follow same pattern
- **RELATED**: [Optimistic Array Bug Fix](../Tasks/completed/OPTIMISTIC_ARRAY_BUG_FIX_RESEARCH_NOV_9_2025.md) - Svelte 5 reactivity patterns

---

## January 2025

### 🎨 Unified Photo Panel Pattern Implementation
- **FEATURE**: Consolidated all photo upload/gallery components into single-card unified pattern
- **IMPACT**: Cleaner UI, consistent UX across all photo sections, easier maintenance
- **CHANGES**:
  - **Exterior 360 Photos**: Removed legacy 8-position photo upload system
    - Removed `front_photo_url`, `front_left_photo_url`, `left_photo_url`, etc. columns
    - Created new `assessment_exterior_360_photos` table (Migration 079)
    - Removed old photo columns from `assessment_360_exterior` (Migration 081)
    - Updated `Exterior360Tab.svelte` to use unified `Exterior360PhotosPanel`
  - **All Photo Panels**: Standardized to single-card layout
    - Empty state: Large centered upload zone
    - With photos: Compact upload zone as first grid item + photo gallery
    - Dynamic titles: "Section Name" when empty, "Section Name (N)" when photos exist
- **VALIDATION UPDATES**:
  - `validateExterior360()` now accepts `exterior360Photos` array parameter
  - Requires at least 4 exterior photos (replaces old front/rear/left/right requirement)
  - Follows same pattern as `validateInteriorMechanical()` with photos array
- **COMPONENTS AFFECTED**:
  - `InteriorPhotosPanel.svelte` - Already unified
  - `EstimatePhotosPanel.svelte` - Already unified
  - `PreIncidentPhotosPanel.svelte` - Already unified
  - `AdditionalsPhotosPanel.svelte` - Already unified
  - `Exterior360PhotosPanel.svelte` - NEW unified component
  - `Exterior360Tab.svelte` - Removed legacy 8-position panel
- **DATABASE**:
  - New table: `assessment_exterior_360_photos` (Migration 079)
  - Removed columns: 8 photo URL columns + `additional_photos` JSONB (Migration 081)
- **DOCUMENTATION**:
  - Created `unified_photo_panel_pattern.md` - Complete pattern documentation
  - Updated `database_schema.md` - New table and removed columns
  - Updated validation documentation
- **FILES**:
  - `src/lib/components/assessment/Exterior360Tab.svelte` - Removed legacy panel
  - `src/lib/components/assessment/Exterior360PhotosPanel.svelte` - NEW unified component
  - `src/lib/services/exterior-360-photos.service.ts` - NEW service
  - `src/lib/utils/validation.ts` - Updated validation signature
  - `src/lib/types/assessment.ts` - Added Exterior360Photo types
  - `supabase/migrations/079_create_assessment_exterior_360_photos.sql` - NEW
  - `supabase/migrations/080_check_redundant_exterior_photo_fields.sql` - Diagnostic queries
  - `supabase/migrations/081_remove_redundant_exterior_photo_columns.sql` - Cleanup migration

---

## November 2, 2025

### 🔧 FRC Completion Stage Update Fix (CRITICAL)
- **ISSUE**: Assessment ASM-2025-003 stuck in Finalized Assessments and Additionals after FRC completion
- **ROOT CAUSE**: Silent failure in `completeFRC()` method - stage update failed but error was caught and only logged
- **IMPACT**: Assessments with completed FRCs appearing in wrong lists due to stage/status mismatch
- **FIX**: Refactored `completeFRC()` error handling in `src/lib/services/frc.service.ts`
  - Made stage update independent and critical (no longer nested in conditional)
  - Added explicit error handling for each step (status update, stage update, verification)
  - Added verification step to confirm both `stage` and `status` are `'archived'`
  - Errors now throw instead of being silently caught
  - Clear "CRITICAL ERROR:" prefixes for debugging
- **VERIFICATION**:
  - Query assessment after update to verify `stage = 'archived'` and `status = 'archived'`
  - Throw error if verification fails
  - User sees error message if archiving fails (no silent failures)
- **MANUAL FIX APPLIED**: Updated ASM-2025-003 stage from `'estimate_finalized'` to `'archived'`
- **FILES**:
  - `src/lib/services/frc.service.ts` (lines 731-800) - Refactored error handling
  - `.agent/System/frc_completion_stage_update_fix_nov_2_2025.md` (NEW) - Complete documentation
- **DOCUMENTATION**: Added to system_docs.md index as critical bug postmortem
- **PREVENTION**: Future FRC completions will fail loudly if stage update fails, preventing inconsistent state

### ✅ Terms & Conditions Feature - Company Defaults
- **NEW**: Customizable Terms & Conditions for all three document types
  - **Assessment Reports** - `assessment_terms_and_conditions` (TEXT)
  - **Estimate Documents** - `estimate_terms_and_conditions` (TEXT)
  - **FRC Reports** - `frc_terms_and_conditions` (TEXT)
- **MIGRATION**: `20251102_add_terms_and_conditions_to_company_settings.sql`
  - Added 3 TEXT columns to `company_settings` table
  - Idempotent migration with `IF NOT EXISTS` checks
  - Includes rollback instructions and column documentation
  - Applied to production database (cfblmkzleqtvtfxujikf)
- **SECURITY**: XSS protection via HTML escaping
  - Created `src/lib/utils/sanitize.ts` with `escapeHtml()` and `escapeHtmlWithLineBreaks()`
  - All T&Cs content escaped before rendering in PDFs
  - Input validation (10,000 character max per field)
  - Input sanitization (whitespace trimming, line break normalization)
- **UI**: Settings page enhancements
  - Added dedicated "Terms & Conditions" section with FileText icon
  - 3 large textareas (10 rows each) with helpful placeholders
  - Real-time character counters (e.g., "0 / 10,000 characters")
  - Clear descriptions for each document type
- **PDF INTEGRATION**: All three templates updated
  - T&Cs sections appear before footer in all PDFs
  - Preserves multi-line formatting with `white-space: pre-wrap`
  - Conditional rendering (only shows if T&Cs exist)
  - Consistent styling across all document types
- **CODE CLEANUP**: Removed hardcoded T&Cs from estimate template footer
- **FILES**:
  - `src/lib/utils/sanitize.ts` (NEW) - Sanitization utilities
  - `src/lib/types/assessment.ts` - Updated CompanySettings interface
  - `src/routes/(app)/settings/+page.server.ts` - Validation & sanitization
  - `src/routes/(app)/settings/+page.svelte` - UI with character counters
  - `src/lib/templates/report-template.ts` - Integrated T&Cs section
  - `src/lib/templates/estimate-template.ts` - Integrated T&Cs section
  - `src/lib/templates/frc-report-template.ts` - Integrated T&Cs section
  - `supabase/migrations/20251102_add_terms_and_conditions_to_company_settings.sql`
- **COMMITS**:
  - `d735f3f` - feat: add terms and conditions fields to company settings
  - `d3454b7` - feat: implement terms and conditions UI and PDF integration
- **IMPACT**: Companies can now customize legal terms for each document type, improving compliance and flexibility

### ✅ Terms & Conditions Feature - Client-Specific Overrides
- **NEW**: Client-specific Terms & Conditions with fallback to company defaults
  - Each client can optionally have custom T&Cs for all three document types
  - **Fallback Pattern**: Client T&Cs → Company T&Cs → Empty
  - Overrides company defaults only when client T&Cs are specified
- **MIGRATION**: `20251102_add_terms_and_conditions_to_clients.sql`
  - Added 3 TEXT columns to `clients` table:
    - `assessment_terms_and_conditions` (TEXT, NULL)
    - `estimate_terms_and_conditions` (TEXT, NULL)
    - `frc_terms_and_conditions` (TEXT, NULL)
  - Idempotent migration with `IF NOT EXISTS` checks
  - Includes column documentation explaining fallback pattern
  - RLS policies inherited from existing client table policies
- **SERVICE LAYER**: Enhanced ClientService
  - Added `validateTermsAndConditions()` method for server-side validation
  - Input validation (10,000 character max per field)
  - Validation applied to both create and update operations
  - Added `getClientTermsAndConditions()` method for optimized T&Cs-only queries
- **SECURITY**: Consistent with company T&Cs patterns
  - Same 10,000 character limit per field
  - Input sanitization via existing `sanitizeInput()` utility
  - HTML escaping in PDF generation
- **UI**: ClientForm enhancements
  - Added dedicated "Terms & Conditions" section card
  - 3 large textareas (8 rows each) with helpful placeholders
  - Real-time character counters using Svelte 5 `$derived` runes
  - Clear description: "Optional: Client-specific terms and conditions. Leave empty to use company default T&Cs"
  - Visual consistency with company settings T&Cs UI
- **PDF INTEGRATION**: All three API routes updated with fallback logic
  - `generate-report/+server.ts` (lines 123-126) - Assessment Report fallback
  - `generate-estimate/+server.ts` (lines 104-107) - Estimate fallback
  - `generate-frc-report/+server.ts` (lines 124-126) - FRC Report fallback
  - Added client data fetching to FRC route (lines 74-102)
  - Fallback implemented: `client?.{type}_tcs || companySettings?.{type}_tcs || null`
- **TYPE SAFETY**: Full TypeScript support
  - Updated `Client` interface in `src/lib/types/client.ts`
  - Updated `CreateClientInput` and `UpdateClientInput` interfaces
  - Regenerated `src/lib/types/database.types.ts` from live Supabase schema
  - TypeScript compilation verified with `npm run check`
- **FILES**:
  - `supabase/migrations/20251102_add_terms_and_conditions_to_clients.sql` (NEW)
  - `src/lib/types/client.ts` - Added T&Cs fields to interfaces
  - `src/lib/types/database.types.ts` - Regenerated from schema
  - `src/lib/services/client.service.ts` - Added validation methods
  - `src/lib/components/forms/ClientForm.svelte` - Added T&Cs section UI
  - `src/routes/api/generate-report/+server.ts` - Added fallback logic
  - `src/routes/api/generate-estimate/+server.ts` - Added fallback logic
  - `src/routes/api/generate-frc-report/+server.ts` - Added client fetch + fallback logic
- **IMPACT**: Clients can now have custom legal terms that override company defaults, enabling per-client compliance requirements while maintaining company-wide defaults

---

## January 30, 2025

### ✅ Comprehensive Audit Logging System
- **NEW**: Complete audit logging implementation across all assessment workflow operations
  - 21 distinct audit action types (line_item_added, line_item_approved, rates_updated, etc.)
  - 21 supported entity types with full coverage
  - Rich metadata capture for all operations
- **NEW**: Audit Service enhancements
  - Added `getAssessmentHistory()` method for cross-entity-type history queries
  - All service methods accept optional `ServiceClient` for RLS compliance
  - Defensive error handling (never breaks main operations)
- **NEW**: Admin-only Audit Tab on assessment detail pages
  - `AuditTab` component with ActivityTimeline integration
  - Only visible to admin users (role check in AssessmentLayout)
  - Displays complete assessment history across all entity types
- **UPDATED**: Extended ActivityTimeline component
  - Added icons and colors for 12 new action types
  - Enhanced formatting for line item operations
  - Metadata display improvements
- **COVERAGE**: Full audit logging added to:
  - Estimate service (line items, rate updates)
  - Additionals service (approve/decline/reverse operations)
  - FRC service (merge and completion)
  - Pre-incident estimate service (line items, rates)
  - Vehicle tab services (identification, exterior, interior, values)
  - Assessment notes service (create/update/delete)
  - Assessment service (creation tracking)
- **IMPACT**: Complete visibility into assessment workflow changes for compliance and debugging
- **FILES**:
  - `src/lib/types/audit.ts` - Extended with 12 new action types
  - `src/lib/services/audit.service.ts` - New `getAssessmentHistory()` method
  - `src/lib/services/estimate.service.ts` - Line item and rate logging
  - `src/lib/services/additionals.service.ts` - Updated to specific actions
  - `src/lib/services/frc.service.ts` - Merge and completion logging
  - `src/lib/services/pre-incident-estimate.service.ts` - Complete coverage
  - `src/lib/services/vehicle-*.service.ts` - Update logging with field tracking
  - `src/lib/services/assessment-notes.service.ts` - Create/update/delete logging
  - `src/lib/services/assessment.service.ts` - Creation logging
  - `src/lib/components/data/ActivityTimeline.svelte` - New action support
  - `src/lib/components/assessment/AuditTab.svelte` - New admin-only tab
  - `src/lib/components/assessment/AssessmentLayout.svelte` - Admin tab integration
  - `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte` - Tab rendering
- **DOCUMENTATION**: Created `System/audit_logging_system.md` with comprehensive guide

---

## January 30, 2025

### ✅ Assessment Cancellation Feature
- **NEW**: Added `cancelAssessment()` helper method in `assessmentService`
  - Sets both `status` and `stage` to `'cancelled'` atomically
  - Includes automatic audit logging for both changes
  - Accepts optional `ServiceClient` parameter for RLS compliance
- **NEW**: Cancel button added to Open Assessments table
  - Destructive variant button with loading state
  - Confirmation dialog before cancellation
  - Auto-refresh after cancellation (removed from list)
- **NEW**: Cancel button added to Assessment Detail page header
  - Shows for open assessment stages (`assessment_in_progress`, `estimate_review`, `estimate_sent`)
  - Redirects to Archive page with cancelled tab selected
  - Positioned between Save and Exit buttons for visibility
- **IMPACT**: Users can now cancel open assessments from both table view and detail page
- **FILES**: 
  - `src/lib/services/assessment.service.ts` - Added `cancelAssessment()` method
  - `src/routes/(app)/work/assessments/+page.svelte` - Cancel button in table
  - `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte` - Updated to use new helper
  - `src/lib/components/assessment/AssessmentLayout.svelte` - Cancel button in header

### ✅ Inspection Cancellation Flow Fixes
- **FIX**: Cancelled inspections now redirect to Archive page with cancelled tab selected
  - Changed redirect from `/work/inspections` to `/work/archive?tab=cancelled`
  - Matches pattern used for assessment cancellations
- **FIX**: Fixed 404 error when clicking cancelled inspections in Archive table
  - Archive page now uses assessment ID (not inspection ID) for detailUrl
  - Updated `listCancelledInspections()` to include assessment data via request_id join
  - Archive page extracts assessment ID from nested data structure
- **IMPACT**: Cancelled inspections properly appear in Archive and can be accessed/reactivated
- **FILES**:
  - `src/routes/(app)/work/inspections/[id]/+page.svelte` - Updated redirect
  - `src/routes/(app)/work/archive/+page.svelte` - Fixed detailUrl, added tab query param support
  - `src/lib/services/inspection.service.ts` - Added assessment join to cancelled inspections query

### ✅ Archive Page Enhancements
- **NEW**: Archive page now reads `tab` query parameter from URL
  - Supports `?tab=cancelled` and `?tab=completed` query parameters
  - Automatically selects correct tab when navigating from cancellation flows
  - Gracefully handles invalid tab values (defaults to 'all')
- **FILES**: `src/routes/(app)/work/archive/+page.svelte`

### ✅ Vercel Deployment - Live!
- **DEPLOYED**: ClaimTech is now live on Vercel
  - Production URL: `https://claimtech.vercel.app`
  - Git integration connected: `Jcvdm/ClaimTech` repository
  - Auto-deployment enabled for all branches
  - Environment variables configured for Supabase integration
  - **Status**: Running great - performance testing in progress
  - **Auth URLs Configured**: Password resets and email confirmations now work in production
  - **Next**: Monitor build times, test PDF generation, validate speed improvements

### ✅ Supabase Auth Configuration - Production Ready
- **CONFIGURED**: Added Vercel redirect URLs to Supabase auth settings
  - Added: `https://claimtech.vercel.app/auth/callback`
  - Added: `https://claimtech.vercel.app/auth/confirm`
  - **Impact**: Password resets, email confirmations, and magic links now work in production
  - **Method**: Updated via Supabase MCP (SVA project cfblmkzleqtvtfxujikf)

### Vercel Deployment Strategy
- **UPDATED**: [Deployment & Branching Strategy](../Tasks/active/SUPABASE_BRANCHING.md)
  - Renamed from "Supabase Branching Strategy" to include Vercel deployment
  - Implemented 3-tier branch structure:
    - `main` → Vercel Production + Supabase Production
    - `vercel-dev` → Vercel Preview + Supabase Dev Branch (replaces staging)
    - `dev` → Local only + Supabase Dev Branch
  - Added Vercel deployment setup guide
  - Added Vercel-specific troubleshooting
  - Updated workflows for local dev → Vercel testing → production
  - Added "Branch Hygiene & Development Workflow" section with clear rules
  - Deprecated `staging` branch in favor of `vercel-dev`
  - **Impact**: Clear separation between local development and cloud testing

### FRC Removed Lines Implementation
- **FIX**: [FRC Removed Lines Calculation](../SOP/frc_removed_lines.md)
  - Fixed removal lines with negative amounts being filtered out
  - Implemented dual-line pattern (original + removal = net zero)
  - Added "REMOVAL (-)" badge for negative additional lines
  - Updated `composeFinalEstimateLines()` to include removal lines (lines 116, 164)
  - **Files Changed**:
    - `src/lib/utils/frcCalculations.ts` - Removed filters blocking negative removal lines
    - `src/lib/components/assessment/FRCLinesTable.svelte` - Added removal badge
  - **Testing**: ASM-2025-017 prepared with removal line for validation
  - **Impact**: FRC now correctly subtracts removed lines from totals

### New SOP
- **NEW**: [FRC Removed Lines Handling](../SOP/frc_removed_lines.md) (~350 lines)
  - Business logic (dual-line pattern)
  - Technical implementation details
  - Testing procedures with expected results
  - Database schema for removal lines
  - Troubleshooting guide

### Documentation Restructuring
- **NEW**: Lightweight README system (90-95% context reduction)
- **NEW**: [index.md](./index.md) - Master navigation hub
- **NEW**: [system_docs.md](./system_docs.md) - Complete System/ documentation index
- **NEW**: [sops.md](./sops.md) - Complete SOP/ documentation index
- **NEW**: [architecture_quick_ref.md](./architecture_quick_ref.md) - High-level overview
- **NEW**: [database_quick_ref.md](./database_quick_ref.md) - Schema summary
- **NEW**: [task_guides.md](./task_guides.md) - Use-case navigation
- **NEW**: [faq.md](./faq.md) - Common questions

**Impact**: Claude agents can now navigate documentation with 90-95% less context usage

### UI Loading Patterns
- **NEW**: [ui_loading_patterns.md](../System/ui_loading_patterns.md) - Comprehensive loading patterns guide
- Documented 3 loading patterns (global nav bar, table row, button)
- Includes decision tree, API reference, troubleshooting
- **BUG FIX**: Appointments page loading state error (startingAssessment undefined)

---

## January 29, 2025

### Critical Bug Fixes & Pattern Establishment

#### FRC & Stage Transitions
- **FIX**: [FRC Stage Transition Fixes](../System/frc_stage_transition_fixes_jan_29_2025.md)
  - Fixed subprocess pattern for FRC and Additionals
  - Corrected stage transition logic
  - Established subprocess independence pattern
- **ANALYSIS**: [Bug Postmortem: Finalization & FRC Stage Transitions](../System/bug_postmortem_finalization_frc_stage_transitions.md)
  - 3 critical bugs analyzed
  - Root cause identification
  - Prevention strategies documented

#### Badge Counts & RLS
- **FIX**: [Bug Postmortem: Badge RLS & PostgREST Filter Fixes](../System/bug_postmortem_badge_rls_filter_fixes_jan_29_2025.md)
  - Fixed badge count inflation
  - Corrected PostgREST syntax
  - Established assessment-based query pattern
- **STANDARDIZATION**: [Page Update & Badge Standardization](../System/page_update_badge_standardization_jan_29_2025.md)
  - Navigation-first pattern standardized
  - Badge refresh patterns documented

#### Subprocess Filtering
- **FIX**: [Additionals FRC Filtering Fix](../System/additionals_frc_filtering_fix_jan_29_2025.md)
  - Removed incorrect FRC filtering from Additionals list
  - Fixed badge/table mismatch
- **NEW PATTERN**: [Subprocess Stage Filtering](../System/subprocess_stage_filtering_jan_29_2025.md)
  - Stage-based filtering for subprocess pages
  - Only show active assessments, hide archived/cancelled

#### Navigation Fixes
- **FIX**: [Navigation appointment_id Fix](../System/navigation_appointment_id_fix_jan_29_2025.md)
  - Fixed nested object navigation in Additionals/FRC pages
  - Corrected appointment access pattern

### New SOPs
- **NEW**: [Navigation-Based State Transitions](../SOP/navigation_based_state_transitions.md) (591 lines)
  - Server-side-first pattern
  - Idempotent load functions
  - State transition best practices
- **NEW**: [Page Updates and Badge Refresh](../SOP/page_updates_and_badge_refresh.md) (284 lines)
  - Navigation-first approach
  - Badge calculation patterns
  - Polling mechanism

### Documentation Updates
- **UPDATED**: [Table Utilities Reference](../System/table_utilities.md) (540 lines)
  - Complete table-helpers.ts API reference
  - Stage variant helpers
  - Formatting functions

---

## January 27, 2025

### Badge Count Implementation
- **NEW**: [Implementing Badge Counts](../SOP/implementing_badge_counts.md) (803 lines)
  - Assessment-centric badge patterns
  - Complete step-by-step implementation
  - Troubleshooting guide
  - Performance optimization

### Security Hardening
- **UPDATED**: [Session Management & Security](../System/session_management_security.md) (751 lines)
  - Complete session security architecture
  - Cookie management patterns
  - JWT validation
  - Security compliance

---

## January 26, 2025

### RLS Policy Improvements
- **FIX**: [Early-Stage Assessment RLS Fix](../System/early_stage_assessment_rls_fix_jan_26_2025.md)
  - Dual-check RLS pattern for nullable foreign keys
  - Migrations 073-074
  - Engineers can access assessments before appointment assignment
- **FIX**: [Phase 3 Frontend + Enum Fix](../System/phase_3_frontend_and_enum_fix_jan_26_2025.md) (602 lines)
  - Migration 075 enum corrections
  - Frontend UI completion

### New SOPs
- **NEW**: [Working with Assessment-Centric Architecture](../SOP/working_with_assessment_centric_architecture.md) (1,081 lines)
  - Complete assessment-centric patterns
  - 10-stage pipeline explained
  - Subprocess implementation
  - Best practices & anti-patterns

---

## January 2025 (Earlier)

### Authentication & Security
- **NEW**: [Password Reset Flow](../SOP/password_reset_flow.md) (761 lines)
  - Two-step reset flow pattern
  - Supabase PKCE configuration
  - Email template setup
- **NEW**: [Service Client Authentication](../SOP/service_client_authentication.md) (333 lines)
  - ServiceClient parameter pattern
  - RLS authentication requirements
  - Critical for all service implementations

### RLS Debugging
- **UPDATED**: [Fixing RLS Policy Errors](../SOP/fixing_rls_insert_policies.md) (947 lines)
  - Debugging INSERT, SELECT, UPDATE policies
  - Dual-check pattern for nullable FKs
  - Testing RLS via MCP
- **NEW**: [Handling Race Conditions in Number Generation](../SOP/handling_race_conditions_in_number_generation.md) (458 lines)
  - Retry logic with exponential backoff
  - Sequential number generation patterns

---

## October 2025

### Security Milestone
- **ACHIEVED**: 100% RLS coverage across all 28 tables
- **VERIFIED**: Database schema against live Supabase
- **DOCUMENTED**: [Security Recommendations](../System/security_recommendations.md)
- **DOCUMENTED**: [Database Verification Report](../System/database_verification_report.md) (605 lines)

### RLS Fixes
- **FIX**: [RLS Recursion Fix Summary](../System/rls_recursion_fix_summary.md)
  - JWT claims pattern established
  - Eliminated recursive RLS calls
  - Performance improvements

---

## System Documentation

### Core Architecture (Stable)
- **[Project Architecture](../System/project_architecture.md)** (977 lines) - Comprehensive system overview
- **[Database Schema](../System/database_schema.md)** (1,420 lines) - Complete database documentation
- **[Tech Stack](../System/tech-stack.md)** - Technology choices and versions

### SOPs (Stable)
- **[Adding Database Migrations](../SOP/adding_migration.md)** (543 lines)
- **[Adding Page Routes](../SOP/adding_page_route.md)** (742 lines)
- **[Working with Services](../SOP/working_with_services.md)** (859 lines)
- **[Implementing Form Actions & Auth](../SOP/implementing_form_actions_auth.md)** (1,191 lines)
- **[Implementing Role-Based Filtering](../SOP/implementing_role_based_filtering.md)** (885 lines)
- **[Creating Components](../SOP/creating-components.md)** (796 lines)
- **[Fixing RLS Recursion](../SOP/fixing_rls_recursion.md)** (935 lines)
- **[Testing Guide](../SOP/testing_guide.md)** (421 lines)

---

## Key Patterns Established

### 2025 Patterns
1. **Assessment-Centric Architecture** - One assessment per request, stage-based workflow
2. **Nullable FK Pattern** - Dual-check RLS for nullable foreign keys
3. **Navigation-First State Transitions** - Navigate → load function updates state
4. **Subprocess Independence** - FRC/Additionals don't affect main assessment stage
5. **Assessment-Based Badge Queries** - Count from assessments, not requests
6. **Loading State Patterns** - 3 patterns (global, table row, button) with decision tree
7. **ServiceClient Injection** - Required for RLS authentication

### 2024 Patterns
1. **Service Layer Pattern** - All database access through services
2. **100% RLS Coverage** - Security at database level
3. **JWT Claims for RLS** - Avoid recursive policies
4. **Server-Side Session Management** - httpOnly cookies, no localStorage

---

## Migration Summary

### Recent Migrations (Jan 2025)
- **073-074**: Early-stage assessment RLS (dual-check pattern)
- **075**: Enum corrections for assessment stages

### Notable Migrations (2024)
- **RLS Hardening**: 100% RLS coverage achieved
- **Performance**: Indexes added for common queries
- **Security**: JWT claims pattern implemented

---

## Breaking Changes

### None in 2025
All changes have been backward-compatible.

### Deprecations
- **Old loading patterns** → Use ui_loading_patterns.md patterns
- **Request-based badge queries** → Use assessment-based queries
- **Direct Supabase calls** → Always use service layer

---

## Upcoming Changes

### Planned Features
- Finance role implementation
- Advanced reporting
- PDF template improvements
- Mobile app (future consideration)

### Planned Documentation
- Video tutorials
- API documentation
- Deployment guide updates

---

## For Detailed History

- **Git Log**: `git log --oneline --graph`
- **Bug Postmortems**: [System Docs: Bug Postmortems](./system_docs.md#bug-postmortems)
- **Old README**: `.agent/README.md.backup` (archived, 1,714 lines)

---

## Related Documentation
- **[System Docs Index](./system_docs.md)** - All system documentation
- **[SOP Index](./sops.md)** - All procedures
- **[Task Guides](./task_guides.md)** - Use-case navigation

---

**Maintenance**: Update after each significant feature or bug fix
**Last Review**: January 30, 2025
## November 12, 2025

### ✅ Bug #6 Fix - Finalization Report False Missing Fields
- **ISSUE**: Finalization report flagged tabs as incomplete despite completed fields
  - Photo requirements (Interior ≥2, Exterior360 ≥4, Tyres ≥1 per tyre) were reported missing
- **ROOT CAUSE**: `FinalizeTab` did not pass photo arrays into validation
  - `getTabCompletionStatus` relies on `interiorPhotos`, `exterior360Photos`, `tyrePhotos`
- **SOLUTION**: Wire photo arrays into finalization validation
  - Added props `interiorPhotos`, `exterior360Photos`, `tyrePhotos` to `FinalizeTab`
  - Included these arrays in `getTabCompletionStatus`
  - Updated parent assessment page to pass photo arrays
- **IMPLEMENTATION**:
  - `src/lib/components/assessment/FinalizeTab.svelte:100–111` (validation call includes arrays)
  - `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte:876–890` (pass arrays into `<FinalizeTab />`)
- **VERIFICATION**:
  - ✅ With completed photo counts, no false missing fields
  - ✅ Adding/removing photos updates status accurately upon navigating to Finalize

### ✅ Bug #5 Fix - Repairer Defaults and Rate Recalculation
- **ISSUE**: Selecting a repairer did not auto-populate defaults or recalc totals; manual rate edits required “Update Rates”
- **ROOT CAUSE**: `RatesAndRepairerConfiguration` called only `onUpdateRepairer` and not `onUpdateRates`
- **SOLUTION**: Call `onUpdateRates` on selection and Quick Add; auto-apply rates on blur; loading overlay; immediate persistence
- **IMPLEMENTATION**:
  - `src/lib/components/assessment/RatesAndRepairerConfiguration.svelte:117–136, 166–177, 306–314, 328–336, 349–357, 379–388, 403–411, 426–434, 449–457`
  - `src/lib/components/assessment/EstimateTab.svelte:620–644, 668–669, 1258–1265`
- **VERIFICATION**:
  - ✅ Defaults propagate; totals recalc instantly; brief loading overlay; changes persist

### ✅ Bug #7 Fix - Supabase Auth Connection Timeout Resilience
- **ISSUE**: Force finalize action and dashboard counts intermittently fail with `UND_ERR_CONNECT_TIMEOUT` (10s) to Supabase endpoints
- **ROOT CAUSE**: Transient network/connectivity timeouts during server-side calls; single-attempt requests cause page/action failure
- **SOLUTION**: Add retry with exponential backoff and page-level fallbacks
  - Force finalize: 3 attempts with 500ms→1000ms→2000ms backoff
  - Dashboard: wrap counts with retry and `Promise.allSettled` to render partial data instead of failing
- **IMPLEMENTATION**:
  - `src/lib/components/assessment/FinalizeTab.svelte:187–216` (force finalize retry)
  - `src/routes/(app)/dashboard/+page.server.ts:32–45` (retry helper + fallbacks)
- **VERIFICATION**:
  - ✅ Force finalize succeeds under transient timeouts; errors surface only after 3 failed attempts
  - ✅ Dashboard loads even if one or more counts time out, defaulting those counts to 0

### ✅ Bug #10 Fix - Additionals Letter: Removed Lines and Totals Explanation (Nov 20, 2025)
- **ISSUE**: Removed original lines appeared in both "APPROVED ADDITIONALS" and "REMOVED ORIGINAL LINES"; footer text incorrectly implied removals were excluded from payable total.
- **SOLUTION**:
  - Approved table now filters strictly to `status === 'approved' && action === 'added'`.
  - Clarified that approved removals and reversals are included as negative adjustments in totals.
  - Footer note simplified to only mention removed lines being included as negative adjustments (declined note removed).
- **FILES**:
  - `src/lib/templates/additionals-letter-template.ts`
- **DOCS**:
  - `.agent/System/additionals_letter_template_fix_nov_20_2025.md`

### ✅ Additionals UX - Pending-Only Inline Editing
- **FEATURE**: Enable inline editing for Additionals line items when status is `pending`
  - Editable fields: description, Part Nett (N), S&A hours (N/R/P/B), Labour hours (N/R/A), Paint panels (N/R/P/B), Outwork Nett (O)
  - Save on blur/Enter; recalculates derived costs and `total` using locked Additionals rates/markups
  - Approved totals card remains unchanged until item is approved
- **IMMUTABILITY**: Approved/declined/removed/reversal entries remain read-only; adjustments happen via reversal entries
- **IMPLEMENTATION**:
  - `src/lib/services/additionals.service.ts:100–203` — `updatePendingLineItem()`
  - `src/lib/components/assessment/AdditionalsTab.svelte:2,47–85,579–736` — inline edit controls and handlers
- **AUDIT**: Logs `additionals_line_item_updated_pending` with old/new totals
- **IMPACT**: Faster workflows for pending additions while preserving immutable audit trail for finalized states
