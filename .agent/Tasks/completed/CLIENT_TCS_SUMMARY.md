# Client T&Cs Implementation - Executive Summary

**Status**: Analysis Complete ✅  
**Complexity**: Medium (follows existing company T&Cs pattern)  
**Estimated Effort**: 4-6 hours  
**Dependencies**: Company T&Cs already implemented

---

## WHAT YOU'RE BUILDING

A client-specific Terms & Conditions system where:
- Each client can optionally have their own custom T&Cs
- If a client has custom T&Cs, those are used in generated PDFs
- If a client has no custom T&Cs, company default T&Cs are used
- Applies to all 3 document types: Assessment Reports, Estimates, FRC Reports

---

## EXISTING REFERENCE IMPLEMENTATION

The company T&Cs system is **already fully implemented**:

### Database
- 3 TEXT fields in `company_settings` table
- Migration: `20251102_add_terms_and_conditions_to_company_settings.sql`

### Service
- `companySettingsService.getSettings()` - fetches company T&Cs
- `companySettingsService.updateSettings()` - updates company T&Cs

### UI
- Settings page at `/settings` with 3 textarea fields
- Character validation (max 10,000 chars each)
- Form action in `+page.server.ts`

### PDF Generation
- 3 API routes: `/api/generate-report`, `/api/generate-estimate`, `/api/generate-frc-report`
- 3 template files: `report-template.ts`, `estimate-template.ts`, `frc-report-template.ts`
- Templates use: `${companySettings?.assessment_terms_and_conditions ? ... : ''}`

---

## IMPLEMENTATION STRATEGY

### Mirror the Company T&Cs Pattern
The client T&Cs implementation will follow the **exact same pattern** as company T&Cs:

1. **Database**: Add 3 TEXT columns to `clients` table
2. **Types**: Add 3 optional fields to `Client` interface
3. **Service**: Add `getClientTCs()` method to `ClientService`
4. **UI**: Add 3 textarea fields to `ClientForm` component
5. **API Routes**: Fetch client T&Cs in all 3 generate routes
6. **Templates**: Use fallback pattern: `clientTCs?.field || companySettings?.field`

### Why This Works
- Consistent with existing codebase patterns
- Minimal changes to existing code
- Clear separation of concerns
- Easy to test and maintain

---

## KEY DIFFERENCES FROM COMPANY T&Cs

| Aspect | Company T&Cs | Client T&Cs |
|--------|--------------|------------|
| **Table** | `company_settings` (1 row) | `clients` (many rows) |
| **Scope** | Global, applies to all clients | Per-client, optional override |
| **UI Location** | `/settings` page | `/clients/[id]` detail page |
| **Fallback** | N/A (always used) | Falls back to company default |
| **Service** | `companySettingsService` | `clientService` |

---

## DELIVERABLES

### Documentation Created
1. ✅ `CLIENT_TERMS_AND_CONDITIONS_ANALYSIS.md` - Full analysis
2. ✅ `CLIENT_TCS_IMPLEMENTATION_GUIDE.md` - Step-by-step guide with code
3. ✅ `CLIENT_TCS_FILE_REFERENCE.md` - All files with line numbers
4. ✅ `CLIENT_TCS_SUMMARY.md` - This document

### What You Get
- **Complete file mapping** - Know exactly which files to modify
- **Line number references** - Find code quickly
- **Code patterns** - Copy/paste ready implementations
- **Testing checklist** - Verify everything works

---

## QUICK START

### For Implementation
1. Read `CLIENT_TCS_IMPLEMENTATION_GUIDE.md` for step-by-step instructions
2. Use `CLIENT_TCS_FILE_REFERENCE.md` to locate exact code locations
3. Follow the patterns from company T&Cs implementation

### For Understanding
1. Read this summary first
2. Review `CLIENT_TERMS_AND_CONDITIONS_ANALYSIS.md` for full context
3. Check existing company T&Cs code in the files listed

---

## CRITICAL FILES TO UNDERSTAND

### Company T&Cs (Reference)
- `src/lib/types/assessment.ts` (lines 691-709) - CompanySettings interface
- `src/lib/services/company-settings.service.ts` - Service pattern
- `src/routes/(app)/settings/+page.svelte` (lines 172-240) - UI pattern
- `src/lib/templates/report-template.ts` (lines 438-446) - Template pattern

### Client Management (Existing)
- `src/lib/types/client.ts` - Client interface
- `src/lib/services/client.service.ts` - Client service
- `src/lib/components/forms/ClientForm.svelte` - Client form
- `src/routes/(app)/clients/[id]/+page.svelte` - Client detail page

---

## IMPLEMENTATION PHASES

### Phase 1: Database & Types (30 min)
- Create migration file
- Update Client interface

### Phase 2: Service Layer (20 min)
- Add `getClientTCs()` method to ClientService

### Phase 3: UI (45 min)
- Update ClientForm with 3 textarea fields
- Update client detail page

### Phase 4: API Routes (30 min)
- Add client T&Cs fetching to 3 generate routes

### Phase 5: Templates (45 min)
- Update 3 template files with fallback pattern

### Phase 6: Testing (30 min)
- Test all 3 document types
- Verify fallback behavior

**Total: ~3 hours implementation + 1 hour testing**

---

## NEXT STEPS

1. **Review** the analysis documents
2. **Understand** the existing company T&Cs implementation
3. **Plan** your implementation order
4. **Execute** following the implementation guide
5. **Test** using the provided checklist

---

## RELATED DOCUMENTATION

- `.agent/Tasks/active/TERMS_AND_CONDITIONS_IMPLEMENTATION_CONTEXT.md` - Company T&Cs context
- `.agent/Tasks/active/TERMS_AND_CONDITIONS_TEMPLATES.md` - T&Cs template examples
- `.agent/System/database_schema.md` - Full database schema
- `.agent/README/database_quick_ref.md` - Database quick reference

