# 06 — Component Inventory: shadcn coverage vs what we build

Classification of everything the old design system had (~90 components) against the **current**
shadcn registry (Base UI era — includes Field, Button Group, Input Group, Item, Empty, Spinner,
Kbd, Toast, Data Table, Chart, Carousel, Sidebar, and the chat primitives Message / Message
Scroller / Bubble / Attachment / Marker). Three buckets:

- **USE** — install from shadcn, use as-is.
- **EXTEND** — shadcn component + extra variants/props (kept in `components/ui`, still
  shadcn-shaped).
- **BUILD** — no shadcn equivalent; ours, in React + Tailwind, in `components/ds`.

Only build what a real page needs — this list is the menu, not the backlog.

**Amended (decision 16): v1 is a landing page plus a dashboard.** That rule is correct and
unusable in a template, which has no real pages to generate demand — left as written it either
freezes work at slice one or licenses building all ninety. v1 targets two concrete references: a
[Cosmic-style landing page](https://cosmic.shadcnuikit.com/) and a
[dashboard](https://shadcnuikit.com/dashboard/default) with one charts route inside it.

The two halves are built very differently, because shadcn's coverage is wildly asymmetric:

| Half | shadcn provides | v1 work |
|---|---|---|
| Dashboard + charts | `dashboard-01` wholesale — `app-sidebar`, `nav-main/secondary/user/documents`, `site-header`, `section-cards` (stat tiles), `chart-area-interactive`, `data-table` (TanStack + dnd-kit) | Install and configure. Build nothing. |
| Landing page | Primitives only — Card, Badge, Accordion, Carousel, Avatar, Tabs, Toggle Group, Input | ~14 section presets. All the design-system work lives here. |

**shadcn ships no marketing blocks.** `hero-01`, `pricing-01`, `features-01`, `faq-01` and
`testimonials-01` all 404 in the registry; the only blocks are `dashboard-*`, `sidebar-*`,
`login-*` and `signup-*`. That asymmetry is the justification for the section system — it fills
shadcn's one real gap rather than duplicating it.

Landing sections to cover: hero (+ logo wall), benefits grid, feature grid, service list,
testimonial carousel, team grid, pricing table (with a monthly/annual toggle — client state inside
a config-driven section, the first such case), CTA, community, contact, FAQ accordion, newsletter,
footer. Plus `SiteShell` from doc 05 and the Payload wiring: collections, mappers, `revalidateTag`
from `afterChange`, server-side Live Preview, and `plugin-seo`.

Contact and newsletter mean the **form engine core** (field registry, schema builder, leaf fields)
is in v1 rather than v2. Record drawers, Kanban, EventCalendar, Map and the wizard/array tier stay
v2.

Two deliberate exclusions on the dashboard half. It keeps `dashboard-01`'s shipped `data.json`
rather than reading from Payload — a template has no domain to be a dashboard *of*, and inventing
one would be speculative. And there is **no auth in v1**: the dashboard route is open, `AuthShell`
is not built, and shadcn's `login-*` blocks are installed when a project needs them. Both are
scope decisions, not oversights.

`dashboard-01` brings `@dnd-kit/*`, `@tanstack/react-table` and `zod`. All three stay and the
block installs **unmodified** — zod is the project's schema library (ADR-0001), so there is
nothing to strip and no divergence from upstream to maintain.

**Amended (decision 17): page metadata is missing entirely.** Across all eight docs there are zero
mentions of SEO, metadata, sitemap, robots, Open Graph, canonical URLs or `generateMetadata`. Under
ADR-0002 none of that is expressible as preset args, since presets describe layout, not document
metadata. Use `@payloadcms/plugin-seo` for meta fields on Pages, with `sitemap.ts` and `robots.ts`
generated from the same collection queries.

**Gaps against the old system.** This doc's registry lists 20 block types where the old system had
24 — `buttonGroup`, `buttonGrid`, `avatar` and `chipRow` are unaccounted for. Three components are
also absent from all three buckets: `logo` (47 lines), `tab-row` (126), `icon-button` (75, likely
covered by shadcn Button `size="icon"`). Decide these deliberately rather than by omission.

## USE as-is

Accordion, Alert, Alert Dialog, Avatar, Badge, Breadcrumb, Button, Calendar/Date Picker,
Carousel (Embla), Checkbox, Collapsible, Combobox, Command, Context Menu, Dialog, Drawer
(Base UI — doc 04), Dropdown Menu, Empty, Field (form anatomy — doc 03), Hover Card, Input,
Input Group, Input OTP, Item, Kbd, Label, Menubar, Native Select, Navigation Menu, Pagination,
Popover, Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar,
Skeleton, Slider, Spinner, Switch, Table, Tabs, Textarea, Toast, Toggle, Toggle Group, Tooltip,
Button Group, Chart (Recharts), Data Table (TanStack) — plus Message, Message Scroller, Bubble,
Attachment, Marker for chat UIs.

## EXTEND

| Component | Extension | Why |
|---|---|---|
| Button | `tonal` + `elevated` variants; `active` state for nav | The old system's most-used variants; shadcn has no soft-fill tier |
| Badge | `dot` variant; theme prop | Status dots on chips/nav items |
| Card | The page-builder card: image / gallery-carousel media slot, background image with focal point, overlay chips, icon, density (`dense/standard/spacious`), `theme`, polymorphic root (link/button/div), header/actions/footer/price slots | Workhorse of sections, cardArray, kanban — shadcn Card is the base shell |
| Tabs | `urlKey` prop syncing active tab to a search param | Deep-linkable tabs (router.replace) |
| Accordion | surface variants (outlined/tonal/elevated) | Section-builder block |
| Chart | theme-aware palette from CSS vars (`--chart-1..5` already standard) + `yTickFormat`/divisor helpers | Dashboard parity |
| Data Table | config-driven wrapper: `DataTableConfig` (columns, fetch/patch/create/delete actions, search, filter builder, CSV export, row → opens a Layer) | The old system's most valuable dashboard component; TanStack + shadcn table underneath |
| Toast | `useOfflineToast()` HEAD-probe hook (doc 04) | Real connectivity feedback |
| Separator | centered-label variant | Auth/"or" dividers |

## BUILD (React + Tailwind, ours)

### Section-system blocks (doc 02 — the marketing set)

| Component | Notes |
|---|---|
| Page / Section / Column / Background / BlockRenderer | The section system itself |
| RichText renderer | Lexical (or portable-text) node renderer; format bitmask, upload/table nodes |
| LogoTicker | CSS marquee: duplicated content, `translateX(-50%)` keyframe, mask-image edge fades, pause-on-hover, reverse |
| TextMarquee | Same technique + measured repeat count/duration (ResizeObserver), fluid font sizes |
| Timeline | `<ol>` + connector line, dot-or-icon, horizontal variant |
| Rating | Stars with half-fill (unique gradient id per instance), hover preview, readonly |
| Gallery | Grid of media → Dialog lightbox with Carousel seeded at the clicked index; zoom-from-thumbnail via View Transitions |
| HeroLinks / ChipRow / CardGrid / ButtonRow-Grid | Trivial layout wrappers |
| Chip | Pill with dot/icon/link polymorphism, `theme` (shadcn Badge covers most; build only if Badge extension isn't enough) |
| CardFeatureRow / FeatureItem | Icon+text tile strips (keyboard-scrollable row) |
| HeroShowcase | Auto-cycling hero: typewriter paragraph, cross-fading backgrounds, reduced-motion bail |
| AnnouncementBar | aria-live status bar, dismissible (cookie) |
| ExpandableCard | Card ↔ dialog morph (View Transitions / Motion), placeholder height preservation |

### Dashboard / app

| Component | Notes |
|---|---|
| Layers (`useLayers`, LayerDrawer) | Doc 04 |
| Kanban | Columns from a status field, drag between/within (persisted via patch), cards expand to a form. dnd lib + shadcn Card |
| EventCalendar | Schedule-X (or FullCalendar) wrapper: day/week/month views, event → opens a Layer. shadcn Calendar is a date-picker, NOT this |
| Map | Azure Maps (or MapLibre) wrapper: markers, routes, auto-fit, theme-aware dark style |
| Notification bell | Popover + Badge dot + item list, optimistic mark-read |
| DefinitionList | Term/description rows, dotted-leader variant |
| Chat / AiChat | Compose from shadcn's new Message / Message Scroller / Bubble / Attachment primitives + a dispatcher seam for websockets/streaming (Vercel AI SDK `useChat` for the AI case). Far less custom than the old 1,200-line versions |
| Confetti | `canvas-confetti` wrapper with reduced-motion bail (wizard completion) |

### Form engine (doc 03)

| Piece | Notes |
|---|---|
| ConfigForm / FormRenderer / field registry / schema builder | The engine |
| Composite fields | price (Input Group + currency), slug (derive/lock/regenerate), address (geocode search + subfields), date/dateRange wrappers, multiSelect chips, radioCards/checkboxCards/radioTabs (option cards), numberPickerCards/table (quantity steppers) — each is a thin client wrapper over shadcn primitives |
| fieldArray / cardArray | Repeatables: drag + keyboard reorder, min/max, card summaries + Dialog editor |
| Wizard (steps) | Tab strip, per-step validation, error summaries, onBeforeNext gate |
| Autosave | Blur-diff patcher + per-field save state |

## Explicitly dropped (had no earned keep)

Old Icon component (→ `lucide-react` directly), Image (→ `next/image` wrapper only if Payload),
Modal/Tooltip/Dropdown wrappers (→ shadcn), hand-rolled Snackbar (→ Toast), Megamenu (→
Navigation Menu), Main/Dashboard Navbar+Sidenav (→ shells + shadcn Sidebar, doc 05), the five
layout templates (→ route-group shells), List/ListRenderer (→ Item + config maps), RadioTabs as
a standalone (→ Toggle Group / form field), iframe Layer embedding, `.ui-*` typography classes.
