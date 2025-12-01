# ClaimTech Development Guide

Quick reference guide for developers working on ClaimTech.

---

## Development Commands

### Core Development
```bash
npm run dev          # Start development server (Vite)
npm run build        # Build production version
npm run preview      # Preview production build locally
```

### Code Quality
```bash
npm run lint         # Run ESLint and Prettier checks
npm run format       # Format all code with Prettier
npm run check        # Type check with svelte-check
npm run check:watch  # Watch mode for type checking
```

### Testing
```bash
npm run test         # Run all tests (unit + e2e)
npm run test:unit    # Run Vitest unit tests
npm run test:e2e     # Run Playwright e2e tests
```

### Single Test Execution
```bash
npx vitest run [test-file]             # Run specific unit test
npx playwright test [test-file]        # Run specific e2e test
npx vitest -t "test description"       # Run test by name
npx playwright test -g "test name"     # Run e2e test by name
```

### Database (Supabase)
```bash
npm install -g supabase                                    # Install CLI globally
supabase login                                             # Login to Supabase
supabase link --project-ref cfblmkzleqtvtfxujikf          # Link project
supabase db push                                           # Push migrations
```

**Alternative**: Run SQL from `supabase/migrations/*.sql` via Supabase SQL Editor

### PDF Generation Health Check
```
GET /api/test-puppeteer  # Test Puppeteer/Chrome installation
```

---

## Environment Variables

### Public (Client-side)
```env
PUBLIC_SUPABASE_URL=your-supabase-url
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Private (Server-side only - NEVER expose to browser)
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Configure via `.env` file or deployment environment settings.

---

## Development Workflow

### Branch Strategy
- **main**: Production branch (default)
- **dev/dashboard**: Feature branch for dashboard work
- **Supabase Branching**: Integrated with GitHub - automatic preview branches on PRs
- **Environment-based**: Configuration via .env files

### Development Rules
- Don't launch `npm run dev` or test URLs with curl (user runs dev server)
- Add fixes as explicit tasks with clear instructions for agent handover
- Use Supabase branching: main (production), dev/staging (development)

---

## Key Development Patterns

### Server-Side Data Loading

Always use authenticated Supabase client in `+page.server.ts`:

```typescript
export const load: PageServerLoad = async ({ locals }) => {
  const items = await itemService.listItems(locals.supabase);
  return { items };
};
```

### Error Handling

Implement comprehensive error handling in services:

```typescript
catch (error) {
  console.error('Operation failed:', error);
  throw new Error(`Operation failed: ${error.message}`);
}
```

### Type Safety

Use generated database types and create proper TypeScript interfaces:

```typescript
import type { Database } from '$lib/types/database';
import type { ServiceClient } from '$lib/types/service';
```

### Auto-save Implementation

Assessment tabs use hybrid localStorage draft + reactive sync pattern:

```typescript
// User input saves to localStorage draft immediately
// After 2s debounce saves to database
// Handler returns updated record and updates parent data prop
// Child component uses $effect to sync local state with data prop
// Check !draft.hasDraft() first, never use invalidateAll()
const { draft, updateDraft, saveDraft } = useDraft(initialData, saveFunction);
```

**Auto-save Rules**:
- Auto-save on tab change for EstimateTab via onRegisterSave callback
- PreIncidentEstimateTab uses local buffer pattern with dirty/saving flags
- Save/Discard buttons positioned inside Line Items Table header
- Queue pattern with loading states for optimistic updates

---

## Assessment System Specifics

- **Global Notes**: Single large note area shared across all assessment tabs
- **Transmission Type**: Selector (automatic/manual) with gear lever photo on interior tab
- **Vehicle Power Status**: Field for power status tracking
- **Damage Records**: One-per-assessment with unique constraint on assessment_id
- **Estimates**: Show process type symbols (N, R, P, B, A, O) instead of full labels
- **Color Coding**: RED (within 10% write-off), YELLOW (below 60%), GREEN (below 25%)

---

## UI/UX Rules

- Action buttons (like 'New Client') appear only on list pages as header buttons, not in sidebar
- Warranty status hints on estimate tabs
- Filter reversed items using reversal action logic
- Audit log system tracks all status changes with ActivityTimeline component

---

## Database Considerations

### Row Level Security (RLS)
- All tables use RLS policies
- Use authenticated client (`locals.supabase`) to respect user context
- Service role client (`supabase-server.ts`) only for storage and admin operations

### Migration Pattern
Database migrations are stored in `supabase/migrations/` with descriptive names:
- Follow sequential numbering
- Include comprehensive documentation in migration files
- Test migrations on preview branches before production

### Storage Organization

**Supabase project ID**: `cfblmkzleqtvtfxujikf`

**'documents' bucket (private)** - PDFs/reports:
```
documents/
├── assessments/[assessment_id]/
│   ├── reports/
│   ├── estimates/
│   └── photos/
```

**'SVA Photos' bucket (private)** - Assessment photos with proper RLS policies for authenticated users

---

## Coding Guidelines

### General Rules
- Use TypeScript strict mode with proper error handling
- Follow SvelteKit SSR patterns for data loading
- Implement proper loading and error states in components
- Use semantic HTML with ARIA labels for accessibility
- Follow the service pattern for all database operations
- Use Server-Sent Events for long-running operations
- Implement comprehensive audit logging for all CRUD operations

---

## Performance Considerations

- Extended timeouts for PDF generation (300s function timeout, 600s dev server)
- Streaming responses prevent browser timeouts during document generation
- Optimistic updates for better UX during auto-save operations
- Proper indexing on database queries for large datasets

---

## Key Files to Understand

- `src/hooks.server.ts` - Authentication middleware and Supabase client setup
- `src/routes/(app)/+layout.server.ts` - Session management
- `src/lib/services/request.service.ts` - Example of service pattern
- `src/lib/utils/pdf-generator.ts` - PDF generation with retry logic
- `src/lib/utils/streaming-response.ts` - SSE implementation for long operations
- `src/lib/components/assessment/FinalizeTab.svelte` - Contains ENABLE_FORCE_FINALIZE flag (line 72)

---

## Finalization & Additionals System

### Force Finalize Testing
**CRITICAL**: `ENABLE_FORCE_FINALIZE = true` on line 72 in `FinalizeTab.svelte` - **MUST be false before production**

### Additionals Workflow
- Enable additionals on finalized assessments with finalize action
- 'Additional' tab on finalized/closed assessments reuses estimate components
- Additional line items default to pending, can be approved or declined
- Display consolidated approved estimate (original + additionals, exclude removed items)

### FRC (Final Repair Costing)
- FRC tab on closed assessments with Start FRC button
- Allow invoice/document uploads
- Per-line approve/agree or decline with corrected value input
- Show labour/parts/paint/other totals
- FRC completion requires 'AGREE AND SIGN OFF' action with engineer details

---

## Development Environment Setup

Ensure these are configured:
- **Supabase Project**: cfblmkzleqtvtfxujikf with proper RLS policies
- **Storage Buckets**: 'documents' and 'SVA Photos' (both private)
- **Email templates** configured for authentication
- **Environment variables** for Supabase connection
- **Chrome/Chromium** installed for PDF generation (Puppeteer dependency)

### Engineer Assignment
- Engineers have province/company fields
- Requests/inspections have vehicle_province
- Engineer appointment filters by matching province
- Appointment updates inspection status to 'scheduled' and request to 'assessment' step

---

## Related Documentation

- **Full Architecture**: [Project Architecture](./project_architecture.md)
- **Database Schema**: [Database Schema](./database_schema.md)
- **Tech Stack**: [Tech Stack](./tech-stack.md)
- **Adding Routes**: [Adding Page Routes](../SOP/adding_page_route.md)
- **Database Migrations**: [Adding Migrations](../SOP/adding_migration.md)
- **Services**: [Working with Services](../SOP/working_with_services.md)
- **Components**: [Creating Components](../SOP/creating-components.md)
- **Testing**: [Testing Guide](../SOP/testing_guide.md)

---

**Last Updated**: January 25, 2025
**Philosophy**: "More libraries, less code" - leveraging established libraries and components rather than building from scratch.
