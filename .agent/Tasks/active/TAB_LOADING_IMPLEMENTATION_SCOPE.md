# Tab Loading States - Implementation Scope

**Date**: November 23, 2025
**Status**: Ready for Implementation
**Priority**: HIGH (UX improvement across all tab-based pages)

---

## Pages Requiring Tab Loading Indicators

### TIER 1: Critical (Assessment Detail)
**File**: `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte`
- **Tabs**: 10+ (Summary, Vehicle ID, 360°, Interior, Tyres, Damage, Values, Pre-Incident, Estimate, Finalize, Additionals, FRC, Audit)
- **Tab Change Duration**: 500ms - 2s (auto-save + DB operations)
- **Current Issue**: No loading feedback during tab switch
- **Impact**: HIGH - Users spend most time here
- **Component**: `AssessmentLayout.svelte`

### TIER 2: Secondary (List/Filter Pages)
1. **Requests Page** - `src/routes/(app)/requests/+page.svelte`
   - Tabs: Status filter (All, Submitted, Draft)
   - Duration: <200ms (filter only)
   - Impact: MEDIUM

2. **Additionals Page** - `src/routes/(app)/work/additionals/+page.svelte`
   - Tabs: Filter (All, Pending, Approved, Declined)
   - Duration: <200ms (filter only)
   - Impact: MEDIUM

3. **FRC Page** - `src/routes/(app)/work/frc/+page.svelte`
   - Tabs: Status (All, Not Started, In Progress, Completed)
   - Duration: <200ms (filter only)
   - Impact: MEDIUM

4. **Appointments Page** - `src/routes/(app)/work/appointments/+page.svelte`
   - Tabs: Type filter (All, In Person, Digital)
   - Duration: <200ms (filter only)
   - Impact: MEDIUM

5. **Archive Page** - `src/routes/(app)/work/archive/+page.svelte`
   - Tabs: Type filter (All, Inspections, Assessments, etc.)
   - Duration: <200ms (filter only)
   - Impact: MEDIUM

---

## Components to Create

### 1. TabLoadingIndicator.svelte
- **Path**: `src/lib/components/ui/tab-loading/TabLoadingIndicator.svelte`
- **Purpose**: Inline spinner on active tab
- **Props**: `isLoading`, `icon`, `class`
- **Size**: ~30 lines

### 2. TabContentLoader.svelte
- **Path**: `src/lib/components/ui/tab-loading/TabContentLoader.svelte`
- **Purpose**: Loading overlay for tab content
- **Props**: `loading`, `message`, `class`
- **Size**: ~40 lines

### 3. TabProgressBar.svelte
- **Path**: `src/lib/components/ui/tab-loading/TabProgressBar.svelte`
- **Purpose**: Progress bar below tabs
- **Props**: `loading`, `class`
- **Size**: ~25 lines

---

## Components to Modify

### 1. AssessmentLayout.svelte
- **Lines**: 238-260 (Tabs section)
- **Changes**:
  - Accept `tabLoading` prop
  - Add loading indicator to active tab
  - Disable tab clicks during loading
  - Show loading overlay or progress bar

### 2. +page.svelte (Assessment Detail)
- **Lines**: 75-97 (`handleTabChange` function)
- **Changes**:
  - Add `tabLoading` state
  - Set to true at start, false at end
  - Pass to `AssessmentLayout`

### 3. List Pages (5 pages)
- **Changes**: Optional - add subtle loading for filter tabs
- **Approach**: Disable tab clicks during filter update

---

## Styling & Theme

### Rose Theme Integration
- **Active Tab**: `bg-rose-500 text-white`
- **Loading Spinner**: `text-rose-500`
- **Overlay**: `bg-white/50 backdrop-blur-sm`
- **Progress Bar**: `bg-rose-500`

### Responsive Design
- **Mobile**: Hide tab labels, show icons only
- **Tablet**: Show abbreviated labels
- **Desktop**: Full labels

---

## Recommended Implementation Order

1. **Create TabLoadingIndicator.svelte** (simplest)
2. **Create TabContentLoader.svelte** (most visible)
3. **Create TabProgressBar.svelte** (optional)
4. **Update AssessmentLayout.svelte** (integrate indicator)
5. **Update Assessment +page.svelte** (add state management)
6. **Test on all pages** (verify UX)
7. **Update documentation** (add Pattern 6 to ui_loading_patterns.md)

---

## Success Criteria

- [ ] Tab click shows loading indicator immediately
- [ ] Indicator disappears when tab content loads
- [ ] No visual jank or flashing
- [ ] Works on all 10+ assessment tabs
- [ ] Works on all 5 filter pages
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Accessibility compliant (aria-busy, role="status")
- [ ] No performance regression

---

## Documentation Updates

### Files to Update
1. `.agent/System/ui_loading_patterns.md` - Add Pattern 6
2. `.agent/README/system_docs.md` - Add tab loading section
3. `.agent/README/changelog.md` - Add entry

### New Documentation
1. `.agent/System/tab_loading_states_technical_reference.md` ✅
2. `.agent/System/tab_loading_component_patterns.md` ✅
3. `.agent/Tasks/active/TAB_LOADING_CONTEXT_ANALYSIS.md` ✅

---

## Estimated Effort

- Component creation: 2-3 hours
- Integration: 1-2 hours
- Testing: 1-2 hours
- Documentation: 30 minutes
- **Total**: 4-7 hours

