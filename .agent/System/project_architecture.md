# Project Architecture

## Project Overview

**ClaimTech** is a comprehensive vehicle assessment and claims management system built for the insurance and automotive inspection industry. The platform facilitates the entire workflow from initial claim request through inspection scheduling, detailed vehicle assessment, damage estimation, and final reporting.

### Core Purpose
- Manage insurance and private vehicle inspection requests
- Schedule and track appointments with engineers
- Conduct detailed vehicle assessments with photo documentation
- Generate damage estimates with multiple part types and repair methods
- Produce professional PDF reports for clients and repairers
- Handle Final Repair Costing (FRC) workflow
- Track audit logs for compliance and accountability

---

## Tech Stack

### Frontend
- **Framework**: SvelteKit 2.22.0 (Svelte 5.0.0)
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS 4.0.0 with custom plugins
  - `@tailwindcss/forms`
  - `@tailwindcss/typography`
  - `tailwind-merge` & `tailwind-variants`
  - `tw-animate-css`
- **UI Components**:
  - `bits-ui` (headless component library)
  - Custom component library in `src/lib/components/ui`
- **Icons**: `@lucide/svelte` & `lucide-svelte`
- **File Uploads**:
  - `filepond` with plugins for image preview and file validation
  - `svelte-filepond`
- **Date Handling**: `@internationalized/date`
- **Utilities**: `clsx` for conditional classes

### Backend
- **Runtime**: Node.js
- **Framework**: SvelteKit (SSR + API routes)
- **Database**: Supabase (PostgreSQL)
  - `@supabase/supabase-js` 2.58.0
  - `@supabase/ssr` 0.7.0 for server-side auth
- **PDF Generation**: Puppeteer 24.24.0
- **File Compression**: JSZip 3.10.1

### Infrastructure
- **Deployment**: Vercel (configured in `svelte.config.js`)
  - Max serverless function duration: 300 seconds (5 minutes) for PDF generation
- **Database & Auth**: Supabase Cloud
- **Storage**: Supabase Storage (buckets: `documents`, `SVA Photos`)
- **Build Tool**: Vite 7.0.4

### Development Tools
- **Testing**:
  - Vitest 3.2.3 (unit tests)
  - Playwright 1.53.0 (E2E tests)
  - `vitest-browser-svelte` for component testing
- **Linting**: ESLint 9.22.0 with Svelte plugin
- **Formatting**: Prettier 3.4.2 with Svelte and Tailwind plugins
- **Type Checking**: svelte-check 4.0.0

---

## Project Structure

```
claimtech/
├── .agent/                          # Documentation (this folder)
│   ├── System/                      # System architecture docs
│   ├── Tasks/                       # Feature PRDs and implementation plans
│   ├── SOP/                         # Standard Operating Procedures
│   └── README.md                    # Documentation index
│
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   └── ui/                  # Reusable UI components (button, card, dialog, etc.)
│   │   ├── services/                # Data access layer (*.service.ts)
│   │   │   ├── assessment.service.ts
│   │   │   ├── request.service.ts
│   │   │   ├── appointment.service.ts
│   │   │   ├── client.service.ts
│   │   │   ├── engineer.service.ts
│   │   │   ├── estimate.service.ts
│   │   │   ├── storage.service.ts
│   │   │   └── ... (30+ services)
│   │   ├── types/                   # TypeScript type definitions
│   │   │   ├── database.ts          # Supabase database types
│   │   │   ├── assessment.ts        # Assessment-related types
│   │   │   ├── request.ts
│   │   │   └── ...
│   │   ├── utils/                   # Utility functions
│   │   │   ├── pdf-generator.ts     # Puppeteer PDF generation
│   │   │   ├── formatters.ts        # Date, currency formatters
│   │   │   ├── validation.ts
│   │   │   ├── estimateCalculations.ts
│   │   │   └── ...
│   │   ├── templates/               # HTML templates for PDF generation
│   │   │   ├── report-template.ts
│   │   │   ├── estimate-template.ts
│   │   │   ├── frc-report-template.ts
│   │   │   └── photos-template.ts
│   │   ├── constants/
│   │   │   └── processTypes.ts      # Process type configurations
│   │   ├── supabase.ts              # Client-side Supabase client
│   │   └── supabase-server.ts       # Server-side Supabase client (service role)
│   │
│   ├── routes/
│   │   ├── (app)/                   # Protected routes (requires auth)
│   │   │   ├── dashboard/           # Dashboard overview
│   │   │   ├── requests/            # Request management
│   │   │   ├── clients/             # Client management
│   │   │   ├── engineers/           # Engineer management (CRUD + password reset)
│   │   │   │   ├── +page.svelte     # Engineer list
│   │   │   │   ├── new/             # Create engineer (admin-only)
│   │   │   │   └── [id]/            # Engineer detail & edit
│   │   │   │       ├── +page.svelte # Engineer detail view
│   │   │   │       └── edit/        # Edit engineer profile
│   │   │   ├── repairers/           # Repairer management
│   │   │   ├── work/                # Work management
│   │   │   │   ├── appointments/    # Appointment scheduling
│   │   │   │   ├── inspections/     # Inspection workflow
│   │   │   │   ├── assessments/     # Vehicle assessments
│   │   │   │   │   └── [appointment_id]/  # Assessment detail page
│   │   │   │   ├── finalized-assessments/
│   │   │   │   ├── additionals/     # Additional work items
│   │   │   │   ├── frc/             # Final Repair Costing
│   │   │   │   └── archive/         # Archived assessments
│   │   │   └── settings/            # Company settings
│   │   ├── auth/                    # Authentication routes (public)
│   │   │   ├── login/               # Login page (form action)
│   │   │   ├── forgot-password/     # Password reset request
│   │   │   ├── reset-password/      # Set new password
│   │   │   ├── callback/            # OAuth & password reset callback
│   │   │   └── logout/              # Logout (form action)
│   │   ├── api/                     # API endpoints
│   │   │   ├── generate-report/     # PDF report generation
│   │   │   ├── generate-estimate/   # PDF estimate generation
│   │   │   ├── generate-photos-pdf/ # Photos PDF generation
│   │   │   ├── generate-photos-zip/ # Photos ZIP generation
│   │   │   ├── generate-frc-report/ # FRC report generation
│   │   │   ├── photo/[...path]/     # Signed photo URLs
│   │   │   ├── document/[...path]/  # Signed document URLs
│   │   │   └── frc/[id]/reopen/     # Reopen FRC
│   │   ├── +layout.server.ts        # Root layout (session loading)
│   │   └── +layout.ts               # Client-side layout
│   │
│   ├── hooks.server.ts              # Server hooks (auth guard, Supabase setup)
│   └── app.d.ts                     # Global TypeScript definitions
│
├── supabase/
│   └── migrations/                  # Database migrations (50+ files)
│       ├── 001_initial_schema.sql
│       ├── 006_create_assessments.sql
│       ├── 043_auth_setup.sql
│       ├── 044_secure_storage_policies.sql
│       └── ...
│
├── static/                          # Static assets
├── tests/                           # Test files
├── package.json
├── svelte.config.js                 # SvelteKit configuration
├── vite.config.ts                   # Vite configuration
├── tailwind.config.js               # Tailwind configuration
└── tsconfig.json                    # TypeScript configuration
```

---

## Architecture Patterns

### Service Layer Pattern
All data access is abstracted into service files (`src/lib/services/*.service.ts`). Each service:
- Accepts a Supabase client as the first parameter
- Returns typed results from the database
- Handles CRUD operations for specific entities
- Uses TypeScript generics for type safety

Example:
```typescript
// assessment.service.ts
export async function getAssessment(supabase: SupabaseClient, id: string) {
  return await supabase
    .from('assessments')
    .select('*')
    .eq('id', id)
    .single()
}
```

### Server Load Functions
SvelteKit's `+page.server.ts` files use server load functions to fetch data:
- Access `locals.supabase` for authenticated requests
- Use services to fetch data
- Return data to the page component
- Handle form actions for mutations

### Client-Side State Management
- Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Optimistic updates with custom utilities (`useOptimisticArray`, `useOptimisticQueue`)
- Draft state management (`useDraft.svelte.ts`)
- Unsaved changes tracking (`useUnsavedChanges.svelte.ts`)

### PDF Generation Workflow
1. Client triggers PDF generation (e.g., "Generate Report")
2. API endpoint receives request
3. Server fetches all required data from Supabase
4. HTML template is generated with data
5. Puppeteer launches headless Chrome
6. HTML is converted to PDF
7. PDF is uploaded to Supabase Storage
8. Signed URL is generated and returned
9. Database is updated with PDF path and URL

### Storage Architecture
- **Buckets**: `documents`, `SVA Photos`
- **Security**: Private buckets with RLS policies (authenticated users only)
- **URL Generation**: Signed URLs with 1-hour expiry via API endpoints
- **File Organization**:
  - Photos: `assessments/{assessment_id}/{category}/{filename}`
  - Documents: `assessments/{assessment_id}/documents/{filename}`

### Audit Logging System (Implemented Jan 30, 2025)
Comprehensive audit trail tracking all interactions and changes within the assessment workflow.

**Coverage:**
- 21 distinct audit action types (created, line_item_added, line_item_approved, rates_updated, etc.)
- 21 supported entity types (assessment, estimate, frc, vehicle_identification, etc.)
- Complete service coverage: All assessment workflow operations logged
- Rich metadata capture: Descriptions, totals, field changes, operation context

**Service Layer:**
- `AuditService` with defensive error handling (never breaks main operations)
- `getAssessmentHistory()` for cross-entity-type queries
- All methods accept optional `ServiceClient` for RLS compliance

**UI Components:**
- `ActivityTimeline` - Visual timeline with icons, colors, formatted action text
- `AuditTab` - Admin-only tab on assessment detail pages showing complete history

**Key Pattern:**
- Most operations use `assessment_id` as `entity_id` regardless of `entity_type`
- Enables single-query retrieval of all assessment history across entity types
- Assessment creation uses assessment's own ID (also retrievable via `getAssessmentHistory()`)

**See**: [Audit Logging System](./audit_logging_system.md) for complete documentation

---

## Key Workflows

### 1. Assessment-Centric Workflow (Implemented Jan 2025)

**Core Architecture:**
ClaimTech uses an **assessment-centric architecture** where assessments are created at the moment a request is submitted, not at "Start Assessment". The assessment serves as the single source of truth that moves through a 10-stage pipeline.

**10-Stage Pipeline:**
```
1. request_submitted      → Initial request created (assessment created here)
2. request_reviewed       → Admin reviews request
3. inspection_scheduled   → Inspection scheduled (no appointment yet)
4. appointment_scheduled  → Appointment created and scheduled
5. assessment_in_progress → Engineer started assessment
6. estimate_review        → Estimate under review
7. estimate_sent          → Estimate sent to client
8. estimate_finalized     → Estimate finalized
9. frc_in_progress        → Final Repair Costing started
10. archived/cancelled    → Completed or cancelled
```

**Complete Workflow:**
```
Request Created (by client or admin)
  ↓ [Assessment automatically created with request_id]
Stage: request_submitted
  ↓ [Admin reviews]
Stage: request_reviewed
  ↓ [Admin schedules inspection]
Stage: inspection_scheduled
  ↓ [Admin/Engineer creates appointment]
Stage: appointment_scheduled (appointment_id linked)
  ↓ [Engineer clicks "Start Assessment"]
Stage: assessment_in_progress
  ↓ [Engineer completes all tabs: Identification, Exterior, Tyres, Interior, Accessories, Damage, Estimate]
Stage: estimate_review
  ↓ [Estimate reviewed]
Stage: estimate_sent
  ↓ [Estimate finalized]
Stage: estimate_finalized
  ↓ [Documents Generated: Report PDF, Estimate PDF, Photos PDF/ZIP]
  ↓ [Admin starts FRC]
Stage: frc_in_progress
  ↓ [FRC completed]
Stage: archived
```

**Key Principles:**
- ✅ **One assessment per request**: Enforced by unique constraint on `request_id`
- ✅ **Assessment created WITH request**: Not at "Start Assessment" (eliminates race conditions)
- ✅ **Nullable foreign keys**: `appointment_id` starts NULL, linked when appointment created
- ✅ **Constraint enforcement**: `appointment_id` required for stages 4-9 (check constraint)
- ✅ **Idempotent operations**: All operations safe to call multiple times
- ✅ **Stage-based queries**: All list pages query by `stage` field (not status)
- ✅ **Audit trail**: All stage transitions logged

### 2. List Pages and Stage-Based Queries (Implemented Jan 2025)

All list pages in ClaimTech query assessments by `stage` field, providing a single source of truth:

| Page | Route | Stage Filter | Description |
|------|-------|--------------|-------------|
| **Requests** | `/requests` | `request_submitted`, `request_reviewed` | New requests awaiting review |
| **Inspections** | `/work/inspections` | `inspection_scheduled` | Assessments ready for inspection scheduling |
| **Appointments** | `/work/appointments` | `appointment_scheduled`, `assessment_in_progress` | Scheduled appointments and ongoing assessments |
| **Open Assessments** | `/work/assessments` | `assessment_in_progress`, `estimate_review`, `estimate_sent` | Active assessments being worked on |
| **Finalized Assessments** | `/work/finalized-assessments` | `estimate_finalized` | Completed assessments ready for review |
| **FRC** | `/work/frc` | `frc_in_progress` | Final Repair Costing in progress |
| **Archive** | `/work/archive` | `archived`, `cancelled` | Completed or cancelled assessments |

**Query Pattern Example:**
```typescript
// All pages follow this pattern - query assessments by stage
const { data: assessments } = await locals.supabase
  .from('assessments')
  .select(`
    *,
    request:requests!inner(*, client:clients(*)),
    appointment:appointments(*, engineer:engineers(*))
  `)
  .eq('stage', 'inspection_scheduled')  // or .in('stage', [...])
  .order('updated_at', { ascending: false });
```

### 3. Appointment Management Workflow (Implemented Jan 2025)

**Core Capabilities:**
ClaimTech provides comprehensive appointment management with cancellation fallback and rescheduling tracking.

**Appointment Lifecycle States:**
```
scheduled → confirmed → in_progress → completed
         ↓             ↓
      cancelled    rescheduled
```

**1. Appointment Cancellation with Stage Fallback**

When an appointment is cancelled, the system automatically reverts the assessment stage to enable rescheduling:

```typescript
// Cancel appointment with automatic stage fallback
const cancelledAppointment = await appointmentService.cancelAppointmentWithFallback(
  appointmentId,
  'Engineer unavailable due to emergency', // Optional reason
  locals.supabase
);

// Behind the scenes:
// 1. Appointment status → 'cancelled'
// 2. Appointment cancelled_at → timestamp
// 3. Appointment cancellation_reason → reason stored
// 4. Assessment stage → 'inspection_scheduled' (automatic fallback)
// 5. Audit logs created for both operations
```

**Why Fallback is Critical:**
- Cancelled appointments can't remain at `appointment_scheduled` stage
- Automatic reversion to `inspection_scheduled` enables workflow continuation
- Admin can reschedule with new appointment
- Assessment never gets "stuck" in the pipeline

**2. Appointment Rescheduling with Tracking (Migration 076)**

Comprehensive rescheduling system tracks history, count, and reasons:

```typescript
// Reschedule appointment with full tracking
const input: RescheduleAppointmentInput = {
  appointment_date: '2025-01-30', // New date
  appointment_time: '14:00',      // New time
  duration_minutes: 60,
  notes: 'Client requested afternoon slot',
  location_address: '123 Main St',
  location_city: 'Cape Town',
  location_province: 'Western Cape'
};

const rescheduled = await appointmentService.rescheduleAppointment(
  appointmentId,
  input,
  'Client requested different time due to work conflict', // Reason
  locals.supabase
);

// Result:
// 1. Appointment date/time updated
// 2. Appointment status → 'rescheduled'
// 3. Original date preserved in rescheduled_from_date
// 4. reschedule_count incremented
// 5. reschedule_reason stored
// 6. Assessment stage unchanged (appointment still active)
// 7. Comprehensive audit log created
```

**Smart Reschedule Detection:**
- Only increments `reschedule_count` if date OR time changes
- Updates to location/notes use `updateAppointment()` instead
- Prevents false reschedule counts from minor updates

**Reschedule Tracking Fields:**
```sql
-- Added in Migration 076 (Jan 2025)
rescheduled_from_date TIMESTAMPTZ  -- Original date before most recent reschedule
reschedule_count INTEGER DEFAULT 0  -- Number of times rescheduled
reschedule_reason TEXT              -- Reason for most recent reschedule
```

**UI Support:**
- **Detail Page**: Reschedule modal with date validation
- **List Page**: Inline reschedule from appointments table
- **History Display**: Shows reschedule count, original date, reason
- **Date Validation**: Prevents past date selection

**3. UI Implementation (Updated Jan 27, 2025)**

**Appointments Page** (`/work/appointments`):
- **Component Stack**: `ModernDataTable` with `ActionIconButton` for inline actions
- **Data Query**: Filters assessments by `stage = 'appointment_scheduled'`
- **Action Icons**:
  - `Calendar` - Reschedule appointment (opens modal)
  - `Play` - Start assessment (navigates to detail page)
  - `Eye` - View details (opens summary modal)

**Component Usage:**
```svelte
<ActionButtonGroup align="right">
  <ActionIconButton
    icon={Calendar}
    label="Reschedule Appointment"
    onclick={() => openRescheduleModal(appointment)}
  />
  <ActionIconButton
    icon={Play}
    label="Start Assessment"
    onclick={() => goto(`/work/assessments/${appointment.id}`)}
    variant="primary"
  />
  <ActionIconButton
    icon={Eye}
    label="View Details"
    onclick={() => handleRowClick(appointment)}
  />
</ActionButtonGroup>
```

**Stage Transition Behavior:**
When engineer clicks "Start Assessment":
1. Assessment stage updates: `appointment_scheduled` → `assessment_in_progress`
2. User navigates to assessment detail page
3. On return to appointments page, appointment has disappeared from list
4. Assessment now visible on "Open Assessments" page (which queries `assessment_in_progress`)

**Why It Works:**
- Navigation causes automatic data refresh
- Stage-based filtering naturally separates scheduled vs in-progress
- No manual `invalidateAll()` required
- Clean separation of concerns between appointment status and assessment stage

**Table Utilities:**
- `formatDate()` - Consistent date formatting
- `formatVehicle()` - Vehicle display with year/make/model
- `isAppointmentOverdue()` - Check if appointment time has passed

**Audit Trail:**
Both operations create comprehensive audit logs:
```json
{
  "entity_type": "appointment",
  "action": "rescheduled",
  "metadata": {
    "appointment_number": "APT-2025-001",
    "original_date": "2025-01-28T10:00:00Z",
    "new_date": "2025-01-30T14:00:00Z",
    "reschedule_count": 2,
    "reason": "Client work conflict"
  }
}
```

### 4. Assessment Process (Multi-Tab Data Collection)
The assessment page (`/work/assessments/[appointment_id]`) contains multiple tabs:
1. **Identification**: Vehicle details, photos (VIN, registration, license disc)
2. **Exterior 360**: 8-position 360° photos + additional photos
3. **Tyres**: Tyre details, tread depth, condition for each position
4. **Interior & Mechanical**: Interior photos, mechanical checks, systems status
5. **Accessories**: Aftermarket additions (mags, tow bars, etc.)
6. **Damage**: Damage records with photos, repair estimates
7. **Estimate**: Line items (parts, labour, paint, outwork) with calculations
8. **Pre-Incident**: Pre-existing damage estimates
9. **Vehicle Values**: Market value, trade-in value, condition adjustments
10. **Notes**: Assessment notes by tab/section
11. **Summary & Finalize**: Review and finalize

### 4. Authentication Flow

**Login Flow:**
```
User visits protected route
  ↓
hooks.server.ts checks session
  ↓
If no session → redirect to /auth/login
  ↓
User logs in via Supabase Auth (form action in +page.server.ts)
  ↓
Session created and stored in cookies
  ↓
User profile created/updated in user_profiles table
  ↓
User redirected to /dashboard
```

**Logout Flow:**
```
User clicks logout button
  ↓
Form submits to /auth/logout (form action)
  ↓
+page.server.ts calls supabase.auth.signOut()
  ↓
Session cleared from cookies
  ↓
User redirected to /auth/login
```

**Password Reset Flow:**
```
User clicks "Forgot password?" on login page
  ↓
Enters email on /auth/forgot-password
  ↓
Supabase sends password reset email
  ↓
User clicks link in email
  ↓
Redirected to /auth/callback?type=recovery
  ↓
Callback handler redirects to /auth/reset-password
  ↓
User sets new password
  ↓
Redirected to /dashboard
```

**Engineer Creation with Password Reset (Admin-Only):**
```
Admin navigates to /engineers/new
  ↓
Fills in engineer details (name, email, phone, province, company)
  ↓
Form submits to +page.server.ts
  ↓
Server creates auth user with Supabase Admin API
  ↓
Creates engineer record with auth_user_id
  ↓
Triggers password reset email
  ↓
Engineer receives email and sets password
  ↓
Admin redirected to engineer detail page
```

**Root Route (`/`) Handling:**
```
User navigates to /
  ↓
hooks.server.ts checks session
  ↓
If authenticated → redirect to /dashboard
If not authenticated → redirect to /auth/login
```

### 5. Engineer Management Workflow (Admin-Only)

**Engineer List & Search:**
```
Admin navigates to /engineers
  ↓
DataTable displays all engineers
  ↓
Click row → navigate to /engineers/[id] (detail page)
  ↓
Click "New Engineer" → navigate to /engineers/new
```

**Create Engineer:**
```
Admin fills in form (name, email, phone, province, specialization, company)
  ↓
Form action creates:
  1. Auth user (Supabase Admin API with temp password)
  2. Engineer record (linked via auth_user_id)
  ↓
Triggers password reset email
  ↓
Engineer receives email with password reset link
  ↓
Admin redirected to /engineers/[id] (detail page)
```

**View Engineer Details:**
```
Admin on /engineers/[id]
  ↓
Displays:
  - Basic info (name, email, phone, province)
  - Professional details (specialization, company type)
  - Status (active/inactive)
  - Metadata (created, last updated)
  ↓
Actions available:
  - Edit (navigate to edit page)
  - Activate/Deactivate (toggle is_active)
```

**Edit Engineer:**
```
Admin clicks "Edit" button on detail page
  ↓
Navigates to /engineers/[id]/edit
  ↓
Form pre-populated with current engineer data
  ↓
Email field is READ-ONLY (cannot be changed)
  ↓
Admin updates fields and submits
  ↓
Form action updates engineer record
  ↓
Redirected back to /engineers/[id] (detail page)
```

**Resend Password Reset:**
```
Admin on /engineers/[id]/edit
  ↓
Clicks "Resend Password Reset Email" button
  ↓
Separate form action (action="?/resendPassword")
  ↓
Server sends password reset email via Supabase
  ↓
Success message displayed on same page
  ↓
Engineer receives new password reset email
```

**Access Control:**
- All `/engineers/*` routes are admin-only (enforced by parent layout)
- Engineers cannot access engineer management pages
- Engineers cannot edit their own profiles (admin-only)
- Email address cannot be changed (tied to auth account)

---

### 6. Engineer Workflow & Role-Based Filtering

The platform implements comprehensive role-based access control with two distinct user experiences:

**Admin Experience:**
- Full access to all data across the system
- Can see ALL requests, inspections, appointments, assessments, FRC, and additionals
- Manages clients, engineers, and company settings
- Sidebar badge counts show total system counts

**Engineer Experience:**
- Limited to assigned work only
- Dashboard shows only metrics for their assigned appointments/assessments
- Sidebar badge counts filtered by engineer_id
- Cannot access admin-only sections

#### Engineer Navigation & Filtering

**Sidebar Sections (Engineer View):**
```
General
  - Dashboard (filtered metrics)

Work
  - Assigned Work (inspections assigned to engineer)
  - Appointments (engineer's scheduled appointments)
  - Open Assessments (engineer's in-progress assessments)
  - Finalized Assessments (engineer's submitted assessments)
  - FRC (engineer's FRC records)
  - Additionals (engineer's additional work items)
  - Archive (engineer's archived/cancelled work)
```

**Hidden from Engineers:**
- Clients
- Requests
- Inspections (shown as "Assigned Work" for engineers)
- Engineers (admin-only)
- Repairers
- Settings

#### Data Filtering Pattern

**Three-Layer Security:**
1. **Route Protection** - Layout server redirects non-admins from admin routes
2. **Service Layer** - All services accept optional `engineer_id` parameter
3. **RLS Policies** - Database-level enforcement (future enhancement)

**Service Layer Implementation:**
```typescript
// Pattern used across all services
async listAppointments(filters?: {
  status?: string;
  engineer_id?: string;  // Optional engineer filtering
}, client?: ServiceClient): Promise<Appointment[]> {
  let query = db.from('appointments').select('*');

  if (filters?.engineer_id) {
    query = query.eq('engineer_id', filters.engineer_id);
  }

  return data || [];
}
```

**Page Server Implementation:**
```typescript
// Pattern used across all work pages
export const load: PageServerLoad = async ({ locals, parent }) => {
  const { role, engineer_id } = await parent();  // From layout server
  const isEngineer = role === 'engineer';

  const data = await service.listItems(
    locals.supabase,
    isEngineer ? engineer_id : undefined  // Filter by engineer if engineer role
  );

  return { data };
};
```

#### Sidebar Badge Counts

**Implementation:**
```typescript
// Sidebar.svelte - Badge loading functions
async function loadAppointmentCount() {
  const filters: any = { status: 'scheduled' };
  if (role === 'engineer' && engineer_id) {
    filters.engineer_id = engineer_id;  // Filter for engineers
  }
  appointmentCount = await appointmentService.getAppointmentCount(filters, $page.data.supabase);
}
```

**All badge counts filter by engineer:**
- Assigned Work (inspections) - `assigned_engineer_id`
- Appointments - `engineer_id`
- Open Assessments - via `appointments.engineer_id` join
- Finalized Assessments - via `appointments.engineer_id` join
- FRC - via nested `assessments.appointments.engineer_id` join
- Additionals - via nested `assessments.appointments.engineer_id` join

#### Archive Filtering

**Archive page shows role-specific data:**
```typescript
// Admin sees all archive data
// Engineers see only their archived/cancelled work

const [archivedAssessments, cancelledAppointments, cancelledAssessments] = await Promise.all([
  assessmentService.listArchivedAssessments(locals.supabase, isEngineer ? engineer_id : undefined),
  appointmentService.listCancelledAppointments(locals.supabase, isEngineer ? engineer_id : undefined),
  assessmentService.listCancelledAssessments(locals.supabase, isEngineer ? engineer_id : undefined)
]);

// Requests and inspections return empty arrays for engineers (admin-only)
const cancelledRequests = isEngineer ? [] : await requestService.listCancelledRequests(locals.supabase);
const cancelledInspections = isEngineer ? [] : await inspectionService.listCancelledInspections(locals.supabase);
```

#### Engineer Workflow Steps

**Complete Workflow (Engineer Perspective):**
```
1. Admin assigns inspection to engineer
   ↓
2. Inspection appears in engineer's "Assigned Work"
   ↓
3. Engineer creates appointment from inspection
   ↓
4. Appointment shows in "Appointments"
   ↓
5. Engineer conducts assessment (appears in "Open Assessments")
   ↓
6. Engineer finalizes assessment (moves to "Finalized Assessments")
   ↓
7. FRC workflow begins (appears in "FRC")
   ↓
8. Additional work items (appears in "Additionals")
   ↓
9. Completed work archived (appears in "Archive")
```

**Data Visibility Throughout Workflow:**
- Engineer sees ONLY inspections/appointments/assessments assigned to them
- Dashboard metrics reflect only their workload
- Badge counts show only their pending work
- Archive shows only their completed/cancelled work

---

## Database Architecture

See `database_schema.md` for detailed schema documentation.

### Core Tables
- `clients`: Insurance companies and private clients
- `requests`: Claim/inspection requests
- `engineers`: Field engineers who perform assessments
- `appointments`: Scheduled inspection appointments
- `inspections`: Inspection records
- `assessments`: Main assessment records
- `assessment_*`: Related assessment data (vehicle ID, exterior, tyres, damage, etc.)
- `assessment_estimates`: Estimate line items
- `assessment_frc`: Final Repair Costing records
- `repairers`: Repair shops
- `audit_logs`: Comprehensive audit trail
- `user_profiles`: User accounts (extends auth.users)

### Key Relationships
- Request → Inspection → Appointment → Assessment
- Assessment → Multiple sub-tables (1:1 or 1:N relationships)
- Assessment → Estimate → Estimate Photos
- Assessment → FRC → FRC Documents

---

## Integration Points

### Supabase Integration
- **Authentication**: Email/password auth with role-based access (admin/engineer)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Storage**: File storage with signed URLs
- **Realtime**: Not currently used (potential future enhancement)

### External Services
- **Puppeteer**: PDF generation (runs in serverless functions)
- **Vercel**: Hosting and deployment
- **Email**: Supabase Auth emails (confirmation, password reset)

### API Endpoints
All API routes are in `src/routes/api/`:
- `POST /api/generate-report` - Generate assessment report PDF
- `POST /api/generate-estimate` - Generate estimate PDF
- `POST /api/generate-photos-pdf` - Generate photos compilation PDF
- `POST /api/generate-photos-zip` - Generate photos ZIP file
- `POST /api/generate-frc-report` - Generate FRC report PDF
- `GET /api/photo/[...path]` - Get signed URL for photo
- `GET /api/document/[...path]` - Get signed URL for document
- `POST /api/frc/[id]/reopen` - Reopen a finalized FRC

---

## Security & Authentication

### Authentication System
- Built on **Supabase Auth**
- Two roles: `admin` (full access), `engineer` (limited access)
- User profiles stored in `user_profiles` table
- Session management via HTTP-only cookies
- JWT validation on every request

### Row Level Security (RLS)
- Enabled on all tables
- Policies enforce role-based access
- Admin users: Full CRUD on all tables
- Engineer users: Read-only on most tables, write access to assessments
- Storage buckets: Authenticated users only

### Auth Guard
Implemented in `src/hooks.server.ts`:
- Checks session on every request via `safeGetSession()` (validates JWT)
- **Explicit root route (`/`) handling**: Redirects to `/dashboard` if authenticated, `/auth/login` if not
- Redirects unauthenticated users to `/auth/login` for protected routes
- Redirects authenticated users away from auth pages to `/dashboard`
- Public routes: `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/callback`, `/auth/logout`
- **Single source of truth**: All auth redirects handled in hooks.server.ts, no redirect logic in page server loads
- **Role-based access**: Parent layout (`/routes/(app)/+layout.server.ts`) enforces admin-only routes

### Form Actions vs API Routes
**Authentication and user management use form actions** (`+page.server.ts`), not POST handlers (`+server.ts`):
- **Login**: `src/routes/auth/login/+page.server.ts` - form action
- **Logout**: `src/routes/auth/logout/+page.server.ts` - form action
- **Forgot Password**: `src/routes/auth/forgot-password/+page.server.ts` - form action
- **Reset Password**: `src/routes/auth/reset-password/+page.server.ts` - form action
- **Create Engineer**: `src/routes/(app)/engineers/new/+page.server.ts` - form action
- **Edit Engineer**: `src/routes/(app)/engineers/[id]/edit/+page.server.ts` - multiple form actions (default + resendPassword)
- **Why**: Form actions return `ActionResult` (JSON) compatible with SvelteKit's `use:enhance`
- **POST handlers** (`+server.ts`) return HTTP responses and should only be used for API endpoints, not forms

### Storage Security
- All buckets are **private** (no public access)
- Signed URLs with 1-hour expiry for photo/document access
- RLS policies enforce authentication
- Service role key used server-side for storage operations

---

## Performance Considerations

### PDF Generation
- Runs in Vercel serverless functions (5-minute timeout)
- Uses Puppeteer in headless mode
- Streaming response for progress updates
- Can take 1-2 minutes for complex reports with many photos

### Image Handling
- Photos stored in Supabase Storage
- Signed URLs prevent direct access
- API endpoints generate fresh URLs on demand
- FilePond handles client-side uploads with validation

### Database Queries
- Indexes on foreign keys and commonly queried fields
- Service layer prevents N+1 queries
- Single queries with joins where possible
- Optimistic UI updates to improve perceived performance

### Build & Deployment
- SvelteKit SSR for fast initial page loads
- Vite for fast development builds
- Vercel edge network for global CDN
- Static assets cached aggressively

---

## Development Workflow

### Local Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
npm run test:unit    # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests
npm run test         # Run all tests
```

### Code Quality
```bash
npm run lint         # ESLint check
npm run format       # Prettier format
npm run check        # Svelte type check
```

### Database Migrations
Migrations are managed in `supabase/migrations/`:
1. Create new migration file with sequential number
2. Write SQL DDL statements
3. Apply via Supabase CLI or dashboard
4. Commit migration file to git

---

## Future Enhancements

### Planned Features
- Real-time collaboration (Supabase Realtime)
- Mobile app for field engineers (React Native or Svelte Native)
- Advanced reporting and analytics dashboard
- Integration with third-party estimating tools
- Automated damage detection using AI/ML
- Voice-to-text for notes
- Offline mode for assessments

### Technical Improvements
- Incremental Static Regeneration (ISR) for static pages
- Better error handling and retry logic
- More comprehensive E2E test coverage
- Performance monitoring and logging
- Better image optimization (WebP, responsive images)
- Lazy loading for large datasets

---

## Related Documentation
- Database Schema: `database_schema.md`
- SOP: `../SOP/adding_migration.md`, `../SOP/adding_page_route.md`
- Tasks: See `../Tasks/` for feature-specific PRDs
