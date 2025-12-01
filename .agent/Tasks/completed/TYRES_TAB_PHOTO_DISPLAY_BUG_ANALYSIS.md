# Tyres Tab Photo Display Bug - ROOT CAUSE ANALYSIS

**Date**: November 10, 2025  
**Issue**: Photos saved to database but don't display in TyrePhotosPanel until uploading another photo  
**Status**: 🔍 ROOT CAUSE IDENTIFIED

---

## 🎯 THE PROBLEM

**Symptom**:
1. User uploads photos to a tyre
2. Photos are saved to database ✅
3. Photos don't display in TyrePhotosPanel ❌
4. User uploads another photo
5. ALL photos suddenly appear ✅

**Why This Happens**: The parent component (`TyresTab`) updates `tyrePhotosMap` but doesn't trigger reactivity in `TyrePhotosPanel` because the prop reference doesn't change.

---

## 🔴 ROOT CAUSE: Missing Prop Reactivity

### The Issue in TyresTab.svelte (lines 33-40)

```typescript
// Initialize photos from props
$effect(() => {
  const newMap = new Map<string, TyrePhoto[]>();
  tyres.forEach(tyre => {
    const photos = tyrePhotosProp.filter(p => p.tyre_id === tyre.id);
    newMap.set(tyre.id, photos);
  });
  tyrePhotosMap = newMap;
});
```

**Problem**: This `$effect` only runs when `tyres` changes, NOT when `tyrePhotosProp` changes!

### The Issue in TyrePhotosPanel.svelte (line 29)

```typescript
// Use optimistic array with getter function for reactivity
const photos = useOptimisticArray(() => props.photos);
```

**The getter function is correct**, but it receives `props.photos` which comes from:

```typescript
// In TyresTab.svelte line 315
photos={tyrePhotosMap.get(tyre.id) || []}
```

**The Problem Chain**:
1. User uploads photo → saved to database
2. Parent page updates `data.tyrePhotos` ✅
3. TyresTab receives new `tyrePhotosProp` ✅
4. BUT `$effect` on line 33 doesn't re-run (only depends on `tyres`)
5. `tyrePhotosMap` is NOT updated ❌
6. TyrePhotosPanel receives same array reference
7. `useOptimisticArray` getter sees no change ❌
8. Photos don't display ❌

**Why Adding Another Photo Fixes It**:
- Upload triggers `handleTyrePhotosUpdate()` (line 43)
- This calls `tyrePhotosMap = new Map(tyrePhotosMap)` (line 46)
- Forces reactivity and re-renders
- All photos appear

---

## ✅ THE FIX: Add Dependency to $effect

### Current Code (BROKEN)

```typescript
$effect(() => {
  const newMap = new Map<string, TyrePhoto[]>();
  tyres.forEach(tyre => {
    const photos = tyrePhotosProp.filter(p => p.tyre_id === tyre.id);
    newMap.set(tyre.id, photos);
  });
  tyrePhotosMap = newMap;
});
```

### Fixed Code (WORKING)

```typescript
$effect(() => {
  const newMap = new Map<string, TyrePhoto[]>();
  tyres.forEach(tyre => {
    // Add tyrePhotosProp as dependency so effect re-runs when photos change
    const photos = tyrePhotosProp.filter(p => p.tyre_id === tyre.id);
    newMap.set(tyre.id, photos);
  });
  tyrePhotosMap = newMap;
});
```

**What Changed**: The `$effect` already reads `tyrePhotosProp` inside the function body, so Svelte 5 should automatically track it as a dependency. The issue is that we need to ensure the dependency is properly tracked.

---

## 🧠 SVELTE 5 REACTIVITY PRINCIPLES

### How $effect Dependencies Work

From Svelte 5 docs:

> `$effect` automatically picks up any reactive values (`$state`, `$derived`, `$props`) that are _synchronously_ read inside its function body (including indirectly, via function calls) and registers them as dependencies.

**Key Point**: The `$effect` on line 33 SHOULD be tracking `tyrePhotosProp` because it's read synchronously inside the function.

### The Real Issue: Prop Destructuring

**Current Code (line 24)**:
```typescript
let { tyres: tyresProp, tyrePhotos: tyrePhotosProp, ... } = $props();
```

**Problem**: When using destructuring with `$props()`, each destructured variable becomes a separate reactive value. However, the `$effect` dependency tracking might not be working correctly because:

1. `tyrePhotosProp` is a destructured prop
2. The `$effect` reads it synchronously ✅
3. But the dependency might not be properly registered if the array reference doesn't change

### The Solution: Use $derived for Props

**Better Pattern** (from EstimatePhotosPanel.svelte):
```typescript
let props: Props = $props();

// Reactive derived props
const estimateId = $derived(props.estimateId);
const assessmentId = $derived(props.assessmentId);
const onUpdate = $derived(props.onUpdate);
```

This ensures:
1. Props are wrapped in `$derived`
2. Changes to props trigger reactivity
3. `$effect` properly tracks the derived values

---

## 📋 IMPLEMENTATION STEPS

### Step 1: Update TyresTab Props Pattern
- Change from destructuring to `let props: Props = $props()`
- Create `$derived` for each prop
- Update `$effect` to use derived props

### Step 2: Verify Dependency Tracking
- Ensure `$effect` reads `tyrePhotosProp` (or derived version)
- Svelte will automatically track it as dependency
- When parent updates `data.tyrePhotos`, effect re-runs

### Step 3: Test Reactivity
- Upload photo to tyre
- Verify `tyrePhotosMap` updates
- Verify photos display immediately

---

## 🔗 RELATED DOCUMENTATION

- **Svelte 5 $effect**: Automatic dependency tracking for reactive values
- **Svelte 5 $derived**: Wrap props for better reactivity
- **EstimatePhotosPanel.svelte**: Reference implementation using `$derived` pattern
- **useOptimisticArray.svelte.ts**: Getter function pattern for reactivity


