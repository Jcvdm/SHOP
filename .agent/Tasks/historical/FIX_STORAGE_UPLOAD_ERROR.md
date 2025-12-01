# Fix: Storage Upload Error

## Problem

PDF generation works (Puppeteer test passes), but upload to Supabase Storage fails with:
```
Error: Failed to upload PDF to storage
```

## Root Cause

The Supabase Storage bucket `documents` exists but doesn't have the correct RLS (Row Level Security) policies to allow uploads from the API endpoints.

The API endpoints use the `anon` key (PUBLIC_SUPABASE_ANON_KEY), which by default doesn't have permission to upload files.

---

## Solution Options

### Option 1: Fix Storage Policies (RECOMMENDED - Simplest)

Add RLS policies to allow the `anon` role to upload to the `documents` bucket.

#### Steps:

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard/project/cfblmkzleqtvtfxujikf
   - Navigate to: Storage → Policies

2. **Run the SQL Script**
   - Go to: SQL Editor
   - Copy and paste the contents of `fix-storage-policies.sql`
   - Click "Run"

3. **Verify Policies**
   The script creates these policies:
   - ✅ Allow authenticated uploads
   - ✅ Allow anon uploads (for API endpoints)
   - ✅ Allow authenticated updates
   - ✅ Allow anon updates (for API endpoints)
   - ✅ Allow public reads
   - ✅ Allow authenticated deletes

4. **Test Again**
   - Try generating a document
   - Should now work!

---

### Option 2: Use Service Role Key (More Secure)

Use the service role key for server-side API endpoints, which bypasses RLS.

#### Steps:

1. **Get Service Role Key**
   - Go to: Supabase Dashboard → Project Settings → API
   - Copy the `service_role` key (secret key)
   - **WARNING:** Never expose this key to the browser!

2. **Add to .env**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Update API Endpoints**
   Replace:
   ```typescript
   import { supabase } from '$lib/supabase';
   ```
   
   With:
   ```typescript
   import { supabaseServer } from '$lib/supabase-server';
   ```
   
   Then use `supabaseServer` instead of `supabase` for storage operations.

4. **Files to Update**
   - `src/routes/api/generate-report/+server.ts`
   - `src/routes/api/generate-estimate/+server.ts`
   - `src/routes/api/generate-photos-pdf/+server.ts`
   - `src/routes/api/generate-photos-zip/+server.ts`

---

## Quick Fix (Choose One)

### Quick Fix A: Run SQL (30 seconds)

```sql
-- Copy this entire block and run in Supabase SQL Editor

-- Allow anon role to upload to documents bucket
CREATE POLICY "Allow anon uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'documents');

-- Allow anon role to update files in documents bucket
CREATE POLICY "Allow anon updates"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');
```

### Quick Fix B: Make Bucket Public (Not Recommended for Production)

1. Go to: Storage → documents bucket → Settings
2. Toggle "Public bucket" to ON
3. This allows anyone to upload (security risk!)

---

## Testing

After applying the fix:

1. **Test Document Generation**
   ```bash
   # In browser, go to any assessment
   # Click Finalize tab
   # Click "Generate" on any document
   ```

2. **Check Server Logs**
   Look for:
   ```
   Uploading PDF to storage...
   File path: assessments/xxx/reports/xxx.pdf
   PDF size: 88138 bytes
   PDF uploaded successfully: { path: '...' }
   ```

3. **Verify in Supabase**
   - Go to: Storage → documents
   - Should see: `assessments/{id}/reports/{filename}.pdf`

---

## Debugging

If it still fails after applying the fix:

### Check 1: Verify Policies Exist
```sql
-- Run in SQL Editor
SELECT 
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%anon%';
```

Should return:
- `Allow anon uploads` | `{anon}` | `INSERT`
- `Allow anon updates` | `{anon}` | `UPDATE`

### Check 2: Check Bucket Configuration
```sql
-- Run in SQL Editor
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'documents';
```

Should return:
- `documents` | `documents` | `true` | `null`

### Check 3: Test Upload Manually
```typescript
// In browser console (on your app page)
const { data, error } = await supabase.storage
  .from('documents')
  .upload('test.txt', new Blob(['test']), {
    contentType: 'text/plain',
    upsert: true
  });

console.log('Upload result:', { data, error });
```

If this works, the policies are correct.

### Check 4: Verify Anon Key
```bash
# Check .env file
cat .env | grep ANON_KEY
```

Make sure it matches the key in Supabase Dashboard → Project Settings → API.

---

## Why This Happened

1. **Supabase Storage has RLS enabled by default**
   - Protects against unauthorized uploads
   - Requires explicit policies

2. **API endpoints use anon key**
   - For security, we use the public anon key
   - This key has limited permissions by default

3. **Bucket was created without policies**
   - The `documents` bucket was created
   - But no policies were added for the anon role

---

## Prevention

When creating new storage buckets:

1. **Always add policies immediately**
2. **Test uploads before deploying**
3. **Document required policies**

---

## Summary

**Problem:** PDF generates but upload fails  
**Cause:** Missing storage policies for anon role  
**Solution:** Run `fix-storage-policies.sql` in Supabase SQL Editor  
**Time:** 30 seconds  
**Result:** Document generation will work  

---

## Next Steps

After fixing:

1. ✅ Test all 4 document types
2. ✅ Verify files appear in Storage
3. ✅ Test download functionality
4. ✅ Check PDF quality

Then you're production-ready! 🚀

