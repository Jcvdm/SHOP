# Notes & Assessment Data Flow - Technical Details

---

## 1. ASSESSMENT NOTES TABLE STRUCTURE

**Table**: `assessment_notes`

```sql
CREATE TABLE assessment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'manual' 
    CHECK (note_type IN ('manual', 'betterment', 'system')),
  note_title TEXT,
  source_tab TEXT,  -- Which tab note was created from
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  edited_by UUID REFERENCES auth.users(id)
);
```

---

## 2. HOW NOTES ARE CREATED

### From Assessment Notes Component (Manual Notes)
**File**: `src/lib/components/assessment/AssessmentNotes.svelte`

```typescript
async function handleAddNote(noteText: string) {
  try {
    await assessmentNotesService.createNote({
      assessment_id: assessmentId,
      note_text: noteText,
      note_type: 'manual',
      source_tab: currentTab  // Tracks which tab note added from
    });
    onUpdate();
  } catch (error) {
    console.error('Error adding note:', error);
  }
}
```

**Tabs Where Notes Can Be Added**:
- summary
- identification
- exterior_360
- interior_mechanical
- tyres
- damage
- vehicle_values
- pre_incident_estimate
- estimate
- finalize
- additionals
- frc

### From Estimate Tab (Betterment Notes)
**File**: `src/lib/components/assessment/EstimateTab.svelte`

```typescript
// When betterment applied to line item
await assessmentNotesService.createBettermentNote(
  assessmentId,
  item.id!,
  item.description,
  noteText,
  item.betterment_total || 0,
  'estimate'  // source_tab
);
```

### From Tyres Tab (Tyre Notes)
**File**: `src/lib/components/assessment/TyresTab.svelte`

```typescript
// Submit tyre note to assessment notes
await assessmentNotesService.createNote({
  assessment_id: assessmentId,
  note_text: tyre.notes,
  note_type: 'manual',
  note_title: `Tyre Note: ${tyre.position_label}`,
  source_tab: 'tyres'
});
```

---

## 3. HOW NOTES ARE RETRIEVED

**Service**: `src/lib/services/assessment-notes.service.ts`

```typescript
async getNotesByAssessment(assessmentId: string): Promise<AssessmentNote[]> {
  const { data, error } = await supabase
    .from('assessment_notes')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching assessment notes:', error);
    throw new Error(`Failed to fetch assessment notes: ${error.message}`);
  }
  
  return data || [];
}
```

**Called From**:
- Assessment detail page: `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte`
- AssessmentNotes component for display

---

## 4. CURRENT ISSUE: NOTES IN REPORT TEMPLATE

**Problem**: Report template uses `assessment.notes` (single TEXT field on assessments table)

**Current Code** in `src/lib/templates/report-template.ts`:
```typescript
<!-- Assessment Notes -->
${assessment.notes ? `
<div class="section">
  <div class="section-title">ASSESSMENT NOTES</div>
  <div class="notes-box">${assessment.notes}</div>
</div>
` : ''}
```

**Issue**: 
- `assessment.notes` is a single field, not populated from `assessment_notes` table
- Multiple notes stored in `assessment_notes` table are NOT displayed in PDF
- Only notes manually added to `assessment.notes` field appear

**Solution**: Fetch from `assessment_notes` table in API route and concatenate

---

## 5. HOW TO FIX NOTES IN REPORT GENERATION

**File**: `src/routes/api/generate-report/+server.ts`

**Current Code** (around line 80-100):
```typescript
// Fetch assessment data
const { data: assessment, error: assessmentError } = await locals.supabase
  .from('assessments')
  .select('*')
  .eq('id', assessmentId)
  .single();
```

**Add This After Assessment Fetch**:
```typescript
// Fetch all notes for this assessment
const { data: allNotes, error: notesError } = await locals.supabase
  .from('assessment_notes')
  .select('*')
  .eq('assessment_id', assessmentId)
  .order('created_at', { ascending: true });

// Concatenate notes into single string for template
const notesText = allNotes
  ?.map(note => {
    let noteContent = '';
    if (note.note_title) {
      noteContent += `${note.note_title}\n`;
    }
    noteContent += note.note_text;
    if (note.source_tab) {
      noteContent += ` [${note.source_tab}]`;
    }
    return noteContent;
  })
  .join('\n\n') || '';

// Update assessment object with concatenated notes
assessment.notes = notesText;
```

**Then Pass to Template**:
```typescript
const html = generateReportHTML({
  assessment: { ...assessment, notes: notesText },
  // ... other data
});
```

---

## 6. ASSESSMENT DATA FLOW IN REPORT GENERATION

```
API Route: /api/generate-report
  ↓
Fetch from Database:
  ├─ assessments (main record)
  ├─ assessment_vehicle_identification
  ├─ assessment_360_exterior
  ├─ assessment_interior_mechanical
  ├─ assessment_damage
  ├─ assessment_tyres
  ├─ assessment_estimates
  ├─ assessment_notes ← FETCH ALL NOTES HERE
  ├─ requests
  ├─ inspections
  ├─ clients
  ├─ repairers
  └─ company_settings
  ↓
Concatenate Notes:
  assessment.notes = allNotes.map(n => n.note_text).join('\n\n')
  ↓
Pass to Template:
  generateReportHTML({
    assessment,
    vehicleIdentification,
    exterior360,
    interiorMechanical,
    damageRecord,
    companySettings,
    request,
    inspection,
    client,
    estimate,
    repairer,
    tyres
  })
  ↓
Template Renders:
  - Header
  - Vehicle Info
  - Damage Assessment
  - Estimate Summary
  - ASSESSMENT NOTES (from concatenated notes)
  - TERMS & CONDITIONS (from companySettings)
  - Footer
  ↓
Generate PDF:
  generatePDF(html)
  ↓
Upload to Storage:
  Supabase Storage: documents bucket
```

---

## 7. ASSESSMENT NOTES TYPE DEFINITION

**File**: `src/lib/types/assessment.ts`

```typescript
export type AssessmentNoteType = 'manual' | 'betterment' | 'system';

export interface AssessmentNote {
  id: string;
  assessment_id: string;
  note_text: string;
  note_type: AssessmentNoteType;
  note_title?: string | null;
  source_tab?: string | null;  // Tab ID where note was created
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  is_edited?: boolean;
  edited_at?: string | null;
  edited_by?: string | null;
}

export interface CreateAssessmentNoteInput {
  assessment_id: string;
  note_text: string;
  note_type?: AssessmentNoteType;
  note_title?: string;
  source_tab?: string;
  created_by?: string;
}

export interface UpdateAssessmentNoteInput {
  note_text?: string;
  note_title?: string;
  is_edited?: boolean;
  edited_at?: string;
  edited_by?: string;
}
```

---

## 8. ASSESSMENT NOTES DISPLAY IN UI

**Component**: `src/lib/components/assessment/AssessmentNotes.svelte`

**Features**:
- Chat-style display (oldest first)
- Individual note bubbles with:
  - Note type icon (manual, betterment, system)
  - Note title (if exists)
  - Note text
  - Source tab badge
  - Edit/Delete buttons
- Add note input at bottom
- Auto-scroll to latest note

**Note Bubble Styling**:
- Manual notes: Left-aligned, blue background
- Betterment notes: Right-aligned, green background
- System notes: Center-aligned, gray background

---

## 9. ASSESSMENT NOTES IN DIFFERENT CONTEXTS

### On Assessment Detail Page
- Visible on all tabs except finalize
- Scrollable container (max-height: 500px)
- Can add/edit/delete notes
- Auto-updates when notes change

### In Assessment Report PDF
- Should show all notes concatenated
- Currently broken (only shows `assessment.notes` field)
- Needs fix to fetch from `assessment_notes` table

### In Audit Trail
- Each note creation/update/deletion logged
- Audit log shows who created/edited note
- Timestamp recorded for each action

---

## 10. IMPLEMENTATION CHECKLIST

### For T&Cs Implementation:
- [ ] Add 3 new fields to `company_settings` table
- [ ] Update `CompanySettings` TypeScript interface
- [ ] Update settings form UI with 3 textarea fields
- [ ] Update all 3 template files (report, estimate, frc)
- [ ] Add T&Cs sections before footer in each template
- [ ] Test PDF generation with T&Cs content

### For Notes Fix:
- [ ] Update `/api/generate-report` to fetch `assessment_notes`
- [ ] Concatenate notes before passing to template
- [ ] Update `/api/generate-estimate` similarly
- [ ] Update `/api/generate-frc-report` similarly
- [ ] Test that all notes appear in generated PDFs

---

## 8. REPORT FORMATTING - NOTES BY SECTION

**Implementation**: `src/routes/api/generate-report/+server.ts` - `formatAssessmentNotesBySection()`

### Purpose
Format assessment notes for professional report display by grouping notes by section (Vehicle Identification, Interior, Damage, etc.) instead of chronological list.

### Key Features
1. **Filters document-specific notes**:
   - Excludes `estimate` notes (belong on estimate PDF)
   - Excludes `additionals` notes (belong on additionals PDF)
   - Excludes `frc` notes (belong on FRC PDF)

2. **Groups by source_tab with headers**:
   ```
   VEHICLE IDENTIFICATION NOTES
   Digital inspection done - based on photos from insured.

   L/D expired - insured awaiting new disc.

   INTERIOR & MECHANICAL NOTES
   All mechanical and electrical components seem to be in working order.
   ```

3. **Professional formatting**:
   - No timestamps
   - No note type indicators
   - Section headers in UPPERCASE
   - Double line breaks between notes
   - Consistent section order

### Section Mapping
| source_tab | Header | Include in Report |
|------------|--------|-------------------|
| identification | VEHICLE IDENTIFICATION NOTES | ✅ |
| exterior_360 | EXTERIOR 360 NOTES | ✅ |
| interior | INTERIOR & MECHANICAL NOTES | ✅ |
| tyres | TYRES NOTES | ✅ |
| damage | DAMAGE ASSESSMENT NOTES | ✅ |
| vehicle_values | VEHICLE VALUES NOTES | ✅ |
| pre_incident_estimate | PRE-INCIDENT ESTIMATE NOTES | ✅ |
| summary | SUMMARY NOTES | ✅ |
| finalize | FINALIZATION NOTES | ✅ |
| estimate | (Estimate Notes) | ❌ |
| additionals | (Additionals Notes) | ❌ |
| frc | (FRC Notes) | ❌ |

### Implementation Pattern
```typescript
function formatAssessmentNotesBySection(notes: any[]): string {
  // 1. Filter out document-specific notes
  const reportNotes = notes.filter(note =>
    !['estimate', 'additionals', 'frc'].includes(note.source_tab)
  );

  // 2. Group by source_tab
  const groupedNotes: Record<string, string[]> = {};
  reportNotes.forEach(note => {
    const tab = note.source_tab || 'summary';
    if (!groupedNotes[tab]) groupedNotes[tab] = [];
    groupedNotes[tab].push(note.note_text);
  });

  // 3. Build sections with headers
  const sections: string[] = [];
  sectionOrder.forEach(tab => {
    if (groupedNotes[tab]?.length > 0) {
      sections.push(`${sectionHeaders[tab]}\n${groupedNotes[tab].join('\n\n')}`);
    }
  });

  return sections.join('\n\n');
}
```

---

## Related Files
- `src/lib/services/assessment-notes.service.ts` - Notes service
- `src/lib/components/assessment/AssessmentNotes.svelte` - Notes UI
- `src/lib/templates/report-template.ts` - Report template
- `src/lib/templates/estimate-template.ts` - Estimate template
- `src/lib/templates/frc-report-template.ts` - FRC template
- `src/routes/api/generate-report/+server.ts` - Report generation API
- `src/routes/api/generate-estimate/+server.ts` - Estimate generation API
- `src/routes/api/generate-frc-report/+server.ts` - FRC generation API

