# PDF & Storage Patterns - ClaimTech

Production-ready patterns for PDF generation with Puppeteer and secure file storage with Supabase.

---

## Core Principles

### 1. Never Expose Signed URLs Directly

**✅ CORRECT: Proxy endpoint**

```typescript
// GET /api/document/[...path]
export async function GET({ params, locals }) {
  const storage = createStorageService(locals.supabase);
  const url = await storage.getSignedUrl('documents', params.path);

  return new Response(null, {
    status: 302,
    headers: { Location: url }
  });
}
```

**❌ WRONG: Return signed URL to client**

```typescript
// ❌ Don't return signed URL directly
return json({ url: signedUrl });
```

### 2. Use Storage Service (ServiceClient Pattern)

```typescript
import { createStorageService } from '$lib/services/storage.service';

const storage = createStorageService(locals.supabase);
await storage.upload('documents', path, file);
```

### 3. Render HTML with Svelte, Generate PDF with Puppeteer

```typescript
import { render } from 'svelte/server';
import ReportTemplate from '$lib/templates/report-template.svelte';

const { html } = render(ReportTemplate, { props: { data } });
const pdfBuffer = await generatePDF(html);
```

---

## Storage Service

### Storage Service Implementation

```typescript
// src/lib/services/storage.service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

export class StorageService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Upload file to storage bucket
   */
  async upload(
    bucket: 'documents' | 'SVA Photos',
    path: string,
    file: File | Buffer | ArrayBuffer,
    options: {
      contentType?: string;
      upsert?: boolean;
    } = {}
  ): Promise<{ path: string }> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options.contentType,
        upsert: options.upsert ?? false
      });

    if (error) throw error;
    return data;
  }

  /**
   * Get signed URL for file (expires in 1 hour)
   */
  async getSignedUrl(
    bucket: 'documents' | 'SVA Photos',
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }

  /**
   * Delete file from storage
   */
  async delete(
    bucket: 'documents' | 'SVA Photos',
    paths: string | string[]
  ): Promise<void> {
    const pathsArray = Array.isArray(paths) ? paths : [paths];

    const { error } = await this.supabase.storage
      .from(bucket)
      .remove(pathsArray);

    if (error) throw error;
  }

  /**
   * List files in a folder
   */
  async list(
    bucket: 'documents' | 'SVA Photos',
    path: string
  ): Promise<Array<{ name: string; id: string; metadata: any }>> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(path);

    if (error) throw error;
    return data;
  }

  /**
   * Move/rename file
   */
  async move(
    bucket: 'documents' | 'SVA Photos',
    fromPath: string,
    toPath: string
  ): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .move(fromPath, toPath);

    if (error) throw error;
  }
}

export const createStorageService = (supabase: SupabaseClient<Database>) =>
  new StorageService(supabase);
```

### Proxy Endpoint for Document Access

```typescript
// src/routes/api/document/[...path]/+server.ts
import { error } from '@sveltejs/kit';
import { createStorageService } from '$lib/services/storage.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const storage = createStorageService(locals.supabase);

    // Get signed URL (expires in 1 hour)
    const signedUrl = await storage.getSignedUrl('documents', params.path);

    // Redirect to signed URL
    return new Response(null, {
      status: 302,
      headers: {
        Location: signedUrl
      }
    });
  } catch (err) {
    console.error('Failed to get document:', err);
    throw error(404, 'Document not found');
  }
};
```

### Proxy Endpoint for Photo Access

```typescript
// src/routes/api/photo/[...path]/+server.ts
import { error } from '@sveltejs/kit';
import { createStorageService } from '$lib/services/storage.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const storage = createStorageService(locals.supabase);

    // Get signed URL (expires in 1 hour)
    const signedUrl = await storage.getSignedUrl('SVA Photos', params.path);

    // Redirect to signed URL
    return new Response(null, {
      status: 302,
      headers: {
        Location: signedUrl
      }
    });
  } catch (err) {
    console.error('Failed to get photo:', err);
    throw error(404, 'Photo not found');
  }
};
```

---

## File Upload

### Upload Form Component

```svelte
<!-- src/lib/components/FileUpload.svelte -->
<script lang="ts">
  type Props = {
    accept?: string;
    multiple?: boolean;
    onUpload?: (files: File[]) => void;
  };

  let { accept = '*', multiple = false, onUpload }: Props = $props();

  let uploading = $state(false);
  let error = $state<string | null>(null);

  async function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    if (files.length === 0) return;

    uploading = true;
    error = null;

    try {
      onUpload?.(files);
    } catch (err) {
      console.error('Upload failed:', err);
      error = 'Upload failed. Please try again.';
    } finally {
      uploading = false;
    }
  }
</script>

<div class="file-upload">
  <input
    type="file"
    {accept}
    {multiple}
    onchange={handleFileChange}
    disabled={uploading}
  />

  {#if uploading}
    <p class="uploading">Uploading...</p>
  {/if}

  {#if error}
    <p class="error">{error}</p>
  {/if}
</div>
```

### Upload Handler (Server Action)

```typescript
// src/routes/assessment/[id]/photos/+page.server.ts
import { fail } from '@sveltejs/kit';
import { createStorageService } from '$lib/services/storage.service';
import type { Actions } from './$types';

export const actions: Actions = {
  upload: async ({ request, params, locals }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return fail(400, { error: 'No file provided' });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return fail(400, { error: 'Only image files are allowed' });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return fail(400, { error: 'File size must be less than 10MB' });
    }

    try {
      const storage = createStorageService(locals.supabase);

      // Generate unique filename
      const timestamp = Date.now();
      const ext = file.name.split('.').pop();
      const filename = `${timestamp}.${ext}`;
      const path = `assessments/${params.id}/photos/${filename}`;

      // Upload to storage
      await storage.upload('SVA Photos', path, file, {
        contentType: file.type
      });

      // Save photo record to database
      const { error: dbError } = await locals.supabase
        .from('assessment_photos')
        .insert({
          assessment_id: params.id,
          path,
          filename: file.name
        });

      if (dbError) throw dbError;

      return { success: true, path };
    } catch (error) {
      console.error('Upload failed:', error);
      return fail(500, { error: 'Upload failed' });
    }
  }
};
```

### Photo Upload with Progress

```typescript
// src/routes/api/upload-photo/+server.ts
import { json, error } from '@sveltejs/kit';
import { createStorageService } from '$lib/services/storage.service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const assessmentId = formData.get('assessment_id')?.toString();

    if (!file || !assessmentId) {
      throw error(400, 'Missing required fields');
    }

    const storage = createStorageService(locals.supabase);

    // Generate path
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const path = `assessments/${assessmentId}/photos/${timestamp}.${ext}`;

    // Upload
    await storage.upload('SVA Photos', path, file, {
      contentType: file.type
    });

    // Save to database
    const { data: photo, error: dbError } = await locals.supabase
      .from('assessment_photos')
      .insert({ assessment_id: assessmentId, path })
      .select()
      .single();

    if (dbError) throw dbError;

    return json({ success: true, photo });
  } catch (err) {
    console.error('Upload error:', err);
    throw error(500, 'Upload failed');
  }
};
```

---

## PDF Generation

### PDF Generator Utility

```typescript
// src/lib/utils/pdf-generator.ts
import puppeteer from 'puppeteer';

export interface PDFOptions {
  format?: 'A4' | 'Letter';
  landscape?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

export async function generatePDF(
  html: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: options.format || 'A4',
      landscape: options.landscape || false,
      margin: options.margin || {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      displayHeaderFooter: options.displayHeaderFooter || false,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || '',
      printBackground: true
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
```

### HTML Template Component

```svelte
<!-- src/lib/templates/assessment-report-template.svelte -->
<script lang="ts">
  import type { Database } from '$lib/types/database.types';

  type Assessment = Database['public']['Tables']['assessments']['Row'];
  type Request = Database['public']['Tables']['requests']['Row'];

  type Props = {
    assessment: Assessment;
    request: Request;
    estimates: any;
  };

  let { assessment, request, estimates }: Props = $props();
</script>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Assessment Report</title>
    <style>
      @import 'tailwindcss/base';
      @import 'tailwindcss/components';
      @import 'tailwindcss/utilities';

      body {
        font-family: 'Helvetica', 'Arial', sans-serif;
        padding: 2rem;
      }

      .header {
        text-align: center;
        margin-bottom: 2rem;
        border-bottom: 2px solid #000;
        padding-bottom: 1rem;
      }

      .section {
        margin-bottom: 2rem;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th, td {
        border: 1px solid #ddd;
        padding: 0.5rem;
        text-align: left;
      }

      th {
        background-color: #f3f4f6;
        font-weight: bold;
      }

      @media print {
        body {
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Vehicle Assessment Report</h1>
      <p>Assessment ID: {assessment.id}</p>
      <p>Date: {new Date(assessment.created_at).toLocaleDateString()}</p>
    </div>

    <div class="section">
      <h2>Vehicle Information</h2>
      <table>
        <tr>
          <th>Make</th>
          <td>{request.vehicle_make}</td>
        </tr>
        <tr>
          <th>Model</th>
          <td>{request.vehicle_model}</td>
        </tr>
        <tr>
          <th>Registration</th>
          <td>{request.registration_number}</td>
        </tr>
        <tr>
          <th>Year</th>
          <td>{request.vehicle_year}</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <h2>Damage Summary</h2>
      <p>{assessment.damage_summary || 'No damage summary available'}</p>
    </div>

    <div class="section">
      <h2>Estimate Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Part Price</th>
            <th>Labour</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {#each estimates.line_items as item}
            <tr>
              <td>{item.description}</td>
              <td>R {item.part_price.toFixed(2)}</td>
              <td>R {(item.labour_hours * item.labour_rate).toFixed(2)}</td>
              <td>R {(item.part_price + item.labour_hours * item.labour_rate).toFixed(2)}</td>
            </tr>
          {/each}
          <tr>
            <th colspan="3">Grand Total</th>
            <th>R {estimates.grand_total.toFixed(2)}</th>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <p>
        <small>
          This report was generated on {new Date().toLocaleDateString()}
          by ClaimTech Assessment Platform.
        </small>
      </p>
    </div>
  </body>
</html>
```

### PDF Generation Endpoint

```typescript
// src/routes/api/generate-report/+server.ts
import { error, json } from '@sveltejs/kit';
import { render } from 'svelte/server';
import { generatePDF } from '$lib/utils/pdf-generator';
import { createStorageService } from '$lib/services/storage.service';
import AssessmentReportTemplate from '$lib/templates/assessment-report-template.svelte';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { assessmentId } = await request.json();

    if (!assessmentId) {
      throw error(400, 'Assessment ID is required');
    }

    // Fetch assessment data
    const { data: assessment } = await locals.supabase
      .from('assessments')
      .select(`
        *,
        request:requests(*),
        estimates:assessment_estimates(*)
      `)
      .eq('id', assessmentId)
      .single();

    if (!assessment) {
      throw error(404, 'Assessment not found');
    }

    // Render HTML template
    const { html } = render(AssessmentReportTemplate, {
      props: {
        assessment,
        request: assessment.request,
        estimates: assessment.estimates
      }
    });

    // Generate PDF
    const pdfBuffer = await generatePDF(html, {
      format: 'A4',
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm'
      }
    });

    // Upload to storage
    const storage = createStorageService(locals.supabase);
    const timestamp = Date.now();
    const path = `assessments/${assessmentId}/reports/report-${timestamp}.pdf`;

    await storage.upload('documents', path, pdfBuffer, {
      contentType: 'application/pdf'
    });

    // Save document record
    const { data: document } = await locals.supabase
      .from('documents')
      .insert({
        assessment_id: assessmentId,
        path,
        type: 'assessment_report',
        filename: `Assessment-${assessmentId}-Report.pdf`
      })
      .select()
      .single();

    return json({
      success: true,
      document,
      downloadUrl: `/api/document/${path}`
    });
  } catch (err) {
    console.error('PDF generation failed:', err);
    throw error(500, 'Failed to generate report');
  }
};
```

---

## ClaimTech-Specific Patterns

### Assessment Photos Export (ZIP)

```typescript
// src/routes/api/export-photos/+server.ts
import { error } from '@sveltejs/kit';
import archiver from 'archiver';
import { createStorageService } from '$lib/services/storage.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const assessmentId = url.searchParams.get('assessment_id');

    if (!assessmentId) {
      throw error(400, 'Assessment ID is required');
    }

    // Fetch all photos for assessment
    const { data: photos } = await locals.supabase
      .from('assessment_photos')
      .select('*')
      .eq('assessment_id', assessmentId);

    if (!photos || photos.length === 0) {
      throw error(404, 'No photos found');
    }

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    const storage = createStorageService(locals.supabase);

    // Add each photo to archive
    for (const photo of photos) {
      const signedUrl = await storage.getSignedUrl('SVA Photos', photo.path);

      // Fetch photo from signed URL
      const response = await fetch(signedUrl);
      const buffer = await response.arrayBuffer();

      archive.append(Buffer.from(buffer), {
        name: photo.filename || `photo-${photo.id}.jpg`
      });
    }

    // Finalize archive
    await archive.finalize();

    // Return as downloadable ZIP
    return new Response(archive as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="assessment-${assessmentId}-photos.zip"`
      }
    });
  } catch (err) {
    console.error('Photo export failed:', err);
    throw error(500, 'Failed to export photos');
  }
};
```

### Bulk Document Download

```typescript
// src/routes/assessment/[id]/documents/download/+server.ts
import { error } from '@sveltejs/kit';
import { createStorageService } from '$lib/services/storage.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, locals }) => {
  try {
    const documentId = url.searchParams.get('document_id');

    if (!documentId) {
      throw error(400, 'Document ID is required');
    }

    // Fetch document
    const { data: document } = await locals.supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('assessment_id', params.id)
      .single();

    if (!document) {
      throw error(404, 'Document not found');
    }

    // Get signed URL
    const storage = createStorageService(locals.supabase);
    const signedUrl = await storage.getSignedUrl('documents', document.path);

    // Fetch file
    const response = await fetch(signedUrl);
    const buffer = await response.arrayBuffer();

    // Return file
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.filename}"`
      }
    });
  } catch (err) {
    console.error('Download failed:', err);
    throw error(500, 'Failed to download document');
  }
};
```

---

## Best Practices

### ✅ DO

1. **Use proxy endpoints for file access**
   ```typescript
   // Redirect to signed URL, don't return it
   return new Response(null, {
     status: 302,
     headers: { Location: signedUrl }
   });
   ```

2. **Use storage service pattern**
   ```typescript
   const storage = createStorageService(locals.supabase);
   await storage.upload('documents', path, file);
   ```

3. **Validate file uploads**
   ```typescript
   if (!file.type.startsWith('image/')) {
     return fail(400, { error: 'Only images allowed' });
   }
   if (file.size > maxSize) {
     return fail(400, { error: 'File too large' });
   }
   ```

4. **Generate unique filenames**
   ```typescript
   const timestamp = Date.now();
   const filename = `${timestamp}.${ext}`;
   ```

5. **Use Tailwind in PDF templates**
   ```html
   <style>
     @import 'tailwindcss/base';
     @import 'tailwindcss/components';
     @import 'tailwindcss/utilities';
   </style>
   ```

### ❌ DON'T

1. **Don't expose signed URLs to client**
   ```typescript
   // ❌ WRONG
   return json({ url: signedUrl });
   ```

2. **Don't skip file validation**
   ```typescript
   // ❌ WRONG
   await storage.upload('documents', path, file); // No validation
   ```

3. **Don't hardcode bucket names**
   ```typescript
   // ❌ WRONG
   .from('SVA Photos') // Use type-safe constants instead
   ```

4. **Don't forget to set content type**
   ```typescript
   // ❌ WRONG
   await storage.upload(bucket, path, file); // Missing contentType
   ```

---

**Reference**: See `.agent/System/project_architecture.md#pdf-generation-workflow` for architecture details
