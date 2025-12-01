# Client T&Cs Implementation Guide

**Detailed code references and implementation patterns**

---

## EXISTING COMPANY T&Cs PATTERN (Reference)

### 1. Database Migration
**File**: `supabase/migrations/20251102_add_terms_and_conditions_to_company_settings.sql`
```sql
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS assessment_terms_and_conditions TEXT;
ADD COLUMN IF NOT EXISTS estimate_terms_and_conditions TEXT;
ADD COLUMN IF NOT EXISTS frc_terms_and_conditions TEXT;
```

### 2. TypeScript Interface
**File**: `src/lib/types/assessment.ts` (lines 691-709)
```typescript
export interface CompanySettings {
  id: string;
  company_name: string;
  // ... other fields ...
  assessment_terms_and_conditions?: string | null;
  estimate_terms_and_conditions?: string | null;
  frc_terms_and_conditions?: string | null;
  created_at: string;
  updated_at: string;
}
```

### 3. Service Pattern
**File**: `src/lib/services/company-settings.service.ts`
```typescript
async getSettings(client?: ServiceClient): Promise<CompanySettings | null> {
  const db = client ?? supabase;
  const { data, error } = await db.from('company_settings').select('*').single();
  if (error) {
    console.error('Error fetching company settings:', error);
    return null;
  }
  return data;
}

async updateSettings(input: UpdateCompanySettingsInput, client?: ServiceClient) {
  const existing = await this.getSettings(client);
  if (!existing) throw new Error('Company settings not found');
  
  const db = client ?? supabase;
  const { data, error } = await db
    .from('company_settings')
    .update(input)
    .eq('id', existing.id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### 4. Settings UI Pattern
**File**: `src/routes/(app)/settings/+page.svelte` (lines 172-240)
```svelte
<textarea
  id="assessment_terms_and_conditions"
  name="assessment_terms_and_conditions"
  bind:value={assessmentTCs}
  maxlength={MAX_TCS_LENGTH}
  rows="10"
  placeholder="..."
></textarea>
<p class="text-xs text-gray-500">
  {assessmentTCsLength.toLocaleString()} / {MAX_TCS_LENGTH.toLocaleString()} characters
</p>
```

### 5. PDF Template Pattern
**File**: `src/lib/templates/report-template.ts` (lines 438-446)
```typescript
<!-- Terms & Conditions -->
${companySettings?.assessment_terms_and_conditions ? `
<div class="section" style="margin-top: 30px; page-break-inside: avoid;">
  <div class="section-title">TERMS & CONDITIONS</div>
  <div style="font-size: 9pt; line-height: 1.5; color: #333; border: 1px solid #ddd; padding: 12px; background: #f9f9f9; white-space: pre-wrap;">
    ${escapeHtmlWithLineBreaks(companySettings.assessment_terms_and_conditions)}
  </div>
</div>
` : ''}
```

### 6. API Route Pattern
**File**: `src/routes/api/generate-report/+server.ts` (line 70)
```typescript
{ data: companySettings } = await locals.supabase
  .from('company_settings')
  .select('*')
  .single()
```

---

## CLIENT T&Cs IMPLEMENTATION (New)

### 1. Database Migration
**Create**: `supabase/migrations/20251102_add_terms_and_conditions_to_clients.sql`
```sql
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS assessment_terms_and_conditions TEXT;
ADD COLUMN IF NOT EXISTS estimate_terms_and_conditions TEXT;
ADD COLUMN IF NOT EXISTS frc_terms_and_conditions TEXT;

COMMENT ON COLUMN clients.assessment_terms_and_conditions IS 'Client-specific T&Cs for Assessment Reports (overrides company default)';
COMMENT ON COLUMN clients.estimate_terms_and_conditions IS 'Client-specific T&Cs for Estimates (overrides company default)';
COMMENT ON COLUMN clients.frc_terms_and_conditions IS 'Client-specific T&Cs for FRC Reports (overrides company default)';
```

### 2. Update Client Interface
**File**: `src/lib/types/client.ts` (add after line 22)
```typescript
export interface Client {
  // ... existing fields ...
  assessment_terms_and_conditions?: string | null;
  estimate_terms_and_conditions?: string | null;
  frc_terms_and_conditions?: string | null;
}
```

### 3. Add Service Method
**File**: `src/lib/services/client.service.ts` (add new method)
```typescript
async getClientTCs(clientId: string, client?: ServiceClient) {
  const db = client ?? supabase;
  const { data, error } = await db
    .from('clients')
    .select('assessment_terms_and_conditions, estimate_terms_and_conditions, frc_terms_and_conditions')
    .eq('id', clientId)
    .single();
  
  if (error) {
    console.error('Error fetching client T&Cs:', error);
    return null;
  }
  return data;
}
```

### 4. Update ClientForm Component
**File**: `src/lib/components/forms/ClientForm.svelte`
Add after line 24 (after notes field):
```svelte
let assessment_tcs = $state(client?.assessment_terms_and_conditions || '');
let estimate_tcs = $state(client?.estimate_terms_and_conditions || '');
let frc_tcs = $state(client?.frc_terms_and_conditions || '');

const MAX_TCS_LENGTH = 10000;
```

Add textarea fields in form (after notes section):
```svelte
<Card class="p-6">
  <h3 class="mb-4 text-lg font-semibold text-gray-900">Terms & Conditions</h3>
  <p class="mb-6 text-sm text-gray-600">
    Leave empty to use company default T&Cs
  </p>
  
  <div class="space-y-6">
    <FormField
      label="Assessment Report T&Cs"
      name="assessment_terms_and_conditions"
      type="textarea"
      bind:value={assessment_tcs}
      maxlength={MAX_TCS_LENGTH}
      rows={8}
      placeholder="Optional: Client-specific assessment T&Cs"
    />
    
    <FormField
      label="Estimate T&Cs"
      name="estimate_terms_and_conditions"
      type="textarea"
      bind:value={estimate_tcs}
      maxlength={MAX_TCS_LENGTH}
      rows={8}
      placeholder="Optional: Client-specific estimate T&Cs"
    />
    
    <FormField
      label="FRC Report T&Cs"
      name="frc_terms_and_conditions"
      type="textarea"
      bind:value={frc_tcs}
      maxlength={MAX_TCS_LENGTH}
      rows={8}
      placeholder="Optional: Client-specific FRC T&Cs"
    />
  </div>
</Card>
```

### 5. Update API Routes (Fallback Pattern)
**Files**: 
- `src/routes/api/generate-report/+server.ts`
- `src/routes/api/generate-estimate/+server.ts`
- `src/routes/api/generate-frc-report/+server.ts`

After fetching client data, add:
```typescript
// Fetch client T&Cs (if available)
const clientTCs = client ? await clientService.getClientTCs(client.id, locals.supabase) : null;
```

### 6. Update Template Functions
Pass client T&Cs to templates:
```typescript
const html = generateReportHTML({
  // ... existing data ...
  clientTCs: clientTCs || null
});
```

### 7. Update Template HTML
**Pattern** (use in all 3 templates):
```typescript
// Determine which T&Cs to use (client-specific or company default)
const assessmentTCsToUse = clientTCs?.assessment_terms_and_conditions || 
                           companySettings?.assessment_terms_and_conditions;

<!-- In HTML template -->
${assessmentTCsToUse ? `
<div class="section" style="margin-top: 30px; page-break-inside: avoid;">
  <div class="section-title">TERMS & CONDITIONS</div>
  <div style="font-size: 9pt; line-height: 1.5; color: #333; border: 1px solid #ddd; padding: 12px; background: #f9f9f9; white-space: pre-wrap;">
    ${escapeHtmlWithLineBreaks(assessmentTCsToUse)}
  </div>
</div>
` : ''}
```

---

## TESTING CHECKLIST

- [ ] Create client with custom T&Cs
- [ ] Generate report - verify custom T&Cs appear
- [ ] Create client without T&Cs
- [ ] Generate report - verify company default T&Cs appear
- [ ] Edit client T&Cs
- [ ] Verify changes reflected in new PDFs
- [ ] Test all 3 document types (Report, Estimate, FRC)

