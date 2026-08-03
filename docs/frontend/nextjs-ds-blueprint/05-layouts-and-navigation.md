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

## Shared layout state

Almost nothing global is needed once shadcn owns sidebar state and next-themes owns theme:

- `useScrollState()` — direction + past-threshold booleans as data-attributes on the shell
  (drives header condense, announcement collapse). Passive listener, rAF-throttled.
- Announcement dismissed → cookie, read server-side so SSR renders the right height.
- That's it. The old system's 12-signal LayoutState store dissolves into these two plus shadcn
  internals.
