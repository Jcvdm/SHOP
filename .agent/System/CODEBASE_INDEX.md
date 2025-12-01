# ClaimTech Codebase Index
**Last Updated**: November 22, 2025
**Purpose**: Complete navigation guide for all code modules and services

---

## 📁 Directory Structure

### `/src` - Main SvelteKit Application
- **`routes/`** - Page routes and API endpoints
  - `(app)/` - Protected routes (auth required)
  - `(auth)/` - Public auth routes
  - `api/` - API endpoints (PDF generation, document signing, etc.)
- **`lib/`** - Reusable code
  - `components/` - UI components (assessment, data, forms, ui)
  - `services/` - Business logic services
  - `types/` - TypeScript definitions
  - `utils/` - Helper functions
  - `templates/` - Document templates (PDF, reports)
  - `constants/` - Configuration constants
- **`hooks.server.ts`** - Auth guard, Supabase setup
- **`app.html`** - HTML shell
- **`app.css`** - Global styles

### `/supabase` - Database
- **`migrations/`** - 50+ SQL migrations
- **`config.toml`** - Supabase configuration
- **`seed.sql`** - Initial data

### `/servers` - MCP Servers
- **`supabase/`** - Supabase MCP server
- **`shadcn-svelte-mcp/`** - Shadcn component MCP
- **`github/`** - GitHub MCP
- **`playwright/`** - Playwright MCP
- **`chrome/`** - Chrome DevTools MCP

### `/scripts` - Build & Utility Scripts
- `generate-types.ps1` - Generate Supabase types
- `apply-migration.mjs` - Apply DB migrations
- `check-db-state.ts` - Verify DB state

### `/e2e` - End-to-End Tests
- Playwright test suites

### `/.agent` - Agent Documentation
- **`System/`** - Architecture & current state
- **`SOP/`** - Standard operating procedures
- **`Tasks/`** - PRDs & implementation plans
- **`README.md`** - Documentation index

---

## 🔑 Key Services

### Authentication (`src/lib/services/auth.service.ts`)
- Email/password auth
- Role-based access (admin/engineer)
- Session management

### Assessment (`src/lib/services/assessment.service.ts`)
- 10-stage pipeline management
- Status transitions
- Audit logging

### PDF Generation (`src/routes/api/generate-*/`)
- Assessment reports
- Estimate documents
- FRC reports
- Photo galleries

### Storage (`src/lib/services/storage.service.ts`)
- File uploads with automatic compression
- Signed URL generation
- Bucket management
- Photo compression integration

### Image Compression (`src/lib/services/image-compression.service.ts`)
- Client-side photo compression
- HEIC to JPEG conversion
- Progress tracking
- Graceful fallback

---

## 📊 Database Schema (28 Tables)
- `users` - User accounts
- `requests` - Insurance requests
- `inspections` - Inspection records
- `appointments` - Engineer appointments
- `assessments` - Main assessment records
- `assessment_*` - Assessment sub-tables (vehicle, damage, interior, etc.)
- `estimates` - Repair estimates
- `frc` - Final repair confirmation
- `companies` - Company settings
- `clients` - Client records
- `engineers` - Engineer profiles

---

## 🛠️ Configuration Files
- `svelte.config.js` - SvelteKit config (Vercel adapter, 300s timeout)
- `vite.config.ts` - Vite build config
- `tsconfig.json` - TypeScript config
- `eslint.config.js` - Linting rules
- `.prettierrc` - Code formatting
- `playwright.config.ts` - E2E test config

---

## 🚀 Build & Deployment
- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Check**: `npm run check` (type checking)
- **Test**: `npm run test` (unit + e2e)
- **Deploy**: Vercel (auto on push to main)

---

## 📚 Related Documentation
- `.agent/System/project_architecture.md` - Detailed architecture
- `.agent/System/database_schema.md` - Full DB schema
- `.agent/README/task_guides.md` - How-to guides
- `.agent/README/sops.md` - Standard procedures

