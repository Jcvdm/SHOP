# Frequently Asked Questions

**Last Updated**: January 30, 2025

---

## General Questions

### Q: What is ClaimTech?
**A**: ClaimTech (SVA - SvelteKit Validation App) is a vehicle damage assessment platform that manages the complete workflow from claim request through final repair costing.

### Q: What does "assessment-centric" mean?
**A**: Assessments are the canonical "case" record in ClaimTech. Every request has exactly ONE assessment created with it. All other records (appointments, inspections, estimates) link to the assessment. See [SOP: Assessment-Centric Architecture](../SOP/working_with_assessment_centric_architecture.md).

### Q: Why are there 10 stages instead of statuses?
**A**: Stages are sequential and immutable - an assessment moves forward through stages (1→2→3...) but never backward. This prevents race conditions and simplifies queries. Status would be ambiguous (e.g., "pending" could mean many things).

---

## Architecture Questions

### Q: Which files should I read first as a new developer?
**A**:
1. [Architecture Quick Ref](./architecture_quick_ref.md) - High-level overview
2. [Database Quick Ref](./database_quick_ref.md) - Schema summary
3. [SOP: Assessment-Centric Architecture](../SOP/working_with_assessment_centric_architecture.md) - Core patterns

### Q: Where can I find the complete database schema?
**A**: [System: Database Schema](../System/database_schema.md) (1,420 lines, complete with all 28 tables, RLS policies, relationships).

### Q: What's the difference between System/ and SOP/ docs?
**A**:
- **System/**: WHAT the system is (architecture, database, security, history)
- **SOP/**: HOW to do things (step-by-step guides, templates, procedures)

---

## Database Questions

### Q: Why is appointment_id NULL on early-stage assessments?
**A**: Foreign keys (appointment_id, inspection_id, estimate_id) are nullable until the assessment reaches the stage where that entity is created. This is the "nullable FK pattern." See [Database Quick Ref](./database_quick_ref.md#assessment-stages--nullable-fks).

### Q: How do I add a new table?
**A**: Follow [SOP: Adding Migrations](../SOP/adding_migration.md) - includes templates, RLS policy setup, and testing procedures.

### Q: What's the dual-check RLS pattern?
**A**: When a FK is nullable (e.g., appointment_id), RLS policies need TWO checks:
1. **Direct**: If FK exists, check if user has access to that record
2. **Indirect**: If FK is NULL, check access via parent relationship

See [SOP: Fixing RLS Policies](../SOP/fixing_rls_insert_policies.md#dual-check-pattern).

### Q: How do I query the database during development?
**A**: Three ways:
1. **Service layer** (production code) → [SOP: Working with Services](../SOP/working_with_services.md)
2. **Supabase MCP** (development/debugging) → [System: MCP Setup](../System/mcp_setup.md)
3. **Supabase dashboard** (manual queries) - SQL editor tab

---

## RLS & Security Questions

### Q: Why am I getting "permission denied" errors?
**A**: Usually an RLS policy issue. Check:
1. Is the table missing RLS policies? → [SOP: Adding Migrations](../SOP/adding_migration.md)
2. Is the SELECT policy too restrictive? → [SOP: Fixing RLS Policies](../SOP/fixing_rls_insert_policies.md)
3. Is ServiceClient passed correctly? → [SOP: Service Client Authentication](../SOP/service_client_authentication.md)

### Q: What's the ServiceClient pattern and why is it required?
**A**: Services MUST accept a `ServiceClient` parameter (the Supabase client) rather than creating their own. This ensures RLS policies work correctly because the client has the user's auth token. See [SOP: Service Client Authentication](../SOP/service_client_authentication.md).

### Q: Why am I getting "stack depth limit exceeded" errors?
**A**: RLS policy recursion - your policy is referencing the same table it's protecting, causing infinite loop. Use JWT claims (`auth.uid()`) instead of table lookups. See [SOP: Fixing RLS Recursion](../SOP/fixing_rls_recursion.md).

### Q: How do I test RLS policies?
**A**: Three methods:
1. **Via MCP** → `mcp.execute('SET ROLE authenticated; SELECT * FROM table;')`
2. **Via Supabase dashboard** - SQL editor with different user contexts
3. **Manual testing** - Login as different roles (admin, engineer) and test features

---

## Service Layer Questions

### Q: Should I call Supabase directly in my component?
**A**: **NO!** Always go through the service layer:
- ✅ Component → Load Function → Service → Supabase
- ❌ Component → Supabase (bypasses RLS, hard to test)

See [SOP: Working with Services](../SOP/working_with_services.md).

### Q: How do I create a new service?
**A**: Follow the pattern:
```typescript
export class MyService {
  constructor(private client: ServiceClient) {} // Required!

  async list() {
    const { data, error } = await this.client.from('table').select('*');
    if (error) throw error;
    return data || [];
  }
}
```
See [SOP: Working with Services](../SOP/working_with_services.md).

---

## UI & Frontend Questions

### Q: Why use Svelte 5 runes instead of old reactivity?
**A**: Svelte 5 runes (`$state`, `$derived`, `$effect`) are:
- More explicit (easier to understand)
- Better TypeScript support
- More performant
- Standard going forward

See [SOP: Creating Components](../SOP/creating-components.md).

### Q: How do I add loading states?
**A**: Three patterns:
1. **Global nav bar** - Automatic (already done)
2. **Table row loading** - Use `useNavigationLoading()` utility
3. **Button loading** - Use ActionIconButton `loading` prop

See [System: UI Loading Patterns](../System/ui_loading_patterns.md).

### Q: Why isn't my loading state working?
**A**: Common issues:
- Forgot to pass `loadingRowId={loadingId}` to table
- Wrong `rowIdKey` (doesn't match data property)
- Using `goto()` instead of `startNavigation()`
- Button loading on navigation actions (use table loading instead)

See [System: UI Loading Patterns - Troubleshooting](../System/ui_loading_patterns.md#troubleshooting).

---

## Assessment & Workflow Questions

### Q: Can an assessment have multiple appointments?
**A**: No, one assessment = one appointment (1-to-1 relationship). If appointment needs to be rescheduled, update the existing appointment record.

### Q: What's the difference between Additionals and FRC?
**A**: Both are "subprocesses" that happen after estimate_finalized:
- **Additionals**: Additional work discovered during repair
- **FRC**: Final Repair Costing (detailed costing after initial estimate)

Neither changes the main assessment stage - assessment stays at `estimate_finalized`. See [SOP: Assessment-Centric Architecture](../SOP/working_with_assessment_centric_architecture.md#subprocess).

### Q: How do stage transitions work?
**A**: Navigate to target page → Load function updates stage idempotently → UI reflects new stage. This is the "navigation-first" pattern. See [SOP: Navigation-Based State Transitions](../SOP/navigation_based_state_transitions.md).

### Q: Can I skip stages?
**A**: Generally no - workflow is sequential. However, some stages might auto-progress (e.g., request_submitted → request_reviewed if auto-approval is enabled).

---

## Badge Count Questions

### Q: Why are my badge counts wrong?
**A**: Common causes:
1. **RLS policies** - Counts don't match filtered data
2. **Query mismatch** - Badge query differs from page query
3. **Stage filtering** - Not filtering by correct stages
4. **Role filtering** - Admin sees all, engineer sees assigned only

See [Bug Postmortem: Badge RLS Fixes](../System/bug_postmortem_badge_rls_filter_fixes_jan_29_2025.md) and [SOP: Implementing Badge Counts](../SOP/implementing_badge_counts.md).

### Q: How do badge counts stay updated?
**A**: Polling mechanism - load function fetches counts every 30 seconds. See [SOP: Page Updates and Badge Refresh](../SOP/page_updates_and_badge_refresh.md).

---

## Authentication Questions

### Q: How does login/logout work?
**A**: Supabase Auth with cookies (not localStorage). Server-side session validation on every request. See [SOP: Implementing Form Actions & Auth](../SOP/implementing_form_actions_auth.md) and [System: Session Management & Security](../System/session_management_security.md).

### Q: How do I protect a route?
**A**: Check user session in `hooks.server.ts` and redirect if not authenticated. See [SOP: Implementing Form Actions & Auth](../SOP/implementing_form_actions_auth.md#protected-routes).

### Q: How does password reset work?
**A**: Two-step flow:
1. Request reset (email sent with OTP)
2. Verify OTP + set new password

Uses Supabase Auth with PKCE flow. See [SOP: Password Reset Flow](../SOP/password_reset_flow.md).

---

## MCP Questions

### Q: What is MCP?
**A**: Model Context Protocol - allows Claude Code to directly query the Supabase database during development. See [System: MCP Setup](../System/mcp_setup.md).

### Q: Should I use MCP in production code?
**A**: **NO!** MCP is for:
- ✅ Development/debugging
- ✅ Exploring schema
- ✅ Testing queries
- ❌ Production application code (use service layer instead)

### Q: How do I use MCP?
**A**: Available via Supabase MCP tools in Claude Code:
```typescript
// List tables
mcp__supabase__list_tables({ project_id: 'your-project-id' })

// Execute SQL
mcp__supabase__execute_sql({
  project_id: 'your-project-id',
  query: 'SELECT * FROM assessments WHERE stage = $1 LIMIT 10'
})
```
Note: MCP tool names start with `mcp__supabase__` and require `project_id` parameter.

---

## Debugging Questions

### Q: Where do I start debugging?
**A**: Depends on the error:
- **RLS errors** → [SOP: Fixing RLS Policies](../SOP/fixing_rls_insert_policies.md)
- **Auth errors** → [SOP: Implementing Form Actions & Auth](../SOP/implementing_form_actions_auth.md)
- **Stage transition errors** → [Bug Postmortem: FRC Stage Transitions](../System/frc_stage_transition_fixes_jan_29_2025.md)
- **Badge count errors** → [Bug Postmortem: Badge RLS Fixes](../System/bug_postmortem_badge_rls_filter_fixes_jan_29_2025.md)
- **Loading state errors** → [System: UI Loading Patterns](../System/ui_loading_patterns.md#troubleshooting)

Also check [Task Guides: Debugging](./task_guides.md#debugging) for full decision tree.

### Q: Where can I find past bug fixes?
**A**: [System Docs Index - Bug Postmortems](./system_docs.md#bug-postmortems) - 17 documented bugs with root cause analysis and fixes.

---

## Documentation Questions

### Q: How do I navigate the documentation efficiently?
**A**:
1. Start with [README.md](../README.md) (80 lines) - Lightweight entry
2. Use [index.md](./index.md) - Master navigation
3. Find relevant category file (system_docs.md or sops.md)
4. Read specific documentation

**Context Savings**: 90-95% vs reading everything.

### Q: Which docs should I update after implementing a feature?
**A**:
- **System/** - If architecture changed
- **SOP/** - If new patterns introduced
- **Bug Postmortem** - If significant fix (add to System/)
- **Changelog** - Major features only

### Q: Where do I find...?
- **Architecture overview** → [Architecture Quick Ref](./architecture_quick_ref.md)
- **Database schema** → [Database Quick Ref](./database_quick_ref.md)
- **How-to guides** → [SOP Index](./sops.md)
- **Recent changes** → [Changelog](./changelog.md)
- **Use-case navigation** → [Task Guides](./task_guides.md)

---

## Development Questions

### Q: What's the development workflow?
**A**:
1. Read relevant docs (use [Task Guides](./task_guides.md))
2. Create feature branch
3. Implement following SOPs
4. Test locally
5. Create PR
6. Deploy

### Q: How do I run the dev server?
**A**: `npm run dev` - See [System: Development Guide](../System/development_guide.md).

### Q: How do I run migrations locally?
**A**: Via Supabase CLI or apply via dashboard. See [SOP: Adding Migrations](../SOP/adding_migration.md).

---

## Related Documentation
- **[System Docs Index](./system_docs.md)** - Complete system documentation
- **[SOP Index](./sops.md)** - All how-to guides
- **[Task Guides](./task_guides.md)** - Use-case navigation

---

**Maintenance**: Update with commonly asked questions
**Last Review**: January 30, 2025
