# Appointments Schedule/Reschedule Feature - Implementation Complete ✅

## Overview
Added Schedule/Reschedule functionality to the Appointments page, allowing users to update appointment date, time, duration, location, and notes directly from the appointments list.

---

## ✅ Features Implemented

### 1. **Schedule/Reschedule Button**
- Added button above "Start Assessment" button on each appointment card
- **Dynamic Label:**
  - Shows **"Schedule"** when `appointment_time` is null/empty
  - Shows **"Reschedule"** when `appointment_time` is set
- **Location:** Both overdue and upcoming appointment sections

### 2. **Modal Dialog**
- Opens when Schedule/Reschedule button is clicked
- Pre-fills with current appointment data
- Responsive design with scrollable content

### 3. **Form Fields**

#### **Always Visible:**
- **Appointment Type** (read-only display)
- **Date** (required) - Date picker
- **Time** (optional) - Time picker (24-hour format)
- **Duration** (minutes) - Number input with 15-minute increments
- **Notes** - Textarea for general notes
- **Special Instructions** - Textarea for engineer instructions

#### **Conditional (In-Person Only):**
- **Address** - Street address
- **City** - City name
- **Province** - Dropdown with all 9 SA provinces
- **Location Notes** - Additional location details/directions

### 4. **Save Logic**
- Validates required fields (date must be set)
- Updates appointment via `appointmentService.updateAppointment()`
- Refreshes page data using `goto('/work/appointments', { invalidateAll: true })`
- Shows loading state during save
- Displays error messages if save fails

---

## 🎨 UI Layout

### **Appointment Card with Buttons:**
```
┌─────────────────────────────────────────────────────────┐
│ 🔵 In-Person  APT-2025-001  09:00 - 10:00             │
│ John Smith • Toyota Corolla • Cape Town                │
│ Engineer: Mike Johnson                                 │
│                                                         │
│                                    [Schedule/Reschedule]│  ← NEW
│                                    [Start Assessment]   │
└─────────────────────────────────────────────────────────┘
```

### **Modal Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Schedule/Reschedule Appointment                         │
│ Update appointment details for APT-2025-001             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Appointment Type: In-Person (read-only)                │
│                                                         │
│ Date: [2025-10-21] *    Time: [09:00]                  │
│ Duration: [60] minutes                                  │
│                                                         │
│ ┌─ Location Details (in-person only) ─────────────┐   │
│ │ Address: [123 Main Street]                       │   │
│ │ City: [Cape Town]    Province: [Western Cape]    │   │
│ │ Location Notes: [...]                            │   │
│ └──────────────────────────────────────────────────┘   │
│                                                         │
│ Notes: [General notes...]                              │
│ Special Instructions: [Engineer instructions...]       │
│                                                         │
│                              [Cancel]  [Save Changes]   │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Code Changes

### **File Modified:** `src/routes/(app)/work/appointments/+page.svelte`

#### **1. Added Imports:**
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '$lib/components/ui/dialog';
import type { Province } from '$lib/types/engineer';
```

#### **2. Added State Variables:**
```typescript
// Schedule/Reschedule modal state
let showScheduleModal = $state(false);
let selectedAppointment = $state<(typeof allAppointmentsWithDetails)[0] | null>(null);
let scheduleDate = $state('');
let scheduleTime = $state('');
let scheduleDuration = $state(60);
let scheduleLocationAddress = $state('');
let scheduleLocationCity = $state('');
let scheduleLocationProvince = $state<Province | ''>('');
let scheduleLocationNotes = $state('');
let scheduleNotes = $state('');
let scheduleSpecialInstructions = $state('');
let scheduleError = $state<string | null>(null);
```

#### **3. Added Handler Functions:**

**Open Modal:**
```typescript
function handleOpenScheduleModal(appointment: (typeof allAppointmentsWithDetails)[0]) {
  selectedAppointment = appointment;
  scheduleDate = appointment.appointment_date.split('T')[0]; // Extract YYYY-MM-DD
  scheduleTime = appointment.appointment_time || '';
  scheduleDuration = appointment.duration_minutes;
  scheduleLocationAddress = appointment.location_address || '';
  scheduleLocationCity = appointment.location_city || '';
  scheduleLocationProvince = (appointment.location_province as Province) || '';
  scheduleLocationNotes = appointment.location_notes || '';
  scheduleNotes = appointment.notes || '';
  scheduleSpecialInstructions = appointment.special_instructions || '';
  scheduleError = null;
  showScheduleModal = true;
}
```

**Save Changes:**
```typescript
async function handleSaveSchedule() {
  if (!selectedAppointment) return;
  if (!scheduleDate) {
    scheduleError = 'Please select an appointment date';
    return;
  }

  loading = true;
  scheduleError = null;

  try {
    // Prepare update data
    const updateData: any = {
      appointment_date: scheduleDate,
      appointment_time: scheduleTime || null,
      duration_minutes: scheduleDuration,
      notes: scheduleNotes || null,
      special_instructions: scheduleSpecialInstructions || null
    };

    // Add location fields for in-person appointments
    if (selectedAppointment.appointment_type === 'in_person') {
      updateData.location_address = scheduleLocationAddress || null;
      updateData.location_city = scheduleLocationCity || null;
      updateData.location_province = scheduleLocationProvince || null;
      updateData.location_notes = scheduleLocationNotes || null;
    }

    // Update appointment
    await appointmentService.updateAppointment(selectedAppointment.id, updateData);

    // Close modal
    showScheduleModal = false;

    // Refresh page data to show updated appointment
    await goto('/work/appointments', { invalidateAll: true });
  } catch (error) {
    console.error('Error updating appointment:', error);
    scheduleError = error instanceof Error 
      ? error.message 
      : 'Failed to update appointment. Please try again.';
    loading = false;
  }
}
```

#### **4. Updated Button Structure:**
Changed from single button to vertical stack:
```svelte
<!-- Action Buttons (vertical stack) -->
<div class="ml-4 flex flex-col gap-2">
  <!-- Schedule/Reschedule Button -->
  <Button
    size="sm"
    variant="outline"
    onclick={(e) => {
      e.stopPropagation();
      handleOpenScheduleModal(appointment);
    }}
    disabled={loading}
  >
    <Calendar class="mr-2 h-4 w-4" />
    {appointment.appointment_time ? 'Reschedule' : 'Schedule'}
  </Button>

  <!-- Start Assessment Button -->
  <Button
    size="sm"
    onclick={(e) => {
      e.stopPropagation();
      handleStartAssessment(appointment.id);
    }}
    disabled={loading}
  >
    <Play class="mr-2 h-4 w-4" />
    Start Assessment
  </Button>
</div>
```

#### **5. Added Modal Dialog:**
- Full form with all appointment fields
- Conditional location section for in-person appointments
- Error display
- Loading states
- Cancel and Save buttons

---

## 🔄 User Flow

1. **User views appointments list** → Sees Schedule/Reschedule button on each card
2. **User clicks Schedule/Reschedule** → Modal opens with pre-filled data
3. **User edits fields** → Changes date, time, location, notes, etc.
4. **User clicks Save Changes** → Appointment is updated in database
5. **Page refreshes** → Updated appointment appears in list with new date/time
6. **Button label updates** → Changes from "Schedule" to "Reschedule" if time was added

---

## 🎯 Key Benefits

1. **Quick Updates** - Edit appointments without navigating to detail page
2. **Smart Labeling** - Button text reflects current state (Schedule vs Reschedule)
3. **Conditional Fields** - Location fields only show for in-person appointments
4. **Data Preservation** - All existing data is pre-filled in the modal
5. **Error Handling** - Clear error messages if save fails
6. **Loading States** - Visual feedback during save operation
7. **Page Refresh** - Uses recommended pattern (`goto` with `invalidateAll: true`)

---

## 🧪 Testing Checklist

- [x] Schedule button appears when appointment has no time
- [x] Reschedule button appears when appointment has time set
- [x] Modal opens with pre-filled data
- [x] Date field is required (validation works)
- [x] Time field is optional
- [x] Location fields only show for in-person appointments
- [x] Save updates appointment in database
- [x] Page refreshes after save
- [x] Updated appointment appears in correct date group
- [x] Button label changes after adding time
- [x] Error messages display correctly
- [x] Loading state shows during save
- [x] Cancel button closes modal without saving

---

## 📚 Related Documentation

- **Refresh Pattern:** `REFRESH_FIX_IMPLEMENTATION_COMPLETE.md`
- **Appointment Service:** `src/lib/services/appointment.service.ts`
- **Appointment Types:** `src/lib/types/appointment.ts`

---

## 🔮 Future Enhancements

- Add validation for past dates
- Add conflict detection (engineer double-booking)
- Add calendar picker instead of date input
- Add time zone support
- Add recurring appointments
- Add bulk reschedule functionality

