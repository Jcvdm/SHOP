# MCP Code API Reference

**Last Updated**: November 9, 2025
**Version**: 1.0

---

## Usage Note

**IMPORTANT**: This reference documents MCP tools that **Claude calls** to fetch data. These are NOT imported by code execution.

### The Two-Phase Pattern

Code execution uses a two-phase approach:

**Phase 1 - Data Fetching** (Claude calls MCP tools):
```typescript
// Claude calls MCP tools (documented in this reference)
const data = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: 'SELECT * FROM assessments'
});
```

**Phase 2 - Data Processing** (Claude executes code):
```typescript
// Claude embeds data and processes with code
const code = `
  const data = ${JSON.stringify(data)};
  // Processing logic here
  console.log(data.length);
`;

await mcp__ide__executeCode({ code });
```

This reference documents **Phase 1 tools** (MCP tool calls by Claude).

For complete code execution guide, see `.agent/SOP/using_code_executor.md`.

---

## Overview

This document provides the complete API reference for all ClaimTech MCP tools. Claude calls these tools directly to fetch data, which can then be processed using code execution.

---

## Table of Contents

1. [Supabase Server](#supabase-server)
   - [Database Operations](#database-operations)
   - [Project Management](#project-management)
   - [Edge Functions](#edge-functions)
   - [Branches](#branches)
2. [GitHub Server](#github-server)
   - [Repository Operations](#repository-operations)
   - [Pull Requests](#pull-requests)
   - [Issues](#issues)
   - [Search](#search)
3. [Playwright Server](#playwright-server)
   - [Browser Automation](#browser-automation)
   - [Assertions](#assertions)
4. [Svelte Server](#svelte-server)
5. [Chrome DevTools Server](#chrome-devtools-server)
6. [Context7 Server](#context7-server)

---

## Supabase Server

**MCP Server**: `supabase`

**Purpose**: Database operations, migrations, edge functions, project management for Supabase projects.

**Usage**: Claude calls these MCP tools to fetch/modify data. The results can then be processed using code execution.

### Database Operations

**MCP Tool**: `mcp__supabase__execute_sql`

#### `executeSQL()`

Execute raw SQL query on Supabase database.

**MCP Tool Call**:
```typescript
// Claude calls this MCP tool:
const result = await mcp__supabase__execute_sql({
  project_id: string,
  query: string
})
```

**Parameters**:
- `project_id` (string, required): Supabase project ID
- `query` (string, required): SQL query to execute

**Returns**: Array of query results (rows)

**Throws**: Error if query fails

**Example**:
```typescript
// Claude calls MCP tool to fetch data
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: 'SELECT * FROM assessments WHERE stage = $1'
});

// Query with JOIN
const enriched = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT a.*, c.client_name, e.name as engineer_name
    FROM assessments a
    LEFT JOIN claims c ON a.claim_id = c.id
    LEFT JOIN engineers e ON a.engineer_id = e.id
    WHERE a.stage = 'completed'
  `
});

// Aggregate query
const stats = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      stage,
      COUNT(*) as count,
      AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_hours
    FROM assessments
    GROUP BY stage
  `
});
```

---

#### `applyMigration()`

Apply a database migration to Supabase project.

**MCP Tool**: `mcp__supabase__apply_migration`

**MCP Tool Call**:
```typescript
// Claude calls this MCP tool:
await mcp__supabase__apply_migration({
  project_id: string,
  name: string,
  query: string
})
```

**Parameters**:
- `project_id` (string, required): Supabase project ID
- `name` (string, required): Migration name in snake_case
- `query` (string, required): SQL migration query

**Returns**: void (throws on error)

**Throws**: Error if migration fails

**Example**:
```typescript
// Claude calls MCP tool to apply migration
await mcp__supabase__apply_migration({
  project_id: env.SUPABASE_PROJECT_ID,
  name: 'add_comments_table',
  query: `
    -- Create comments table
    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Add RLS policies
    ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view comments on their assessments"
      ON comments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM assessments a
          WHERE a.id = comments.assessment_id
          AND a.company_id = auth.jwt()->>'company_id'::uuid
        )
      );

    -- Add indexes
    CREATE INDEX idx_comments_assessment_id ON comments(assessment_id);
    CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
  `
});
```

---

#### `listTables()`

List all tables in specified schemas.

**Signature**:
```typescript
async function listTables(params: {
  projectId: string;
  schemas?: string[];
}): Promise<Table[]>
```

**Parameters**:
- `projectId` (string, required): Supabase project ID
- `schemas` (string[], optional): Schemas to list tables from (default: `['public']`)

**Returns**: Array of table metadata

**Example**:
```typescript
import { listTables } from '/servers/supabase/database';

// List tables in public schema
const tables = await listTables({
  projectId: process.env.SUPABASE_PROJECT_ID!
});

console.log('Tables:', tables.map(t => t.name));

// List tables in multiple schemas
const allTables = await listTables({
  projectId: process.env.SUPABASE_PROJECT_ID!,
  schemas: ['public', 'auth', 'storage']
});
```

---

#### `listMigrations()`

List all migrations in database.

**Signature**:
```typescript
async function listMigrations(params: {
  projectId: string;
}): Promise<Migration[]>
```

**Parameters**:
- `projectId` (string, required): Supabase project ID

**Returns**: Array of migration metadata

**Example**:
```typescript
import { listMigrations } from '/servers/supabase/database';

const migrations = await listMigrations({
  projectId: process.env.SUPABASE_PROJECT_ID!
});

console.log('Applied migrations:', migrations.map(m => m.name));
```

---

#### `generateTypes()`

Generate TypeScript types from database schema.

**Signature**:
```typescript
async function generateTypes(params: {
  projectId: string;
}): Promise<string>
```

**Parameters**:
- `projectId` (string, required): Supabase project ID

**Returns**: TypeScript type definitions as string

**Example**:
```typescript
import { generateTypes } from '/servers/supabase/database';
import { writeFile } from 'fs/promises';

const types = await generateTypes({
  projectId: process.env.SUPABASE_PROJECT_ID!
});

// Write to file
await writeFile('src/lib/types/database.types.ts', types);
console.log('Types generated successfully');
```

---

### Project Management

**Import**: `import { ... } from '/servers/supabase/projects';`

#### `listProjects()`

List all Supabase projects.

**Signature**:
```typescript
async function listProjects(): Promise<Project[]>
```

**Returns**: Array of project metadata

**Example**:
```typescript
import { listProjects } from '/servers/supabase/projects';

const projects = await listProjects();

for (const project of projects) {
  console.log(`${project.name} (${project.id}) - ${project.status}`);
}
```

---

#### `getProject()`

Get details for a Supabase project.

**Signature**:
```typescript
async function getProject(params: {
  id: string;
}): Promise<Project>
```

**Parameters**:
- `id` (string, required): Project ID

**Returns**: Project details

**Example**:
```typescript
import { getProject } from '/servers/supabase/projects';

const project = await getProject({
  id: process.env.SUPABASE_PROJECT_ID!
});

console.log('Project:', project.name);
console.log('Region:', project.region);
console.log('Status:', project.status);
```

---

### Edge Functions

**Import**: `import { ... } from '/servers/supabase/functions';`

#### `deployEdgeFunction()`

Deploy an Edge Function to Supabase project.

**Signature**:
```typescript
async function deployEdgeFunction(params: {
  projectId: string;
  name: string;
  files: Array<{ name: string; content: string }>;
  entrypointPath?: string;
  importMapPath?: string;
}): Promise<void>
```

**Parameters**:
- `projectId` (string, required): Supabase project ID
- `name` (string, required): Function name
- `files` (array, required): Files to deploy
- `entrypointPath` (string, optional): Entrypoint file (default: 'index.ts')
- `importMapPath` (string, optional): Import map file

**Returns**: void (throws on error)

**Example**:
```typescript
import { deployEdgeFunction } from '/servers/supabase/functions';

await deployEdgeFunction({
  projectId: process.env.SUPABASE_PROJECT_ID!,
  name: 'send-email',
  files: [
    {
      name: 'index.ts',
      content: `
        import { serve } from 'std/http/server.ts';

        serve(async (req) => {
          const { to, subject, body } = await req.json();

          // Send email logic here

          return new Response(
            JSON.stringify({ success: true }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        });
      `
    }
  ]
});
```

---

#### `listEdgeFunctions()`

List all Edge Functions in project.

**Signature**:
```typescript
async function listEdgeFunctions(params: {
  projectId: string;
}): Promise<EdgeFunction[]>
```

**Parameters**:
- `projectId` (string, required): Supabase project ID

**Returns**: Array of Edge Function metadata

**Example**:
```typescript
import { listEdgeFunctions } from '/servers/supabase/functions';

const functions = await listEdgeFunctions({
  projectId: process.env.SUPABASE_PROJECT_ID!
});

console.log('Edge Functions:', functions.map(f => f.name));
```

---

### Branches

**Import**: `import { ... } from '/servers/supabase/branches';`

#### `createBranch()`

Create a development branch on Supabase project.

**Signature**:
```typescript
async function createBranch(params: {
  projectId: string;
  name?: string;
  confirmCostId: string;
}): Promise<Branch>
```

**Parameters**:
- `projectId` (string, required): Supabase project ID
- `name` (string, optional): Branch name (default: 'develop')
- `confirmCostId` (string, required): Cost confirmation ID from `confirmCost()`

**Returns**: Branch details with new project_id

**Example**:
```typescript
import { createBranch } from '/servers/supabase/branches';

const branch = await createBranch({
  projectId: process.env.SUPABASE_PROJECT_ID!,
  name: 'feature-comments',
  confirmCostId: 'cost_123456'
});

console.log('Branch created with project ID:', branch.project_id);
```

---

#### `listBranches()`

List all development branches.

**Signature**:
```typescript
async function listBranches(params: {
  projectId: string;
}): Promise<Branch[]>
```

**Parameters**:
- `projectId` (string, required): Supabase project ID

**Returns**: Array of branch details

**Example**:
```typescript
import { listBranches } from '/servers/supabase/branches';

const branches = await listBranches({
  projectId: process.env.SUPABASE_PROJECT_ID!
});

for (const branch of branches) {
  console.log(`${branch.name} - ${branch.status}`);
}
```

---

## GitHub Server

**MCP Server**: `github`

**Purpose**: Repository operations, pull requests, issues, code search.

**Usage**: Claude calls these MCP tools to interact with GitHub. The results can then be processed using code execution.

### Repository Operations

**MCP Tool Prefix**: `mcp__github__`

#### `getFileContents()`

Get file contents from GitHub repository.

**MCP Tool**: `mcp__github__get_file_contents`

**MCP Tool Call**:
```typescript
// Claude calls this MCP tool:
const file = await mcp__github__get_file_contents({
  owner: string,
  repo: string,
  path: string,
  ref?: string
})
```

**Parameters**:
- `owner` (string, required): Repository owner
- `repo` (string, required): Repository name
- `path` (string, required): File path
- `ref` (string, optional): Git ref (branch, tag, commit SHA)

**Returns**: File contents and metadata

**Example**:
```typescript
// Claude calls MCP tool to fetch file
const file = await mcp__github__get_file_contents({
  owner: 'claimtech',
  repo: 'platform',
  path: 'src/lib/services/AssessmentService.ts'
});

console.log('File content:', file.content);
console.log('File size:', file.size);
console.log('SHA:', file.sha);
```

---

#### `pushFiles()`

Push multiple files to repository in single commit.

**Signature**:
```typescript
async function pushFiles(params: {
  owner: string;
  repo: string;
  branch: string;
  files: Array<{ path: string; content: string }>;
  message: string;
}): Promise<void>
```

**Parameters**:
- `owner` (string, required): Repository owner
- `repo` (string, required): Repository name
- `branch` (string, required): Branch name
- `files` (array, required): Files to push
- `message` (string, required): Commit message

**Returns**: void (throws on error)

**Example**:
```typescript
import { pushFiles } from '/servers/github/repo';

await pushFiles({
  owner: 'claimtech',
  repo: 'platform',
  branch: 'feature/batch-update',
  files: [
    {
      path: 'src/lib/services/CommentService.ts',
      content: 'export class CommentService { ... }'
    },
    {
      path: 'src/lib/types/comment.ts',
      content: 'export interface Comment { ... }'
    }
  ],
  message: 'feat: add comment service and types'
});
```

---

#### `listCommits()`

List commits in repository.

**Signature**:
```typescript
async function listCommits(params: {
  owner: string;
  repo: string;
  sha?: string;
  page?: number;
  perPage?: number;
}): Promise<Commit[]>
```

**Parameters**:
- `owner` (string, required): Repository owner
- `repo` (string, required): Repository name
- `sha` (string, optional): Branch/tag/commit SHA
- `page` (number, optional): Page number for pagination
- `perPage` (number, optional): Results per page (max 100)

**Returns**: Array of commits

**Example**:
```typescript
import { listCommits } from '/servers/github/repo';

const commits = await listCommits({
  owner: 'claimtech',
  repo: 'platform',
  sha: 'dev',
  perPage: 10
});

for (const commit of commits) {
  console.log(`${commit.sha.substring(0, 7)} - ${commit.message}`);
}
```

---

#### `searchCode()`

Search code across all repositories.

**Signature**:
```typescript
async function searchCode(params: {
  query: string;
  page?: number;
  perPage?: number;
}): Promise<{ items: CodeSearchResult[]; totalCount: number }>
```

**Parameters**:
- `query` (string, required): Search query (GitHub code search syntax)
- `page` (number, optional): Page number
- `perPage` (number, optional): Results per page (max 100)

**Returns**: Search results and total count

**Example**:
```typescript
import { searchCode } from '/servers/github/repo';

// Search for ServiceClient usage
const results = await searchCode({
  query: 'ServiceClient language:typescript repo:claimtech/platform'
});

console.log(`Found ${results.totalCount} results`);

for (const item of results.items) {
  console.log(`${item.path}:${item.line}`);
}
```

---

### Pull Requests

**MCP Tool Prefix**: `mcp__github__`

#### `createPR()`

Create a new pull request.

**MCP Tool**: `mcp__github__create_pull_request`

**MCP Tool Call**:
```typescript
// Claude calls this MCP tool:
const pr = await mcp__github__create_pull_request({
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  body?: string,
  draft?: boolean
})
```

**Parameters**:
- `owner` (string, required): Repository owner
- `repo` (string, required): Repository name
- `title` (string, required): PR title
- `head` (string, required): Branch containing changes
- `base` (string, required): Branch to merge into
- `body` (string, optional): PR description
- `draft` (boolean, optional): Create as draft

**Returns**: Pull request details

**Example**:
```typescript
// Claude calls MCP tool to create PR
const pr = await mcp__github__create_pull_request({
  owner: 'claimtech',
  repo: 'platform',
  title: 'feat: add comments feature',
  head: 'feature/comments',
  base: 'dev',
  body: `
## Summary
- Adds CommentService for managing comments
- Implements inline comment UI
- Adds RLS policies for comments table

## Test Plan
- [ ] Test comment creation
- [ ] Test comment editing
- [ ] Test comment deletion
- [ ] Verify RLS policies
  `
});

console.log('PR created:', pr.html_url);
```

---

#### `listPRs()`

List pull requests in repository.

**Signature**:
```typescript
async function listPRs(params: {
  owner: string;
  repo: string;
  state?: 'open' | 'closed' | 'all';
  page?: number;
  perPage?: number;
}): Promise<PullRequest[]>
```

**Parameters**:
- `owner` (string, required): Repository owner
- `repo` (string, required): Repository name
- `state` (string, optional): Filter by state (default: 'open')
- `page` (number, optional): Page number
- `perPage` (number, optional): Results per page

**Returns**: Array of pull requests

**Example**:
```typescript
import { listPRs } from '/servers/github/pulls';

// Get all open PRs
const openPRs = await listPRs({
  owner: 'claimtech',
  repo: 'platform',
  state: 'open'
});

console.log(`${openPRs.length} open PRs`);

// Get recently closed PRs
const closedPRs = await listPRs({
  owner: 'claimtech',
  repo: 'platform',
  state: 'closed',
  perPage: 10
});
```

---

#### `mergePR()`

Merge a pull request.

**Signature**:
```typescript
async function mergePR(params: {
  owner: string;
  repo: string;
  pullNumber: number;
  mergeMethod?: 'merge' | 'squash' | 'rebase';
  commitTitle?: string;
  commitMessage?: string;
}): Promise<void>
```

**Parameters**:
- `owner` (string, required): Repository owner
- `repo` (string, required): Repository name
- `pullNumber` (number, required): PR number
- `mergeMethod` (string, optional): Merge method (default: 'merge')
- `commitTitle` (string, optional): Custom commit title
- `commitMessage` (string, optional): Custom commit message

**Returns**: void (throws on error)

**Example**:
```typescript
import { mergePR } from '/servers/github/pulls';

await mergePR({
  owner: 'claimtech',
  repo: 'platform',
  pullNumber: 123,
  mergeMethod: 'squash',
  commitTitle: 'feat: add comments feature (#123)'
});
```

---

### Issues

**Import**: `import { ... } from '/servers/github/issues';`

#### `createIssue()`

Create a new issue.

**Signature**:
```typescript
async function createIssue(params: {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}): Promise<Issue>
```

**Parameters**:
- `owner` (string, required): Repository owner
- `repo` (string, required): Repository name
- `title` (string, required): Issue title
- `body` (string, optional): Issue description
- `labels` (string[], optional): Labels to apply
- `assignees` (string[], optional): Usernames to assign

**Returns**: Issue details

**Example**:
```typescript
import { createIssue } from '/servers/github/issues';

const issue = await createIssue({
  owner: 'claimtech',
  repo: 'platform',
  title: 'Add support for bulk photo labeling',
  body: `
## Description
Add ability to label multiple photos at once.

## Acceptance Criteria
- [ ] Select multiple photos
- [ ] Apply label to all selected
- [ ] Update optimistically
  `,
  labels: ['enhancement', 'photos'],
  assignees: ['jcvdm']
});

console.log('Issue created:', issue.html_url);
```

---

#### `listIssues()`

List issues in repository.

**Signature**:
```typescript
async function listIssues(params: {
  owner: string;
  repo: string;
  state?: 'OPEN' | 'CLOSED';
  labels?: string[];
  perPage?: number;
  after?: string;
}): Promise<Issue[]>
```

**Parameters**:
- `owner` (string, required): Repository owner
- `repo` (string, required): Repository name
- `state` (string, optional): Filter by state
- `labels` (string[], optional): Filter by labels
- `perPage` (number, optional): Results per page
- `after` (string, optional): Cursor for pagination

**Returns**: Array of issues

**Example**:
```typescript
import { listIssues } from '/servers/github/issues';

const issues = await listIssues({
  owner: 'claimtech',
  repo: 'platform',
  state: 'OPEN',
  labels: ['bug'],
  perPage: 20
});

console.log(`${issues.length} open bugs`);
```

---

### Search

**Import**: `import { ... } from '/servers/github/search';`

#### `searchIssues()`

Search for issues across repositories.

**Signature**:
```typescript
async function searchIssues(params: {
  query: string;
  owner?: string;
  repo?: string;
  page?: number;
  perPage?: number;
}): Promise<{ items: Issue[]; totalCount: number }>
```

**Parameters**:
- `query` (string, required): Search query
- `owner` (string, optional): Filter to specific owner
- `repo` (string, optional): Filter to specific repo
- `page` (number, optional): Page number
- `perPage` (number, optional): Results per page

**Returns**: Search results

**Example**:
```typescript
import { searchIssues } from '/servers/github/search';

const results = await searchIssues({
  query: 'is:open label:bug assignee:@me',
  owner: 'claimtech',
  repo: 'platform'
});

console.log(`Found ${results.totalCount} bugs assigned to me`);
```

---

## Playwright Server

**MCP Server**: `playwright`

**Purpose**: Browser automation and E2E testing.

**Usage**: Claude calls these MCP tools to control a browser for testing. Results can be processed using code execution.

### Browser Automation

**MCP Tool Prefix**: `mcp__playwright__`

#### `navigate()`

Navigate browser to URL.

**MCP Tool**: `mcp__playwright__navigate` (if available)

**MCP Tool Call**:
```typescript
// Claude calls this MCP tool:
await mcp__playwright__navigate({
  url: string
})
```

**Parameters**:
- `url` (string, required): URL to navigate to

**Returns**: void

**Example**:
```typescript
// Claude calls MCP tool to navigate browser
await mcp__playwright__navigate({
  url: 'http://localhost:5173/login'
});
```

---

#### `click()`

Click an element.

**Signature**:
```typescript
async function click(params: {
  selector: string;
}): Promise<void>
```

**Parameters**:
- `selector` (string, required): CSS selector

**Returns**: void

**Example**:
```typescript
import { click } from '/servers/playwright/browser';

await click({ selector: 'button[type="submit"]' });
```

---

#### `screenshot()`

Take a screenshot.

**Signature**:
```typescript
async function screenshot(params: {
  fullPage?: boolean;
  path?: string;
}): Promise<Buffer>
```

**Parameters**:
- `fullPage` (boolean, optional): Capture full page
- `path` (string, optional): Save to path

**Returns**: Screenshot buffer

**Example**:
```typescript
import { screenshot } from '/servers/playwright/browser';

const img = await screenshot({
  fullPage: true,
  path: '.agent/Logs/screenshots/test.png'
});
```

---

## Svelte Server

**MCP Server**: `svelte`

**Purpose**: Svelte/SvelteKit diagnostics and framework guidance.

**Usage**: Claude calls these MCP tools for Svelte-specific analysis.

#### `getDiagnostics()`

Get diagnostics for Svelte files.

**MCP Tool**: `mcp__svelte__get_diagnostics` (if available)

**MCP Tool Call**:
```typescript
// Claude calls this MCP tool:
const diagnostics = await mcp__svelte__get_diagnostics({
  uri?: string
})
```

**Parameters**:
- `uri` (string, optional): File URI to get diagnostics for

**Returns**: Array of diagnostics

**Example**:
```typescript
// Claude calls MCP tool to get diagnostics
const diagnostics = await mcp__svelte__get_diagnostics({
  uri: 'file:///src/routes/assessments/+page.svelte'
});

for (const diag of diagnostics) {
  console.log(`${diag.severity}: ${diag.message} at line ${diag.line}`);
}
```

---

## Chrome DevTools Server

**MCP Server**: `chrome-devtools`

**Purpose**: Browser runtime inspection and debugging.

**Usage**: Claude calls these MCP tools for browser debugging. API details depend on specific Chrome DevTools MCP implementation.

**Note**: Refer to specific MCP tool names available in your Chrome DevTools MCP server configuration.

---

## Context7 Server

**MCP Server**: `context7`

**Purpose**: Documentation search and library reference lookup.

**Usage**: Claude calls these MCP tools to search external documentation.

#### `search()`

Search documentation.

**MCP Tool**: `mcp__context7__search` (if available)

**MCP Tool Call**:
```typescript
// Claude calls this MCP tool:
const results = await mcp__context7__search({
  query: string,
  library?: string
})
```

**Parameters**:
- `query` (string, required): Search query
- `library` (string, optional): Filter to specific library

**Returns**: Array of search results

**Example**:
```typescript
// Claude calls MCP tool to search docs
const results = await mcp__context7__search({
  query: 'SvelteKit form actions',
  library: 'svelte'
});

for (const result of results) {
  console.log(`${result.title}: ${result.url}`);
}
```

---

## Error Handling

All server wrapper functions follow consistent error handling:

```typescript
try {
  const result = await executeSQL({ query: '...' });
  return result;
} catch (error) {
  // Error contains descriptive message
  console.error('Operation failed:', error.message);
  throw error; // Re-throw or handle
}
```

### Common Error Types

- **`AuthenticationError`**: Invalid credentials or expired token
- **`PermissionError`**: Insufficient permissions for operation
- **`NotFoundError`**: Resource not found
- **`ValidationError`**: Invalid parameters
- **`NetworkError`**: Network connection issue
- **`TimeoutError`**: Operation exceeded timeout

---

## Type Definitions

### Common Types

```typescript
// Pagination
interface PaginationParams {
  page?: number;
  perPage?: number;
}

// Response wrapper
interface MCPResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// SQL result
interface SQLResult {
  [key: string]: any;
}

// File contents
interface FileContents {
  content: string;
  encoding: string;
  size: number;
  sha: string;
  path: string;
}

// Commit
interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
}

// Pull Request
interface PullRequest {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  html_url: string;
  head: { ref: string };
  base: { ref: string };
  merged_at?: string;
}

// Issue
interface Issue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  html_url: string;
  labels: Array<{ name: string }>;
  assignees: Array<{ login: string }>;
}
```

---

## Environment Variables

**For MCP Tool Calls** (Phase 1 - Data Fetching):

Most MCP tools are authenticated automatically by the MCP server. Claude has access to environment variables when making MCP tool calls:

```typescript
// Claude uses these when calling MCP tools:
env.SUPABASE_PROJECT_ID
env.PUBLIC_SUPABASE_URL
env.PUBLIC_SUPABASE_ANON_KEY
env.SUPABASE_SERVICE_ROLE_KEY

// GitHub credentials are handled by MCP server
```

**For Code Execution** (Phase 2 - Data Processing):

If using Architecture B (direct client access) in code execution, credentials must be passed explicitly:

```typescript
// Must be passed to mcp__ide__executeCode:
await mcp__ide__executeCode({
  code: '...',
  env: {
    PUBLIC_SUPABASE_URL: env.PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY: env.PUBLIC_SUPABASE_ANON_KEY
  }
});
```

**Note**: Architecture A (MCP → Code) does not require credentials in code execution since data is pre-fetched.

---

## Related Documentation

- **Architecture**: `.agent/System/code_execution_architecture.md` - System overview
- **Patterns**: `.agent/System/code_execution_patterns.md` - Common recipes
- **Usage Guide**: `.agent/SOP/using_code_executor.md` - Step-by-step procedures
- **MCP Setup**: `.agent/System/mcp_setup.md` - Server configuration

---

**Document Version**: 1.0
**Last Review**: November 9, 2025
**Next Review**: December 2025
