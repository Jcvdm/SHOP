# SOP: Creating Components

## Overview

This document describes how to create reusable Svelte components in the ClaimTech application using Svelte 5 with runes.

## Component Organization

Components are organized in `src/lib/components/` by category:

```
src/lib/components/
├── ui/              # Base UI primitives (buttons, inputs, modals)
├── forms/           # Form-specific components
├── layout/          # Layout components (nav, sidebar, header)
├── shared/          # Shared business components
├── assessment/      # Assessment-specific components
└── data/            # Data display (tables, cards, lists)
```

## Component File Naming

- **PascalCase** for component files: `NotificationCard.svelte`
- **Index exports** for component groups: `ui/index.ts`
- **Co-located files**: Component + types + tests in same folder

## Creating a New Component

### Step 1: Choose Component Location

**Decision Tree**:
- Generic, reusable UI? → `ui/`
- Form-related? → `forms/`
- Layout/navigation? → `layout/`
- Business logic, used across features? → `shared/`
- Assessment-specific? → `assessment/`
- Data display (table, card, list)? → `data/`

### Step 2: Create Component File

**Example**: Creating a NotificationCard component

**File**: `src/lib/components/shared/NotificationCard.svelte`

```svelte
<script lang="ts">
  import type { Notification } from '$lib/types/notification';
  import { formatDate } from '$lib/utils/date';

  // Props using Svelte 5 $props rune
  let {
    notification,
    onRead,
    onDelete
  }: {
    notification: Notification;
    onRead?: (id: string) => void;
    onDelete?: (id: string) => void;
  } = $props();

  // Derived state using $derived rune
  let isUnread = $derived(!notification.read_at);
  let formattedDate = $derived(formatDate(notification.created_at));

  // Event handlers
  function handleRead() {
    if (onRead) {
      onRead(notification.id);
    }
  }

  function handleDelete() {
    if (onDelete) {
      onDelete(notification.id);
    }
  }
</script>

<div
  class="notification-card"
  class:unread={isUnread}
>
  <div class="notification-header">
    <h3>{notification.title}</h3>
    <span class="notification-time">{formattedDate}</span>
  </div>

  <p class="notification-message">{notification.message}</p>

  <div class="notification-actions">
    {#if isUnread}
      <button onclick={handleRead} class="btn-secondary">
        Mark as Read
      </button>
    {/if}

    <button onclick={handleDelete} class="btn-danger">
      Delete
    </button>
  </div>
</div>

<style>
  .notification-card {
    @apply border rounded-lg p-4 bg-white;
  }

  .notification-card.unread {
    @apply border-blue-500 bg-blue-50;
  }

  .notification-header {
    @apply flex justify-between items-center mb-2;
  }

  .notification-header h3 {
    @apply text-lg font-semibold;
  }

  .notification-time {
    @apply text-sm text-gray-500;
  }

  .notification-message {
    @apply text-gray-700 mb-4;
  }

  .notification-actions {
    @apply flex gap-2;
  }
</style>
```

### Step 3: Create Type Definitions (if needed)

**File**: `src/lib/types/notification.ts`

```typescript
export interface Notification {
  id: string;
  title: string;
  message: string;
  user_id: string;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### Step 4: Export from Index (optional)

**File**: `src/lib/components/shared/index.ts`

```typescript
export { default as NotificationCard } from './NotificationCard.svelte';
export { default as UserAvatar } from './UserAvatar.svelte';
// ... other exports
```

### Step 5: Use Component

```svelte
<script lang="ts">
  import NotificationCard from '$lib/components/shared/NotificationCard.svelte';
  // Or if using index exports:
  // import { NotificationCard } from '$lib/components/shared';

  let { data } = $props();

  function handleRead(id: string) {
    // Mark notification as read
  }

  function handleDelete(id: string) {
    // Delete notification
  }
</script>

{#each data.notifications as notification}
  <NotificationCard
    {notification}
    onRead={handleRead}
    onDelete={handleDelete}
  />
{/each}
```

## Svelte 5 Patterns

### State Management with Runes

```svelte
<script lang="ts">
  // Local state
  let count = $state(0);

  // Derived state (automatically recomputes when dependencies change)
  let doubled = $derived(count * 2);

  // Side effects (runs when dependencies change)
  $effect(() => {
    console.log('Count changed:', count);
  });

  // Props
  let { initialValue }: { initialValue: number } = $props();

  // Initialize state from props
  let value = $state(initialValue);
</script>

<button onclick={() => count++}>
  Count: {count} (doubled: {doubled})
</button>
```

### Props with TypeScript

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  // Required and optional props
  let {
    title,
    description = 'Default description',  // Optional with default
    onSubmit,
    children
  }: {
    title: string;                         // Required
    description?: string;                  // Optional
    onSubmit?: (data: FormData) => void;  // Optional callback
    children?: Snippet;                    // Slot content
  } = $props();
</script>

<div>
  <h1>{title}</h1>
  <p>{description}</p>

  {#if children}
    {@render children()}
  {/if}
</div>
```

### Event Handlers

```svelte
<script lang="ts">
  let {
    onSave,
    onCancel
  }: {
    onSave?: (value: string) => void;
    onCancel?: () => void;
  } = $props();

  let value = $state('');

  function handleSave() {
    if (onSave) {
      onSave(value);
    }
  }
</script>

<input type="text" bind:value />
<button onclick={handleSave}>Save</button>
<button onclick={onCancel}>Cancel</button>
```

### Slots with Snippets

```svelte
<!-- Parent.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    header,
    footer,
    children
  }: {
    header?: Snippet;
    footer?: Snippet;
    children?: Snippet;
  } = $props();
</script>

<div class="card">
  {#if header}
    <div class="card-header">
      {@render header()}
    </div>
  {/if}

  <div class="card-body">
    {#if children}
      {@render children()}
    {/if}
  </div>

  {#if footer}
    <div class="card-footer">
      {@render footer()}
    </div>
  {/if}
</div>

<!-- Usage -->
<Parent>
  {#snippet header()}
    <h2>Card Title</h2>
  {/snippet}

  <p>Card content goes here</p>

  {#snippet footer()}
    <button>Action</button>
  {/snippet}
</Parent>
```

### Reactive Bindings

```svelte
<script lang="ts">
  let formData = $state({
    name: '',
    email: '',
    message: ''
  });

  // Derived validation
  let isValid = $derived(
    formData.name.length > 0 &&
    formData.email.includes('@') &&
    formData.message.length > 10
  );
</script>

<form>
  <input type="text" bind:value={formData.name} />
  <input type="email" bind:value={formData.email} />
  <textarea bind:value={formData.message}></textarea>

  <button type="submit" disabled={!isValid}>
    Submit
  </button>
</form>
```

## Component Styling

### Tailwind Classes (Preferred)

```svelte
<div class="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
  <img src={avatar} alt={name} class="w-12 h-12 rounded-full" />
  <div>
    <h3 class="text-lg font-semibold">{name}</h3>
    <p class="text-sm text-gray-500">{email}</p>
  </div>
</div>
```

### Scoped Styles (When Needed)

```svelte
<div class="custom-card">
  <h3>{title}</h3>
</div>

<style>
  /* Scoped to this component only */
  .custom-card {
    @apply border rounded-lg p-4;
    background: linear-gradient(to right, #667eea, #764ba2);
  }

  .custom-card h3 {
    @apply text-white text-xl;
  }
</style>
```

### Dynamic Classes

```svelte
<script lang="ts">
  let { variant, size }: {
    variant: 'primary' | 'secondary' | 'danger';
    size: 'sm' | 'md' | 'lg';
  } = $props();

  let classes = $derived({
    'btn': true,
    'btn-primary': variant === 'primary',
    'btn-secondary': variant === 'secondary',
    'btn-danger': variant === 'danger',
    'btn-sm': size === 'sm',
    'btn-md': size === 'md',
    'btn-lg': size === 'lg'
  });
</script>

<button class:btn={classes.btn}
        class:btn-primary={classes['btn-primary']}
        class:btn-secondary={classes['btn-secondary']}
        class:btn-danger={classes['btn-danger']}
        class:btn-sm={classes['btn-sm']}
        class:btn-md={classes['btn-md']}
        class:btn-lg={classes['btn-lg']}>
  <slot />
</button>

<!-- Or use clsx utility -->
<script lang="ts">
  import { cn } from '$lib/utils';

  let { variant, size, class: className }: {
    variant: 'primary' | 'secondary' | 'danger';
    size: 'sm' | 'md' | 'lg';
    class?: string;
  } = $props();

  let buttonClass = $derived(cn(
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    className
  ));
</script>

<button class={buttonClass}>
  <slot />
</button>
```

## Form Components

### Input Component Example

```svelte
<script lang="ts">
  let {
    type = 'text',
    label,
    name,
    value = $bindable(''),  // Two-way binding
    error,
    required = false,
    disabled = false,
    placeholder
  }: {
    type?: string;
    label?: string;
    name: string;
    value?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
  } = $props();

  let inputId = $derived(`input-${name}`);
</script>

<div class="form-field">
  {#if label}
    <label for={inputId} class="form-label">
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}

  <input
    id={inputId}
    {type}
    {name}
    bind:value
    {required}
    {disabled}
    {placeholder}
    class="form-input"
    class:error={error}
  />

  {#if error}
    <span class="form-error">{error}</span>
  {/if}
</div>

<style>
  .form-field {
    @apply mb-4;
  }

  .form-label {
    @apply block mb-2 font-medium;
  }

  .form-input {
    @apply w-full px-3 py-2 border rounded;
  }

  .form-input.error {
    @apply border-red-500;
  }

  .form-error {
    @apply text-red-500 text-sm mt-1;
  }
</style>
```

## UI Component Patterns

### ActionIconButton Pattern

**When to use**:
- Table row actions (view, edit, delete, download)
- Inline editing controls
- Quick actions that don't need full button prominence
- Space-constrained interfaces

**Component**: `src/lib/components/data/ActionIconButton.svelte`

**Key Features**:
- Auto-handles `event.stopPropagation()` to prevent row click interference
- Built-in loading states with spinner
- Tooltip via `label` prop
- Multiple visual variants (default, primary, destructive, outline)
- Consistent sizing and spacing

**Basic Example**:

```svelte
<script>
  import ActionIconButton from '$lib/components/data/ActionIconButton.svelte';
  import { Edit, Trash2 } from 'lucide-svelte';

  let isDeleting = $state(false);

  async function handleDelete() {
    isDeleting = true;
    try {
      await deleteItem();
    } finally {
      isDeleting = false;
    }
  }
</script>

<ActionIconButton
  icon={Edit}
  label="Edit Item"
  onclick={handleEdit}
/>

<ActionIconButton
  icon={Trash2}
  label="Delete Item"
  onclick={handleDelete}
  loading={isDeleting}
  variant="destructive"
/>
```

**With ActionButtonGroup** (for multiple actions):

```svelte
<script>
  import ActionButtonGroup from '$lib/components/data/ActionButtonGroup.svelte';
  import ActionIconButton from '$lib/components/data/ActionIconButton.svelte';
  import { Eye, Edit, Download } from 'lucide-svelte';
</script>

<ActionButtonGroup align="right">
  <ActionIconButton
    icon={Eye}
    label="View Details"
    onclick={() => goto(`/items/${item.id}`)}
  />
  <ActionIconButton
    icon={Edit}
    label="Edit Item"
    onclick={() => openEditModal(item)}
  />
  <ActionIconButton
    icon={Download}
    label="Download"
    onclick={() => downloadItem(item)}
    loading={downloading === item.id}
  />
</ActionButtonGroup>
```

**Variants**:

| Variant | Use Case | Visual |
|---------|----------|--------|
| `default` | General actions (view, download) | Gray hover background |
| `primary` | Primary actions (start, continue) | Blue hover background |
| `destructive` | Delete, cancel actions | Red hover background |
| `outline` | Secondary actions | Border with hover fill |

**In Table Context**:

```svelte
<!-- In ModernDataTable cellContent snippet -->
{#snippet cellContent(column, row)}
  {:else if column.key === 'actions'}
    <ActionButtonGroup align="right">
      <ActionIconButton
        icon={Calendar}
        label="Schedule Appointment"
        onclick={() => handleSchedule(row)}
      />
      <ActionIconButton
        icon={Eye}
        label="View Details"
        onclick={() => handleRowClick(row)}
      />
    </ActionButtonGroup>
  {:else}
    {row[column.key]}
  {/if}
{/snippet}
```

**Best Practices**:

1. **Always provide descriptive `label`** - Becomes tooltip, crucial for accessibility
2. **Use appropriate `variant`** - Match action importance and risk level
3. **Handle loading states** - For async operations, pass loading prop
4. **Group related actions** - Use `ActionButtonGroup` for multiple actions
5. **Use standard icons** - From lucide-svelte for consistency
6. **Don't nest clickable elements** - stopPropagation is handled automatically

**Common Patterns**:

```svelte
<!-- Per-row loading state -->
let downloadingId = $state<string | null>(null);

async function handleDownload(itemId: string) {
  downloadingId = itemId;
  try {
    await download(itemId);
  } finally {
    downloadingId = null;
  }
}

<ActionIconButton
  icon={Download}
  label="Download"
  onclick={() => handleDownload(item.id)}
  loading={downloadingId === item.id}
/>

<!-- Conditional action visibility -->
{#if item.canEdit}
  <ActionIconButton
    icon={Edit}
    label="Edit"
    onclick={() => handleEdit(item)}
  />
{/if}
```

**Related Components**:
- `ActionButtonGroup` - Container for multiple ActionIconButtons
- `ModernDataTable` - Table component that commonly uses ActionIconButton
- `GradientBadge` - For status indicators in tables

## Testing Components

### Unit Test Example

**File**: `src/lib/components/shared/NotificationCard.svelte.test.ts`

```typescript
import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import NotificationCard from './NotificationCard.svelte';

test('renders notification correctly', () => {
  const notification = {
    id: '1',
    title: 'Test Notification',
    message: 'This is a test',
    user_id: 'user-1',
    read_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  render(NotificationCard, { props: { notification } });

  expect(screen.getByText('Test Notification')).toBeTruthy();
  expect(screen.getByText('This is a test')).toBeTruthy();
  expect(screen.getByText('Mark as Read')).toBeTruthy();
});
```

## Component Checklist

- [ ] Choose appropriate directory location
- [ ] Use TypeScript for type safety
- [ ] Use Svelte 5 runes ($state, $derived, $props, $effect)
- [ ] Export props interface for documentation
- [ ] Handle loading and error states
- [ ] Make component accessible (ARIA labels, keyboard navigation)
- [ ] Use Tailwind classes for styling
- [ ] Add scoped styles only when necessary
- [ ] Test component functionality
- [ ] Document complex props/behavior
- [ ] Export from index file if part of a collection
- [ ] Consider responsive design (mobile-first)

## Best Practices

### DO:
- ✅ Keep components small and focused
- ✅ Use TypeScript for props
- ✅ Use $derived for computed values
- ✅ Provide default values for optional props
- ✅ Use semantic HTML
- ✅ Make components accessible
- ✅ Use callback props for events (onSave, onDelete, etc.)
- ✅ Handle edge cases (loading, error, empty states)
- ✅ Use $bindable for two-way binding when appropriate

### DON'T:
- ❌ Mix business logic with presentation
- ❌ Hardcode data (pass as props)
- ❌ Create overly complex components
- ❌ Skip TypeScript types
- ❌ Forget accessibility
- ❌ Use global styles unnecessarily
- ❌ Ignore loading/error states

## Common Patterns

### Loading State

```svelte
<script lang="ts">
  let { loading }: { loading: boolean } = $props();
</script>

{#if loading}
  <div class="spinner">Loading...</div>
{:else}
  <slot />
{/if}
```

### Empty State

```svelte
{#if items.length === 0}
  <div class="empty-state">
    <p>No items found</p>
  </div>
{:else}
  {#each items as item}
    <ItemCard {item} />
  {/each}
{/if}
```

### Error State

```svelte
<script lang="ts">
  let { error }: { error?: string } = $props();
</script>

{#if error}
  <div class="error-message">
    <p>{error}</p>
  </div>
{/if}
```

## References

- Svelte 5 Documentation: https://svelte.dev/docs/svelte/overview
- Svelte Runes: https://svelte.dev/docs/svelte/what-are-runes
- TypeScript in Svelte: https://svelte.dev/docs/typescript
