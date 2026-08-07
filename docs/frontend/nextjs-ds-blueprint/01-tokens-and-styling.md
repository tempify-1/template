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

### Why semantic tokens only in components?

This project enforces semantic tokens (`bg-background`, `text-foreground`, etc.) **everywhere under
`src/components`**, never palette classes (`bg-blue-500`, `text-slate-700`, etc.).

**Is this shadcn's requirement?** No — shadcn's registry allows palette classes in user code.

**Is this shadcn's own practice?** Yes — all official components use semantic tokens, and that's
what their theming system is designed for.

**Why enforce it here?** Three reasons:

1. **Theme inheritance**: Components inside a `data-theme` section automatically recolor because
   they only reference semantic tokens, never hard-coded colors.

2. **Consistency with the ecosystem**: Every shadcn component, block, and registry item assumes
   you're using semantic tokens. Your code matches that expectation.

3. **Future-proofing**: If you ever want to add new section themes (e.g., `theme="warning"`,
   `theme="info"`), they work out of the box because components don't hard-code specific colors.

The enforcement lives in `tests/int/section-theme.int.spec.ts`, which fails the build on any
palette class or literal color value in component sources.

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

## Section Themes

A Section can carry one of a small named set — `muted`, `accent`, `brand` — stamped as
`data-theme` on the Section element. Each Theme is a scoped redefinition of the *same* token
names the base already defines (`--background`, `--foreground`, `--card`, `--primary`, `--border`
and the rest), so everything inside inherits the new values through the cascade. A heading, card
or button inside a themed Section recolours without knowing a Theme exists; no component branches
on it and none receives it as a prop.

Names are semantic, never palette names. A hue in a page configuration makes rebranding a content
migration — the stored value would say `blue` while the brand had moved on — and shadcn's own
convention is semantic naming end to end. `brand` inverts onto the primary surface; `muted` and
`accent` are progressively stronger tonal bands.

Every value is a step on Tailwind's ramp. shadcn's `neutral` base is Tailwind's neutral ramp
transcribed as literals — `oklch(0.205 0 0)` is `neutral-900`, `oklch(0.922 0 0)` is `neutral-200`
— so a Theme that invents an in-between value is off the palette the rest of the system uses. A
test parses `node_modules/tailwindcss/theme.css` and asserts every colour in the Theme file and in
`:root` matches a ramp step, and separately asserts the ramp it read is non-empty so the check
cannot pass vacuously. Referencing the ramp directly (`var(--color-neutral-200)`) does not work:
Tailwind v4 emits only the theme variables a build actually uses, and those variables resolve to
empty on this page — verified in the browser, not assumed.

Every Theme defines a light **and** a dark pairing (`[data-theme='x']` and `.dark
[data-theme='x']`). A Theme with only one pairing would silently fall through to the page tokens
in the other mode, which reads as a Section that loses its Theme at night. A test asserts both
pairings exist and override an identical token set, so a half-defined Theme fails the suite.

The Theme is added to every generated block by the registry and applied to every Section by the
mapper, rather than being threaded through each Preset's arguments. Presets stay about content;
adding a Preset gets theming for free instead of getting it only if the author remembered.
Fixtures use `themed(theme, section)`.

Portalled content is the one place the cascade does not reach: shadcn's `Select`, `DropdownMenu`
and `Tooltip` mount on `document.body`, outside the themed subtree, so an open dropdown inside a
`brand` Section would render page-level colours. `Section` publishes its Theme through
`SectionThemeProvider` and the DS select control re-stamps `data-theme` on its portalled content.
The component still does not decide any colour — it only carries the attribute across the portal
boundary.

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
