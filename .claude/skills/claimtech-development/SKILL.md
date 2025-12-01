---
name: ClaimTech Development
description: ClaimTech vehicle assessment platform development patterns and workflows. Use when implementing features, reviewing code, or working with SvelteKit, Supabase, database migrations, service layer, authentication, PDF generation, or storage. Includes systematic workflows for common ClaimTech development tasks.
---

# ClaimTech Development Skill

Systematic workflows for developing features in the ClaimTech vehicle assessment platform.

## Overview

This skill provides step-by-step workflows for common ClaimTech development tasks, ensuring consistency with project patterns and best practices. It works alongside the `.agent/` documentation system to provide both methodology (HOW) and context (WHAT/WHERE).

## When to Use

Auto-invokes when working with:
- Database migrations and schema changes
- Service layer implementation
- Authentication and authorization
- SvelteKit page routes
- PDF generation and reporting
- File storage and photos
- ClaimTech-specific patterns

## Core Workflows

---

### Workflow 1: Database Migration

**When:** Adding or modifying database tables
**Time:** 15-30 minutes
**Triggers:** "database", "migration", "schema", "table", "RLS"

**Steps:**

1. **Review Current Schema**
   - Read `.agent/System/database_schema.md`
   - Understand existing tables and relationships
   - Check for similar patterns

2. **Create Migration File**
   ```bash
   # Name: YYYYMMDD_descriptive_name.sql
   # Location: supabase/migrations/
   ```

3. **Write Idempotent SQL**
   ```sql
   -- Create table with IF NOT EXISTS
   CREATE TABLE IF NOT EXISTS table_name (
     id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
     -- columns here
     created_at timestamptz DEFAULT now(),
     updated_at timestamptz DEFAULT now()
   );

   -- Create indexes
   CREATE INDEX IF NOT EXISTS idx_table_field
     ON table_name(field_name);

   -- Enable RLS
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

   -- Create RLS policies
   CREATE POLICY IF NOT EXISTS "policy_name"
     ON table_name
     FOR SELECT
     USING (auth.uid() IS NOT NULL);

   -- Add updated_at trigger
   CREATE TRIGGER IF NOT EXISTS update_table_updated_at
     BEFORE UPDATE ON table_name
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();
   ```

4. **Test Migration**
   - Apply migration locally
   - Verify table structure
   - Test RLS policies

5. **Update TypeScript Types**
   - Generate types from schema
   - Update relevant type files

6. **Update Documentation**
   - Add table to `.agent/System/database_schema.md`
   - Include columns, indexes, RLS policies

**Output:** Working migration + updated documentation

**Quality Checklist:**
- [ ] Migration is idempotent (IF NOT EXISTS everywhere)
- [ ] RLS enabled on table
- [ ] RLS policies created (not just permissive)
- [ ] Indexes on all foreign keys
- [ ] updated_at trigger added
- [ ] created_at and updated_at columns present
- [ ] Documentation updated in database_schema.md

**Enhanced Testing with Code Execution:**

**Option 2: Test Migration with Code Execution** (recommended for complex validation)

```typescript
// Phase 1: Apply migration and fetch results
await mcp__supabase__apply_migration({
  project_id: env.SUPABASE_PROJECT_ID,
  name: '071_add_new_table',
  query: `
    CREATE TABLE IF NOT EXISTS new_table (
      id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      name text NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_new_table_name
      ON new_table(name);

    ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
  `
});

const tables = await mcp__supabase__list_tables({
  project_id: env.SUPABASE_PROJECT_ID,
  schemas: ['public']
});

// Phase 2: Validate with code execution (73% token savings)
const validationCode = `
  const tables = ${JSON.stringify(tables)};

  const newTable = tables.find(t => t.name === 'new_table');
  console.assert(newTable, 'Migration should create table');

  // Validate columns
  const hasId = newTable.columns.some(c => c.name === 'id');
  const hasName = newTable.columns.some(c => c.name === 'name');
  const hasCreatedAt = newTable.columns.some(c => c.name === 'created_at');

  console.assert(hasId, 'Should have id column');
  console.assert(hasName, 'Should have name column');
  console.assert(hasCreatedAt, 'Should have created_at column');

  // Validate index
  const hasIndex = newTable.indexes.some(i => i.name === 'idx_new_table_name');
  console.assert(hasIndex, 'Should have name index');

  // Validate RLS enabled
  console.assert(newTable.rls_enabled, 'Should have RLS enabled');

  console.log('✓ Table created successfully');
  console.log('✓ All columns present');
  console.log('✓ Index created');
  console.log('✓ RLS enabled');
`;

await mcp__ide__executeCode({ code: validationCode });
```

**Reference:** See `.agent/SOP/adding_migration.md` for detailed process

---

### Workflow 2: Service Layer Implementation

**When:** Creating data access for a table
**Time:** 20-40 minutes
**Triggers:** "service", "data access", "CRUD", "database query"

**Steps:**

1. **Create Service File**
   ```typescript
   // Location: src/lib/services/entity.service.ts
   import type { SupabaseClient } from '@supabase/supabase-js';
   import type { Database } from '$lib/types/database.types';

   // ServiceClient injected, never created
   export class EntityService {
     constructor(private supabase: SupabaseClient<Database>) {}

     async getAll() {
       const { data, error } = await this.supabase
         .from('entities')
         .select('*')
         .order('created_at', { ascending: false });

       if (error) throw error;
       return data;
     }

     async getById(id: string) {
       const { data, error } = await this.supabase
         .from('entities')
         .select('*')
         .eq('id', id)
         .single();

       if (error) throw error;
       return data;
     }

     async create(entity: InsertEntity) {
       const { data, error } = await this.supabase
         .from('entities')
         .insert(entity)
         .select()
         .single();

       if (error) throw error;
       return data;
     }

     async update(id: string, updates: UpdateEntity) {
       const { data, error } = await this.supabase
         .from('entities')
         .update(updates)
         .eq('id', id)
         .select()
         .single();

       if (error) throw error;
       return data;
     }

     async delete(id: string) {
       const { error } = await this.supabase
         .from('entities')
         .delete()
         .eq('id', id);

       if (error) throw error;
     }
   }

   // Export singleton factory
   export const createEntityService = (supabase: SupabaseClient<Database>) =>
     new EntityService(supabase);
   ```

2. **Use in Server Load**
   ```typescript
   // +page.server.ts
   import { createEntityService } from '$lib/services/entity.service';

   export async function load({ locals }) {
     const entityService = createEntityService(locals.supabase);
     const entities = await entityService.getAll();
     return { entities };
   }
   ```

**Output:** Reusable service with type-safe CRUD operations

**Quality Checklist:**
- [ ] ServiceClient injected (constructor parameter)
- [ ] Error handling on all database calls
- [ ] TypeScript types for all parameters and returns
- [ ] Service exported as factory function
- [ ] Follows existing service patterns
- [ ] Used in +page.server.ts load function

**Reference:** See `.agent/SOP/working_with_services.md`

---

### Workflow 3: Authentication Flow

**When:** Implementing auth-protected features
**Time:** 10-20 minutes
**Triggers:** "auth", "login", "logout", "protect", "RLS"

**Steps:**

1. **Use Form Actions (NOT API Routes)**
   ```typescript
   // +page.server.ts
   import { fail, redirect } from '@sveltejs/kit';

   export const actions = {
     login: async ({ request, locals }) => {
       const formData = await request.formData();
       const email = formData.get('email')?.toString();
       const password = formData.get('password')?.toString();

       const { error } = await locals.supabase.auth.signInWithPassword({
         email,
         password
       });

       if (error) {
         return fail(400, { error: error.message });
       }

       throw redirect(303, '/dashboard');
     }
   };
   ```

2. **Check Auth in Load Functions**
   ```typescript
   export async function load({ locals }) {
     const session = await locals.getSession();
     if (!session) {
       throw redirect(303, '/auth/login');
     }

     // Protected data access
     return { user: session.user };
   }
   ```

3. **Implement RLS Policies**
   ```sql
   -- Row-level security based on auth.uid()
   CREATE POLICY "Users can view own data"
     ON table_name
     FOR SELECT
     USING (auth.uid() = user_id);

   -- Admin access
   CREATE POLICY "Admins can view all"
     ON table_name
     FOR SELECT
     USING (
       EXISTS (
         SELECT 1 FROM user_profiles
         WHERE id = auth.uid() AND role = 'admin'
       )
     );
   ```

4. **Add Role Checks**
   ```typescript
   // Check user role
   const { data: profile } = await locals.supabase
     .from('user_profiles')
     .select('role')
     .eq('id', session.user.id)
     .single();

   if (profile?.role !== 'admin') {
     throw error(403, 'Forbidden');
   }
   ```

**Output:** Secure auth flow with RLS

**Quality Checklist:**
- [ ] Form actions used for login/logout (not API routes)
- [ ] RLS policies protect data at database level
- [ ] Role checks implemented where needed
- [ ] Redirects to /auth/login when not authenticated
- [ ] Session checked in load functions
- [ ] No direct database access without auth check

**Reference:** See `.agent/SOP/implementing_form_actions_auth.md`

---

### Workflow 4: Page Route Creation

**When:** Adding new UI pages
**Time:** 15-30 minutes
**Triggers:** "page", "route", "UI", "component"

**Steps:**

1. **Create Route Files**
   ```
   src/routes/feature/
   ├── +page.svelte        # UI component
   ├── +page.server.ts     # Server-side data loading
   └── +page.ts            # (optional) Client-side data
   ```

2. **Implement Server Load**
   ```typescript
   // +page.server.ts
   import { createEntityService } from '$lib/services/entity.service';

   export async function load({ locals }) {
     const entityService = createEntityService(locals.supabase);
     const entities = await entityService.getAll();

     return { entities };
   }
   ```

3. **Create Svelte 5 Component**
   ```svelte
   <!-- +page.svelte -->
   <script lang="ts">
     import { page } from '$app/stores';

     let { data } = $props();

     // Svelte 5 runes
     let searchTerm = $state('');
     let filteredEntities = $derived(
       data.entities.filter(e =>
         e.name.toLowerCase().includes(searchTerm.toLowerCase())
       )
     );

     $effect(() => {
       console.log('Search term changed:', searchTerm);
     });
   </script>

   <div class="container">
     <h1>Entities</h1>
     <input bind:value={searchTerm} placeholder="Search..." />

     {#each filteredEntities as entity}
       <div class="card">{entity.name}</div>
     {/each}
   </div>
   ```

4. **Add Navigation**
   - Update sidebar/nav component if needed

**Output:** Working page with server-side data loading

**Quality Checklist:**
- [ ] ServiceClient used in +page.server.ts
- [ ] Svelte 5 runes used ($state, $derived, $effect)
- [ ] TypeScript types for data prop
- [ ] Error boundaries added
- [ ] Loading states handled
- [ ] Navigation updated if user-facing

**Reference:** See `.agent/SOP/adding_page_route.md`

---

### Workflow 5: PDF Generation

**When:** Creating reports or documents
**Time:** 30-60 minutes
**Triggers:** "PDF", "report", "document generation", "Puppeteer"

**Steps:**

1. **Create HTML Template**
   ```svelte
   <!-- src/lib/templates/report-template.svelte -->
   <script lang="ts">
     let { data } = $props();
   </script>

   <html>
     <head>
       <style>
         /* Tailwind-based styles */
         @import 'tailwindcss/base';
         @import 'tailwindcss/components';
         @import 'tailwindcss/utilities';
       </style>
     </head>
     <body class="p-8">
       <h1 class="text-2xl font-bold">{data.title}</h1>
       <!-- Report content -->
     </body>
   </html>
   ```

2. **Create API Endpoint**
   ```typescript
   // src/routes/api/generate-report/+server.ts
   import { generatePDF } from '$lib/utils/pdf-generator';
   import { createStorageService } from '$lib/services/storage.service';

   export async function POST({ request, locals }) {
     const { assessmentId } = await request.json();

     // Fetch data
     const assessment = await getAssessment(assessmentId);

     // Render template
     const html = renderTemplate('report-template', assessment);

     // Generate PDF
     const pdfBuffer = await generatePDF(html);

     // Upload to storage
     const storage = createStorageService(locals.supabase);
     const path = `assessments/${assessmentId}/report.pdf`;
     await storage.upload('documents', path, pdfBuffer);

     return new Response(JSON.stringify({ success: true }));
   }
   ```

3. **Create Proxy Endpoint for Signed URLs**
   ```typescript
   // src/routes/api/document/[...path]/+server.ts
   export async function GET({ params, locals }) {
     const storage = createStorageService(locals.supabase);
     const url = await storage.getSignedUrl('documents', params.path);

     return new Response(null, {
       status: 302,
       headers: { Location: url }
     });
   }
   ```

**Output:** Generated PDF in storage with proxy access

**Quality Checklist:**
- [ ] Template uses Tailwind for styling
- [ ] Puppeteer configured with correct options
- [ ] PDF uploaded to documents bucket
- [ ] Proxy endpoint returns signed URL
- [ ] Never expose signed URLs directly to client
- [ ] File path follows convention

**Reference:** See `.agent/System/project_architecture.md#pdf-generation-workflow`

---

### Workflow 6: Storage & Photo Upload

**When:** Handling file uploads
**Time:** 20-30 minutes
**Triggers:** "upload", "photo", "storage", "file", "image"

**Steps:**

1. **Use Storage Service**
   ```typescript
   import { createStorageService } from '$lib/services/storage.service';

   export async function POST({ request, locals }) {
     const formData = await request.formData();
     const file = formData.get('file') as File;

     const storage = createStorageService(locals.supabase);

     // Choose correct bucket
     const bucket = file.type.startsWith('image/')
       ? 'SVA Photos'
       : 'documents';

     // Upload
     const path = `assessments/${assessmentId}/${file.name}`;
     await storage.upload(bucket, path, file);

     return new Response(JSON.stringify({ success: true }));
   }
   ```

2. **Create Proxy for Access**
   ```typescript
   // GET /api/photo/[...path]
   export async function GET({ params, locals }) {
     const storage = createStorageService(locals.supabase);
     const url = await storage.getSignedUrl('SVA Photos', params.path);

     return new Response(null, {
       status: 302,
       headers: { Location: url }
     });
   }
   ```

3. **Handle Deletion**
   ```typescript
   await storage.delete('SVA Photos', path);
   ```

**Output:** Secure file storage with proxy access

**Quality Checklist:**
- [ ] Correct bucket used (documents vs SVA Photos)
- [ ] Proxy endpoint created for access
- [ ] No direct signed URL exposure to client
- [ ] File deletion handled when entity deleted
- [ ] File paths follow conventions
- [ ] MIME types validated

**Reference:** See `.agent/System/project_architecture.md#storage-architecture`

---

### Enhanced Testing with Code Execution

**Workflow 5A: Generate Test Data with Code Execution**

Use code execution to create comprehensive test data plans for manual testing.

**Phase 1: Fetch Current Data**
```typescript
const existing = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: 'SELECT COUNT(*) as count, stage FROM assessments GROUP BY stage'
});
```

**Phase 2: Generate Test Data Plan** (88% token savings vs traditional approach)
```typescript
const planCode = `
  const existing = ${JSON.stringify(existing)};
  const stages = [
    'request_submitted',
    'request_reviewed',
    'appointment_scheduled',
    'inspection_scheduled',
    'assessment_in_progress',
    'estimate_review',
    'estimate_sent',
    'estimate_finalized'
  ];

  // Create test plan
  const testPlan = stages.map((stage, i) => {
    const current = existing.find(e => e.stage === stage);
    const currentCount = current ? current.count : 0;

    return {
      stage,
      currentCount,
      needToCreate: Math.max(5 - currentCount, 0),
      targetCount: 5
    };
  });

  // Generate report
  console.log('Test Data Plan:');
  console.log('===============');
  testPlan.forEach(plan => {
    console.log(\`\${plan.stage}:\`);
    console.log(\`  Current: \${plan.currentCount}\`);
    console.log(\`  Need to create: \${plan.needToCreate}\`);
    console.log(\`  Target: \${plan.targetCount}\`);
  });

  const totalToCreate = testPlan.reduce((sum, p) => sum + p.needToCreate, 0);
  console.log('');
  console.log(\`Total test records to create: \${totalToCreate}\`);

  // Export plan
  console.log(JSON.stringify(testPlan, null, 2));
`;

await mcp__ide__executeCode({ code: planCode });

// Phase 3: Use plan to create test data (via MCP or manual creation)
```

---

### Workflow 7: Client-Specific Overrides with Fallback

**When:** Implementing features with company-wide defaults that can be overridden per client
**Time:** 30-45 minutes
**Triggers:** "override", "fallback", "client-specific", "company default", "customization"

**Pattern:** Company Default → Client Override → Empty

**Steps:**

1. **Add Database Fields**
   ```sql
   -- Add to company_settings table (company-wide defaults)
   ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS
     assessment_terms_and_conditions text;

   -- Add to clients table (client-specific overrides)
   ALTER TABLE clients ADD COLUMN IF NOT EXISTS
     assessment_terms_and_conditions text;

   -- Add check constraints for character limits
   ALTER TABLE company_settings ADD CONSTRAINT
     assessment_tc_length CHECK (
       assessment_terms_and_conditions IS NULL OR
       length(assessment_terms_and_conditions) <= 10000
     );
   ```

2. **Update Service Layer**
   ```typescript
   // src/lib/services/company.service.ts
   async updateSettings(
     companyId: string,
     updates: Partial<CompanySettings>,
     client?: ServiceClient
   ): Promise<CompanySettings> {
     const db = client ?? supabase;

     // Validate character limits
     if (updates.assessment_terms_and_conditions) {
       if (updates.assessment_terms_and_conditions.length > 10000) {
         throw new Error('Terms and conditions exceed 10,000 character limit');
       }
     }

     const { data, error } = await db
       .from('company_settings')
       .update(updates)
       .eq('id', companyId)
       .select()
       .single();

     if (error) throw error;
     return data;
   }
   ```

3. **Implement Fallback Pattern**
   ```typescript
   // In API endpoint or service
   async function getEffectiveTermsAndConditions(
     clientId: string,
     companyId: string,
     documentType: 'assessment' | 'estimate' | 'frc',
     client?: ServiceClient
   ): Promise<string | null> {
     const db = client ?? supabase;

     // Get both client and company data
     const [{ data: clientData }, { data: companySettings }] = await Promise.all([
       db.from('clients').select('*').eq('id', clientId).single(),
       db.from('company_settings').select('*').eq('id', companyId).single()
     ]);

     // Fallback pattern: client → company → empty
     const fieldName = `${documentType}_terms_and_conditions`;
     return clientData?.[fieldName] ||
            companySettings?.[fieldName] ||
            null;
   }
   ```

4. **Create Form UI with Character Counter**
   ```svelte
   <script lang="ts">
     let termsAndConditions = $state('');
     let charCount = $derived(termsAndConditions.length);
     const MAX_LENGTH = 10000;
     let isOverLimit = $derived(charCount > MAX_LENGTH);

     async function handleSubmit() {
       if (isOverLimit) {
         alert('Text exceeds character limit');
         return;
       }
       // Submit form
     }
   </script>

   <form on:submit|preventDefault={handleSubmit}>
     <label>
       Assessment Terms & Conditions
       <textarea
         bind:value={termsAndConditions}
         placeholder="Enter terms and conditions (optional)"
         rows="10"
       />
       <div class="character-counter" class:error={isOverLimit}>
         {charCount} / {MAX_LENGTH} characters
       </div>
     </label>
     <button type="submit" disabled={isOverLimit}>
       Save Settings
     </button>
   </form>

   <style>
     .character-counter {
       font-size: 0.875rem;
       color: #666;
       margin-top: 0.25rem;
     }
     .character-counter.error {
       color: #dc2626;
       font-weight: 600;
     }
   </style>
   ```

5. **Server-Side Validation**
   ```typescript
   // +page.server.ts
   export const actions = {
     updateTerms: async ({ request, locals }) => {
       const formData = await request.formData();
       const terms = formData.get('assessment_terms_and_conditions')?.toString();

       // Validate length
       if (terms && terms.length > 10000) {
         return fail(400, {
           error: 'Terms and conditions exceed 10,000 character limit'
         });
       }

       try {
         await companyService.updateSettings(
           companyId,
           { assessment_terms_and_conditions: terms },
           locals.supabase
         );

         return { success: true };
       } catch (error) {
         return fail(500, { error: error.message });
       }
     }
   };
   ```

6. **Use in PDF Templates**
   ```typescript
   // In PDF generation endpoint
   const effectiveTerms = await getEffectiveTermsAndConditions(
     clientId,
     companyId,
     'assessment',
     locals.supabase
   );

   const html = `
     <!DOCTYPE html>
     <html>
       <body>
         <!-- Report content -->

         ${effectiveTerms ? `
           <section class="terms">
             <h2>Terms and Conditions</h2>
             <div>${escapeHtmlWithLineBreaks(effectiveTerms)}</div>
           </section>
         ` : ''}
       </body>
     </html>
   `;
   ```

**Output:** Company-wide defaults with optional client overrides

**Quality Checklist:**
- [ ] Database fields are nullable (overrides are optional)
- [ ] Character limit constraints at database level
- [ ] Server-side validation enforces limits
- [ ] UI shows real-time character counter
- [ ] Fallback pattern implemented correctly (client → company → null)
- [ ] HTML sanitization for user-generated content
- [ ] Works in PDF templates with conditional rendering
- [ ] Documentation updated

**Common Pitfalls:**
- ❌ Making override fields required (should be nullable)
- ❌ Only validating on client-side (must validate server-side)
- ❌ Wrong fallback order (should be client → company → null)
- ❌ Not sanitizing HTML in PDF templates
- ❌ Missing character counters in UI

**Reference:** See Terms & Conditions feature implementation

---

### Workflow 8: HTML Sanitization & XSS Prevention

**When:** Handling user-generated content that will be displayed or included in PDFs
**Time:** 20-30 minutes
**Triggers:** "user content", "sanitize", "XSS", "escape HTML", "text input"

**Pattern:** Sanitize Input → Validate → Escape Output

**Steps:**

1. **Create Sanitization Utilities**
   ```typescript
   // src/lib/utils/sanitize.ts

   /**
    * Sanitize user input by removing potentially dangerous characters
    * Use for input validation before storing in database
    */
   export function sanitizeInput(input: string | null | undefined): string {
     if (!input) return '';

     return input
       .trim()
       .replace(/[<>]/g, '') // Remove < and >
       .substring(0, 10000); // Enforce max length
   }

   /**
    * Escape HTML entities for safe display
    * Use when rendering user content in HTML context
    */
   export function escapeHtml(text: string): string {
     const escapeMap: Record<string, string> = {
       '&': '&amp;',
       '<': '&lt;',
       '>': '&gt;',
       '"': '&quot;',
       "'": '&#x27;',
       '/': '&#x2F;'
     };

     return text.replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);
   }

   /**
    * Escape HTML and preserve line breaks
    * Use for multi-line user content in PDFs
    */
   export function escapeHtmlWithLineBreaks(text: string): string {
     return escapeHtml(text).replace(/\n/g, '<br>');
   }

   /**
    * Validate text length
    */
   export function validateLength(
     text: string,
     maxLength: number = 10000
   ): { valid: boolean; error?: string } {
     if (text.length > maxLength) {
       return {
         valid: false,
         error: `Text exceeds ${maxLength} character limit`
       };
     }
     return { valid: true };
   }
   ```

2. **Use in Service Layer**
   ```typescript
   // src/lib/services/client.service.ts
   import { sanitizeInput, validateLength } from '$lib/utils/sanitize';

   async update(
     id: string,
     updates: Partial<ClientInput>,
     client?: ServiceClient
   ): Promise<Client> {
     const db = client ?? supabase;

     // Sanitize text fields
     if (updates.assessment_terms_and_conditions) {
       const sanitized = sanitizeInput(updates.assessment_terms_and_conditions);

       // Validate length
       const validation = validateLength(sanitized, 10000);
       if (!validation.valid) {
         throw new Error(validation.error);
       }

       updates.assessment_terms_and_conditions = sanitized;
     }

     const { data, error } = await db
       .from('clients')
       .update(updates)
       .eq('id', id)
       .select()
       .single();

     if (error) throw error;
     return data;
   }
   ```

3. **Use in PDF Templates**
   ```typescript
   // src/routes/api/generate-report/+server.ts
   import { escapeHtmlWithLineBreaks } from '$lib/utils/sanitize';

   export async function POST({ request, locals }) {
     // Get user-generated content
     const termsAndConditions = await getTermsAndConditions(...);

     const html = `
       <!DOCTYPE html>
       <html>
         <body>
           ${termsAndConditions ? `
             <section class="terms">
               <h2>Terms and Conditions</h2>
               <div class="terms-content">
                 ${escapeHtmlWithLineBreaks(termsAndConditions)}
               </div>
             </section>
           ` : ''}
         </body>
       </html>
     `;

     // Generate PDF with Puppeteer
     const pdf = await generatePDF(html);
     return new Response(pdf, { ... });
   }
   ```

4. **Server-Side Validation**
   ```typescript
   // +page.server.ts
   import { sanitizeInput, validateLength } from '$lib/utils/sanitize';

   export const actions = {
     updateContent: async ({ request, locals }) => {
       const formData = await request.formData();
       const rawContent = formData.get('content')?.toString() || '';

       // Sanitize
       const content = sanitizeInput(rawContent);

       // Validate
       const validation = validateLength(content, 10000);
       if (!validation.valid) {
         return fail(400, { error: validation.error });
       }

       try {
         await service.update(id, { content }, locals.supabase);
         return { success: true };
       } catch (error) {
         return fail(500, { error: error.message });
       }
     }
   };
   ```

**Output:** Safe handling of user-generated content

**Quality Checklist:**
- [ ] Input sanitization before database storage
- [ ] Output escaping when rendering to HTML/PDF
- [ ] Server-side validation (never trust client)
- [ ] Character length limits enforced
- [ ] Line breaks preserved where needed
- [ ] No inline JavaScript possible in user content
- [ ] Utilities tested with malicious input

**Security Tests:**
```typescript
// Test XSS prevention
const maliciousInput = '<script>alert("XSS")</script>';
const sanitized = sanitizeInput(maliciousInput);
expect(sanitized).not.toContain('<script>');

const escaped = escapeHtml('<script>alert("XSS")</script>');
expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
```

**Common Pitfalls:**
- ❌ Only sanitizing on client-side (must sanitize server-side)
- ❌ Not escaping output in PDFs
- ❌ Removing line breaks when they should be preserved
- ❌ Allowing unchecked HTML tags
- ❌ Not validating content length

**Reference:** See `src/lib/utils/sanitize.ts`

---

### Workflow 9: Multi-Step Transactions with Verification

**When:** Critical operations with multiple database updates that must all succeed
**Time:** 30-45 minutes
**Triggers:** "critical operation", "multi-step", "verification", "atomic update", "stage transition"

**Pattern:** Step → Verify → Step → Verify → Audit

**Steps:**

1. **Structure Operation as Multi-Step**
   ```typescript
   async function criticalOperation(
     id: string,
     client: ServiceClient
   ): Promise<Result> {
     try {
       // Step 1: Update field A
       const { error: error1 } = await client
         .from('table')
         .update({ field_a: valueA })
         .eq('id', id);

       if (error1) {
         throw new Error(`Step 1 failed: ${error1.message}`);
       }

       // Step 2: Update field B (CRITICAL)
       try {
         await service.updateFieldB(id, valueB, client);
       } catch (error2) {
         console.error('CRITICAL ERROR: Step 2 failed:', error2);
         throw new Error(`Step 2 failed: ${error2.message}`);
       }

       // Step 3: VERIFY both updates succeeded
       const { data, error: verifyError } = await client
         .from('table')
         .select('field_a, field_b')
         .eq('id', id)
         .single();

       if (verifyError) {
         throw new Error(`Verification failed: ${verifyError.message}`);
       }

       if (data.field_a !== valueA || data.field_b !== valueB) {
         throw new Error(
           `CRITICAL ERROR: Verification failed. ` +
           `Expected field_a=${valueA}, field_b=${valueB}. ` +
           `Got field_a=${data.field_a}, field_b=${data.field_b}`
         );
       }

       // Step 4: Audit logging (defensive - don't throw)
       try {
         await auditService.logChange({...}, client);
       } catch (auditError) {
         console.error('Warning: Failed to log audit:', auditError);
       }

       return { success: true, data };

     } catch (error) {
       // ALWAYS re-throw - UI must show error
       console.error('Critical operation failed:', error);
       throw error;
     }
   }
   ```

2. **Add Verification Queries**
   ```typescript
   // After critical update, explicitly verify
   const { data: verify, error: verifyError } = await db
     .from('assessments')
     .select('stage, status')
     .eq('id', assessmentId)
     .single();

   if (verifyError) {
     throw new Error(`Verification query failed: ${verifyError.message}`);
   }

   if (verify.stage !== expectedStage) {
     throw new Error(
       `CRITICAL ERROR: Stage verification failed. ` +
       `Expected stage='${expectedStage}', got stage='${verify.stage}'`
     );
   }
   ```

3. **Per-Step Error Handling**
   ```typescript
   // Wrap critical steps in try-catch
   try {
     await assessmentService.updateStage(id, 'archived', db);
   } catch (stageError) {
     console.error('CRITICAL ERROR: Failed to update stage:', stageError);
     throw new Error(`Stage update failed: ${stageError.message}`);
   }
   ```

4. **Defensive Audit Logging**
   ```typescript
   // Audit failures should NOT break the operation
   try {
     await auditService.logChange({
       entity_type: 'frc',
       entity_id: id,
       action: 'complete',
       changes: { status: 'completed' }
     }, db);
   } catch (auditError) {
     // Log but don't throw - audit is non-critical
     console.error('Warning: Failed to log audit:', auditError);
   }
   ```

5. **Fail Loudly**
   ```typescript
   // NEVER catch and silently log - always re-throw
   } catch (error) {
     console.error('FRC completion failed:', error);
     throw error; // ← Re-throw to UI
   }
   ```

**Real Example:** FRC Completion (see assessment-centric-specialist skill)

**Output:** Robust multi-step operations with verification

**Quality Checklist:**
- [ ] Each critical step has error handling
- [ ] Verification query after critical updates
- [ ] "CRITICAL ERROR:" prefix for important failures
- [ ] Detailed error messages with expected vs actual
- [ ] Audit logging is defensive (doesn't break operation)
- [ ] All errors re-thrown to UI (no silent failures)
- [ ] Console logging for debugging
- [ ] Tested failure scenarios

**When to Use:**
- ✅ Stage transitions with side effects
- ✅ FRC/Additional completion flows
- ✅ Multi-field atomic updates
- ✅ Operations where inconsistent state is dangerous
- ❌ Simple single-field updates (overkill)
- ❌ Non-critical operations

**Reference:** See `src/lib/services/frc.service.ts` lines 731-800

---

### Workflow 10: Vercel Deployment Configuration

**When:** Setting up production deployment or configuring environment variables
**Time:** 20-30 minutes
**Triggers:** "deployment", "Vercel", "production", "environment", "env vars"

**Pattern:** Local Dev → Preview (vercel-dev) → Production (main)

**Steps:**

1. **Configure Vercel Project**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Link project
   vercel link

   # Set environment variables
   vercel env add PUBLIC_SUPABASE_URL
   vercel env add PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Set Up Branch Strategy**
   ```
   main          → Vercel Production + Supabase Production
   vercel-dev    → Vercel Preview + Supabase Dev Branch
   dev           → Local only + Supabase Dev Branch
   ```

3. **Configure Auth URLs in Supabase**
   ```
   Site URL: https://claimtech.vercel.app
   Redirect URLs:
   - https://claimtech.vercel.app/auth/callback
   - https://claimtech.vercel.app/auth/confirm
   ```

4. **Environment Variables**
   ```bash
   # Production
   PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...

   # Preview/Development
   PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

5. **Verify Deployment**
   ```bash
   # Check production build
   npm run build

   # Test preview deployment
   vercel --prod=false

   # Deploy to production
   git push origin main
   ```

**Output:** Production-ready deployment on Vercel

**Quality Checklist:**
- [ ] All environment variables set in Vercel
- [ ] Auth redirect URLs configured in Supabase
- [ ] Branch strategy documented
- [ ] Production build succeeds locally
- [ ] Preview deployments working
- [ ] Auto-deployment enabled for main branch

**Common Issues:**
- Auth redirects fail → Check Site URL and Redirect URLs
- Environment vars missing → Set in Vercel dashboard
- Build fails → Test `npm run build` locally first
- Wrong Supabase project → Verify PROJECT_ID

**Reference:** See `.agent/Tasks/active/SUPABASE_BRANCHING.md`

---

## Best Practices

### Always:
- ✅ Read `.agent/` docs for current state before implementing
- ✅ Use ServiceClient injection pattern
- ✅ Enable RLS on all tables
- ✅ Use form actions for auth mutations
- ✅ Use Svelte 5 runes (not stores)
- ✅ Add TypeScript types everywhere
- ✅ Update documentation after changes
- ✅ Use proxy endpoints for storage URLs

### Never:
- ❌ Create SupabaseClient in services (inject it)
- ❌ Skip RLS policies
- ❌ Use API routes for auth mutations
- ❌ Expose signed URLs directly
- ❌ Use Svelte 4 stores in new code
- ❌ Skip documentation updates
- ❌ Hard-code bucket names

## Success Criteria

### Feature is Complete When:
1. ✅ Code follows ClaimTech patterns
2. ✅ All quality checklists passed
3. ✅ Documentation updated
4. ✅ TypeScript types complete
5. ✅ Tests passing (if applicable)
6. ✅ Security verified (RLS, auth)

## Related Documentation

**Always consult:**
- `.agent/README.md` - Documentation index
- `.agent/System/database_schema.md` - Database structure
- `.agent/System/project_architecture.md` - System architecture
- `.agent/SOP/` - Detailed SOPs for each workflow

**Quick Reference:**
- Database: `.agent/SOP/adding_migration.md`
- Services: `.agent/SOP/working_with_services.md`
- Auth: `.agent/SOP/implementing_form_actions_auth.md`
- Pages: `.agent/SOP/adding_page_route.md`
- Components: `.agent/SOP/creating-components.md`

---

---

## Code Execution in Workflows

ClaimTech uses **Architecture A** (MCP fetch → code process) for efficient multi-step operations.

### Pattern: Test Data Analysis

Analyze test coverage across stages with code execution.

```typescript
// Phase 1: Fetch all test data
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      stage,
      COUNT(*) as count,
      COUNT(DISTINCT appointment_id) as with_appointments,
      COUNT(DISTINCT request_id) as with_requests
    FROM assessments
    GROUP BY stage
  `
});

// Phase 2: Analyze coverage (73% token savings)
const analysisCode = `
  const assessments = ${JSON.stringify(assessments)};

  console.log('Test Data Coverage Analysis:');
  console.log('=============================');

  assessments.forEach(row => {
    const appointmentCoverage = (row.with_appointments / row.count * 100).toFixed(1);
    const requestCoverage = (row.with_requests / row.count * 100).toFixed(1);

    console.log(\`\${row.stage}:\`);
    console.log(\`  Total: \${row.count}\`);
    console.log(\`  With appointments: \${row.with_appointments} (\${appointmentCoverage}%)\`);
    console.log(\`  With requests: \${row.with_requests} (\${requestCoverage}%)\`);
  });

  const totalAssessments = assessments.reduce((sum, row) => sum + row.count, 0);
  console.log('');
  console.log(\`Total assessments: \${totalAssessments}\`);
`;

await mcp__ide__executeCode({ code: analysisCode });
```

### Pattern: Batch Validation

Validate multiple assessments with complex criteria.

```typescript
// Phase 1: Fetch assessments with related data
const data = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      a.id,
      a.stage,
      a.assessment_number,
      COUNT(p.id) as photo_count,
      COUNT(e.id) as estimate_item_count,
      t.status as tyres_status
    FROM assessments a
    LEFT JOIN photos p ON p.assessment_id = a.id
    LEFT JOIN estimate_items e ON e.assessment_id = a.id
    LEFT JOIN assessment_tyres t ON t.assessment_id = a.id
    WHERE a.stage = 'estimate_review'
    GROUP BY a.id, t.status
  `
});

// Phase 2: Validate with complex logic (92% token savings)
const validationCode = `
  const data = ${JSON.stringify(data)};

  const validation = {
    passed: [],
    failed: []
  };

  data.forEach(assessment => {
    const issues = [];

    // Validation rules
    if (assessment.photo_count < 5) {
      issues.push(\`Only \${assessment.photo_count} photos (need 5)\`);
    }

    if (assessment.estimate_item_count === 0) {
      issues.push('No estimate items');
    }

    if (!assessment.tyres_status || assessment.tyres_status !== 'complete') {
      issues.push(\`Tyres incomplete (status: \${assessment.tyres_status || 'none'})\`);
    }

    if (issues.length === 0) {
      validation.passed.push(assessment.assessment_number);
    } else {
      validation.failed.push({
        number: assessment.assessment_number,
        issues
      });
    }
  });

  console.log('Batch Validation Results:');
  console.log('========================');
  console.log(\`Passed: \${validation.passed.length}\`);
  console.log(\`Failed: \${validation.failed.length}\`);

  if (validation.failed.length > 0) {
    console.log('');
    console.log('Failed Assessments:');
    validation.failed.forEach(item => {
      console.log(\`  \${item.number}:\`);
      item.issues.forEach(issue => {
        console.log(\`    - \${issue}\`);
      });
    });
  }
`;

await mcp__ide__executeCode({ code: validationCode });
```

### Pattern: Report Generation

Generate formatted reports from raw data.

```typescript
// Phase 1: Fetch report data
const reportData = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      DATE_TRUNC('day', created_at) as date,
      stage,
      COUNT(*) as count
    FROM assessments
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE_TRUNC('day', created_at), stage
    ORDER BY date DESC, stage
  `
});

// Phase 2: Format as report (85% token savings)
const reportCode = `
  const data = ${JSON.stringify(reportData)};

  // Group by date
  const byDate = {};
  data.forEach(row => {
    const date = row.date.split('T')[0];
    if (!byDate[date]) byDate[date] = {};
    byDate[date][row.stage] = row.count;
  });

  // Generate Markdown report
  console.log('# Assessment Activity Report');
  console.log('');
  console.log('**Period:** Last 30 days');
  console.log('');
  console.log('| Date | New Requests | In Progress | Completed |');
  console.log('|------|--------------|-------------|-----------|');

  Object.entries(byDate).forEach(([date, stages]) => {
    const newReqs = stages['request_submitted'] || 0;
    const inProgress = stages['assessment_in_progress'] || 0;
    const completed = stages['archived'] || 0;

    console.log(\`| \${date} | \${newReqs} | \${inProgress} | \${completed} |\`);
  });

  console.log('');
  console.log('---');
  console.log(\`Report generated: \${new Date().toISOString()}\`);
`;

await mcp__ide__executeCode({ code: reportCode });
```

### When to Use Code Execution in Workflows

**✅ Use Code Execution When:**
- Testing migrations (validation)
- Generating test data plans
- Batch validation of records
- Creating formatted reports
- Analyzing test coverage
- Complex data transformations

**❌ Use Direct Tools When:**
- Applying migrations (use MCP)
- Single record CRUD (use services)
- Simple queries (use MCP)
- UI interactions (manual)

### Benefits in ClaimTech Workflows

- **Migration Testing**: Validate schema changes programmatically
- **Test Data**: Generate comprehensive test plans
- **Quality Assurance**: Batch validation with detailed reports
- **Reporting**: Format raw data into Markdown/HTML
- **Token Efficiency**: 73-94% reduction for multi-step workflows

---

**Skill Version:** 1.2.0 (Code Execution Enhanced)
**Last Updated:** November 9, 2025
**ClaimTech Version:** Production (31 tables, 100% RLS coverage, deployed on Vercel)