# 04 — Layers UI & Overlays (shadcn Base UI)

Baseline: use shadcn's Base UI overlay components exactly as shipped — Dialog, Sheet, Popover,
Dropdown Menu, Tooltip, Hover Card, Navigation Menu, Toast. They already handle focus trapping,
dismissal, stacking, and reduced motion correctly (all of which the old Qwik system got partially
wrong). The one thing we ADD is the **Layers UI**.

## What Layers is

A stack of detail panels (drawers) that opens **over any page** and is **encoded in the URL**:

- Click a DataTable row → a drawer slides up showing that record's edit form.
- From inside it, open a related record → a second drawer stacks on top; the one behind scales
  back and peeks (the toast-stack / Vaul-style visual: each level back is ~5% smaller, 14px up).
- Every state is deep-linkable: reload the URL and the same stack reopens.
- Drawers have three states: `expanded | collapsed | closed`. Collapsed = docked at the bottom
  edge so you can see the page behind, expand again later.

Consumers: DataTable row editing, calendar event details, "create related record" flows from
form fields. It's the signature dashboard interaction — worth building properly.

## Implementation

**Component: shadcn Base UI Drawer** (`pnpm dlx shadcn@latest add drawer`). It provides
everything the old hand-rolled drawer faked:

- `snapPoints` (viewport fractions) — `expanded | collapsed` maps to two snap points with the
  controlled `snapPoint` / `onSnapPointChange` API.
- `swipeDirection="down"`, `DrawerSwipeHandle` for the grab affordance.
- `modal={false}` (page behind stays interactive when collapsed) or `"trap-focus"` when
  expanded; `disablePointerDismissal` for forms with unsaved changes.
- Real focus management and ESC handling for free.

**Background scale effect**: pure CSS, no JS — when any drawer is expanded, scale the app shell:

```css
body:has([data-drawer-state="expanded"]) .app-shell {
  transform: scale(0.974) translateY(calc(env(safe-area-inset-top, 0px) + 14px));
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 500ms var(--ease-snappy);
}
```

Stack depth styling via two CSS vars set inline per layer (`--layer-index`, `--total-layers`):
`scale(1 - 0.05 * depth)` and `translateY(-14px * depth)`.

**Content: real routes, not iframes.** The old system rendered each layer as an `<iframe>` of
another route with an `?_embed=1` chrome-stripping handshake.

> **Amended (ADR-0003): most of this section is dropped. There is no stack.** shadcn's
> `dashboard-01` already implements the canonical case — click a table row, see that record's
> detail in a drawer — with an uncontrolled `<Drawer>` and a `<DrawerTrigger>`, and no
> `useRouter`, `searchParams` or `pathname` anywhere in its `data-table.tsx`. Under ADR-0006 that
> is the baseline, and the Layers system was carried over from the old Qwik design system on its
> own authority (*"the signature dashboard interaction"*), which is not an argument from this
> stack.
>
> What survives is the one property shadcn's pattern lacks: **deep-linking**. A single drawer,
> open state in one search param, `router.push` so the back button dismisses it and a shared URL
> reopens it. What is dropped: the stack, the `expanded | collapsed | closed` tri-state, the
> depth-scaling CSS, and the href → component registry that duplicated the router.
>
> Intercepting routes are also rejected — they apply only to soft client navigations, so a hard
> load renders the standalone page, which is exactly the deep-link promise this feature exists
> for. This doc originally asserted both properties on the same page without noticing they
> conflict.
>
> If a screen later genuinely needs to open a second record from inside the first, the decision
> gets revisited with a real use case in hand.

The route shape this replaces, kept for context:

```
app/
  (dashboard)/
    @layer/
      (.)items/[id]/page.tsx     ← intercepted: renders the item editor inside a Drawer
      default.tsx                ← null when no layer
    items/[id]/page.tsx          ← same route standalone (direct visit / hard reload)
    layout.tsx                   ← renders {children} and {layer}
```

- Same component serves both presentations — no embed handshake, no iframe overhead, shared
  client state (a form saved in a layer can update the table behind via router refresh or a
  shared store).
- **Back button closes the top layer** — free with router navigation, and a real UX improvement
  over the old replaceState-only system.
- The **entire stack** — every level, and each one's collapsed state — is encoded in a `layers`
  search param
  (compact JSON array of `{ href, state }`), managed by a small `useLayers()` hook:
  `push(href)`, `collapse(i)`, `expand(i)`, `close(i)`. `router.push` for stack changes (history
  = dismissal), `router.replace` for expand/collapse (state tweaks shouldn't pollute history).
- On table pages, closing/collapsing a layer triggers `router.refresh()` so the RSC list behind
  reflects edits (the old system reloaded an iframe to fake this).

## Overlay usage rules (which component when)

| Need | Use |
|---|---|
| Record detail / edit over a page, stackable, deep-linkable | **Layers** (Drawer + intercepting route) |
| Confirm / small focused task, no URL | Dialog (Alert Dialog for destructive confirms) |
| Desktop side panel (filters, nav on mobile) | Sheet |
| Row/entity actions menu | Dropdown Menu |
| Pick-from-list inputs | Combobox / Select (doc 03 field renderers) |
| Async/status feedback | Toast (`toast.add`, `toast.promise` for saves) |
| Hints | Tooltip (interactive previews: Hover Card) |
| cardArray row editor inside a form | Dialog (with prev/next between rows) |

One convention to keep from the old system: **only one overlay family open per interaction
plane** — opening the mobile nav closes layers; expanding a layer is the only thing that scales
the shell. Enforce with the `:has()` selectors above rather than a JS overlay manager.

## Toast specifics

- `<Toaster />` once in the root layout.
- Severity via toast `type` (success/info/warning/error/loading); saves use
  `toast.promise(saveAction(), { loading, success, error })`.
- Port the one genuinely good behaviour from the old snackbar system as a hook on top:
  `useOfflineToast()` — don't trust `navigator.onLine`; confirm with a HEAD probe
  (any response incl. 404 = online), poll every 12s while offline, pause polling when the tab is
  hidden, show a persistent error toast while offline and dismiss it on recovery.
