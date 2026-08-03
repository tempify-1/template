# v1 — Config-driven landing page and dashboard

## Problem Statement

Starting a new Payload + Next.js client project from this template currently means building
everything twice over. The repo has a working CMS and a single "Welcome to your new project"
route; every marketing site rebuilds its own hero, feature grid, pricing table and FAQ from
scratch, and every dashboard rebuilds its own sidebar, header and data table. None of it is
reusable, so the second project starts where the first did.

The second problem is who can change a page once it exists. A developer can edit markup, but a
content editor cannot. Making pages CMS-editable normally means either hand-wiring a Payload
schema per layout — which drifts from the components it feeds — or giving editors a generic
block-builder that lets them assemble off-design pages.

Neither problem is solved by copying the previous Qwik design system: it carries three conflicting
breakpoint systems, 17,004 lines of CSS across 116 files, an entrance animation that leaves page
content permanently invisible if JavaScript fails to hydrate, and a stored-value contract that was
its single largest recurring source of bugs.

## Solution

Two reference implementations, built the way every subsequent project should be built.

A **landing page** composed entirely of **Presets** — named, parameterised page patterns that both
developers and content editors compose pages from. A developer calls a Preset with named
arguments; an editor picks the same Preset in Payload and fills in the same arguments. There is
one vocabulary, not two, so a page is equally authorable from code and from the admin panel, and
an editor cannot produce a layout a designer did not intend.

A **dashboard** assembled from shadcn's `dashboard-01` block, installed and configured rather than
built, demonstrating that the dashboard half of any project is close to free.

Underneath both: a single zod schema per Preset defines its arguments once, the argument type and
the Payload fields both derive from it, and a mapper turns a stored Preset invocation back into
the Section structure the renderer consumes. Payload edits reach the live page through cache
revalidation, and editors see their changes in Live Preview before publishing.

## User Stories

### Content editor

1. As a content editor, I want to add a Section to a page by choosing a named Preset, so that I
   can build a page without understanding the layout system underneath it.
2. As a content editor, I want each Preset to ask me only for the content it needs, so that I am
   not confronted with column spans, gutters and breakpoints I have no opinion about.
3. As a content editor, I want to reorder Sections on a page, so that I can restructure a page
   without a developer.
4. As a content editor, I want to remove a Section, so that I can retire content that is no longer
   relevant.
5. As a content editor, I want to see my changes rendered as I work, so that I can judge the
   result before committing to it.
6. As a content editor, I want my in-progress changes saved automatically, so that Live Preview
   reflects what I am doing without me having to save manually.
7. As a content editor, I want to publish a page and see the live site update, so that I do not
   have to ask anyone to deploy.
8. As a content editor, I want to work on a draft without it being visible publicly, so that I can
   prepare a page ahead of launch.
9. As a content editor, I want to set a page's title, description and social sharing image, so
   that the page presents correctly in search results and when shared.
10. As a content editor, I want to see a preview of how the page will appear in search results, so
    that I can write metadata that reads well.
11. As a content editor, I want to upload an image for a hero Section, so that the page has its
    intended visual impact.
12. As a content editor, I want to choose a Section's Theme from a small named set, so that I can
    vary the page's rhythm without inventing colours.
13. As a content editor, I want a contact form on the site, so that prospects can reach us.
14. As a content editor, I want a newsletter signup, so that we can build a mailing list.
15. As a content editor, I want to edit navigation links, so that the header and footer stay
    current.

### Developer starting a project

16. As a developer, I want to compose a page in TypeScript by calling Presets with named
    arguments, so that building a page is a short, typed, reviewable diff.
17. As a developer, I want a Preset's argument type to be inferred from a single definition, so
    that I cannot pass arguments the CMS could not also supply.
18. As a developer, I want the Payload fields for a Preset to come from that same definition, so
    that the CMS and the code cannot drift apart.
19. As a developer, I want to add a new Preset without editing any renderer, so that extending the
    system is additive.
20. As a developer, I want to add a new Block type without editing the Block renderer, so that
    content units are equally additive.
21. As a developer, I want Payload data transformed at a mapper boundary, so that presentational
    components never depend on CMS types.
22. As a developer, I want the page-rendering tree to be Server Components, so that a marketing
    page ships almost no JavaScript.
23. As a developer, I want a dashboard with a sidebar, header, stat tiles, a chart and a data
    table without building any of them, so that I can start on the product rather than the chrome.
24. As a developer, I want a charts route demonstrating the chart component, so that I have a
    worked example to copy.
25. As a developer, I want forms defined as a Field configuration rather than hand-written markup,
    so that a new form is a data change.
26. As a developer, I want form validation derived from that same configuration, so that the rules
    and the rendered fields cannot disagree.
27. As a developer, I want behaviour in configuration expressed as a named Action, so that a
    config remains serializable and therefore CMS-storable.
28. As a developer, I want committed Fixtures for each Preset, so that I have realistic worked
    examples to copy and a regression surface to test against.
29. As a developer, I want a preview route that renders a posted configuration, so that I can see
    a layout without deploying or seeding the CMS.
30. As a developer, I want components to reference semantic tokens only, so that rebranding is a
    token change rather than a search-and-replace through markup.
31. As a developer, I want a published edit to reach the live page automatically, so that I do not
    hand-write cache invalidation per collection.
32. As a developer, I want the shell chrome selected by route group, so that adding a marketing
    page or an app page is a matter of where the file lives.

### Site visitor

33. As a site visitor, I want the landing page to render its content even if JavaScript fails, so
    that the page is never blank.
34. As a site visitor, I want the page to be legible on a phone, so that I can read it wherever I
    am.
35. As a site visitor, I want to submit the contact form and be told it succeeded, so that I know
    my message was sent.
36. As a site visitor, I want to be told clearly when a form field is wrong, so that I can correct
    it.
37. As a site visitor using a screen reader, I want Sections to use correct landmark and heading
    structure, so that I can navigate the page.
38. As a site visitor who prefers reduced motion, I want entrance animation suppressed, so that
    the page does not move unexpectedly.
39. As a site visitor, I want the page to appear correctly when shared to social media, so that
    links look intentional.

### Agent working in this repo

40. As an agent, I want page changes to be typed configuration edits rather than freeform markup,
    so that my output is near-deterministic and reviewable.
41. As an agent, I want registries as the extension points, so that "add a testimonial Block" has
    one obvious diff shape.
42. As an agent, I want the architectural decisions recorded in ADRs, so that I do not "fix"
    something that was deliberate.

## Implementation Decisions

All of the following are already recorded as ADRs; this spec assumes them rather than reopening
them.

### Authoring model

- A **Preset** is a factory from named arguments to a Section structure, and is the only page
  authoring vocabulary. Payload stores a **Preset invocation** — the Preset's name plus its
  arguments — never an expanded Section tree. (ADR-0002)
- Page configuration is **code-first**: the design-system config types are hand-authored
  TypeScript and Payload is derived from them. This is an explicit carve-out from the repo's
  schema-first rule, which continues to govern Payload data. (ADR-0002)
- **One zod schema per Preset** is the single definition of its arguments. The TypeScript argument
  type is inferred from it; the Payload block fields are generated by walking it. (ADR-0001,
  ADR-0002)
- The schema-to-Payload-fields generator is **deferred**: Presets one to three carry hand-written
  Payload blocks, and the generator is a **blocking prerequisite for the fourth Preset**, at which
  point it backfills the first three. The likely construction is zod → JSON Schema → Payload
  fields, with only the last step bespoke. (ADR-0002)
- **Presets and Blocks are distinct layers.** A Preset composes a Section; a Block fills a Column.
  Presets that intend free composition expose a Blocks argument; the rest have fixed layouts.
  (ADR-0002)
- **Behaviour in configuration is a named Action** resolved through a registry, never a function or
  a React node, because configs must survive JSON serialization to be CMS-storable. (ADR-0005)

### Build posture

- **shadcn first.** Check the registry before writing a component; check for a block before
  assembling primitives. The previous Qwik design system is evidence about pitfalls, never a
  source of design. (ADR-0006)
- This posture partitions the work: shadcn ships no marketing blocks, so the landing page is where
  all design-system effort goes; shadcn ships `dashboard-01` whole, so the dashboard is
  configuration only.

### Modules built or modified

- **Preset registry** — maps a Preset name to its argument schema and factory. New Presets
  register; no renderer is edited.
- **Section system** — the Page, Section, Column and Block renderers. All React Server Components.
  Column owns each Block's wrapper element and stamps its index as a CSS custom property, so the
  stagger contract cannot be broken by a Block author adding a wrapper.
- **Block registry** — maps a Block type to its component, on the same additive pattern.
- **Mapper layer** — Payload documents to Section structures, dispatching Preset invocations to the
  same factories code uses. Presentational components never import CMS types.
- **Form engine core** — Field registry, zod schema builder, and leaf field renderers bound to
  shadcn's Field anatomy. Conditions live at the schema's object level so a hidden Field is never
  required regardless of what is mounted. `defaultValues` is an ordered resolver chain, populated
  with static values only for now, so URL prefill and AI population can be added later without
  engine surgery.
- **Site shell** — header, navigation and footer for marketing routes, driven by typed navigation
  configuration.
- **Dashboard shell** — installed from `dashboard-01` unmodified and configured.

### Schema changes

- A **Pages** collection whose Sections field is a list of Preset invocation blocks, one Payload
  block per Preset, with drafts and autosave enabled.
- The SEO plugin adds metadata fields to Pages, with sitemap and robots routes generated from the
  same queries.
- Existing Users and Media collections are unchanged.

### Rendering, caching and preview

- Server Components by default; client components only for genuine interactivity islands. The
  pricing Section's monthly/annual toggle is the first such case and its mechanism is still open.
- Published edits reach live pages via tag-based revalidation fired from Payload change hooks.
- **Live Preview runs in server-side mode**, refreshing the route on save rather than per
  keystroke, which keeps the render tree in Server Components. Drafts and autosave on Pages are
  therefore a requirement, not an option — without them an editor sees nothing until they save
  manually. (ADR-0004)

### Styling

- Semantic tokens only in components; never raw palette classes or literal colour values.
- Section colour is a small **semantic Theme set** derived from brand tokens, applied via a data
  attribute that scopes an override of the standard token set. Palette-named themes are rejected:
  a hue in a page config makes rebranding a content migration.
- Entrance animation is gated on JavaScript having run, so no-JS, pre-hydration and
  hydration-failure states all render visible content. Animation is additive, never load-bearing
  for legibility.

### Libraries

- **react-hook-form + zod** for forms, wired through the resolver package. (ADR-0001)
- **dnd-kit** as the single drag-and-drop library, inherited from `dashboard-01`.
- Record-detail drawers, when they arrive, are a single shadcn Drawer whose open state lives in one
  search parameter for deep-linking — no stack, no intercepting routes. (ADR-0003)

## Testing Decisions

A good test here asserts externally observable behaviour: what a mapper returns for a given stored
document, and what a visitor sees on the page. It does not assert the shape of intermediate
objects, the existence of particular components, or anything a refactor would legitimately change.

**Primary seam: the mapper, driven through the Local API.** Creating a page containing a Preset
invocation and mapping it exercises registry dispatch, zod parsing of the stored arguments, and the
argument-to-Section transformation in a single call. This is the seam that matters most in v1,
because the Payload blocks are hand-written until the generator lands, and a block that drifts from
its Preset's schema fails here with a precise parse error rather than as a blank page. Prior art:
the existing integration spec, which sets up Payload via the Local API in a `beforeAll` and asserts
against query results.

**Smoke coverage above it.** One end-to-end assertion that a page created through the Local API
renders its heading and call to action in the browser, confirming the spine is connected. Prior
art: the existing frontend end-to-end spec, which loads the homepage and asserts on heading text.

**Deliberately not tested in isolation:** the Preset factories. They are pure data transforms with
no branching worth isolating, and unit tests over them would duplicate mapper coverage while
coupling to internals that are expected to move.

**Fixtures are the regression surface.** Each Preset lands with a committed Fixture used by both
the preview route and the tests, so coverage grows with the Preset set rather than being retrofitted.

## Out of Scope

- **Authentication.** The dashboard route is open in v1. The auth shell is not built, and shadcn's
  login blocks are installed when a project needs them.
- **Dashboard data from Payload.** The dashboard keeps `dashboard-01`'s shipped sample data. A
  template has no domain to be a dashboard of, and inventing one would be speculative.
- **Record-detail drawers**, Kanban, calendar, maps, and the wizard, repeatable-array and autosave
  tiers of the form engine. All pulled by the first project that needs them.
- **Storybook.** Fixture routes plus the preview route and Playwright screenshots cover the same
  ground in the real runtime, without mocked framework APIs. Revisited when the form engine's state
  matrix makes component isolation genuinely pay.
- **CMS-defined forms.** The form engine is code-driven in v1; mapping CMS form documents to Field
  configuration comes later.
- **The remaining layout shells** — auth and blank — and the wider component inventory.

## Further Notes

- The generator deadline is the one date in this spec that should not slip. "Defer until the shape
  is stable" with no number attached is how the previous system ended up hand-syncing its CMS
  configuration to its component props indefinitely.
- **dnd-kit has published nothing since December 2024** and its prerelease tag points at the same
  date. It arrives with `dashboard-01` and does one well-scoped job, so it is fine for v1, but the
  choice should be revisited when Kanban and repeatable Fields actually depend on it.
- Formisch was selected for the form engine and then rejected after reading its shipped types: its
  validate function has no field-path variant, so per-step validation — the wizard's central
  requirement — is unsupported. That tier is out of scope for v1 but the constraint shaped the
  library choice. See ADR-0001.
- The pricing Section's monthly/annual toggle is client state inside a config-driven Section, which
  no existing decision covers. It needs resolving before that Preset is built: either a Block that
  owns its own state, or a new configuration affordance.
