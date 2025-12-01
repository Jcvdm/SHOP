# Component Patterns - ClaimTech

Production-ready Svelte 5 component patterns using runes, TypeScript, and modern reactive patterns.

---

## Core Principles

### 1. Use Svelte 5 Runes (NOT Svelte 4 Stores)

**✅ CORRECT: Svelte 5 runes**

```svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);

  $effect(() => {
    console.log(`Count is ${count}`);
  });
</script>
```

**❌ WRONG: Svelte 4 stores (deprecated)**

```svelte
<script lang="ts">
  import { writable } from 'svelte/store'; // ❌ Don't use in new code
  const count = writable(0);
</script>
```

### 2. TypeScript for Props

```svelte
<script lang="ts">
  type Props = {
    title: string;
    count?: number;
    onClick?: () => void;
  };

  let { title, count = 0, onClick }: Props = $props();
</script>
```

### 3. Component Composition

```svelte
<!-- Parent passes children -->
<Card>
  <p>Card content here</p>
</Card>

<!-- Card component -->
<script lang="ts">
  let { children } = $props();
</script>

<div class="card">
  {@render children()}
</div>
```

---

## Svelte 5 Runes

### $state - Reactive Variables

```svelte
<script lang="ts">
  // Primitive state
  let count = $state(0);

  // Object state
  let user = $state({
    name: 'John',
    age: 30
  });

  // Array state
  let items = $state<string[]>([]);

  function increment() {
    count++; // Automatically reactive
  }

  function updateUser() {
    user.age++; // Deep reactivity
  }

  function addItem(item: string) {
    items.push(item); // Mutate directly
  }
</script>

<button onclick={increment}>Count: {count}</button>
```

### $derived - Computed Values

```svelte
<script lang="ts">
  let count = $state(0);

  // Simple derived
  let doubled = $derived(count * 2);

  // Complex derived
  let isEven = $derived(count % 2 === 0);

  // Derived from multiple sources
  let firstName = $state('John');
  let lastName = $state('Doe');
  let fullName = $derived(`${firstName} ${lastName}`);
</script>

<p>Count: {count}</p>
<p>Doubled: {doubled}</p>
<p>Is even: {isEven}</p>
<p>Full name: {fullName}</p>
```

### $effect - Side Effects

```svelte
<script lang="ts">
  let count = $state(0);

  // Effect runs when dependencies change
  $effect(() => {
    console.log(`Count changed to ${count}`);
    document.title = `Count: ${count}`;
  });

  // Effect with cleanup
  $effect(() => {
    const interval = setInterval(() => {
      count++;
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  });

  // Effect that runs only once
  $effect(() => {
    console.log('Component mounted');
  });
</script>
```

### $props - Component Props

```svelte
<script lang="ts">
  type Props = {
    // Required props
    title: string;
    id: string;

    // Optional props with defaults
    count?: number;
    disabled?: boolean;

    // Function props
    onClick?: () => void;
    onSubmit?: (data: FormData) => void;

    // Children
    children?: import('svelte').Snippet;
  };

  let {
    title,
    id,
    count = 0,
    disabled = false,
    onClick,
    onSubmit,
    children
  }: Props = $props();
</script>

<div {id}>
  <h2>{title}</h2>
  <p>Count: {count}</p>

  <button {disabled} onclick={onClick}>
    Click me
  </button>

  {#if children}
    {@render children()}
  {/if}
</div>
```

---

## Common Component Patterns

### Form Component with Validation

```svelte
<!-- src/lib/components/forms/EntityForm.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  type Props = {
    initialData?: {
      name?: string;
      description?: string;
    };
    form?: ActionData;
    onSuccess?: () => void;
  };

  let { initialData, form, onSuccess }: Props = $props();

  let name = $state(initialData?.name || '');
  let description = $state(initialData?.description || '');

  // Validation
  let nameError = $derived(
    name.length < 3 ? 'Name must be at least 3 characters' : ''
  );
  let isValid = $derived(!nameError && name.length > 0);
</script>

<form
  method="POST"
  use:enhance={() => {
    return async ({ result }) => {
      if (result.type === 'success') {
        onSuccess?.();
      }
    };
  }}
>
  <div class="form-group">
    <label for="name">Name</label>
    <input
      type="text"
      id="name"
      name="name"
      bind:value={name}
      required
      aria-invalid={!!nameError}
    />
    {#if nameError}
      <p class="error">{nameError}</p>
    {/if}
  </div>

  <div class="form-group">
    <label for="description">Description</label>
    <textarea
      id="description"
      name="description"
      bind:value={description}
    ></textarea>
  </div>

  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}

  <button type="submit" disabled={!isValid}>
    Submit
  </button>
</form>
```

### List Component with Filtering

```svelte
<!-- src/lib/components/EntityList.svelte -->
<script lang="ts">
  import type { Database } from '$lib/types/database.types';

  type Entity = Database['public']['Tables']['entities']['Row'];

  type Props = {
    entities: Entity[];
    onSelect?: (entity: Entity) => void;
  };

  let { entities, onSelect }: Props = $props();

  let searchTerm = $state('');
  let sortBy = $state<'name' | 'created_at'>('created_at');
  let sortDesc = $state(true);

  // Filtered entities
  let filteredEntities = $derived(
    entities.filter(entity =>
      entity.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sorted entities
  let sortedEntities = $derived(
    [...filteredEntities].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal < bVal) return sortDesc ? 1 : -1;
      if (aVal > bVal) return sortDesc ? -1 : 1;
      return 0;
    })
  );

  function toggleSort(field: typeof sortBy) {
    if (sortBy === field) {
      sortDesc = !sortDesc;
    } else {
      sortBy = field;
      sortDesc = true;
    }
  }
</script>

<div class="entity-list">
  <div class="controls">
    <input
      type="search"
      bind:value={searchTerm}
      placeholder="Search entities..."
    />

    <button onclick={() => toggleSort('name')}>
      Sort by Name {sortBy === 'name' ? (sortDesc ? '↓' : '↑') : ''}
    </button>

    <button onclick={() => toggleSort('created_at')}>
      Sort by Date {sortBy === 'created_at' ? (sortDesc ? '↓' : '↑') : ''}
    </button>
  </div>

  <div class="results">
    <p>{sortedEntities.length} results</p>

    {#each sortedEntities as entity (entity.id)}
      <div class="entity-card" onclick={() => onSelect?.(entity)}>
        <h3>{entity.name}</h3>
        <p>{entity.description}</p>
        <small>{new Date(entity.created_at).toLocaleDateString()}</small>
      </div>
    {:else}
      <p class="empty">No entities found</p>
    {/each}
  </div>
</div>
```

### Modal Component with Snippets

```svelte
<!-- src/lib/components/Modal.svelte -->
<script lang="ts">
  type Props = {
    open: boolean;
    onClose?: () => void;
    title?: string;
    children?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
  };

  let { open = $bindable(), onClose, title, children, footer }: Props = $props();

  function handleBackdropClick() {
    onClose?.();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose?.();
    }
  }
</script>

{#if open}
  <div
    class="modal-backdrop"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="button"
    tabindex="-1"
  >
    <div
      class="modal-content"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      {#if title}
        <div class="modal-header">
          <h2>{title}</h2>
          <button onclick={onClose} aria-label="Close">×</button>
        </div>
      {/if}

      <div class="modal-body">
        {#if children}
          {@render children()}
        {/if}
      </div>

      {#if footer}
        <div class="modal-footer">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow: auto;
  }
</style>
```

### Paginated Table Component

```svelte
<!-- src/lib/components/PaginatedTable.svelte -->
<script lang="ts">
  type Props = {
    data: any[];
    columns: Array<{
      key: string;
      label: string;
      format?: (value: any) => string;
    }>;
    pageSize?: number;
  };

  let { data, columns, pageSize = 10 }: Props = $props();

  let currentPage = $state(1);

  let totalPages = $derived(Math.ceil(data.length / pageSize));

  let paginatedData = $derived(
    data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  );

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }
</script>

<div class="table-container">
  <table>
    <thead>
      <tr>
        {#each columns as column}
          <th>{column.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each paginatedData as row}
        <tr>
          {#each columns as column}
            <td>
              {column.format
                ? column.format(row[column.key])
                : row[column.key]}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>

  <div class="pagination">
    <button
      onclick={() => goToPage(currentPage - 1)}
      disabled={currentPage === 1}
    >
      Previous
    </button>

    <span>
      Page {currentPage} of {totalPages}
    </span>

    <button
      onclick={() => goToPage(currentPage + 1)}
      disabled={currentPage === totalPages}
    >
      Next
    </button>
  </div>
</div>
```

### Loading State Component

```svelte
<!-- src/lib/components/AsyncData.svelte -->
<script lang="ts">
  type Props = {
    loading?: boolean;
    error?: string | null;
    children?: import('svelte').Snippet;
    fallback?: import('svelte').Snippet;
    errorFallback?: import('svelte').Snippet<[string]>;
  };

  let { loading, error, children, fallback, errorFallback }: Props = $props();
</script>

{#if loading}
  {#if fallback}
    {@render fallback()}
  {:else}
    <div class="loading">Loading...</div>
  {/if}
{:else if error}
  {#if errorFallback}
    {@render errorFallback(error)}
  {:else}
    <div class="error">{error}</div>
  {/if}
{:else if children}
  {@render children()}
{/if}
```

---

## ClaimTech-Specific Patterns

### Assessment Photo Gallery

```svelte
<!-- src/lib/components/assessment/PhotoGallery.svelte -->
<script lang="ts">
  type Photo = {
    id: string;
    path: string;
    description?: string;
  };

  type Props = {
    photos: Photo[];
    onDelete?: (id: string) => void;
  };

  let { photos, onDelete }: Props = $props();

  let selectedPhoto = $state<Photo | null>(null);

  function openPhoto(photo: Photo) {
    selectedPhoto = photo;
  }

  function closeModal() {
    selectedPhoto = null;
  }
</script>

<div class="photo-gallery">
  {#each photos as photo (photo.id)}
    <div class="photo-card" onclick={() => openPhoto(photo)}>
      <img
        src={`/api/photo/${photo.path}`}
        alt={photo.description || 'Photo'}
      />
      {#if photo.description}
        <p>{photo.description}</p>
      {/if}
      {#if onDelete}
        <button onclick={() => onDelete(photo.id)}>Delete</button>
      {/if}
    </div>
  {:else}
    <p class="empty">No photos uploaded</p>
  {/each}
</div>

{#if selectedPhoto}
  <Modal open={true} onClose={closeModal} title={selectedPhoto.description}>
    <img
      src={`/api/photo/${selectedPhoto.path}`}
      alt={selectedPhoto.description || 'Photo'}
      style="width: 100%"
    />
  </Modal>
{/if}
```

### Estimate Line Item Editor

```svelte
<!-- src/lib/components/estimate/LineItemEditor.svelte -->
<script lang="ts">
  type LineItem = {
    id: string;
    process_type: string;
    part_type: string;
    description: string;
    part_price: number;
    labour_hours: number;
    labour_rate: number;
  };

  type Props = {
    item: LineItem;
    onUpdate?: (item: LineItem) => void;
    onDelete?: () => void;
  };

  let { item: initialItem, onUpdate, onDelete }: Props = $props();

  let item = $state({ ...initialItem });

  let totalCost = $derived(
    item.part_price + item.labour_hours * item.labour_rate
  );

  $effect(() => {
    // Auto-save after 500ms of inactivity
    const timeout = setTimeout(() => {
      onUpdate?.(item);
    }, 500);

    return () => clearTimeout(timeout);
  });
</script>

<div class="line-item">
  <select bind:value={item.process_type}>
    <option value="N">New</option>
    <option value="R">Repair</option>
    <option value="P">Paint</option>
  </select>

  <select bind:value={item.part_type}>
    <option value="OEM">OEM</option>
    <option value="ALT">Aftermarket</option>
    <option value="2ND">Second Hand</option>
  </select>

  <input
    type="text"
    bind:value={item.description}
    placeholder="Description"
  />

  <input
    type="number"
    bind:value={item.part_price}
    step="0.01"
    min="0"
  />

  <input
    type="number"
    bind:value={item.labour_hours}
    step="0.1"
    min="0"
  />

  <input
    type="number"
    bind:value={item.labour_rate}
    step="0.01"
    min="0"
  />

  <span class="total">R {totalCost.toFixed(2)}</span>

  <button onclick={onDelete}>Delete</button>
</div>
```

### Request Status Badge

```svelte
<!-- src/lib/components/request/StatusBadge.svelte -->
<script lang="ts">
  type Status = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

  type Props = {
    status: Status;
  };

  let { status }: Props = $props();

  let statusConfig = $derived({
    pending: { label: 'Pending', class: 'status-pending' },
    assigned: { label: 'Assigned', class: 'status-assigned' },
    in_progress: { label: 'In Progress', class: 'status-in-progress' },
    completed: { label: 'Completed', class: 'status-completed' },
    cancelled: { label: 'Cancelled', class: 'status-cancelled' }
  }[status]);
</script>

<span class="status-badge {statusConfig.class}">
  {statusConfig.label}
</span>

<style>
  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .status-pending {
    background: #fef3c7;
    color: #92400e;
  }

  .status-assigned {
    background: #dbeafe;
    color: #1e3a8a;
  }

  .status-in-progress {
    background: #e0e7ff;
    color: #3730a3;
  }

  .status-completed {
    background: #d1fae5;
    color: #065f46;
  }

  .status-cancelled {
    background: #fee2e2;
    color: #991b1b;
  }
</style>
```

---

## Advanced Patterns

### Context API

```svelte
<!-- Parent component -->
<script lang="ts">
  import { setContext } from 'svelte';

  type ThemeContext = {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
  };

  let theme = $state<'light' | 'dark'>('light');

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
  }

  setContext<ThemeContext>('theme', {
    get theme() {
      return theme;
    },
    toggleTheme
  });
</script>

<div class={theme}>
  <slot />
</div>

<!-- Child component -->
<script lang="ts">
  import { getContext } from 'svelte';

  const { theme, toggleTheme } = getContext<ThemeContext>('theme');
</script>

<button onclick={toggleTheme}>
  Current theme: {theme}
</button>
```

### Custom Stores (for backward compatibility)

```typescript
// src/lib/stores/auth.ts
import { writable, derived } from 'svelte/store';
import type { User } from '@supabase/supabase-js';

function createAuthStore() {
  const { subscribe, set, update } = writable<User | null>(null);

  return {
    subscribe,
    setUser: (user: User | null) => set(user),
    logout: () => set(null)
  };
}

export const authStore = createAuthStore();

export const isAuthenticated = derived(
  authStore,
  ($auth) => $auth !== null
);
```

### Reactive Class Bindings

```svelte
<script lang="ts">
  let isActive = $state(false);
  let hasError = $state(false);
</script>

<button
  class:active={isActive}
  class:error={hasError}
  onclick={() => (isActive = !isActive)}
>
  Toggle
</button>

<style>
  button {
    padding: 0.5rem 1rem;
    background: #eee;
  }

  button.active {
    background: #4ade80;
  }

  button.error {
    background: #ef4444;
  }
</style>
```

---

## Best Practices

### ✅ DO

1. **Use Svelte 5 runes**
   ```svelte
   let count = $state(0);
   let doubled = $derived(count * 2);
   ```

2. **Type your props**
   ```typescript
   type Props = { title: string; count?: number };
   let { title, count = 0 }: Props = $props();
   ```

3. **Use $derived for computed values**
   ```svelte
   let filteredItems = $derived(items.filter(i => i.active));
   ```

4. **Handle side effects in $effect**
   ```svelte
   $effect(() => {
     console.log('Count changed:', count);
   });
   ```

5. **Use snippets for composition**
   ```svelte
   {@render children()}
   ```

### ❌ DON'T

1. **Don't use Svelte 4 stores in new code**
   ```svelte
   import { writable } from 'svelte/store'; // ❌
   ```

2. **Don't mutate props**
   ```svelte
   let { value } = $props();
   value = 10; // ❌ Use $bindable if needed
   ```

3. **Don't use reactive statements**
   ```svelte
   $: doubled = count * 2; // ❌ Use $derived instead
   ```

4. **Don't forget cleanup in effects**
   ```svelte
   $effect(() => {
     const interval = setInterval(...);
     return () => clearInterval(interval); // ✅
   });
   ```

---

**Reference**: See `.agent/SOP/creating-components.md` for component creation guidelines
