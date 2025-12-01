# Terms & Conditions Implementation Context

**Date**: November 2, 2025  
**Status**: Information Gathering - Ready for Implementation  
**Goal**: Add T&Cs sections to Assessment Reports, Estimates, and FRC documents

---

## 1. CURRENT REPORT GENERATION FLOW

### Report Generation Pipeline
```
Assessment Detail Page
  ↓
FinalizeTab.svelte (Document Generation section)
  ↓
documentGenerationService.generateDocument()
  ↓
API Route: /api/generate-report (or generate-estimate, generate-frc-report)
  ↓
Template Function: generateReportHTML() / generateEstimateHTML() / generateFRCHTML()
  ↓
PDF Generator: generatePDF() (Puppeteer)
  ↓
Supabase Storage: documents bucket
```

### Key Files
- **Service**: `src/lib/services/document-generation.service.ts`
- **API Routes**: 
  - `src/routes/api/generate-report/+server.ts`
  - `src/routes/api/generate-estimate/+server.ts`
  - `src/routes/api/generate-frc-report/+server.ts`
- **Templates**:
  - `src/lib/templates/report-template.ts`
  - `src/lib/templates/estimate-template.ts`
  - `src/lib/templates/frc-report-template.ts`

---

## 2. WHAT DATA IS CURRENTLY IN REPORTS

### Assessment Report (Damage Inspection Report)
**Data Passed to Template**:
```typescript
{
  assessment: Assessment,
  vehicleIdentification: VehicleIdentification,
  exterior360: Exterior360,
  interiorMechanical: InteriorMechanical,
  damageRecord: DamageRecord,
  companySettings: CompanySettings,
  request: Request,
  inspection: Inspection,
  client: Client,
  estimate: Estimate,
  repairer: Repairer,
  tyres: Tyre[]
}
```

**Sections in Report**:
1. Header (company info from `companySettings`)
2. Report metadata (report number, claim number, inspection date)
3. Vehicle identification (make, model, VIN, etc.)
4. Exterior 360 assessment
5. Interior/Mechanical assessment
6. Damage assessment
7. Repair estimate summary
8. **ASSESSMENT NOTES** (from `assessment.notes` field)
9. Footer (company contact info)

### Estimate Document
**Data Passed**:
```typescript
{
  assessment: Assessment,
  vehicleIdentification: VehicleIdentification,
  estimate: Estimate,
  lineItems: EstimateLineItem[],
  companySettings: CompanySettings,
  request: Request,
  client: Client,
  repairer: Repairer
}
```

**Sections**:
1. Header (company info)
2. Client & vehicle info
3. Repairer info
4. Line items (grouped: New Parts | Repairs | Paint/Blend | Other)
5. Totals breakdown
6. **NOTES** (from `estimate.notes` field)
7. **Footer with generic T&Cs** (hardcoded: "This estimate is valid for 30 days...")

### FRC Report
Similar structure with FRC-specific line items and decisions.

---

## 3. HOW NOTES ARE ADDED & DISPLAYED

### Assessment Notes System
**Table**: `assessment_notes`
**Fields**:
- `id`, `assessment_id`, `note_text`, `note_type` (manual|betterment|system)
- `note_title`, `source_tab` (which tab note was added from)
- `created_by`, `created_at`, `updated_at`, `is_edited`, `edited_at`, `edited_by`

**Where Notes Are Added From**:
1. **Manual Notes**: AssessmentNotes component (visible on all tabs)
2. **Betterment Notes**: EstimateTab.svelte (auto-created when betterment applied)
3. **Tyre Notes**: TyresTab.svelte (submitted to assessment notes)

**How They Appear in Report**:
```typescript
// In report-template.ts (line 430-435)
${assessment.notes ? `
<div class="section">
  <div class="section-title">ASSESSMENT NOTES</div>
  <div class="notes-box">${assessment.notes}</div>
</div>
` : ''}
```

**Current Issue**: `assessment.notes` is a single TEXT field on assessments table.  
**Reality**: Multiple notes stored in `assessment_notes` table.  
**Solution**: Template needs to fetch and concatenate all notes from `assessment_notes` table.

---

## 4. COMPANY SETTINGS STRUCTURE

**Table**: `company_settings` (single row)
**Current Fields**:
```typescript
{
  id: string,
  company_name: string,
  po_box: string,
  city: string,
  province: string,
  postal_code: string,
  phone: string,
  fax: string,
  email: string,
  website: string,
  logo_url?: string | null
}
```

**Service**: `src/lib/services/company-settings.service.ts`
**UI**: `src/routes/(app)/settings/+page.svelte`

---

## 5. TEMPLATE STRUCTURE FOR T&Cs

### Where to Add T&Cs in Templates

#### Assessment Report
```html
<!-- After ASSESSMENT NOTES section, before FOOTER -->
<div class="section">
  <div class="section-title">TERMS & CONDITIONS</div>
  <div class="terms-box">
    ${companySettings?.assessment_terms_and_conditions || ''}
  </div>
</div>
```

#### Estimate Document
```html
<!-- After NOTES section, before FOOTER -->
<div class="section">
  <div class="section-title">TERMS & CONDITIONS</div>
  <div class="terms-box">
    ${companySettings?.estimate_terms_and_conditions || ''}
  </div>
</div>
```

#### FRC Report
```html
<!-- After line items/decisions, before FOOTER -->
<div class="section">
  <div class="section-title">TERMS & CONDITIONS</div>
  <div class="terms-box">
    ${companySettings?.frc_terms_and_conditions || ''}
  </div>
</div>
```

---

## 6. IMPLEMENTATION STEPS

### Phase 1: Database Schema
Add 3 new TEXT fields to `company_settings` table:
- `assessment_terms_and_conditions` (TEXT, nullable)
- `estimate_terms_and_conditions` (TEXT, nullable)
- `frc_terms_and_conditions` (TEXT, nullable)

### Phase 2: TypeScript Types
Update `CompanySettings` interface in `src/lib/types/assessment.ts`:
```typescript
export interface CompanySettings {
  // ... existing fields ...
  assessment_terms_and_conditions?: string | null;
  estimate_terms_and_conditions?: string | null;
  frc_terms_and_conditions?: string | null;
}
```

### Phase 3: Settings UI
Add 3 textarea fields to `src/routes/(app)/settings/+page.svelte`:
- Assessment T&Cs
- Estimate T&Cs
- FRC T&Cs

### Phase 4: Templates
Update all 3 template files to include T&Cs sections before footer.

### Phase 5: Notes Integration
Fix assessment notes display to fetch from `assessment_notes` table instead of single field.

---

## 7. TEMPLATE EXAMPLES

### Assessment Report T&Cs Template
```html
<div class="section" style="margin-top: 30px; page-break-inside: avoid;">
  <div class="section-title">TERMS & CONDITIONS</div>
  <div style="font-size: 9pt; line-height: 1.5; color: #333; 
              border: 1px solid #ddd; padding: 12px; background: #f9f9f9;">
    ${companySettings?.assessment_terms_and_conditions || 
      'No terms and conditions specified.'}
  </div>
</div>
```

### Estimate T&Cs Template
```html
<div class="section" style="margin-top: 30px; page-break-inside: avoid;">
  <div class="section-title">TERMS & CONDITIONS</div>
  <div style="font-size: 9pt; line-height: 1.5; color: #333;">
    ${companySettings?.estimate_terms_and_conditions || 
      'This estimate is valid for 30 days from date of issue.'}
  </div>
</div>
```

---

## 8. NOTES FIELD INTEGRATION

**Current**: `assessment.notes` (single TEXT field)  
**Should Be**: Concatenated from `assessment_notes` table

**Fix in API Routes**:
```typescript
// Fetch all notes for this assessment
const { data: allNotes } = await locals.supabase
  .from('assessment_notes')
  .select('*')
  .eq('assessment_id', assessmentId)
  .order('created_at', { ascending: true });

// Concatenate into single string for template
const notesText = allNotes
  ?.map(n => `${n.note_title ? n.note_title + ': ' : ''}${n.note_text}`)
  .join('\n\n') || '';

// Pass to template
const html = generateReportHTML({
  assessment: { ...assessment, notes: notesText },
  // ... other data
});
```

---

## 9. REPAIRER-SPECIFIC T&Cs

**Option 1**: Add `terms_and_conditions` field to `repairers` table
**Option 2**: Use company-wide T&Cs with repairer name substitution
**Option 3**: Combine both (company T&Cs + repairer-specific additions)

**Recommended**: Option 3 - Company T&Cs as base, repairer can add specific notes.

---

## Related Files
- `.agent/System/database_schema.md` - Full schema reference
- `.agent/README/database_quick_ref.md` - Quick database reference
- `src/routes/(app)/settings/+page.svelte` - Settings UI
- `src/lib/services/company-settings.service.ts` - Settings service

