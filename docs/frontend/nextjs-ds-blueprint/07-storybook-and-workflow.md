# 07 — Storybook & the Claude-Speed Workflow

## Storybook scope: only what we own

> **Amended (decision 9): Storybook is deferred; this whole section is v2 at the earliest.**
> Rule 7 below ("a new capability lands with its golden fixture + story in the same PR, or it
> doesn't land") is a permanent tax, so it needs to be earned. Two things argue against paying it
> now. The section system is RSC by design, and Storybook's RSC support is still behind
> `experimentalRSC` with mocked `next/image`, `next/font` and `next/navigation` — you would be
> testing server components in an approximation of the runtime they actually run in. And
> `@playwright/test` is already in `devDependencies`, unused. Golden fixture routes plus the
> `/preview` route give a workshop in the real Next runtime with real RSC and real Payload data,
> and Playwright screenshots over them give the visual regression Chromatic was for. This is also
> what the old system actually did: `example apps/storybook/` is a Qwik *routes* app rendering
> `page-config.ts` fixtures, not Storybook the tool. Revisit when the form engine's state matrix
> makes isolation genuinely pay — that is where Storybook wins and fixture routes don't.

Do not write stories for stock shadcn components — that's re-documenting upstream. Storybook
covers the three things that are ours:

1. **Extensions** (doc 06 EXTEND list): every added variant gets a story (Button `tonal`/
   `elevated`, Card media/density/theme matrix, DataTable configs).
2. **Built components** (doc 06 BUILD list): full prop-surface stories.
3. **The systems**: section presets (one story per preset with realistic content), form recipes
   (one story per `Field[]` fixture: simple, conditional, wizard, arrays, autosave-mocked),
   layer stack, layout shells.

Setup (current best practice for Next):

- `npx storybook@latest init` with the **Next.js–Vite framework** (`@storybook/nextjs-vite`);
  `next/image`, `next/font`, `next/navigation` mocks come with it. RSC-only components render in
  stories via the framework's RSC support (`experimentalRSC`) — keep DS components free of
  direct data fetching (principle 4) and this stays painless.
- Import `globals.css` in `preview.ts` so tokens/themes apply; add a global **theme toolbar**
  (light/dark via `.dark` on the preview html) and a **data-theme switcher** for section themes.
- Stories in CSF3, co-located: `components/ds/rating/rating.stories.tsx`.
- Addons: a11y (axe) + Vitest addon for interaction tests on the interactive pieces (wizard
  next/back, fieldArray reorder, layer expand/collapse). Chromatic (or Playwright screenshot CI)
  on the preset/golden stories = visual regression for the whole section system.
- Also keep the old system's one great trick: an **"emulate reduced motion" toolbar toggle**
  that flips a class the animation CSS respects — auditing choreography without OS settings.

## Test harness constraints

### Tests own their own database

Both suites derive their `DATABASE_URL` from the development one by appending `_test` to the
database name (`tests/helpers/test-database.ts`), so `template` becomes `template_test`. Nothing
about this is optional: the e2e suite seeds and deletes CMS pages, and before isolation existed it
was hard-deleting the developer's real `home` page — and all of its versions — on every run.

The derivation deliberately reuses the existing credentials rather than introducing a second env
file. A committed `.env.test` would leak the Postgres password, since `.gitignore` covers `.env`
and `.env*.local` but not `.env.test`.

`tests/int/test-database.int.spec.ts` asserts the suite is pointed at a `_test` database, so
pointing tests at development data fails loudly rather than destroying it.

Nothing needs creating by hand. A global setup step (`tests/global-setup.ts`) creates the test
database if it is missing before either suite runs, and Payload pushes the schema on first connect,
so a fresh clone can run `pnpm test` immediately.

### e2e owns the dev server

Playwright runs its own server on port 3001 with `reuseExistingServer: false`, so a server started
against the development database can never serve the tests. Next permits only one dev server per
project directory, so **`pnpm test:e2e` cannot run while `pnpm dev` is running** — stop the dev
server first. Override the port with `E2E_PORT` if 3001 is taken.

### Neither suite runs files in parallel

Both suites share a single database and, for e2e, a single server:

- **Vitest** sets `fileParallelism: false`. Two spec files calling `getPayload` concurrently both
  try to push the dev schema and race on enum creation, which surfaces as Postgres `42710`
  duplicate-object errors rather than anything test-shaped.
- **Playwright** sets `workers: 1`. Specs that seed a CMS page mutate the very route that
  Fixture-based specs assert on, so parallel files produce failures that look like flakes but are
  a shared-state fault.

Revisit only with per-worker database isolation; retrying is the wrong fix.

## Golden fixtures are the contract

For each system, a small set of typed fixtures lives in the repo and is used by BOTH Storybook
and the app's dev/preview routes:

```
fixtures/
  pages/      hero.ts feature.ts faq.ts team.ts contact.ts pricing.ts   (SectionDefinition[])
  forms/      contact.ts booking-wizard.ts settings-autosave.ts          (Field[])
  nav/        site.ts dashboard.ts                                       (LayoutConfig)
```

These are simultaneously: visual regression surface, live documentation, seed content, and —
critically — **few-shot examples for Claude**. A fixture folder that stays honest is worth more
than any prose style guide.

## Conventions that make Claude fast (don't change the way of doing things)

The old system proved these; they carry over as written rules for the new repo's CLAUDE.md:

1. **Generate configs, not JSX.** New page → `SectionDefinition[]` (preset calls first). New
   form → `Field[]`. New nav → `LayoutConfig`. Claude editing a typed config against existing
   fixtures is near-deterministic; freeform JSX is not. Custom JSX is the escape hatch, not the
   default.
2. **Registries are the extension points.** New block/field = component + registry entry. The
   instruction "add a testimonial block" has one obvious diff shape.
3. **Stock shadcn stays stock.** Never fork `components/ui/*` internals; extend via variants/
   wrappers. This keeps `shadcn diff`/updates cheap and keeps Claude's ecosystem knowledge valid.
4. **One way per concern.** One dnd library, one date library, one icon set (Lucide names as
   strings in configs), one toast API, Tailwind breakpoints only. Every "either/or" in a
   codebase is a coin-flip Claude will eventually call wrong.
5. **Semantic tokens only in components** (`bg-background`, `text-muted-foreground`,
   `data-theme` for section color) — never raw palette classes in DS components; this is what
   makes subtree theming and dark mode automatic.
6. **Docs over comments.** Component code stays comment-free; rationale lives in `docs/` (this
   folder seeds the new repo's `docs/design-system/`). Keep an auto-loaded architecture doc per
   system (sections, forms, layers, layouts) mirroring these files, updated when the system
   changes — stale docs are how the old repo accumulated three breakpoint systems.
7. **Fixtures before features.** A new capability lands with its golden fixture + story in the
   same PR, or it doesn't land.

## Suggested repo layout

Amended to match the repo, which is already `src/`-rooted with committed `components.json`
aliases:

```
src/
  components/
    ui/                         # stock + extended shadcn (shadcn CLI target)
    ds/                         # BUILD list: sections, blocks, form engine, layers, shells
  lib/
    presets/                    # section preset factories, config builders
  mappers/                      # CMS → config translation (CLAUDE.md rule 3)
  fixtures/                     # golden configs (pages/forms/nav)
docs/frontend/nextjs-ds-blueprint/   # these docs, maintained
docs/adr/                            # decisions that shaped them
```

## Migration order (each step ships something usable)

**Amended (decisions 7, 9, 11, 16).** Step 1 as originally written ships nothing observable — it
is a foundation layer with a build attached, which is layer-by-layer work with extra steps and
contradicts the vertical-slice rule. It is deleted; slice one pulls in only the tokens its own
preset consumes.

1. **Slice one: one preset, full spine.** zod args schema → Payload block → mapper dispatch →
   preset factory → `SectionDefinition` → Section/Column/BlockRenderer → a live page from real
   Payload data. Use the Cosmic hero as the target, composed from shadcn primitives. Only the
   tokens that preset uses; no themes beyond `default`, no scroll animation, no second preset.
   This proves the newest machinery in the design while it is still cheap to be wrong about it.
2. Remaining landing sections as presets + fixture routes + `SiteShell`. Build the
   schema→Payload generator once preset 3 confirms the arg shape holds.
3. Form engine core (field registry, zod schema builder, leaf fields) → the contact and
   newsletter forms live.
4. `npx shadcn add dashboard-01` → dashboard route + charts route. Install unmodified (it ships
   zod, which is now the project standard) and configure. Build nothing.
5. Payload wiring throughout: collections, mappers, `revalidateTag` from `afterChange`,
   server-side Live Preview with drafts + autosave, `plugin-seo`. **v1 complete.**

v2, pulled by the first project that demands it: deep-linkable record drawers (ADR-0003),
wizard + arrays + autosave, Kanban, EventCalendar, Map, and the long tail from doc 06.

## Fixtures as the regression surface

Every registered Preset has one Fixture in `src/fixtures/presets`, and a test asserts the Fixture
names equal the registry keys in both directions — a new Preset cannot ship without a worked
example, and a Fixture cannot outlive its Preset.

`/preview/<preset>` renders one committed Fixture. `/preview/config?c=<base64url>` renders an
arbitrary posted configuration and **requires a logged-in Payload user**: without that gate it is
a renderer for attacker-authored content on the production origin, inside the real site chrome —
a hosted phishing page under your own domain. `noindex` stops it being found, not being sent.

The decoder validates against a zod schema, not an allowlist of block types. An allowlist only
answers "is this block ours", which leaves every other field unchecked: a `buttonRow` with no
`buttons` reaches a renderer that calls `.map()` on undefined and returns a 500 on demand, and an
unvalidated `tag` renders the section as `<style>` or `<iframe>`, letting a posted config blank
the real site. The schema pins the section tag to the three landmarks, gives every block its
required fields, and constrains every link target to a path, anchor, mail or web address, so
`javascript:` and `data:` URLs are rejected.

Playwright screenshots each Fixture route into
`tests/e2e/fixtures-visual.e2e.spec.ts-snapshots/`. Baselines are platform suffixed
(`-chromium-darwin`), so the suite is **opt-in behind `VISUAL=1`**: committed macOS baselines
would otherwise fail wholesale on Linux CI or any other contributor's machine, which trains people
to ignore the suite. Run `VISUAL=1 pnpm exec playwright test --update-snapshots` once per platform.

The sticky site header is masked, since it overlaps the top of each section and would otherwise be
baked into every baseline. The diff budget is 0.1% rather than 1% — a full-width section gives a
1% budget roughly ten thousand pixels of slack, enough to hide the copy edits the suite exists to
catch. Verified by changing one word in a Fixture heading and confirming the matching screenshot
failed.

`src/fixtures/pages/home.ts` composes the landing page from those same Fixtures, applying Themes
and the hero's full-viewport height. There is one copy of each Preset's example content, used by
the preview routes, the visual regression suite and the live home page alike.

The Fixtures were derived mechanically from the previous hand-written home page, not retyped. A
first attempt at retyping silently dropped twenty-two strings of live copy — a paid tier lost an
advertised feature, a testimonial was reattributed to a different named person, and descriptions
were truncated — while reading as a pure refactor in the diff. Only the handful the e2e happened
to assert were caught.
