# Database Schema

## Overview

The ClaimTech database is built on **PostgreSQL** via **Supabase**. The schema consists of **31 tables** organized around the **assessment-centric architecture** (Jan 2025): Requests → Assessments (stage pipeline) → Documents → Archive.

All tables have:
- UUID primary keys (`id`)
- `created_at` and `updated_at` timestamps (auto-managed via triggers)
- Row Level Security (RLS) enabled
- Appropriate indexes for performance

---

## Custom Database Types

### `assessment_stage` (ENUM)
10-stage pipeline for assessment workflow (Migration 068, Jan 2025):
```sql
CREATE TYPE assessment_stage AS ENUM (
  'request_submitted',      -- 1. Initial request created (assessment created here)
  'request_reviewed',       -- 2. Admin reviewed request
  'inspection_scheduled',   -- 3. Inspection scheduled
  'appointment_scheduled',  -- 4. Appointment created (appointment_id linked)
  'assessment_in_progress', -- 5. Engineer started assessment
  'estimate_review',        -- 6. Estimate under review
  'estimate_sent',          -- 7. Estimate sent to client
  'estimate_finalized',     -- 8. Estimate finalized
  'frc_in_progress',        -- 9. Final Repair Costing started
  'archived',               -- 10a. Completed
  'cancelled'               -- 10b. Cancelled at any stage
);
```

**Used in:** `assessments.stage` column (NOT NULL, DEFAULT 'request_submitted')

**Query pattern:** All list pages query assessments by stage (not status)

### `assessment_result_type` (ENUM)
Final assessment outcome:
```sql
CREATE TYPE assessment_result_type AS ENUM (
  'repair',      -- Vehicle repairable
  'code_2',      -- Code 2 write-off
  'code_3',      -- Code 3 write-off
  'total_loss'   -- Total loss
);
```

**Used in:** `assessment_frc.assessment_result` column

---

## Core Entity Tables

### `clients`
Insurance companies or private clients who request assessments.

**Columns:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `type` (TEXT, CHECK: 'insurance' | 'private')
- `contact_name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `address` (TEXT)
- `city` (TEXT)
- `postal_code` (TEXT)
- `notes` (TEXT)
- `is_active` (BOOLEAN, DEFAULT true)
- `borderline_writeoff_percentage` (DECIMAL, DEFAULT 65.00) - Percentage threshold for borderline write-off
- `total_writeoff_percentage` (DECIMAL, DEFAULT 70.00) - Percentage threshold for total write-off
- `salvage_percentage` (DECIMAL, DEFAULT 28.00) - Percentage for salvage value calculation
- `assessment_terms_and_conditions` (TEXT, NULL) - Client-specific T&Cs for Assessment Reports. If set, overrides company default. Falls back to `company_settings.assessment_terms_and_conditions` if NULL.
- `estimate_terms_and_conditions` (TEXT, NULL) - Client-specific T&Cs for Estimate documents. If set, overrides company default. Falls back to `company_settings.estimate_terms_and_conditions` if NULL.
- `frc_terms_and_conditions` (TEXT, NULL) - Client-specific T&Cs for FRC Reports. If set, overrides company default. Falls back to `company_settings.frc_terms_and_conditions` if NULL.
- `created_at`, `updated_at`

**Indexes:**
- `idx_clients_type` on `type`
- `idx_clients_active` on `is_active`
- `idx_clients_name` on `name`

---

### `engineers`
Field engineers who perform vehicle assessments.

**Columns:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `email` (TEXT, UNIQUE, NOT NULL)
- `phone` (TEXT)
- `specialization` (TEXT)
- `province` (TEXT) - Operating province
- `is_active` (BOOLEAN, DEFAULT true)
- `company_name` (TEXT) - Company affiliation
- `company_type` (TEXT, CHECK: 'internal' | 'external') - Internal or external engineer
- `auth_user_id` (UUID) - Links to `auth.users` table for authentication and role-based access control
- `created_at`, `updated_at`

**Indexes:**
- `idx_engineers_active` on `is_active`
- `idx_engineers_email` on `email`

**Note:** Engineers can have associated user accounts in `user_profiles` table.

---

### `repairers`
Repair shops that will perform vehicle repairs.

**Columns:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `contact_name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `address` (TEXT)
- `city` (TEXT)
- `province` (TEXT)
- `postal_code` (TEXT)
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at`, `updated_at`

---

### `requests`
Initial claim or inspection requests from clients.

**Columns:**
- `id` (UUID, PK)
- `request_number` (TEXT, UNIQUE, NOT NULL) - Auto-generated unique identifier
- `client_id` (UUID, FK → clients)
- `type` (TEXT, CHECK: 'insurance' | 'private')
- `claim_number` (TEXT)
- `status` (TEXT, CHECK: 'draft' | 'submitted' | 'in_progress' | 'completed' | 'cancelled')
- `description` (TEXT)

**Incident Details:**
- `date_of_loss` (DATE)
- `insured_value` (DECIMAL)
- `incident_type` (TEXT)
- `incident_description` (TEXT)
- `incident_location` (TEXT)

**Vehicle Information:**
- `vehicle_make`, `vehicle_model`, `vehicle_year` (INTEGER)
- `vehicle_vin`, `vehicle_registration`, `vehicle_color`
- `vehicle_mileage` (INTEGER)
- `vehicle_province` (TEXT) - Province where vehicle is registered

**Owner Details:**
- `owner_name`, `owner_phone`, `owner_email`, `owner_address`

**Third Party Details:**
- `third_party_name`, `third_party_phone`, `third_party_email`
- `third_party_insurance`

**Workflow:**
- `current_step` (TEXT, CHECK: 'request' | 'assessment' | 'quote' | 'approval')
- `assigned_engineer_id` (UUID, FK → engineers)
- `created_at`, `updated_at`

**Indexes:**
- `idx_requests_client` on `client_id`
- `idx_requests_status` on `status`
- `idx_requests_step` on `current_step`
- `idx_requests_engineer` on `assigned_engineer_id`
- `idx_requests_number` on `request_number`

---

### `request_tasks`
Tasks associated with requests for workflow tracking.

**Columns:**
- `id` (UUID, PK)
- `request_id` (UUID, FK → requests, ON DELETE CASCADE)
- `step` (TEXT, CHECK: 'request' | 'assessment' | 'quote' | 'approval')
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `status` (TEXT, CHECK: 'pending' | 'in_progress' | 'completed' | 'blocked')
- `assigned_to` (UUID)
- `due_date` (DATE)
- `completed_at` (TIMESTAMPTZ)
- `created_at`, `updated_at`

---

### `inspections`
Inspection records created from requests.

**Columns:**
- `id` (UUID, PK)
- `inspection_number` (TEXT, UNIQUE, NOT NULL)
- `request_id` (UUID, FK → requests, NOT NULL)
- `client_id` (UUID, FK → clients, NOT NULL)
- `type` (TEXT, CHECK: 'insurance' | 'private')
- `claim_number` (TEXT)
- `request_number` (TEXT, NOT NULL)
- `status` (TEXT, CHECK: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled', DEFAULT 'pending')

**Vehicle Information (duplicated from request for quick access):**
- `vehicle_make`, `vehicle_model`, `vehicle_year` (INTEGER)
- `vehicle_vin`, `vehicle_registration`, `vehicle_color`
- `vehicle_mileage` (INTEGER)
- `vehicle_province` (TEXT)

**Scheduling:**
- `scheduled_date` (TIMESTAMPTZ)
- `inspection_location` (TEXT)
- `assigned_engineer_id` (UUID, FK → engineers)

**Acceptance:**
- `accepted_by` (UUID) - Engineer who accepted the inspection
- `accepted_at` (TIMESTAMPTZ, DEFAULT now())

**Notes:**
- `notes` (TEXT)

**Timestamps:**
- `created_at`, `updated_at`

---

### `appointments`
Scheduled appointments for inspections - supports both in-person and digital assessments.

**Columns:**
- `id` (UUID, PK)
- `appointment_number` (TEXT, UNIQUE, NOT NULL)
- `inspection_id` (UUID, FK → inspections, NOT NULL)
- `request_id` (UUID, FK → requests, NOT NULL)
- `client_id` (UUID, FK → clients, NOT NULL)
- `engineer_id` (UUID, FK → engineers)

**Appointment Type:**
- `appointment_type` (TEXT, CHECK: 'in_person' | 'digital') - Physical inspection or remote assessment
- `duration_minutes` (INTEGER, DEFAULT 60) - Expected duration in minutes

**Date & Time:**
- `appointment_date` (TIMESTAMPTZ) - Date and time of the appointment
- `appointment_time` (TIME)

**Location (for in-person appointments):**
- `location_address` (TEXT)
- `location_city` (TEXT)
- `location_province` (TEXT)
- `location_notes` (TEXT)

**Status:**
- `status` (TEXT, CHECK: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled', DEFAULT 'scheduled')

**Vehicle Information (quick reference):**
- `vehicle_make`, `vehicle_model`, `vehicle_year` (INTEGER)
- `vehicle_registration` (TEXT)

**Notes & Instructions:**
- `notes` (TEXT)
- `special_instructions` (TEXT)

**Audit:**
- `created_by` (TEXT)
- `created_at`, `updated_at`

**Completion & Cancellation:**
- `completed_at` (TIMESTAMPTZ)
- `cancelled_at` (TIMESTAMPTZ)
- `cancellation_reason` (TEXT)

**Reschedule Tracking (Migration 076 - Jan 2025):**
- `rescheduled_from_date` (TIMESTAMPTZ) - Original appointment date before most recent reschedule
- `reschedule_count` (INTEGER, DEFAULT 0) - Number of times appointment has been rescheduled
- `reschedule_reason` (TEXT) - Reason for most recent reschedule

**Key Features:**
- **Cancellation with Fallback**: Cancelling appointment automatically reverts assessment stage to `inspection_scheduled`
- **Smart Reschedule Detection**: Only increments count when date/time actually changes (not for location/notes updates)
- **Comprehensive Tracking**: Preserves original date, counts reschedules, documents reasons
- **Audit Trail**: All cancellations and reschedules logged in `audit_logs`

---

## Assessment Tables

### `assessments`
Main assessment records for vehicle inspections. **Assessment-centric architecture** (Jan 2025): Assessments are created when requests are submitted (not at "Start Assessment"), serving as the single source of truth.

**Core Columns:**
- `id` (UUID, PK)
- `assessment_number` (TEXT, UNIQUE, NOT NULL) - Format: ASM-YYYY-NNN
- `request_id` (UUID, FK → requests, NOT NULL, UNIQUE) - One assessment per request
- `appointment_id` (UUID, FK → appointments, **NULL initially**) - Linked when appointment created (stage 4+)
- `inspection_id` (UUID, FK → inspections, **NULL initially**) - Linked when inspection scheduled (stage 3+)

**Stage-Based Foreign Key Lifecycle:**

Nullable foreign keys populate at different stages. **CRITICAL for sidebar badge queries**:

| Stage | inspection_id | appointment_id | Sidebar/Query Should Join |
|-------|--------------|----------------|--------------------------|
| 1. request_submitted | NULL ❌ | NULL ❌ | `requests` (if engineer filtering) |
| 2. request_reviewed | NULL ❌ | NULL ❌ | `requests` (if engineer filtering) |
| 3. inspection_scheduled | **SET** ✓ | NULL ❌ | **`inspections`** |
| 4. appointment_scheduled | SET ✓ | **SET** ✓ | **`appointments`** |
| 5+ assessment_in_progress+ | SET ✓ | SET ✓ | **`appointments`** |

**Common Bug:** Joining with appointments table at `inspection_scheduled` stage (stage 3) causes INNER JOIN to fail because `appointment_id` is NULL. Must join with `inspections` table instead.

**Example:**
```typescript
// ❌ WRONG - Returns 0 at inspection_scheduled stage
.select('*, appointments!inner(engineer_id)', { count: 'exact', head: true })
.eq('stage', 'inspection_scheduled');
// appointment_id is NULL → INNER JOIN fails

// ✅ CORRECT - Returns actual count at inspection_scheduled stage
.select('*, inspections!inner(assigned_engineer_id)', { count: 'exact', head: true })
.eq('stage', 'inspection_scheduled');
// inspection_id is SET → INNER JOIN works
```

**References:**
- [Implementing Badge Counts SOP](../SOP/implementing_badge_counts.md) - Complete badge query patterns
- [Working with Assessment-Centric Architecture](../SOP/working_with_assessment_centric_architecture.md#common-sidebar-badge-mistakes)

**Stage-Based Pipeline (10 stages):**
- `stage` (assessment_stage ENUM, NOT NULL, DEFAULT 'request_submitted') - Current pipeline stage
  - `request_submitted` → Initial request created (assessment created here)
  - `request_reviewed` → Admin reviewed request
  - `inspection_scheduled` → Inspection scheduled (inspection_id linked)
  - `appointment_scheduled` → Appointment created (appointment_id linked)
  - `assessment_in_progress` → Engineer started assessment
  - `estimate_review` → Estimate under review
  - `estimate_sent` → Estimate sent to client
  - `estimate_finalized` → Estimate finalized
  - `frc_in_progress` → Final Repair Costing started
  - `archived` or `cancelled` → Completed or cancelled

**Legacy Status Field (deprecated, kept for backward compatibility):**
- `status` (TEXT, CHECK: 'in_progress' | 'completed' | 'submitted' | 'archived' | 'cancelled')

**Progress Tracking:**
- `current_tab` (TEXT, DEFAULT 'identification')
- `tabs_completed` (JSONB, DEFAULT '[]') - Array of completed tab names

**Timestamps:**
- `started_at`, `completed_at`, `submitted_at`, `cancelled_at`
- `created_at`, `updated_at`

**Document Generation:**
- `report_pdf_url`, `report_pdf_path`
- `estimate_pdf_url`, `estimate_pdf_path`
- `photos_pdf_url`, `photos_pdf_path`
- `photos_zip_url`, `photos_zip_path`
- `documents_generated_at` (TIMESTAMPTZ)
- `report_number` (TEXT)
- `assessor_name`, `assessor_contact`, `assessor_email`

**Estimate Finalization (rates frozen for FRC consistency):**
- `estimate_finalized_at` (TIMESTAMPTZ)
- `finalized_labour_rate` (DECIMAL) - Labour rate (per hour) frozen at finalization
- `finalized_paint_rate` (DECIMAL) - Paint rate (per panel) frozen at finalization
- `finalized_oem_markup` (DECIMAL) - OEM parts markup percentage frozen at finalization
- `finalized_alt_markup` (DECIMAL) - Alternative parts markup percentage frozen at finalization
- `finalized_second_hand_markup` (DECIMAL) - Second-hand parts markup percentage frozen at finalization
- `finalized_outwork_markup` (DECIMAL) - Outwork markup percentage frozen at finalization

**Cancellation:**
- `cancelled_at` (TIMESTAMPTZ)

**Constraints:**
- `uq_assessments_request` - UNIQUE constraint on `request_id` (one assessment per request)
- `require_appointment_when_scheduled` - CHECK constraint ensuring `appointment_id` is NOT NULL for stages 4-9

**Indexes:**
- `idx_assessments_stage` on `stage` (PRIMARY - all list pages query by stage)
- `idx_assessments_request_id` on `request_id`
- `idx_assessments_appointment` on `appointment_id`
- `idx_assessments_inspection` on `inspection_id`
- `idx_assessments_status` on `status` (legacy, deprecated)

---

### `assessment_vehicle_identification`
Vehicle identification details and photos (1:1 with assessments).

**Columns:**
- `id` (UUID, PK)
- `assessment_id` (UUID, FK → assessments, UNIQUE, NOT NULL)

**Vehicle Details:**
- `registration_number`, `vin_number`, `engine_number`
- `license_disc_expiry` (DATE)
- `make`, `model`, `year` (INTEGER)
- `color`, `mileage` (INTEGER)
- `transmission` (TEXT, CHECK: 'automatic' | 'manual')

**Photos:**
- `registration_photo_url`, `vin_photo_url`
- `engine_number_photo_url`, `license_disc_photo_url`
- `driver_license_photo_url`
- `driver_license_number`

---

### `assessment_360_exterior`
360-degree exterior photos and condition (1:1 with assessments).

**Columns:**
- `id` (UUID, PK)
- `assessment_id` (UUID, FK → assessments, UNIQUE, NOT NULL)

**Condition:**
- `overall_condition` (TEXT, CHECK: 'excellent' | 'very_good' | 'good' | 'fair' | 'poor' | 'very_poor')
- `vehicle_color` (TEXT)

**Legacy Photo Columns (REMOVED in Migration 081):**
- ~~`front_photo_url`, `front_left_photo_url`, `left_photo_url`~~
- ~~`rear_left_photo_url`, `rear_photo_url`, `rear_right_photo_url`~~
- ~~`right_photo_url`, `front_right_photo_url`~~
- ~~`additional_photos` (JSONB)~~

**Note:** All exterior photos are now managed through the `assessment_exterior_360_photos` table using the unified photo panel pattern.

---

### `assessment_exterior_360_photos`
Exterior 360-degree photos for assessments (1:N with assessments). Created in Migration 079 (Jan 2025) to replace legacy photo URL columns in `assessment_360_exterior`.

**Architecture:** Unified photo panel pattern - single table for all exterior photos with upload zone and gallery in one component.

**Columns:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `assessment_id` (UUID, FK → assessments, ON DELETE CASCADE, NOT NULL)
- `photo_url` (TEXT, NOT NULL) - Public URL of the photo in Supabase Storage
- `photo_path` (TEXT, NOT NULL) - Storage path of the photo for deletion
- `label` (TEXT) - Optional label/description for the photo (e.g., "Close-up of damage", "Wheel detail")
- `display_order` (INTEGER, DEFAULT 0) - Order for displaying photos (0-based)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

**Indexes:**
- `idx_exterior_360_photos_assessment_id` on `assessment_id`
- `idx_exterior_360_photos_display_order` on `(assessment_id, display_order)`

**RLS:** ✅ ENABLED - Policy: "Allow all operations for authenticated users"

**Related Components:**
- `Exterior360PhotosPanel.svelte` - Unified photo upload/gallery component
- `exterior-360-photos.service.ts` - CRUD service layer
- `Exterior360Tab.svelte` - Main tab component (legacy 8-position panel removed)

**Validation:** Requires at least 4 exterior photos (replaces old requirement of front, rear, left, right positions)

---

### `assessment_tyres`
Individual tyre inspection records (1:N with assessments).

**Columns:**
- `id` (UUID, PK)
- `assessment_id` (UUID, FK → assessments, NOT NULL)
- `position` (TEXT, NOT NULL) - e.g., 'front_left', 'front_right', 'rear_left', 'rear_right'
- `position_label` (TEXT)

**Tyre Details:**
- `tyre_make`, `tyre_size`, `load_index`, `speed_rating`
- `tread_depth_mm` (DECIMAL)
- `condition` (TEXT, CHECK: 'excellent' | 'good' | 'fair' | 'poor' | 'replace')
- `notes` (TEXT)

**Photos:** See `assessment_tyre_photos` table (unlimited photos per tyre)

**Index:** `idx_assessment_tyres_assessment` on `assessment_id`

**Related Components:**
- `TyrePhotosPanel.svelte` - Photo upload/gallery component
- `tyre-photos.service.ts` - CRUD service layer
- `TyresTab.svelte` - Main tab component

---

### `assessment_tyre_photos`
Photos for individual tyres (1:N with assessment_tyres). Follows unified photo panel pattern.

**Columns:**
- `id` (UUID, PK)
- `tyre_id` (UUID, FK → assessment_tyres, NOT NULL, ON DELETE CASCADE)
- `assessment_id` (UUID, FK → assessments, NOT NULL, ON DELETE CASCADE)
- `photo_url` (TEXT, NOT NULL) - URL to the photo in storage
- `photo_path` (TEXT, NOT NULL) - Path to the photo in storage
- `label` (TEXT) - Photo label (e.g., 'Face/Sidewall', 'Tread Pattern', 'Measurement', 'Damage')
- `display_order` (INTEGER, DEFAULT 0) - Order for displaying photos in gallery
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

**Indexes:**
- `idx_assessment_tyre_photos_tyre` on `tyre_id`
- `idx_assessment_tyre_photos_assessment` on `assessment_id`
- `idx_assessment_tyre_photos_display_order` on `(tyre_id, display_order)`

**RLS:** ✅ ENABLED - Policy: "Allow all operations for authenticated users"

**Triggers:** `update_assessment_tyre_photos_updated_at` - Auto-updates `updated_at` on modification

---

### `assessment_interior_mechanical`
Interior condition and mechanical systems check (1:1 with assessments).

**Columns:**
- `id` (UUID, PK)
- `assessment_id` (UUID, FK → assessments, UNIQUE, NOT NULL)

**Photos:**
- `engine_bay_photo_url`, `battery_photo_url`
- `oil_level_photo_url`, `coolant_photo_url`
- `mileage_photo_url`
- `interior_front_photo_url`, `interior_rear_photo_url`
- `dashboard_photo_url`
- `gear_lever_photo_url` (TEXT) - Photo of the gear lever/shifter

**Readings:**
- `mileage_reading` (INTEGER)

**Vehicle Status:**
- `vehicle_has_power` (BOOLEAN) - Whether the vehicle has electrical power (battery connected and working)

**Transmission:**
- `transmission_type` (TEXT, CHECK: 'automatic' | 'manual') - Type of transmission

**Condition:**
- `interior_condition` (TEXT, CHECK: 'excellent' | 'very_good' | 'good' | 'fair' | 'poor' | 'very_poor')

**Systems Check:**
- `srs_system` (TEXT, CHECK: 'operational' | 'warning_light' | 'not_working' | 'deployed') - SRS (airbag) system status
- `steering`, `brakes`, `handbrake` (TEXT, CHECK: 'working' | 'not_working' | 'issues')

**Notes:**
- `mechanical_notes`, `interior_notes`

---

### `assessment_accessories`
Vehicle accessories and aftermarket additions (1:N with assessments).

**Columns:**
- `id` (UUID, PK)
- `assessment_id` (UUID, FK → assessments, NOT NULL)
- `accessory_type` (TEXT, NOT NULL) - e.g., 'mags', 'tow_bar', 'canopy'
- `custom_name` (TEXT) - For 'custom' accessory type
- `condition` (TEXT, CHECK: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged')
- `value` (NUMERIC(12,2), NULL) - Single monetary value applied equally to Trade/Market/Retail totals (Migration 20251129)
- `notes`, `photo_url`

**Index:** `idx_assessment_accessories_assessment` on `assessment_id`

**Notes:**
- Single value model: Each accessory has one value (not three separate trade/market/retail values)
- Value integration: Used in VehicleValuesTab to calculate `accessoriesTotal`
- Calculation: `accessoriesTotal = SUM(value)` applies equally to all three valuation types

---

### `assessment_damage`
Damage identification and repair assessment record (1:1 with assessments).

**Columns:**
- `id` (UUID, PK)
- `assessment_id` (UUID, FK → assessments, UNIQUE, NOT NULL)

**Damage Matching:**
- `matches_description` (BOOLEAN)
- `mismatch_notes` (TEXT)

**Classification:**
- `damage_area` (TEXT, CHECK: 'structural' | 'non_structural')
- `damage_type` (TEXT) - e.g., 'collision', 'hail', 'fire'
- `severity` (TEXT, CHECK: 'minor' | 'moderate' | 'severe' | 'total_loss')

**Repair Details:**
- `affected_panels` (JSONB, DEFAULT '[]') - Array of panel names
- `repair_method` (TEXT)
- `estimated_repair_duration_days` (DECIMAL) - Estimated repair duration in days
- `location_description` (TEXT)

**Documentation:**
- `photos` (JSONB, DEFAULT '[]') - Array of photo URLs
- `damage_description`, `repair_notes`

**Index:** `idx_assessment_damage_assessment` on `assessment_id`

**Note:** Only one damage record allowed per assessment due to UNIQUE constraint on assessment_id

---

## Estimate Tables

### `assessment_estimates`
Cost estimates for vehicle repairs (1:1 with assessments using JSONB for line items).

**Architecture:** Uses document-oriented JSONB storage for line items rather than relational rows.

**Columns:**
- `id` (UUID, PK)
- `assessment_id` (UUID, FK → assessments, UNIQUE, NOT NULL) - One estimate per assessment

**Line Items (JSONB Array):**
- `line_items` (JSONB, DEFAULT '[]') - Array of estimate line item objects

**Line Item Structure (in JSONB):**
Each object in the `line_items` array contains:
- `id` (TEXT) - Unique identifier for the line item
- `process_type` (TEXT) - N (New), R (Repair), P (Paint), B (Blend), A (Align), O (Outwork)
- `part_type` (TEXT) - OEM (Original), ALT (Alternative), 2ND (Second Hand) - only for process_type=N
- `description` (TEXT) - Item description
- `part_price_nett` (DECIMAL) - Nett price without markup (user input for N only)
- `part_price` (DECIMAL) - Selling price with markup applied (calculated for N only)
- `strip_assemble_hours` (DECIMAL) - Hours for strip & assemble (user input for N,R,P,B)
- `strip_assemble` (DECIMAL) - S&A cost = hours × labour_rate (calculated for N,R,P,B)
- `labour_hours` (DECIMAL) - Hours of labour (N, R, A)
- `labour_cost` (DECIMAL) - Calculated labour cost
- `paint_panels` (INTEGER) - Number of panels to paint (N, R, P, B)
- `paint_cost` (DECIMAL) - Calculated paint cost
- `outwork_charge_nett` (DECIMAL) - Nett outwork cost (user input for O only)
- `outwork_charge` (DECIMAL) - Selling price with markup (calculated for O only)
- `total` (DECIMAL) - Total cost for line item

**Betterment Fields (in JSONB line items):**
- `betterment_part_percentage` (DECIMAL) - Percentage deduction on part_price_nett (0-100)
- `betterment_sa_percentage` (DECIMAL) - Percentage deduction on strip_assemble (0-100)
- `betterment_labour_percentage` (DECIMAL) - Percentage deduction on labour_cost (0-100)
- `betterment_paint_percentage` (DECIMAL) - Percentage deduction on paint_cost (0-100)
- `betterment_outwork_percentage` (DECIMAL) - Percentage deduction on outwork_charge_nett (0-100)
- `betterment_total` (DECIMAL) - Total betterment amount deducted from line item (calculated)

**Totals:**
- `subtotal` (DECIMAL, DEFAULT 0.00) - Sum of all line item totals before VAT
- `vat_percentage` (DECIMAL, DEFAULT 15.00) - VAT percentage applied
- `vat_amount` (DECIMAL, DEFAULT 0.00) - Calculated VAT amount
- `total` (DECIMAL, DEFAULT 0.00) - Final total including VAT

**Rates & Markups (frozen at estimate creation):**
- `labour_rate` (DECIMAL, DEFAULT 500.00) - Labour cost per hour (e.g., R500/hour)
- `paint_rate` (DECIMAL, DEFAULT 2000.00) - Paint cost per panel (e.g., R2000/panel)
- `oem_markup_percentage` (DECIMAL, DEFAULT 25.00) - OEM parts markup
- `alt_markup_percentage` (DECIMAL, DEFAULT 25.00) - Alternative parts markup
- `second_hand_markup_percentage` (DECIMAL, DEFAULT 25.00) - Second-hand parts markup
- `outwork_markup_percentage` (DECIMAL, DEFAULT 25.00) - Outwork markup

**Additional Fields:**
- `repairer_id` (UUID, FK → repairers) - Assigned repairer/workshop
- `assessment_result` (ENUM: assessment_result_type) - Final outcome: 'repair', 'code_2', 'code_3', 'total_loss'
- `notes` (TEXT)
- `currency` (TEXT, DEFAULT 'ZAR') - Currency code (South African Rand)
- `created_at`, `updated_at`

**Index:** `idx_assessment_estimates_assessment` on `assessment_id`

**Process Types:**
- **N** (New): New part installation
- **R** (Repair): Repair existing part
- **P** (Paint): Paint work only
- **B** (Blend): Blend paint
- **A** (Align): Alignment work
- **O** (Outwork): Subcontracted work

**Assessment Result Types:**
- **repair**: Economic to repair
- **code_2**: Repairable write-off
- **code_3**: Non-repairable write-off
- **total_loss**: Complete loss

**Note:** RLS is currently DISABLED on this table (security issue - should be enabled)

---

### `estimate_photos`
Photos attached to estimates (1:N with assessment_estimates).

**Columns:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `estimate_id` (UUID, FK → assessment_estimates, ON DELETE CASCADE)
- `photo_url` (TEXT, NOT NULL)
- `photo_path` (TEXT, NOT NULL)
- `label` (TEXT) - Optional label/description for the photo
- `display_order` (INTEGER, DEFAULT 0) - Order in which photos should be displayed
- `created_at`, `updated_at`

---

### `pre_incident_estimates`
Pre-existing damage estimates (1:1 with assessments using JSONB for line items).

**Architecture:** Same document-oriented JSONB structure as `assessment_estimates`.

**Columns:**
- `id` (UUID, PK)
- `assessment_id` (UUID, FK → assessments, UNIQUE, NOT NULL) - One pre-incident estimate per assessment

**Rates & Markups:**
- `labour_rate` (DECIMAL, DEFAULT 500.00)
- `paint_rate` (DECIMAL, DEFAULT 2000.00)
- `oem_markup_percentage` (DECIMAL, DEFAULT 25.00)
- `alt_markup_percentage` (DECIMAL, DEFAULT 25.00)
- `second_hand_markup_percentage` (DECIMAL, DEFAULT 25.00)
- `outwork_markup_percentage` (DECIMAL, DEFAULT 25.00)

**Line Items (JSONB Array):**
- `line_items` (JSONB, DEFAULT '[]') - Array of pre-incident estimate line items
  - Same structure as `assessment_estimates.line_items` including betterment fields

**Totals:**
- `subtotal` (DECIMAL, DEFAULT 0.00) - Sum of all line item totals before VAT
- `vat_percentage` (DECIMAL, DEFAULT 15.00)
- `vat_amount` (DECIMAL, DEFAULT 0.00)
- `total` (DECIMAL, DEFAULT 0.00)

**Additional Fields:**
- `notes` (TEXT)
- `currency` (TEXT, DEFAULT 'ZAR')
- `created_at`, `updated_at`

**Purpose:** Used to separate pre-incident damage from current claim damage.

**Note:** RLS is currently DISABLED on this table (security issue - should be enabled)

---

### `pre_incident_estimate_photos`
Photos for pre-incident damage estimates (1:N with pre_incident_estimates).

**Columns:**
- `id` (UUID, PK)
- `estimate_id` (UUID, FK → pre_incident_estimates, NOT NULL) - Reference to pre_incident_estimates table
- `photo_url` (TEXT, NOT NULL) - Public URL of the photo
- `photo_path` (TEXT, NOT NULL) - Storage path of the photo
- `label` (TEXT) - Optional label/description for the photo
- `display_order` (INTEGER, DEFAULT 0) - Order in which photos should be displayed
- `created_at`, `updated_at`

**Note:** RLS is currently DISABLED on this table (security issue - should be enabled)

---

### `assessment_vehicle_values`
Comprehensive vehicle valuation from third-party valuators with write-off calculations (1:1 with assessments).

**RLS Status:** ✅ **ENABLED** (Migration 067 - Fixed January 25, 2025)
- Admins: Full access
- Engineers: Can insert/update for their assigned assessments

**Columns:**
- `id` (UUID, PK)
- `assessment_id` (UUID, FK → assessments, UNIQUE, NOT NULL)

**Valuation Source:**
- `sourced_from` (TEXT) - Name of valuation source (e.g., TransUnion, Lightstone Auto)
- `sourced_code` (TEXT) - Reference code from valuation report
- `sourced_date` (DATE) - Date when valuation was performed

**Base Values (from valuation report):**
- `trade_value` (DECIMAL) - Trade-in value
- `market_value` (DECIMAL) - Market value
- `retail_value` (DECIMAL) - Retail value

**New List Price & Depreciation:**
- `new_list_price` (DECIMAL)
- `depreciation_percentage` (DECIMAL)

**Valuation Adjustments:**
- `valuation_adjustment` (DECIMAL) - Fixed amount adjustment from valuator (e.g., R82,413.00)
- `valuation_adjustment_percentage` (DECIMAL) - Percentage adjustment from valuator (e.g., 9%)
- `condition_adjustment_value` (DECIMAL) - Condition adjustment amount (not percentage). System calculates percentage as (value / base_value) × 100

**Adjusted Values (after adjustments):**
- `trade_adjusted_value` (DECIMAL)
- `market_adjusted_value` (DECIMAL)
- `retail_adjusted_value` (DECIMAL)

**Optional Extras (JSONB):**
- `extras` (JSONB, DEFAULT '[]') - Array of optional extras: `[{id, description, trade_value, market_value, retail_value}]`
- `trade_extras_total` (DECIMAL, DEFAULT 0.00)
- `market_extras_total` (DECIMAL, DEFAULT 0.00)
- `retail_extras_total` (DECIMAL, DEFAULT 0.00)

**Total Adjusted Values (with extras):**
- `trade_total_adjusted_value` (DECIMAL)
- `market_total_adjusted_value` (DECIMAL)
- `retail_total_adjusted_value` (DECIMAL)

**Write-off Calculations (using client percentages):**
- `borderline_writeoff_trade` (DECIMAL) - Calculated borderline write-off value for trade
- `borderline_writeoff_market` (DECIMAL)
- `borderline_writeoff_retail` (DECIMAL)
- `total_writeoff_trade` (DECIMAL) - Calculated total write-off value for trade
- `total_writeoff_market` (DECIMAL)
- `total_writeoff_retail` (DECIMAL)
- `salvage_trade` (DECIMAL) - Calculated salvage value for trade
- `salvage_market` (DECIMAL)
- `salvage_retail` (DECIMAL)

**Valuation Document:**
- `valuation_pdf_url` (TEXT) - Public URL of uploaded valuation PDF
- `valuation_pdf_path` (TEXT) - Storage path of uploaded valuation PDF

**Warranty Information:**
- `warranty_status` (TEXT, CHECK: 'active' | 'expired' | 'void' | 'transferred' | 'unknown') - Current warranty status
- `warranty_period_years` (INTEGER) - Warranty period in years (e.g., 3, 5, 7)
- `warranty_start_date` (DATE) - Warranty start date (From)
- `warranty_end_date` (DATE) - Warranty end date (To)
- `warranty_expiry_mileage` (TEXT) - Warranty expiry mileage (e.g., "unlimited", "100000", "150000")

**Service History:**
- `service_history_status` (TEXT, CHECK: 'checked' | 'not_checked' | 'incomplete' | 'up_to_date' | 'overdue' | 'unknown')

**Notes:**
- `warranty_notes` (TEXT) - Additional warranty and service information
- `remarks` (TEXT)

**Timestamps:**
- `created_at`, `updated_at`

**Note:** RLS is currently DISABLED on this table (security issue - should be enabled)

---

### `assessment_additionals`
Additional work items discovered after initial assessment (1:1 with assessments using JSONB for line items).

**Columns:**
- `id` (UUID, PK)
- `assessment_id` (UUID, FK → assessments, UNIQUE, NOT NULL) - One additionals record per assessment

**Repairer:**
- `repairer_id` (UUID, FK → repairers)

**Rates & Markups:**
- `labour_rate` (DECIMAL, DEFAULT 0)
- `paint_rate` (DECIMAL, DEFAULT 0)
- `vat_percentage` (DECIMAL, DEFAULT 15)
- `oem_markup_percentage` (DECIMAL, DEFAULT 25)
- `alt_markup_percentage` (DECIMAL, DEFAULT 25)
- `second_hand_markup_percentage` (DECIMAL, DEFAULT 25)
- `outwork_markup_percentage` (DECIMAL, DEFAULT 25)

**Line Items (JSONB Array):**
- `line_items` (JSONB, DEFAULT '[]') - Array of additional work line items
  - Same structure as `assessment_estimates.line_items`

**Totals (Approved Amounts):**
- `subtotal_approved` (DECIMAL, DEFAULT 0)
- `vat_amount_approved` (DECIMAL, DEFAULT 0)
- `total_approved` (DECIMAL, DEFAULT 0)

**Deprecated Field:**
- `excluded_line_item_ids` (JSONB, DEFAULT '[]') - **DEPRECATED:** Use `action='removed'` line items instead. Kept for backward compatibility. Should always be empty array after migration 037.

**Timestamps:**
- `created_at`, `updated_at`

**Note:** RLS is currently DISABLED on this table (security issue - should be enabled)

---

### `assessment_additionals_photos`
Photos for additional work items (1:N with assessment_additionals).

**Columns:**
- `id` (UUID, PK)
- `additionals_id` (UUID, FK → assessment_additionals, NOT NULL)
- `photo_url` (TEXT, NOT NULL)
- `photo_path` (TEXT, NOT NULL)
- `label` (TEXT) - Optional label/description
- `display_order` (INTEGER, DEFAULT 0)
- `created_at`, `updated_at`

**Note:** RLS is currently DISABLED on this table (security issue - should be enabled)

---

## Final Repair Costing (FRC) Tables

### `assessment_frc`
Final Repair Costing records tracking quoted vs. actual costs (1:1 with assessments, but not UNIQUE on assessment_id).

**Columns:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `assessment_id` (UUID, FK → assessments, NOT NULL)

**Status:**
- `status` (TEXT, CHECK: 'not_started' | 'in_progress' | 'completed', DEFAULT 'not_started')

**Line Items (JSONB Array):**
- `line_items` (JSONB, DEFAULT '[]') - Array of FRC line items with quoted/actual totals and decisions

**VAT:**
- `vat_percentage` (DECIMAL, DEFAULT 15.00)

**Quoted Totals (from initial estimate):**
- `quoted_parts_total` (DECIMAL, DEFAULT 0)
- `quoted_labour_total` (DECIMAL, DEFAULT 0)
- `quoted_paint_total` (DECIMAL, DEFAULT 0)
- `quoted_outwork_total` (DECIMAL, DEFAULT 0)
- `quoted_subtotal` (DECIMAL, DEFAULT 0)
- `quoted_vat_amount` (DECIMAL, DEFAULT 0)
- `quoted_total` (DECIMAL, DEFAULT 0)

**Quoted Estimate Breakdown:**
- `quoted_estimate_parts_nett` (DECIMAL, DEFAULT 0.00)
- `quoted_estimate_labour` (DECIMAL, DEFAULT 0.00)
- `quoted_estimate_paint` (DECIMAL, DEFAULT 0.00)
- `quoted_estimate_outwork_nett` (DECIMAL, DEFAULT 0.00)
- `quoted_estimate_markup` (DECIMAL, DEFAULT 0.00)
- `quoted_estimate_subtotal` (DECIMAL, DEFAULT 0.00)

**Quoted Additionals Breakdown:**
- `quoted_additionals_parts_nett` (DECIMAL, DEFAULT 0.00)
- `quoted_additionals_labour` (DECIMAL, DEFAULT 0.00)
- `quoted_additionals_paint` (DECIMAL, DEFAULT 0.00)
- `quoted_additionals_outwork_nett` (DECIMAL, DEFAULT 0.00)
- `quoted_additionals_markup` (DECIMAL, DEFAULT 0.00)
- `quoted_additionals_subtotal` (DECIMAL, DEFAULT 0.00)

**Actual Totals (final costs incurred):**
- `actual_parts_total` (DECIMAL, DEFAULT 0)
- `actual_labour_total` (DECIMAL, DEFAULT 0)
- `actual_paint_total` (DECIMAL, DEFAULT 0)
- `actual_outwork_total` (DECIMAL, DEFAULT 0)
- `actual_subtotal` (DECIMAL, DEFAULT 0)
- `actual_vat_amount` (DECIMAL, DEFAULT 0)
- `actual_total` (DECIMAL, DEFAULT 0)

**Actual Estimate Breakdown:**
- `actual_estimate_parts_nett` (DECIMAL, DEFAULT 0.00)
- `actual_estimate_labour` (DECIMAL, DEFAULT 0.00)
- `actual_estimate_paint` (DECIMAL, DEFAULT 0.00)
- `actual_estimate_outwork_nett` (DECIMAL, DEFAULT 0.00)
- `actual_estimate_markup` (DECIMAL, DEFAULT 0.00)
- `actual_estimate_subtotal` (DECIMAL, DEFAULT 0.00)

**Actual Additionals Breakdown:**
- `actual_additionals_parts_nett` (DECIMAL, DEFAULT 0.00)
- `actual_additionals_labour` (DECIMAL, DEFAULT 0.00)
- `actual_additionals_paint` (DECIMAL, DEFAULT 0.00)
- `actual_additionals_outwork_nett` (DECIMAL, DEFAULT 0.00)
- `actual_additionals_markup` (DECIMAL, DEFAULT 0.00)
- `actual_additionals_subtotal` (DECIMAL, DEFAULT 0.00)

**Sign-off:**
- `signed_off_by_name` (TEXT) - Name of person signing off
- `signed_off_by_email` (TEXT) - Email of person signing off
- `signed_off_by_role` (TEXT) - Role of person signing off
- `signed_off_at` (TIMESTAMPTZ) - When FRC was signed off
- `sign_off_notes` (TEXT) - Notes from sign-off

**Report:**
- `frc_report_url` (TEXT) - URL of the generated FRC PDF report in Supabase Storage

**Timestamps:**
- `started_at` (TIMESTAMPTZ)
- `completed_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

**Note:** RLS is currently DISABLED on this table (security issue - should be enabled)

---

### `assessment_frc_documents`
Documents (invoices, attachments) attached to FRC records (1:N with assessment_frc).

**Columns:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `frc_id` (UUID, FK → assessment_frc, NOT NULL)
- `document_url` (TEXT, NOT NULL)
- `document_path` (TEXT, NOT NULL)
- `label` (TEXT) - Optional label/description
- `document_type` (TEXT, CHECK: 'invoice' | 'attachment', DEFAULT 'invoice') - Type of document
- `file_size_bytes` (BIGINT) - File size in bytes
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

**Note:** RLS is currently DISABLED on this table (security issue - should be enabled)

---

## Notes & Audit Tables

### `assessment_notes`
Notes attached to assessments with chat-style editing and categorization (1:N with assessments).

**Columns:**
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `assessment_id` (UUID, FK → assessments, NOT NULL)

**Note Content:**
- `note_text` (TEXT, NOT NULL) - The note content
- `note_type` (TEXT, CHECK: 'manual' | 'betterment' | 'system', DEFAULT 'manual') - Note category
- `note_title` (TEXT) - Optional title for the note
- `source_tab` (TEXT) - Assessment tab ID where note was created (e.g., "summary", "identification", "360", "interior", "tyres", "damage", "values", "pre-incident", "estimate", "finalize", "additionals", "frc")

**Authorship & Editing:**
- `created_by` (UUID, FK → auth.users) - User who created the note
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `is_edited` (BOOLEAN, DEFAULT false) - Whether note has been edited
- `edited_by` (UUID, FK → auth.users) - User who last edited the note
- `edited_at` (TIMESTAMPTZ) - When the note was last edited
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

**Display:** Notes are displayed as chat-style bubbles in the UI with full edit history tracking.

---

### `audit_logs`
Comprehensive audit trail for all entity changes. Tracks 21 distinct entity types with 21 specific audit actions.

**Columns:**
- `id` (UUID, PK, DEFAULT uuid_generate_v4())
- `entity_type` (TEXT, NOT NULL, CHECK constraint) - One of 21 supported entity types
- `entity_id` (UUID, NOT NULL) - ID of the affected entity (typically assessment_id for context)
- `action` (TEXT, NOT NULL) - One of 21 audit action types (see audit_logging_system.md)
- `field_name` (TEXT, nullable) - Specific field that changed (optional)
- `old_value` (TEXT, nullable) - Previous value before change (optional)
- `new_value` (TEXT, nullable) - New value after change (optional)
- `changed_by` (TEXT, nullable, DEFAULT 'System') - User who made the change
- `metadata` (JSONB, nullable) - Additional context (descriptions, totals, line_item_id, etc.)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

**Indexes:**
- `idx_audit_logs_entity` on `(entity_type, entity_id)` - Fast entity lookups
- `idx_audit_logs_created_at` on `created_at DESC` - Time-based queries
- `idx_audit_logs_action` on `action` - Action type filtering

**Supported Entity Types (21 total):**
- Core: `request`, `inspection`, `task`, `client`, `engineer`, `appointment`
- Assessment: `assessment`, `vehicle_identification`, `exterior_360`, `accessory`, `interior_mechanical`, `tyre`, `damage_record`, `vehicle_values`
- Estimates: `estimate`, `pre_incident_estimate`, `estimate_line_item`
- Subprocesses: `frc`, `frc_document`
- Supporting: `assessment_notes`

**Audit Actions (21 types):**
- Basic: `created`, `updated`, `status_changed`, `assigned`, `cancelled`, `accepted`, `appointed`, `completed`, `stage_transition`
- Line Items: `line_item_added`, `line_item_updated`, `line_item_deleted`, `line_item_approved`, `line_item_declined`, `line_item_reversed`, `line_item_reinstated`, `original_line_removed`
- Specialized: `rates_updated`, `frc_completed`, `frc_merged`, `assessment_created`

**Usage Pattern:**
Most operations use `assessment_id` as `entity_id` regardless of `entity_type`, enabling cross-entity-type history queries. Assessment creation uses assessment's own ID.

**See**: [Audit Logging System](./audit_logging_system.md) for complete documentation

---

## Authentication & User Tables

### `user_profiles`
User accounts extending `auth.users` with application-specific data.

**Columns:**
- `id` (UUID, PK, FK → auth.users ON DELETE CASCADE)
- `email` (TEXT, UNIQUE, NOT NULL)
- `full_name` (TEXT)
- `role` (TEXT, CHECK: 'admin' | 'engineer')
- `province` (TEXT) - For engineers: operating province
- `company` (TEXT) - For engineers: company affiliation
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at`, `updated_at`

**Indexes:**
- `idx_user_profiles_email` on `email`
- `idx_user_profiles_role` on `role`
- `idx_user_profiles_province` on `province`

**RLS Policies (Updated October 25, 2025 - Migration 064):**

**IMPORTANT**: Uses JWT claims to avoid infinite recursion. All policies check `auth.jwt() ->> 'user_role'` instead of querying the database.

1. **"Admin or own profile read access"** (SELECT)
   - Admins can read all profiles: `(auth.jwt() ->> 'user_role') = 'admin'`
   - Users can read own profile: `auth.uid() = id`

2. **"Admin can insert profiles"** (INSERT)
   - Only admins can create new profiles: `(auth.jwt() ->> 'user_role') = 'admin'`

3. **"Admin can update all profiles"** (UPDATE)
   - Only admins can update any profile: `(auth.jwt() ->> 'user_role') = 'admin'`

4. **"Admin can delete profiles"** (DELETE)
   - Only admins can delete profiles: `(auth.jwt() ->> 'user_role') = 'admin'`

5. **"Users can update own profile"** (UPDATE - from migration 043)
   - Users can update their own profile: `auth.uid() = id`

**Why JWT Claims?**
- Previous policies queried `user_profiles` to check admin status, causing infinite recursion
- JWT claims populated by `custom_access_token_hook` (migration 045)
- No database query = no RLS trigger = no recursion
- Requires hook to be enabled in Supabase Dashboard

**Functions:**
- `handle_new_user()`: Creates profile on signup (triggered by `auth.users` insert)
- `update_user_profile_updated_at()`: Auto-updates `updated_at` timestamp
- `custom_access_token_hook()`: Adds `user_role` to JWT claims during authentication

---

## Company Settings Table

### `company_settings`
Singleton table for company information used in document generation (single row).

**Columns:**
- `id` (UUID, PK)
- `company_name` (TEXT, DEFAULT 'Claimtech')

**Address:**
- `po_box` (TEXT, DEFAULT 'P.O. Box 12345') - PO Box address
- `city` (TEXT, DEFAULT 'Johannesburg')
- `province` (TEXT, DEFAULT 'Gauteng')
- `postal_code` (TEXT, DEFAULT '2000')

**Contact Information:**
- `phone` (TEXT, DEFAULT '+27 (0) 11 123 4567')
- `fax` (TEXT, DEFAULT '+27 (0) 86 123 4567')
- `email` (TEXT, DEFAULT 'info@claimtech.co.za')
- `website` (TEXT, DEFAULT 'www.claimtech.co.za')

**Branding:**
- `logo_url` (TEXT) - URL to company logo

**Terms & Conditions (Added Nov 2025, Migration 20251102):**
- `assessment_terms_and_conditions` (TEXT) - T&Cs text displayed in Assessment Report PDFs
- `estimate_terms_and_conditions` (TEXT) - T&Cs text displayed in Estimate PDFs
- `frc_terms_and_conditions` (TEXT) - T&Cs text displayed in FRC Report PDFs

**Timestamps:**
- `created_at`, `updated_at`

**Note:**
- Typically only one row exists in this table
- Rates and markups are NOT stored here - they are stored per estimate/repairer
- RLS is currently DISABLED on this table (security issue - should be enabled)

---

## Note on Provinces

**The `provinces` reference table does NOT exist in the database.** Province data is stored as TEXT fields directly in tables like `clients`, `engineers`, `repairers`, `requests`, and `inspections`.

---

## Storage Buckets

### `documents`
Stores generated PDFs and other documents.

**Configuration:**
- Public: false (private bucket) ✓
- File size limit: **NULL (not enforced)** ❌
- Allowed MIME types: **NULL (not enforced)** ❌

**RLS Policies:**
- Authenticated users can SELECT/INSERT/UPDATE/DELETE

**Security Issue:** File size limits and MIME type restrictions are configured as NULL, meaning they are not enforced at the bucket level.

**File Organization:**
```
documents/
  assessments/{assessment_id}/
    report_{report_number}.pdf
    estimate_{assessment_number}.pdf
    photos_{assessment_number}.pdf
    photos_{assessment_number}.zip
  frc/{frc_id}/
    frc_report_{frc_number}.pdf
    invoice_{filename}
    completion_certificate_{filename}
```

---

### `SVA Photos`
Stores all assessment photos (identification, exterior, tyres, damage, etc.).

**Configuration:**
- Public: false (private bucket) ✓
- File size limit: **NULL (not enforced)** ❌
- Allowed MIME types: **NULL (not enforced)** ❌

**RLS Policies:**
- Authenticated users can SELECT/INSERT/UPDATE/DELETE

**Security Issue:** File size limits and MIME type restrictions are configured as NULL, meaning they are not enforced at the bucket level.

**File Organization:**
```
SVA Photos/
  assessments/{assessment_id}/
    identification/
      registration_{timestamp}.jpg
      vin_{timestamp}.jpg
      engine_number_{timestamp}.jpg
      license_disc_{timestamp}.jpg
    exterior/
      front_{timestamp}.jpg
      front_left_{timestamp}.jpg
      ...
    tyres/
      front_left_{timestamp}.jpg
      ...
    interior/
      dashboard_{timestamp}.jpg
      ...
    damage/
      {damage_id}_{timestamp}.jpg
      ...
    accessories/
      {accessory_id}_{timestamp}.jpg
      ...
    estimate/
      {estimate_id}_{timestamp}.jpg
      ...
```

---

## Triggers

### Auto-Update `updated_at`
Most tables have a trigger that automatically updates the `updated_at` column:

```sql
CREATE TRIGGER update_{table_name}_updated_at
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Auto-Create User Profile
When a new user signs up via `auth.users`, a profile is automatically created:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## Row Level Security (RLS) Policies

**Current State (Updated January 25, 2025):** RLS is **FULLY IMPLEMENTED** with **100% coverage** across all 28 tables.

### ✅ RLS Security Status: PRODUCTION-READY

**Coverage:** 28 out of 28 tables (100%) have RLS enabled with role-based policies
**Last Updated:** January 25, 2025 (Migrations 046-067)
**Security Level:** Enterprise-grade with JWT-based authentication

### 🔒 RLS Policy Pattern

All tables follow a consistent role-based access pattern:

**Admins:**
- Full access (SELECT, INSERT, UPDATE, DELETE) to all tables
- Checked via `is_admin()` helper function

**Engineers:**
- SELECT: Can view data for their assigned work
- INSERT/UPDATE: Can modify data for their assigned appointments/assessments
- DELETE: No delete access (admin-only)
- Checked via `get_user_engineer_id()` helper function

**Authentication:**
- All policies require `authenticated` role
- JWT claims used to prevent RLS recursion
- Helper functions use `SECURITY DEFINER` with `STABLE` caching

### 📋 Tables with RLS Enabled (All 28 Tables)

**Core Entities:**
- `clients`, `engineers`, `repairers`, `user_profiles`

**Workflow Tables:**
- `requests`, `request_tasks`, `inspections`, `appointments`, `assessments`

**Assessment Data Tables:**
- `assessment_vehicle_identification`, `assessment_360_exterior`
- `assessment_accessories`, `assessment_interior_mechanical`
- `assessment_tyres`, `assessment_damage`, `assessment_notes`

**Estimate & Valuation Tables:**
- `assessment_estimates`, `estimate_photos`
- `pre_incident_estimates`, `pre_incident_estimate_photos`
- `assessment_vehicle_values` ⭐ **Fixed Jan 2025 (Migration 067)**

**Additionals & FRC Tables:**
- `assessment_additionals`, `assessment_additionals_photos`
- `assessment_frc`, `assessment_frc_documents`

**System Tables:**
- `company_settings`, `audit_logs`

### 🔧 Recent RLS Fixes (January 2025)

**Migration 066 - Assessment INSERT Policy Fix:**
- **Issue:** Policy referenced `assessment_id` (doesn't exist during INSERT)
- **Fix:** Changed to reference `appointment_id` from INSERT context
- **Impact:** Engineers can now create assessments

**Migration 067 - Vehicle Values INSERT Policy Fix:**
- **Issue:** Policy used table-qualified `assessment_vehicle_values.assessment_id` during INSERT
- **Fix:** Changed to bare `assessment_id` from INSERT context
- **Impact:** Both admins and engineers can create assessments with vehicle values

**Service Client Injection Fix (January 25, 2025):**
- **Issue:** Services used global `supabase` client (unauthenticated) instead of `locals.supabase` (authenticated)
- **Error:** `42501 - new row violates row-level security policy`
- **Fix:** Added `client?: ServiceClient` parameter to all service methods
- **Pattern:** `const db = client ?? supabase;` allows authenticated or browser client
- **Impact:** All RLS policies now properly authenticate users
- **Services Fixed:**
  - `VehicleValuesService` - All 9 methods
  - `TyresService` - All 6 methods
  - `DamageService` - All 6 methods
  - `PreIncidentEstimateService` - 3 critical methods
  - `EstimateService` - 3 critical methods
- **Call Sites:** Updated `+page.server.ts` to pass `locals.supabase` to all service calls

**Patterns Identified:**
1. Table-qualified column references don't work in INSERT policies - use bare column names
2. Services MUST accept `client?: ServiceClient` parameter for RLS authentication
3. Server routes MUST pass `locals.supabase` to all service calls

### 🛡️ Helper Functions

**`is_admin()`** - Check if user has admin role
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';
```

**`get_user_engineer_id()`** - Get engineer_id for current user
```sql
CREATE OR REPLACE FUNCTION public.get_user_engineer_id()
RETURNS UUID AS $$
DECLARE
  eng_id UUID;
BEGIN
  SELECT id INTO eng_id
  FROM public.engineers
  WHERE auth_user_id = auth.uid();

  RETURN eng_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';
```

### 📖 Example Policies

**Assessment Vehicle Values (Migration 067):**
```sql
-- Admins can insert vehicle values
CREATE POLICY "Admins can insert assessment_vehicle_values"
ON assessment_vehicle_values FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Engineers can insert vehicle values for their assessments
CREATE POLICY "Engineers can insert assessment_vehicle_values"
ON assessment_vehicle_values FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assessments
    JOIN appointments ON assessments.appointment_id = appointments.id
    WHERE assessments.id = assessment_id  -- ✅ Bare column name from INSERT
    AND appointments.engineer_id = get_user_engineer_id()
  )
);
```

**User Profiles (Migration 064 - JWT Claims):**
```sql
-- Admin or own profile read access
CREATE POLICY "Admin or own profile read access"
ON user_profiles FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'user_role') = 'admin'  -- JWT claim prevents recursion
  OR auth.uid() = id
);
```

### 🎯 Security Best Practices

1. **Always use authenticated role** - Never allow anonymous access
2. **Use helper functions** - Centralize role checks in `is_admin()` and `get_user_engineer_id()`
3. **Avoid recursion** - Use JWT claims for `user_profiles` table
4. **Test both roles** - Verify policies work for both admins and engineers
5. **Use bare column names in INSERT** - Never use table-qualified references in WITH CHECK clauses
6. **Set search_path** - All SECURITY DEFINER functions use `SET search_path = ''`

### 📚 Related Documentation

- [Fixing RLS INSERT Policies SOP](../SOP/fixing_rls_insert_policies.md) - Complete debugging guide
- [Fixing RLS Recursion SOP](../SOP/fixing_rls_recursion.md) - JWT claims pattern
- [RLS Security Hardening Task](../Tasks/active/rls_security_hardening.md) - Implementation history

---

## Indexes Summary

### Critical Indexes
- All foreign keys are indexed
- `request_number`, `inspection_number`, `appointment_number`, `assessment_number` are indexed
- `status` fields are indexed for filtering
- `created_at` is indexed on `audit_logs` for time-based queries

### Compound Indexes
- `(entity_type, entity_id)` on `audit_logs`
- Unique constraints act as indexes:
  - `(assessment_id, damage_type, location_description)` on `assessment_damage`

---

## Data Flow Example

### Complete Assessment Workflow

1. **Request Created**
   - Insert into `requests` table
   - `request_number` auto-generated
   - Status: 'draft' → 'submitted'

2. **Inspection Created**
   - Insert into `inspections` table
   - Linked to `requests.id`
   - `inspection_number` auto-generated
   - Engineer assigned

3. **Appointment Scheduled**
   - Insert into `appointments` table
   - Linked to `inspections.id` and `requests.id`
   - `appointment_number` auto-generated
   - Date/time set

4. **Assessment Started**
   - Insert into `assessments` table
   - Linked to `appointment_id`, `inspection_id`, `request_id`
   - `assessment_number` auto-generated
   - Status: 'in_progress'

5. **Assessment Data Collection**
   - Insert/update `assessment_vehicle_identification`
   - Insert/update `assessment_360_exterior`
   - Insert multiple `assessment_tyres` records
   - Insert/update `assessment_interior_mechanical`
   - Insert multiple `assessment_accessories` records
   - Insert multiple `assessment_damage` records
   - Insert multiple `assessment_estimates` records
   - Upload photos to `SVA Photos` bucket

6. **Assessment Finalized**
   - Update `assessments.status` to 'submitted'
   - Set `submitted_at` timestamp
   - Set `estimate_finalized_at` timestamp

7. **Documents Generated**
   - Generate report PDF → upload to `documents` bucket
   - Generate estimate PDF → upload to `documents` bucket
   - Generate photos PDF/ZIP → upload to `documents` bucket
   - Update `assessments` with PDF URLs
   - Set `documents_generated_at` timestamp

8. **FRC (Final Repair Costing)**
   - Insert into `assessment_frc` table
   - Upload completion photos to `SVA Photos`
   - Upload invoices/documents to `documents` bucket
   - Insert into `frc_documents` table
   - Update status: 'in_progress' → 'submitted' → 'approved'

9. **Assessment Archived**
   - Update `assessments.status` to 'archived'
   - Assessment complete

---

## Related Documentation
- Project Architecture: `project_architecture.md`
- Adding Migrations SOP: `../SOP/adding_migration.md`
