# Database Quick Reference

**Last Updated**: January 30, 2025
**Purpose**: Schema summary without full details

---

## Overview

- **31 total tables** across 3 categories
- **100% RLS coverage** on all tables
- **3 storage buckets** for files/photos
- **PostgreSQL via Supabase**

---

## Table Categories

### Authentication & Users (3 tables)

```sql
auth.users           -- Supabase auth (email, password, JWT)
├── id (uuid, PK)
├── email (text)
├── encrypted_password (text)
└── created_at (timestamptz)

users                -- App user profiles
├── id (uuid, PK, FK to auth.users.id)
├── email (text)
├── role (enum: admin, engineer, finance)
├── company_id (uuid, FK to companies.id)
└── created_at (timestamptz)

engineers            -- Engineer-specific data
├── id (uuid, PK)
├── user_id (uuid, FK to users.id)
├── hourly_rate (numeric)
└── specializations (text[])
```

---

### Assessment Pipeline (10 tables)

**Core Flow**:
```
request → assessment → appointment → inspection → estimate → estimate_items
                    ↓
             additionals (subprocess)
                    ↓
             frc (subprocess)
```

**Tables**:

```sql
requests             -- Initial claim requests
├── id (uuid, PK)
├── request_number (text, unique)
├── client_name (text)
├── vehicle_make, model, year
├── created_at (timestamptz)

assessments          -- Core assessment record (ONE per request)
├── id (uuid, PK)
├── assessment_number (text, unique)
├── request_id (uuid, FK to requests.id, unique) -- 1-to-1
├── appointment_id (uuid, FK to appointments.id, nullable)
├── inspection_id (uuid, FK to inspections.id, nullable)
├── estimate_id (uuid, FK to estimates.id, nullable)
├── stage (enum: 10 stages)
├── created_at (timestamptz)

appointments         -- Scheduled appointments
├── id (uuid, PK)
├── appointment_number (text, unique)
├── engineer_id (uuid, FK to engineers.id)
├── scheduled_at (timestamptz)
├── status (enum: scheduled, completed, cancelled)

inspections          -- Inspection details
├── id (uuid, PK)
├── inspection_location (text)
├── inspection_date (date)
├── notes (text)

estimates            -- Estimate header
├── id (uuid, PK)
├── estimate_number (text, unique)
├── labour_hours (numeric)
├── labour_rate (numeric)
├── total_amount (numeric)

estimate_items       -- Individual line items
├── id (uuid, PK)
├── estimate_id (uuid, FK to estimates.id)
├── description (text)
├── quantity (numeric)
├── unit_price (numeric)
├── total (numeric)

additionals          -- Additional work subprocess
├── id (uuid, PK)
├── assessment_id (uuid, FK to assessments.id)
├── description (text)
├── amount (numeric)

frc                  -- Final Repair Costing subprocess
├── id (uuid, PK)
├── assessment_id (uuid, FK to assessments.id)
├── description (text)
├── cost (numeric)

audit_logs           -- Comprehensive audit trail (21 entity types, 21 action types)
├── id (uuid, PK)
├── entity_type (text, NOT NULL) -- 21 supported types
├── entity_id (uuid, NOT NULL) -- Typically assessment_id for context
├── action (text, NOT NULL) -- 21 action types (created, line_item_added, etc.)
├── field_name (text, nullable)
├── old_value (text, nullable)
├── new_value (text, nullable)
├── changed_by (text, nullable, DEFAULT 'System')
├── metadata (jsonb, nullable) -- Rich context (descriptions, totals, etc.)
├── created_at (timestamptz, DEFAULT NOW())
└── Indexes: (entity_type, entity_id), (created_at DESC), (action)

settings             -- App configuration
├── id (uuid, PK)
├── key (text, unique)
├── value (jsonb)
```

---

### Reference Data (8 tables)

```sql
vehicle_makes        -- Car manufacturers
vehicle_models       -- Car models
vehicle_types        -- Body types (sedan, SUV, etc.)
vehicle_colors       -- Color options

repair_methods       -- Repair vs replace
part_types           -- Part categories
part_conditions      -- New, used, refurbished
companies            -- Client companies
```

---

## Assessment Stages & Nullable FKs

| Stage | appointment_id | inspection_id | estimate_id | Why |
|-------|---------------|--------------|-------------|-----|
| `request_submitted` | NULL | NULL | NULL | Just created |
| `request_reviewed` | NULL | NULL | NULL | Admin reviewed, not scheduled |
| `appointment_scheduled` | NOT NULL | NULL | NULL | Appointment created |
| `inspection_scheduled` | NOT NULL | NULL | NULL | Engineer accepted |
| `assessment_in_progress` | NOT NULL | NOT NULL | NULL | Inspection started |
| `estimate_review` | NOT NULL | NOT NULL | NULL | Estimate being created |
| `estimate_sent` | NOT NULL | NOT NULL | NOT NULL | Estimate complete |
| `estimate_finalized` | NOT NULL | NOT NULL | NOT NULL | Ready for work |
| `frc_in_progress` | NOT NULL | NOT NULL | NOT NULL | FRC subprocess active |
| `archived` | NOT NULL | NOT NULL | NOT NULL | Completed |

**Key Pattern**: FKs become NOT NULL when assessment reaches the stage where that entity is created.

---

## Key Relationships

```
request (1) ─────────► assessment (1)  [Created together, inseparable]
                          │
                          │ (nullable until scheduled)
                          ▼
                       appointment (1)
                          │
                          │ (nullable until conducted)
                          ▼
                       inspection (1)
                          │
                          │ (nullable until completed)
                          ▼
                       estimate (1)
                          │
                          ├──────► estimate_item (*)
                          │
                          ├──────► additionals (*) [subprocess]
                          │
                          └──────► frc (*) [subprocess]
```

**Note**: Subprocess (additionals, frc) don't change assessment stage - assessment stays at `estimate_finalized`.

---

## RLS Pattern Summary

### Admin Policy (full access)
```sql
CREATE POLICY "admin_all" ON table_name
FOR ALL USING (is_admin());
```

### Engineer Policy (filtered access)
```sql
CREATE POLICY "engineer_select" ON table_name
FOR SELECT USING (
  is_admin() OR
  appointment_id IN (
    SELECT id FROM appointments WHERE engineer_id = auth.uid()
  )
);
```

### Dual-Check Pattern (nullable FKs)

Used when FK might be NULL (early stages):

```sql
CREATE POLICY "engineer_select" ON table_name
FOR SELECT USING (
  is_admin() OR
  -- Direct: FK linked to engineer's record
  (appointment_id IS NOT NULL AND
   appointment_id IN (SELECT id FROM appointments WHERE engineer_id = auth.uid()))
  OR
  -- Indirect: via parent relationship (when FK is NULL)
  (appointment_id IS NULL AND
   EXISTS (SELECT 1 FROM requests r
           WHERE r.id = table_name.request_id
           AND /* engineer check via request */))
);
```

**Why**: Early-stage assessments don't have appointment_id yet, but engineers need access via request relationship.

---

## Storage Buckets

```
assessment-photos/
├── public access (with RLS)
├── image files (JPEG, PNG)
└── max size: 5MB per file

documents/
├── authenticated access only
├── PDF files (generated reports)
└── signed URLs (60s expiry)

profile-photos/
├── public access (with RLS)
├── image files (JPEG, PNG)
└── max size: 2MB per file
```

---

## Common Queries

### List Assessments by Stage
```sql
SELECT * FROM assessments
WHERE stage = 'estimate_finalized'
ORDER BY created_at DESC;
```

### Assessment with Full Context
```sql
SELECT
  a.*,
  r.client_name,
  r.vehicle_make,
  app.scheduled_at,
  app.status as appointment_status,
  e.estimate_number,
  e.total_amount,
  u.email as engineer_email
FROM assessments a
JOIN requests r ON a.request_id = r.id
LEFT JOIN appointments app ON a.appointment_id = app.id
LEFT JOIN estimates e ON a.estimate_id = e.id
LEFT JOIN engineers eng ON app.engineer_id = eng.id
LEFT JOIN users u ON eng.user_id = u.id
WHERE a.stage = 'assessment_in_progress';
```

### Badge Count (Engineer)
```sql
SELECT COUNT(*) as count
FROM assessments
WHERE stage = 'assessment_in_progress'
  AND appointment_id IN (
    SELECT id FROM appointments
    WHERE engineer_id = auth.uid()
  );
```

### Badge Count (Admin)
```sql
SELECT COUNT(*) as count
FROM assessments
WHERE stage = 'estimate_review';
```

---

## Performance Indexes

**Critical indexes** for common queries:

```sql
-- Stage-based queries
CREATE INDEX idx_assessments_stage ON assessments(stage);

-- Engineer filtering
CREATE INDEX idx_appointments_engineer ON appointments(engineer_id);
CREATE INDEX idx_assessments_appointment ON assessments(appointment_id);

-- 1-to-1 relationships
CREATE UNIQUE INDEX idx_assessments_request ON assessments(request_id);

-- Line item queries
CREATE INDEX idx_estimate_items_estimate ON estimate_items(estimate_id);

-- Subprocess queries
CREATE INDEX idx_additionals_assessment ON additionals(assessment_id);
CREATE INDEX idx_frc_assessment ON frc(assessment_id);
```

---

## Supabase MCP Access

**Available via MCP tools for development/debugging:**

```typescript
// List all tables
mcp__supabase__list_tables({ project_id: 'your-project-id' })

// Execute SQL
mcp__supabase__execute_sql({
  project_id: 'your-project-id',
  query: 'SELECT * FROM assessments WHERE stage = $1 LIMIT 10'
})

// Apply migration
mcp__supabase__apply_migration({
  project_id: 'your-project-id',
  name: '076_add_column',
  query: 'ALTER TABLE...'
})
```

**Important**:
- MCP tools require project_id parameter
- Use for investigation/testing only, not production code
- Always use service layer in application code
- MCP permissions vary by environment configuration

---

## When to Read Full Docs

- **Complete schema**: [System/database_schema.md](../System/database_schema.md) (1,420 lines)
- **RLS details**: [System/security_recommendations.md](../System/security_recommendations.md)
- **Migration guide**: [SOP/adding_migration.md](../SOP/adding_migration.md)
- **Service patterns**: [SOP/working_with_services.md](../SOP/working_with_services.md)
- **Assessment architecture**: [SOP/working_with_assessment_centric_architecture.md](../SOP/working_with_assessment_centric_architecture.md)

---

## Related Documentation
- **[Architecture Quick Ref](./architecture_quick_ref.md)** - High-level system overview
- **[System Docs Index](./system_docs.md)** - Complete documentation list
- **[SOP Index](./sops.md)** - How-to guides

---

**Maintenance**: Update when schema changes significantly
**Last Review**: January 30, 2025
