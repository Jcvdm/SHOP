# T&Cs Implementation - Executive Summary

**Date**: November 2, 2025  
**Status**: Ready for Implementation  
**Complexity**: Medium (Database + UI + Templates)  
**Estimated Effort**: 4-6 hours

---

## WHAT YOU'RE BUILDING

Add customizable Terms & Conditions sections to three document types:
1. **Assessment Reports** (Damage Inspection Report)
2. **Estimate Documents** (Repair Estimate)
3. **FRC Reports** (Final Repair Costing)

Each document type will have its own T&Cs section that:
- Is managed in Company Settings
- Appears in generated PDFs before the footer
- Can be customized per document type
- Supports multi-line text with formatting preserved

---

## KEY INSIGHTS FROM CONTEXT GATHERING

### Current Report Structure
```
Report Generation Flow:
  Assessment Detail Page
    ↓ (FinalizeTab.svelte)
  Document Generation Service
    ↓ (documentGenerationService.generateDocument())
  API Route (/api/generate-report, etc.)
    ↓ (Fetches all data from database)
  Template Function (generateReportHTML, etc.)
    ↓ (Renders HTML with data)
  PDF Generator (Puppeteer)
    ↓ (Converts HTML to PDF)
  Supabase Storage (documents bucket)
```

### Data Passed to Templates
Each template receives:
- Assessment data (vehicle, damage, estimates)
- Company settings (contact info, logo)
- Client & repairer info
- All assessment notes
- Estimate line items

### Notes System
- **Storage**: `assessment_notes` table (multiple notes per assessment)
- **Types**: manual, betterment, system
- **Source Tracking**: Which tab note was created from
- **Current Issue**: Report template uses old `assessment.notes` field instead of fetching from table

---

## IMPLEMENTATION PHASES

### Phase 1: Database (30 min)
Add 3 TEXT fields to `company_settings` table:
```sql
ALTER TABLE company_settings ADD COLUMN assessment_terms_and_conditions TEXT;
ALTER TABLE company_settings ADD COLUMN estimate_terms_and_conditions TEXT;
ALTER TABLE company_settings ADD COLUMN frc_terms_and_conditions TEXT;
```

### Phase 2: TypeScript Types (15 min)
Update `CompanySettings` interface in `src/lib/types/assessment.ts`:
```typescript
export interface CompanySettings {
  // ... existing fields ...
  assessment_terms_and_conditions?: string | null;
  estimate_terms_and_conditions?: string | null;
  frc_terms_and_conditions?: string | null;
}
```

### Phase 3: Settings UI (45 min)
Add 3 textarea fields to `src/routes/(app)/settings/+page.svelte`:
- Assessment Report T&Cs
- Estimate T&Cs
- FRC Report T&Cs

Each textarea:
- Large size (400px height)
- Supports multi-line input
- Preserves formatting in PDF
- Optional (can be empty)

### Phase 4: Templates (60 min)
Update 3 template files to include T&Cs sections:

**In `src/lib/templates/report-template.ts`**:
```typescript
<!-- After ASSESSMENT NOTES, before FOOTER -->
${companySettings?.assessment_terms_and_conditions ? `
<div class="section">
  <div class="section-title">TERMS & CONDITIONS</div>
  <div class="terms-box">${companySettings.assessment_terms_and_conditions}</div>
</div>
` : ''}
```

**In `src/lib/templates/estimate-template.ts`**:
```typescript
<!-- After NOTES, before FOOTER -->
${companySettings?.estimate_terms_and_conditions ? `
<div class="section">
  <div class="section-title">TERMS & CONDITIONS</div>
  <div class="terms-box">${companySettings.estimate_terms_and_conditions}</div>
</div>
` : ''}
```

**In `src/lib/templates/frc-report-template.ts`**:
```typescript
<!-- After line items, before FOOTER -->
${companySettings?.frc_terms_and_conditions ? `
<div class="section">
  <div class="section-title">TERMS & CONDITIONS</div>
  <div class="terms-box">${companySettings.frc_terms_and_conditions}</div>
</div>
` : ''}
```

### Phase 5: Notes Fix (45 min) - BONUS
Fix assessment notes display in reports:

**In API routes** (`/api/generate-report`, `/api/generate-estimate`, `/api/generate-frc-report`):
```typescript
// Fetch all notes for this assessment
const { data: allNotes } = await locals.supabase
  .from('assessment_notes')
  .select('*')
  .eq('assessment_id', assessmentId)
  .order('created_at', { ascending: true });

// Concatenate into single string
const notesText = allNotes
  ?.map(n => `${n.note_title ? n.note_title + ': ' : ''}${n.note_text}`)
  .join('\n\n') || '';

// Pass to template
assessment.notes = notesText;
```

---

## FILES TO MODIFY

### Database
- Migration file (new): Add 3 columns to `company_settings`

### TypeScript
- `src/lib/types/assessment.ts` - Update `CompanySettings` interface

### UI
- `src/routes/(app)/settings/+page.svelte` - Add 3 textarea fields
- `src/routes/(app)/settings/+page.server.ts` - Handle form submission

### Templates
- `src/lib/templates/report-template.ts` - Add T&Cs section
- `src/lib/templates/estimate-template.ts` - Add T&Cs section
- `src/lib/templates/frc-report-template.ts` - Add T&Cs section

### API Routes (Optional - Notes Fix)
- `src/routes/api/generate-report/+server.ts` - Fetch notes from table
- `src/routes/api/generate-estimate/+server.ts` - Fetch notes from table
- `src/routes/api/generate-frc-report/+server.ts` - Fetch notes from table

---

## TESTING CHECKLIST

### Phase 1-4 (Core T&Cs)
- [ ] Settings page loads without errors
- [ ] Can save T&Cs text in settings
- [ ] T&Cs appear in generated Assessment Report PDF
- [ ] T&Cs appear in generated Estimate PDF
- [ ] T&Cs appear in generated FRC Report PDF
- [ ] Empty T&Cs don't show section in PDF
- [ ] Multi-line formatting preserved in PDF
- [ ] Special characters (©, ®, etc.) render correctly

### Phase 5 (Notes Fix)
- [ ] All assessment notes appear in report PDF
- [ ] Notes appear in correct order (oldest first)
- [ ] Note titles display correctly
- [ ] Betterment notes show with calculations
- [ ] Tyre notes display properly

---

## STYLING NOTES

### CSS for T&Cs in PDF
```css
.section-title {
  background-color: #3b82f6;
  color: white;
  padding: 10px;
  font-weight: bold;
  font-size: 12pt;
}

.terms-box {
  border: 1px solid #ddd;
  padding: 12px;
  background-color: #f9f9f9;
  font-size: 9pt;
  line-height: 1.5;
  white-space: pre-wrap;  /* Preserve line breaks */
}
```

---

## EXAMPLE T&Cs CONTENT

### Assessment Report
```
This assessment report has been compiled in accordance with the instructions 
received and represents our professional opinion based on the vehicle condition 
at the time of inspection.

INSPECTION SCOPE:
• Visual inspection only - no invasive testing performed
• Assessment based on vehicle condition at time of inspection
• Warranty and service history confirmed where available

ASSESSMENT VALIDITY:
• This assessment is valid for 30 days from the inspection date
• Vehicle condition may change - reassessment recommended if repairs delayed
```

### Estimate
```
THIS IS NOT AN AUTHORISATION FOR REPAIRS UNLESS ACCOMPANIED BY AN OFFICIAL 
AUTHORISATION FROM [COMPANY_NAME].

ESTIMATE VALIDITY:
• This estimate is valid for 30 days from the date of issue
• Prices subject to change after validity period

SCOPE OF WORK:
• Estimate covers only items listed above
• Additional repairs not quoted for must be reported immediately
```

### FRC
```
SCOPE OF FRC:
• Final costing based on actual parts and labour used
• Comparison against original estimate provided

DOCUMENTATION REQUIREMENTS:
✓ All parts invoices
✓ All outwork invoices
✓ Collection/Release Notice (signed)
✓ Copy of workmanship warranty
```

---

## RELATED DOCUMENTATION

- `.agent/Tasks/active/TERMS_AND_CONDITIONS_IMPLEMENTATION_CONTEXT.md` - Full technical context
- `.agent/Tasks/active/TERMS_AND_CONDITIONS_TEMPLATES.md` - Template examples
- `.agent/Tasks/active/NOTES_AND_ASSESSMENT_DATA_FLOW.md` - Notes system details

---

## NEXT STEPS

1. Review the three context documents above
2. Decide on T&Cs content for each document type
3. Create database migration
4. Implement in order: Database → Types → UI → Templates
5. Test each phase
6. (Optional) Fix notes display in reports

**Ready to proceed?** Let me know which phase you'd like to start with!

