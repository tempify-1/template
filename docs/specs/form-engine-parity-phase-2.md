# Form engine parity, phase 2 — the array family, finished

## Problem Statement

Phase 1.5 built the chip-list combobox and proved the hard machinery: `object[]` rows through
every seam, a live-editing row modal shared-by-design, per-row condition scoping, and a payload
asserted on the wire. Four capabilities were scoped out of that build and are now the gap between
"the combobox works" and "the array family is finished":

**A selection list cannot come from a server.** `OptionSource` is documented in `03-forms.md` and
implemented nowhere. Any list that lives in a database — destinations, products, rooms priced by
season — cannot be offered. This was the original reason the `{value,label}` carve-out exists, and
the carve-out still has no consumer.

**Single-choice-with-filtering has no control.** `searchableSelect` was orphaned when `combobox`
was corrected to the array control. A visitor choosing one destination from two hundred currently
gets a native select or nothing.

**Rows present only as chips.** A chip carries a label and a dot; a booking row with six fields
needs a summary a visitor can read without opening it. `cardArray` — the same rows, the same
`RowEditorDialog`, a Card presentation — is the reading view, and today it does not exist.

**Row order is button-only.** `draggable: true` is accepted by the config, documented as inert,
and set in the demo. The grip it promises renders nothing; reorder lives behind the modal footer
and the fieldArray's arrow buttons.

And one capability Kallax had that no config can express: **a row field whose options depend on
its own row** — traveller titles constrained by that room's type. `rowKeyedOptionsSignal` was
Qwik-reactive machinery; the semantic is real and currently unreachable.

## Solution

Five items, all building on what 1.5 landed, none inventing new machinery:

- **`searchableSelect`** — the scalar type-to-filter select, on the same registry combobox in
  single mode. Bare `string` over static options; `{value, label}` over an async source. The
  contract rows already exist in `03-forms.md`.
- **Async `OptionSource`** — `(query, signal) => Promise<Option[]>` for `searchableSelect` and
  `combobox`. Base UI's documented async path: `filter={null}`, externally controlled `items`,
  `Combobox.Status` announcing loading, in-flight requests aborted, and selections merged with
  results so chosen values survive a query change.
- **`cardArray`** — rows render as summary Cards; clicking opens the *same* `RowEditorDialog` the
  combobox uses. `cardDisplay` grows the remainder of its surface.
- **Pointer drag** — the grip renders, drag reorders, `draggable` stops being inert. Keyboard
  reorder already exists and is untouched; drag is additive, never a replacement.
- **Per-row option sources** — a row field may take its options from a static map keyed by a
  sibling field's value. JSON-serializable config, no functions, per ADR-0002.

The form-level chrome (`message`, `confirmedLabel`, `actions`, `keyboardShortcuts`) that the 1.5
spec sketched into phase 2 **moves to phase 4**, which owns the whole `FormProps` surface. This
spec supersedes that sketch; phase 2 is purely the array family.

## User Stories

### Site visitor

1. As a visitor, I want to type three letters and see matching destinations from a live list, so
   that a two-hundred-entry list is a search, not a scroll.
2. As a visitor on a slow connection, I want the list to say it is loading — and my screen reader
   to say so too — so that an empty popup does not read as "no results".
3. As a visitor, I want the options I already picked to stay picked while I search for the next
   one, so that refining a query never costs me a selection.
4. As a visitor, I want each room shown as a card I can read — type, board, who is in it, what is
   missing — so that I can review a booking without opening every row.
5. As a visitor, I want to drag a room above another when order matters, and I want the same
   reorder possible without a pointer, so that drag is a convenience and never a requirement.
6. As a visitor, I want the traveller titles offered in a family room to differ from those in a
   single, so that the form never offers me an answer that cannot be right.

### Developer

7. As a developer, I want one row-editor component behind both chips and cards, so that a fix to
   the modal fixes both presentations.
8. As a developer, I want the async source to be a function the engine calls, so that a stub, a
   route handler and a third-party API are interchangeable without touching the engine.

### Agent working in this repo

9. As an agent, I want every seam named in the ticket with a red-first test requirement, because
   both prior reviews confirmed the same pattern: every red-first seam survived review clean, and
   all twenty confirmed findings lived in code whose tests came after.

## Implementation Decisions

### searchableSelect

The registry combobox in single mode: one input, one focus ring, `Popup` rendered — the corrected
form of what phase 1 accidentally built. Stores a bare `string` over static `options` and
`{value, label}` over an `optionSource`, exactly per the Value contracts. Registered through the
leaf registry (it is a scalar, not an array control). `data-theme` stamped on the portalled
content, as everywhere.

Visual bar: pixel-identical to the shadcn docs Basic example; screenshot on the ticket before it
closes.

### Async OptionSource

```ts
type OptionSource = (query: string, signal: AbortSignal) => Promise<Option[]>
```

- `optionSource` and `options` are mutually exclusive on a field; the schema of what is *stored*
  does not change — the source only supplies choices.
- A new request aborts the previous one. Results replace the list; **current selections are
  merged in** so a chip or a chosen value never vanishes because the query moved on — Base UI's
  own async-multiple pattern.
- `Combobox.Status` announces loading and errors politely. An error state renders as a status
  line, not an empty list: "No results" and "Couldn't load results" are different sentences.
- The demo source is a stub with an artificial delay — the engine must not care where options
  come from, and demo failures must attribute to the engine, not to data fetching.
- Debounce is the source's concern, not the engine's: the engine calls on input change with an
  abort signal; a source that wants throttling wraps itself.

### cardArray

The same rows, the same seams, a different reading. `cardArray` is an array control exactly like
`combobox` — `object[]` rows, `useFieldArray`, the shared `RowEditorDialog` — with Cards where
chips were and an Add button where the type-to-add input was. No picker input, no option list:
rows are added via the Add button (template row) or the existing `picker`.

`CardDisplayConfig` grows the rest of its surface, shared by both array controls:

```ts
interface CardDisplayConfig {
  title?: string | string[]
  modalTitle?: string | string[]
  description?: (string | { field?: string; text?: string; showWhen?: Condition })[]
  chips?: { field: string; label?: string }[]
  icon?: LucideIconName
  avatar?: { from: string[]; fallbackPrefix?: string }
  hideHeader?: boolean
  addable?: boolean
  removable?: boolean
  showCompletionStatus?: boolean
}
```

- Card anatomy is shadcn `Card` — header (title, chips, avatar initials), description lines,
  incomplete badge. The card is a button (`aria-haspopup="dialog"`); the whole surface opens the
  editor, matching the chip-label pattern.
- A `description` entry with `showWhen` evaluates against **that row**, with the same
  `evaluateConditions` scoping as everything else — no new condition machinery.
- Option-valued fields in summaries resolve display labels through `field.options`, the #30
  lesson; raw stored values never render on a card.
- `variant` from Kallax's config is **not carried**: cards are `Card` with semantic tokens, and a
  per-card visual variant is a design decision the DS has not made. If a real form needs one, it
  arrives with a contract row and a Section-token story, not a prop.

Visual bar: the card reads as a shadcn Card next to the docs page; no docs example exists for the
composed summary, so the bar is registry-primitives-and-semantic-tokens only, screenshot on
ticket.

### Pointer drag

- The grip renders on chips and cards when `draggable: true` — the flag stops being inert, and
  the doc note saying so is removed in the same change.
- Drag is pointer-only sugar over `useFieldArray.move`: the drop commits a `move`, the payload
  order is the row order, and an `aria-live` region announces "Room 2 moved to position 1" —
  the same announcement path the keyboard buttons already use.
- Keyboard reorder (modal footer, fieldArray arrows) is untouched. If drag and a11y ever
  conflict, drag loses.
- Implementation is native pointer events on the grip, not a drag library: the list is flat,
  same-container, single-axis. A library earns its place when someone asks for cross-container
  drag, which nothing in the backlog does.

### Per-row option sources

```ts
optionsFrom?: { field: string; map: Record<string, Option[]> }
```

- Declared on a row field; `field` names a sibling in the same row (row-scoped resolution, like
  conditions); the sibling's current value selects the option list from `map`.
- JSON-serializable — no functions, no signals — so it round-trips Payload (ADR-0002) and stays
  CMS-expressible in principle.
- When the keying value has no entry, the field offers no options and renders its empty state;
  when the keying value *changes*, a stored value that is no longer offered is reported through
  the same stale-value path `hiddenValues` uses — never silently kept, never silently deleted:
  the field shows its stored value as invalid until the visitor re-picks.
- Async per-row sources are **out of scope** — the combination multiplies request surface by row
  count and nothing in any backlog needs it. `optionsFrom` is static maps only.

### Demo

`/demo/form` grows one field per capability, inside the existing shapes:

- a `searchableSelect` destination over a static list, and one over the stub async source
- rooms' `travellers` gain a `title` select whose `optionsFrom` keys on the room's `board` (or a
  dedicated keying field if that reads contrived — if it *is* contrived, say so on the ticket:
  that is evidence, not decoration)
- `partyRooms` renders as `cardArray` — same config family, second presentation, and the two
  array controls visibly share one editor
- `draggable: true` now shows grips; a drag reorders and the submitted order proves it

### Modules

- `src/components/ds/form/fields/searchable-select.tsx` — new, leaf registry
- `src/components/ds/form/fields/combobox.tsx` + `config-form.tsx` — async source, drag, cardArray
  control (or a sibling `card-array` control sharing the array plumbing — implementer's call, one
  editor either way)
- `src/components/ds/form/row-editor-dialog.tsx` — untouched by intent; a change here needs a
  reason written down
- `src/lib/forms/types.ts` — `optionSource`, `optionsFrom`, `cardDisplay` growth, `cardArray` in
  `FIELD_TYPES`
- `src/lib/forms/schema-builder.ts` / `submitted-values.ts` — `cardArray` joins the
  `fieldArray`/`combobox` branches (same `object[]` treatment as combobox)
- `src/app/(frontend)/demo/form/` — the four demo additions; stub option route
- `tests/int/*`, `tests/e2e/form-engine.e2e.spec.ts` — per Testing Decisions

### Documentation owed, before components (hard rule 11)

`03-forms.md`: `cardArray` value-contract row (`object[]`, same as combobox), `optionsFrom`
config contract, the async merge-selections rule, and deletion of the "draggable is inert" note
in the same change that makes it true.

## Testing Decisions

Red-first at every named seam — not as virtue, as the twice-measured difference between clean
review and twenty findings:

- **Seams (vitest, red first)**: `cardArray` rows through schema / `submittedValues` /
  `hiddenValues`; `optionsFrom` resolution incl. missing-key and changed-key staleness; async
  merge-selections as a pure function if extracted, otherwise browser-only.
- **Browser (Playwright, payload on the wire)**: async loads, announces, aborts (slow-stub race:
  type twice fast, first response must not clobber), selections survive a query change;
  searchableSelect submits bare string static / `{value,label}` async; card click opens the shared
  editor and a live edit survives; drag reorder changes payload order and announces; per-row
  options isolate between rows; stale per-row value surfaces as invalid rather than submitting.
- **Visuals**: screenshots per new control on their tickets; searchableSelect against the docs
  Basic example, cards against Card anatomy.
- **Definition of done**: everything above on `main`, CI green — the same gate as every phase.

## Out of Scope

- **Phase 3** — wizard anchor (`fieldset`/`accordion`/`step`, per-step `trigger` validation,
  error summaries, `onBeforeNext`, resumption), then the per-component sweep behind per-family
  foundations tickets: trivial nine (`password`, `hidden`, `switch`, `paragraph`, `alert`,
  `slug`, `price`, `multiSelect`, `color`), option cards three (+`radio-group`), dates two
  (+`calendar`, `react-day-picker`/`date-fns`), numeric three (+`slider`), then one batched CMS
  allowlist ticket. Two contracts deliberately open for their foundations tickets: `price`
  (recommended: integer minor units) and `numberPickerTable` (recommended:
  `Record<optionValue, number>`).
- **Phase 4** — the `FormProps` surface: layout grid + `colSpan` (doc 03's unbuilt Layout
  section, `responsiveVars` technique), `debug` panel (**masks `password` fields**), autosave
  `onPatch` via `dirtyFields` + save status, `readonly` forms, named actions (ADR-0005) +
  `actionButton`, `prefillFromQuery`, and the chrome moved out of this phase.
- **Phase 5** — demo completeness as the engine's acceptance test: every built type rendered on
  `/demo/form`, every type wire-asserted, final screenshot set.
- **Deferred lane** — `file` (#20), `address` (async + a geocoding decision), `definitionList` /
  `aside` (on demand), `aiPopulate` / `layerCombobox` (out / Layers track). Async `optionsFrom`.

---

## Appendix — grilling record, 2026-08-08 (roadmap session)

### Stocktake at time of writing

10 of 39 Kallax field types built (`text` `email` `tel` `textarea` `select` `checkbox` `number`
`fieldArray` `combobox` `submit`) — the load-bearing ten: engine, conditions grid, `object[]`
rows, shared row editor, first green CI. Kallax's `form/` is 40+ component dirs; ours reaches
parity-that-matters through phases 2–5 with six types deliberately outside (see Deferred lane).
Key asymmetry in our favour: most remaining primitives are registry installs, not builds.

### Decisions

| # | Decision | Note |
|---|---|---|
| 1 | Phase 2 = arrays only; wizard resumption moved out | chrome also moved (see 6) |
| 2 | Wizard anchors phase 3 | it is why ADR-0001 chose react-hook-form |
| 3 | Sweep is ticket-per-component behind per-family foundations tickets | foundations = contract rows + registry install, so `calendar`/`radio-group`/`slider` land deliberately |
| 4 | `multiSelect` gets built: flat type, bare `string[]`, CMS-eligible | registry combobox `multiple`, no rows, no modal |
| 5 | Dropped list stands with two rescues | `prefillFromQuery` → resolver chain (P4); `actionButton` → named-actions ticket (P4) |
| 6 | Chrome (`message`/`confirmedLabel`/`actions`/`keyboardShortcuts`) → phase 4 | P4 owns the whole `FormProps` audit; supersedes 1.5's Out of Scope sketch |
| 7 | `color` swept into the trivial tranche | was omitted from the first tranche table — an error, corrected |
| 8 | Phase 5 added: demo completeness + full wire-assertion matrix | makes "fully featured" demonstrated, not claimed |
| 9 | Strict gates between all phases; each spec written after the previous lands | twice-proven (1.5's spec was better for being written after phase 1's wreckage) |
| 10 | Visual bar is a ticket template | docs-example-identical where one exists; registry-primitives-and-tokens where none does; screenshot on ticket, judged by eye |
| 11 | `debug` masks `password` | pinned now, not found later |
| 12 | CMS allowlist grows in one batched ticket at end of phase 3 | flat newcomers evaluated once |
| 13 | Registry installs: review the diff, revert quote churn, keep real updates | observed live when `shadcn add combobox` restyled `button`/`input` |

### Facts established

- Layout is **not built**: the form body is single-column `flex flex-col`; `colSpan` exists only
  in the section system (`column.tsx:8`, the `responsiveVars` technique doc 03 says to reuse);
  Kallax's `form-grid` is a real CSS grid. Phase 4.
- The wizard was scoped nowhere before this session, while doc 03 fully specs its semantics.
- `ui/` inventory at time of writing: no `radio-group`, no `calendar`, no `slider`, no standalone
  `switch`; `accordion`, `toggle-group`, `input-group` present.
- Value contracts missing rows for exactly two types: `price`, `numberPickerTable`.
- Review pattern, twice measured: red-first seams survived both reviews clean; all twenty
  confirmed findings were in code tested after the fact or never run.

### Leftovers after phase 3 (recorded answer)

Blocked: `file` (#20), `address` (geocode decision). On demand: `definitionList`, `aside`. Out:
`aiPopulate` (a value source, not a field), `layerCombobox` (needs the Layers system, ADR-0003
track — a different line of work). `color` was in this list and was swept in instead.

### Rejected

- Wizard in phase 2 — the same growth that forced 1.5 out of phase 1.
- One ticket per tranche (recommended, declined) — user chose per-component grain; the
  shared-primitive ordering cost is paid by foundations blocker tickets instead.
- Mega-ticket sweep — the long-branch failure mode the gates exist to prevent.
- Dropping `multiSelect` in favour of field-less combobox — every tag question would pay the
  `object[]` shape and the CMS could never offer multi-pick.
- True 39/39 parity — `layerCombobox` would make phase 3 inherit the Layers system.
- Overlapping the trivial sweep with phase 2 — merge traffic into the same demo and engine files.
- A drag library — flat, same-container, single-axis; pointer events suffice.
- Kallax's `cardDisplay.variant` — a per-card visual variant is a DS decision no one has made.

### Open questions carried to later specs

- P3 foundations: `price` and `numberPickerTable` contracts (recommendations recorded above).
- P3 wizard: does `stepAlert`-style imperative messaging survive, or does the error-summary
  pattern cover it?
- P4 autosave: transport is a Server Function per hard rule 2 — patch granularity and failure
  UX to be specced against a real consumer.
- P5: whether the screenshot set becomes a lightweight visual-regression harness (#8 built one
  for fixtures) or stays a by-eye gallery.
