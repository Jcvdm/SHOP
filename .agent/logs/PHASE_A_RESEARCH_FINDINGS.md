# Phase A: Research & Catalog Problem Sites - FINDINGS

## Summary
Found **7 files** with **12 problematic patterns** involving nested `.then()` chains and fake Supabase responses that cause Promise.all type mismatches.

## Files Affected

### 1. src/routes/api/generate-estimate/+server.ts
- **Lines 70-81**: Client-from-request nested pattern
  - `.then(({ data }) => data ? locals.supabase.from('clients')... : Promise.resolve({ data: null, error: null }))`
  - Fallback: `Promise.resolve({ data: null, error: null })`
- **Pattern**: Inside Promise.all, trying to fetch client from request

### 2. src/routes/api/generate-additionals-letter/+server.ts
- **Lines 44-51**: Client-from-request nested pattern
  - `.then(({ data }) => (data ? locals.supabase.from('clients')... : Promise.resolve({ data: null, error: null })))`
  - Fallback: `Promise.resolve({ data: null, error: null })`

### 3. src/routes/api/generate-report/+server.ts
- **Lines 140-150**: Client-from-request nested pattern
  - `.then(({ data }) => data ? locals.supabase.from('clients')... : Promise.resolve({ data: null, error: null }))`
  - Fallback: `Promise.resolve({ data: null, error: null })`
- **Lines 153-157**: Repairer-from-estimate nested pattern
  - `.then(({ data }) => data?.repairer_id ? locals.supabase.from('repairers')... : Promise.resolve({ data: null, error: null }))`
  - Fallback: `Promise.resolve({ data: null, error: null })`

### 4. src/routes/api/generate-frc-report/+server.ts
- **Lines 91-102**: Client-from-request nested pattern
  - `.then(({ data }) => data ? locals.supabase.from('clients')... : { data: null, error: null })`
  - Fallback: `Promise.resolve({ data: null, error: null })`

### 5. src/routes/(app)/print/estimate/[id]/+page.server.ts
- **Lines 35-46**: Client-from-request nested pattern
  - `.then(({ data }) => data ? locals.supabase.from('clients')... : Promise.resolve({ data: null, error: null }))`
  - Fallback: `Promise.resolve({ data: null, error: null })`

### 6. src/routes/(app)/print/report/[id]/+page.server.ts
- **Lines 69-80**: Client-from-request nested pattern
  - `.then(({ data }) => data ? locals.supabase.from('clients')... : Promise.resolve({ data: null, error: null }))`
  - Fallback: `Promise.resolve({ data: null, error: null })`

### 7. src/routes/(app)/print/frc/[id]/+page.server.ts
- **Lines 37-48**: Client-from-request nested pattern
  - `.then(({ data }) => data ? locals.supabase.from('clients')... : Promise.resolve({ data: null, error: null }))`
  - Fallback: `Promise.resolve({ data: null, error: null })`

## Pattern Analysis

### Pattern 1: Client-from-Request (6 occurrences)
```typescript
assessment.request_id
  ? locals.supabase
      .from('requests')
      .select('client_id')
      .eq('id', assessment.request_id)
      .single()
      .then(({ data }) =>
        data
          ? locals.supabase.from('clients').select('*').eq('id', data.client_id).single()
          : Promise.resolve({ data: null, error: null })
      )
  : Promise.resolve({ data: null, error: null })
```

### Pattern 2: Repairer-from-Estimate (1 occurrence in generate-report)
```typescript
locals.supabase.from('assessment_estimates').select('repairer_id').eq('assessment_id', assessmentId).single()
  .then(({ data }) =>
    data?.repairer_id
      ? locals.supabase.from('repairers').select('*').eq('id', data.repairer_id).single()
      : Promise.resolve({ data: null, error: null })
  )
```

## Type Issue
All these patterns are inside `Promise.all([...])` where TypeScript expects all elements to be `PostgrestSingleResponse<T>` or compatible types. The fake `Promise.resolve({ data: null, error: null })` objects don't match the full `PostgrestResponseFailure` type (missing count, status, statusText).

## Solution Strategy
1. Create helper functions that return consistent `{ data: T | null; error: PostgrestError | null }` shape
2. Move these helpers outside Promise.all
3. Call helpers sequentially after Promise.all destructuring
4. This removes type incompatibility and improves code clarity

