---
name: design-tokens
description: Styling rules for this repo's design system — Tailwind v4 CSS-first @theme, semantic shadcn tokens, and Section Themes via data-theme. Use when writing or editing any component under src/components, editing globals.css or any DS stylesheet, adding a colour, adding a Section Theme, or when a section-theme test fails.
paths:
  - 'src/components/**'
  - 'src/app/globals.css'
  - 'src/lib/presets/theme.ts'
  - '**/*.css'
---

# Design tokens & styling

Full rationale: `docs/frontend/nextjs-ds-blueprint/01-tokens-and-styling.md`. This skill is the
part you must get right *before* running the suite — `tests/int/section-theme.int.spec.ts` already
fails the build on every violation below, so treat these as compile errors you can see early.

## Tailwind v4, CSS-first

There is no `tailwind.config.js` and there must never be one — `components.json` sets
`tailwind.config: ""`. All design tokens live in `@theme` / `@theme inline` blocks in
`src/app/globals.css`. If you reach for a JS config, you have the v3 mental model.

## Colour: semantic tokens only

Style with semantic utilities — `bg-background`, `text-foreground`, `bg-primary`,
`text-muted-foreground`, `border-border`, `bg-card`, `bg-muted`, `bg-accent`.

Two things fail the suite in any file under `src/components`:

1. **A palette-named utility** — `bg-blue-500`, `text-slate-700`, `border-zinc-200`, and the same
   for `ring-`, `fill-`, `stroke-`, `from-`, `via-`, `to-`, `outline-`, `decoration-`, `shadow-`,
   `accent-`, `caret-`, `divide-`.
2. **A literal colour value** — `#rrggbb`, `rgb(...)`, `hsl(...)`, `oklch(...)`. `var(--token)` is
   fine; the test strips token references before checking.

`section-themes.css` is the one exempt file, because it is where colour values are defined.

There is no "tonal" or "elevated" surface tier. Where you want one, that is `bg-muted`, `bg-card`,
or the Theme's own `--background`.

## Section Themes

The set is `SECTION_THEMES` in `src/lib/presets/theme.ts` — currently `muted`, `accent`, `brand`.
That constant is the source of truth, not the doc.

A Theme is a scoped redefinition of the same token names the page already defines, stamped as
`data-theme` on the Section container (`src/components/ds/section/section.tsx`). Everything inside
recolours through the cascade.

**Components never branch on the Theme and never receive it as a prop.** If you find yourself
writing `theme === 'brand' ? ... : ...` in a component, the design is wrong — add the token to the
Theme block instead.

Adding or changing a Theme, all four enforced by tests:

- Names are semantic, never hues. `theme="blue"` is the same violation as `bg-blue-500`.
- Define **both** `[data-theme='x']` and `.dark [data-theme='x']`. A single pairing silently falls
  through to page tokens in the other mode.
- Override **every** surface token `:root` defines, so nothing falls back mid-Section.
- Every colour must be an exact step on Tailwind's neutral ramp, which the test reads from
  `node_modules/tailwindcss/theme.css`. Do not invent an in-between value. Do not reference
  `var(--color-neutral-200)` directly either — Tailwind v4 only emits theme variables a build
  actually uses, so it resolves to empty on the page.

## Portalled content

shadcn's `Select`, `DropdownMenu` and `Tooltip` mount on `document.body`, outside the themed
subtree. `Section` publishes its Theme through `SectionThemeProvider`; a DS control that portals
must re-stamp `data-theme` on its portalled content (see `src/components/ds/form/fields.tsx`). The
component still decides no colour — it only carries the attribute across the boundary.

## Component styling

Tailwind utilities plus `cva` variants in the TSX. Not per-component CSS files. Global CSS only
where a selector genuinely cannot be a utility — grid fallback chains, `> *` stagger selectors,
scroll-driven keyframes — under `@layer components`.

Animation goes inside `@media (prefers-reduced-motion: no-preference)`, so reduced-motion users get
the final state and never a hidden flash.

## Before you claim done

```
pnpm vitest run tests/int/section-theme.int.spec.ts
```
