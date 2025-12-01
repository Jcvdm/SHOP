# Login Page Modernization Notes

## Current auth experience
- `src/routes/auth/login/+page.svelte` renders a centered form on a gray background with a simple heading, description, email/password inputs, a single CTA button, and a “Forgot your password?” link. The form uses raw Tailwind utility classes plus `use:enhance` to toggle a loading state and surface server-side `form.error`.
- Layout-wise the whole page is `min-h-screen flex items-center justify-center` so it never feels immersive; the CTA uses a solid blue while all other elements stay grayscale.

## Inspiration from shadcn/ui
- The shadcn docs emphasize composable form primitives (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`) that pair nicely with `Card` or `Sheet` wrappers for a polished login surface. The `button` and `input` components share `ring-sidebar-ring`, `bg-background`, and `text-muted-foreground` so they react to the global tokens already defined in `src/app.css`.
- Building blocks to reuse:
  * `<Card>` / `<CardHeader>` / `<CardContent>` give the login a layered, elevated surface with automatic padding/borders.
  * `<Form>` wrappers keep the fields consistent, allow optional helper text, and integrate with `react-hook-form` in the JS examples (and the same pattern exists in Svelte via the shadcn-svelte custom components).
  * `<Button>` variants (`default`, `ghost`, `secondary`) provide hover/focus styles tied to `--accent`/`--rose` colors; pairing a primary rose CTA with a secondary “Need help?” link keeps the hierarchy clear.
  * `<Input>` + icon helpers (Lucide silhouettes) deliver more expressive fields (`User` for email, `Lock` for password) and even show validation states from `FormMessage`.

## Proposed modern structure
1. **Background + hero** – Switch to a split layout (`grid lg:grid-cols-[1fr_1fr] min-h-screen`). Use a gradient rose background (leveraging the new `rose` tokens) on one half with a short value proposition (e.g., “Secure vehicle assessments” + a small feature list). Leave the other half for the card + form so the login feels like part of the app story.
2. **Card + form** – Wrap the form inside `<Card>` and `<CardContent>`, add a `<CardHeader>` with `Title`, `Subtitle`, and optional `Badge` (e.g., “ClaimTech Portal”). Use shadcn form primitives for the fields to connect `FormLabel`/`FormControl`/`FormMessage` with Supabase validation messages.
3. **Actions** – Replace the lone button with shadcn `<Button>` and add a ghost-style link for “Forgot password?” or “Need an account?”; allow a `Button` or `<TypographyLink>` to open support docs. Optionally include a row of quick links or policy text in `<CardFooter>`.
4. **Tokens** – Ensure the new layout references `--background`, `--muted-foreground`, and `--accent` (rose) from `src/app.css`, updating the dark scope as needed. This makes the login feel cohesive with the updated sidebar/top bar.

## Implementation checklist
1. Install the necessary shadcn components if they aren’t already available (`form`, `card`, `button`, `input`). Use `pnpm dlx shadcn-svelte@latest add form card button input` so the templates drop directly into the app.
2. Replace the existing markup in `src/routes/auth/login/+page.svelte` with a `Card` + `Form` layout, using the exported primitives from the shadcn-svelte installation. Keep the `enhance` behavior for the POST and `loading` state.
3. Add a side hero (grid background) that references the new rose palette; consider including `static` images or `stats` if the design benefits from extra context.
4. Update `app.css` tokens (and `@theme inline`) so the hero gradient, card border, button accent, and focus rings all inherit the rose/neutral values.
5. Document the new layout and how to wire the form inside `.agent/shadui/login-modernization.md` so future enhancements (e.g., multi-factor auth) can follow the same pattern.
