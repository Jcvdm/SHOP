# Testing Workflow Command

You are a QA expert ensuring ClaimTech features are thoroughly tested before deployment.

---

## Prerequisites Check

Before starting:
- [ ] Feature implementation complete
- [ ] Dev server running (`npm run dev`)
- [ ] Test data available
- [ ] Read `.agent/SOP/testing_guide.md` (if applicable)

---

## Phase 1: Manual Testing (15-20 min)

### 1.0 Generate Comprehensive Test Data (Optional)

Use code execution to generate realistic test datasets for thorough testing:

**Example: Generate Assessment Test Data**

```typescript
// Phase 1: Fetch current state to avoid conflicts
const currentState = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      COALESCE(MAX(assessment_number::int), 0) as max_number,
      COUNT(*) as total_count
    FROM assessments
    WHERE assessment_number ~ '^[0-9]+$'
  `
});

const engineers = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: 'SELECT id, name FROM users WHERE role = \'engineer\' LIMIT 5'
});

// Phase 2: Generate test data plan
const testPlanCode = `
  const currentState = ${JSON.stringify(currentState)};
  const engineers = ${JSON.stringify(engineers)};
  const stages = [
    'request_submitted',
    'inspection_scheduled',
    'inspection_in_progress',
    'report_in_progress',
    'pending_review',
    'completed'
  ];

  // Generate comprehensive test plan
  const testPlan = {
    totalAssessments: stages.length * 5,
    byStage: stages.map((stage, idx) => ({
      stage,
      count: 5,
      assessment_numbers: Array.from({ length: 5 }, (_, i) =>
        (currentState[0].max_number + idx * 5 + i + 1).toString().padStart(6, '0')
      ),
      engineer_id: engineers[idx % engineers.length]?.id || null,
      test_scenarios: [
        'happy_path',
        'edge_case_long_text',
        'edge_case_special_chars',
        'missing_optional_fields',
        'boundary_values'
      ][idx % 5]
    })),
    testData: {
      vehicles: [
        { make: 'Toyota', model: 'Camry', year: 2022, vin: 'TEST1234567890001' },
        { make: 'Honda', model: 'Civic', year: 2021, vin: 'TEST1234567890002' },
        { make: 'Ford', model: 'F-150', year: 2023, vin: 'TEST1234567890003' },
        { make: 'Tesla', model: 'Model 3', year: 2024, vin: 'TEST1234567890004' },
        { make: 'BMW', model: 'X5', year: 2020, vin: 'TEST1234567890005' }
      ],
      claims: [
        { type: 'collision', description: 'Front bumper damage' },
        { type: 'hail', description: 'Roof and hood damage' },
        { type: 'theft', description: 'Stolen stereo system' },
        { type: 'vandalism', description: 'Keyed door panels' },
        { type: 'weather', description: 'Windshield crack from debris' }
      ]
    }
  };

  console.log('Test Data Plan:');
  console.log(JSON.stringify(testPlan, null, 2));
  console.log(\`\\nTotal assessments to create: \${testPlan.totalAssessments}\`);
  console.log(\`Engineers available: \${engineers.length}\`);
  console.log(\`\\nNext steps:\`);
  console.log(\`1. Review test plan above\`);
  console.log(\`2. Use plan to generate INSERT statements\`);
  console.log(\`3. Execute inserts via MCP tools\`);
`;

await mcp__ide__executeCode({ code: testPlanCode });

// Phase 3: Use plan output to create test data via MCP
// (Execute INSERT statements based on plan)
```

**Example: Validate Test Data Creation**

```typescript
// Phase 1: Fetch created test data
const testData = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT stage, COUNT(*) as count
    FROM assessments
    WHERE assessment_number LIKE 'TEST%'
    GROUP BY stage
    ORDER BY stage
  `
});

// Phase 2: Validate with code execution
const validationCode = `
  const testData = ${JSON.stringify(testData)};
  const expectedStages = [
    'request_submitted',
    'inspection_scheduled',
    'inspection_in_progress',
    'report_in_progress',
    'pending_review',
    'completed'
  ];

  console.log('Test Data Validation:');

  expectedStages.forEach(stage => {
    const found = testData.find(row => row.stage === stage);
    if (found) {
      console.log(\`✓ Stage '\${stage}': \${found.count} assessments\`);
    } else {
      console.log(\`✗ Stage '\${stage}': 0 assessments (expected 5)\`);
    }
  });

  const totalCreated = testData.reduce((sum, row) => sum + parseInt(row.count), 0);
  console.log(\`\\nTotal test assessments created: \${totalCreated}\`);
  console.log(totalCreated === 30 ? '✓ All test data created successfully' : '✗ Missing test data');
`;

await mcp__ide__executeCode({ code: validationCode });
```

**Token Efficiency:**
- Traditional approach: Create each record manually (50+ tool calls, 10,000+ tokens)
- Code execution: Generate plan + validate (2 operations, 800-1200 tokens)
- **Savings: 88-92%**

### 1.1 Functionality Testing

**Happy Path:**
- [ ] Primary user flow works end-to-end
- [ ] All buttons/links functional
- [ ] Forms submit successfully
- [ ] Data displays correctly
- [ ] Navigation works as expected

**Edge Cases:**
- [ ] Empty states handled
- [ ] Long text/names handled
- [ ] Special characters handled
- [ ] Null/undefined values handled
- [ ] Boundary values tested

**Error States:**
- [ ] Invalid input shows error messages
- [ ] Network errors handled gracefully
- [ ] Database errors caught and displayed
- [ ] 404/403 errors handled
- [ ] Timeout scenarios handled

**Loading States:**
- [ ] Loading spinners show during async operations
- [ ] Buttons disabled during submission
- [ ] Skeleton loaders for data fetching
- [ ] Progress indicators for long operations

**Success States:**
- [ ] Success messages display
- [ ] Data updates reflected immediately
- [ ] Redirects work correctly
- [ ] Toast notifications appear

### 1.2 User Role Testing

**Admin User:**
- [ ] Can access all features
- [ ] Can view all data
- [ ] Can create/edit/delete records
- [ ] Can access admin-only sections
- [ ] Sidebar shows all menu items

**Engineer User:**
- [ ] Can access assigned features
- [ ] Can only view own/assigned data
- [ ] Cannot access admin sections
- [ ] Sidebar shows role-appropriate items
- [ ] Proper error messages for unauthorized access

**Test Procedure:**
```bash
# Test as admin
1. Login as admin user
2. Navigate to feature
3. Verify full access
4. Test all operations

# Test as engineer
1. Login as engineer user
2. Navigate to feature
3. Verify limited access
4. Test allowed operations
5. Verify unauthorized operations blocked
```

### 1.3 Browser Testing

**Desktop Browsers:**
- [ ] Chrome/Edge (primary)
- [ ] Firefox
- [ ] Safari (if available)

**Mobile Responsive:**
- [ ] Mobile view (< 640px)
- [ ] Tablet view (640px - 1024px)
- [ ] Desktop view (> 1024px)
- [ ] Touch interactions work
- [ ] Hamburger menu functional

**Test Procedure:**
```bash
# Chrome DevTools
1. Press F12
2. Click device toolbar icon
3. Test different screen sizes
4. Check for layout issues
```

### 1.4 Accessibility Testing

**Keyboard Navigation:**
- [ ] Tab order is logical
- [ ] All interactive elements focusable
- [ ] Focus indicators visible
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals

**Screen Reader:**
- [ ] ARIA labels present
- [ ] Form labels associated
- [ ] Error messages announced
- [ ] Status updates announced

**Visual:**
- [ ] Color contrast sufficient
- [ ] Text readable at all sizes
- [ ] Icons have text alternatives
- [ ] No information by color alone

**Output:** Manual test results documented

---

## Phase 2: Unit Testing (if applicable) (20-30 min)

### 2.1 Vitest Setup

**Test File Location:**
```
src/lib/services/entity.service.test.ts
src/lib/components/EntityForm.svelte.test.ts
```

### 2.2 Service Testing Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityService } from './entity.service';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('EntityService', () => {
  let service: EntityService;
  let mockSupabase: any;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: '123', name: 'Test' },
              error: null
            }))
          }))
        }))
      }))
    };

    service = new EntityService(mockSupabase as unknown as SupabaseClient);
  });

  it('should fetch all entities', async () => {
    const entities = await service.getAll();
    expect(entities).toEqual([]);
    expect(mockSupabase.from).toHaveBeenCalledWith('entities');
  });

  it('should create entity', async () => {
    const entity = await service.create({ name: 'Test' });
    expect(entity.id).toBe('123');
    expect(entity.name).toBe('Test');
  });

  it('should handle errors', async () => {
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: null,
          error: { message: 'Database error' }
        }))
      }))
    }));

    await expect(service.getAll()).rejects.toThrow();
  });
});
```

### 2.3 Component Testing Template

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import EntityForm from './EntityForm.svelte';

describe('EntityForm', () => {
  it('should render form fields', () => {
    render(EntityForm);
    
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const { component } = render(EntityForm);
    
    const saveButton = screen.getByRole('button', { name: 'Save' });
    await saveButton.click();
    
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('should emit save event with form data', async () => {
    const { component } = render(EntityForm);
    const onSave = vi.fn();
    component.$on('save', onSave);
    
    const nameInput = screen.getByLabelText('Name');
    await nameInput.fill('Test Entity');
    
    const saveButton = screen.getByRole('button', { name: 'Save' });
    await saveButton.click();
    
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { name: 'Test Entity' }
      })
    );
  });
});
```

### 2.4 Run Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm run test:unit entity.service.test.ts

# Run with coverage
npm run test:unit -- --coverage

# Watch mode
npm run test:unit -- --watch
```

**Output:** Unit tests passing

---

## Phase 3: E2E Testing (if applicable) (30-45 min)

### 3.1 Playwright Setup

**Test File Location:**
```
e2e/entity-management.spec.ts
```

### 3.2 E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Entity Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create new entity', async ({ page }) => {
    // Navigate to entities page
    await page.goto('/entities');
    
    // Click new entity button
    await page.click('text=New Entity');
    
    // Fill form
    await page.fill('[name="name"]', 'Test Entity');
    await page.selectOption('[name="status"]', 'active');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('text=Test Entity')).toBeVisible();
  });

  test('should edit existing entity', async ({ page }) => {
    await page.goto('/entities');
    
    // Click first entity
    await page.click('table tbody tr:first-child');
    
    // Click edit button
    await page.click('text=Edit');
    
    // Update name
    await page.fill('[name="name"]', 'Updated Entity');
    
    // Save
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.locator('text=Updated Entity')).toBeVisible();
  });

  test('should delete entity', async ({ page }) => {
    await page.goto('/entities');
    
    // Click first entity
    await page.click('table tbody tr:first-child');
    
    // Click delete button
    await page.click('text=Delete');
    
    // Confirm deletion
    await page.click('text=Confirm');
    
    // Verify deletion
    await expect(page.locator('.success-message')).toContainText('deleted');
  });

  test('should enforce role-based access', async ({ page }) => {
    // Logout
    await page.click('text=Logout');
    
    // Login as engineer
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'engineer@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Try to access admin page
    await page.goto('/entities');
    
    // Should be redirected or see error
    await expect(page).toHaveURL(/\/dashboard|\/unauthorized/);
  });
});
```

### 3.3 Run E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e entity-management.spec.ts

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Debug mode
npm run test:e2e -- --debug
```

**Output:** E2E tests passing

---

## Phase 4: Performance Testing (10-15 min)

### 4.1 Page Load Performance

**Metrics to Check:**
- [ ] Initial page load < 2 seconds
- [ ] Time to interactive < 3 seconds
- [ ] First contentful paint < 1 second
- [ ] Largest contentful paint < 2.5 seconds

**Test Procedure:**
```bash
# Chrome DevTools
1. Press F12
2. Go to Lighthouse tab
3. Run performance audit
4. Check scores (aim for > 90)
```

### 4.2 Database Query Performance

**Check for N+1 Queries:**
```typescript
// ❌ BAD: N+1 queries
const entities = await service.getAll();
for (const entity of entities) {
  const children = await service.getChildren(entity.id); // N queries!
}

// ✅ GOOD: Single query with join
const entitiesWithChildren = await service.getAllWithChildren();
```

**Test Procedure:**
1. Open Supabase Dashboard
2. Go to Database → Query Performance
3. Check slow queries
4. Verify indexes are used

### 4.3 Bundle Size

```bash
# Build and check bundle size
npm run build

# Check output
# Look for warnings about large chunks
```

**Output:** Performance metrics documented

---

## Phase 5: Security Testing (10-15 min)

### 5.1 RLS Policy Testing

**Test Procedure:**
```sql
-- Test as admin (should see all)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "[admin-id]", "role": "admin"}';
SELECT * FROM entities;

-- Test as engineer (should see limited)
SET LOCAL request.jwt.claims TO '{"sub": "[engineer-id]", "role": "engineer"}';
SELECT * FROM entities;

-- Test as anonymous (should see nothing)
RESET ROLE;
SELECT * FROM entities;
```

### 5.2 Authentication Testing

- [ ] Unauthenticated users redirected to login
- [ ] Protected routes require authentication
- [ ] Session expires after timeout
- [ ] Logout clears session

### 5.3 Input Validation

- [ ] SQL injection prevented (using Supabase client)
- [ ] XSS prevented (proper escaping)
- [ ] CSRF tokens used (SvelteKit handles this)
- [ ] File upload validation (if applicable)

### 5.4 Data Exposure

- [ ] No sensitive data in console logs
- [ ] No secrets in client code
- [ ] Error messages don't leak info
- [ ] API responses don't expose internal data

**Output:** Security checklist completed

---

## Phase 6: Test Documentation (5-10 min)

### 6.1 Create Test Report

**Template:**
```markdown
# Test Report: [Feature Name]

**Date:** [YYYY-MM-DD]
**Tester:** [Your name]
**Environment:** Development

## Summary
[Brief overview of testing performed]

## Test Results

### Manual Testing
- ✅ Functionality: All tests passed
- ✅ User Roles: Admin and engineer tested
- ✅ Browsers: Chrome, Firefox tested
- ✅ Responsive: Mobile and desktop tested
- ✅ Accessibility: Keyboard nav and ARIA tested

### Automated Testing
- ✅ Unit Tests: 15/15 passed
- ✅ E2E Tests: 8/8 passed

### Performance
- ✅ Page load: 1.2s (target: < 2s)
- ✅ Lighthouse score: 95/100

### Security
- ✅ RLS policies enforced
- ✅ Authentication required
- ✅ Input validation working

### Code Execution Efficiency (if applicable)
Include metrics if code execution was used for testing workflows:

**Test Data Generation:**
- Traditional approach: 50 tool calls, 10,000 tokens
- Code execution: 2 operations, 1,200 tokens
- Token savings: 88%

**Data Validation:**
- Traditional approach: 5 tool calls, 2,500 tokens
- Code execution: 2 operations, 500 tokens
- Token savings: 80%

**Overall Testing Efficiency:**
- Total operations reduced: 55 → 4 (93% reduction)
- Total tokens saved: 12,500 → 1,700 (86% savings)

## Issues Found
[List any issues discovered]

## Recommendations
[List any improvements]

## Approval
- [ ] Ready for deployment
- [ ] Needs minor fixes
- [ ] Needs major fixes
```

### 6.2 Document Test Cases

**File:** `.agent/Tasks/active/[feature]_test_cases.md`

```markdown
# Test Cases: [Feature Name]

## TC-001: Create Entity
**Preconditions:** User logged in as admin
**Steps:**
1. Navigate to /entities
2. Click "New Entity"
3. Fill name: "Test"
4. Select status: "active"
5. Click "Save"

**Expected:** Entity created, success message shown
**Actual:** ✅ Passed

## TC-002: Edit Entity
...
```

**Output:** Test documentation complete

---

## Quality Checklist

**Manual Testing:**
- [ ] All user flows tested
- [ ] Both user roles tested
- [ ] Multiple browsers tested
- [ ] Responsive design tested
- [ ] Accessibility checked

**Automated Testing:**
- [ ] Unit tests written (if applicable)
- [ ] E2E tests written (if applicable)
- [ ] All tests passing
- [ ] Coverage > 80% (if applicable)

**Performance:**
- [ ] Page load < 2 seconds
- [ ] No N+1 queries
- [ ] Bundle size reasonable
- [ ] Lighthouse score > 90

**Security:**
- [ ] RLS policies tested
- [ ] Authentication enforced
- [ ] Input validation working
- [ ] No data leaks

**Documentation:**
- [ ] Test report created
- [ ] Test cases documented
- [ ] Issues logged
- [ ] Recommendations provided

---

## Common Issues

### Issue: Tests fail intermittently
**Solution:** Add proper waits, use `waitFor` instead of fixed delays

### Issue: RLS policies not working
**Solution:** Verify policies exist, check user role in JWT claims

### Issue: Slow page loads
**Solution:** Check for N+1 queries, add indexes, optimize images

### Issue: Mobile layout broken
**Solution:** Test with actual devices, check Tailwind responsive classes

---

## Related Commands

- `feature-implementation.md` - Full feature workflow
- `code-review.md` - Code quality checks

---

## Related Skills

- `claimtech-development` - Testing workflows
- `assessment-centric-specialist` - Quality standards

