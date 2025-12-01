# Loading Indicators - Comparison & Recommendations

**Date:** November 23, 2025

---

## Current vs Proposed

### Current State
| Feature | Status | Issue |
|---------|--------|-------|
| Global nav bar | ✅ Exists | Too subtle, easily missed |
| Tab loading | ✅ Implemented | Too fast due to prefetching |
| Sidebar loading | ❌ Missing | No feedback when clicking links |
| Spinner component | ❌ Missing | Not installed from shadcn-svelte |

---

## Three Implementation Options

### Option 1: Modal Overlay (RECOMMENDED)
**What:** Full-screen modal with centered spinner  
**When:** All page navigations  
**Visibility:** ⭐⭐⭐⭐⭐ (Very visible)  
**Intrusiveness:** ⭐⭐⭐⭐ (Blocks interaction)  
**Code complexity:** ⭐⭐ (Simple)

**Pros:**
- Very visible - users always see it
- Professional appearance
- Works with fast/slow networks
- Prevents accidental double-clicks
- Clear feedback

**Cons:**
- Blocks interaction during loading
- May feel heavy for fast navigations
- Requires modal component

**Best for:** Critical workflows, slow networks

---

### Option 2: Sidebar Button Loading
**What:** Spinner on active sidebar item  
**When:** Sidebar link clicks  
**Visibility:** ⭐⭐⭐ (Visible if looking)  
**Intrusiveness:** ⭐⭐ (Subtle)  
**Code complexity:** ⭐⭐⭐ (Moderate)

**Pros:**
- Shows which page is loading
- Doesn't block interaction
- Subtle but effective
- Good for fast navigation

**Cons:**
- Users might miss it
- Requires tracking which link is loading
- Doesn't work for breadcrumb/other navigation

**Best for:** Secondary navigation, fast networks

---

### Option 3: Hybrid Approach (BEST)
**What:** Modal for slow (>500ms), sidebar spinner for fast  
**When:** All navigations  
**Visibility:** ⭐⭐⭐⭐⭐ (Always visible)  
**Intrusiveness:** ⭐⭐⭐ (Adaptive)  
**Code complexity:** ⭐⭐⭐⭐ (Complex)

**Pros:**
- Adapts to network speed
- Professional for slow loads
- Subtle for fast loads
- Best UX overall

**Cons:**
- More complex implementation
- Requires timing logic
- More state management

**Best for:** Production apps, all network speeds

---

## Recommendation

### For ClaimTech: **Option 1 (Modal) + Optional Option 2 (Sidebar)**

**Phase 1 (Immediate):**
1. Install spinner component
2. Create NavigationLoadingModal
3. Add to root layout
4. Test on all sidebar links

**Phase 2 (Optional):**
1. Add sidebar button loading state
2. Track which link is being clicked
3. Show spinner on active item
4. Combine with modal for best UX

---

## Implementation Checklist

### Phase 1: Modal Loading
- [ ] Install spinner: `npx shadcn-svelte@latest add spinner`
- [ ] Create `NavigationLoadingModal.svelte`
- [ ] Add to `src/routes/+layout.svelte`
- [ ] Test on all 15 sidebar links
- [ ] Verify modal appears/disappears correctly
- [ ] Check accessibility (aria-busy, role="status")

### Phase 2: Sidebar Loading (Optional)
- [ ] Create `useNavigationLoading()` utility
- [ ] Track active navigation link
- [ ] Add spinner to SidebarMenuButton
- [ ] Disable other links during loading
- [ ] Test double-click prevention

### Phase 3: Polish
- [ ] Add loading message ("Loading...")
- [ ] Customize spinner color (rose-500)
- [ ] Add fade-in/fade-out animations
- [ ] Test on slow network (DevTools throttle)
- [ ] Update documentation

---

## Code Locations

### Files to Create
1. `src/lib/components/ui/spinner/` - Install via CLI
2. `src/lib/components/layout/NavigationLoadingModal.svelte` - New modal
3. `.agent/Tasks/active/NAVIGATION_LOADING_IMPLEMENTATION_PDR.md` - Design doc

### Files to Modify
1. `src/routes/+layout.svelte` - Add modal component
2. `src/lib/components/layout/Sidebar.svelte` - Optional: add loading state
3. `src/lib/utils/useNavigationLoading.svelte.ts` - Optional: enhance utility

---

## Styling (Rose Theme)

```css
/* Modal overlay */
bg-black/20 backdrop-blur-sm

/* Modal card */
bg-white rounded-lg shadow-lg p-8

/* Spinner */
size-8 text-rose-500 animate-spin

/* Loading text */
text-sm font-medium text-gray-700
```

---

## Testing Strategy

1. **Visual Testing**
   - Click each sidebar link
   - Verify modal appears
   - Verify modal disappears when page loads

2. **Network Testing**
   - DevTools → Network → Slow 3G
   - Verify modal stays visible during slow load
   - Verify modal dismisses when complete

3. **Accessibility Testing**
   - Screen reader announces "Loading"
   - Modal has proper ARIA attributes
   - Keyboard navigation works

4. **Performance Testing**
   - No layout shift
   - Smooth animations
   - No memory leaks

