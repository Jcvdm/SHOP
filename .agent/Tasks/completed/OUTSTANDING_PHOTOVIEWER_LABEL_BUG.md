# Outstanding Issue: PhotoViewer Label Not Updating

**Date**: November 9, 2025
**Status**: ❌ UNRESOLVED
**Priority**: High (user-facing bug)

---

## Issue Description

**Bug**: On the estimate tab, when viewing photos in the PhotoViewer component and navigating to the next photo (using arrow keys or navigation buttons), the label displayed at the bottom does not update to show the current photo's label.

**Symptoms**:
- Photo counter updates correctly (e.g., "2 / 5")
- Photo image changes correctly
- Label text remains stuck on first photo's label
- Navigation tracking is working (proven by counter updating)

**Location**: `src/lib/components/photo-viewer/PhotoViewer.svelte`

---

## Investigation Summary

### Root Cause Hypothesis
Svelte 5 `$derived` reactivity issue with nested object properties (`currentPhoto.label`)

### Evidence
- Photo counter (`{currentIndex + 1} / {props.photos.length}`) updates correctly ✅
- Navigation tracking logs show correct photo IDs ✅
- Component IS re-rendering ✅
- But label text does NOT update ❌

**Key Code** (Lines 34-35):
```typescript
const currentPhoto = $derived(props.photos[currentIndex]);
// Template uses: {currentPhoto.label || 'No description (click to add)'}
```

---

## Attempted Fix #1 (FAILED)

**Date**: November 9, 2025
**Approach**: Separate derived value for label
**Implementation**:
```typescript
const currentLabel = $derived(currentPhoto?.label || 'No description (click to add)');
// Template: {currentLabel}
```

**Expected**: Explicit derived value would force reactivity tracking
**Actual**: Did not fix the issue
**Status**: ❌ FAILED - Reverted changes

**Research Document**: `.agent/Tasks/active/photoviewer_label_fix_research.md`

**Why It Failed**:
- The approach was based on Svelte 5 best practices
- Research scored it 9.7/10 as recommended solution
- However, in practice it did not resolve the reactivity issue
- Suggests the problem may be deeper than simple derived tracking

---

## Alternative Approaches to Try

### Option 2: Direct Array Access in Template
**Not Yet Attempted**

```svelte
<!-- Instead of using currentPhoto -->
{props.photos[currentIndex]?.label || 'No description (click to add)'}
```

**Rationale**: Bypass derived value entirely, access array directly in template
**Pros**: Forces Svelte to track both `props.photos` and `currentIndex` reactivity
**Cons**: Less clean, duplicates logic

---

### Option 3: Effect-Based Update
**Not Yet Attempted**

```typescript
let currentLabel = $state('No description (click to add)');

$effect(() => {
    currentLabel = props.photos[currentIndex]?.label || 'No description (click to add)';
});
```

**Rationale**: Explicit effect tracks currentIndex changes
**Pros**: Guaranteed to run on currentIndex change
**Cons**: Anti-pattern in Svelte 5, less efficient than derived

---

### Option 4: Key Block Force Re-render
**Not Yet Attempted**

```svelte
{#key currentIndex}
    <button class="photo-description">
        {currentPhoto.label || 'No description (click to add)'}
    </button>
{/key}
```

**Rationale**: Force complete re-render of label button on index change
**Pros**: Guaranteed to update
**Cons**: Poor performance, destroys and recreates DOM

---

### Option 5: Reactive Statement (Svelte 4 Style)
**Not Yet Attempted**

```typescript
$: currentLabel = props.photos[currentIndex]?.label || 'No description (click to add)';
```

**Rationale**: Use Svelte 4 reactive statement syntax
**Pros**: Simple, well-understood pattern
**Cons**: Mixing Svelte 4 and Svelte 5 patterns

---

## Debugging Steps Needed

1. **Add Console Logging**:
   ```typescript
   $effect(() => {
       console.log('[PhotoViewer] currentIndex changed:', currentIndex);
       console.log('[PhotoViewer] currentPhoto:', currentPhoto);
       console.log('[PhotoViewer] currentPhoto.label:', currentPhoto?.label);
   });
   ```

2. **Verify Props Reactivity**:
   - Check if `props.photos` array is stable or changes reference
   - Verify photos have different labels in test data

3. **Test in Isolation**:
   - Create minimal reproduction case
   - Test if issue is specific to PhotoViewer context
   - Check if bigger-picture library interferes with reactivity

4. **Check Svelte Version**:
   - Verify Svelte 5 version in package.json
   - Check for known reactivity bugs in that version
   - Consider upgrading to latest Svelte 5.x

---

## Related Files

**Component**: `src/lib/components/photo-viewer/PhotoViewer.svelte`
**Parent**: `src/lib/components/assessment/EstimatePhotosPanel.svelte`
**Service**: `src/lib/services/estimate-photos.service.ts`

**Documentation**:
- `.agent/System/photo_labeling_implementation_nov_6_2025.md`
- `.agent/SOP/photo_labeling_patterns.md`
- `.claude/skills/photo-component-development/SKILL.md`

**Recent Related Commit**: `294b36d` - Fixed navigation tracking (which IS working)

---

## Next Steps

### Priority 1: Try Alternative Approaches
1. Try Option 2 (direct array access) - simplest alternative
2. If that fails, try Option 5 (reactive statement) - proven pattern
3. If that fails, try Option 3 (effect-based) - guaranteed to work

### Priority 2: Deeper Investigation
1. Add comprehensive console logging
2. Test with minimal reproduction
3. Check for library conflicts (bigger-picture)
4. Review Svelte 5 migration guide for gotchas

### Priority 3: Get External Help
1. Post minimal reproduction to Svelte Discord
2. Search Svelte GitHub issues for similar problems
3. Consider consulting Svelte 5 experts

---

## Impact

**User Impact**: High - users cannot see photo labels change when navigating
**Workaround**: Close and reopen photo viewer on each photo (very poor UX)
**Data Impact**: None - data is correct, only display issue
**Frequency**: Every time user navigates between photos

---

## Status

- [x] Bug identified and reproduced
- [x] Research completed (see photoviewer_label_fix_research.md)
- [x] Fix attempt #1 made and tested
- [ ] Fix attempt #1 failed - reverted
- [ ] Alternative approaches to try (4 options listed above)
- [ ] Final fix implemented and verified
- [ ] Documentation updated
- [ ] Code committed

**Current Status**: OUTSTANDING - Needs alternative fix approach

---

**Last Updated**: November 9, 2025
**Owner**: Development Team
**Next Action**: Try Option 2 (direct array access in template)
