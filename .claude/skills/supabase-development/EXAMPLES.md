# Real Code Examples from ClaimTech

This document contains copy-paste ready examples from the actual ClaimTech codebase.

## Table of Contents
1. [Complete Service Class](#complete-service-class)
2. [Migration Examples](#migration-examples)
3. [RLS Policy Examples](#rls-policy-examples)
4. [Storage Service Examples](#storage-service-examples)
5. [Query Examples](#query-examples)
6. [Type Definitions](#type-definitions)

---

## Complete Service Class

### Assessment Service (Real Example)

From `src/lib/services/assessment.service.ts`:

```typescript
import { supabase } from '$lib/supabase';
import type {
  Assessment,
  CreateAssessmentInput,
  UpdateAssessmentInput
} from '$lib/types/assessment';
import type { ServiceClient } from '$lib/types/service';
import { auditService } from './audit.service';

export class AssessmentService {
  /**
   * Generate unique assessment number (ASM-2025-001)
   */
  private async generateAssessmentNumber(client?: ServiceClient): Promise<string> {
    const db = client ?? supabase;
    const year = new Date().getFullYear();

    const { count, error } = await db
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .like('assessment_number', `ASM-${year}-%`);

    if (error) {
      console.error('Error counting assessments:', error);
      throw new Error(`Failed to generate assessment number: ${error.message}`);
    }

    const nextNumber = (count || 0) + 1;
    return `ASM-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

  /**
   * Create new assessment from appointment
   */
  async createAssessment(input: CreateAssessmentInput, client?: ServiceClient): Promise<Assessment> {
    const db = client ?? supabase;
    const assessmentNumber = await this.generateAssessmentNumber(client);

    const { data, error } = await db
      .from('assessments')
      .insert({
        ...input,
        assessment_number: assessmentNumber,
        status: 'in_progress',
        current_tab: 'identification',
        tabs_completed: []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assessment:', error);
      throw new Error(`Failed to create assessment: ${error.message}`);
    }

    // Log audit trail
    try {
      await auditService.logChange({
        entity_type: 'assessment',
        entity_id: data.id,
        action: 'created',
        new_value: assessmentNumber
      });
    } catch (auditError) {
      console.error('Error logging audit change:', auditError);
    }

    return data;
  }

  /**
   * Get assessment by ID
   */
  async getAssessment(id: string, client?: ServiceClient): Promise<Assessment | null> {
    const db = client ?? supabase;
    const { data, error } = await db
      .from('assessments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching assessment:', error);
      return null;
    }

    return data;
  }

  /**
   * Get assessment by appointment ID
   */
  async getAssessmentByAppointment(appointmentId: string, client?: ServiceClient): Promise<Assessment | null> {
    const db = client ?? supabase;
    const { data, error } = await db
      .from('assessments')
      .select('*')
      .eq('appointment_id', appointmentId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching assessment:', error);
      return null;
    }

    return data;
  }

  /**
   * Get all in-progress assessments with related data
   */
  async getInProgressAssessments(client?: ServiceClient): Promise<any[]> {
    const db = client ?? supabase;

    const { data, error } = await db
      .from('assessments')
      .select(`
        *,
        vehicle_identification:assessment_vehicle_identification(
          registration_number,
          make,
          model,
          year
        ),
        requests:request_id(request_number),
        appointments:appointment_id(
          appointment_number,
          appointment_date,
          engineers:assigned_engineer_id(name)
        )
      `)
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching in-progress assessments:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Update assessment
   */
  async updateAssessment(
    id: string,
    input: UpdateAssessmentInput,
    client?: ServiceClient
  ): Promise<Assessment> {
    const db = client ?? supabase;

    // Get old state for audit logging
    const oldAssessment = await this.getAssessment(id, client);

    const { data, error } = await db
      .from('assessments')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating assessment:', error);
      throw new Error(`Failed to update assessment: ${error.message}`);
    }

    // Log status changes
    if (input.status && oldAssessment && input.status !== oldAssessment.status) {
      try {
        await auditService.logChange({
          entity_type: 'assessment',
          entity_id: id,
          action: 'status_changed',
          field_name: 'status',
          old_value: oldAssessment.status,
          new_value: input.status
        });
      } catch (auditError) {
        console.error('Error logging audit change:', auditError);
      }
    }

    return data;
  }

  /**
   * Mark tab as completed
   */
  async markTabCompleted(
    id: string,
    tabName: string,
    client?: ServiceClient
  ): Promise<void> {
    const db = client ?? supabase;
    const assessment = await this.getAssessment(id, client);

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const tabsCompleted = assessment.tabs_completed || [];
    if (!tabsCompleted.includes(tabName)) {
      tabsCompleted.push(tabName);

      await db
        .from('assessments')
        .update({ tabs_completed: tabsCompleted })
        .eq('id', id);
    }
  }

  /**
   * Finalize assessment (make it read-only)
   */
  async finalizeAssessment(
    id: string,
    finalizedBy: string,
    client?: ServiceClient
  ): Promise<Assessment> {
    const db = client ?? supabase;

    const { data, error } = await db
      .from('assessments')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        estimate_finalized_at: new Date().toISOString(),
        estimate_finalized_by: finalizedBy
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error finalizing assessment:', error);
      throw new Error(`Failed to finalize assessment: ${error.message}`);
    }

    // Log finalization
    try {
      await auditService.logChange({
        entity_type: 'assessment',
        entity_id: id,
        action: 'finalized',
        new_value: finalizedBy
      });
    } catch (auditError) {
      console.error('Error logging audit change:', auditError);
    }

    return data;
  }
}

export const assessmentService = new AssessmentService();
```

---

## Migration Examples

### Example 1: Create New Entity Table

From `supabase/migrations/001_initial_schema.sql`:

```sql
-- ============================================================================
-- Create requests table
-- ============================================================================

CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
  type TEXT NOT NULL CHECK (type IN ('insurance', 'private')),
  claim_number TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'in_progress', 'completed', 'cancelled')),
  description TEXT,

  -- Incident details
  date_of_loss DATE,
  insured_value DECIMAL(12, 2),
  incident_type TEXT,
  incident_description TEXT,
  incident_location TEXT,

  -- Vehicle information
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_vin TEXT,
  vehicle_registration TEXT,
  vehicle_color TEXT,
  vehicle_mileage INTEGER,

  -- Owner details
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  owner_address TEXT,

  -- Third party details
  third_party_name TEXT,
  third_party_phone TEXT,
  third_party_email TEXT,
  third_party_insurance TEXT,

  -- Workflow
  current_step TEXT DEFAULT 'request'
    CHECK (current_step IN ('request', 'assessment', 'quote', 'approval')),
  assigned_engineer_id UUID REFERENCES engineers(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_requests_client ON requests(client_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_step ON requests(current_step);
CREATE INDEX IF NOT EXISTS idx_requests_engineer ON requests(assigned_engineer_id);
CREATE INDEX IF NOT EXISTS idx_requests_number ON requests(request_number);

-- Enable RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Create policy (permissive for development)
CREATE POLICY "Allow all operations on requests for now"
  ON requests FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-update trigger
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE requests IS
  'Insurance or private vehicle inspection requests';

COMMENT ON COLUMN requests.type IS
  'Request type: insurance (from insurance company) or private (direct from client)';

COMMENT ON COLUMN requests.current_step IS
  'Current workflow step: request → assessment → quote → approval';
```

### Example 2: Tighten RLS Policies

From `supabase/migrations/046_secure_rls_policies.sql`:

```sql
-- ============================================================================
-- Secure RLS Policies for Production
-- ============================================================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all operations on requests for now" ON requests;

-- Create helper functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_engineer_id()
RETURNS UUID AS $$
DECLARE
  eng_id UUID;
BEGIN
  SELECT id INTO eng_id
  FROM public.engineers
  WHERE auth_user_id = auth.uid() AND is_active = true;

  RETURN eng_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Requests: Admins see all, engineers see assigned
CREATE POLICY "requests_admins_select"
  ON requests FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "requests_engineers_select"
  ON requests FOR SELECT
  TO authenticated
  USING (assigned_engineer_id = get_user_engineer_id());

-- Only admins can insert/update/delete requests
CREATE POLICY "requests_admins_insert"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "requests_admins_update"
  ON requests FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "requests_admins_delete"
  ON requests FOR DELETE
  TO authenticated
  USING (is_admin());
```

### Example 3: Add Storage Bucket with Security

From `supabase/migrations/044_secure_storage_policies.sql`:

```sql
-- ============================================================================
-- Secure Storage Policies
-- ============================================================================

-- Make buckets private
UPDATE storage.buckets
SET public = false
WHERE id IN ('SVA Photos', 'documents');

-- Drop old permissive policies
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload photos" ON storage.objects;

-- Photos: Authenticated users only
CREATE POLICY "authenticated_users_can_view_photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'SVA Photos');

CREATE POLICY "authenticated_users_can_upload_photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'SVA Photos');

CREATE POLICY "authenticated_users_can_update_photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'SVA Photos')
  WITH CHECK (bucket_id = 'SVA Photos');

CREATE POLICY "authenticated_users_can_delete_photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'SVA Photos');

-- Documents: Authenticated users only
CREATE POLICY "authenticated_users_can_view_documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "authenticated_users_can_upload_documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "authenticated_users_can_update_documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "authenticated_users_can_delete_documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');
```

---

## RLS Policy Examples

### User Profiles (Self-Management + Admin)

From `supabase/migrations/043_auth_setup.sql`:

```sql
-- Users can view their own profile
CREATE POLICY "user_profiles_self_select"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "user_profiles_admins_select"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin());

-- Users can update their own profile (but not role)
CREATE POLICY "user_profiles_self_update"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

-- Admins can update any profile
CREATE POLICY "user_profiles_admins_update"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete profiles
CREATE POLICY "user_profiles_admins_delete"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (is_admin());
```

### Hierarchical Access (Assessments → Damage Records)

```sql
-- Assessment damage records inherit access from parent assessment

CREATE POLICY "assessment_damage_admins_all"
  ON assessment_damage FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "assessment_damage_engineers_all"
  ON assessment_damage FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN appointments ap ON ap.id = a.appointment_id
      WHERE a.id = assessment_damage.assessment_id
      AND ap.assigned_engineer_id = get_user_engineer_id()
    )
  );
```

---

## Storage Service Examples

### Upload Photo with Organized Paths

From `src/lib/services/storage.service.ts`:

```typescript
import { supabase } from '$lib/supabase';

class StorageService {
  private readonly PHOTO_BUCKET = 'SVA Photos';
  private readonly DOCUMENT_BUCKET = 'documents';

  /**
   * Upload assessment photo to organized folder structure
   */
  async uploadAssessmentPhoto(
    file: File,
    assessmentId: string,
    category: 'identification' | '360' | 'interior' | 'tyres' | 'damage' | 'accessories' | 'estimate'
  ): Promise<{ url: string; path: string }> {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const uniqueFileName = `${timestamp}-${randomString}.${extension}`;

    // Organized folder structure
    const folder = `assessments/${assessmentId}/${category}`;
    const filePath = `${folder}/${uniqueFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(this.PHOTO_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload photo: ${error.message}`);
    }

    // Return proxy URL (not signed URL!)
    return {
      url: `/api/photo/${filePath}`,
      path: filePath
    };
  }

  /**
   * Delete photo from storage
   */
  async deletePhoto(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.PHOTO_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete photo: ${error.message}`);
    }
  }

  /**
   * Convert any photo URL/path to proxy URL format
   */
  toPhotoProxyUrl(urlOrPath: string): string {
    if (!urlOrPath) return '';

    // Already a proxy URL
    if (urlOrPath.startsWith('/api/photo/')) {
      return urlOrPath;
    }

    // Extract path from full Supabase URL
    if (urlOrPath.includes('supabase.co/storage')) {
      const match = urlOrPath.match(/SVA%20Photos\/(.+?)(\?|$)/);
      if (match) {
        const path = decodeURIComponent(match[1]);
        return `/api/photo/${path}`;
      }
    }

    // Assume it's a raw path
    return `/api/photo/${urlOrPath}`;
  }

  /**
   * Upload document (PDF/ZIP)
   */
  async uploadDocument(
    file: File,
    folder: string,
    fileName: string
  ): Promise<{ url: string; path: string }> {
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(this.DOCUMENT_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Allow replacing existing documents
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }

    return {
      url: `/api/document/${filePath}`,
      path: filePath
    };
  }
}

export const storageService = new StorageService();
```

### Proxy Endpoint for Photos

From `src/routes/api/photo/[...path]/+server.ts`:

```typescript
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, request }) => {
  const photoPath = params.path;

  // 1. Authenticate user
  const { data: { session } } = await locals.supabase.auth.getSession();
  if (!session) {
    throw error(401, 'Authentication required');
  }

  try {
    // 2. Download photo (RLS enforced via user's session)
    const { data: photoBlob, error: downloadError } = await locals.supabase.storage
      .from('SVA Photos')
      .download(photoPath);

    if (downloadError) {
      console.error('Photo download error:', downloadError);
      throw error(404, 'Photo not found');
    }

    // 3. Convert to ArrayBuffer for Response
    const arrayBuffer = await photoBlob.arrayBuffer();

    // 4. Generate ETag for caching
    const etag = `"${Buffer.from(photoPath).toString('base64').substring(0, 16)}-${arrayBuffer.byteLength}"`;

    // 5. Check If-None-Match for 304 response
    if (request.headers.get('if-none-match') === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'private, max-age=3600'
        }
      });
    }

    // 6. Return photo with caching headers
    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
        'ETag': etag,
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (e) {
    console.error('Error serving photo:', e);
    throw error(500, 'Failed to serve photo');
  }
};
```

---

## Query Examples

### Complex Nested Select

From `src/lib/services/assessment.service.ts`:

```typescript
// Get assessments with all related data in one query
const { data } = await supabase
  .from('assessments')
  .select(`
    *,
    vehicle_identification:assessment_vehicle_identification(
      registration_number,
      vin_number,
      make,
      model,
      year,
      color,
      mileage
    ),
    exterior:assessment_360_exterior(
      overall_condition,
      front_photo_url,
      rear_photo_url
    ),
    tyres:assessment_tyres(
      position,
      tyre_make,
      condition,
      tread_depth_mm
    ),
    damage:assessment_damage(
      damage_type,
      severity,
      damage_description,
      photos
    ),
    estimates:assessment_estimates(
      description,
      part_price,
      labour,
      paint,
      line_total
    ).eq('is_removed', false),
    appointments:appointment_id(
      appointment_number,
      appointment_date,
      engineers:assigned_engineer_id(name, email)
    ),
    requests:request_id(
      request_number,
      client:clients(name, type)
    )
  `)
  .eq('id', assessmentId)
  .single();
```

### Efficient Counting

```typescript
// Count without fetching data
const { count } = await supabase
  .from('assessments')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'in_progress');

console.log(`${count} assessments in progress`);
```

### Filter and Sort

```typescript
// Get recent completed assessments
const { data } = await supabase
  .from('assessments')
  .select('id, assessment_number, completed_at')
  .eq('status', 'completed')
  .gte('completed_at', startDate)
  .order('completed_at', { ascending: false })
  .limit(10);
```

### Update JSONB Array

```typescript
// Add tab to completed tabs
const assessment = await supabase
  .from('assessments')
  .select('tabs_completed')
  .eq('id', id)
  .single();

const tabsCompleted = assessment.data.tabs_completed || [];
tabsCompleted.push('damage');

await supabase
  .from('assessments')
  .update({ tabs_completed: tabsCompleted })
  .eq('id', id);
```

---

## Type Definitions

### Service Client Type

From `src/lib/types/service.ts`:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database';

export type ServiceClient = SupabaseClient<Database>;
```

### Domain Types

From `src/lib/types/assessment.ts`:

```typescript
export interface Assessment {
  id: string;
  assessment_number: string;
  appointment_id: string;
  inspection_id: string;
  request_id: string;
  status: AssessmentStatus;
  current_tab: string;
  tabs_completed: string[];
  started_at: string | null;
  completed_at: string | null;
  submitted_at: string | null;
  cancelled_at: string | null;
  report_pdf_url: string | null;
  report_pdf_path: string | null;
  estimate_pdf_url: string | null;
  estimate_pdf_path: string | null;
  photos_pdf_url: string | null;
  photos_pdf_path: string | null;
  photos_zip_url: string | null;
  photos_zip_path: string | null;
  documents_generated_at: string | null;
  report_number: string | null;
  assessor_name: string | null;
  assessor_contact: string | null;
  assessor_email: string | null;
  estimate_finalized_at: string | null;
  estimate_finalized_by: string | null;
  created_at: string;
  updated_at: string;
}

export type AssessmentStatus = 'in_progress' | 'completed' | 'submitted' | 'archived' | 'cancelled';

export type CreateAssessmentInput = {
  appointment_id: string;
  inspection_id: string;
  request_id: string;
};

export type UpdateAssessmentInput = Partial<
  Omit<Assessment, 'id' | 'assessment_number' | 'created_at' | 'updated_at'>
>;
```

### Database Types

From `src/lib/types/database.ts`:

```typescript
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      assessments: {
        Row: Assessment;
        Insert: Omit<Assessment, 'id' | 'assessment_number' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Assessment, 'id' | 'assessment_number' | 'created_at' | 'updated_at'>>;
      };
      // ... 50+ more tables
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_user_engineer_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
  };
}
```

---

## Page Server Load Example

From `src/routes/work/assessments/[appointment_id]/+page.server.ts`:

```typescript
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { assessmentService } from '$lib/services/assessment.service';
import { appointmentService } from '$lib/services/appointment.service';

export const load: PageServerLoad = async ({ params, locals }) => {
  // Get appointment
  const appointment = await appointmentService.getAppointment(
    params.appointment_id,
    locals.supabase
  );

  if (!appointment) {
    throw error(404, 'Appointment not found');
  }

  // Get or create assessment
  let assessment = await assessmentService.getAssessmentByAppointment(
    params.appointment_id,
    locals.supabase
  );

  if (!assessment) {
    // Create new assessment
    assessment = await assessmentService.createAssessment(
      {
        appointment_id: params.appointment_id,
        inspection_id: appointment.inspection_id,
        request_id: appointment.request_id
      },
      locals.supabase
    );
  }

  return {
    appointment,
    assessment
  };
};
```

---

## Audit Logging Example

From `src/lib/services/audit.service.ts`:

```typescript
import { supabase } from '$lib/supabase';
import type { ServiceClient } from '$lib/types/service';

interface LogChangeInput {
  entity_type: string;
  entity_id: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
}

class AuditService {
  async logChange(input: LogChangeInput, client?: ServiceClient): Promise<void> {
    const db = client ?? supabase;

    try {
      await db.from('audit_logs').insert({
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        action: input.action,
        changed_fields: input.field_name ? { [input.field_name]: true } : null,
        old_values: input.old_value ? { [input.field_name!]: input.old_value } : null,
        new_values: input.new_value ? { [input.field_name!]: input.new_value } : null,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log audit change:', error);
      // Don't throw - audit failures shouldn't break operations
    }
  }
}

export const auditService = new AuditService();
```

---

## Summary

These examples demonstrate:
1. **Complete service class** with all CRUD operations
2. **Migration patterns** for tables, RLS, and storage
3. **RLS policies** for various access patterns
4. **Storage service** with organized uploads and proxy URLs
5. **Complex queries** with nested selects
6. **Type definitions** for services and domain models

Copy and adapt these patterns for new features in ClaimTech.
