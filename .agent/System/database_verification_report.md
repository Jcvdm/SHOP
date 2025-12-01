# Database Documentation Verification Report

**Generated:** October 25, 2025
**Database:** SVA (Project ID: cfblmkzleqtvtfxujikf)
**Status:** ACTIVE_HEALTHY
**PostgreSQL Version:** 17.6.1.011

---

## Executive Summary

Verified `.agent/System/database_schema.md` against the live Supabase database using MCP tools. Found **significant discrepancies** between documentation and actual database schema, including:

- ❌ **1 missing table** (provinces)
- ⚠️ **10 tables with RLS disabled** (critical security issue)
- 📊 **Major structural differences** in 15+ tables
- 🔄 **Architectural change**: estimates use JSONB arrays instead of relational rows

**Tables in Live Database:** 28
**Tables Documented:** 29 (includes non-existent `provinces` table)

---

## 🚨 Critical Issues

### 1. Missing Table: `provinces`

**Documented:**
```markdown
### `provinces`
South African provinces for location filtering.
```

**Actual:** ❌ **Table does not exist in database**

**Impact:** Documentation references a table that was never created or was removed. Province data is stored as TEXT fields directly in tables.

**Action Required:** Remove from documentation or create the table if needed.

---

### 2. RLS Security Issues (10 Tables)

The following tables have **RLS disabled** despite being public-facing:

| Table | RLS Enabled | Issue |
|-------|-------------|-------|
| `assessment_estimates` | ❌ No | ERROR - Public access |
| `pre_incident_estimates` | ❌ No | ERROR - Public access |
| `pre_incident_estimate_photos` | ❌ No | ERROR - Public access |
| `assessment_vehicle_values` | ❌ No | ERROR - Public access |
| `repairers` | ❌ No | ERROR - Has policies but RLS disabled! |
| `company_settings` | ❌ No | ERROR - Public access |
| `assessment_additionals` | ❌ No | ERROR - Public access |
| `assessment_additionals_photos` | ❌ No | ERROR - Public access |
| `assessment_frc` | ❌ No | ERROR - Public access |
| `assessment_frc_documents` | ❌ No | ERROR - Public access |

**Documentation States:**
> "All tables have RLS enabled"

**Actual:** 10 out of 28 tables (36%) have RLS **disabled**.

**Repairers Table Issue:** Has RLS policies defined but RLS is not enabled on the table, making policies ineffective.

---

## 📊 Major Structural Discrepancies

### 1. `assessment_estimates` - Complete Architectural Change

**Documented:**
```markdown
Estimate line items for repair costs (1:N with assessments).
Multiple rows per assessment, one per line item.

Columns: id, assessment_id, line_number, process_type, part_type,
description, part_number, quantity, part_price, labour, paint, etc.
```

**Actual:**
```sql
-- Single row per assessment (UNIQUE on assessment_id)
-- All line items stored in JSONB array

CREATE TABLE assessment_estimates (
  id uuid PRIMARY KEY,
  assessment_id uuid UNIQUE,  -- ❌ Only ONE row per assessment!
  line_items jsonb DEFAULT '[]',  -- ❌ All items in JSON array!
  subtotal numeric,
  vat_percentage numeric DEFAULT 15.00,
  vat_amount numeric,
  total numeric,
  labour_rate numeric DEFAULT 500.00,
  paint_rate numeric DEFAULT 2000.00,
  oem_markup_percentage numeric DEFAULT 25.00,
  alt_markup_percentage numeric DEFAULT 25.00,
  second_hand_markup_percentage numeric DEFAULT 25.00,
  outwork_markup_percentage numeric DEFAULT 25.00,
  repairer_id uuid,
  assessment_result assessment_result_type,  -- ❌ New enum type!
  -- ... rates and markups
)
```

**Impact:** Fundamental architecture difference. Documentation describes relational model; actual implementation uses document-oriented JSONB approach.

---

### 2. `clients` - Write-off Thresholds

**Documented:**
```markdown
- `writeoff_percentage` (DECIMAL) - Threshold for write-off determination
```

**Actual:**
```sql
- borderline_writeoff_percentage DECIMAL DEFAULT 65.00
- total_writeoff_percentage DECIMAL DEFAULT 70.00
- salvage_percentage DECIMAL DEFAULT 28.00
```

**Impact:** Single field replaced with three specific percentages for different write-off scenarios.

---

### 3. `engineers` - Company Information

**Documented:**
```markdown
Columns:
- id, name, email, phone, specialization, province, is_active,
  auth_user_id, created_at
```

**Actual:**
```sql
Additional Fields:
- company_name TEXT
- company_type TEXT CHECK (company_type IN ('internal', 'external'))
- updated_at TIMESTAMPTZ DEFAULT now()
```

**Impact:** Missing 3 fields in documentation including important company tracking.

---

### 4. `requests` - Missing Province Field

**Documented:** No `vehicle_province` field mentioned.

**Actual:**
```sql
- vehicle_province TEXT
```

---

### 5. `inspections` - Extensive Additional Fields

**Documented:** Basic structure with ~12 fields.

**Actual:** Has **24 fields** including:
```sql
- accepted_by UUID
- accepted_at TIMESTAMPTZ
- vehicle_province TEXT
- request_number TEXT
- claim_number TEXT
- client_id UUID
-- Plus all vehicle details duplicated from request
```

**Impact:** Significant under-documentation of actual table complexity.

---

### 6. `appointments` - Digital Appointments

**Documented:** Basic appointment fields.

**Actual:** Enhanced for in-person AND digital assessments:
```sql
- appointment_type TEXT CHECK ('in_person', 'digital')  -- ❌ NEW!
- duration_minutes INTEGER DEFAULT 60  -- ❌ NEW!
- location_address TEXT
- location_city TEXT
- location_province TEXT
- location_notes TEXT
- completed_at TIMESTAMPTZ
- cancelled_at TIMESTAMPTZ
- cancellation_reason TEXT
```

**Impact:** Digital assessment feature not documented.

---

### 7. `assessments` - Finalized Rates Structure

**Documented:**
```markdown
- estimate_finalized_at TIMESTAMPTZ
- estimate_finalized_by TEXT
```

**Actual:**
```sql
- estimate_finalized_at TIMESTAMPTZ  -- ✓ Correct
- finalized_labour_rate NUMERIC  -- ❌ Not documented
- finalized_paint_rate NUMERIC  -- ❌ Not documented
- finalized_oem_markup NUMERIC  -- ❌ Not documented
- finalized_alt_markup NUMERIC  -- ❌ Not documented
- finalized_second_hand_markup NUMERIC  -- ❌ Not documented
- finalized_outwork_markup NUMERIC  -- ❌ Not documented
- cancelled_at TIMESTAMPTZ  -- ❌ Not documented
-- ❌ estimate_finalized_by field DOES NOT EXIST!
```

**Impact:** Rates frozen at finalization for FRC consistency - critical feature not documented.

---

### 8. `assessment_tyres` - Three Photos Per Tyre

**Documented:**
```markdown
- photo_url TEXT
```

**Actual:**
```sql
- face_photo_url TEXT
- tread_photo_url TEXT
- measurement_photo_url TEXT
```

**Impact:** Three distinct photo types for comprehensive tyre documentation.

---

### 9. `assessment_damage` - Single Record Per Assessment

**Documented:**
```markdown
Damage identification records (1:N with assessments).
Multiple damage records per assessment.
```

**Actual:**
```sql
CREATE TABLE assessment_damage (
  id uuid PRIMARY KEY,
  assessment_id uuid UNIQUE,  -- ❌ ONE record per assessment only!
  -- ... fields
)
```

**Impact:** Constraint prevents multiple damage records. Documentation claims 1:N relationship.

---

### 10. `assessment_notes` - Enhanced Note System

**Documented:**
```markdown
Basic note structure with:
- id, assessment_id, source_tab, note_text, created_by, created_at, updated_at
```

**Actual:**
```sql
- note_type TEXT CHECK ('manual', 'betterment', 'system')  -- ❌ NEW!
- note_title TEXT  -- ❌ NEW!
- is_edited BOOLEAN DEFAULT false  -- ❌ NEW!
- edited_at TIMESTAMPTZ  -- ❌ NEW!
- edited_by UUID  -- ❌ NEW!
- source_tab TEXT  -- ✓ Correct
-- Plus foreign keys to auth.users for created_by and edited_by
```

**Impact:** Rich editing history and note categorization not documented.

---

### 11. `assessment_interior_mechanical` - Additional Fields

**Documented:** Basic interior/mechanical checks.

**Actual:**
```sql
- transmission_type TEXT CHECK ('automatic', 'manual')  -- ❌ NEW!
- gear_lever_photo_url TEXT  -- ❌ NEW!
- vehicle_has_power BOOLEAN  -- ❌ NEW!
```

---

### 12. `assessment_vehicle_values` - Comprehensive Valuation

**Documented:** Simple valuation with market/trade/retail values.

**Actual:** **Extensive third-party valuation system:**
```sql
-- Valuation Source
- sourced_from TEXT
- sourced_code TEXT
- sourced_date DATE

-- Base Values
- trade_value, market_value, retail_value NUMERIC

-- New List Price & Depreciation
- new_list_price NUMERIC
- depreciation_percentage NUMERIC

-- Adjustments
- valuation_adjustment NUMERIC
- valuation_adjustment_percentage NUMERIC
- condition_adjustment_value NUMERIC

-- Adjusted Values
- trade_adjusted_value, market_adjusted_value, retail_adjusted_value

-- Extras (JSONB array)
- extras JSONB DEFAULT '[]'
- trade_extras_total, market_extras_total, retail_extras_total

-- Total Adjusted
- trade_total_adjusted_value, market_total_adjusted_value, retail_total_adjusted_value

-- Write-off Calculations (using client percentages)
- borderline_writeoff_trade/market/retail
- total_writeoff_trade/market/retail
- salvage_trade/market/retail

-- Valuation Document
- valuation_pdf_url TEXT
- valuation_pdf_path TEXT

-- Warranty & Service
- warranty_status TEXT CHECK (...)
- warranty_period_years INTEGER
- warranty_start_date, warranty_end_date DATE
- warranty_expiry_mileage TEXT
- service_history_status TEXT CHECK (...)
- warranty_notes TEXT
```

**Impact:** Massive under-documentation of complex valuation system.

---

### 13. `assessment_frc` - Separate Quoted/Actual Breakdown

**Documented:**
```markdown
Simple totals:
- total_parts, total_labour, total_paint, total_outwork
- vat_amount, grand_total
```

**Actual:**
```sql
-- Quoted Totals
- quoted_parts_total, quoted_labour_total, quoted_paint_total, quoted_outwork_total
- quoted_subtotal, quoted_vat_amount, quoted_total

-- Quoted Estimate Breakdown
- quoted_estimate_parts_nett, quoted_estimate_labour, quoted_estimate_paint
- quoted_estimate_outwork_nett, quoted_estimate_markup, quoted_estimate_subtotal

-- Quoted Additionals Breakdown
- quoted_additionals_parts_nett, quoted_additionals_labour, quoted_additionals_paint
- quoted_additionals_outwork_nett, quoted_additionals_markup, quoted_additionals_subtotal

-- Actual Totals (same structure as quoted)
- actual_parts_total, actual_labour_total, etc.

-- Actual Estimate Breakdown
- actual_estimate_parts_nett, actual_estimate_labour, etc.

-- Actual Additionals Breakdown
- actual_additionals_parts_nett, actual_additionals_labour, etc.

-- Sign-off
- signed_off_by_name, signed_off_by_email, signed_off_by_role
- signed_off_at, sign_off_notes

-- Report
- frc_report_url TEXT
```

**Impact:** Complex quoted vs. actual tracking with estimate/additionals separation not documented.

---

### 14. `company_settings` - Different Field Names

**Documented:**
```markdown
- company_name, company_address, company_phone, company_email
- labour_rate, paint_rate
- parts_markup, labour_markup, paint_markup, outwork_markup
- vat_percentage
```

**Actual:**
```sql
- company_name TEXT DEFAULT 'Claimtech'
- po_box TEXT DEFAULT 'P.O. Box 12345'  -- ❌ Not company_address
- city TEXT DEFAULT 'Johannesburg'
- province TEXT DEFAULT 'Gauteng'
- postal_code TEXT DEFAULT '2000'
- phone TEXT DEFAULT '+27 (0) 11 123 4567'
- fax TEXT DEFAULT '+27 (0) 86 123 4567'  -- ❌ NEW!
- email TEXT DEFAULT 'info@claimtech.co.za'
- website TEXT DEFAULT 'www.claimtech.co.za'  -- ❌ NEW!
- logo_url TEXT  -- ❌ NEW!
-- ❌ NO rate or markup fields!
```

**Impact:** Completely different structure. Rates/markups may have moved elsewhere.

---

### 15. `assessment_additionals` - Soft Delete Migration

**Documented:**
```markdown
Similar to assessment_estimates
```

**Actual:**
```sql
- excluded_line_item_ids JSONB DEFAULT '[]'
  COMMENT: 'DEPRECATED: Use action="removed" line items instead.
            Kept for backward compatibility.
            Should always be empty array after migration 037.'
```

**Impact:** Soft-delete strategy changed but old field remains for compatibility.

---

## ✅ Storage Buckets

### `documents` Bucket

**Documented:**
```markdown
- Public: false
- File size limit: 50 MB
- Allowed MIME types: application/pdf, application/zip
```

**Actual:**
```sql
- name: "documents"
- public: false  -- ✓ Correct
- file_size_limit: NULL  -- ❌ Not set!
- allowed_mime_types: NULL  -- ❌ Not set!
```

---

### `SVA Photos` Bucket

**Documented:**
```markdown
- Public: false
- File size limit: 10 MB
- Allowed MIME types: image/jpeg, image/png, image/webp
```

**Actual:**
```sql
- name: "SVA Photos"
- public: false  -- ✓ Correct
- file_size_limit: NULL  -- ❌ Not set!
- allowed_mime_types: NULL  -- ❌ Not set!
```

**Impact:** Security configurations documented but not actually enforced at bucket level.

---

## ✅ Correctly Documented

The following aspects match the documentation accurately:

### Tables Structure (Mostly Correct)
- ✅ `clients` - Core structure correct (minus write-off fields)
- ✅ `requests` - Core structure correct (minus vehicle_province)
- ✅ `request_tasks` - Fully correct
- ✅ `audit_logs` - Fully correct
- ✅ `assessment_vehicle_identification` - Correct (added vehicle fields documented)
- ✅ `assessment_360_exterior` - Fully correct
- ✅ `assessment_accessories` - Fully correct
- ✅ `estimate_photos` - Fully correct
- ✅ `pre_incident_estimate_photos` - Fully correct
- ✅ `user_profiles` - Fully correct

### Foreign Keys
- ✅ All documented foreign key relationships verified as correct

### Primary Keys
- ✅ All tables use UUID primary keys as documented

### Timestamps
- ✅ `created_at` and `updated_at` fields present as documented
- ✅ Triggers for `updated_at` auto-update verified

### Default Values
- ✅ Most default values match documentation

---

## 📋 Summary of Issues by Priority

### 🔴 Critical (Must Fix)
1. **10 tables with RLS disabled** - Security vulnerability
2. **`provinces` table doesn't exist** - Documentation error
3. **`assessment_estimates` architecture** - Fundamental mismatch
4. **Storage bucket limits not enforced** - Security gap

### 🟠 High Priority (Significant Discrepancies)
5. **`clients`** - Write-off percentage fields different
6. **`assessments`** - Finalized rates not documented
7. **`assessment_vehicle_values`** - Massively under-documented
8. **`assessment_frc`** - Complex breakdown not documented
9. **`company_settings`** - Wrong field names, missing rates

### 🟡 Medium Priority (Feature Gaps)
10. **`engineers`** - Missing company fields
11. **`inspections`** - Missing many fields
12. **`appointments`** - Digital assessment type not documented
13. **`assessment_tyres`** - Three photos vs one
14. **`assessment_notes`** - Enhanced features not documented
15. **`assessment_interior_mechanical`** - Missing 3 fields

### 🟢 Low Priority (Minor Issues)
16. **`requests`** - Missing vehicle_province
17. **`assessment_damage`** - Cardinality mismatch (1:1 not 1:N)

---

## 🎯 Recommendations

### Immediate Actions

1. **Enable RLS** on all 10 unprotected tables
2. **Remove `provinces` table** from documentation (or create if actually needed)
3. **Update `assessment_estimates` documentation** to reflect JSONB architecture
4. **Set storage bucket limits** as documented

### Documentation Updates

5. **Rewrite the following sections:**
   - `clients` - Update write-off percentage fields
   - `engineers` - Add company fields
   - `inspections` - Document all 24 fields
   - `appointments` - Add digital assessment features
   - `assessments` - Add finalized rate fields, remove finalized_by
   - `assessment_tyres` - Update to three photo fields
   - `assessment_damage` - Fix cardinality (1:1 not 1:N)
   - `assessment_notes` - Document enhanced note system
   - `assessment_interior_mechanical` - Add missing fields
   - `assessment_estimates` - **Complete rewrite** for JSONB structure
   - `assessment_vehicle_values` - Extensive expansion needed
   - `company_settings` - Correct field names
   - `assessment_frc` - Document quoted/actual breakdown
   - `assessment_additionals` - Note deprecated field

6. **Add new sections:**
   - Custom types (e.g., `assessment_result_type` enum)
   - Migration notes about architectural changes

---

## 📊 Statistics

| Metric | Count |
|--------|-------|
| Total Tables in DB | 28 |
| Tables Documented | 29 (includes non-existent `provinces`) |
| Tables with RLS Disabled | 10 (36%) |
| Tables with Major Discrepancies | 15 |
| Tables Fully Accurate | 10 |
| Storage Buckets | 2 (both missing limits) |
| Security Advisories | 11 (10 RLS, 1 leaked password protection) |

---

## 🔗 Related Files

- **Documentation:** `.agent/System/database_schema.md`
- **Migrations:** `supabase/migrations/*.sql` (57 files)
- **This Report:** `.agent/System/database_verification_report.md`

---

**Report Generated by:** Claude Code + Supabase MCP
**Verification Method:** Live database query via MCP tools
**Confidence Level:** HIGH (Direct schema inspection)