# Storage Refactor Implementation Plan

## 🎯 Objective
Implement private storage for both photos and documents while avoiding CORS/ORB issues by using an authenticated proxy endpoint for photos.

## 📋 Current State Analysis

### Problems Identified
1. ❌ Photos being uploaded to `documents` bucket instead of `SVA Photos`
2. ❌ Both buckets are PRIVATE but code uses signed URLs in `<img>` tags → ERR_BLOCKED_BY_ORB
3. ❌ `storage.service.ts` DEFAULT_BUCKET is `'documents'` (should be `'SVA Photos'`)
4. ❌ Duplicate/conflicting storage policies in database
5. ❌ Existing photo URLs in database are signed URLs that expire after 1 hour

### Current Architecture
```
Photo Upload → storage.service.ts → documents bucket (WRONG)
                                   → Returns signed URL
                                   → <img src="signed-url"> → ERR_BLOCKED_BY_ORB

PDF Generation → API endpoint → documents bucket (CORRECT)
                              → Returns signed URL
                              → window.open(signed-url) → Works (download)
```

## 🎯 Target Architecture

### New Flow
```
Photo Upload → storage.service.ts → SVA Photos bucket (PRIVATE)
                                   → Returns storage path
                                   → <img src="/api/photo/{path}">
                                   → Proxy endpoint authenticates & streams
                                   → Browser displays image (same-origin)

PDF Generation → API endpoint → documents bucket (PRIVATE)
                              → Returns signed URL
                              → window.open(signed-url) → Works (download)
```

### Key Principles
1. ✅ Both buckets stay PRIVATE (secure)
2. ✅ Photos use authenticated proxy endpoint (no CORS issues)
3. ✅ PDFs use signed URLs (direct download, no embedding)
4. ✅ RLS enforced on both buckets
5. ✅ Proper caching for performance

## 📝 Implementation Steps

### Phase 1: Create Authenticated Photo Proxy Endpoint

**File:** `src/routes/api/photo/[...path]/+server.ts`

**Requirements:**
- Accept any path as parameter (catch-all route)
- Authenticate user via `locals.supabase`
- Download photo from `SVA Photos` bucket
- Stream response with proper headers:
  - `Content-Type`: Detect from file extension (jpeg, png, webp)
  - `Cache-Control`: `private, max-age=3600` (1 hour browser cache)
  - `ETag`: For conditional requests
- Handle errors gracefully (404, 403, 500)
- Support range requests for large images (optional optimization)

**Security:**
- RLS policies on `SVA Photos` bucket enforce access control
- Only authenticated users can access
- Server-side download uses `locals.supabase` (has user session)

---

### Phase 2: Update Storage Service

**File:** `src/lib/services/storage.service.ts`

**Changes:**
1. Change `DEFAULT_BUCKET` from `'documents'` to `'SVA Photos'`
2. Update `uploadPhoto()` method:
   - For `SVA Photos` bucket: Return `{ url: path, path }` (path only, no signed URL)
   - For `documents` bucket: Keep signed URL behavior (for PDFs)
3. Update `uploadAssessmentPhoto()`: Uses default bucket (now SVA Photos)
4. Keep `getSignedUrl()` method for documents bucket only
5. Add helper method `getPhotoUrl(path: string): string` that returns `/api/photo/{path}`

**Backward Compatibility:**
- Keep `supabaseClient` parameter for dependency injection
- Maintain existing method signatures
- Add new methods, don't break existing ones

---

### Phase 3: Update PhotoUpload Component

**File:** `src/lib/components/forms/PhotoUpload.svelte`

**Changes:**
1. Update photo display logic:
   - If `currentPhotoUrl` contains `/storage/v1/object/` → use proxy: `/api/photo/{extractPath(url)}`
   - If `currentPhotoUrl` is already a path → use proxy: `/api/photo/{path}`
   - If `currentPhotoUrl` starts with `/api/photo/` → use as-is
2. After upload, set `currentPhotoUrl` to `/api/photo/{result.path}`
3. Update preview display to use new URL format
4. Add error handling for 404/403 responses

**Helper Function:**
```typescript
function getPhotoDisplayUrl(urlOrPath: string): string {
  if (!urlOrPath) return '';
  if (urlOrPath.startsWith('/api/photo/')) return urlOrPath;
  if (urlOrPath.includes('/storage/v1/object/')) {
    // Extract path from signed URL
    const match = urlOrPath.match(/\/storage\/v1\/object\/(?:sign|public)\/([^?]+)/);
    return match ? `/api/photo/${match[1]}` : urlOrPath;
  }
  // Assume it's a storage path
  return `/api/photo/${urlOrPath}`;
}
```

---

### Phase 4: Update Assessment Tab Components

**Files to Update:**
- `src/lib/components/assessment/VehicleIdentificationTab.svelte`
- `src/lib/components/assessment/Exterior360Tab.svelte`
- `src/lib/components/assessment/InteriorMechanicalTab.svelte`
- `src/lib/components/assessment/TyresTab.svelte`
- `src/lib/components/assessment/DamageTab.svelte`

**Changes:**
- All these components use `PhotoUpload` component
- No direct changes needed if PhotoUpload handles URL transformation
- Verify they pass correct props to PhotoUpload
- Test photo display after refactor

---

### Phase 5: Update Photo Panel Components

**Files to Update:**
- `src/lib/components/assessment/EstimatePhotosPanel.svelte`
- `src/lib/components/assessment/AdditionalsPhotosPanel.svelte`
- `src/lib/components/assessment/PreIncidentPhotosPanel.svelte`

**Changes:**
1. Update photo display in gallery:
   ```svelte
   <img src={getPhotoDisplayUrl(photo.photo_url)} alt={photo.label} />
   ```
2. Add the same `getPhotoDisplayUrl()` helper function
3. Update photo upload to store paths instead of signed URLs
4. Test multi-photo upload and display

---

### Phase 6: Database Migration for Existing Photos

**File:** `supabase/migrations/048_update_photo_urls_to_paths.sql`

**Purpose:** Convert existing signed URLs to storage paths

**Tables to Update:**
- `assessment_vehicle_identification` (5 photo columns)
- `assessment_360_exterior` (8 photo columns)
- `assessment_interior_mechanical` (8 photo columns)
- `assessment_tyres` (3 photo columns per row)
- `assessment_damage` (photos array)
- `estimate_photos` (photo_url column)
- `pre_incident_estimate_photos` (photo_url column)
- `assessment_additionals_photos` (photo_url column)

**Migration Logic:**
```sql
-- Example for assessment_vehicle_identification
UPDATE assessment_vehicle_identification
SET 
  registration_photo_url = regexp_replace(
    registration_photo_url, 
    '^https://[^/]+/storage/v1/object/(?:sign|public)/([^?]+).*$', 
    '\1'
  )
WHERE registration_photo_url LIKE '%/storage/v1/object/%';
```

**Repeat for all photo columns in all tables**

---

### Phase 7: Update Document Generation Endpoints

**Files to Update:**
- `src/routes/api/generate-report/+server.ts`
- `src/routes/api/generate-estimate/+server.ts`
- `src/routes/api/generate-photos-pdf/+server.ts`
- `src/routes/api/generate-photos-zip/+server.ts`
- `src/routes/api/generate-frc-report/+server.ts`

**Changes:**
1. **For PDF generation (documents bucket):**
   - Keep using `createSignedUrl()` ✅ (correct behavior)
   - Store signed URL in database for immediate download
   
2. **For photo fetching (when generating photo PDFs/ZIPs):**
   - Use `locals.supabase.storage.from('SVA Photos').download(path)`
   - Don't use signed URLs for photos in server-side code
   - Server can directly download from private bucket

**Example:**
```typescript
// OLD (causes issues):
const { data: signedUrl } = await supabase.storage
  .from('SVA Photos')
  .createSignedUrl(photoPath, 60);
const response = await fetch(signedUrl); // May fail with CORS

// NEW (works):
const { data: photoBlob } = await locals.supabase.storage
  .from('SVA Photos')
  .download(photoPath);
// Use photoBlob directly
```

---

### Phase 8: Clean Up Storage Policies

**File:** `supabase/migrations/049_cleanup_storage_policies.sql`

**Actions:**
1. Drop all duplicate policies
2. Keep only these policies per bucket:
   - `Authenticated users can read {bucket}`
   - `Authenticated users can upload {bucket}`
   - `Authenticated users can update {bucket}`
   - `Authenticated users can delete {bucket}`
3. Remove development "Allow all operations" policy (production)
4. Remove old "Allow public read access" policies

**SQL:**
```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
-- ... (drop all)

-- Create clean policies for documents bucket
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

-- ... (repeat for INSERT, UPDATE, DELETE)

-- Create clean policies for SVA Photos bucket
CREATE POLICY "Authenticated users can read photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'SVA Photos');

-- ... (repeat for INSERT, UPDATE, DELETE)
```

---

## 🧪 Testing Plan

### Test 1: Photo Upload
1. Login as authenticated user
2. Navigate to assessment → Vehicle ID tab
3. Upload registration photo
4. ✅ Verify photo uploads to `SVA Photos` bucket
5. ✅ Verify photo displays correctly via `/api/photo/` endpoint
6. ✅ Check browser network tab: status 200, proper headers

### Test 2: Photo Display
1. Open existing assessment with photos
2. ✅ Verify all photos display correctly
3. ✅ Check browser console: no CORS/ORB errors
4. ✅ Verify photos load from `/api/photo/` endpoint

### Test 3: Document Generation
1. Generate inspection report PDF
2. ✅ Verify PDF generates successfully
3. ✅ Verify download button works
4. ✅ Verify PDF opens correctly

### Test 4: Photo PDF Generation
1. Generate photos PDF
2. ✅ Verify all photos included in PDF
3. ✅ Verify PDF downloads successfully

### Test 5: Performance
1. Load assessment with 20+ photos
2. ✅ Verify photos load quickly
3. ✅ Check browser cache (reload page, photos from cache)
4. ✅ Monitor server load

### Test 6: Security
1. Logout and try accessing `/api/photo/{path}` directly
2. ✅ Verify 401/403 response
3. Login as different user
4. ✅ Verify RLS policies enforce access control

---

## 📊 Rollout Strategy

### Development
1. Apply all changes in feature branch
2. Test thoroughly with existing data
3. Verify migration works on dev database

### Staging
1. Backup database
2. Run migration on staging
3. Test all photo/document functionality
4. Performance testing

### Production
1. Schedule maintenance window (if needed)
2. Backup database
3. Run migration
4. Deploy new code
5. Monitor for errors
6. Rollback plan ready

---

## 🔄 Rollback Plan

If issues occur:

1. **Code Rollback:** Revert to previous deployment
2. **Database Rollback:** 
   ```sql
   -- Restore photo URLs from backup
   -- OR regenerate signed URLs for all photos
   ```
3. **Bucket Rollback:** Change buckets back to PUBLIC (temporary)

---

## 📈 Performance Considerations

### Caching Strategy
- **Browser Cache:** 1 hour (`Cache-Control: private, max-age=3600`)
- **CDN Cache:** Not applicable (private content)
- **Server Cache:** Consider adding Redis cache for frequently accessed photos

### Optimization Opportunities
1. Image resizing on-the-fly (thumbnail generation)
2. WebP conversion for better compression
3. Lazy loading for photo galleries
4. Progressive image loading

---

## ✅ Success Criteria

- [ ] All photos upload to `SVA Photos` bucket
- [ ] All photos display correctly via proxy endpoint
- [ ] No CORS/ORB errors in browser console
- [ ] PDFs generate and download successfully
- [ ] Photo PDFs include all photos correctly
- [ ] Performance is acceptable (photos load < 1s)
- [ ] Security: Only authenticated users can access photos
- [ ] RLS policies enforced correctly
- [ ] No duplicate storage policies
- [ ] All existing photos migrated successfully

---

## 🚀 Ready to Implement!

This plan provides a comprehensive, production-ready solution for private storage with authenticated access while avoiding CORS/ORB issues.

