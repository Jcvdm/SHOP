# PDF Generation Testing Guide

## Overview

This guide provides step-by-step instructions for testing the complete PDF generation system implemented in the Finalize Tab.

---

## Prerequisites

✅ **Completed:**
- Database migrations applied (033 & 034)
- Dependencies installed (puppeteer, jszip)
- Company settings configured
- Storage bucket created
- API endpoints deployed

✅ **Required:**
- Dev server running (`npm run dev`)
- At least one complete assessment with:
  - Vehicle identification data
  - Exterior 360 photos
  - Interior/mechanical data
  - Damage assessment
  - Estimate with line items
  - Photos uploaded

---

## Test Plan

### **Test 1: Company Settings**

**Purpose:** Verify company information can be updated and persists correctly

**Steps:**
1. Navigate to **Settings → Company Settings** in sidebar
2. Update company information:
   - Company Name: "Your Company Name"
   - P.O. Box: "P.O. Box 12345"
   - City: "Johannesburg"
   - Province: "Gauteng"
   - Postal Code: "2000"
   - Phone: "+27 (0) 11 123 4567"
   - Email: "info@yourcompany.co.za"
   - Website: "www.yourcompany.co.za"
3. Click **Save Settings**
4. Verify success message appears
5. Refresh page and verify data persists

**Expected Result:**
- ✅ Settings save successfully
- ✅ Success message displays
- ✅ Data persists after refresh

---

### **Test 2: Finalize Tab Access**

**Purpose:** Verify Finalize tab is accessible and displays correctly

**Steps:**
1. Navigate to **Work → Open Assessments**
2. Click on an assessment
3. Click the **Finalize** tab (10th tab)
4. Verify UI elements are present

**Expected Result:**
- ✅ Finalize tab appears as 10th tab
- ✅ Completion status card shows progress
- ✅ Four document cards display:
  * Damage Inspection Report
  * Repair Estimate
  * Photographs PDF
  * Photographs ZIP
- ✅ Quick Actions section visible
- ✅ All cards show "Not Generated" status initially

---

### **Test 3: Generate Report PDF**

**Purpose:** Test individual report generation

**Steps:**
1. On Finalize tab, locate **Damage Inspection Report** card
2. Click **Generate** button
3. Wait for generation to complete (spinner should show)
4. Verify status changes to "Generated"
5. Verify timestamp appears
6. Click **Download** button
7. Verify PDF downloads and opens correctly

**Expected Result:**
- ✅ Generate button shows loading state
- ✅ Status changes to "Generated" with green badge
- ✅ Timestamp displays in South African format
- ✅ Download button appears
- ✅ PDF downloads successfully
- ✅ PDF contains:
  * Company header with your settings
  * Report title
  * Report number (REP-YYYY-NNNNN format)
  * Claim information
  * Vehicle information
  * Vehicle condition
  * Interior & mechanical details
  * Damage assessment
  * Assessment notes
  * Company footer

---

### **Test 4: Generate Estimate PDF**

**Purpose:** Test estimate generation with line items

**Steps:**
1. On Finalize tab, locate **Repair Estimate** card
2. Click **Generate** button
3. Wait for generation to complete
4. Verify status changes to "Generated"
5. Click **Download** button
6. Verify PDF downloads and opens correctly

**Expected Result:**
- ✅ Generate button shows loading state
- ✅ Status changes to "Generated"
- ✅ PDF downloads successfully
- ✅ PDF contains:
  * Company header
  * Estimate title
  * Claim and vehicle information
  * Repairer information (if selected)
  * Labour rates (panel, paint, mechanical)
  * Line items table with:
    - PARTS section (P001, P002, etc.)
    - REPAIRS section (R001, R002, etc.)
    - OTHER section (O001, O002, etc.)
  * Subtotals per category
  * Total calculations:
    - Subtotal
    - VAT (15%)
    - Grand Total
  * Notes section
  * Terms & conditions footer

---

### **Test 5: Generate Photos PDF**

**Purpose:** Test photos compilation into PDF

**Steps:**
1. On Finalize tab, locate **Photographs PDF** card
2. Click **Generate** button
3. Wait for generation to complete
4. Verify status changes to "Generated"
5. Click **Download** button
6. Verify PDF downloads and opens correctly

**Expected Result:**
- ✅ Generate button shows loading state
- ✅ Status changes to "Generated"
- ✅ PDF downloads successfully
- ✅ PDF contains organized sections:
  * Vehicle Identification (VIN, registration, odometer)
  * 360° Exterior Views (8 angles)
  * Interior & Mechanical (dashboard, seats, engine)
  * Damage Documentation (estimate photos)
  * Pre-Incident Condition (if available)
- ✅ Each photo has caption
- ✅ Photos display in 2-column grid
- ✅ Company branding present

---

### **Test 6: Generate Photos ZIP**

**Purpose:** Test organized ZIP file creation

**Steps:**
1. On Finalize tab, locate **Photographs ZIP** card
2. Click **Generate** button
3. Wait for generation to complete
4. Verify status changes to "Generated"
5. Click **Download** button
6. Extract ZIP file
7. Verify folder structure

**Expected Result:**
- ✅ Generate button shows loading state
- ✅ Status changes to "Generated"
- ✅ ZIP downloads successfully
- ✅ ZIP contains organized folders:
  * `01_Vehicle_Identification/`
    - 1_VIN_Number.jpg
    - 2_Registration.jpg
    - 3_Odometer.jpg
  * `02_Exterior_360/`
    - 1_Front_View.jpg
    - 2_Rear_View.jpg
    - 3_Left_Side.jpg
    - 4_Right_Side.jpg
    - 5_Front_Left.jpg
    - 6_Front_Right.jpg
    - 7_Rear_Left.jpg
    - 8_Rear_Right.jpg
  * `03_Interior_Mechanical/`
    - 1_Dashboard.jpg
    - 2_Front_Seats.jpg
    - 3_Rear_Seats.jpg
    - 4_Gear_Lever.jpg
    - 5_Engine_Bay.jpg
  * `04_Damage_Documentation/`
    - 1_[description].jpg
    - 2_[description].jpg
  * `05_Pre_Incident/`
    - 1_[description].jpg
- ✅ All photos present and properly named

---

### **Test 7: Generate All Documents**

**Purpose:** Test bulk generation of all 4 documents

**Steps:**
1. Navigate to a new assessment (or delete existing documents)
2. On Finalize tab, click **Generate All Documents** button
3. Wait for all generations to complete
4. Verify all 4 cards show "Generated" status
5. Verify "Download Complete Package" button appears
6. Test individual downloads for each document

**Expected Result:**
- ✅ Generate All button shows loading state
- ✅ All 4 documents generate successfully
- ✅ All cards show "Generated" status
- ✅ All timestamps display
- ✅ Download Complete Package button appears
- ✅ Individual downloads work for all documents

---

### **Test 8: Regenerate Documents**

**Purpose:** Test document regeneration (overwrite)

**Steps:**
1. On Finalize tab with generated documents
2. Update some assessment data (e.g., add a line item)
3. Click **Regenerate** button on Estimate card
4. Wait for generation
5. Download and verify new estimate includes changes

**Expected Result:**
- ✅ Regenerate button works
- ✅ New PDF overwrites old one
- ✅ Updated data appears in new PDF
- ✅ Timestamp updates

---

### **Test 9: Incomplete Assessment Handling**

**Purpose:** Verify proper handling of incomplete assessments

**Steps:**
1. Navigate to an incomplete assessment (missing required data)
2. Go to Finalize tab
3. Verify completion status shows incomplete
4. Verify Generate All button is disabled
5. Try generating individual documents

**Expected Result:**
- ✅ Completion status shows "X of 9 sections complete"
- ✅ Progress bar shows percentage < 100%
- ✅ Warning message displays
- ✅ Generate All button is disabled
- ✅ Individual generate buttons still work (may produce incomplete PDFs)

---

### **Test 10: Error Handling**

**Purpose:** Test error scenarios

**Test Cases:**
1. **Network Error:** Disconnect internet, try generating
2. **Missing Data:** Generate estimate with no line items
3. **Invalid Assessment ID:** Manually call API with bad ID

**Expected Result:**
- ✅ Error messages display to user
- ✅ Loading states clear properly
- ✅ No crashes or blank screens
- ✅ User can retry after error

---

### **Test 11: Storage Verification**

**Purpose:** Verify files are stored correctly in Supabase

**Steps:**
1. Generate all documents for an assessment
2. Go to Supabase Dashboard → Storage → documents bucket
3. Navigate to `assessments/[assessment_id]/`
4. Verify folder structure:
   - `reports/[assessment_number]_Report.pdf`
   - `estimates/[assessment_number]_Estimate.pdf`
   - `photos/[assessment_number]_Photos.pdf`
   - `photos/[assessment_number]_Photos.zip`
5. Click on a file to verify it's accessible

**Expected Result:**
- ✅ All files present in correct folders
- ✅ Files are publicly accessible
- ✅ File names match assessment number
- ✅ Files can be downloaded from storage

---

### **Test 12: Database Updates**

**Purpose:** Verify assessment records are updated correctly

**Steps:**
1. Generate all documents
2. Check Supabase Dashboard → Table Editor → assessments
3. Find the assessment record
4. Verify fields are populated:
   - `report_pdf_url`
   - `report_pdf_path`
   - `estimate_pdf_url`
   - `estimate_pdf_path`
   - `photos_pdf_url`
   - `photos_pdf_path`
   - `photos_zip_url`
   - `photos_zip_path`
   - `documents_generated_at`
   - `report_number`

**Expected Result:**
- ✅ All URL fields contain valid public URLs
- ✅ All path fields contain correct storage paths
- ✅ Timestamp is set
- ✅ Report number is generated (REP-YYYY-NNNNN)

---

## Common Issues & Solutions

### **Issue: Puppeteer fails to launch**
**Solution:** 
- Windows: Install Chrome/Chromium
- Linux: `sudo apt-get install chromium-browser`
- Check Puppeteer installation: `npm list puppeteer`

### **Issue: Photos not appearing in PDF/ZIP**
**Solution:**
- Verify photo URLs are publicly accessible
- Check Supabase storage permissions
- Ensure photos were uploaded correctly

### **Issue: PDF generation timeout**
**Solution:**
- Increase timeout in API endpoints
- Check server resources
- Reduce photo sizes if very large

### **Issue: Storage upload fails**
**Solution:**
- Verify storage bucket exists
- Check RLS policies
- Verify Supabase credentials

---

## Performance Benchmarks

**Expected Generation Times:**
- Report PDF: 3-5 seconds
- Estimate PDF: 2-4 seconds
- Photos PDF: 5-10 seconds (depends on photo count)
- Photos ZIP: 5-15 seconds (depends on photo count)
- All Documents: 15-30 seconds

---

## Success Criteria

✅ All 12 tests pass
✅ PDFs are professionally formatted
✅ Company branding appears correctly
✅ All data is accurate
✅ Downloads work reliably
✅ Storage is organized properly
✅ Error handling is graceful
✅ Performance is acceptable

---

## Next Steps After Testing

1. **If all tests pass:**
   - Mark Phase 2 complete
   - Update documentation
   - Deploy to production

2. **If issues found:**
   - Document issues
   - Create bug fixes
   - Re-test affected areas

---

**Testing Status:** Ready for Testing
**Last Updated:** 2025-10-12

