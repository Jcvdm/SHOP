# Photo Component Development Skill

**Specialized patterns for implementing photo components with inline editing, optimistic updates, and navigation tracking.**

---

## Quick Start

This skill provides proven patterns for photo viewing, editing, and management features in ClaimTech.

### When to Use

This skill auto-invokes when working with:
- Photo viewer components (fullscreen, modal, inline)
- Inline photo label editing
- Photo galleries with metadata
- Navigation tracking in image carousels
- Optimistic updates for photo data

**Keywords**: photo, image, label, gallery, viewer, thumbnail, carousel, inline edit

---

## Core Patterns

### Pattern 1: Fixed Bottom Bar
**For**: Fullscreen viewers (bigger-picture, PhotoSwipe)
**Example**: EstimatePhotosPanel

### Pattern 2: Modal Footer
**For**: Dialog-based viewers (shadcn/ui)
**Example**: AdditionalsPhotosPanel

### Pattern 3: Thumbnail Overlay
**For**: Inline grid galleries
**Example**: Vehicle photo grid

---

## Critical Requirements

**All implementations MUST include:**

1. **Optimistic Updates** (instant UI feedback)
   ```typescript
   photos.update(id, { label });  // Instant!
   await service.updateLabel();   // Then DB
   await onUpdate();              // Then sync
   ```

2. **Navigation Tracking** (prevent "wrong photo" bug)
   ```typescript
   // ✅ Use library's native position API
   const newPosition = container?.position;

   // ❌ Never use indexOf
   const index = items.indexOf(item); // FAILS!
   ```

3. **Comprehensive Logging** (debug-friendly)
   ```typescript
   console.log('[Component] Navigated to:', index, 'Photo ID:', photo.id);
   ```

4. **Keyboard Shortcuts** (accessibility)
   - E = Edit, Enter = Save, Escape = Cancel, Delete = Delete

5. **Error Recovery** (maintain consistency)
   ```typescript
   catch (error) {
       await onUpdate(); // Revert optimistic update
       throw error;
   }
   ```

---

## File Structure

```
.claude/skills/photo-component-development/
├── SKILL.md (main reference, ~2500 lines)
├── README.md (this file)
└── resources/
    ├── pattern-templates.md (copy-paste templates)
    ├── testing-checklist.md (coming soon)
    ├── troubleshooting-guide.md (coming soon)
    └── migration-guide.md (coming soon)
```

---

## Related Documentation

### ClaimTech Docs
- `.agent/System/photo_labeling_implementation_nov_6_2025.md` - Implementation details
- `.agent/SOP/photo_labeling_patterns.md` - Step-by-step procedures

### Other Skills
- `claimtech-development` - General SvelteKit patterns
- `supabase-development` - Storage & database operations

---

## Quick Reference

### Pattern Selection

| Scenario | Pattern | Library |
|----------|---------|---------|
| Large photos, fullscreen | Fixed Bottom Bar | bigger-picture |
| Medium photos, modal | Modal Footer | shadcn/ui Dialog |
| Many photos, grid | Thumbnail Overlay | None (inline) |

### Common Mistakes to Avoid

1. ❌ Using `indexOf()` for navigation → ✅ Use library's position API
2. ❌ No optimistic updates → ✅ Update UI first, then DB
3. ❌ Not logging photo IDs → ✅ Log at every critical point
4. ❌ Forgetting error recovery → ✅ Revert optimistic updates on error

---

**Created**: November 6, 2025
**Maintainer**: ClaimTech Engineering Team
