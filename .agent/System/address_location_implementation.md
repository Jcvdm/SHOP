# Address & Location Capturing Implementation

**Last Updated**: November 28, 2025 (Feature C001: Vehicle Location Capturing)
**Status**: Production Ready - Fully Integrated

---

## Overview

This document describes the complete Address & Location Capturing feature (C001) that enables users to capture structured address information across multiple forms in ClaimTech with Google Places API integration.

The feature provides:
- Modern autocomplete address input with Google Places API
- Structured address storage (street, suburb, city, province, postal code, coordinates)
- Backward compatibility with legacy text-based address fields
- Integration across new request, edit request, and appointment scheduling flows
- Fallback to manual entry when autocomplete is unavailable

---

## Architecture

### Database Schema

#### Requests Table Extensions
Added to `requests` table for incident location:
- `incident_street_address` (TEXT) - Street address component
- `incident_suburb` (TEXT) - Suburb/locality component
- `incident_city` (TEXT) - City/town component
- `incident_province` (TEXT) - Province/state component
- `incident_postal_code` (TEXT) - Postal code component
- `incident_latitude` (NUMERIC) - Latitude from Google Places
- `incident_longitude` (NUMERIC) - Longitude from Google Places
- `incident_place_id` (TEXT) - Google Places ID for geocoding

Also includes for owner address:
- `owner_street_address` (TEXT)
- `owner_suburb` (TEXT)
- `owner_city` (TEXT)
- `owner_province` (TEXT)
- `owner_postal_code` (TEXT)
- `owner_latitude` (NUMERIC)
- `owner_longitude` (NUMERIC)
- `owner_place_id` (TEXT)

#### Appointments Table Extensions
Added to `appointments` table for appointment location:
- `location_street_address` (TEXT)
- `location_suburb` (TEXT)
- `location_city` (TEXT)
- `location_province` (TEXT)
- `location_postal_code` (TEXT)
- `location_latitude` (NUMERIC)
- `location_longitude` (NUMERIC)
- `location_place_id` (TEXT)

**Legacy Columns** (maintained for backward compatibility):
- `incident_location` (TEXT) - Legacy text-only field
- `owner_address` (TEXT) - Legacy text-only field
- `location_address` (TEXT) - Legacy text-only field (appointments)

---

## Components

### AddressInput.svelte

**Location**: `src/lib/components/forms/AddressInput.svelte`
**Purpose**: Modern autocomplete address input with Google Places integration

**Props Interface**:
```typescript
interface AddressInputProps {
  placeholder?: string;              // Autocomplete placeholder text
  initialValue?: string;             // Pre-filled address value
  onAddressSelected: (addr: StructuredAddress) => void;  // Callback on selection
  disabled?: boolean;                // Disable input
  country?: string;                  // ISO-2 country code (default: 'ZA')
}
```

**Features**:
- Google Places autocomplete with session token caching
- Full address extraction from Google Places response
- Manual entry fallback (parse raw text into best-guess components)
- South Africa-only by default (configurable)
- Loading states during API calls
- Error handling with graceful fallbacks
- Address validation feedback

**Key Methods**:
- `onInput()` - Triggers autocomplete predictions
- `onSelectPlace()` - Extracts full address from selection
- `parseManualAddress()` - Fallback parser for manual entry
- Caching of Google Places session tokens for cost optimization

---

### AddressDisplay.svelte

**Location**: `src/lib/components/forms/AddressDisplay.svelte`
**Purpose**: Consistent rendering of structured addresses

**Props Interface**:
```typescript
interface AddressDisplayProps {
  address: StructuredAddress | null;
  compact?: boolean;                 // Single line vs multi-line
  showCoordinates?: boolean;         // Include lat/lng
}
```

**Features**:
- Flexible display format (compact single-line or multi-line)
- Optional coordinate display
- Graceful handling of partial addresses
- Fallback to legacy text field if no structured address

---

## Type Definitions

### StructuredAddress Type

**Location**: `src/lib/types/address.ts`

```typescript
export interface StructuredAddress {
  street_address?: string;      // Street address line
  suburb?: string;              // Suburb/locality
  city?: string;                // City/town
  province?: string;            // Province/state
  postal_code?: string;         // Postal code
  latitude?: number;            // Decimal latitude
  longitude?: number;           // Decimal longitude
  place_id?: string;            // Google Places ID
}
```

---

## Utilities

### google-places.ts

**Location**: `src/lib/utils/google-places.ts`
**Purpose**: Google Places API utilities and session token management

**Exports**:
- `loadGooglePlacesAPI()` - Dynamic script loader with caching
- `initializeAutocomplete()` - Create autocomplete session
- `getSessionToken()` - Retrieve or create session token
- Type definitions for Google Places API responses

**Session Token Strategy**:
- Reuses session tokens across multiple requests (cost optimization)
- Auto-creates new sessions when needed
- Cached in module scope to persist across component instances

---

## Services

### address.service.ts

**Location**: `src/lib/services/address.service.ts`
**Purpose**: Address parsing, validation, and utility functions

**Key Functions**:
- `parseGooglePlacesAddress()` - Extract components from Google response
- `parseManualAddress()` - Best-effort parsing of free-text entry
- `getAddressString()` - Combine components into display string
- `validateAddressComponents()` - Validate required fields
- `normalizeProvinceCode()` - Handle province abbreviations

---

## Integration Points

### 1. Request Creation (New Request)

**File**: `src/routes/(app)/requests/new/+page.svelte`

**Changes**:
- Integrated AddressInput in IncidentInfoSection for incident location
- Integrated AddressInput in OwnerInfoSection for owner address
- Structured address stored in request creation payload
- Legacy `incident_location` field deprecated (uses structured data)

**Form Section**:
```svelte
<IncidentInfoSection
  onIncidentAddressChange={(addr) => request.incident = addr}
  // ... other props
/>
```

---

### 2. Request Editing

**File**: `src/routes/(app)/requests/[id]/edit/+page.svelte`

**Changes**:
- Load existing structured address fields from database
- Pre-populate AddressInput components with previous selections
- Update structured fields on form submission
- Backward compatibility: merge structured data with legacy fields

---

### 3. Appointment Scheduling (Schedule Modal)

**File**: `src/routes/(app)/work/appointments/+page.svelte`

**Changes**:
- Added AddressInput in appointment scheduling modal
- Captures location_* fields for appointment location
- Updates appointment record with structured address

---

### 4. Appointment Rescheduling

**File**: `src/routes/(app)/work/appointments/[id]/+page.svelte`

**Changes**:
- Reschedule modal uses AddressInput for location updates
- Pre-loads existing appointment location address
- Updates location_* fields on reschedule

---

## Helper Functions in request.ts

**Location**: `src/lib/types/request.ts`

Helper functions convert between flat database columns and `StructuredAddress` type:

```typescript
// Convert request fields to StructuredAddress
export function getIncidentAddress(request: Request): StructuredAddress {
  return {
    street_address: request.incident_street_address,
    suburb: request.incident_suburb,
    city: request.incident_city,
    province: request.incident_province,
    postal_code: request.incident_postal_code,
    latitude: request.incident_latitude,
    longitude: request.incident_longitude,
    place_id: request.incident_place_id,
  };
}

// Update request with structured address
export function setIncidentAddress(
  request: Request,
  address: StructuredAddress
): Request {
  return {
    ...request,
    incident_street_address: address.street_address,
    incident_suburb: address.suburb,
    // ... etc
  };
}

// Similar helpers for owner_address and appointment location_address
```

---

## Environment Configuration

### Google Places API Key

**Required Environment Variable**:
```
VITE_GOOGLE_PLACES_API_KEY=your_api_key_here
```

**Setup Steps**:
1. Create Google Cloud project
2. Enable Places API (Google Maps Platform)
3. Create API key with restrictions:
   - Application restrictions: Web applications
   - API restrictions: Maps JavaScript API, Places API
4. Add key to `.env.local` or deployment platform secrets

**Security Considerations**:
- Key is exposed to frontend (this is expected behavior for Places API)
- Restrict key to domain in Google Cloud Console to prevent abuse
- Session tokens reduce API costs (1 session = multiple predictions + selection)

---

## Data Flow

### Address Selection Flow

1. **User Types Address** in AddressInput
   - `onInput()` event triggered
   - Google Places predictions API called
   - List of matching locations displayed

2. **User Selects from List**
   - `onSelectPlace()` handler fires
   - Full place details fetched from Google
   - All address components extracted
   - `onAddressSelected()` callback invoked with StructuredAddress

3. **Parent Component Updates**
   - Form state updated with selected address
   - AddressDisplay component renders selected address
   - Form ready for submission

4. **Form Submission**
   - StructuredAddress fields flattened and submitted
   - Database columns updated (incident_street_address, etc.)
   - Legacy field (incident_location) can optionally fall back to structured data

### Fallback (Manual Entry)

If user types freely without selecting from autocomplete:
1. On blur/Enter, `parseManualAddress()` attempts to parse text
2. Returns best-guess StructuredAddress with available components
3. If parsing fails, only `street_address` field is populated
4. User can edit individual components after manual entry

---

## Backward Compatibility

The implementation maintains backward compatibility with legacy address fields:

**Reading**:
- Components check for structured fields first
- Fall back to legacy text fields if structured fields empty
- Display logic handles partial addresses gracefully

**Writing**:
- Structured fields are primary storage
- Legacy fields can be populated from structured data if needed
- Existing legacy data is not automatically migrated

**Migration Path**:
- New features use structured addresses exclusively
- Legacy fields kept for existing data and reporting
- Gradual migration possible over time (populate legacy from structured)

---

## Related Documentation

- **[AddressInput Component](../SOP/creating-components.md)** - Component creation patterns
- **[Form Integration](../System/project_architecture.md)** - Form architecture patterns
- **[Database Schema](../System/database_schema.md)** - Table structure reference
- **[Requests Service](../SOP/working_with_services.md)** - Service layer patterns

---

## API Keys & Secrets

### Google Places API Configuration

**Service**: Google Cloud Platform - Maps Platform
**Endpoint**: `maps.googleapis.com/maps/api/js`

**Key Features Used**:
- Places Autocomplete Service
- Place Details (to get full address)
- Session Tokens (for cost optimization)

**Cost Optimization**:
- Session tokens issued per location capture session
- One session token handles predictions + place selection
- Reduces per-request cost vs individual prediction + details calls

---

## Testing Checklist

- [ ] New Request: Enter address in Incident Info → autocomplete appears
- [ ] New Request: Select address from autocomplete → structured address captured
- [ ] New Request: Type address without selection → manual entry parsed
- [ ] Edit Request: Load existing address → pre-populated in AddressInput
- [ ] Edit Request: Change address → updates correctly
- [ ] Appointments: Schedule modal shows address input → location_* fields updated
- [ ] Appointments: Reschedule modal shows existing location → can edit
- [ ] Fallback: Manual address entry without autocomplete → street_address populated
- [ ] Backward Compat: Legacy incident_location field still readable
- [ ] Google Places API: Predictions working for South Africa addresses

---

## Known Limitations

1. **Google Places API Dependency**: Feature requires working Google Places API key
   - Without API key, falls back to manual text entry
   - Manual parsing provides best-effort address components

2. **Country Restriction**: Currently South Africa only (configurable in AddressInput)
   - Can be extended to other countries if needed
   - Requires Google Places API access for target country

3. **Coordinates Precision**: Coordinates from Google Places are approximate
   - Suitable for location context, not precise GPS tracking
   - Typically accurate to street/suburb level

---

## Future Enhancements

1. **Map Integration**: Show map preview of selected location
2. **GPS Capture**: Option to use device GPS for precise location
3. **Address Validation**: Server-side validation of address completeness
4. **Bulk Address Import**: Import addresses from CSV/Excel
5. **Multi-language Support**: Support address entry in multiple languages
6. **Address History**: Remember frequently used addresses
7. **Geocoding Reverse**: Show address from lat/lng coordinates

---

## Troubleshooting

### Address Input Not Showing Predictions
- Verify Google Places API key in environment
- Check browser console for API errors
- Confirm API restrictions allow your domain
- Try manual entry as fallback

### Incorrect Address Components Extracted
- Manual parser is best-effort for free text
- Recommend using autocomplete selection for accurate parsing
- Some addresses may have ambiguous components (city vs suburb)

### Google Places API Errors
- Check quota limits in Google Cloud Console
- Verify API key has necessary permissions
- Check domain whitelist in API restrictions

---

## Files Summary

**New Files Created**:
- `src/lib/components/forms/AddressInput.svelte` - Address autocomplete component
- `src/lib/components/forms/AddressDisplay.svelte` - Address display component
- `src/lib/types/address.ts` - StructuredAddress type definitions
- `src/lib/utils/google-places.ts` - Google Places API utilities
- `src/lib/services/address.service.ts` - Address parsing and validation

**Modified Files**:
- `src/lib/types/request.ts` - Added address helper functions
- `src/lib/types/appointment.ts` - Added location address fields
- `src/lib/components/forms/IncidentInfoSection.svelte` - Uses AddressInput
- `src/lib/components/forms/OwnerInfoSection.svelte` - Uses AddressInput
- `src/routes/(app)/requests/new/+page.svelte` - Integrated AddressInput
- `src/routes/(app)/requests/[id]/edit/+page.svelte` - Integrated AddressInput
- `src/routes/(app)/work/appointments/+page.svelte` - Schedule modal integration
- `src/routes/(app)/work/appointments/[id]/+page.svelte` - Reschedule modal integration

**Database Migrations**:
- `add_structured_addresses_to_requests` - Added incident and owner address fields
- `enhance_appointments_addresses` - Added location address fields

---

**Maintained by**: ClaimTech Engineering Team
**Last Reviewed**: November 28, 2025
