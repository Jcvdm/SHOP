# Client Terms & Conditions Implementation Analysis

**Date**: November 2, 2025  
**Status**: Analysis Complete - Ready for Implementation  
**Goal**: Implement client-specific T&Cs with fallback to company defaults

---

## 1. EXISTING COMPANY T&Cs IMPLEMENTATION

### Database Schema
**Table**: `company_settings` (single row)
**T&Cs Fields** (added via migration `20251102_add_terms_and_conditions_to_company_settings.sql`):
- `assessment_terms_and_conditions` (TEXT, nullable)
- `estimate_terms_and_conditions` (TEXT, nullable)
- `frc_terms_and_conditions` (TEXT, nullable)

### TypeScript Types
**File**: `src/lib/types/assessment.ts` (lines 691-709)
```typescript
export interface CompanySettings {
  // ... existing fields ...
  assessment_terms_and_conditions?: string | null;
  estimate_terms_and_conditions?: string | null;
  frc_terms_and_conditions?: string | null;
}
```

### Service Layer
**File**: `src/lib/services/company-settings.service.ts`
- `getSettings(client?: ServiceClient)` - Fetches single company_settings row
- `updateSettings(input, client?)` - Updates company_settings

### UI Management
**File**: `src/routes/(app)/settings/+page.svelte`
- 3 textarea fields for Assessment, Estimate, FRC T&Cs
- Character count validation (max 10,000 chars each)
- Form action: `?/update` in `+page.server.ts`

### PDF Generation
**Files**:
- `src/lib/templates/report-template.ts` (lines 438-446)
- `src/lib/templates/estimate-template.ts` (lines 663-671)
- `src/lib/templates/frc-report-template.ts` (similar pattern)

**Pattern**: `${companySettings?.assessment_terms_and_conditions ? ... : ''}`

---

## 2. CLIENT TABLE STRUCTURE

**File**: `src/lib/types/client.ts`
**Current Fields**:
```typescript
interface Client {
  id: string;
  name: string;
  type: 'insurance' | 'private';
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  notes?: string | null;
  borderline_writeoff_percentage: number;
  total_writeoff_percentage: number;
  salvage_percentage: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}
```

**Database**: `supabase/migrations/001_initial_schema.sql` (lines 5-19)

---

## 3. PROPOSED CLIENT T&Cs IMPLEMENTATION

### Phase 1: Database Schema
Add 3 new TEXT fields to `clients` table:
```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS assessment_terms_and_conditions TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS estimate_terms_and_conditions TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS frc_terms_and_conditions TEXT;
```

### Phase 2: TypeScript Types
Update `Client` interface in `src/lib/types/client.ts`:
```typescript
export interface Client {
  // ... existing fields ...
  assessment_terms_and_conditions?: string | null;
  estimate_terms_and_conditions?: string | null;
  frc_terms_and_conditions?: string | null;
}
```

### Phase 3: Service Layer
Create `getClientTCs()` method in `src/lib/services/client.service.ts`:
```typescript
async getClientTCs(clientId: string, client?: ServiceClient) {
  const db = client ?? supabase;
  const { data } = await db
    .from('clients')
    .select('assessment_terms_and_conditions, estimate_terms_and_conditions, frc_terms_and_conditions')
    .eq('id', clientId)
    .single();
  return data;
}
```

### Phase 4: Client Settings UI
Add T&Cs section to `src/routes/(app)/clients/[id]/+page.svelte`:
- 3 textarea fields (Assessment, Estimate, FRC T&Cs)
- Optional fields (can be empty to use company defaults)
- Character count validation (max 10,000 chars each)
- Save via existing client update action

### Phase 5: PDF Generation Integration
Update API routes to use fallback pattern:
```typescript
// In generate-report, generate-estimate, generate-frc-report
const clientTCs = client?.assessment_terms_and_conditions;
const tcToUse = clientTCs || companySettings?.assessment_terms_and_conditions;
```

Update templates to accept optional client T&Cs:
```typescript
interface ReportData {
  // ... existing fields ...
  clientTCs?: { assessment?: string | null; estimate?: string | null; frc?: string | null };
}
```

---

## 4. IMPLEMENTATION CHECKLIST

- [ ] Create migration: `add_terms_and_conditions_to_clients.sql`
- [ ] Update `Client` interface with 3 new T&Cs fields
- [ ] Add `getClientTCs()` method to `ClientService`
- [ ] Update `ClientForm.svelte` with T&Cs textarea fields
- [ ] Update client detail page to show/edit T&Cs
- [ ] Update API routes (generate-report, generate-estimate, generate-frc-report)
- [ ] Update template functions to accept client T&Cs
- [ ] Update template HTML to use fallback pattern
- [ ] Test: Client with custom T&Cs
- [ ] Test: Client without T&Cs (uses company defaults)

---

## 5. KEY FILES TO MODIFY

| File | Changes |
|------|---------|
| `supabase/migrations/` | New migration file |
| `src/lib/types/client.ts` | Add 3 T&Cs fields |
| `src/lib/services/client.service.ts` | Add `getClientTCs()` method |
| `src/lib/components/forms/ClientForm.svelte` | Add T&Cs textareas |
| `src/routes/(app)/clients/[id]/+page.svelte` | Show/edit T&Cs |
| `src/routes/api/generate-report/+server.ts` | Fetch client T&Cs |
| `src/routes/api/generate-estimate/+server.ts` | Fetch client T&Cs |
| `src/routes/api/generate-frc-report/+server.ts` | Fetch client T&Cs |
| `src/lib/templates/report-template.ts` | Use fallback pattern |
| `src/lib/templates/estimate-template.ts` | Use fallback pattern |
| `src/lib/templates/frc-report-template.ts` | Use fallback pattern |

---

## 6. RELATED DOCUMENTATION

- `.agent/Tasks/active/TERMS_AND_CONDITIONS_IMPLEMENTATION_CONTEXT.md` - Company T&Cs context
- `.agent/Tasks/active/TERMS_AND_CONDITIONS_TEMPLATES.md` - T&Cs template examples
- `.agent/System/database_schema.md` - Full database schema
- `src/lib/services/company-settings.service.ts` - Company settings pattern

