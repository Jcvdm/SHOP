# PhotoUpload Visual Differences - ASCII Mockups

**Purpose**: Show visual layout differences between PhotoUpload and TyrePanel

---

## CURRENT STATE (PhotoUpload.svelte) ❌

```
┌─────────────────────────────────────────────────────┐
│  Photo Upload Area (flex gap-2)                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │   📷 Camera      │  │   📤 Upload      │        │
│  │                  │  │                  │        │
│  │  Take Photo      │  │  Upload File     │        │
│  │                  │  │  or drag & drop  │        │
│  └──────────────────┘  └──────────────────┘        │
│                                                     │
│  (TWO SIDE-BY-SIDE BUTTONS - WRONG!)               │
└─────────────────────────────────────────────────────┘
```

**Issues**:
- Two separate upload zones
- Side-by-side layout (not intuitive)
- No clear primary action
- Buttons are the upload zone (confusing)
- No "browse" link
- No "Supports multiple files" text

---

## CORRECT STATE (TyrePhotosPanel.svelte) ✅

```
┌─────────────────────────────────────────────────────┐
│  Upload Zone (border-dashed, centered)              │
├─────────────────────────────────────────────────────┤
│                                                     │
│                      📤                             │
│                                                     │
│         Drag and drop photos here, or              │
│                   browse                            │
│                                                     │
│            Supports multiple files                  │
│                                                     │
│         ┌──────────┐  ┌──────────┐                 │
│         │ 📷 Camera│  │📤 Upload │                 │
│         └──────────┘  └──────────┘                 │
│                                                     │
│  (SINGLE CENTERED ZONE WITH BUTTONS BELOW)         │
└─────────────────────────────────────────────────────┘
```

**Advantages**:
- Single clear upload zone
- Centered layout (professional)
- Clear instructions with clickable "browse"
- Buttons below zone (not integrated)
- Support statement visible
- Matches TyrePanel pattern

---

## GRID STATE (With Photos)

### PhotoUpload (WRONG)
```
Not applicable - PhotoUpload is single photo only
```

### TyrePanel (CORRECT)
```
┌──────────────────────────────────────────────────┐
│  Grid: 2 cols (sm: 3, lg: 4)                     │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 📤 Add   │  │ Photo 1  │  │ Photo 2  │      │
│  │ Photos  │  │          │  │          │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Photo 3  │  │ Photo 4  │  │ Photo 5  │      │
│  │          │  │          │  │          │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  (FIRST CELL IS UPLOAD ZONE)                    │
└──────────────────────────────────────────────────┘
```

---

## KEY LAYOUT DIFFERENCES

### Container Structure

**PhotoUpload**:
```
<div class="flex gap-2">
  <button>Camera</button>
  <button>Upload</button>
</div>
```
→ Horizontal, side-by-side

**TyrePanel**:
```
<div class="flex flex-col items-center justify-center p-6">
  <Upload icon />
  <Text with browse link />
  <Support text />
  <div class="flex gap-2">
    <Button>Camera</Button>
    <Button>Upload</Button>
  </div>
</div>
```
→ Vertical, centered, structured

---

## STYLING COMPARISON

| Element | PhotoUpload | TyrePanel |
|---------|------------|-----------|
| Container | `flex gap-2` | `flex flex-col items-center justify-center p-6` |
| Width | `flex-1` per button | Full width |
| Height | `{height}` (h-32) | Auto (content-based) |
| Padding | None | `p-6` |
| Border | Per button | Container |
| Drag state | Per button | Container |
| Icon size | h-8 w-8 | h-8 w-8 |
| Text | Minimal | Detailed |
| Buttons | Integrated | Separate |

---

## WHAT NEEDS TO CHANGE

1. **Layout**: `flex gap-2` → `flex flex-col items-center justify-center`
2. **Container**: Add border-dashed, padding, drag styling
3. **Buttons**: Move outside upload zone, use Button component
4. **Text**: Add "browse" link, support statement
5. **Spacing**: Add proper padding and margins
6. **Structure**: Reorganize content hierarchy

---

## RESULT AFTER FIX

PhotoUpload will look like:
```
┌─────────────────────────────────────────────────────┐
│  Upload Zone (border-dashed, centered)              │
├─────────────────────────────────────────────────────┤
│                                                     │
│                      📷                             │
│                                                     │
│         Drag and drop photo here, or               │
│                   browse                            │
│                                                     │
│            Supports: JPG, PNG, GIF                 │
│                                                     │
│         ┌──────────┐  ┌──────────┐                 │
│         │ 📷 Camera│  │📤 Upload │                 │
│         └──────────┘  └──────────┘                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

✅ Matches TyrePanel pattern  
✅ Professional appearance  
✅ Clear instructions  
✅ Consistent with app design

