# Svelte 5 Hydration Error Fix - Complete Analysis

## 🔴 Error Summary

**Error Message:**
```
GET http://localhost:5173/work/assessments/()%20=%3E%20%7Bconst%20url%20=%20displayUrl%20??%20value;...} 500 (Internal Server Error)

[svelte] hydration_attribute_changed
The `src` attribute on `<img>` changed its value between server and client renders.
Server value: src="() => {const url = displayUrl ?? value;...}"
Client value: src="() => {const url = $.get(displayUrl) ?? $.get(value);...}"
```

---

## 🎯 Root Cause

**Location:** `src/lib/components/forms/PhotoUpload.svelte` lines 55-60

**The Problem:**
```typescript
// ❌ WRONG - Creates a derived FUNCTION, not a value
const currentPhotoUrl = $derived(() => {
    const url = displayUrl ?? value;
    if (!url) return null;
    return storageService.toPhotoProxyUrl(url);
});
```

When `$derived(() => {...})` is used:
1. It creates a derived value that **IS a function**
2. When passed to `src={currentPhotoUrl}`, the function itself is stringified
3. Server renders: `src="() => {const url = displayUrl ?? value;...}"`
4. Client tries to use Svelte 5 runes: `src="() => {const url = $.get(displayUrl) ?? $.get(value);...}"`
5. **Hydration mismatch!** → 500 error

---

## ✅ Solution Applied

**Changed to:** `$derived.by(() => {...})`

```typescript
// ✅ CORRECT - Creates a derived VALUE by calling the function
const currentPhotoUrl = $derived.by(() => {
    const url = displayUrl ?? value;
    if (!url) return null;
    return storageService.toPhotoProxyUrl(url);
});
```

**Key Difference:**
- `$derived(() => {...})` → Creates a derived **FUNCTION**
- `$derived.by(() => {...})` → Creates a derived **VALUE** (calls function and returns result)
- `$derived(expression)` → Creates a derived **VALUE** from expression

---

## 📝 Svelte 5 Best Practices

### Passing Reactive State to Functions

From Svelte 5 documentation:

> When you reference something declared with the `$state` rune, you're accessing its _current value_. If you want to pass reactive state to a function, you need to pass a **function** that returns the value, not the value itself.

**Example:**
```typescript
// ❌ WRONG - Passing reactive value directly
let count = $state(0);
await someService.save(count); // Passes the value, not reactive

// ✅ CORRECT - Pass function for reactivity
let count = $state(0);
await someService.save(() => count); // Passes reactive reference
```

### Derived Values

**Pattern 1: Simple Expression**
```typescript
const doubled = $derived(count * 2);
```

**Pattern 2: Complex Logic**
```typescript
const result = $derived.by(() => {
    // Complex computation
    return expensiveCalculation();
});
```

---

## 🔧 Files Modified

### ✅ FIXED
- `src/lib/components/forms/PhotoUpload.svelte` (Line 56)
  - Changed `$derived(() => {...})` to `$derived.by(() => {...})`

### 🔴 STILL NEED FIXING

1. **Assessment Page Server Load** (`src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts`)
   - Lines 81-95: Missing `locals.supabase` parameter on 11 service calls
   - Lines 111-118: Photo services missing client parameter

2. **Photo Services** 
   - `src/lib/services/estimate-photos.service.ts` - Missing client parameter
   - `src/lib/services/pre-incident-estimate-photos.service.ts` - Missing client parameter

3. **Photos ZIP Endpoint** (`src/routes/api/generate-photos-zip/+server.ts`)
   - Lines 114-313: Using public URLs for private bucket (400 errors)
   - Need to use authenticated download pattern

---

## 📋 Next Steps

1. **Fix Assessment Page Server Load** - Add `locals.supabase` to all service calls
2. **Refactor Photo Services** - Add client parameter support
3. **Fix Photos ZIP Endpoint** - Use authenticated download
4. **Test Complete Workflow** - Verify all photos load and download correctly

---

## 🧪 Testing Checklist

- [ ] Create new assessment from appointment
- [ ] Verify no photos appear on fresh assessment
- [ ] Upload photos to each tab
- [ ] Generate photos PDF - verify it works
- [ ] Generate photos ZIP - verify all photos download
- [ ] Complete assessment and finalize
- [ ] Verify all documents generate and download correctly


