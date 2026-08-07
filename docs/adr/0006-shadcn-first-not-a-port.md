# shadcn best practice first; this is not a port of the old design system

Every part of this design system starts from shadcn — its blocks where they exist, its primitives
where they don't, its conventions always. A previous Qwik design system exists and is referenced
throughout `docs/frontend/`; it is a source of evidence about **pitfalls**, never a source of
design.

**Capability parity is not porting.** This ADR bans copying the old system's *implementation* — its
components, its file layout, its state model. It does not ban wanting what it could do. "The old
system could take a deposit against a room with four travellers" is a requirement, and the old
system is the best available evidence that the requirement is real and that the semantics work.
"The old system solved it with a 516-line `ArrayCombobox` storing `SelectionRecord` objects" is an
implementation, and it is exactly what this ADR excludes. Feature-parity tickets are legitimate and
should cite the old system for *semantics*; they must not inherit its shapes. Where a parity ticket
finds that shadcn's primitive genuinely cannot carry the behaviour, that is a finding to record —
not a licence to port.

## Status

accepted

## Why this needs recording

A future reader will find a proven 33,898-line design system in a sibling repository, and this
repo's blueprint citing it on nearly every page, and reasonably conclude the job is to port it.
That assumption is wrong and expensive, and it has already been made twice during the design
review that produced these ADRs.

The stance is not dogma, because shadcn's coverage is genuinely asymmetric and the asymmetry tells
you where the work is:

- **`dashboard-01` ships the entire dashboard** — `app-sidebar`, `nav-*`, `site-header`,
  `section-cards` (stat tiles), `chart-area-interactive`, `data-table` (TanStack + dnd-kit). The
  dashboard is configuration, not construction.
- **shadcn ships no marketing blocks at all** — `hero-01`, `pricing-01`, `features-01`, `faq-01`
  and `testimonials-01` all 404 in the registry. Only `dashboard-*`, `sidebar-*`, `login-*` and
  `signup-*` exist.

So the section system (doc 02) is justified: it fills shadcn's one real gap rather than
duplicating it. And the dashboard needs almost no design-system work at all.

## Considered options

**Port the old system.** It is proven, battle-tested and covers ~90 components. Rejected: porting
carries what the old repo actually accumulated — three conflicting breakpoint systems, 116 CSS
files totalling 17,004 lines, an animation system that renders content permanently invisible if
JavaScript fails to hydrate, and a `{key, label}` stored-value contract that was its single
largest recurring bug source. It also forfeits the reason for choosing shadcn: that ecosystem
knowledge, upstream updates and third-party registry items all apply directly.

## Consequences

- **When shadcn has an opinion, shadcn wins.** Semantic token names over palette names, its
  `Field` anatomy, its component structure, `cva` and utilities over per-component CSS.
- **Install before building.** Check the registry before writing a component; check for a block
  before assembling primitives.
- **The old system answers "what went wrong," not "what to build."** Its value in these docs is
  its failure modes and the semantics it proved worth keeping (form conditions, wizard behaviour,
  scroll choreography values) — never its implementation.
- Decisions elsewhere follow from this one: semantic section themes over 19 Tailwind hues, preset
  argument surfaces derived from target designs rather than old page-configs, and record-detail
  drawers narrowed to what shadcn's own pattern lacks (ADR-0003).
