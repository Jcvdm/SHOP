# Client T&Cs - Complete File Reference

**All relevant files with line numbers and specific locations**

---

## DATABASE FILES

### Migration Files
```
supabase/migrations/
├── 001_initial_schema.sql (lines 5-19)
│   └── CREATE TABLE clients (current schema)
│
└── 20251102_add_terms_and_conditions_to_company_settings.sql
    └── REFERENCE: Company T&Cs migration pattern
    
NEW: 20251102_add_terms_and_conditions_to_clients.sql
    └── ADD 3 TEXT columns to clients table
```

---

## TYPE DEFINITIONS

### Client Types
```
src/lib/types/client.ts
├── Line 1-23: Current Client interface
├── Line 25-40: CreateClientInput & UpdateClientInput
│
└── MODIFY: Add 3 new optional fields after line 22
    ├── assessment_terms_and_conditions?: string | null;
    ├── estimate_terms_and_conditions?: string | null;
    └── frc_terms_and_conditions?: string | null;
```

### Assessment Types (Reference)
```
src/lib/types/assessment.ts
├── Line 691-709: CompanySettings interface (REFERENCE)
│   ├── assessment_terms_and_conditions?: string | null;
│   ├── estimate_terms_and_conditions?: string | null;
│   └── frc_terms_and_conditions?: string | null;
│
└── Line 206: UpdateCompanySettingsInput type
```

---

## SERVICE LAYER

### Client Service
```
src/lib/services/client.service.ts
├── Line 1-26: listClients() method
├── Line 28-40: getClient() method
├── Line 42-60: createClient() method
├── Line 62-80: updateClient() method
│
└── NEW: Add getClientTCs() method
    └── Fetch assessment_terms_and_conditions, estimate_terms_and_conditions, frc_terms_and_conditions
```

### Company Settings Service (Reference)
```
src/lib/services/company-settings.service.ts
├── Line 9-19: getSettings() - REFERENCE PATTERN
├── Line 24-45: updateSettings() - REFERENCE PATTERN
│
└── Pattern to follow for client T&Cs retrieval
```

---

## UI COMPONENTS

### Client Form Component
```
src/lib/components/forms/ClientForm.svelte
├── Line 1-34: Script setup & state variables
├── Line 36-175: Form structure
│   ├── Line 36-60: Basic Information section
│   ├── Line 62-156: Write-off percentages section
│   └── Line 158-168: Additional Information section
│
└── NEW: Add Terms & Conditions section after line 168
    ├── 3 textarea fields (Assessment, Estimate, FRC)
    ├── Character count validation (max 10,000 chars)
    └── Optional fields (leave empty to use company defaults)
```

### Client Detail Page
```
src/routes/(app)/clients/[id]/+page.svelte
├── Line 1-50: Script setup
├── Line 52-150: Client display & edit UI
│
└── MODIFY: Show/edit T&Cs in detail view
    └── Display current T&Cs or "Using company defaults"
```

### Client List Page (Reference)
```
src/routes/(app)/clients/+page.svelte
├── Line 1-60: Script setup & columns definition
├── Line 62-150: DataTable component
│
└── No changes needed (T&Cs not displayed in list)
```

---

## API ROUTES

### Generate Report
```
src/routes/api/generate-report/+server.ts
├── Line 7-40: Request handling & assessment fetch
├── Line 44-100: Parallel data fetching
│   ├── Line 70: Fetch company_settings
│   ├── Line 74-90: Fetch client data
│   └── Line 95-100: Fetch repairer data
│
└── MODIFY: Add client T&Cs fetch
    └── After line 90, fetch client T&Cs via clientService
```

### Generate Estimate
```
src/routes/api/generate-estimate/+server.ts
├── Line 54-80: Parallel data fetching
│   ├── Line 67: Fetch company_settings
│   ├── Line 69-79: Fetch client data
│   └── Line 80+: Fetch repairer data
│
└── MODIFY: Add client T&Cs fetch
    └── After client fetch, get client T&Cs
```

### Generate FRC Report
```
src/routes/api/generate-frc-report/+server.ts
├── Similar pattern to generate-report
│
└── MODIFY: Add client T&Cs fetch
```

---

## PDF TEMPLATES

### Report Template
```
src/lib/templates/report-template.ts
├── Line 1-35: Interface & function setup
├── Line 430-436: Assessment Notes section
├── Line 438-446: Terms & Conditions section (REFERENCE)
│   └── Uses: companySettings?.assessment_terms_and_conditions
│
└── MODIFY: Add fallback pattern
    └── Use clientTCs?.assessment_terms_and_conditions || companySettings?.assessment_terms_and_conditions
```

### Estimate Template
```
src/lib/templates/estimate-template.ts
├── Line 1-35: Interface & function setup
├── Line 656-661: Notes section
├── Line 663-671: Terms & Conditions section (REFERENCE)
│   └── Uses: companySettings?.estimate_terms_and_conditions
│
└── MODIFY: Add fallback pattern
    └── Use clientTCs?.estimate_terms_and_conditions || companySettings?.estimate_terms_and_conditions
```

### FRC Report Template
```
src/lib/templates/frc-report-template.ts
├── Similar pattern to report-template
│
└── MODIFY: Add fallback pattern for FRC T&Cs
```

---

## SETTINGS PAGE (Reference)

### Settings Page Server
```
src/routes/(app)/settings/+page.server.ts
├── Line 1-15: Load action
├── Line 17-50: Update action with T&Cs validation
│   ├── Line 22-24: Get T&Cs from form
│   ├── Line 27-35: Validate T&Cs length
│   └── Line 40+: Update company_settings
│
└── REFERENCE: Pattern for client T&Cs update
```

### Settings Page UI
```
src/routes/(app)/settings/+page.svelte
├── Line 1-26: Script setup
├── Line 172-240: Terms & Conditions section (REFERENCE)
│   ├── Line 175-195: Assessment T&Cs textarea
│   ├── Line 197-217: Estimate T&Cs textarea
│   └── Line 219-238: FRC T&Cs textarea
│
└── REFERENCE: Pattern for ClientForm T&Cs section
```

---

## IMPLEMENTATION ORDER

1. **Database** - Create migration file
2. **Types** - Update Client interface
3. **Service** - Add getClientTCs() method
4. **UI** - Update ClientForm component
5. **API Routes** - Add client T&Cs fetching
6. **Templates** - Update with fallback pattern
7. **Testing** - Verify all 3 document types

---

## KEY PATTERNS

### Fallback Pattern (Used in Templates)
```typescript
const tcToUse = clientTCs?.field || companySettings?.field;
${tcToUse ? `<div>...</div>` : ''}
```

### Service Pattern (Used in Services)
```typescript
async getClientTCs(clientId: string, client?: ServiceClient) {
  const db = client ?? supabase;
  const { data, error } = await db.from('clients').select(...).eq('id', clientId).single();
  if (error) console.error(...);
  return data;
}
```

### Form Pattern (Used in Components)
```svelte
<FormField
  label="..."
  name="field_name"
  type="textarea"
  bind:value={fieldValue}
  maxlength={MAX_LENGTH}
  rows={8}
  placeholder="Optional: ..."
/>
```

