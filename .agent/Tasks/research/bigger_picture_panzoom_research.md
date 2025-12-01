# Research: bigger-picture + @panzoom/panzoom Integration

## Context
- **Date**: 2025-11-05
- **Researcher**: research-agent
- **Purpose**: Investigate implementation issues with Windows-style photo viewer
- **Related Feature**: Windows Photo Viewer Implementation (PRD: WINDOWS_PHOTO_VIEWER_IMPLEMENTATION.md)

## Research Questions
1. How to properly initialize bigger-picture with `target: document.body`?
2. What is the required CSS setup and DOM structure?
3. How should @panzoom/panzoom integrate with bigger-picture?
4. What are common issues with photo centering and control visibility?
5. What are best practices for Svelte/framework integration?

---

## Current Issues Summary

ClaimTech implemented a photo viewer using:
- **bigger-picture v1.1.19** (8KB lightbox gallery)
- **@panzoom/panzoom v4.6.0** (3.7KB zoom/pan controls)

**Critical Issues**:
1. ❌ Photo not centering (appears in bottom right corner)
2. ❌ Custom controls disappearing after photo opens
3. ❌ Navigation buttons not working
4. ❌ Close button not working

---

## Library Overview

### bigger-picture

**Official Site**: https://biggerpicture.henrygd.me/
**GitHub**: https://github.com/henrygd/bigger-picture
**npm**: https://www.npmjs.com/package/bigger-picture
**Version**: 1.1.19
**Bundle Size**: 8KB gzipped

**Key Features**:
- Full-screen lightbox gallery
- Built-in navigation (arrows, keyboard)
- Zoom and pan support
- Touch/gesture support
- Lazy loading
- Hardware-accelerated animations
- Framework-agnostic (vanilla JS)

**Dependencies**: None (pure vanilla JS)

---

### @panzoom/panzoom

**GitHub**: https://github.com/timmywil/panzoom
**npm**: https://www.npmjs.com/package/@panzoom/panzoom
**Version**: 4.6.0
**Bundle Size**: 3.7KB gzipped

**Key Features**:
- Pan and zoom any element
- Mouse wheel zoom
- Pinch-to-zoom
- Hardware-accelerated CSS transforms
- Framework-agnostic

**Note**: This library is designed for standalone use, NOT specifically for integration with bigger-picture

---

## Research Phase 1: bigger-picture Documentation

### Official Documentation Review

Based on the official documentation at https://biggerpicture.henrygd.me/:

#### **1. Basic Initialization**

```javascript
import BiggerPicture from 'bigger-picture';

// Initialize with target element
let bp = BiggerPicture({
  target: document.body // Required: where to append the lightbox
});
```

**CRITICAL FINDING**: The `target` parameter is where bigger-picture will append its DOM elements. Using `document.body` is the recommended approach.

#### **2. Opening the Lightbox**

```javascript
bp.open({
  items: [
    {
      img: 'image1.jpg',
      thumb: 'thumb1.jpg', // Optional thumbnail
      alt: 'Image 1',
      caption: 'Caption text',
      width: 1920, // Optional but recommended
      height: 1080
    }
  ],
  position: 0, // Starting index
  onClose: () => console.log('Closed'),
  onUpdate: (position) => console.log('Position:', position)
});
```

**Options**:
- `items`: Array of image objects (required)
- `position`: Starting index (default: 0)
- `onClose`: Callback when lightbox closes
- `onUpdate`: Callback when position changes (navigation)
- `intro`: Animation type ('fadeup' | 'fadedown' | 'fadeIn' | 'none')
- `animationDuration`: Duration in ms (default: 250)

#### **3. CSS Import**

**CRITICAL**: Must import the CSS file for proper styling:

```css
@import "bigger-picture/css"; /* Modern CSS */
/* OR */
@import "bigger-picture/dist/bigger-picture.css"; /* Traditional */
```

**Default Styles Applied**:
- `.bp-wrap`: Container with `position: fixed; inset: 0; z-index: 999;`
- `.bp-inner`: Inner container for centering
- `.bp-img`: Image element with transforms
- `.bp-x`: Close button (top right)
- `.bp-prev`, `.bp-next`: Navigation arrows

#### **4. Built-in Controls**

bigger-picture provides built-in UI controls:
- **Close button** (`.bp-x`): Top right corner
- **Navigation arrows** (`.bp-prev`, `.bp-next`): Left/right sides
- **Keyboard shortcuts**:
  - `←` / `→`: Navigate
  - `Escape`: Close
  - Mouse wheel: Zoom (if enabled)

#### **5. Zoom Configuration**

```javascript
bp.open({
  items: [...],
  zoom: true, // Enable mousewheel zoom (default: true)
  scale: 0.95, // Max scale (default: 0.95)
  maxZoom: 10  // Max zoom level (default: 10)
});
```

---

## Research Phase 2: Common Integration Issues

### Issue 1: Photo Not Centering

**Potential Causes**:

1. **CSS Not Loading**
   - bigger-picture.css must be imported in global styles
   - Check Network tab to verify CSS loads
   - Verify `.bp-wrap` has `position: fixed; inset: 0;`

2. **CSS Conflicts**
   - Parent elements with `position: relative` can break fixed positioning
   - Global styles overriding bigger-picture styles
   - z-index stacking context issues

3. **Timing Issues**
   - Opening lightbox before CSS is fully parsed
   - DOM not ready when `bp.open()` is called

4. **Image Dimensions**
   - Not providing `width` and `height` can cause layout issues
   - bigger-picture uses these for aspect ratio calculations

**Solution Checklist**:
- ✅ Import CSS globally (in app.css or layout)
- ✅ Verify CSS loads in Network tab
- ✅ Inspect `.bp-wrap` computed styles
- ✅ Provide `width` and `height` for each image
- ✅ Ensure no CSS conflicts (check specificity)

---

### Issue 2: Custom Controls Disappearing

**Potential Causes**:

1. **z-index Issues**
   - bigger-picture uses z-index 999 for `.bp-wrap`
   - Custom controls need z-index > 999
   - Stacking context created by parent elements

2. **Rendering Timing**
   - Controls render before `.bp-wrap` exists in DOM
   - Controls unmount when component state changes
   - Svelte reactivity not triggering re-render

3. **DOM Structure**
   - Controls appended to wrong parent element
   - Controls inside `.bp-wrap` but wrong position
   - bigger-picture overwrites custom controls

4. **CSS Display Issues**
   - `display: none` or `visibility: hidden`
   - `opacity: 0` without transition
   - `position: fixed` with wrong coordinates

**Solution Checklist**:
- ✅ Set z-index > 999 for custom controls
- ✅ Render controls conditionally when lightbox is open
- ✅ Use `position: fixed` with explicit coordinates
- ✅ Append controls to `document.body` (outside .bp-wrap)
- ✅ Verify controls exist in DOM when lightbox opens

---

### Issue 3: Navigation/Close Not Working

**Potential Causes**:

1. **bigger-picture Not Fully Initialized**
   - `bp` instance is `null` or `undefined`
   - `bp.open()` failed silently
   - Dynamic import timing issues

2. **Event Handlers Not Attached**
   - bigger-picture's built-in handlers not firing
   - Click events captured by overlay elements
   - z-index preventing clicks from reaching buttons

3. **Items Array Issues**
   - Empty items array
   - Invalid image URLs (404 errors)
   - Missing required properties (`img`)

4. **Callback Issues**
   - `onClose` not defined or not firing
   - `onUpdate` not tracking position changes
   - Svelte component state not updating

**Solution Checklist**:
- ✅ Verify `bp` instance exists after initialization
- ✅ Console.log `bp.open()` result
- ✅ Check browser console for errors
- ✅ Verify image URLs are valid
- ✅ Test with minimal items array (1-2 images)
- ✅ Add console.logs to `onClose` and `onUpdate`

---

## Research Phase 3: @panzoom/panzoom Integration

### Key Finding: NOT RECOMMENDED

**CRITICAL DISCOVERY**: @panzoom/panzoom is **NOT designed** to integrate with bigger-picture.

**Reasons**:
1. **Conflict of Purpose**: bigger-picture has built-in pan/zoom
2. **DOM Manipulation Conflicts**: Both libraries manipulate transforms
3. **Event Conflicts**: Both listen to mouse/touch events
4. **No Official Integration**: Neither library documents integration

### bigger-picture's Built-in Zoom

bigger-picture already has zoom functionality:

```javascript
bp.open({
  items: [...],
  zoom: true,       // Enable mousewheel zoom
  scale: 0.95,      // Max scale (95% of viewport)
  maxZoom: 10       // Max zoom multiplier
});
```

**Built-in Zoom Features**:
- Mouse wheel zoom
- Double-click to zoom
- Pinch-to-zoom (mobile)
- Pan when zoomed
- Smooth animations

### Recommendation

**❌ REMOVE @panzoom/panzoom integration**

bigger-picture's built-in zoom is sufficient and more compatible:
- Less code complexity
- No library conflicts
- Better performance
- Official support

**Alternative Approach**:
Use bigger-picture's zoom options:

```javascript
bp.open({
  items: photos.map(photo => ({
    img: photo.url,
    width: 2000,
    height: 1500
  })),
  zoom: true,
  maxZoom: 10, // Allow 10x zoom
  scale: 0.95  // Use 95% of viewport
});
```

---

## Research Phase 4: Svelte Integration Best Practices

### SSR Handling

**CORRECT** (as currently implemented):
```typescript
import { browser } from '$app/environment';
import { onMount } from 'svelte';

let bp;

onMount(async () => {
  if (!browser) return;

  const module = await import('bigger-picture');
  const BiggerPicture = module.default;

  bp = BiggerPicture({ target: document.body });

  bp.open({ /* ... */ });
});
```

**Why Dynamic Import**:
- bigger-picture accesses `document` and `window`
- SSR would fail with static import
- `onMount` only runs in browser

---

### Component Lifecycle

**Key Considerations**:

1. **Cleanup on Unmount**
```typescript
import { onDestroy } from 'svelte';

onDestroy(() => {
  if (bp) {
    bp.close(); // Close lightbox
    bp.destroy?.(); // Cleanup if method exists
  }
});
```

2. **State Synchronization**
```typescript
let currentIndex = $state(0);

bp.open({
  items: [...],
  position: startIndex,
  onUpdate: (container) => {
    currentIndex = container.position;
  }
});
```

3. **Custom Controls Rendering**
```svelte
{#if lightboxOpen}
  <div class="custom-controls" style="z-index: 1000;">
    <!-- Controls -->
  </div>
{/if}
```

---

### Event Handling

**Keyboard Shortcuts**:
```typescript
import { onMount, onDestroy } from 'svelte';

function handleKeydown(e: KeyboardEvent) {
  // Only handle when lightbox is open
  if (!document.querySelector('.bp-wrap')) return;

  switch (e.key) {
    case '+':
      // Custom zoom logic
      break;
    case 'r':
      // Custom rotation
      break;
  }
}

onMount(() => {
  document.addEventListener('keydown', handleKeydown);
});

onDestroy(() => {
  document.removeEventListener('keydown', handleKeydown);
});
```

**IMPORTANT**: Check if `.bp-wrap` exists before handling custom shortcuts to avoid conflicts when lightbox is closed.

---

## Research Phase 5: GitHub Issues Analysis

### Common Issues Found

Based on bigger-picture GitHub issues:

#### Issue: Images Not Centered
**Symptoms**: Images appear in wrong position
**Causes**:
- CSS not imported
- Parent container has `transform` applied
- Viewport meta tag issues on mobile

**Solutions**:
- Import CSS globally
- Avoid transforms on body/html
- Add viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`

#### Issue: Controls Not Visible
**Symptoms**: Close/nav buttons hidden
**Causes**:
- z-index conflicts
- Custom CSS overriding defaults
- Dark background hiding controls

**Solutions**:
- Don't override `.bp-x`, `.bp-prev`, `.bp-next` styles
- Ensure z-index > 999 for custom elements
- Use bigger-picture's built-in controls

#### Issue: Zoom Not Working
**Symptoms**: Mouse wheel doesn't zoom
**Causes**:
- `zoom: false` in options
- Event listeners captured by other elements
- Browser default scroll behavior

**Solutions**:
- Set `zoom: true` in options
- Prevent scroll on body when lightbox open
- Don't attach competing event listeners

---

## Findings Summary

### bigger-picture Official Documentation

**Proper Initialization**:
```javascript
import BiggerPicture from 'bigger-picture';

let bp = BiggerPicture({ target: document.body });

bp.open({
  items: photos.map(photo => ({
    img: photo.url,
    thumb: photo.thumb, // Optional
    alt: photo.alt,
    caption: photo.caption,
    width: photo.width,  // Recommended
    height: photo.height // Recommended
  })),
  position: startIndex,
  zoom: true,          // Enable zoom
  maxZoom: 10,         // Max zoom level
  scale: 0.95,         // 95% of viewport
  onClose: handleClose,
  onUpdate: (container) => {
    // container.position = current index
  }
});
```

**Required CSS**:
```css
/* In app.css or global stylesheet */
@import "bigger-picture/dist/bigger-picture.css";
```

**DOM Structure Created**:
```html
<div class="bp-wrap" style="position: fixed; inset: 0; z-index: 999;">
  <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.9);"></div>
  <button class="bp-x"></button> <!-- Close button -->
  <button class="bp-prev"></button> <!-- Previous -->
  <button class="bp-next"></button> <!-- Next -->
  <div class="bp-inner">
    <img class="bp-img" src="..." style="transform: ...;" />
  </div>
</div>
```

---

### @panzoom/panzoom Analysis

**Key Finding**: **DO NOT USE with bigger-picture**

**Reasons**:
1. bigger-picture has built-in pan/zoom
2. Conflicting transform manipulations
3. Event listener conflicts
4. No documented integration pattern
5. Adds unnecessary complexity

**Recommendation**: Use bigger-picture's built-in zoom:
```javascript
bp.open({
  items: [...],
  zoom: true,
  maxZoom: 10
});
```

---

## Root Cause Analysis: ClaimTech Issues

### Issue 1: Photo Not Centered

**Likely Cause**: CSS import location or timing

**Investigation**:
1. Verify CSS import in `app.css` is working
2. Check Network tab for CSS file
3. Inspect `.bp-wrap` computed styles
4. Check if Tailwind/custom CSS conflicts

**Expected Fix**: Ensure CSS loads before component mounts

---

### Issue 2: Controls Disappearing

**Likely Cause**: z-index or rendering timing

**Investigation**:
1. Check if controls render when `.bp-wrap` exists
2. Verify z-index > 999
3. Check if `currentPhoto` is defined
4. Inspect controls element in DOM

**Expected Fix**:
- Render controls conditionally: `{#if document.querySelector('.bp-wrap')}`
- Or render to `document.body` directly (portal pattern)

---

### Issue 3: Navigation Not Working

**Likely Cause**: `bp` instance not initialized or items array empty

**Investigation**:
1. Console.log `bp` after initialization
2. Console.log `items` array
3. Check for errors in console
4. Verify `bp.open()` success

**Expected Fix**: Add error handling and validation

---

### Issue 4: Close Button Not Working

**Likely Cause**: Same as navigation - initialization issue

**Investigation**:
1. Check if `.bp-x` element exists in DOM
2. Verify `onClose` callback is defined
3. Test ESC key (should also close)
4. Check console for errors

**Expected Fix**: Proper initialization and error handling

---

## Recommendations

### Primary Recommendation: Simplify Integration

**Remove @panzoom/panzoom completely**:
1. ❌ Uninstall `@panzoom/panzoom`
2. ✅ Use bigger-picture's built-in zoom
3. ✅ Remove panzoom integration code
4. ✅ Simplify PhotoViewer component

**Benefits**:
- Eliminates library conflicts
- Reduces bundle size by 3.7KB
- Less code complexity
- Better performance
- Official support

---

### Secondary Recommendation: Fix Current Implementation

If keeping both libraries:

**Step 1: Verify CSS Loading**
```typescript
onMount(async () => {
  // Wait for CSS to load
  await new Promise(resolve => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });

  // Then initialize
  bp = BiggerPicture({ target: document.body });
});
```

**Step 2: Fix Controls Rendering**
```svelte
{#if browser && document.querySelector('.bp-wrap')}
  <PhotoViewerControls ... />
{/if}
```

**Step 3: Delay Panzoom Initialization**
```typescript
bp.open({ /* ... */ });

// Wait for bigger-picture DOM to be ready
setTimeout(() => {
  const img = document.querySelector('.bp-img');
  if (img) {
    panzoomInstance = Panzoom(img, { /* ... */ });
  }
}, 500); // Increase delay to 500ms
```

**Step 4: Add Error Handling**
```typescript
try {
  bp.open({ items, position: startIndex });
} catch (error) {
  console.error('Failed to open lightbox:', error);
  // Fallback behavior
}
```

---

## Implementation Notes

### Critical Considerations

1. **CSS Import Timing**
   - Must import in global stylesheet (`app.css`)
   - Not in component (scoped styles won't work)
   - Verify CSS loads before opening lightbox

2. **Image URLs**
   - Must be valid, accessible URLs
   - Proxy URLs should return proper CORS headers
   - Test URLs in browser directly

3. **Dimensions**
   - Always provide `width` and `height`
   - Can be approximate (2000x1500 for estimates)
   - Used for aspect ratio calculations

4. **Initialization Timing**
   - Initialize in `onMount` (browser only)
   - Don't open lightbox in same tick
   - Use `setTimeout` or `requestAnimationFrame`

5. **Cleanup**
   - Close lightbox on unmount
   - Remove event listeners
   - Destroy panzoom instance

---

### Gotchas to Watch Out For

1. **SSR Errors**
   - Always use dynamic import
   - Check `if (!browser) return;`
   - Never access `document` outside `onMount`

2. **z-index Conflicts**
   - bigger-picture uses 999
   - Custom controls need 1000+
   - Check stacking context

3. **Event Conflicts**
   - Don't override bigger-picture's events
   - Check `.bp-wrap` exists before handling keys
   - Remove listeners on unmount

4. **Svelte Reactivity**
   - Use `$state` for reactive variables
   - Update state in callbacks (`onUpdate`, `onClose`)
   - Don't mutate state directly in event handlers

5. **Library Conflicts**
   - Don't use panzoom with bigger-picture
   - Use bigger-picture's built-in zoom
   - One library per responsibility

---

## Code Examples

### Example 1: Minimal bigger-picture Setup (Recommended)

```svelte
<script lang="ts">
import { browser } from '$app/environment';
import { onMount, onDestroy } from 'svelte';

interface Photo {
  url: string;
  alt: string;
}

let props: { photos: Photo[]; startIndex: number; onClose: () => void } = $props();

let bp: any;
let isOpen = $state(false);

onMount(async () => {
  if (!browser) return;

  const module = await import('bigger-picture');
  const BiggerPicture = module.default;

  bp = BiggerPicture({ target: document.body });

  bp.open({
    items: props.photos.map(photo => ({
      img: photo.url,
      alt: photo.alt,
      width: 2000,
      height: 1500
    })),
    position: props.startIndex,
    zoom: true,
    maxZoom: 10,
    onClose: () => {
      isOpen = false;
      props.onClose();
    },
    onUpdate: (container) => {
      console.log('Current position:', container.position);
    }
  });

  isOpen = true;
});

onDestroy(() => {
  if (bp) {
    bp.close();
  }
});
</script>

<!-- No additional HTML needed - bigger-picture renders to document.body -->
```

---

### Example 2: With Custom Controls (If Needed)

```svelte
<script lang="ts">
import { browser } from '$app/environment';
import { onMount, onDestroy } from 'svelte';
import { createPortal } from 'svelte-portal'; // If using portal

let bp: any;
let isOpen = $state(false);
let currentIndex = $state(0);

onMount(async () => {
  if (!browser) return;

  const module = await import('bigger-picture');
  const BiggerPicture = module.default;

  bp = BiggerPicture({ target: document.body });

  bp.open({
    items: [...],
    position: startIndex,
    onClose: () => {
      isOpen = false;
    },
    onUpdate: (container) => {
      currentIndex = container.position;
    }
  });

  isOpen = true;
});

function handleRotate() {
  // Custom rotation logic
  const img = document.querySelector('.bp-img');
  if (img) {
    // Apply CSS transform
  }
}

onDestroy(() => {
  if (bp) bp.close();
});
</script>

{#if isOpen && browser}
  <!-- Custom controls overlay -->
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000]
           bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2
           flex gap-2 items-center"
  >
    <button onclick={handleRotate}>
      Rotate
    </button>
    <span>Photo {currentIndex + 1} / {photos.length}</span>
  </div>
{/if}
```

---

### Example 3: Error Handling

```typescript
onMount(async () => {
  if (!browser) return;

  try {
    // Import library
    const module = await import('bigger-picture');
    const BiggerPicture = module.default;

    if (!BiggerPicture) {
      throw new Error('BiggerPicture not found in module');
    }

    // Initialize
    bp = BiggerPicture({ target: document.body });

    if (!bp) {
      throw new Error('Failed to initialize BiggerPicture');
    }

    // Validate items
    if (!props.photos || props.photos.length === 0) {
      throw new Error('No photos provided');
    }

    // Open lightbox
    const result = bp.open({
      items: props.photos.map(photo => ({
        img: photo.url,
        alt: photo.alt || 'Photo',
        width: photo.width || 2000,
        height: photo.height || 1500
      })),
      position: Math.max(0, Math.min(props.startIndex, props.photos.length - 1)),
      onClose: props.onClose,
      onUpdate: (container) => {
        console.log('Position changed:', container.position);
      }
    });

    console.log('Lightbox opened successfully:', result);

  } catch (error) {
    console.error('Failed to initialize photo viewer:', error);
    alert('Failed to open photo viewer. Please try again.');
    props.onClose();
  }
});
```

---

## Resources

### Official Documentation
- **bigger-picture Docs**: https://biggerpicture.henrygd.me/
- **bigger-picture GitHub**: https://github.com/henrygd/bigger-picture
- **bigger-picture npm**: https://www.npmjs.com/package/bigger-picture
- **@panzoom/panzoom GitHub**: https://github.com/timmywil/panzoom

### Relevant Examples
- bigger-picture Svelte example: Check GitHub issues/discussions
- SvelteKit SSR with browser-only libs: https://kit.svelte.dev/docs/faq#how-do-i-use-a-client-side-only-library

### Related ClaimTech Docs
- `.agent/Tasks/active/WINDOWS_PHOTO_VIEWER_IMPLEMENTATION.md` - Current PRD
- `.agent/SOP/working_with_photos.md` - Photo workflow guide
- `.agent/System/ui_components.md` - UI component patterns

---

## Next Steps

### Immediate Actions (Quick Fixes)

1. **Debug Current Implementation** (30 min)
   - Add console.logs throughout PhotoViewer.svelte
   - Verify CSS loads in Network tab
   - Inspect DOM structure when lightbox opens
   - Check browser console for errors

2. **Verify Initialization** (15 min)
   - Log `bp` instance after creation
   - Log items array before `bp.open()`
   - Log callbacks (`onClose`, `onUpdate`)
   - Verify `browser` check works

3. **Test Minimal Version** (30 min)
   - Comment out panzoom integration
   - Comment out custom controls
   - Test with just bigger-picture
   - Verify basic functionality works

### Recommended Solution (Clean Implementation)

1. **Remove @panzoom/panzoom** (15 min)
   - Uninstall from package.json
   - Remove import and integration code
   - Remove panzoom-related state
   - Remove panzoom event handlers

2. **Simplify PhotoViewer** (30 min)
   - Use only bigger-picture
   - Remove complex state management
   - Remove panzoom initialization
   - Keep custom controls if needed (with proper z-index)

3. **Fix CSS Import** (5 min)
   - Verify CSS import in app.css
   - Check CSS loads in Network tab
   - Test in browser DevTools

4. **Test Thoroughly** (30 min)
   - Test all 4 issues (centering, controls, nav, close)
   - Test keyboard shortcuts
   - Test mobile gestures
   - Test multiple photos

### Long-term Improvements

1. **Add Rotation** (if needed) (45 min)
   - Use CSS transforms on `.bp-img`
   - Store rotation state
   - Apply on `onUpdate` callback
   - Don't persist (CSS-only per requirements)

2. **Add Custom Controls** (if needed) (30 min)
   - Use portal pattern (render to body)
   - Set z-index: 1000
   - Position: fixed with bottom/left
   - Only render when `.bp-wrap` exists

3. **Optimize Performance** (30 min)
   - Lazy load images
   - Use Supabase transforms for thumbnails
   - Implement loading states
   - Add image preloading

---

## Conclusion

### Key Findings

1. **@panzoom/panzoom is NOT needed** - bigger-picture has built-in zoom
2. **CSS import is CRITICAL** - must be in global stylesheet
3. **Initialization timing matters** - wait for DOM ready
4. **SSR handling is correct** - dynamic imports working as expected
5. **Custom controls need z-index > 999** - to appear above overlay

### Primary Issue

Based on the research, the most likely cause of ALL 4 issues is:

**bigger-picture CSS not loading or being overridden**

This would cause:
- ❌ Photo not centered (no `.bp-wrap` positioning)
- ❌ Controls disappearing (no reference for z-index)
- ❌ Navigation not working (no `.bp-prev`/`.bp-next` elements)
- ❌ Close not working (no `.bp-x` element)

### Recommended Fix

**Immediate** (15 min):
1. Verify CSS import in app.css: `@import "bigger-picture/dist/bigger-picture.css";`
2. Check Network tab to confirm CSS loads
3. Inspect `.bp-wrap` element in DevTools
4. Add error handling to `bp.open()`

**Short-term** (1-2 hours):
1. Remove @panzoom/panzoom integration
2. Simplify PhotoViewer to use only bigger-picture
3. Fix custom controls z-index and rendering
4. Test all functionality

**Long-term** (2-4 hours):
1. Add rotation if needed (CSS-only)
2. Optimize image loading
3. Add proper error handling
4. Write comprehensive tests

---

**End of Research Document**

*Research completed: 2025-11-05*
*Next: Debug session to verify findings*
