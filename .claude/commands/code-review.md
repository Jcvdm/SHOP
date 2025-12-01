# Code Review Command

You are a senior code reviewer ensuring ClaimTech quality standards. Use this checklist for every code review.

---

## Review Process

1. **Read the code** - Understand what it does
2. **Check patterns** - Verify ClaimTech conventions
3. **Test security** - Verify RLS and auth
4. **Assess performance** - Check for inefficiencies
5. **Review maintainability** - Ensure code is readable
6. **Verify documentation** - Check docs are updated
7. **Generate report** - Provide actionable feedback

---

## Review Checklist

### 1. Code Quality (Weight: 25%)

#### Pattern Compliance
- [ ] Follows ClaimTech patterns from skills
- [ ] ServiceClient injection used (never creates client)
- [ ] Svelte 5 runes used ($state, $derived, $effect)
- [ ] TypeScript types used throughout
- [ ] No `any` types (use `unknown` if needed)

#### Code Style
- [ ] Consistent naming (camelCase for variables, PascalCase for components)
- [ ] No magic numbers or strings
- [ ] Functions are small and focused (< 50 lines)
- [ ] No commented-out code
- [ ] No console.logs in production code

#### Error Handling
- [ ] All async operations have error handling
- [ ] User-friendly error messages
- [ ] Errors logged appropriately
- [ ] No silent failures

**Examples:**

```typescript
// ❌ BAD: No error handling
async function fetchData() {
  const { data } = await supabase.from('users').select('*');
  return data;
}

// ✅ GOOD: Proper error handling
async function fetchData() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
  return data || [];
}
```

**Score:** ___/10

---

### 2. Security (Weight: 30%)

#### Authentication & Authorization
- [ ] Authentication required for protected routes
- [ ] Role-based access control implemented
- [ ] RLS policies enabled on all tables
- [ ] RLS policies tested with different roles
- [ ] No service role client used in client code

#### Data Protection
- [ ] No sensitive data in logs
- [ ] No secrets in code
- [ ] Input validation implemented
- [ ] SQL injection prevented (using Supabase client)
- [ ] XSS prevention (proper escaping)

#### RLS Policy Review

```sql
-- ❌ BAD: Permissive policy (allows all)
CREATE POLICY "Allow all access"
  ON table_name FOR ALL
  USING (true);

-- ✅ GOOD: Restrictive policy (checks user role)
CREATE POLICY "Admins have full access"
  ON table_name FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ✅ GOOD: Engineers see own records
CREATE POLICY "Engineers see own records"
  ON table_name FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'engineer'
      AND users.id = table_name.assigned_engineer_id
    )
  );
```

**Score:** ___/10

---

### 3. Performance (Weight: 20%)

#### Database Queries
- [ ] No N+1 query patterns
- [ ] Proper indexes used
- [ ] Efficient joins
- [ ] Pagination implemented for large datasets
- [ ] No unnecessary data fetched

#### Frontend Performance
- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] Lazy loading where appropriate
- [ ] Bundle size reasonable

#### Query Analysis

```typescript
// ❌ BAD: N+1 queries
const users = await getUsers();
for (const user of users) {
  const posts = await getPostsByUser(user.id); // N queries!
}

// ✅ GOOD: Single query with join
const usersWithPosts = await supabase
  .from('users')
  .select(`
    *,
    posts (*)
  `);

// ❌ BAD: Fetching unnecessary data
const { data } = await supabase
  .from('users')
  .select('*'); // Gets all columns

// ✅ GOOD: Select only needed columns
const { data } = await supabase
  .from('users')
  .select('id, name, email');
```

**Score:** ___/10

---

### 4. Maintainability (Weight: 15%)

#### Code Readability
- [ ] Clear variable names
- [ ] Functions do one thing
- [ ] Comments explain "why", not "what"
- [ ] Complex logic is documented
- [ ] No deeply nested code (max 3 levels)

#### Code Organization
- [ ] Files in correct directories
- [ ] Related code grouped together
- [ ] No duplicate code
- [ ] Reusable components extracted

#### TypeScript Usage
- [ ] Proper types defined
- [ ] No type assertions without reason
- [ ] Interfaces for complex objects
- [ ] Enums for fixed sets of values

**Examples:**

```typescript
// ❌ BAD: Unclear naming, nested logic
async function f(x: any) {
  if (x) {
    if (x.a) {
      if (x.a.b) {
        return x.a.b.c;
      }
    }
  }
  return null;
}

// ✅ GOOD: Clear naming, flat logic
async function getUserEmail(user: User | null): Promise<string | null> {
  if (!user?.profile?.contact) {
    return null;
  }
  return user.profile.contact.email;
}
```

**Score:** ___/10

---

### 5. Documentation (Weight: 10%)

#### Code Documentation
- [ ] Public functions have JSDoc comments
- [ ] Complex algorithms explained
- [ ] TODOs have issue numbers
- [ ] README updated if needed

#### System Documentation
- [ ] `.agent/System/` docs updated
- [ ] Database schema documented
- [ ] New patterns added to SOPs
- [ ] README.md index updated

**Examples:**

```typescript
// ❌ BAD: No documentation
export class UserService {
  constructor(private supabase: SupabaseClient<Database>) {}
  async getAll() { ... }
}

// ✅ GOOD: Proper JSDoc
/**
 * Service for managing users
 * 
 * @example
 * ```typescript
 * const service = new UserService(supabase);
 * const users = await service.getAll({ role: 'admin' });
 * ```
 */
export class UserService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get all users with optional filtering
   * @param filters Optional filters (role, status)
   * @returns Array of users
   */
  async getAll(filters?: { role?: string; status?: string }): Promise<User[]> {
    // ...
  }
}
```

**Score:** ___/10

---

## Overall Score Calculation

```
Total Score = (Code Quality × 0.25) + 
              (Security × 0.30) + 
              (Performance × 0.20) + 
              (Maintainability × 0.15) + 
              (Documentation × 0.10)
```

**Scoring Guide:**
- **9-10**: Excellent - Ready to merge
- **7-8**: Good - Minor improvements needed
- **5-6**: Acceptable - Significant improvements needed
- **< 5**: Needs work - Major issues to address

---

## Critical Issues (Must Fix)

### Severity Levels:
- **CRITICAL**: Security vulnerabilities, data loss risks
- **HIGH**: Performance issues, broken functionality
- **MEDIUM**: Code quality, maintainability concerns
- **LOW**: Style issues, minor improvements

### Issue Template:

```markdown
**Severity:** [CRITICAL/HIGH/MEDIUM/LOW]
**File:** [path/to/file.ts:line]
**Issue:** [Description of the problem]
**Impact:** [What could go wrong]
**Fix:** [How to fix it]

**Example:**
```typescript
// ❌ BEFORE
const data = await supabase.from('users').select('*');

// ✅ AFTER
const { data, error } = await supabase.from('users').select('*');
if (error) throw error;
```
```

---

## ClaimTech-Specific Checks

### ServiceClient Injection

```typescript
// ❌ WRONG: Creating client in service
export class UserService {
  private supabase = createClient(...); // NEVER DO THIS
}

// ✅ CORRECT: Injecting client
export class UserService {
  constructor(private supabase: SupabaseClient<Database>) {}
}
```

### Svelte 5 Runes

```svelte
<!-- ❌ WRONG: Svelte 4 stores -->
<script>
  import { writable } from 'svelte/store';
  const count = writable(0);
</script>

<!-- ✅ CORRECT: Svelte 5 runes -->
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
```

### Assessment-Centric Architecture

```typescript
// ❌ WRONG: Creating assessment separately
await createRequest(requestData);
// ... later ...
await createAssessment(assessmentData);

// ✅ CORRECT: Assessment created with request
const assessment = await assessmentService.findOrCreateByRequest(requestId);
```

---

## Review Report Template

```markdown
# Code Review Report

**Date:** [YYYY-MM-DD]
**Reviewer:** Claude
**Files Reviewed:** [list of files]

## Summary
[Brief overview of changes]

## Scores
- Code Quality: __/10
- Security: __/10
- Performance: __/10
- Maintainability: __/10
- Documentation: __/10

**Overall Score:** __/10

## Critical Issues
[List any critical issues found]

### Issue #1: [Title]
**Severity:** CRITICAL
**File:** src/lib/services/user.service.ts:45
**Issue:** No error handling on database query
**Impact:** Silent failures, data loss
**Fix:** Add error handling and throw errors

```typescript
// ❌ BEFORE
const { data } = await this.supabase.from('users').select('*');
return data;

// ✅ AFTER
const { data, error } = await this.supabase.from('users').select('*');
if (error) {
  console.error('Error fetching users:', error);
  throw error;
}
return data || [];
```

## Recommendations
1. [Improvement 1]
2. [Improvement 2]
3. [Improvement 3]

## Approval Status
- [ ] ✅ Approved - Ready to merge
- [ ] ⚠️ Approved with comments - Minor fixes needed
- [ ] ❌ Changes requested - Must address issues before merge

## Next Steps
[What needs to be done before merging]
```

---

## Quality Gates

**Before Approving:**
- [ ] All critical issues resolved
- [ ] Security score ≥ 8/10
- [ ] Overall score ≥ 7/10
- [ ] Tests passing
- [ ] Documentation updated

**Auto-Reject If:**
- [ ] RLS not enabled on new tables
- [ ] ServiceClient created in services
- [ ] Secrets in code
- [ ] No error handling
- [ ] Security score < 6/10

---

## Common Patterns to Check

### 1. Error Handling Pattern
```typescript
// ✅ CORRECT
const { data, error } = await supabase.from('table').select('*');
if (error) {
  console.error('Context:', error);
  throw error;
}
return data || [];
```

### 2. ServiceClient Pattern
```typescript
// ✅ CORRECT
export class MyService {
  constructor(private supabase: SupabaseClient<Database>) {}
}
```

### 3. RLS Policy Pattern
```sql
-- ✅ CORRECT
CREATE POLICY "policy_name"
  ON table_name FOR operation
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND [role/permission check]
    )
  );
```

### 4. Svelte 5 Runes Pattern
```svelte
<!-- ✅ CORRECT -->
<script>
  let value = $state(initial);
  let computed = $derived(value * 2);
  
  $effect(() => {
    // Side effects here
  });
</script>
```

---

## Related Commands

- `feature-implementation.md` - Feature development workflow
- `database-migration.md` - Migration review checklist
- `service-development.md` - Service layer standards
- `testing-workflow.md` - Testing requirements

---

## Related Skills

- `claimtech-development` - Development patterns
- `supabase-development` - Database patterns
- `assessment-centric-specialist` - Architecture compliance

