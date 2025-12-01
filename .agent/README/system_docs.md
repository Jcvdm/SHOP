# System Documentation Index

**Last Updated**: November 29, 2025 (Vehicle Accessories Integration ✅ | B008/B009/B010: Form Field Input Patterns - Bug Fixes ✅)
**Total Files**: 43 System documentation files

---

## Overview

Comprehensive system documentation covering architecture, database design, security, UI patterns, and implementation history. Files are organized by category with detailed guidance on when to read each document.

---

## 📚 Core Architecture (MUST READ)

### 1. Project Architecture ⭐ ESSENTIAL
- **File**: [project_architecture.md](../System/project_architecture.md)
- **Size**: 977 lines | **Last Updated**: Jan 2025
- **Read When**: Starting work, need system design understanding, implementing cross-cutting features

**Contains**:
- Complete tech stack (SvelteKit 5, Supabase, TypeScript, Tailwind 4)
- 10-stage assessment pipeline workflow
- Security & authentication patterns (100% RLS coverage)
- Service layer architecture (ServiceClient injection pattern)
- PDF generation workflow (Puppeteer)
- Storage architecture (3 buckets: assessment-photos, documents, profile-photos)
- Engineer vs admin role patterns

**Key for**: Understanding system design, architectural decisions, workflow patterns

---

### 2. Database Schema ⭐ ESSENTIAL
- **File**: [database_schema.md](../System/database_schema.md)
- **Size**: 1,420 lines | **Last Updated**: Oct 2025 (verified against live DB)
- **Read When**: Adding/modifying tables, understanding relationships, debugging RLS, writing queries

**Contains**:
- All 31 tables with columns, types, constraints
- Relationships & foreign keys
- RLS policies (100% coverage achieved)
- Indexes & performance optimization
- Storage buckets configuration
- Assessment-centric architecture patterns

**Tables by Category**:
- Authentication & Users (3 tables: auth.users, users, engineers)
- Assessment Pipeline (10 tables: requests, assessments, appointments, inspections, estimates, estimate_items, additionals, frc, audit_log, settings)
- Reference Data (8 tables: vehicle_makes, models, types, colors, repair_methods, part_types, part_conditions, companies)

**Related**: [Database Quick Ref](./database_quick_ref.md) - Summary version
**Related**: [SOP: Adding Migrations](../SOP/adding_migration.md)

---

### 3. Tech Stack
- **File**: [tech-stack.md](../System/tech-stack.md)
- **Read When**: Need version numbers, package info, technology choices
- **Contains**: Frontend/backend packages with versions, development tools, rationale for choices

---

### 4. FRC Mechanics (Snapshot, Decisions, Totals)
- **File**: [frc_mechanics.md](../System/frc_mechanics.md)
- **Read When**: Implementing or debugging FRC snapshot/merge, removal grouping, Baseline vs New Total and Delta.
- **Contains**: Line composition, UI grouping, decision normalization, totals semantics.

---

### 5. Supabase Type Generation ⭐ IMPORTANT
- **File**: [supabase_type_generation.md](../System/supabase_type_generation.md)
- **Size**: 150 lines | **Last Updated**: Nov 21, 2025
- **Read When**: Adding/modifying database schema, debugging type errors, regenerating types after migrations

**Contains**:
- Type generation process and workflow
- PostgrestFilterBuilder<never> fix (Nov 21, 2025)
- Domain types vs generated types pattern
- When and how to regenerate types
- Maintenance procedures

**Key for**: Understanding type safety, maintaining database schema alignment, fixing type inference issues

**Related**: [Database Schema](./database_schema.md) - Schema structure
**Related**: [SOP: Adding Migrations](../SOP/adding_migration.md) - When to regenerate

---

## 🔐 Security & Authentication

### 1. Session Management & Security ⭐ CRITICAL
- **File**: [session_management_security.md](../System/session_management_security.md)
- **Size**: 751 lines | **Last Updated**: Jan 27, 2025
- **Read When**: Implementing auth, debugging session issues, security audit, cookie/JWT problems

**Contains**:
- Complete session architecture
- Cookie management (access_token, refresh_token with httpOnly/secure flags)
- JWT validation patterns
- Security compliance patterns
- Server-side vs client-side auth
- Common pitfalls and fixes

**Critical for**: Auth implementation, security understanding

---

### 2. Security Recommendations
- **File**: [security_recommendations.md](../System/security_recommendations.md)
- **Status**: ✅ 100% RLS coverage achieved
- **Read When**: Writing RLS policies, security review, production deployment prep
- **Contains**: Security posture, RLS testing procedures, monitoring guidelines

---

### 3. Database Verification Report (Historical)
- **File**: [database_verification_report.md](../System/database_verification_report.md)
- **Size**: 605 lines | **Status**: Historical reference
- **Purpose**: Pre-hardening security findings
- **Note**: Issues documented here have been resolved

---

## 🛠️ Development & Tooling

### 1. Development Guide
- **File**: [development_guide.md](../System/development_guide.md)
- **Read When**: Setting up dev environment, running commands
- **Contains**: npm scripts, environment variables, dev server commands

### 2. Supabase CLI Guide ⭐ NEW (Nov 21, 2025)
- **File**: [supabase_cli.md](../System/supabase_cli.md)
- **Size**: ~350 lines | **Last Updated**: Nov 21, 2025
- **Read When**: Setting up Supabase CLI, generating types, creating migrations, working with branches
- **Contains**: Installation, authentication, project setup, database operations, type generation, branching, local development
- **Quick Commands**:
  - `npm run generate:types` - Generate TypeScript types
  - `supabase db diff -f name` - Create migration
  - `supabase db push` - Apply migrations
  - `supabase db branch create/switch/delete` - Database branching

**Related**: [SOP: Supabase CLI Workflow](../SOP/supabase_cli_workflow.md) - Development workflows

### 3. MCP Setup ⭐ NEW
- **File**: [mcp_setup.md](../System/mcp_setup.md)
- **Read When**: Using Claude Code with Supabase MCP
- **Contains**: Supabase MCP configuration, direct database access, query capabilities, migration management
- **For backend-api-dev**: Enables direct DB queries during development

### 3. Table Utilities Reference
- **File**: [table_utilities.md](../System/table_utilities.md)
- **Size**: 540 lines | **Last Updated**: Jan 29, 2025
- **Read When**: Building UI tables, formatting data, using helpers

**Contains**:
- Complete table-helpers.ts API reference
- Stage variant helpers (getStageVariant, getStageLabel)
- Type badge helpers
- Appointment status helpers
- Formatting functions (dates, currency)

---

### 4. Audit Logging System ⭐ NEW
- **File**: [audit_logging_system.md](../System/audit_logging_system.md)
- **Size**: ~600 lines | **Last Updated**: Jan 30, 2025
- **Read When**: Implementing audit logging, understanding audit patterns, debugging workflow issues

**Contains**:
- Complete audit logging architecture and patterns
- 21 audit action types with usage guidelines
- Service-by-service coverage documentation
- Metadata patterns and best practices
- UI components (ActivityTimeline, AuditTab)
- Query patterns and performance considerations
- Troubleshooting guide

**Key for**: Understanding audit trail system, implementing logging in new services, compliance tracking

---

## 📍 Location & Address Features

### Address & Location Capturing ⭐ NEW (Nov 28, 2025)
- **File**: [address_location_implementation.md](../System/address_location_implementation.md)
- **Size**: ~500 lines | **Last Updated**: Nov 28, 2025
- **Status**: Production Ready - Complete implementation with Google Places integration
- **Read When**: Working with address input components, implementing location features, integrating Google Places API

**Contains**:
- Complete Address & Location Capturing feature (C001) documentation
- Google Places API integration with session token caching
- AddressInput and AddressDisplay component architecture
- StructuredAddress type definition (street, suburb, city, province, postal, lat/lng, place_id)
- Database schema extensions for requests and appointments tables
- Integration points (request create/edit, appointment schedule/reschedule)
- Backward compatibility patterns with legacy text address fields
- Helper functions for converting between flat DB columns and StructuredAddress type
- Manual entry fallback with address parsing
- Environment configuration (VITE_GOOGLE_PLACES_API_KEY)

**Components**:
- `AddressInput.svelte` - Modern autocomplete with fallback
- `AddressDisplay.svelte` - Consistent address rendering
- Supporting utilities and services

**Implemented in**:
- `src/lib/components/forms/AddressInput.svelte` (NEW)
- `src/lib/components/forms/AddressDisplay.svelte` (NEW)
- `src/lib/types/address.ts` (NEW)
- `src/lib/utils/google-places.ts` (NEW)
- `src/lib/services/address.service.ts` (NEW)
- Request and Appointment pages (integrated)

**Related**: [Project Architecture](../System/project_architecture.md), [Database Schema](../System/database_schema.md), [Creating Components](../SOP/creating-components.md)

**Key for**: Understanding address input patterns, integrating Google Places API, working with structured address storage, backward compatibility

---

## 🎨 UI & Loading Patterns

### 1. UI Loading Patterns ⭐ COMPREHENSIVE
- **File**: [ui_loading_patterns.md](../System/ui_loading_patterns.md)
- **Size**: 690 lines | **Last Updated**: Jan 30, 2025
- **Read When**: Implementing loading states, navigation transitions, fixing loading bugs

**Contains**:
- All 3 loading patterns (global nav bar, table row loading, button loading)
- Decision tree for choosing pattern
- Complete useNavigationLoading() API
- Common bug fixes (appointments page fix included as case study)
- Troubleshooting guide
- Implementation checklist

**Critical for**: Understanding loading patterns, preventing loading state bugs

### 2. Loading State Pattern Documentation
- **File**: [loading_state_pattern_documentation_jan_30_2025.md](../System/loading_state_pattern_documentation_jan_30_2025.md)
- **Last Updated**: Jan 30, 2025
- **Read When**: Need latest loading animation patterns
- **Note**: Complements ui_loading_patterns.md with implementation analysis

### 3. SSE Streaming for Long-Running Operations ⭐ NEW (Jan 31, 2025)
- **File**: [sse_streaming_pattern.md](../System/sse_streaming_pattern.md)
- **Size**: ~500 lines | **Last Updated**: Jan 31, 2025
- **Read When**: Implementing long-running batch operations, need real-time progress feedback, handling partial success
- **Use Case**: Document generation, batch processing, multi-step workflows

**Contains**:
- SSE (Server-Sent Events) streaming architecture
- Sequential vs parallel generation patterns
- Progress tracking with per-item status
- Partial success handling (e.g., 3/4 documents succeed)
- Client-side SSE parsing and state management
- UI component patterns (progress bars, status indicators, retry buttons)
- Error handling and recovery strategies
- Performance considerations and optimization

**Implemented in**:
- `src/routes/api/generate-all-documents/+server.ts` - SSE streaming endpoint
- `src/lib/services/document-generation.service.ts` - SSE parsing and progress callbacks
- `src/lib/components/assessment/DocumentGenerationProgress.svelte` - Progress UI component
- `src/lib/components/assessment/FinalizeTab.svelte` - Integration with retry handlers

**Related**: [UI Loading Patterns](../System/ui_loading_patterns.md), [Project Architecture](../System/project_architecture.md)

**Key for**: Understanding streaming patterns, implementing batch operations with progress feedback, handling partial failures gracefully

### 4. Form Field Input Patterns ⭐ NEW (Nov 28, 2025)
- **File**: [form_field_input_patterns.md](../System/form_field_input_patterns.md)
- **Size**: ~500 lines | **Last Updated**: Nov 28, 2025
- **Read When**: Implementing form inputs, debugging input lag, fixing input save issues, standardizing form behavior

**Contains**:
- Text field pattern: Extract → Update state → Debounce save
- Select/dropdown pattern: Immediate save on change (no debounce)
- Checkbox/boolean pattern: Immediate save on change
- One-way binding vs `bind:value` (causes lag issues)
- Common mistakes and solutions (6 detailed examples)
- Testing patterns for form inputs
- Best practices comparison table (input type vs event vs debounce)
- FormField component patterns

**Established By**:
- **B008**: Database schema mismatch fix (removed obsolete column reference)
- **B009**: Select field not saving on navigation (changed to onchange + immediate save)
- **B010**: Text field lag (changed from bind:value to manual extraction with debounce)

**Key for**: Understanding form input behavior, fixing input responsiveness, preventing data loss on navigation, standardizing form implementations

### 4b. Vehicle Accessories Integration ⭐ NEW (Nov 29, 2025)
- **File**: [vehicle_accessories_integration.md](../System/vehicle_accessories_integration.md)
- **Size**: ~600 lines | **Last Updated**: Nov 29, 2025
- **Read When**: Working with vehicle values, accessories, or cross-tab data integration, implementing single-value patterns
- **Status**: ✅ Complete - Single value per accessory system integrated

**Contains**:
- Single-value accessory model (one value per accessory applies to Trade/Market/Retail)
- Cross-tab integration between Exterior360Tab and VehicleValuesTab
- Database schema: `assessment_accessories.value` (NUMERIC(12,2), Migration 20251129)
- Component architecture (VehicleValueExtrasTable complete rewrite, VehicleValuesTab updates, Exterior360Tab value input)
- Type definitions: `VehicleAccessory` and `CreateAccessoryInput` with value field
- Service layer: `accessories.service.ts` updateValue() method
- Utility functions: calculateAccessoriesTotal(), getAccessoryDisplayName()
- Calculation flow diagram: Base Values → Valuation Adjustment → Condition Adjustment → Adjusted Values → Accessories Total → Total Adjusted Values
- Inline value editing patterns with optimistic updates
- Bug fix: Value not saved on accessory creation (fixed via CreateAccessoryInput type + onCreate callback)
- Integration patterns: How accessories sync between tabs without duplication
- Testing and verification guide

**Implemented in**:
- Database: `supabase/migrations/20251129_add_value_to_accessories.sql`
- Types: `src/lib/types/assessment.ts` (VehicleAccessory, CreateAccessoryInput)
- Services: `src/lib/services/accessories.service.ts` (updateValue method)
- Utilities: `src/lib/utils/vehicleValuesCalculations.ts` (total + display helpers)
- Components: `VehicleValueExtrasTable.svelte`, `VehicleValuesTab.svelte`, `Exterior360Tab.svelte`
- **Report Generation**: `src/routes/api/generate-report/+server.ts` (fetches accessories)
- **Report Template**: `src/lib/templates/report-template.ts` (dedicated section + values integration)

**Report Integration** (Nov 29, 2025):
- Accessories appear in Damage Inspection Report PDF
- Dedicated "VEHICLE ACCESSORIES" section with table (Accessory, Condition, Value)
- Integrated into "WARRANTY & VEHICLE VALUES" section with Pre-Incident Value calculation
- Same calculation pattern: `totalAdjusted + accessoriesTotal`

**Key for**: Understanding accessories system, single-value patterns, cross-tab data sync, inline editing with optimistic updates, vehicle values calculations, report generation

**Related**: [Database Schema](../System/database_schema.md), [Form Field Input Patterns](../System/form_field_input_patterns.md), [Project Architecture](../System/project_architecture.md)

---

### 5. Photo Labeling Implementation ⭐ CRITICAL FIX (Nov 9, 2025)
- **File**: [photo_labeling_implementation_nov_6_2025.md](../System/photo_labeling_implementation_nov_6_2025.md)
- **Size**: ~1000 lines | **Last Updated**: Nov 9, 2025 (FINAL FIX)
- **Read When**: Working with photo components, implementing optimistic updates, debugging photo navigation, using bigger-picture library

**Contains**:
- Complete photo labeling feature implementation in PhotoViewer
- **CRITICAL BUG FIX** (Nov 9): Navigation tracking using correct bigger-picture callback signature
  - Root cause: Wrong callback signature - was using `container.position` (doesn't exist) instead of `activeItem.i`
  - Solution: Use `activeItem.i` which contains the current index from bigger-picture library
  - Impact: Label now updates correctly when scrolling through photos
- Optimistic update patterns for instant UI feedback
- Fixed bottom bar UI design
- Keyboard shortcuts implementation (E to edit, Enter to save, Escape to cancel)
- Component communication via callbacks (props down, events up)
- Comprehensive testing guide with manual tests
- Svelte 5 runes reactivity patterns ($state, $derived)
- bigger-picture library callback signature documentation

**Key for**: Understanding photo editing UI, optimistic updates, debugging navigation issues, keyboard accessibility patterns, bigger-picture library integration

---

### 6. Unified Photo Panel Pattern ⭐ NEW (Jan 2025)
- **File**: [unified_photo_panel_pattern.md](../System/unified_photo_panel_pattern.md)
- **Size**: ~400 lines | **Last Updated**: Jan 2025
- **Read When**: Implementing photo upload components, understanding photo panel architecture, migrating from legacy photo systems

**Contains**:
- Single-card layout pattern (upload zone + gallery in one component)
- Conditional rendering (empty state vs. with photos)
- Component architecture and props interface
- Database table structure for all photo panels
- Migration patterns from legacy systems (8-position exterior, interior photo columns)
- Validation updates (photos array parameter pattern)
- Implementation examples for all 5 photo panel types

**Implemented in**:
- `InteriorPhotosPanel.svelte`
- `EstimatePhotosPanel.svelte`
- `PreIncidentPhotosPanel.svelte`
- `AdditionalsPhotosPanel.svelte`
- `Exterior360PhotosPanel.svelte`

**Related**: [Photo Labeling Patterns](../SOP/photo_labeling_patterns.md), [Database Schema](../System/database_schema.md)

---

### 7. Photo Compression Implementation ⭐ NEW (Nov 23, 2025)
- **File**: [photo_compression_implementation.md](../System/photo_compression_implementation.md)
- **Size**: ~150 lines | **Last Updated**: Nov 23, 2025
- **Read When**: Working with photo uploads, optimizing storage, implementing compression features

**Contains**:
- Client-side photo compression architecture
- Compression service integration with storage service
- HEIC to JPEG conversion
- Progress tracking (compression + upload phases)
- 60-75% storage reduction (5MB → 1.8MB typical)
- All 8 photo upload components using compression
- User experience patterns (two-phase progress)
- Testing checklist and troubleshooting

**Implemented in**:
- `src/lib/services/image-compression.service.ts` - Compression engine
- `src/lib/services/storage.service.ts` - Storage integration
- `src/lib/components/forms/PhotoUpload.svelte` - Enhanced with compression UI

---

### 8. PhotoUpload Layout Refactor ⭐ NEW (Nov 23, 2025)
- **File**: [photoupload_layout_refactor_nov_23_2025.md](../System/photoupload_layout_refactor_nov_23_2025.md)
- **Size**: ~200 lines | **Last Updated**: Nov 23, 2025
- **Read When**: Working with PhotoUpload component, understanding unified photo panel pattern, debugging upload UI

**Contains**:
- PhotoUpload refactor to match TyrePhotosPanel pattern
- Layout changes: two-button side-by-side → single centered upload zone
- UI improvements: added browse link, support text, buttons below zone
- Container styling: added border-dashed, drag state colors, padding
- FileUploadProgress integration for compression/upload states
- Removed unused Loader2 import
- Before/after comparison with visual mockups
- Testing checklist and verification steps

**Issue Fixed**:
- PhotoUpload styling didn't match other photo panels
- Two separate upload buttons instead of unified zone
- Missing browse link and support text
- Buttons integrated in upload area instead of below

**Solution**:
- Rebuilt empty-state zone into single dashed drop target
- Vertical layout with centered icon and instructions
- Inline "browse" link in instructions
- "Supports: JPG, PNG, GIF" support text
- Camera + Upload buttons below zone (not integrated)
- FileUploadProgress for compression/upload progress

**Implemented in**:
- `src/lib/components/forms/PhotoUpload.svelte` (lines 240-306)

**Related**: [Unified Photo Panel Pattern](../System/unified_photo_panel_pattern.md), [Rose Theme Standardization](../System/rose_theme_standardization.md)
- All photo panel components (automatic via storage service)

**Key for**: Understanding photo optimization, implementing compression features, reducing storage costs, handling HEIC images

---

### 9. Rose Theme Standardization ⭐ NEW (Nov 23, 2025)
- **File**: [rose_theme_standardization.md](../System/rose_theme_standardization.md)
- **Size**: ~200 lines | **Last Updated**: Nov 23, 2025
- **Read When**: Working with photo upload components, document generation, or updating UI styling

**Contains**:
- Rose theme color palette and Tailwind mappings
- Standardized progress UI components (FileUploadProgress)
- Two-phase progress tracking (compression → upload)
- Camera input support on all photo panels
- Color migration guide (blue → rose)
- All 6 photo panel components updated
- Document generation progress indicators

**Implemented in**:
- `src/lib/components/forms/PhotoUpload.svelte`
- `src/lib/components/assessment/DocumentCard.svelte`
- `src/lib/components/assessment/PreIncidentPhotosPanel.svelte`

---

### 10. Logo Branding Implementation ⭐ NEW (Nov 23, 2025)
- **File**: [logo_branding_implementation.md](../System/logo_branding_implementation.md)
- **Size**: ~150 lines | **Last Updated**: Nov 23, 2025
- **Read When**: Working on branding, dashboard header, login page, or PDF report generation

**Contains**:
- ClaimTech logo integration across customer-facing surfaces
- Dashboard header logo rendering (h-8 sizing)
- Login hero logo display (h-12 sizing)
- PDF report logo embedding (base64 encoding)
- CSS styling for report logo placeholder
- Fallback behavior when logo unavailable
- Asset location and import patterns
- Testing and verification checklist

**Implemented in**:
- `src/lib/assets/logo.png` - Logo asset
- `src/routes/(app)/+layout.svelte` - Dashboard header
- `src/routes/auth/login/+page.svelte` - Login hero
- `src/routes/api/generate-report/+server.ts` - PDF generation
- `src/lib/templates/report-template.ts` - Report template

**Key for**: Understanding brand integration, logo rendering patterns, base64 image embedding in PDFs, responsive logo sizing
- `src/lib/components/assessment/EstimatePhotosPanel.svelte`
- `src/lib/components/assessment/AdditionalsPhotosPanel.svelte`
- `src/lib/components/assessment/Exterior360PhotosPanel.svelte`

**Key for**: Understanding UI theming, implementing consistent styling, working with progress indicators, camera input patterns

---

## 🐛 Bug Postmortems & Implementation History (18 files)

### Recent Critical Fixes (Nov 2025)

#### Photo Panel Reactivity ⭐ IMPORTANT

**1. Photo Panel Display Fix - Reactivity Pattern**
- **File**: [photo_panel_display_fix_nov_9_2025.md](../Tasks/completed/PHOTO_PANEL_DISPLAY_FIX_NOV_9_2025.md)
- **Date**: November 9, 2025
- **Read When**: Working with photo panels, debugging photo display issues, implementing optimistic updates
- **Contains**: Root cause analysis of photo display bug, reactivity chain explanation, direct state update pattern
- **Impact**: Photos now display correctly after upload, tab switching, and page reload
- **Key Learning**: Generic refresh callbacks break optimistic array pattern - use direct state updates
- **Related**: [Optimistic Array Bug Fix](../Tasks/completed/OPTIMISTIC_ARRAY_BUG_FIX_RESEARCH_NOV_9_2025.md) - Svelte 5 reactivity patterns

### Recent Critical Fixes (Jan 2025)


**2. Repairer Selection Dropdown Reset Bug (B004)**
- **File**: [repairer_selection_dropdown_reset_fix.md](../System/repairer_selection_dropdown_reset_fix.md)
- **Date**: November 28, 2025
- **Read When**: Implementing or debugging user-controlled select dropdowns, prop syncing in components
- **Issue**: Dropdown would reset to "None selected" after user selected a repairer and saved
- **Root Cause**: Component had $effect.pre syncing user-controlled dropdown value from props
- **Solution**: Separate user-controlled inputs from prop-synced calculated values
- **Pattern**: User-Controlled vs Calculated Values decision tree
- **Impact**: Dropdown selection now persists, correct handling of reactive state
- **Key Learning**: User inputs (bind:value) should be initialized once, calculated values should sync from props

#### FRC & Stage Transitions ⭐ IMPORTANT

**1. FRC Stage Transition Fixes**
- **File**: [frc_stage_transition_fixes_jan_29_2025.md](../System/frc_stage_transition_fixes_jan_29_2025.md)
- **Size**: 543 lines
- **Read When**: Working with FRC or Additionals workflows
- **Contains**: Critical subprocess pattern fixes, stage transition logic corrections

**2. Bug Postmortem: Finalization & FRC Stage Transitions**
- **File**: [bug_postmortem_finalization_frc_stage_transitions.md](../System/bug_postmortem_finalization_frc_stage_transitions.md)
- **Size**: 551 lines
- **Read When**: Debugging stage transitions
- **Contains**: Analysis of 3 critical bugs in finalization workflows

**3. Bug Postmortem: Appointment Stage Transition**
- **File**: [bug_postmortem_appointment_stage_transition.md](../System/bug_postmortem_appointment_stage_transition.md)
- **Read When**: Working with appointment workflows
- **Contains**: Missing stage in transition eligibility fix

#### Badge Counts & RLS ⭐ IMPORTANT

**4. Bug Postmortem: Badge RLS & PostgREST Filter Fixes**
- **File**: [bug_postmortem_badge_rls_filter_fixes_jan_29_2025.md](../System/bug_postmortem_badge_rls_filter_fixes_jan_29_2025.md)
- **Size**: 621 lines
- **Read When**: Implementing badge counts or debugging count mismatches
- **Contains**: Badge count inflation fixes, PostgREST syntax corrections, assessment-based query patterns

**5. Page Update & Badge Standardization**
- **File**: [page_update_badge_standardization_jan_29_2025.md](../System/page_update_badge_standardization_jan_29_2025.md)
- **Read When**: Implementing page navigation or badge refresh
- **Contains**: Navigation-first pattern standardization

#### Subprocess Patterns

**6. Additionals FRC Filtering Fix**
- **File**: [additionals_frc_filtering_fix_jan_29_2025.md](../System/additionals_frc_filtering_fix_jan_29_2025.md)
- **Read When**: Implementing subprocess list pages
- **Contains**: Subprocess filtering pattern fixes

**7. Subprocess Stage Filtering**
- **File**: [subprocess_stage_filtering_jan_29_2025.md](../System/subprocess_stage_filtering_jan_29_2025.md)
- **Read When**: Adding stage filters to list pages
- **Contains**: Stage-based filtering for subprocess pages

**8. Navigation appointment_id Fix**
- **File**: [navigation_appointment_id_fix_jan_29_2025.md](../System/navigation_appointment_id_fix_jan_29_2025.md)
- **Read When**: Debugging navigation with nested data
- **Contains**: Nested object navigation pattern fixes

**9. FRC Completion Stage Update Fix** ⭐ CRITICAL
- **File**: [frc_completion_stage_update_fix_nov_2_2025.md](../System/frc_completion_stage_update_fix_nov_2_2025.md)
- **Date**: November 2, 2025
- **Read When**: Working with FRC completion, stage transitions, or list filtering
- **Contains**: Critical fix for silent stage update failures during FRC completion
- **Impact**: Prevents assessments from getting stuck in wrong lists (Finalized/Additionals instead of Archive)
- **Key Learning**: Always verify critical state changes, never silently catch errors on critical operations

#### RLS & Assessment Access (Jan 26, 2025)

**10. Early-Stage Assessment RLS Fix**
- **File**: [early_stage_assessment_rls_fix_jan_26_2025.md](../System/early_stage_assessment_rls_fix_jan_26_2025.md)
- **Read When**: Writing RLS policies for nullable relationships
- **Contains**: Dual-check RLS pattern for nullable foreign keys, Migrations 073-074

**11. Phase 3 Frontend + Enum Fix**
- **File**: [phase_3_frontend_and_enum_fix_jan_26_2025.md](../System/phase_3_frontend_and_enum_fix_jan_26_2025.md)
- **Size**: 602 lines
- **Read When**: Understanding assessment stage enum values
- **Contains**: Migration 075 enum corrections

#### Recent Fixes (Jan 2025)

**12. Bug #7 Hotfix: FRC Badge Count Regression** ⭐ LATEST
- **File**: [bug_7_hotfix_frc_badge_count_regression.md](../Tasks/completed/bug_7_hotfix_frc_badge_count_regression.md)
- **Date**: Jan 12, 2025
- **Issue**: FRC badge showed 2 records when only 1 active (regression from Bug #7 optimization)
- **Root Cause**: Query optimization removed stage filtering, RLS policies don't filter by stage
- **Solution**: Restored stage filtering while keeping optimization benefits (2-table join vs 3-table)
- **Impact**: Badge counts now correct, excludes archived assessments
- **Related**: [Bug #7 Fix](../Tasks/completed/bug_7_finalize_force_click_timeout_fix.md)

#### Older Implementation Logs

**13. RLS Recursion Fix Summary**
- **File**: [rls_recursion_fix_summary.md](../System/rls_recursion_fix_summary.md)
- **Date**: Oct 2025
- **Contains**: Historical RLS recursion fixes

**13-18. Additional Documentation**
- **Supabase Email Templates**: [supabase_email_templates.md](../System/supabase_email_templates.md) - Email template setup for PKCE flow
- **Auth Redirect Research**: [auth_redirect_research.md](../System/auth_redirect_research.md) - Auth flow investigation
- **Documentation Update Summaries**: Various doc update logs

---

## 📋 How to Use This Index

### For New Features
1. Read [Project Architecture](../System/project_architecture.md) - Understand system
2. Read [Database Schema](../System/database_schema.md) - Understand data model
3. Check Bug Postmortems (above) - Learn from past issues
4. Follow relevant [SOPs](./sops.md)

### For Bug Fixes
1. Check Bug Postmortems (above) - Similar issues?
2. Read [Database Schema](../System/database_schema.md) - Data model issues?
3. Check [Security Recommendations](../System/security_recommendations.md) - RLS issues?
4. Review [UI Loading Patterns](../System/ui_loading_patterns.md) - Loading bugs?

### For Architecture Decisions
1. Read [Project Architecture](../System/project_architecture.md) - Complete overview
2. Check [Architecture Quick Ref](./architecture_quick_ref.md) - Summary
3. Review Bug Postmortems - Learn from past decisions

### For Database Work
1. Start with [Database Quick Ref](./database_quick_ref.md) - Quick overview
2. Read [Database Schema](../System/database_schema.md) - Full details
3. Check [Security Recommendations](../System/security_recommendations.md) - RLS patterns
4. Follow [SOP: Adding Migrations](../SOP/adding_migration.md)

---

## Related Indexes
- **[SOP Index](./sops.md)** - How-to guides and procedures
- **[Task Guides](./task_guides.md)** - Use-case based navigation
- **[Changelog](./changelog.md)** - Recent updates chronologically
- **[FAQ](./faq.md)** - Common questions

---

---

## 🔍 Audit & Compliance

### Audit Logging System ⭐ NEW
- **File**: [audit_logging_system.md](../System/audit_logging_system.md)
- **Size**: ~600 lines | **Last Updated**: Jan 30, 2025
- **Read When**: Implementing audit logging, understanding audit patterns, compliance requirements, debugging workflow issues

**Contains**:
- Complete audit logging architecture (21 entity types, 21 action types)
- Service-by-service coverage documentation
- Metadata patterns and best practices
- UI components (ActivityTimeline, AuditTab)
- Query patterns (`getAssessmentHistory()`, `getEntityHistory()`)
- Performance considerations and indexing strategy
- Troubleshooting guide

**Key for**: Understanding audit trail system, implementing logging in new services, compliance tracking, debugging user actions

**Related**: [Database Schema](./database_schema.md) - audit_logs table schema

---

**Maintenance**: Update this index when adding new System/ documentation
**Last Review**: January 30, 2025
