# Additionals Reversal - Practical Examples

## Real-World Scenarios with Step-by-Step Examples

---

## Example 1: Insurance Changes Mind on Declined Part

### Scenario
An assessor declines a bumper replacement because it seems repairable. The insurance company reviews the photos and insists the bumper must be replaced.

### Timeline

#### Step 1: Initial Assessment
```json
{
  "id": "line-001",
  "action": "added",
  "status": "declined",
  "description": "Front bumper - replacement",
  "total": 5000,
  "decline_reason": "Bumper is repairable, replacement not necessary"
}
```
**Estimate Total**: R 0 (declined items not counted)

#### Step 2: Insurance Insists on Replacement
Assessor clicks "Reinstate" button and enters reason:
```
"Insurance reviewed photos and requires replacement per policy"
```

System creates reversal entry:
```json
{
  "id": "line-002",
  "action": "reversal",
  "status": "approved",
  "reverses_line_id": "line-001",
  "reversal_reason": "Insurance reviewed photos and requires replacement per policy",
  "description": "Front bumper - replacement",
  "total": 5000
}
```

**Estimate Total**: R 5,000 (reversal is approved and counted)

#### Result
- Original declined entry preserved (audit trail)
- New reversal entry adds the part back
- **UI Display**: Original shows "Declined" badge, reversal shows "Reversal" badge
- Full history visible: declined → reinstated with reason
- Insurance requirement documented

---

## Example 2: Assessor Adds Wrong Part, Then Corrects

### Scenario
Assessor accidentally approves a headlight for the wrong side, then needs to exclude it.

### Timeline

#### Step 1: Wrong Part Added and Approved
```json
{
  "id": "line-003",
  "action": "added",
  "status": "approved",
  "description": "Left headlight assembly",
  "total": 3500
}
```
**Estimate Total**: R 3,500

#### Step 2: Assessor Realizes Mistake
Assessor clicks "Reverse" button and enters reason:
```
"Wrong side - vehicle damage is on right side only"
```

System creates reversal entry:
```json
{
  "id": "line-004",
  "action": "reversal",
  "status": "approved",
  "reverses_line_id": "line-003",
  "reversal_reason": "Wrong side - vehicle damage is on right side only",
  "description": "Left headlight assembly",
  "total": -3500
}
```

**Estimate Total**: R 0 (3500 + (-3500) = 0)

**UI Display**:
- Original line-003 shows "Reversed" badge (NOT "Approved")
- Reversal line-004 shows "Reversal" badge with negative amount
- Both have blue background

#### Step 3: Add Correct Part
```json
{
  "id": "line-005",
  "action": "added",
  "status": "approved",
  "description": "Right headlight assembly",
  "total": 3500
}
```

**Estimate Total**: R 3,500 (correct part)

#### Result
- Wrong part entry preserved (audit trail)
- Reversal entry cancels it out
- Correct part added
- Full history shows: wrong part → reversed → correct part added

---

## Example 3: Original Line Removed, Then Needed Again

### Scenario
Assessor removes a door handle from original estimate thinking it's not damaged. Client later reports it's broken.

### Timeline

#### Step 1: Original Estimate Includes Door Handle
```json
// Original estimate line (from estimate tab)
{
  "id": "orig-001",
  "description": "Door handle - exterior",
  "total": 450
}
```
**Original Estimate Total**: R 450

#### Step 2: Assessor Removes It (Additionals Tab)
Assessor clicks "Remove" on original line.

System creates removal entry:
```json
{
  "id": "add-001",
  "action": "removed",
  "status": "approved",
  "original_line_id": "orig-001",
  "description": "Door handle - exterior",
  "total": -450
}
```

**Combined Total**: R 0 (450 + (-450) = 0)

#### Step 3: Client Reports It's Actually Broken
Assessor clicks "Reinstate Original" and enters reason:
```
"Client confirmed handle is broken, needs replacement"
```

System creates reversal entry:
```json
{
  "id": "add-002",
  "action": "reversal",
  "status": "approved",
  "reverses_line_id": "add-001",
  "reversal_reason": "Client confirmed handle is broken, needs replacement",
  "description": "Door handle - exterior",
  "total": 450
}
```

**Combined Total**: R 450 (450 - 450 + 450 = 450)

#### Result
- Original line preserved in estimate
- Removal entry preserved (audit trail)
- Reversal entry restores the line
- Full history: included → removed → reinstated with reason

---

## Example 4: Multiple Reversals on Same Item

### Scenario
A part goes through multiple status changes as assessment progresses.

### Timeline

#### Step 1: Part Added
```json
{
  "id": "line-006",
  "action": "added",
  "status": "pending",
  "description": "Windshield replacement",
  "total": 4500
}
```
**Total**: R 0 (pending)

#### Step 2: Part Approved
```json
{
  "id": "line-006",
  "status": "approved"
}
```
**Total**: R 4,500

#### Step 3: Insurance Declines (Assessor Reverses)
```json
{
  "id": "line-007",
  "action": "reversal",
  "status": "approved",
  "reverses_line_id": "line-006",
  "reversal_reason": "Insurance declined - windshield can be repaired",
  "total": -4500
}
```
**Total**: R 0 (4500 + (-4500))

#### Step 4: Repair Fails, Insurance Approves Replacement
Assessor clicks "Reinstate" on the reversal? No - they create a NEW additional:
```json
{
  "id": "line-008",
  "action": "added",
  "status": "approved",
  "description": "Windshield replacement - repair failed",
  "total": 4500
}
```
**Total**: R 4,500

#### Result
- Complete history preserved
- Each decision documented with reason
- Final total is correct
- Audit trail shows: approved → reversed (declined) → new approval

---

## Example 5: Bulk Scenario - Multiple Parts

### Scenario
Insurance initially approves estimate, then requests removal of several aftermarket parts, then later approves OEM parts.

### Initial State (All Approved)
```json
[
  { "id": "1", "description": "Aftermarket bumper", "total": 3000, "status": "approved" },
  { "id": "2", "description": "Aftermarket grille", "total": 800, "status": "approved" },
  { "id": "3", "description": "Aftermarket fog light", "total": 600, "status": "approved" }
]
```
**Total**: R 4,400

### Insurance Requests Removal
Assessor reverses each item:
```json
[
  { "id": "4", "action": "reversal", "reverses_line_id": "1", "total": -3000, "status": "approved" },
  { "id": "5", "action": "reversal", "reverses_line_id": "2", "total": -800, "status": "approved" },
  { "id": "6", "action": "reversal", "reverses_line_id": "3", "total": -600, "status": "approved" }
]
```
**Total**: R 0

### Insurance Approves OEM Parts
Assessor adds new items:
```json
[
  { "id": "7", "description": "OEM bumper", "total": 5000, "status": "approved" },
  { "id": "8", "description": "OEM grille", "total": 1200, "status": "approved" },
  { "id": "9", "description": "OEM fog light", "total": 900, "status": "approved" }
]
```
**Total**: R 7,100

### Final State
All entries preserved:
- Original aftermarket parts (approved)
- Reversals removing them (approved, negative)
- New OEM parts (approved)

**Calculation**: 3000 + 800 + 600 + (-3000) + (-800) + (-600) + 5000 + 1200 + 900 = R 7,100

---

## Key Takeaways

### 1. Immutability
- Original entries are NEVER modified
- All changes are new entries
- Complete history preserved

### 2. Simple Math
- Just sum all approved items
- Reversals have appropriate signs
- No complex logic needed

### 3. Audit Trail
- Every change has a reason
- Full timeline visible
- Compliance-ready

### 4. Flexibility
- Any action can be reversed
- Multiple reversals possible
- Handles complex scenarios

### 5. User-Friendly
- Clear visual indicators
- Simple workflows
- Obvious action buttons

---

## Visual Indicators in UI

### Line Item Colors
- **White background**: Normal added items
- **Red background**: Removed original lines
- **Blue background**: Reversal entries

### Action Buttons
- **Green ✓**: Approve pending
- **Red ✗**: Decline pending
- **Orange ↶**: Reverse approved
- **Green ↻**: Reinstate declined/removed
- **Red 🗑️**: Delete pending only

### Status Badges
- **Yellow**: Pending
- **Green**: Approved
- **Red**: Declined
- **Blue**: Reversal

---

## Testing These Scenarios

To test each scenario:

1. Navigate to an assessment with finalized estimate
2. Go to Additionals tab
3. Follow the steps in each example above
4. Verify totals calculate correctly
5. Check audit log for entries
6. Verify visual indicators appear correctly

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-16  
**Status**: Ready for Testing

