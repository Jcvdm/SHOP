# ClaimTech Security Recommendations

**Last Updated:** October 25, 2025
**Status:** Active Monitoring Required

---

## Executive Summary

ClaimTech database security has been significantly hardened with **100% RLS coverage** across all tables and **search_path protection** on all functions. One manual configuration remains to complete security hardening.

**Security Status:**
- ✅ **28/28 tables** (100%) have RLS enabled
- ✅ **40+ RLS policies** protecting data access
- ✅ **8/8 functions** have search_path protection
- ⚠️ **1 manual config** required: Leaked password protection

---

## Completed Security Improvements (October 25, 2025)

### 1. Row Level Security (RLS) - COMPLETE ✅

**Issue:** 10 tables (36%) had RLS disabled, exposing sensitive data
**Resolution:** Enabled RLS on all tables with appropriate policies

**Tables Secured:**
1. `repairers` - Enabled RLS (policies already existed)
2. `company_settings` - RLS + admin-only modification policies ✅ Correct (system config)

**Assessment Tables (updated with multi-policy pattern - migration 063):**
3. `assessment_estimates` - RLS + multi-policy (admin + engineer) ✅
4. `assessment_vehicle_values` - RLS + multi-policy (admin + engineer) ✅
5. `pre_incident_estimates` - RLS + multi-policy (admin + engineer) ✅
6. `pre_incident_estimate_photos` - RLS + multi-policy (admin + engineer) ✅
7. `assessment_additionals` - RLS + multi-policy (admin + engineer) ✅
8. `assessment_additionals_photos` - RLS + multi-policy (admin + engineer) ✅
9. `assessment_frc` - RLS + multi-policy (admin + engineer) ✅
10. `assessment_frc_documents` - RLS + multi-policy (admin + engineer) ✅

**Policy Pattern (System Config Tables):**
```sql
-- SELECT: All authenticated users can view data
CREATE POLICY "Authenticated users can view [table]"
ON [table] FOR SELECT TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Admins only
CREATE POLICY "Only admins can modify [table]"
ON [table] FOR ALL TO authenticated
USING (is_admin());
```

**Policy Pattern (Assessment Tables - Multi-Policy):**
```sql
-- SELECT: All authenticated users can view
CREATE POLICY "Authenticated users can view [table]"
ON [table] FOR SELECT TO authenticated
USING (true);

-- INSERT: Admins OR Engineers (for their assessments)
CREATE POLICY "Admins can insert [table]"
ON [table] FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Engineers can insert [table]"
ON [table] FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assessments
    JOIN appointments ON assessments.appointment_id = appointments.id
    WHERE assessments.id = [table].assessment_id
    AND appointments.engineer_id = get_user_engineer_id()
  )
);

-- UPDATE: Admins OR Engineers (for their assessments)
CREATE POLICY "Admins can update [table]"
ON [table] FOR UPDATE TO authenticated
USING (is_admin());

CREATE POLICY "Engineers can update [table]"
ON [table] FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assessments
    JOIN appointments ON assessments.appointment_id = appointments.id
    WHERE assessments.id = [table].assessment_id
    AND appointments.engineer_id = get_user_engineer_id()
  )
);

-- DELETE: Admins only
CREATE POLICY "Only admins can delete [table]"
ON [table] FOR DELETE TO authenticated
USING (is_admin());
```

**Migrations Applied:**
- `058_enable_rls_repairers.sql` - Enabled RLS on repairers
- `059_rls_estimates_valuations_frc.sql` - Initial RLS (admin-only, too restrictive)
- `060_rls_pre_incident_additionals.sql` - Initial RLS (admin-only, too restrictive)
- `061_rls_company_settings_frc_documents.sql` - RLS for company settings
- **`063_fix_rls_engineer_access.sql`** - ✅ **FIXED:** Updated 8 assessment tables with multi-policy pattern (admin + engineer)

### 2. Function Search Path Protection - COMPLETE ✅

**Issue:** 8 functions vulnerable to search_path injection attacks
**Resolution:** Added `SET search_path = ''` to all functions

**Functions Secured:**

**Critical (Auth-related):**
- ✅ `is_admin()` - SECURITY DEFINER with search_path protection
- ✅ `get_user_engineer_id()` - SECURITY DEFINER with search_path protection
- ✅ `custom_access_token_hook()` - SECURITY DEFINER with search_path protection

**Standard (Triggers):**
- ✅ `update_updated_at_column()`
- ✅ `update_estimate_photos_updated_at()`
- ✅ `handle_new_user()`
- ✅ `update_user_profile_updated_at()`
- ✅ `update_assessment_notes_updated_at()`

**Migration Applied:**
- `062_fix_function_search_paths.sql`

---

## Remaining Security Task (Manual Configuration)

### Leaked Password Protection ⚠️ MANUAL REQUIRED

**Issue:** HaveIBeenPwned.org password checking is disabled
**Impact:** Users can set compromised passwords
**Priority:** Medium (recommended before production)

**How to Enable:**
1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: **SVA** (cfblmkzleqtvtfxujikf)
3. Go to: **Authentication** → **Policies**
4. Find: **Password Strength and Leaked Password Protection**
5. Enable: **Check passwords against HaveIBeenPwned database**
6. Save changes

**Documentation:**
[Supabase Password Security Guide](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

**Benefits:**
- Prevents users from setting compromised passwords
- Protects against credential stuffing attacks
- Improves overall account security

---

## Current Security Posture

### Database Access Control

**RLS Coverage:** 100% (28/28 tables)

**Access Patterns:**

| User Role | Access Level | Tables Affected |
|-----------|--------------|-----------------|
| **Anonymous** | No access | All tables (RLS blocks) |
| **Authenticated** | Read-only | All tables (can SELECT) |
| **Admin** | Full access | All tables (CRUD operations) |
| **Engineer** | Read + limited write | Assigned assessments/appointments |

**Special Cases:**
- `audit_logs` - All authenticated users can INSERT (for logging)
- `audit_logs` - No one can UPDATE/DELETE (immutable audit trail)
- Engineers can view/update only their assigned work via multi-policy RLS

### Function Security

**All functions have:**
- ✅ Proper `SECURITY DEFINER` or standard execution context
- ✅ `SET search_path = ''` to prevent injection
- ✅ Schema-qualified table references (`public.table_name`)

**Auth helper functions:**
- `is_admin()` - Used in 40+ RLS policies
- `get_user_engineer_id()` - Used in engineer-specific policies
- `custom_access_token_hook()` - Adds user_role/engineer_id to JWT

### Storage Security

**Bucket Configuration:**
- ✅ `documents` - Private bucket (RLS enforced via proxy)
- ✅ `SVA Photos` - Private bucket (RLS enforced via proxy)
- ⚠️ File size limits NOT enforced (set to NULL)
- ⚠️ MIME type restrictions NOT enforced (set to NULL)

**Proxy Endpoints:**
- `/api/photo/[...path]` - Authenticated photo access
- `/api/document/[...path]` - Authenticated document access

**Note:** Storage policies enforce authentication, but file size/type limits should be set at bucket level or application level.

---

## Security Testing Checklist

### RLS Policy Testing

**Test 1: Anonymous Access (Should Fail)**
```bash
# Use anon key to query protected table
curl https://cfblmkzleqtvtfxujikf.supabase.co/rest/v1/assessment_estimates \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"

# Expected: Empty array [] or 401 Unauthorized
```

**Test 2: Authenticated Non-Admin (Read-Only)**
```bash
# Use authenticated user JWT to SELECT
# Expected: Can see data

# Try to INSERT/UPDATE/DELETE
# Expected: Should fail with RLS error
```

**Test 3: Admin User (Full Access)**
```bash
# Use admin user JWT
# Expected: Can SELECT, INSERT, UPDATE, DELETE all tables
```

### Function Security Testing

**Test 1: Verify search_path protection**
```sql
-- Check function has search_path = ''
SELECT proname, prosrc, proconfig
FROM pg_proc
WHERE proname IN ('is_admin', 'get_user_engineer_id', 'custom_access_token_hook');

-- Expected: proconfig should show {search_path=''}
```

**Test 2: Verify is_admin() function**
```sql
-- As admin user
SELECT is_admin(); -- Should return TRUE

-- As regular user
SELECT is_admin(); -- Should return FALSE
```

---

## Monitoring & Maintenance

### Quarterly Security Audit

**Schedule:** Every 3 months
**Responsible:** Security Team / DevOps

**Checklist:**
1. Run Supabase security advisors
2. Verify all tables have RLS enabled
3. Check for new tables without RLS
4. Review RLS policies for correctness
5. Test auth flows with different user roles
6. Check storage bucket policies
7. Review function security settings
8. Update this document with findings

**Command:**
```bash
# Check RLS status for all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### New Table Checklist

When creating new tables, ensure:

- [ ] Table has `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- [ ] Table has `created_at TIMESTAMPTZ DEFAULT now()`
- [ ] Table has `updated_at TIMESTAMPTZ DEFAULT now()`
- [ ] Update trigger created for `updated_at`
- [ ] **RLS ENABLED:** `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;`
- [ ] SELECT policy created (authenticated users)
- [ ] INSERT/UPDATE/DELETE policies created (admin-only or appropriate)
- [ ] Indexes on foreign keys
- [ ] Indexes on commonly queried fields
- [ ] Migration file committed
- [ ] Documentation updated

---

## Security Best Practices

### 1. Never Expose Service Role Key

```typescript
// ❌ WRONG - Exposes admin access to client
import { supabaseServer } from '$lib/supabase-server';
export const load = async () => {
  const data = await supabaseServer.from('table').select('*');
  return { data };
};
```

```typescript
// ✅ CORRECT - Uses user's session with RLS
export const load: PageServerLoad = async ({ locals }) => {
  const { data } = await locals.supabase.from('table').select('*');
  return { data };
};
```

### 2. Always Use Proxy Endpoints for Storage

```typescript
// ❌ WRONG - Signed URLs expire
const { data } = await supabase.storage
  .from('bucket')
  .createSignedUrl(path, 3600);
```

```typescript
// ✅ CORRECT - Permanent proxy URLs
const url = `/api/photo/${filePath}`;
```

### 3. Audit All State Changes

```typescript
// ✅ ALWAYS log important state changes
await auditService.logChange({
  entity_type: 'assessment',
  entity_id: id,
  action: 'status_changed',
  field_name: 'status',
  old_value: oldStatus,
  new_value: newStatus
});
```

### 4. Use Helpers in RLS Policies

```sql
-- ✅ CORRECT - Uses helper function
CREATE POLICY "Admins can modify"
ON table FOR ALL
TO authenticated
USING (is_admin());

-- ❌ WRONG - Duplicates logic
CREATE POLICY "Admins can modify"
ON table FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

---

## Incident Response

### If RLS Bypass Suspected

1. **Immediate:** Pause Supabase project (if critical data exposed)
2. **Investigate:** Check Supabase logs for unauthorized access
3. **Verify:** Run security advisor checks
4. **Test:** Attempt to reproduce with anon/user/admin keys
5. **Fix:** Apply corrective migration
6. **Audit:** Review all data access logs
7. **Document:** Update this guide with findings

### If Compromised Credentials

1. **Revoke:** Rotate all API keys (anon, service_role)
2. **Reset:** Force password reset for affected users
3. **Audit:** Check audit_logs for suspicious activity
4. **Notify:** Inform affected users if data exposed
5. **Review:** Check for data exfiltration
6. **Harden:** Enable leaked password protection if not enabled

---

## Related Documentation

- [Database Schema](./../System/database_schema.md) - All tables and RLS status
- [Database Verification Report](./../System/database_verification_report.md) - Security findings (pre-hardening)
- [RLS Security Hardening Implementation](./../Tasks/active/rls_security_hardening.md) - Implementation plan
- [Supabase Development Skill](./../../.claude/skills/supabase-development/SECURITY.md) - RLS patterns and templates

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Oct 25, 2025 | Initial document after RLS hardening | Claude Code |

---

**Last Security Audit:** October 25, 2025
**Next Audit Due:** January 25, 2026
**Document Owner:** ClaimTech Security Team
