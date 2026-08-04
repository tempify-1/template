# 02 — The Section System (Page > Section > Column > Blocks)

The one capability shadcn doesn't have: composing full marketing/content pages from **typed
config** instead of bespoke JSX, at Framer speed. This is an addition on top of shadcn — every
block inside a column is a shadcn component (or one of our doc-06 additions); the section system
is just layout + choreography around them.

All of Page/Section/Column/BlockRenderer are **React Server Components**. The only client code
is a ~20-line visibility hook per section for scroll animations.

**Amended (decision 14):** this constrains Live Preview. Payload's client-side `useLivePreview`
re-renders from `postMessage` data against form state, which an RSC tree cannot do. We use
Payload's **server-side** mode instead — `RefreshRouteOnSave` calls `router.refresh()` — so the
RSC tree is preserved. Note that this refreshes **on save** (draft save, autosave, publish), not
per keystroke, so the Pages collection needs drafts + autosave enabled. See
[ADR-0004](../../adr/0004-server-side-live-preview.md).

## The config model

There are **no section types**. One section schema; variety comes from the blocks placed in
columns. A column's `blocks[]` freely interleaves rich-text content and component blocks.

```ts
interface PageProps { sections?: SectionDefinition[] }
// Page partitions by tag: header sections, <main> for the rest, footer sections.

interface SectionDefinition {
  tag?: "header" | "section" | "footer";
  theme?: ThemeColor;            // data-theme scoped shadcn-variable override (doc 01)
  invert?: boolean;              // light-on-dark without a theme (hero over image)
  gutter?: GutterDirection[];    // `${side}-${size}`, sides × none|xs|sm|md|lg|xl
  columnLayout?: Responsive<number>;   // { sm?, md?, lg?, xl?, 2xl? } — Tailwind's names only
  columns?: ColumnDefinition[];
  height?: string;               // min-height, e.g. "100svh" for heroes
  shape?: "rectangle" | "round" | "round-top" | "round-bottom";
  background?: BackgroundDefinition;   // image | video | color | gradient
  scrollAnimate?: boolean;       // default true
  variant?: "default" | "dashboard";   // dashboard = dense 5-col grid, xs gutters
}

interface ColumnDefinition {
  colSpan?: Responsive<number>;
  verticalAlignment?: "top" | "middle" | "bottom";
  justify?: "left" | "center" | "right";
  expand?: Responsive<ExpandDirection[]>;  // bleed through the section gutter (edge-to-edge media)
  headingSize?: 0 | 1 | ... | 12;          // fluid display scale (doc 01)
  sticky?: boolean;
  animationDirection?: "top" | "bottom" | "left" | "right";
  blocks?: Block[];
}
```

## Implementation, the shadcn way

- Section/Column render Tailwind utilities via `cva` for the enumerable props (tag, shape,
  alignment, justify, sticky, dashboard).
- The genuinely dynamic responsive bits (`columnLayout`, `colSpan`, `gutter`, `expand`,
  `headingSize`) are emitted as **inline CSS variables** consumed by one small
  `section-grid.css` in `@layer components`. This is the same pattern shadcn's chart/sidebar
  components use (`--sidebar-width`, `--chart-*`) — inline vars + a stylesheet, not style-prop
  soup and not a class-per-permutation explosion.
- Breakpoints are Tailwind's (640/768/1024/1280/1536), nothing else.

The three layout ideas worth taking from the old system (they're what make sections look
designed rather than boxed):

1. **No max-width container.** Content width is gutter padding derived from the viewport:
   `--gutter-h-md: clamp(5vw, calc((100vw - 96rem) / 2), 10vw)`; vertical
   `clamp(5vh, 10vw + 2vh, 24vh)`; other sizes are multipliers (xs .25, sm .5, lg 1.5, xl 2).
   Sections are always full-bleed; the "container" is padding.
2. **`grid-auto-flow: dense`** on the section grid so narrower columns backfill.
3. **`expand` = negative-margin bleed** reusing the section's own gutter vars — a column (usually
   media) escapes to the viewport edge while siblings stay in the content area:
   `width: calc(100% + var(--gutter-left) + var(--gutter-right)); margin-inline: calc(var(--gutter-left)*-1) ...`.
   Implement as a few parameterized rules keyed off data-attributes — not the ~250 hand-unrolled
   lines Kallax had.

Header sections reserve nav height:
`padding-top: max(calc(var(--nav-height) + 0.75rem), var(--gutter-top))`.

`Background`: `next/image` fill with focal-point `object-position`; video with autoplay ⇒
muted/loop/playsInline; flat color; **add gradient** (Kallax lacked it, constant ask). `fixed`
variant for the parallax feel. Dark mode dims images (`dark:brightness-50`).

## BlockRenderer (registry, RSC)

```tsx
const blockRegistry = {
  buttonRow: ButtonRowBlock, card: CardBlock, cardGrid: CardGridBlock, accordion: AccordionBlock,
  tabs: TabsBlock, carousel: CarouselBlock, media: MediaBlock, badge: BadgeBlock,
  breadcrumb: BreadcrumbBlock, icon: IconBlock, logoTicker: LogoTickerBlock,
  timeline: TimelineBlock, chip: ChipBlock, form: FormBlock, rating: RatingBlock,
  list: ListBlock, textMarquee: TextMarqueeBlock, gallery: GalleryBlock,
  heroLinks: HeroLinksBlock, cardFeatureRow: CardFeatureRowBlock,
} satisfies Record<string, ComponentType<any>>;
```

- A block is a component block (`"blockType" in block`) or a serialized rich-text node
  (Lexical if Payload is the CMS) — sniff and dispatch. The rich-text renderer (format bitmask,
  heading/paragraph/list/quote/link/table/upload) is part of the CMS contract.
- Adding a block type = component + one registry line + CMS block definition. Never edit the
  renderer.
- **Amended (decision 10): `Column` owns the block wrapper.** The original rule — blocks must
  render as direct children with no wrapper divs, because the stagger selectors are `> *` — is an
  invisible coupling between every block's internal markup and a global stylesheet, enforced by
  nothing and failing silently. Instead `Column`, which already knows each block's index, renders
  the wrapper itself and stamps `style={{ "--block-index": i }}`; the CSS keys off that variable
  rather than child position. Blocks may render whatever markup they like. The word splitter
  stamps `--word-index` the same way, collapsing the old system's hand-unrolled `nth-child(1..20)`
  rules into one `calc()`.
- Headings split into `<span data-word>` per word (whitespace preserved) for the word cascade.

## Interactive state inside a Section (decision 13)

A Preset argument is serializable data and cannot carry state, so where does a pricing
monthly/annual toggle live? **In the Block.** The config carries data; the Block owns whatever
state it needs to present that data.

This is not a new mechanism — it is what the system already does twice. `AccordionList` holds
which panel is open and `TestimonialCarousel` holds the carousel position; both receive plain
data and delegate state to the shadcn primitive. Pricing is the same shape, because the toggle
chooses between two price sets that are *both already in the config*:

```ts
interface PricingTableBlock {
  blockType: 'pricingTable'
  plans: { name: string; monthly: Money; annual: Money; features: string[] }[]
  defaultPeriod: 'monthly' | 'annual'
}
```

The rule beyond pricing: **presentation-only state that need not survive navigation lives in the
Block; state that should be linkable, or that changes what gets fetched, goes in the URL.**
Accordions, carousels, tabs and the pricing toggle fall on the first side. A filtered or
paginated listing falls on the second, where a search param keeps the Block a Server Component
and makes the view shareable.

The rejected alternative was a configuration affordance for state — a declared `state` block that
the renderer wires up. It is a state machine expressed in JSON: unbounded in scope, and nothing
in v1 needs it. The second alternative, putting the billing period in a search param, is not
wrong; it would keep the Block a Server Component and make annual pricing linkable, at the cost
of a round trip for data already on the page. The rule above leaves that route open for any case
that genuinely needs it, without changing the config shape.

**No ADR.** It fails two of the three tests: it is not hard to reverse, since a Block's internal
state management is a local change, and it is not surprising — "a component owns its own state"
is the default React answer, so the decision worth recording would have been the opposite one.

## Scroll-entrance animation (the Framer feel, CSS-first)

No JS animation library for entrances. The whole system:

1. Section renders a **sticky sentinel** (`absolute inset-0` wrapper; inner
   `sticky top-0 h-[50vh]`) so the trigger point is viewport-relative regardless of section
   height.
2. A tiny `"use client"` hook: IntersectionObserver, threshold 0.5, sets `data-visible` on the
   section, disconnects. That attribute toggle is the entire JS.
3. Choreography is CSS keyed off `[data-scroll-animate]` → `[data-visible]`, wrapped in
   `@media (prefers-reduced-motion: no-preference)` **and gated on `html[data-js]`, which the
   client hook sets on mount (decision 15).** The old system omitted that gate, so its hidden
   initial state applied unconditionally to everyone who does not prefer reduced motion — meaning
   any failure to hydrate left the page's content permanently invisible rather than merely
   unanimated. Animation must be additive: no-JS, pre-hydration and hydration-failure all render
   visible content. Note also that the old sheet force-shows `.card-grid` and `.carousel`
   containers; those exceptions are load-bearing and must be carried over deliberately.
   Tracks, all delayed off `--column-index`
   (150ms per column), using the doc-01 tokens:
   - **Word-cascade headings**: opacity + `blur(8px)` + `translateY(2rem)`, 60ms/word stagger,
     `--ease-snappy`, 500ms.
   - **Block stagger**: non-heading children 80ms apart; siblings *after* the heading add a
     200ms `--anim-post-heading-delay` so they wait for the words.
   - **Media**: 700ms `--ease-out-quint` slide from `data-animation-direction`, 3rem travel.
   - **Background**: scale 1.1 → 1 + fade (ken-burns entry).
   - Card grids/carousels: per-card nth-child stagger.
4. Ambient motion is also CSS: marquee/ticker = duplicated content + `translateX(-50%)` linear
   keyframe + `mask-image` edge fades; carousel = native scroll-snap with `scrollIntoView` and
   an observer for dot state.

JS animation is reserved for **layout morphs**: expandable card → dialog, gallery thumbnail →
lightbox. Reach for the View Transitions API first (`view-transition-name` per item), Motion
(motion.dev) only where that falls short.

Optional authoring knob (keep it coarse): `animation?: { preset: "cascade" | "rise" | "fade" |
"none"; delay?: number }` at the **column** level, mapped to data-attributes the CSS reads.
No per-block animation config — the fixed choreography is why everything looks coherent.

## Framer-speed authoring

1. **Section presets.** *Amended (decisions 3, 4, 11): presets are the authoring contract, not an
   accelerant.* One zod schema per preset is the single definition of its args — the TS type
   comes from `z.infer`, the Payload block fields are generated from the same schema, and
   Payload stores `{ preset, args }` rather than an expanded section. Note that the old system had
   **zero** presets, only nine copy-tweak `page-config.ts` fixtures: "formalize as presets" is
   inventing an API, not transcribing one. Arg surfaces are derived from the **target designs**
   and composed from shadcn primitives — this is a shadcn-best-practice build, not a port, and the
   old system informs only what to avoid. The schema→Payload generator waits until two or three
   presets confirm the shape holds.
   See [ADR-0002](../../adr/0002-presets-are-the-page-authoring-contract.md).

   `src/lib/presets/sections/*.ts` — typed factories for the recurring patterns
   (heroCentered, heroSplit, featureGrid, faq, team, contact, logoWall, ctaBanner, pricing…):
   `heroCentered({ heading, sub, cta, image })` returns a `SectionDefinition`. A landing page is
   5 preset calls. This is also the best Claude accelerant: generation targets preset calls with
   named args, falling back to raw `SectionDefinition` only for novel layouts.
2. **Config builders** for rich text so configs read like a DSL:
   `heading("h1", "Ship faster"), paragraph("..."), buttonRow([button("Get started", "/signup")])`.
3. **Golden fixture pages.** One route (and Storybook story) per preset rendering realistic
   content — the old system's `page-config.ts` fixtures proved this doubles as visual regression
   surface and as few-shot examples for generation.
4. **Live preview route**: `/preview` renders `SectionDefinition[]` from a posted/encoded JSON
   payload — CMS or Claude can hot-render a page config without a deploy.
5. **View-transition page navigation**: name the header section (`page-header`), its first
   blocks (`header-block-1..4`), and `main` (`page-content`) for free cross-page morphs with
   Next's view-transition support.

## Mapper boundary

**Revalidation must be best-effort.** CLAUDE.md mandates `afterChange` → `revalidatePath` /
`revalidateTag`, but `revalidatePath` throws `Invariant: static generation store missing` when
called outside a Next request scope. Payload's Local API runs in plenty of such places —
integration tests, seed scripts, the CLI — so a naive hook makes every non-Next write fail, not
just skip revalidation. Wrap the call so a missing cache scope cannot fail the write, and honour a
`context.disableRevalidate` flag so callers can opt out explicitly during bulk seeding.

CMS data → `SectionDefinition[]` in the app's `src/mappers/` (per CLAUDE.md rule 3, not
`lib/mappers/`), never inside DS components. Under decision 3 the mapper's job is narrow: Payload
stores a preset invocation `{ preset, args }`, so the mapper dispatches to the same preset factory
code pages call. Async
enrichment (hydrating carousel items from a collection, fetching form definitions for form
blocks) is plain async RSC work in the mapper layer.
