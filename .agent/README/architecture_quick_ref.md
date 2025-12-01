# Architecture Quick Reference

**Last Updated**: January 30, 2025
**Purpose**: High-level architecture overview without deep details

---

## Tech Stack Summary

### Frontend
- **Framework**: SvelteKit 5 + TypeScript
- **Styling**: Tailwind CSS 4
- **UI State**: Svelte 5 runes (`$state`, `$derived`, `$effect`)
- **Components**: Custom component library (lucide-svelte icons)

### Backend
- **Server**: SvelteKit SSR + API routes
- **Database**: Supabase PostgreSQL (28 tables)
- **Auth**: Supabase Auth with PKCE
- **Storage**: Supabase Storage (3 buckets)
- **PDF Generation**: Puppeteer

### Development
- **Package Manager**: npm
- **Type Checking**: TypeScript strict mode
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Vitest + Playwright

### Deployment
- **Platform**: Vercel
- **Environment**: Production, Staging, Development

---

## Assessment Pipeline (10 Stages)

ClaimTech uses a stage-based workflow for vehicle damage assessments:

1. **request_submitted** - Initial claim request received
2. **request_reviewed** - Admin reviewed and approved request
3. **appointment_scheduled** - Appointment scheduled with engineer
4. **inspection_scheduled** - Engineer accepted appointment
5. **assessment_in_progress** - Engineer conducting assessment
6. **estimate_review** - Estimate created, pending admin review
7. **estimate_sent** - Estimate sent to client
8. **estimate_finalized** - Estimate finalized, ready for work
9. **frc_in_progress** - Final Repair Costing (subprocess)
10. **archived** - Assessment completed and archived

**Note**: Stages are sequential and immutable. An assessment moves forward through stages, never backward.

---

## Core Architecture Principles

### 1. Assessment-Centric Design ⭐

**Key Concept**: Assessments are the canonical "case" record in ClaimTech.

- **One assessment per request** - Created together, inseparable
- **Stage-based workflow** - Not status-based (stages are immutable, sequential)
- **Nullable foreign keys** - FKs (appointment_id, inspection_id, estimate_id) are NULL until stage reached
- **Subprocess independence** - FRC and Additionals don't affect main assessment stage

**Why**: Simplifies queries, prevents race conditions, maintains data integrity

---

### 2. Service Layer Pattern

**All database access goes through service classes:**

```typescript
export class MyService {
  constructor(private client: ServiceClient) {} // RLS authentication

  async list() {
    const { data, error } = await this.client
      .from('table')
      .select('*');
    if (error) throw error;
    return data || [];
  }
}
```

**Rules**:
- ✅ Accept ServiceClient parameter (for RLS authentication)
- ✅ Handle errors at service level
- ✅ Return clean data types
- ❌ Never create Supabase client inside service
- ❌ Never bypass service layer in components

**Why**: Enforces RLS policies, centralizes data access, enables testing

---

### 3. Security Architecture

#### 100% RLS Coverage ✅

**Every table has Row Level Security enabled:**

- **Admin Policy**: Full access to all records
  ```sql
  USING (is_admin())
  ```

- **Engineer Policy**: Access to assigned assessments only
  ```sql
  USING (
    is_admin() OR
    appointment_id IN (SELECT id FROM appointments WHERE engineer_id = auth.uid())
  )
  ```

- **Dual-Check Pattern**: For nullable FKs (e.g., appointment_id NULL in early stages)
  ```sql
  USING (
    is_admin() OR
    (appointment_id IS NOT NULL AND ...) OR  -- Direct check
    (appointment_id IS NULL AND EXISTS (...)) -- Indirect check via parent
  )
  ```

**Why**: Security at database level, can't be bypassed by client

---

### 4. UI Patterns

#### Svelte 5 Runes
```typescript
let count = $state(0);                    // Reactive state
let doubled = $derived(count * 2);        // Computed value
$effect(() => console.log(count));        // Side effects
```

#### Server-First Navigation
- Navigate to page → Load function updates state → UI reflects changes
- Idempotent load functions (safe to call multiple times)
- No client-side state mutations for stage transitions

#### Loading States
- **Global Nav Bar**: Automatic on all page navigations
- **Table Row Loading**: useNavigationLoading() utility for row clicks
- **Button Loading**: ActionIconButton `loading` prop for actions

**Why**: Better UX, prevents double-clicks, provides visual feedback

---

## Database Organization

### Core Tables (10)
- `requests` - Initial claim requests
- `assessments` - Core assessment record (one per request)
- `appointments` - Scheduled appointments
- `inspections` - Inspection details
- `estimates` - Estimate header
- `estimate_items` - Line items (parts, labour)
- `additionals` - Additional work subprocess
- `frc` - Final Repair Costing subprocess
- `audit_log` - Change tracking
- `settings` - App configuration

### Reference Data (8)
- `vehicle_makes`, `vehicle_models`, `vehicle_types`, `vehicle_colors`
- `repair_methods`, `part_types`, `part_conditions`, `companies`

### Authentication (3)
- `auth.users` - Supabase auth (email, password, JWT)
- `users` - App user profiles (role, company_id)
- `engineers` - Engineer-specific data

### Storage (3 buckets)
- `assessment-photos/` - Vehicle damage photos
- `documents/` - Generated PDFs
- `profile-photos/` - User avatars

---

## Key Workflows

### Request to Assessment Flow
1. Admin creates request → Assessment created automatically
2. Admin reviews → Stage: `request_reviewed`
3. Admin schedules appointment → Stage: `appointment_scheduled`, appointment_id set
4. Engineer accepts → Stage: `inspection_scheduled`
5. Engineer conducts inspection → Stage: `assessment_in_progress`, inspection_id set
6. Engineer completes estimate → Stage: `estimate_review`, estimate_id set
7. Admin finalizes → Stage: `estimate_finalized`
8. Optional: FRC subprocess → Stage: `frc_in_progress`
9. Archive → Stage: `archived`

### Authentication Flow
1. User submits login form (email/password)
2. Supabase Auth validates credentials
3. Server sets cookies (access_token, refresh_token - httpOnly, secure)
4. Hooks validate session on each request
5. RLS policies enforce access control

### PDF Generation Flow
1. API endpoint receives request (e.g., `/api/reports/[id]/pdf`)
2. Fetch assessment data via services
3. Render HTML template with data
4. Puppeteer generates PDF from HTML
5. Upload PDF to Supabase Storage (`documents/` bucket)
6. Return signed URL (expires in 60 seconds)

---

## Role-Based Access

### Admin Role
- Full access to all assessments
- Can create/edit requests
- Can schedule appointments
- Can finalize estimates
- Can manage reference data

### Engineer Role
- Access to assigned assessments only
- Can accept/decline appointments
- Can conduct inspections
- Can create/edit estimates
- Can add FRC/Additionals

### Finance Role (Future)
- Read-only access to finalized estimates
- Can generate reports
- Can export data

---

## When to Read Full Docs

- **Deep architecture**: [System/project_architecture.md](../System/project_architecture.md) (977 lines)
- **Database details**: [System/database_schema.md](../System/database_schema.md) (1,420 lines)
- **Security details**: [System/session_management_security.md](../System/session_management_security.md) (751 lines)
- **Assessment patterns**: [SOP/working_with_assessment_centric_architecture.md](../SOP/working_with_assessment_centric_architecture.md) (1,081 lines)

---

## Related Documentation
- **[Database Quick Ref](./database_quick_ref.md)** - Schema summary
- **[System Docs Index](./system_docs.md)** - Complete system documentation
- **[SOP Index](./sops.md)** - How-to guides

---

**Maintenance**: Update when core architecture changes
**Last Review**: January 30, 2025
