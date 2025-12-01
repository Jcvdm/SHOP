# Technology Stack

## Frontend Framework

### SvelteKit 2.22.0
- **Meta-framework** for building the web application
- File-based routing with route groups
- Server-side rendering (SSR) and API routes
- Form actions for data mutations
- Built on **Svelte 5.0** with runes-based reactivity

### Svelte 5.0
- Component-based UI framework
- Runes for reactive state management (`$state`, `$derived`, `$effect`)
- Compiled components for optimal performance
- TypeScript support

## Backend Services

### Supabase
- **Database**: PostgreSQL with automatic REST API
- **Authentication**: Built-in auth with JWT tokens
- **Storage**: File storage with signed URLs
- **Real-time**: WebSocket support (not currently used)
- **Row Level Security (RLS)**: Database-level access control

#### Supabase Packages
- `@supabase/supabase-js@2.58.0` - JavaScript client
- `@supabase/ssr@0.7.0` - SSR helpers for SvelteKit

## Deployment

### Vercel
- **Hosting platform** for SvelteKit app
- Serverless functions for API routes
- Edge network for static assets
- Preview deployments for branches
- Adapter: `@sveltejs/adapter-vercel@5.6.3`
- **Configuration**: 300s max duration for PDF generation functions

## UI & Styling

### Tailwind CSS 4.0
- Utility-first CSS framework
- Vite plugin: `@tailwindcss/vite@4.0.0`
- Official plugins:
  - `@tailwindcss/forms` - Form styling
  - `@tailwindcss/typography` - Rich text styling

### Component Libraries
- **bits-ui@2.11.4** - Headless UI components
- **lucide-svelte@0.544.0** - Icon library

### Utilities
- **clsx@2.1.1** - Conditional class names
- **tailwind-merge@3.3.1** - Merge Tailwind classes
- **tailwind-variants@3.1.1** - Component variants
- **tw-animate-css@1.4.0** - Animation utilities

## File Handling

### Upload
- **filepond@4.32.9** - File upload UI
- **svelte-filepond@0.2.2** - Svelte wrapper
- **filepond-plugin-file-validate-type** - Type validation
- **filepond-plugin-image-preview** - Image previews

### Processing
- **jszip@3.10.1** - ZIP archive creation (for photo downloads)

## PDF Generation

### Puppeteer@24.24.0
- Headless Chrome for server-side PDF rendering
- Converts HTML templates to PDF documents
- Handles complex layouts with photos
- Configured for long-running operations (1-2 minutes)

## Date Handling

### @internationalized/date@3.10.0
- Internationalized date handling
- Timezone support
- Calendar systems

## Development Tools

### Build Tools
- **Vite@7.0.4** - Build tool and dev server
- **@sveltejs/vite-plugin-svelte@6.0.0** - Svelte integration

### TypeScript
- **typescript@5.0.0** - Type safety
- **typescript-eslint@8.20.0** - ESLint TypeScript support

### Code Quality
- **ESLint@9.22.0** - Linting
  - `eslint-plugin-svelte@3.0.0`
  - `eslint-config-prettier@10.0.1`
- **Prettier@3.4.2** - Code formatting
  - `prettier-plugin-svelte@3.3.3`
  - `prettier-plugin-tailwindcss@0.6.11`
- **svelte-check@4.0.0** - Svelte type checking

### Testing
- **Vitest@3.2.3** - Unit testing framework
  - `@vitest/browser@3.2.3` - Browser testing
  - `vitest-browser-svelte@0.1.0` - Svelte browser testing
- **Playwright@1.53.0** - E2E testing
  - `@playwright/test@1.49.1`

## Environment & Configuration

### Node.js
- **Type**: ES Modules (`"type": "module"`)
- **Types**: `@types/node@22`

### Package Manager
- npm (standard)

### Version Control
- Git
- Current branch: `feature/auth-setup`

## Runtime Environment Variables

### Public (Client-side)
- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Private (Server-side only)
- `SUPABASE_SERVICE_ROLE_KEY` - Elevated permissions for server operations

## Key Version Constraints

- Node.js LTS recommended
- Tailwind CSS 4.0 (latest major version)
- Svelte 5.0 (latest major version using runes)
- SvelteKit 2.x (stable)

## Browser Support

- Modern browsers with ES2022+ support
- No legacy browser support needed
- Relies on native ESM in browser
