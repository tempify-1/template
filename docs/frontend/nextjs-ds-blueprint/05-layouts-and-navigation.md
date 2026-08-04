# 05 — Layouts & Navigation (App Router + shadcn blocks)

Baseline: shadcn's Sidebar, Navigation Menu, Breadcrumb, and the official dashboard/sidebar
blocks. The addition is small: a set of **layout shells** selected per route group, and
**typed nav config** so the same shell serves different products.

## The shells

Four `layout.tsx` shells, mapped to App Router route groups — switching between website and
dashboard chrome is just which group a route lives in:

```
app/
  layout.tsx                 ← root: fonts, ThemeProvider (next-themes), <Toaster />, providers — ONCE
  (site)/layout.tsx          ← SiteShell: announcement bar? + header nav + footer
  (dashboard)/layout.tsx     ← DashboardShell: SidebarProvider + AppSidebar + header + @layer slot
  (auth)/layout.tsx          ← AuthShell: split panel (form left, hero/showcase right)
  (blank)/layout.tsx         ← BlankShell: nothing (embeds, print, standalone flows)
```

Rules learned the hard way from the old system:

- **Providers live in the root layout only.** The old system duplicated theme + toast + state
  providers inside every one of its five templates (and had stale forked copies of two
  contexts). One provider root; shells are dumb chrome.
- Shells are RSC; only the interactive bits inside them (sidebar trigger, theme toggle, mobile
  nav) are client components.
- A route can opt out of chrome by living in `(blank)` — replaces the old `isIframe` /
  `?_embed=1` detection entirely (layers use intercepting routes now, doc 04).

### SiteShell (website)

- Header: logo + Navigation Menu (config-driven, below) + actions slot; `sticky top-0` with a
  scrolled state (border/backdrop-blur after scroll — a tiny client hook toggling a
  data-attribute, same pattern as section visibility).
- Optional announcement bar above the header; its height exposed as `--announcement-height` so
  the header and anchors offset correctly; dismissal persisted (cookie) so it doesn't reflash.
- `navTransparentAtTop` support for hero pages: header transparent until scroll when the first
  section requests it.
- Footer: config-driven (brand, link columns, social icons, copyright).

### DashboardShell

- shadcn **Sidebar** (`SidebarProvider`, `collapsible="icon"` rail, `SidebarInset`) — it already
  does open/collapsed/mobile-sheet states, keyboard shortcut, and cookie-persisted state; do not
  hand-roll any of this again.
- Header inside the inset: `SidebarTrigger` + Breadcrumb + actions (notifications bell =
  Popover + Badge; user menu = Dropdown Menu — both from nav config).
- Renders the `@layer` parallel-route slot (doc 04).
- Sub-navigation pages (settings-style): a nested two-pane layout in the route group
  (`(dashboard)/settings/layout.tsx`) with an Item-list aside — not a separate shell.

### AuthShell

Two-column grid: form column (logo, heading slot, content) + hero column (`next/image` or an
auto-cycling showcase — heading slide + typewriter paragraph + cross-fading backgrounds, with a
`prefers-reduced-motion` bail; port choreography values from the old HeroShowcase if wanted).
Collapses to single column below `lg`.

## Typed nav config

Same philosophy as sections/forms: navigation is data, components render it. One config type
drives header, sidebar, and footer; it's CMS-mappable (Payload NavigationLayouts) or a plain TS
file per app.

```ts
interface LayoutConfig {
  announcement?: { content: string; href?: string; dismissible?: boolean };
  header?: { items: NavItem[]; cta?: NavLink };
  sidebar?: { groups: SidebarGroup[]; footer?: UserMenuConfig };
  footer?: FooterConfig;
}

type NavItem =
  | { type: "link"; label: string; href: string; icon?: LucideIconName; external?: boolean }
  | { type: "menu"; label: string; items: NavLink[] }                       // Dropdown Menu
  | { type: "mega"; label: string; columns: { title: string; items: NavLink[] }[] } // Navigation Menu content
  | { type: "action"; label: string; action: string; args?: Json; icon?: LucideIconName };

interface SidebarGroup {
  title?: string;
  items: (NavLink & { items?: NavLink[]; badge?: string })[];   // one nesting level, collapsible
}
```

**Amended (decision 12): behaviour in config is a named Action.** The `action` variant above is
not a detail — this config is 20 lines where the old system's `layout-config.types.ts` is 372,
and the gap is capability, not verbosity. The old union carried link / button / collapsible /
heading items, nested list variants, per-item badges, and crucially
`action: "signOut" | "custom"` with a `customActionId`. Sign-out is a function, but configs must
stay JSON-serializable because Payload stores them (ADR-0002), so behaviour is expressed as a
string resolved through an action registry — the same pattern already governing blocks and
fields. This generalises past nav: a preset's `cta`, a card that opens a Layer, a button that
submits. Without it, every behavioural element silently becomes code-only and unreachable from
the CMS. `UserMenuConfig` is referenced above but never defined; it is a `SidebarGroup` of
action items.

- Renderers: `HeaderNav`, `AppSidebar`, `SiteFooter` — thin maps from config onto shadcn
  components. Active state from `usePathname()` (`aria-current`, sidebar `isActive`).
- Megamenu = Navigation Menu content panels (keyboard + hover handled by Base UI — the old
  hover-only singleton implementation is exactly what we're avoiding).
- On mobile, header items fold into the sidebar/sheet automatically (one `navItemsToSidebar()`
  transform, not a second config).
- Icons are `LucideIconName` strings resolved through one lookup map — configs stay
  serializable.

## What is built (SiteShell)

`(frontend)/layout.tsx` wraps marketing routes in `SiteShell`: sticky header, `HeaderNav`,
mobile sheet, and a footer driven by the same `LayoutConfig`. The shell and footer are Server
Components; only `HeaderNav` (Base UI navigation menu), `MobileNav` (sheet state) and `NavAction`
are client components.

The shell renders no `<main>` — the section `Page` component already owns it, and nesting a
second one would give the page two main landmarks.

Link-buttons use `buttonVariants()` on a `<Link>`, not `<Button render={<Link/>}>`. Base UI's
button warns at runtime when its rendered element is not a native `<button>`, and the section
`buttonRow` already established the `buttonVariants` pattern.

Icons resolve through `NavIcon`, which builds an element with `createElement` rather than
assigning the resolved component to a capitalised variable and rendering it as JSX. The React
Compiler lint rule `react-hooks/static-components` rejects the latter inside a client component,
because it cannot prove the lookup returns a stable identity.

### The named Action

`toggleTheme` is the one registered Action. It receives an `ActionContext` carrying the theme
getter and setter rather than touching the DOM, so the registry stays testable without a browser
and the config stays a string. `next-themes` provides the provider — it was already a dependency
via shadcn's sonner, which called `useTheme()` against no provider at all until this shell added
one. That also makes the dark pairings of the Section Themes (doc 01) reachable by a visitor
rather than only by tests.

### 404s and the shell

`not-found.tsx` inside a route group only catches `notFound()` raised by routes *in* that group.
A URL matching no route at all belongs to no group, so with multiple root layouts Next falls back
to its built-in page — no header, no footer, no way back. `(frontend)/[...notFound]/page.tsx`
calls `notFound()` so an unmatched URL matches a route inside the group and renders
`(frontend)/not-found.tsx` within the shell. A catch-all is the lowest-priority match, so it
shadows nothing.

Placeholder destinations (`/signup`, `/docs`, `/contact`, `/privacy`, `/terms`) are pinned in a
list in the nav test: a configured href must either resolve to a route under `src/app` or appear
in that list, and the list may not contain a route that now exists or one nothing links to. A new
dead link is then a deliberate edit rather than an accident.

### Both root layouts carry the providers

`next-themes` stores the choice and re-applies it per document. Crossing a route group boundary is
a full document load, so a provider in only one root layout means the toggle appears to forget
itself — the header links straight into `(dashboard)`, so this was reachable in two clicks. Both
root layouts mount `ThemeProvider` with `suppressHydrationWarning`. This is the cost of the
multiple-root-layout shape; a single root layout would hold the providers once.

## Live Preview and draft rendering

Live Preview runs in Payload's server-side mode, so the render tree stays Server Components
(ADR-0004). `/next/preview` enables draft mode and redirects; `/next/exit-preview` disables it.
The route requires a logged-in Payload user and refuses anything but a single relative path. That
check is not `startsWith('/')`: a browser normalises a backslash to a slash when resolving a
`Location` header, so `/\evil.example` reads as relative but lands on `evil.example`. The guard
normalises backslashes, rejects a leading `//`, then resolves the candidate against a throwaway
origin and rejects anything whose origin moved. It also refuses a request whose `Sec-Fetch-Site`
is `cross-site`, so a link from another site cannot flip an editor into draft mode. It carries no
secret in the query string: a secret there leaks through logs and referrers, and the auth check
is the real gate.

`DraftRefresh` is a Server Component that reads `draftMode()` and renders nothing when it is off,
so the client refresh listener exists only inside preview. Server-side mode refreshes on save
rather than per keystroke, which is why drafts and autosave are enabled on Pages.

### Revalidation and the cache

The published page query is wrapped in `unstable_cache` tagged `page:<slug>`, and the Pages
`afterChange`/`afterDelete` hooks call `revalidateTag` for the affected slugs — keyed per
document, never a blanket purge. There is deliberately **no** site-wide tag on those entries: one
would be attached to every page, so a single save would drop the whole site's cache, which is the
opposite of what the ticket asks for. The sitemap is a statically prerendered metadata route,
which a tag cannot reach, so it is revalidated by path as well.

`revalidateTag` takes a cache-life argument, and the choice matters. The `'max'` profile marks the
entry *stale* with a year-long expiry rather than expiring it, so `unstable_cache` serves the old
value once more and refreshes in the background — the first visitor after a publish sees
pre-publish content. `{ expire: 0 }` expires it, so the very next request re-queries. Verified by
priming a 404 on an unpublished slug, publishing over HTTP, and asserting the *first* subsequent
request is 200; the test asserts that single request rather than polling, because polling hides
exactly this defect.

Two things this makes true, both learned by watching tests fail:

- **Only writes that go through the Next process invalidate anything.** A script or CLI writing
  straight to Postgres leaves the site serving the cached document, because `revalidateTag` runs
  in the process that calls it. Editor saves go through the admin panel, which is inside Next, so
  real editing is fine — but tests that seed with the Local API must either use unique slugs or
  clean up over HTTP.
- **Cache-life arguments are not decoration.** The first version passed `'max'`, which only marks
  an entry stale; the test polled, so it passed while the product was wrong.

The cached entry also carries a bounded `revalidate`, so an out-of-band write cannot leave the
site stale indefinitely.

`DraftRefresh` takes its `serverURL` from the incoming request's host rather than `siteUrl()`.
Payload's live-preview listener compares that value against `event.origin` by exact string
equality, so a deployment reached on any origin other than the configured one would silently stop
refreshing. It also renders an exit-preview control: without one, an editor who enters draft mode
has no way out, since the cookie survives navigation.

`pageTag` lives in `src/lib/cache-tags.ts` with no Next imports. The Payload config
imports the Pages collection, and the config must load outside a Next runtime — vitest, the
Payload CLI — so anything it reaches must not statically import `next/cache`.

## Shared layout state

Almost nothing global is needed once shadcn owns sidebar state and next-themes owns theme:

- `useScrollState()` — direction + past-threshold booleans as data-attributes on the shell
  (drives header condense, announcement collapse). Passive listener, rAF-throttled.
- Announcement dismissed → cookie, read server-side so SSR renders the right height.
- That's it. The old system's 12-signal LayoutState store dissolves into these two plus shadcn
  internals.
