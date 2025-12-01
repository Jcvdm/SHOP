# Database Redundancy Audit
**Date**: November 9, 2025  
**Status**: COMPREHENSIVE AUDIT COMPLETE

---

## 📊 Summary

| Category | Count | Status |
|----------|-------|--------|
| JSONB Columns | 10 | ⚠️ Review needed |
| Photo Columns | 40+ | ✅ Mostly OK |
| Redundancies Found | 2 | 🚨 Action needed |

---

## 🚨 CRITICAL REDUNDANCIES FOUND

### 1. ✅ FIXED: `assessment_360_exterior.additional_photos` (JSONB)
**Status**: REMOVED ✅  
**Reason**: Replaced by `assessment_exterior_360_photos` table  
**Action Taken**: Column dropped

### 2. ⚠️ POTENTIAL: `assessment_damage.photos` (JSONB)
**Status**: NEEDS REVIEW  
**Current**: Stores damage photos as JSONB array  
**Pattern**: Similar to removed `additional_photos` column  
**Recommendation**: Consider creating `assessment_damage_photos` table

---

## 📋 JSONB Columns Analysis

### Legitimate JSONB Usage (Keep As-Is)
✅ **`assessments.tabs_completed`** - Array of completed tab names
- Lightweight, non-relational data
- No need for separate table

✅ **`audit_logs.metadata`** - Flexible metadata storage
- Audit trail data
- Appropriate for JSONB

✅ **`assessment_vehicle_values.extras`** - Flexible extras data
- Optional vehicle extras
- Appropriate for JSONB

### Structured Data in JSONB (Consider Normalization)
⚠️ **`assessment_additionals.line_items`** - Line items array
- Could be normalized to `assessment_additionals_line_items` table
- Currently: JSONB array
- Pattern: Similar to `assessment_estimates.line_items`

⚠️ **`assessment_estimates.line_items`** - Line items array
- Could be normalized to `assessment_estimate_line_items` table
- Currently: JSONB array
- Pattern: Structured data

⚠️ **`assessment_frc.line_items`** - Line items array
- Could be normalized to `assessment_frc_line_items` table
- Currently: JSONB array
- Pattern: Structured data

⚠️ **`pre_incident_estimates.line_items`** - Line items array
- Could be normalized to `pre_incident_estimate_line_items` table
- Currently: JSONB array
- Pattern: Structured data

⚠️ **`assessment_additionals.excluded_line_item_ids`** - Array of IDs
- Could be normalized to `assessment_additionals_excluded_items` table
- Currently: JSONB array
- Pattern: Relational data

⚠️ **`assessment_damage.affected_panels`** - Array of panel names
- Could be normalized to `assessment_damage_panels` table
- Currently: JSONB array
- Pattern: Relational data

🚨 **`assessment_damage.photos`** - Photos array
- REDUNDANT with potential `assessment_damage_photos` table
- Currently: JSONB array
- Pattern: Similar to removed `additional_photos` column

---

## 🎯 Recommended Actions

### Priority 1: IMMEDIATE (Critical)
**None** - Already fixed `additional_photos`

### Priority 2: HIGH (Should Fix)
1. **`assessment_damage.photos`** - Create dedicated table
   - Reason: Photos should be normalized
   - Impact: Better querying, indexing, RLS
   - Effort: Medium

### Priority 3: MEDIUM (Consider)
1. **Line items normalization** - Create dedicated tables for:
   - `assessment_estimate_line_items`
   - `assessment_additionals_line_items`
   - `assessment_frc_line_items`
   - `pre_incident_estimate_line_items`
   - Reason: Better data integrity, querying
   - Impact: Significant refactoring
   - Effort: High

2. **`assessment_damage.affected_panels`** - Create dedicated table
   - Reason: Relational data should be normalized
   - Impact: Better querying
   - Effort: Low

### Priority 4: LOW (Nice to Have)
1. **`assessment_additionals.excluded_line_item_ids`** - Normalize
   - Reason: Relational data
   - Impact: Cleaner schema
   - Effort: Low

---

## 📊 Photo Columns Status

### ✅ GOOD: Dedicated Photo Tables (Normalized)
- `estimate_photos` - Estimate photos (1:N)
- `pre_incident_estimate_photos` - Pre-incident photos (1:N)
- `assessment_additionals_photos` - Additional estimate photos (1:N)
- `assessment_interior_photos` - Interior photos (1:N) ✅ NEW
- `assessment_exterior_360_photos` - Exterior photos (1:N) ✅ NEW

### ✅ GOOD: Fixed Photo Columns (1:1 Relationships)
- `assessment_360_exterior` - 8 required 360° photos (fixed positions)
- `assessment_interior_mechanical` - 9 required mechanical photos (fixed positions)
- `assessment_vehicle_identification` - 5 required ID photos (fixed positions)
- `assessment_tyres` - 3 photos per tyre (fixed positions)
- `assessment_accessories` - Single photo per accessory

### ⚠️ NEEDS REVIEW: Damage Photos
- `assessment_damage.photos` - JSONB array (should be normalized)

---

## 🔄 Proposed Schema Improvements

### Option A: Minimal Changes (Recommended)
1. Create `assessment_damage_photos` table
2. Migrate data from JSONB
3. Drop `assessment_damage.photos` column

### Option B: Full Normalization (Major Refactoring)
1. Create all line items tables
2. Create damage photos table
3. Create damage panels table
4. Migrate all data
5. Update all code

---

## ✅ Current Status

| Item | Status | Action |
|------|--------|--------|
| `assessment_360_exterior.additional_photos` | ✅ REMOVED | Complete |
| `assessment_damage.photos` | ⚠️ REDUNDANT | Pending |
| Line items JSONB | ⚠️ CONSIDER | Pending |
| Damage panels JSONB | ⚠️ CONSIDER | Pending |

---

## 📝 Next Steps

1. **Decide**: Proceed with Option A (damage photos) or Option B (full normalization)?
2. **Implement**: Create new tables and migrate data
3. **Update**: Code to use new tables
4. **Test**: Verify all functionality
5. **Document**: Update schema documentation

**Recommendation**: Start with Option A (damage photos) - quick win, minimal risk.

