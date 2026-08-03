# Record-detail drawers are deep-linkable, but do not stack

Clicking a record opens its detail in a shadcn Drawer whose open state is encoded in one search
param, so the URL can be shared and reloaded. It is a single drawer: no stack, no collapsed state,
no href → component registry.

## Status

proposed — nothing is built; this lands in v2 with the first CRUD screen.

## Considered options

### The full Layers system — dropped

The blueprint (doc 04) specified a stack of drawers over any page: open a related record from
inside a drawer, each level behind scaling back and peeking, an `expanded | collapsed | closed`
tri-state, and the whole stack encoded in the URL. It was justified as *"the signature dashboard
interaction"* — which describes the previous Qwik system, not this stack.

shadcn's `dashboard-01` block already implements the canonical case (click a table row, see that
record's detail in a drawer) with an uncontrolled `<Drawer>` and a `<DrawerTrigger>`. There is no
`useRouter`, no `searchParams` and no `pathname` anywhere in its `data-table.tsx`. Under this
repo's shadcn-first rule (ADR-0006), that is the baseline, and anything added on top has to earn
its place.

Separating what Layers offered over that baseline:

- **Deep-linkable** — a shareable URL that opens a record. shadcn's pattern genuinely cannot do
  this, it costs one search param plus `router.push`, and it is a real user-facing capability.
  Kept.
- **Stacking** — where the href → component registry, depth CSS variables and most of the
  complexity live. No planned screen needs it. Dropped.
- **Collapsed / docked state** — a third state to manage, also speculative. Dropped.

### Intercepting and parallel routes — rejected

The idiomatic App Router answer, and it cannot deliver the one property we are keeping.
Intercepting routes apply only to soft client navigations, so a hard load of an intercepted URL
renders the standalone page rather than the drawer. Doc 04 promised "reload the URL and the same
stack reopens" and, eleven lines later, that a direct visit renders the standalone page; both
cannot hold.

## Consequences

- Back-button dismissal works: `router.push` on a search-param change creates a history entry
  exactly as a route navigation does. Use `router.replace` for state that should not enter
  history.
- The standalone route for the record still exists and renders the same component, so nothing is
  duplicated.
- If a screen later genuinely needs to open a second record from inside the first, this decision
  gets revisited with a real use case in hand — which is the condition under which the stack was
  always worth building.
