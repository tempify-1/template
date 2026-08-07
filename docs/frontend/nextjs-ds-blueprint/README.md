# Next.js + shadcn Design System Blueprint

**Baseline: shadcn/ui best practice, unmodified.** Standard tokens/theming, standard component
anatomy, standard file layout, `npx shadcn add` components as-is. On top of that baseline we add
a small set of **config-driven capabilities** that shadcn doesn't provide, informed by what
worked in the previous Kallax (Qwik) design system — but this is *not* a port of Kallax. When
shadcn has an opinion, shadcn wins.

The additions:

| Addition | Doc |
|---|---|
| Standard shadcn tokens/theming + the few extensions we allow (section themes, fluid display type, animation easing tokens) | [01-tokens-and-styling.md](01-tokens-and-styling.md) |
| The **section system**: Page > Section > Column > Blocks config model, implemented with shadcn/Tailwind idioms, + CSS-first scroll animations for Framer-speed marketing pages | [02-page-builder.md](02-page-builder.md) |
| **Config-based forms**: `Field[]` config → rendered form, field registry, conditions, wizard | [03-forms.md](03-forms.md) |
| **Record-detail drawers**: shadcn **Base UI** Drawer, deep-linkable via one search param — narrowed from the old Layers stack (ADR-0003) | [04-layers-and-overlays.md](04-layers-and-overlays.md) |
| **Layouts**: a handful of `layout.tsx` shells (website / dashboard / auth / blank) built from shadcn blocks, switchable per route group | [05-layouts-and-navigation.md](05-layouts-and-navigation.md) |
| Component gap list: what shadcn covers, what we build in React + Tailwind | [06-component-inventory.md](06-component-inventory.md) |
| **Storybook** for the things we own, + conventions that keep Claude fast at generating UIs | [07-storybook-and-workflow.md](07-storybook-and-workflow.md) |

## Amendments (2026-08-03)

This blueprint was written before the repo existed. A design review against the actual repo, the
current shadcn registry, the shipped types of both candidate form libraries, and the old Qwik
system changed eighteen things, and a subsequent grilling of the ADRs themselves revised four of
them again. Where a doc below still reads otherwise, these win.

| # | Decision | Where |
|---|---|---|
| 1 | react-hook-form + zod for forms | [ADR-0001](../../adr/0001-react-hook-form-zod-for-forms.md) |
| 2 | Page config is code-first; TypeScript is the source of truth | [ADR-0002](../../adr/0002-presets-are-the-page-authoring-contract.md) |
| 3 | Payload stores preset invocations, not expanded sections | ADR-0002 |
| 4 | One zod schema per preset → TS args type + Payload block fields | ADR-0002 |
| 5 | Presets *and* blocks both survive; `blocks[]` is an opt-in preset arg | ADR-0002 |
| 6 | Section themes are semantic, not Tailwind hues | doc 01 |
| 7 | Slice one is one preset end-to-end, not a foundation step | doc 07 |
| 8 | Record-detail drawers are deep-linkable but do not stack | [ADR-0003](../../adr/0003-record-detail-drawers-are-deep-linkable.md) |
| 9 | No Storybook; fixture routes + `/preview` + Playwright | doc 07 |
| 10 | `Column` owns the block wrapper and stamps `--block-index` | doc 02 |
| 11 | Preset args derive from the target designs + shadcn primitives; generator deferred | ADR-0002 |
| 12 | Behaviour in config is a named Action resolved through a registry | [ADR-0005](../../adr/0005-behaviour-in-config-is-a-named-action.md) |
| 13 | `defaultValues` is a resolver chain (static → query → AI → draft) | doc 03 |
| 14 | Server-side Live Preview via `router.refresh()` | [ADR-0004](../../adr/0004-server-side-live-preview.md) |
| 15 | Animation hidden state is JS-gated; no-JS renders visible content | doc 02 |
| 16 | v1 = Cosmic-style landing page + `dashboard-01` dashboard + one charts route | doc 06 |
| 17 | Page metadata comes from `@payloadcms/plugin-seo` | doc 06 |
| 18 | shadcn best practice first; this is not a port of the old DS | [ADR-0006](../../adr/0006-shadcn-first-not-a-port.md) |

Also settled: the repo is `src/`-rooted (`src/components/{ui,ds}`, `src/lib/presets/`,
`src/fixtures/`, `src/mappers/`), these docs stay in `docs/frontend/`, `revalidateTag` fires from
Payload `afterChange` hooks with `cacheComponents` off, `Responsive<T>` uses Tailwind's breakpoint
names (`sm/md/lg/xl/2xl` — no `xs`, no `xxl`), and `dashboard?: boolean` becomes
`variant?: "default" | "dashboard"`.

## Principles

1. **shadcn best practice first.** Stock tokens (`--background`, `--primary`, `.dark`,
   `@theme inline`), cva variants, `cn()`, components in `components/ui`, blocks composed from
   them. Anything we add must look and feel like it shipped with shadcn.
2. **Config-driven where it pays.** Pages are `SectionDefinition[]`, forms are `Field[]`, nav is
   typed config. Components render config; they don't own content. Generating a typed config
   object is far more reliable for Claude than generating bespoke JSX — this is the single
   biggest speed lever.
3. **Registry pattern for extensibility.** New block types / field types register a component
   against a string discriminant; renderers are never edited.
4. **Presentational-only DS.** No data fetching, no CMS types in components; mappers translate
   backend data → props at the app boundary.
5. **Server-first.** RSC by default; `"use client"` only for interactivity islands (form fields,
   overlays, the one visibility hook per section). Marketing pages ship near-zero JS.
6. **Motion is CSS-first.** One IntersectionObserver toggling one attribute per section; all
   choreography in CSS with shared easing/duration tokens; `prefers-reduced-motion` is opt-in
   gating on every animation. JS animation (View Transitions, Motion) only for layout morphs.
7. **Don't wildly change the way of doing things.** The stack below is boring on purpose so
   Claude's ecosystem knowledge applies directly.

## Stack

| Concern | Decision |
|---|---|
| Framework | Next.js App Router; RSC by default |
| Styling | Tailwind v4 + stock shadcn theming (doc 01) |
| Components | shadcn/ui — prefer the current **Base UI** set (`ui.shadcn.com/docs/components/base/*`) |
| Forms | **react-hook-form** + zod via `@hookform/resolvers/zod`, config-driven via `Field[]` (doc 03, ADR-0001) |
| Record drawers | shadcn **Base UI Drawer** as shipped, open state in one search param for deep-linking — **no** stack, **no** intercepting routes (ADR-0003) |
| Toasts | shadcn **Base UI Toast** (`<Toaster />` + `toast.add()` / `toast.promise()`, success/info/warning/error/loading types) — keep Kallax's offline-probe hook idea (HEAD-probe connectivity, not `navigator.onLine`) |
| Icons | `lucide-react` (icon names in configs carry over 1:1 from Kallax content) |
| Images | `next/image` (thin wrapper preserving the Payload sizes/srcset contract if Payload is the CMS) |
| Drag & drop | **dnd-kit** everywhere (field arrays, kanban, sortable chips) — it arrives with `dashboard-01`, so per ADR-0006 it wins; a second library would be the rule-4 violation. Note it has shipped nothing since 2024-12; revisit at v2 when Kanban and field arrays need it |
| Animation | CSS scroll-entrance system (doc 02); View Transitions API, then Motion, for morphs |
| Workshop | Fixture routes + `/preview` + Playwright screenshots. Storybook deferred (doc 07, decision 9) |

## What we deliberately do NOT carry over from Kallax

- The OKLCH palette-generation machinery (`--palette-source` re-sourcing, 16-step ramps,
  `light-dark()` tokens, Open Props/opui foundation) → standard shadcn theming.
- Per-component CSS files with private `--_x` vars and `:where()` selectors → cva + utilities.
- The iframe-based layer embedding and `?_embed=1` handshake → a plain shadcn Drawer over the
  page, with its open state in a search param (ADR-0003). Note Payload Live Preview brings an
  iframe back for a different reason (ADR-0004).
- modular-forms specifics: `.#.` path rewriting, `shouldActive`, QRL validator arrays,
  `skipIfDisabled` → react-hook-form + schema-level zod checks.
- The `SelectionRecord {key,label}` stored-value contract → store plain values; resolve option
  metadata from config at render time (removes the #1 recurring bug class in Kallax). One carve-out
  since added: a combobox with an async `optionSource` has no options array to resolve against, so
  it stores `{value,label}` — Base UI's convention, not Kallax's spelling (doc 03, Value contracts).
- Hand-rolled snackbar stack, theme-mode localStorage util, `popover="manual"` navbar top-layer
  trick, hover-only megamenu singleton, dead per-block AOS config.

## Kallax lessons worth keeping (the "why" behind each addition)

- Golden fixture pages (typed section configs per pattern: hero, feature, faq, team, contact)
  made new pages a copy-tweak job — formalize as **section presets** (doc 02).
- The section entrance choreography (word-cascade headings, staggered blocks keyed off a column
  index, media slide, background ken-burns — all CSS, one observer) is what made pages feel
  Framer-grade. Port the *choreography values*, reimplement idiomatically (doc 02).
- The form engine's conditions (`showWhen/enableWhen/requiredWhen`), wizard semantics
  (per-step validation, error summarization, async `onBeforeNext` gate), and blur-diff autosave
  are genuinely differentiating — keep the semantics, rebuild on react-hook-form (doc 03).
- URL-as-state for the layer stack (deep-linkable drawer stacks over any page) is a signature
  UX; intercepting routes give it back-button support Kallax never had (doc 04).
