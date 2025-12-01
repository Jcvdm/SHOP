# Task Guides - Use-Case Navigation

**Last Updated**: November 20, 2025
**Purpose**: "I want to..." based documentation navigation

---

## Overview

This guide helps you find the right documentation based on what you're trying to accomplish. Use this when you know WHAT you want to do but not sure WHICH documentation to read.

---

## 🆕 I want to add a NEW FEATURE {#new-feature}

### Planning Phase
1. **Understand the system** → [Architecture Quick Ref](./architecture_quick_ref.md)
2. **Understand assessment workflow** → [SOP: Assessment-Centric Architecture](../SOP/working_with_assessment_centric_architecture.md)
3. **Check similar features** → [System Docs Index](./system_docs.md) (Bug Postmortems section)

### Database Changes
1. **Design schema changes** → [Database Quick Ref](./database_quick_ref.md)
2. **Create migration** → [SOP: Adding Migrations](../SOP/adding_migration.md)
3. **Add RLS policies** → [SOP: Fixing RLS Policies](../SOP/fixing_rls_insert_policies.md)

### Service Layer
1. **Create service class** → [SOP: Working with Services](../SOP/working_with_services.md)
2. **Implement ServiceClient pattern** → [SOP: Service Client Authentication](../SOP/service_client_authentication.md)

### UI Implementation
1. **Create page route** → [SOP: Adding Page Routes](../SOP/adding_page_route.md)
2. **Create components** → [SOP: Creating Components](../SOP/creating-components.md)
3. **Add loading states** → [System: UI Loading Patterns](../System/ui_loading_patterns.md)

### If Feature Requires Role-Based Access
→ [SOP: Implementing Role-Based Filtering](../SOP/implementing_role_based_filtering.md)

### If Feature Adds Sidebar Badge
→ [SOP: Implementing Badge Counts](../SOP/implementing_badge_counts.md)

### If Feature Uses Stage Transitions
→ [SOP: Navigation-Based State Transitions](../SOP/navigation_based_state_transitions.md)

---

## 🐛 I want to FIX A BUG {#debugging}

### Identify Bug Category

#### Database/RLS Errors
- **"Permission denied for table..."** → [SOP: Fixing RLS Policies](../SOP/fixing_rls_insert_policies.md)
- **"Stack depth limit exceeded"** → [SOP: Fixing RLS Recursion](../SOP/fixing_rls_recursion.md)
- **Empty query results (but data exists)** → [SOP: Fixing RLS Policies](../SOP/fixing_rls_insert_policies.md)

#### Authentication Errors
- **Login/logout issues** → [SOP: Implementing Form Actions & Auth](../SOP/implementing_form_actions_auth.md)
- **Session expired errors** → [System: Session Management & Security](../System/session_management_security.md)
- **Password reset broken** → [SOP: Password Reset Flow](../SOP/password_reset_flow.md)
- **Auth hook errors** → [SOP: Debugging Supabase Auth Hooks](../SOP/debugging_supabase_auth_hooks.md)

#### Badge Count Issues
- **Count mismatch** → [Bug Postmortem: Badge RLS Fixes](../System/bug_postmortem_badge_rls_filter_fixes_jan_29_2025.md)
- **Wrong counts displayed** → [SOP: Implementing Badge Counts](../SOP/implementing_badge_counts.md)

#### Stage Transition Issues
- **Can't transition stages** → [Bug Postmortem: FRC Stage Transitions](../System/frc_stage_transition_fixes_jan_29_2025.md)
- **Wrong stage shown** → [SOP: Assessment-Centric Architecture](../SOP/working_with_assessment_centric_architecture.md)

#### Loading State Issues
- **Loading state doesn't appear** → [System: UI Loading Patterns](../System/ui_loading_patterns.md)
- **Loading state doesn't reset** → [System: UI Loading Patterns](../System/ui_loading_patterns.md#troubleshooting)
- **Double-clicks still work** → [System: UI Loading Patterns](../System/ui_loading_patterns.md#troubleshooting)

### General Debugging Steps
1. **Check browser console** - Look for JavaScript errors
2. **Check network tab** - Look for failed API calls
3. **Check Supabase logs** - Use MCP or dashboard
4. **Review similar bugs** → [System Docs: Bug Postmortems](./system_docs.md#bug-postmortems)

---

## 🗄️ I want to work with the DATABASE {#database}

### Understanding the Schema
1. **Quick overview** → [Database Quick Ref](./database_quick_ref.md)
2. **Full details** → [System: Database Schema](../System/database_schema.md)

### Making Changes
1. **Create table** → [SOP: Adding Migrations](../SOP/adding_migration.md)
2. **Alter table** → [SOP: Adding Migrations](../SOP/adding_migration.md)
3. **Add RLS policy** → [SOP: Fixing RLS Policies](../SOP/fixing_rls_insert_policies.md)
4. **Create index** → [SOP: Adding Migrations](../SOP/adding_migration.md)

### Querying Data
1. **Via service layer** → [SOP: Working with Services](../SOP/working_with_services.md)
2. **Via MCP (development)** → [System: MCP Setup](../System/mcp_setup.md)
3. **Via Supabase dashboard** - Direct SQL access

### Security
1. **Add RLS policies** → [SOP: Fixing RLS Policies](../SOP/fixing_rls_insert_policies.md)
2. **Fix recursion** → [SOP: Fixing RLS Recursion](../SOP/fixing_rls_recursion.md)
3. **Review security** → [System: Security Recommendations](../System/security_recommendations.md)

---

## 🔐 I want to implement AUTHENTICATION {#auth}

### User Authentication
1. **Login/logout flow** → [SOP: Implementing Form Actions & Auth](../SOP/implementing_form_actions_auth.md)
2. **Session management** → [System: Session Management & Security](../System/session_management_security.md)
3. **Password reset** → [SOP: Password Reset Flow](../SOP/password_reset_flow.md)

### Protected Routes
1. **Add auth check** → [SOP: Implementing Form Actions & Auth](../SOP/implementing_form_actions_auth.md#protected-routes)
2. **Role-based access** → [SOP: Implementing Role-Based Filtering](../SOP/implementing_role_based_filtering.md)

### Service Authentication
1. **ServiceClient pattern** → [SOP: Service Client Authentication](../SOP/service_client_authentication.md)
2. **RLS with auth** → [SOP: Fixing RLS Policies](../SOP/fixing_rls_insert_policies.md)

---

## 📄 I want to create a NEW PAGE {#pages}

### Page Structure
1. **Understand routing** → [SOP: Adding Page Routes](../SOP/adding_page_route.md)
2. **Create page files** (`+page.svelte`, `+page.server.ts`)
3. **Add load function** → [SOP: Adding Page Routes](../SOP/adding_page_route.md#load-functions)

### Page with Data
1. **Create service** → [SOP: Working with Services](../SOP/working_with_services.md)
2. **Call in load function** → [SOP: Adding Page Routes](../SOP/adding_page_route.md)
3. **Display in component** → [SOP: Creating Components](../SOP/creating-components.md)

### Page with Table
1. **Use ModernDataTable** → Check existing pages (e.g., `src/routes/(app)/work/assessments/+page.svelte`)
2. **Add loading states** → [System: UI Loading Patterns](../System/ui_loading_patterns.md)
3. **Format data** → [System: Table Utilities](../System/table_utilities.md)

### Page with Forms
1. **Form actions vs API** → [SOP: Implementing Form Actions & Auth](../SOP/implementing_form_actions_auth.md)
2. **Create form action** → [SOP: Adding Page Routes](../SOP/adding_page_route.md#form-actions)
3. **Handle validation** → [SOP: Implementing Form Actions & Auth](../SOP/implementing_form_actions_auth.md)

---

## 🎨 I want to create a COMPONENT {#components}

### Basic Component
1. **Svelte 5 patterns** → [SOP: Creating Components](../SOP/creating-components.md)
2. **Props and events** → [SOP: Creating Components](../SOP/creating-components.md#props)
3. **TypeScript types** → [SOP: Creating Components](../SOP/creating-components.md#typescript)

### Component with Loading State
→ [System: UI Loading Patterns](../System/ui_loading_patterns.md#pattern-3-button-loading-states)

### Reusable Component
1. **Design API** → [SOP: Creating Components](../SOP/creating-components.md)
2. **Add to component library** → `src/lib/components/`
3. **Document usage** - Add JSDoc comments

---

## 📊 I want to work with ASSESSMENTS {#assessments}

### Understanding Assessments
1. **Assessment-centric architecture** → [SOP: Assessment-Centric Architecture](../SOP/working_with_assessment_centric_architecture.md)
2. **10-stage pipeline** → [Architecture Quick Ref](./architecture_quick_ref.md#assessment-pipeline)
3. **Nullable FK pattern** → [Database Quick Ref](./database_quick_ref.md#assessment-stages--nullable-fks)

### Stage Transitions
1. **Navigation-based** → [SOP: Navigation-Based State Transitions](../SOP/navigation_based_state_transitions.md)
2. **Idempotent load functions** → [SOP: Navigation-Based State Transitions](../SOP/navigation_based_state_transitions.md)
3. **Bug reference** → [Bug Postmortem: FRC Stage Transitions](../System/frc_stage_transition_fixes_jan_29_2025.md)

### Subprocess (FRC, Additionals)
1. **Understanding subprocesses** → [SOP: Assessment-Centric Architecture](../SOP/working_with_assessment_centric_architecture.md#subprocess)
2. **Filtering patterns** → [Bug: Additionals FRC Filtering](../System/additionals_frc_filtering_fix_jan_29_2025.md)

### Align FRC tab & FRC report totals
1. **Understand FRC mechanics & decisions** → [System: FRC Mechanics](../System/frc_mechanics.md), [SOP: FRC Decisions](../SOP/frc_decisions.md), [SOP: FRC Refresh](../SOP/frc_refresh.md)
2. **Review prior UI & logic changes** → [Task: FRC UI & Logic Refinement](../Tasks/FRC_UI_logic_refinement.md)
3. **Trace report generation** → `src/lib/templates/frc-report-template.ts`, `src/routes/api/generate-frc-report/+server.ts`
4. **Trace tab calculations** → `src/lib/components/assessment/FRCTab.svelte`, `src/lib/utils/frcCalculations.ts`, `src/lib/services/frc.service.ts`
5. **Implement alignment** → Use your current FRC alignment implementation plan to ensure **New Total** (tab) and `actual_total` (FRC snapshot) converge under stable conditions, and that the FRC report uses those same aggregates.

### Badge Counts
→ [SOP: Implementing Badge Counts](../SOP/implementing_badge_counts.md)

---

## 🔧 I want to work with SERVICES {#services}

### Creating Services
1. **Service pattern** → [SOP: Working with Services](../SOP/working_with_services.md)
2. **ServiceClient authentication** → [SOP: Service Client Authentication](../SOP/service_client_authentication.md)
3. **CRUD templates** → [SOP: Working with Services](../SOP/working_with_services.md#crud-patterns)

### Calling Services
1. **From load function** → [SOP: Adding Page Routes](../SOP/adding_page_route.md)
2. **From form action** → [SOP: Implementing Form Actions & Auth](../SOP/implementing_form_actions_auth.md)
3. **Error handling** → [SOP: Working with Services](../SOP/working_with_services.md#error-handling)

---

## 📱 I want to understand ROLES {#roles}

### Admin vs Engineer
1. **Role patterns** → [Architecture Quick Ref](./architecture_quick_ref.md#role-based-access)
2. **RLS by role** → [Database Quick Ref](./database_quick_ref.md#rls-pattern-summary)
3. **UI filtering** → [SOP: Implementing Role-Based Filtering](../SOP/implementing_role_based_filtering.md)

### Implementing Role-Based Features
→ [SOP: Implementing Role-Based Filtering](../SOP/implementing_role_based_filtering.md)

---

## 📝 I want to GENERATE PDFs {#pdfs}

### Understanding PDF Flow
→ [Architecture Quick Ref](./architecture_quick_ref.md#pdf-generation-flow)

### Implementation
1. Check existing API routes: `src/routes/api/reports/`
2. Use Puppeteer for HTML → PDF conversion
3. Upload to Supabase Storage (`documents/` bucket)
4. Return signed URL (60s expiry)

---

## 🧪 I want to TEST my code {#testing}

### Unit Tests
→ [SOP: Testing Guide](../SOP/testing_guide.md)

### E2E Tests
→ [SOP: Testing Guide](../SOP/testing_guide.md#e2e-testing)

### Testing RLS Policies
1. **Via MCP** → [System: MCP Setup](../System/mcp_setup.md)
2. **Via Supabase dashboard** - SQL editor
3. **Manual testing** - Different user roles

---

## 📚 I want to LEARN the system {#learning}

### New Developer Onboarding
1. **Read** → [Architecture Quick Ref](./architecture_quick_ref.md)
2. **Read** → [Database Quick Ref](./database_quick_ref.md)
3. **Read** → [SOP: Assessment-Centric Architecture](../SOP/working_with_assessment_centric_architecture.md)
4. **Explore** → Clone repo, run dev server, explore UI
5. **Build** → Pick a simple feature, implement following SOPs

### Deep Dive
1. **Full architecture** → [System: Project Architecture](../System/project_architecture.md)
2. **Full database** → [System: Database Schema](../System/database_schema.md)
3. **Recent changes** → [Changelog](./changelog.md)
4. **Bug history** → [System Docs: Bug Postmortems](./system_docs.md#bug-postmortems)

---

## Related Documentation
- **[System Docs Index](./system_docs.md)** - Complete system documentation
- **[SOP Index](./sops.md)** - All how-to guides
- **[FAQ](./faq.md)** - Common questions

---

**Maintenance**: Update when adding new common use cases
**Last Review**: November 20, 2025
