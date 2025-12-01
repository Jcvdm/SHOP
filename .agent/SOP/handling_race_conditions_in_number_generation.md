# SOP: Handling Race Conditions in Sequential Number Generation

**Version:** 2.0
**Created:** January 25, 2025
**Last Updated:** January 25, 2025

---

## 📋 **Overview**

This SOP documents the standard pattern for handling race conditions when generating sequential unique numbers (request numbers, inspection numbers, assessment numbers, etc.) in ClaimTech.

**IMPORTANT:** This SOP now includes **frontend prevention strategies** in addition to backend retry logic. Both layers are required for complete protection against race conditions.

---

## 🎯 **When to Use This SOP**

Use this pattern when:
- Creating entities with auto-generated sequential numbers (REQ-2025-001, INS-2025-001, etc.)
- Implementing any service method that generates unique identifiers
- Encountering duplicate key constraint violations (error code 23505)
- Users report errors when double-clicking action buttons
- Multiple users might create records simultaneously

---

## 🔍 **Problem: Race Condition in Number Generation**

### **Vulnerable Pattern (DO NOT USE)**

```typescript
// ❌ WRONG: Race condition possible
async createEntity(input: CreateInput): Promise<Entity> {
  // Step 1: Count existing records (NOT ATOMIC)
  const { count } = await db
    .from('entities')
    .select('*', { count: 'exact', head: true })
    .like('entity_number', `PREFIX-${year}-%`);
  
  // Step 2: Generate next number (RACE CONDITION HERE)
  const nextNumber = (count || 0) + 1;
  const entityNumber = `PREFIX-${year}-${String(nextNumber).padStart(3, '0')}`;
  
  // Step 3: Insert (MAY FAIL with duplicate key error)
  const { data, error } = await db
    .from('entities')
    .insert({ ...input, entity_number: entityNumber });
  
  if (error) throw error;
  return data;
}
```

### **Why It Fails**

**Scenario: Two simultaneous requests**

1. **Request A:** Counts records → Gets 5 → Generates PREFIX-2025-006
2. **Request B:** Counts records → Gets 5 → Generates PREFIX-2025-006 (SAME!)
3. **Request A:** Inserts successfully
4. **Request B:** Fails with error code 23505 (duplicate key constraint violation)

**Result:**
- ❌ User sees error message
- ❌ Entity appears "missing" (actually created by Request A)
- ❌ Workflow blocked
- ❌ Poor user experience

---

## ✅ **Solution: Retry with Exponential Backoff**

### **Safe Pattern (USE THIS)**

```typescript
// ✅ CORRECT: Handles race conditions gracefully
async createEntity(
  input: CreateInput, 
  client?: ServiceClient, 
  maxRetries: number = 3
): Promise<Entity> {
  const db = client ?? supabase;
  
  // Retry loop to handle race conditions
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Generate unique number
      const entityNumber = await this.generateEntityNumber(client);
      
      // Attempt insert
      const { data, error } = await db
        .from('entities')
        .insert({
          ...input,
          entity_number: entityNumber,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) {
        // Check if this is a duplicate key error (race condition)
        if (error.code === '23505' && attempt < maxRetries - 1) {
          console.log(`Duplicate entity number detected (attempt ${attempt + 1}/${maxRetries}), retrying...`);
          // Exponential backoff: 100ms, 200ms, 400ms
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
          continue; // Retry with new number
        }
        
        // Not a duplicate or max retries reached
        console.error('Error creating entity:', error);
        throw new Error(`Failed to create entity: ${error.message}`);
      }
      
      // Success! Log audit trail
      await auditService.logChange({
        entity_type: 'entity',
        entity_id: data.id,
        action: 'created',
        new_value: entityNumber
      });
      
      return data;
      
    } catch (error) {
      // If this is the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        console.error('Failed to create entity after maximum retries:', error);
        throw error;
      }
      // Otherwise, continue to next retry
    }
  }
  
  // Should never reach here, but TypeScript needs this
  throw new Error('Failed to create entity after maximum retries');
}
```

---

## 🔧 **Implementation Steps**

### **Step 1: Update Service Method**

1. Add `maxRetries` parameter (default: 3)
2. Wrap creation logic in retry loop
3. Detect duplicate key errors (code 23505)
4. Implement exponential backoff
5. Add console logging for debugging

### **Step 2: Add Error Handling in Page Server**

```typescript
// In +page.server.ts
try {
  entity = await entityService.createEntity(input, locals.supabase);
} catch (createError: any) {
  // Handle race condition gracefully
  if (createError.message && createError.message.includes('duplicate key')) {
    console.log('Race condition detected, fetching existing entity...');
    
    // Wait for other request to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fetch existing entity
    entity = await entityService.getEntityByReference(referenceId, locals.supabase);
    
    if (!entity) {
      throw error(500, 'Failed to create or fetch entity');
    }
    
    console.log('Recovered from race condition:', entity.id);
  } else {
    throw error(500, `Failed to create entity: ${createError.message}`);
  }
}
```

---

## 📊 **Exponential Backoff Explained**

**Why exponential backoff?**
- Reduces collision probability on retry
- Gives first request time to complete
- Prevents thundering herd problem

**Timing:**
- Attempt 1: Wait 100ms (100 * 2^0)
- Attempt 2: Wait 200ms (100 * 2^1)
- Attempt 3: Wait 400ms (100 * 2^2)

**Formula:**
```typescript
const delay = 100 * Math.pow(2, attempt);
await new Promise(resolve => setTimeout(resolve, delay));
```

---

## 🎓 **Real-World Examples**

### **Example 1: Assessment Service**

<augment_code_snippet path="src/lib/services/assessment.service.ts" mode="EXCERPT">
````typescript
async createAssessment(
  input: CreateAssessmentInput, 
  client?: ServiceClient, 
  maxRetries: number = 3
): Promise<Assessment> {
  const db = client ?? supabase;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const assessmentNumber = await this.generateAssessmentNumber(client);
      const { data, error } = await db.from('assessments').insert({
        ...input,
        assessment_number: assessmentNumber,
        status: 'in_progress'
      }).select().single();
      
      if (error) {
        if (error.code === '23505' && attempt < maxRetries - 1) {
          console.log(`Duplicate detected, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
          continue;
        }
        throw error;
      }
      
      await auditService.logChange({ ... });
      return data;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }
  }
  throw new Error('Failed after maximum retries');
}
````
</augment_code_snippet>

### **Example 2: Page Server Error Handling**

<augment_code_snippet path="src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts" mode="EXCERPT">
````typescript
if (!assessment) {
  try {
    assessment = await assessmentService.createAssessment({
      appointment_id: appointmentId,
      inspection_id: appointment.inspection_id,
      request_id: appointment.request_id
    }, locals.supabase);
    
    // Create defaults...
  } catch (createError: any) {
    if (createError.message && createError.message.includes('duplicate key')) {
      console.log('Race condition detected, fetching existing...');
      await new Promise(resolve => setTimeout(resolve, 500));
      assessment = await assessmentService.getAssessmentByAppointment(appointmentId, locals.supabase);
      if (!assessment) throw error(500, 'Failed to create or fetch assessment');
    } else {
      throw error(500, `Failed to create assessment: ${createError.message}`);
    }
  }
}
````
</augment_code_snippet>

---

## ✅ **Verification Checklist**

After implementing the pattern:

- [ ] Service method has retry logic with exponential backoff
- [ ] Duplicate key errors (23505) are detected and handled
- [ ] Console logging shows retry attempts
- [ ] Page server has error handling for race conditions
- [ ] Test: Double-click action button - no error shown
- [ ] Test: Rapid page refresh - entity loads correctly
- [ ] Test: Multiple simultaneous users - all succeed
- [ ] Audit logs show successful creation

---

## 🔮 **Alternative Solutions**

### **Option 1: Database Sequence (Best Long-term)**

**Pros:**
- ✅ Truly atomic (no race conditions)
- ✅ Best performance
- ✅ Industry standard

**Cons:**
- ⚠️ Requires database migration
- ⚠️ Numbers may have gaps if transactions rollback

**Implementation:**
```sql
CREATE SEQUENCE entity_number_seq START 1;

CREATE FUNCTION generate_entity_number() RETURNS TEXT AS $$
DECLARE
  year TEXT := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  seq_num INTEGER := nextval('entity_number_seq');
BEGIN
  RETURN 'PREFIX-' || year || '-' || LPAD(seq_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

ALTER TABLE entities 
ALTER COLUMN entity_number 
SET DEFAULT generate_entity_number();
```

### **Option 2: UUID-based Numbers**

**Pros:**
- ✅ No collisions possible
- ✅ No database changes needed

**Cons:**
- ⚠️ Not human-readable
- ⚠️ Not sequential

---

## 📚 **Related Documentation**

- [Database Schema](../System/database_schema.md) - Unique constraints
- [Service Patterns](../../.claude/skills/claimtech-development/resources/service-patterns.md) - ServiceClient injection
- [Task: Fix Assessment Race Condition](../Tasks/active/fix_assessment_race_condition.md) - Implementation details

---

## 🚨 **Frontend Prevention Strategies** (NEW)

### **Critical: Prevent Double-Click at UI Level**

**Why frontend prevention is essential:**
- Backend retry logic only handles the race condition AFTER it occurs
- Frontend prevention **eliminates** most race conditions before they reach the backend
- Prevents premature status updates that cause data inconsistencies

### **Pattern 1: Double-Click Prevention**

```typescript
// ✅ CORRECT: Prevent duplicate clicks at UI level
let startingEntity = $state<string | null>(null);

async function handleStartEntity(entityId: string) {
    // Prevent double-click
    if (startingEntity === entityId) {
        console.log('Entity already being started, ignoring duplicate click');
        return;
    }

    startingEntity = entityId;
    try {
        // Navigate or perform action
        goto(`/entity/${entityId}`);
    } catch (error) {
        console.error('Error starting entity:', error);
        alert('Failed to start entity. Please try again.');
    } finally {
        // Reset after delay to allow retry if needed
        setTimeout(() => {
            startingEntity = null;
        }, 1000);
    }
}
```

**UI Button State:**
```svelte
<Button
    onclick={() => handleStartEntity(entity.id)}
    disabled={startingEntity === entity.id}
>
    {startingEntity === entity.id ? 'Starting...' : 'Start Entity'}
</Button>
```

### **Pattern 2: Correct Status Update Timing**

**❌ WRONG - Status updated BEFORE creation confirmed:**
```typescript
async function handleStartAssessment(appointmentId: string) {
    // PROBLEM: Status updated immediately
    await appointmentService.updateAppointmentStatus(appointmentId, 'in_progress');
    goto(`/assessments/${appointmentId}`); // If this fails, status is stuck
}
```

**✅ CORRECT - Status updated AFTER creation succeeds:**
```typescript
// Frontend: Just navigate, don't update status
async function handleStartAssessment(appointmentId: string) {
    if (startingAssessment === appointmentId) return;
    startingAssessment = appointmentId;
    goto(`/assessments/${appointmentId}`);
}

// Backend (+page.server.ts): Update status AFTER successful creation
if (!assessment) {
    assessment = await assessmentService.createAssessment({...}, locals.supabase);
    // ✅ Only update status after successful creation
    await appointmentService.updateAppointmentStatus(appointmentId, 'in_progress', locals.supabase);
}
```

**Why this matters:**
- If assessment creation fails, appointment remains `scheduled` (visible in list)
- User can retry without confusion
- No orphaned records (status=in_progress but no entity)

---

## 🎯 **Key Takeaways**

1. **Count-then-insert is NOT atomic** - Race conditions are possible
2. **Retry with exponential backoff** - Handles collisions gracefully (backend)
3. **Detect error code 23505** - Duplicate key constraint violation
4. **Add page-level error handling** - Fetch existing entity on race condition
5. **Log retry attempts** - Helps with debugging
6. **🆕 Prevent double-clicks at frontend** - Loading states and debounce (frontend)
7. **🆕 Update status AFTER creation** - Prevents orphaned records (critical)
8. **Consider database sequences** - Best long-term solution for high-traffic scenarios

---

## 🛡️ **Defense in Depth**

Implement **three layers of protection**:

1. **Layer 1: Frontend Prevention** (Reduces probability by 90%)
   - Double-click prevention
   - Loading states
   - Disable buttons during action

2. **Layer 2: Correct Timing** (Prevents data corruption)
   - Status updates AFTER creation succeeds
   - Transactional consistency
   - Rollback safety

3. **Layer 3: Backend Recovery** (Handles remaining edge cases)
   - Retry logic with exponential backoff
   - Extended wait times
   - Polling for race condition recovery

---

**Remember:** This pattern is now standard for ALL sequential number generation in ClaimTech. Apply **all three layers** consistently across all services.

