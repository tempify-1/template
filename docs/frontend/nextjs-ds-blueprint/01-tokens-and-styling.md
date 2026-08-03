# 01 — Tokens, Theming & Styling

**Decision: theming is standard shadcn.** No port of Kallax's OKLCH palette-generation system
(`--palette-source` re-sourcing, 16-step ramps, `light-dark()` everywhere). The new system uses
stock shadcn conventions so every shadcn component, block, and third-party registry item drops
in unmodified, and Claude can generate against the ecosystem defaults it already knows.

## The base (stock shadcn, Tailwind v4)

- `@import "tailwindcss"` + shadcn's generated `:root` / `.dark` variable blocks:
  `--background, --foreground, --card, --popover, --primary, --secondary, --muted, --accent,
  --destructive, --border, --input, --ring, --chart-1..5, --sidebar-*` with `@theme inline`
  mapping them to `bg-background`, `text-muted-foreground`, etc.
- Colors in OKLCH values (shadcn's current default output) — fine, but authored as plain values,
  not derived ramps.
- Dark mode: shadcn's `.dark` class + `next-themes` (system/light/dark cycling replaces Kallax's
  hand-rolled `theme-mode` localStorage util).
- Radius: shadcn's `--radius` + derived `--radius-sm/md/lg/xl`. Brand roundness = change one var.
- Fonts via `next/font`; base type scale is Tailwind's.

Component styling is Tailwind utilities + `cva` variants in TSX — the shadcn way — not Kallax's
per-component CSS files with `--_private` vars. Only genuinely global CSS (page-builder grid,
scroll animations, marquee keyframes) lives in stylesheet files under `@layer components`.

## Small extensions on top (the only custom tokens)

Add to `@theme` — these are additive and don't change shadcn semantics:

### 1. Section themes for the page builder

The page builder needs `theme="blue"` on a Section/Card/Chip to recolor a subtree. Do it the
shadcn-idiomatic way: **each theme is a scoped override of shadcn's own variables**, exactly like
a shadcn theme preset, applied via `data-theme`:

```css
[data-theme="accent"] {
  --background: var(--brand-accent-surface);
  --foreground: var(--brand-accent-on-surface);
  --primary: var(--brand-accent);
  --primary-foreground: var(--brand-accent-on);
  --muted-foreground: var(--brand-accent-muted);
  --border: var(--brand-accent-border);
  /* .dark & [data-theme="accent"] { ... dark pairing ... } */
}
```

Components inside keep using `bg-background` / `text-foreground` / `text-primary` — they recolor
automatically because they only ever reference the semantic variables. This preserves the ONE
prop that matters from Kallax (`theme?: ThemeColor` → `data-theme`) without any palette machinery.

**Amended (decision 6): theme names are semantic, not hues.** The Kallax union of 19 Tailwind
colors is dropped. Its stated justification — "CMS content references them" — does not transfer to
a fresh repo with no Kallax content, and `theme="fuchsia"` is a raw palette name in a config,
which is the same violation as `bg-blue-500` in a component one layer up. shadcn's documented
convention is semantic naming throughout; its own custom-token example is `--warning`, not
`--amber`. A hue in a page config also means a rebrand is a content migration.

```ts
export type ThemeColor =
  | "default" | "muted" | "accent" | "inverse" | "brand-dark" | "brand-light";
```

Generate the scoped blocks from brand tokens (light and dark pairings tuned to AA/AAA). One small
generated CSS file, no runtime cleverness — about ten blocks rather than thirty-eight. Keep
`data-invert` for "light text over a hero image, no theme". A campaign that genuinely needs an
arbitrary hue overrides brand tokens on that one route; it does not add a permanent theme name.

### 2. Fluid display type scale

Tailwind's scale stops where marketing hero type starts. Add:

```css
@theme {
  --text-fluid-4: clamp(2.5rem, 10vw, 4.5rem);
  --text-fluid-5: clamp(3rem, 12vw, 5.5rem);
  --text-fluid-6: clamp(3.5rem, 14vw, 6.5rem);
  --text-fluid-7: clamp(4rem, 16vw, 8rem);
  --text-fluid-8: clamp(5rem, 20vw, 10rem);
  /* ...up to --text-fluid-12: clamp(10rem, 40vw, 20rem) */
}
```

Consumed by Column `headingSize` and TextMarquee `fontSize` via var interpolation. **Amended:**
define the steps something actually uses; the original instruction to keep the whole range alive
with no static consumer is dropped, as unused tokens are exactly the drift these docs exist to
prevent. Display headings: weight ~250
(variable font), `tracking-tight`, `leading-none`, `text-balance`; paragraphs `text-pretty`,
`max-w-prose`.

### 3. Animation tokens (port from Kallax verbatim — they're what makes motion feel coherent)

```css
@theme {
  --ease-snappy: cubic-bezier(0.32, 0.72, 0, 1);   /* primary entrance */
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1); /* media entrances */
}
:root {
  --anim-duration-instant: 80ms; --anim-duration-fast: 150ms; --anim-duration-normal: 200ms;
  --anim-duration-slow: 300ms; --anim-duration-slower: 400ms;
  --anim-stagger-delay: 30ms;
  --anim-word-translate-y: 2rem; --anim-word-blur: 8px; --anim-word-duration: 500ms; --anim-word-stagger: 60ms;
  --anim-block-translate-y: 1rem; --anim-block-duration: 200ms; --anim-block-stagger: 80ms;
  --anim-post-heading-delay: 200ms;
  --anim-media-translate-x: 3rem; --anim-media-duration: 700ms;
}
```

Every animation sits inside `@media (prefers-reduced-motion: no-preference)` (opt-in, Kallax
convention — reduced-motion users get final state, never a hidden flash).

### 4. Page-builder cross-boundary variables

The Section/Column grid communicates via un-prefixed CSS vars (`--cols-*`, `--span-*`,
`--gutter-*`, `--column-index`) — these are a component API, not theme tokens; they live with the
page-builder CSS (doc 02), not in `@theme`.

## What we deliberately drop from Kallax

- The `*`-scoped OKLCH relative-color ramp (`--color-1..16` recomputing per subtree) and
  `--palette-source` re-sourcing — replaced by scoped shadcn-variable overrides above.
- `light-dark()` token values → shadcn `.dark` class overrides.
- The `.ui-h1..ui-h6 / .ui-p / .ui-overline` class vocabulary → Tailwind utilities (+ a tiny
  `typography` cva for CMS-driven heading roles where tag ≠ visual size).
- Open Props and the vendored opui-v1 foundation entirely.
- Per-component CSS files with `--_private` vars → cva + utilities (global CSS only where a
  selector genuinely can't be a utility: grid fallback chains, `> *` stagger selectors,
  scroll-driven keyframes).
- Surface ladder (`--surface-default/filled/tonal/subtle/elevated`) → shadcn `--background`,
  `--card`, `--muted`, `--accent`. Where a component needs "tonal" (Kallax's signature soft
  fill), that's `bg-muted` or the scoped `data-theme` background — not a new token tier.
- Control-size ladder → shadcn's `size-*` variants on Button/Input (keep inputs and buttons on
  the same height scale when extending variants).

## Fixes by omission

- One breakpoint system: Tailwind's (Kallax had three conflicting sets).
- No inline-style-substring selectors (`[style*="--column-heading-size"]`) — set a data-attribute
  alongside the style and match that.
- No `!important` tokens, no dead `theme-square`, no `.dark`/`.ui-dark` split.
