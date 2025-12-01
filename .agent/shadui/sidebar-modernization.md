# Sidebar Modernization Playbook

## Why this document
- The main `src/lib/components/layout/Sidebar.svelte:1` component enforces the current navigation, Lucide icons, badge polling, and logout CTA. It is the single place that owns the general/work/engineer/repairer/settings groups, the badge counts, and the static logout form, so we want to treat it as a data + layout orchestrator rather than a styling detail as we re-theme it.
- This write-up collects the relevant Svelte-shadui documentation, existing styling hooks, and suggestions for a modern, reusable sidebar experience that leans into the requested rose palette.

## Svelte-shadui / shadcn-svelte sidebar primitives
- Installation: run `pnpm dlx shadcn-svelte@latest add sidebar` (the CLI mirrors the React instructions shown at `https://ui.shadcn.com/docs/components/sidebar`). It will scaffold the shared `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuBadge`, `SidebarFooter`, and related helpers so the Svelte components ship with the needed markup, aria, and focus styles out of the box.
- Structure notes:
  * Wrap everything in `<Sidebar>` with a `<SidebarContent>` block to isolate scrollable content.
  * Each navigation block should be a `<SidebarGroup>` with an optional `<SidebarGroupLabel>` and/or `<SidebarMenu>` that renders the items.
  * Use `<SidebarMenuButton>` inside `<SidebarMenuItem>` and render `<SidebarMenuBadge>` for counts (e.g., the new requests, inspections, appointments badges already computed by the `Sidebar` script).
  * `<SidebarFooter>` is perfect for the logout form instead of manually positioning a `<div class="border-t">…</div>`.
- Data-driven layout: continue to surface `navigation` metadata (`label`, `href`, Lucide icon, badge fields) and feed it into the shadui components (the example on the doc shows a `SidebarMenu` rendering a `projects` array, so the translation is straightforward). The Svelte version follows the same prop names, except you will write `<SidebarMenu>` in Svelte templates instead of fragments.
- The doc also documents a `SidebarRail` / `SidebarSeparator` / `SidebarTrigger` family, which is useful if you later need a collapsed mode or toggle; keep that in mind as part of the modernization story.

## Styling + rose-themed theming
- Tailwind is already configured via `src/app.css:1` (`@import "tailwindcss"` plus the custom `:root` tokens). That root block already defines `--sidebar`, `--sidebar-foreground`, `--sidebar-accent`, etc. Replace the current oklch-based values with rose-derived colors (Tailwind’s `rose.500`/`rose.600` palettes are good defaults). For example:
  ```css
  :root {
    --sidebar: oklch(0.95 0.02 310);
    --sidebar-foreground: #fff;
    --sidebar-accent: #f43f5e; /* Tailwind rose-500 */
    --sidebar-accent-foreground: #fff;
    --sidebar-border: color-mix(in srgb, #f43f5e 10%, transparent);
  }
  ```
- Mirror those edits inside the `@theme inline { ... }` section so `tailwindcss`'s `color-*` utilities pick up the new rose values. You can also pin the palette deeper by adding an explicit `tailwind.config.ts` (or `tailwind.config.cjs`) that extends `theme.colors` with the rose variants you need (the CLI will emit new CSS custom properties if you ever switch to `shadcn`s color install snippet).
- The Sidebar doc's theming section shows how to align the components via CSS vars (the React instructions that add `--sidebar`, `--sidebar-foreground`, etc. directly into `app/globals.css` can be reused here). Because the app already respects `--color-sidebar` etc inside `@theme inline`, updating those variables will ripple through buttons, focus rings, and badges used by the shadui components.
- For a modern feel, pair the rose accent with neutral backgrounds (e.g., `bg-sidebar` + `text-sidebar-foreground` for the container, `hover:bg-sidebar-accent/30` for active states). That keeps the lucide icons legible and allows the rose accent to feel like the highlight.

## Sidebar modernization checklist
1. Install the sidebar component via the `shadcn-svelte` CLI, keep the generated `Sidebar` module somewhere like `src/lib/ui/sidebar/`.
2. Map the existing `navigation` array + badge counts into `<SidebarGroup>` / `<SidebarMenu>` / `<SidebarMenuItem>` instances. Use `<SidebarMenuBadge>` for each route that surfaces a count (requests, inspections, appointments, etc.). Keep the role-based filtering logic in place but translate the markup so it renders inside the shadui wrappers.
3. Replace the logout `<div class="border-t ...">` block with `<SidebarFooter>` so the button stays attached to the new layout.
4. Update `src/app.css:1` to supply rose-based values for the sidebar tokens (accent, background, border, hover ring). Duplicate those adjustments in the dark `.dark` scope if you still support it, ensuring the rose accent stays visible on both light and dark variants.
5. Optionally create a reusable `SidebarItem` helper component/data transformer so the route metadata (label, href, icon, count) becomes easier to drop into `<SidebarMenuButton asChild>`-like wrappers when you rewrite the markup later.

## References
- `src/lib/components/layout/Sidebar.svelte:1` – existing navigation logic, badge polling, and logout form.
- `src/app.css:1` – theme tokens that the rest of the UI (including future shadui components) already pull from.
- `https://ui.shadcn.com/docs/components/sidebar` – authoritative list of sidebar primitives, sample `SidebarMenu`, theming variables, and installation steps that match the shadcn-svelte experience.
