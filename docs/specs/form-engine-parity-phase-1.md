# Form engine parity, phase 1 — conditions, combobox, and input purpose

## Problem Statement

The form engine can express nine field types and roughly 600 lines of behaviour. The old Qwik
system it is meant to replace expresses thirty-nine across 11,115 lines. That gap is not evenly
distributed, and three parts of it block real work rather than merely trailing it.

**A form cannot ask a question whose answer comes from a server.** Every option in every form is a
static array baked into the config. A room type, a destination, a product — anything whose list
lives in a database or an API — cannot be offered at all. This is the single largest category of
real form the engine cannot serve, and it is not a missing component: `combobox` is named in the
`FieldType` union in `03-forms.md` and has never been built.

**Conditions are half a system.** `showWhen` and `requiredWhen` exist; `enableWhen` is documented
as NOT BUILT. The two operators — `equals` and `notEmpty` — cannot express "is not", so any
condition needing negation has to be inverted by hand at the config author's end, or expressed as
a second field. There is no way to condition on how many rows an array holds, which matters
precisely because repeating groups are the engine's hardest and most-used structure.

**No form built on this engine can meet WCAG 2.1 AA for personal data.** Success Criterion 1.3.5
(Identify Input Purpose, Level AA) is satisfied by the HTML `autocomplete` attribute, and the
`Field` config has no way to emit one — nor `inputmode`, `enterkeyhint`, or any ARIA escape hatch.
A config-driven engine can only be as accessible as its config allows, and this one currently
forbids the markup the criterion requires. The demo form collects traveller names, so this is a
live failure rather than a latent one.

Underneath all three: **nothing is verified automatically**. The repository has no `.github/`
directory and therefore no CI. Fourteen Playwright specs exist and run only when a human types
`pnpm test:e2e`. The most recent form defect — #31, where picker-seeded array rows rendered their
values and submitted without them — does not reproduce in jsdom and was caught by driving a
browser by hand. Its fix is still unguarded, and this spec changes value shapes in exactly that
area.

## Solution

Three capabilities, built in dependency order, each falsifiable on a route that already exists.

**A complete condition system.** Three effects — `showWhen`, `enableWhen`, `requiredWhen` — over
four operators — `equals`, `not_equals`, `exists`, `count_equals`. The operator names are
Payload's, because conditions are authored in the CMS and stored as JSON, and a form config and a
Payload query should not use two words for the same idea. What reaches the server is decided by
HTML rather than by us: a disabled control is not submitted and does not participate in constraint
validation, so `enableWhen: false` behaves exactly like `showWhen: false` at the payload boundary
and differs only in whether the field is visible. Where a field must be visible, locked, *and*
submitted, that is `readonly` — a different tool, already in the config.

**A combobox that can read a remote source.** Built on Base UI's Combobox, which is already
installed and ships the async path as a designed-for case rather than a workaround. Values stay
bare for static options and become `{value, label}` only when the source is remote, because there
is then no options array from which to resolve a display label. `{value, label}` is Base UI's own
convention, so display and form-submission conversion come free.

**A config that can describe its own accessibility.** `autocomplete`, `inputmode`, `enterkeyhint`
and the ARIA escape hatches become `Field` properties, passed through to the control.

And beneath them, **the verification that should have existed already**: CI, and a browser-driven
regression guard for #31 written before any of this is touched.

## User Stories

### Site visitor

1. As a visitor, I want to search a long list of options by typing, so that I can find my room
   type without scrolling a select with two hundred entries.
2. As a visitor, I want the list to narrow as I type even though it lives on a server, and to be
   told when it is still loading, so that an empty list does not read as "no results".
3. As a visitor using a screen reader, I want my browser's stored details offered for name, email
   and telephone fields, so that I am not retyping information the browser already holds.
4. As a visitor on a phone, I want a numeric keypad for a number and a "next" key that moves me
   through the form, so that filling it in does not require switching keyboards.
5. As a visitor, I want a field that does not apply to me to disappear rather than sit there
   greyed out, and I want what I typed in it not to be sent, so that I am not submitting answers I
   withdrew.
6. As a visitor, I want one broken field not to take down the whole form, so that I can still
   submit the rest.

### Content editor

7. As an editor, I want to author a condition that means "not equal to", so that I can show a
   field for every option except one without listing the other eleven.
8. As an editor, I want to condition a field on whether an array has any rows, so that a summary
   section appears only once the visitor has added a room.

### Developer

9. As a developer, I want a combobox to take its options from a function I supply, so that I can
   back it with a Payload collection, a third-party API, or a stub, without the engine caring
   which.
10. As a developer, I want conditions to use the same operator names as Payload queries, so that I
    am not maintaining a translation layer between the CMS and the config.
11. As a developer, I want the tests to run without me remembering to run them, so that a
    regression is caught by the pull request rather than by a person.

### Agent working in this repo

12. As an agent, I want the condition operators, the value contracts and the accessibility
    properties recorded in `03-forms.md` before the components exist, so that a generated config
    is correct by construction rather than corrected by review.

## Implementation Decisions

### Preconditions — landed before any of the below

**CI.** A workflow on pull requests running `pnpm exec tsc --noEmit`, `pnpm test:int`, and
`pnpm test:e2e`. Needs a Postgres service on port 5433 to match local, and
`pnpm exec playwright install --with-deps`. This is its own ticket, deliberately not part of this
spec's reviewable unit, but sequenced first — a guard nobody runs automatically is decorative, and
fourteen existing specs are currently in that position.

**The #31 regression guard.** A Playwright spec at `tests/e2e/form-engine.e2e.spec.ts` driving
`/demo/form`, which already carries a `fieldArray` with a `picker` (`fields.ts:55` and `:113`).
It asserts that a picker-seeded row submits its seeded values as bare values, that a field hidden
by a condition is absent from the payload, and that a hidden per-row field is absent too.

The guard is verified by **reverting the #31 fix locally and confirming it goes red**. This step
is not optional and is not a formality: two ConfigForm-level tests written during #31 passed with
the fix reverted, because jsdom returns the correct payload either way. A guard that cannot fail
is not a guard, and last time that was discovered only because someone checked.

`/demo/form` stops being a throwaway page at this point and becomes a maintained fixture route.

### Conditions

`Condition` becomes:

```ts
type Condition =
  | { field: string; equals: string }
  | { field: string; not_equals: string }
  | { field: string; exists: boolean }
  | { field: string; count_equals: number }
```

`notEmpty: true` is renamed `exists: true`. The operator names track Payload's query vocabulary
(`equals`, `not_equals`, `exists`) so that a CMS-authored condition and a Payload query read the
same. `count_equals` is the deliberate exception: Payload has no length operator, and Kallax's
`{ field, length: n }` is an exact row-count match with no equivalent to borrow. The name is
invented, the divergence is intentional, and it is recorded here so it is not later "corrected"
back to something that does not exist.

Effects and their payload behaviour:

| Effect | Rendering | In the submitted payload |
|---|---|---|
| `showWhen` false | unmounted | **absent** |
| `enableWhen` false | rendered, `disabled` | **absent** |
| `requiredWhen` true | unchanged | unchanged; schema `superRefine` |
| `readonly` | rendered, not editable | **present** |

The payload rule is not a design choice. Per MDN, disabled form controls are not submitted with
form data and do not participate in constraint validation; `readonly` controls are focusable and
*are* submitted. Deciding otherwise would mean fighting the platform in both directions.

`disableWhen` is not built: it is `enableWhen` with `not_equals`. `validateWhen` is not built:
hidden and disabled fields already skip constraint validation, and `requiredWhen` covers the rest.

One accessibility consequence to write into the field's own documentation: a disabled control is
not focusable, so a keyboard or screen-reader user cannot reach it to discover why it is
unavailable. `enableWhen` is therefore the rarest of the three effects — `showWhen` (remove it) or
`readonly` (show it, locked) are usually the better answer, and the demo should model that.

Conditions inside an array row continue to evaluate against that row, never the form root.

### Combobox

**Superseded by `form-engine-parity-phase-1.5.md`.** What this section specifies is a scalar
type-to-filter select — which is the old system's `searchableSelect`, not its `combobox`. The
phase 1 implementation followed this section, hand-wrote the wrapper against Base UI, and produced
a control with a broken anatomy (no Popup rendered). The 1.5 spec replaces this section wholesale:
`combobox` is the array chip control with a per-row modal editor. The registry-first rule below
stands and is carried into 1.5 verbatim.

**The registry comes first.** Hard rule 4 — check the registry before writing a component, check
for a block before assembling primitives — is now mechanically checkable through the `shadcn` MCP
server registered in `.mcp.json`. Search it, take the registry's combobox into
`src/components/ui/`, and wrap that. `@base-ui/react` is the primitive underneath, not the starting
point: hand-writing a wrapper over Base UI directly would skip the rule rather than satisfy it.

Then, in three independently verifiable steps:

1. **Static options** — behaves as `select` does, stores a bare `string`, adds type-to-filter.
2. **Async options** — `filter={null}` disables internal filtering, `items` receives an
   externally controlled list, `onInputValueChange` supplies the query, and `Combobox.Status`
   announces loading politely (the part exists precisely for "the status of an asynchronously
   loaded list"). Previous requests abort when a new one starts. Stores `{value, label}`.
3. **Inside an array row** — the same component under a row path prefix.

`{value, label}` is Base UI's documented shape: given that shape, `itemToStringLabel` resolves the
display string and form submission resolves the value with no props supplied.
`isItemEqualToValue` handles identity for object values, which retires Kallax's `optionIdField`.

Option grouping arrives with this component — `Option` gains a grouping affordance mapped onto
Base UI's `Group` and `GroupLabel` parts. A remote room list wants headings immediately, and
retro-fitting grouping into an established option shape is worse than shipping it now.

`reselectOptions` semantics carry across, because they are two genuinely different behaviours:
with it off, the option list is a toggle and re-picking an option removes its row; with it on,
re-picking adds another row. Rooms need it on — two Deluxe Twins is a legitimate booking.

`editableOptions: false` maps onto the existing `readonly`, not a new property.

**The popup portals, so it must carry the Section Theme across.** Base UI's Combobox ships
`Portal`, `Positioner` and `Popup` parts, which mount the list on `document.body` — outside the
themed subtree. Per the `design-tokens` skill, a DS control that portals must re-stamp `data-theme`
on its portalled content; `src/components/ds/form/fields.tsx:74-88` is the precedent, where
`Select` reads `useSectionTheme()` and stamps it on `SelectContent`. Without it, a combobox inside
a `brand` Section renders its dropdown in page colours. No test covers portalled theming, so this
is caught by looking or not at all.

The component still decides no colour — it only carries the attribute across the boundary.

### Accessibility and input purpose

`Field` gains, as pass-through properties: `autocomplete`, `inputmode`, `enterkeyhint`,
`ariaLabel`, `ariaDescribedby`, `ariaDescription`, `tabIndex`.

`autocomplete` is the documented technique for WCAG 2.1 SC 1.3.5 (Level AA). Every field in the
demo that collects personal data carries one, so the demo is also the evidence that the criterion
can be met.

`Field` also gains `minLength`, `maxLength` and `step`, which the schema builder maps to the
obvious zod pipes.

### Per-field error boundary

Each leaf renderer is wrapped so that a field which throws renders an inline error in its own slot
rather than unmounting the form. A form that loses one field is degraded; a form that disappears
has lost the visitor's entire session.

### The demo

One route, `/demo/form`. It remains the kitchen sink — one of every field type — and gains a
rooms-and-travellers section inside it: a `fieldArray` of rooms, each with an async `combobox` for
room type, a static `select` for board basis, and a nested `fieldArray` of travellers with
per-row conditions and min/max counts.

The async room source is a **stub**, not a Payload collection. The engine must not care where
options come from, and a stub proves that better than a real collection while keeping the demo's
failures attributable to the engine rather than to data fetching.

All three condition effects appear in the demo with real cases, `enableWhen` included, so that
none of them ships unexercised.

### Modules built or modified

- `src/lib/forms/types.ts` — `Condition` operators; `Field` accessibility and constraint props
- `src/lib/forms/conditions.ts` — operator evaluation; `count_equals`
- `src/lib/forms/schema-builder.ts` — `minLength` / `maxLength` / `step`; `enableWhen` in `superRefine`
- `src/lib/forms/submitted-values.ts` — `enableWhen` in the payload projection
- `src/components/ds/form/config-form.tsx` — `enableWhen` disabled state
- `src/components/ds/form/fields.tsx` — pass-through props; per-field error boundary
- `src/components/ds/form/fields/combobox.tsx` — new
- `src/components/ui/combobox.tsx` — shadcn registry component
- `src/app/(frontend)/demo/form/` — rooms and travellers; stub option route
- `tests/e2e/form-engine.e2e.spec.ts` — new

Everything under `src/components/**` falls inside the `design-tokens` skill's path gate, so the
skill loads automatically for the combobox and field-surface work. Its rules are not advisory:
`tests/int/section-theme.int.spec.ts` fails the build on a palette-named utility or a literal
colour value in any component file. Treat `pnpm vitest run tests/int/section-theme.int.spec.ts` as
a gate before claiming a component done, not as part of the final sweep.

### Tooling

Two MCP servers registered in `.mcp.json` bear directly on this work:

- **`shadcn`** — registry search. This is how hard rule 4 gets satisfied rather than asserted:
  search before writing a component, and look for a block before assembling primitives.
- **`nextjs-dev`** — live errors, logs and routes off the running dev server, which is the
  "observe the live result" half of hard rule 13. It needs `pnpm dev` up; without it the server is
  simply absent, not broken.

Neither replaces the Playwright assertions. #31 established that this engine's value-shape defects
survive anything short of a real browser driving a real submission — a clean dev-server log is not
evidence that the right payload went over the wire.

### Documentation corrections owed

Two errors introduced into `03-forms.md` and `CLAUDE.md` on 2026-08-07, both to be corrected as
part of this spec:

- The async carve-out was specified as `{key, label}`, copied from Kallax's `SelectionRecord`.
  It becomes `{value, label}`. Inheriting the old system's shape is precisely what ADR-0006
  prohibits, and the error was made in the same edit that added the prohibition.
- The `Condition` type gains `not_equals`, `exists` and `count_equals`, and `enableWhen` moves
  from *NOT BUILT* to built with the payload table above.

Per hard rule 11, both land **before** the components that depend on them.

## Testing Decisions

**The #31 guard is written first and proven by reversion.** Written against current `main`, seen
green, then the fix reverted locally and seen red. Only then does implementation begin.

**Conditions are unit-tested as a grid.** Three effects × four operators, at the
`submittedValues` / `hiddenValues` / schema-builder seams where they are pure functions — twelve
cases plus array-row scoping, in `vitest`. This is the payoff of a complete condition system over
a partial one: the matrix is enumerable.

**The combobox is tested in a browser, not jsdom.** #31 established that this engine's value-shape
defects do not reproduce under jsdom. Async loading, selection, `reselectOptions` duplication, and
the submitted payload shape are Playwright assertions against `/demo/form`.

**Accessibility is asserted, not assumed.** The demo's personal-data fields are checked for
`autocomplete` attributes in the rendered DOM. An attribute that exists in the config but is
dropped on the way to the control satisfies nobody.

**Definition of done for phase 1**, all on `main` with CI green:

- combobox renders, filters, and loads async room types with a status announcement
- a room seeded from the picker submits bare values
- a field hidden by `showWhen` is absent from the payload
- a field disabled by `enableWhen` is absent from the payload
- a `readonly` field is present in the payload
- nested travellers submit correctly with per-row conditions
- personal-data fields carry `autocomplete` attributes
- a throwing field does not unmount the form

## Out of Scope

**Phase 2, which becomes its own spec written after this one lands.** `cardArray` with the full
`cardDisplay` surface (`modalTitle`, `addable`, `removable`, `hideHeader`, `showCompletionStatus`,
`variant`, per-entry `description` items with their own `showWhen`, chips with `theme` and `dot`),
`singularLabel`, drag reorder, per-row option sources, and the form-level chrome (`message`
banner, `confirmedLabel`, `actions: inline | footer`, wizard resumption via `initialStep` /
`initialCompletedSteps` / `stepSubmitMode`, `keyboardShortcuts`).

Per-row option sources are explicitly held back rather than merely deferred: phase 1's gate is
"an async combobox works inside an array row", and per-row option lists are a strictly harder
version of that gate. Building them before the gate is how the gate slips.

**Deliberately dropped, not deferred** — `aiPopulate`, `prefillFromQuery` (a value source handled
by the resolver chain, not a field type), `layerCombobox`, `onCreate`, `disableWhen` and
`validateWhen` (both dissolved by the operator set), the Qwik `*Signal` reactive props (conditions
replace them), `.#.` path templates (superseded by recursive `fields[]` in spec #22), and the
cosmetic residue: `htmlLabel`, `tooltip`, `descriptionHelp`, `futureRequired`, `confetti`, `side`,
`group`, `style`.

**Still deferred by name in `03-forms.md`** — `searchableSelect` (folded into `combobox`),
`numberPickerCards`, `numberPickerTable`, `address`, `file` (blocked on #20), `range`, `color`,
`definitionList`, `aside`, `actionButton`.

**Named field actions.** ADR-0005 records that behaviour in config is a named action, and the form
engine has no binding for it (Kallax's `action`, `append`, `onFieldAction$`). This is a real gap,
it is not in phase 1 or phase 2, and it needs its own ticket.

**`modalLink`.** Deep-linkable row modals are ADR-0003's territory and currently unconnected to
forms. Noted, not scoped.

---

## Appendix — grilling record, 2026-08-07

Retained in full so that phase 2's spec can be written from it without re-deriving the reasoning.
Facts below were verified against source at the time of writing; treat them as leads to re-check
rather than as current truth.

### Verified facts

| | This repo | Kallax (`~/Development/kl1`) |
|---|---|---|
| Form engine | 600 LOC, 3 files, 9 field types | 11,115 LOC, ~45 dirs, 39 field types |
| `array-combobox` | — | 1,414 LOC across 4 files |
| Storybook form | `/demo/form`, kitchen sink | `form-config.ts`, 502 LOC, 31 types, kitchen sink |
| Validation | `mode: 'onSubmit'` | `validateOn: 'change'` (overriding modular-forms' own `'submit'` default) |
| Conditions | `equals`, `notEmpty` | `value`, `length`, `notEmpty` across 5 effect props |
| CI | none — no `.github/` | — |
| Playwright | 14 specs, incl. `forms.e2e.spec.ts` | — |

**Base UI 1.6.0** is already installed with 25 combobox parts. Async is a designed-for path:
`filter={null}`, externally controlled `items`, `onInputValueChange`, and `Combobox.Status`
documented as "for conveying the status of an asynchronously loaded list". Two async examples ship
in the docs (single and multiple). Multi-select is `multiple` plus chip parts. Object values are
supported via `isItemEqualToValue`, and `{value, label}` is the built-in shape. Combobox-in-Dialog
has explicit composition guidance (bind the combobox's `open`/`onOpenChange` to the dialog's so
transient state resets on close), and nested dialogs are first-class in the types (`data-nested`,
`data-nested-dialog-open`, a `--nested-dialogs` depth counter).

**Payload query operators**: `equals`, `not_equals`, `greater_than[_equal]`, `less_than[_equal]`,
`like`, `contains`, `in`, `not_in`, `all`, `exists`, `near`, `within`, `intersects`. No length
operator.

**MDN on `disabled`**: not focusable, not interactive, **not submitted with form data**, does not
participate in constraint validation. `readonly` by contrast is focusable and *is* submitted.

**WCAG 2.1 SC 1.3.5** (Identify Input Purpose, Level AA) is satisfied via HTML `autocomplete`.

**Kallax `reselectOptions`** (`array-combobox-utils.ts:49`): when off, the option list shows
checkboxes and re-picking an option removes its row; when on, re-picking inserts another row.
**Kallax `length` condition** (`form-utils.ts:111`) is exact equality on array length, not a range.
**Kallax `editableOptions: false`** renders the row's selection as static text.

### Decisions taken

| # | Decision | Reasoning |
|---|---|---|
| 1 | Async combobox stores `{value, label}`, not `{key, label}` | Base UI's built-in shape; `itemToStringLabel` and submission conversion are free at that shape. `{key, label}` was inherited from Kallax's `SelectionRecord` in error. |
| 2 | One async field in the demo (room types); everything else static | Gives the carve-out exactly one real consumer. A written-but-unexercised rule is how `{key, label}` got specced in the first place. |
| 3 | Two phases | Phase 1 proves the engine can express the structure; phase 2 changes how rows are presented. |
| 4 | #31 guard is Playwright on `/demo/form`, written first, proven by reversion | The route and picker already exist; the storybook is not a prerequisite. jsdom cannot reproduce the defect. |
| 5 | CI is its own ticket, landed before phase 1 | ~30 lines of YAML; pays off across 14 existing specs, not just this work. |
| 6 | 3 effects × 4 operators, Payload names, HTML payload rule | `disableWhen` is negation-by-prop-proliferation; `not_equals` retires it. The payload question is answered by the platform. |
| 7 | Phase 2 gated on phase 1 merged with CI green | The only thing stopping "sequenced in one spec" becoming one long branch. |
| 8 | One demo route, kitchen sink, rooms/travellers inside it | Single fixture; the #31 guard's target does not move. |
| 9 | Drag reorder, `count_equals`, per-row option sources all in scope | Completeness — the condition grid is only enumerable if it is complete. |
| 10 | All four "missing tiers" in scope | Input purpose + ARIA and structural gaps in phase 1; form chrome and `cardDisplay` depth in phase 2. |
| 11 | Async source is a stub, no Payload | The engine must not care about the source; a stub keeps demo failures attributable to the engine. |
| 12 | Phase 2 becomes its own spec after phase 1 lands | Phase 2 grew larger than phase 1 once the four tiers were added; the gate is the natural seam. |

### Rejected, with reasons

- **`validateOn: 'change'`** (Kallax's setting). Rejected as an accessibility defect: with errors
  wired to `aria-live`, validating from the first keystroke announces a failure the visitor has not
  yet had a chance to avoid. `mode: 'onTouched'` is the settled position — first validation at
  blur, revalidation on change. Note that modular-forms' own default is `'submit'`; Kallax
  overrode it.
- **All five Kallax condition props.** `enableWhen` and `disableWhen` are logical inverses, so both
  set on one field has no defined meaning — a state you would write tests to rule out rather than a
  feature. `validateWhen` overlaps constraint validation that already skips disabled fields.
- **A recursive `{ not: Condition }` wrapper.** More expressive and composes with future `and`/`or`,
  but harder for the CMS to author and for a generated config to get right. Nothing needs nesting.
- **Storybook before the guard.** A new tool and its CI story, to reach a browser Playwright
  already provides.
- **Replacing the kitchen sink with a booking-only demo.** A booking form has no natural surface
  for a colour picker or a date range, and those field types would lose their only rendering
  surface.

### Open questions for phase 2

- Does `cardDisplay`'s `showCompletionStatus` compute incompleteness from the schema, as Kallax
  does, or from a declared field list? Kallax computes it, which stays correct as the schema moves.
- Where do per-row option sources cache? A naive implementation refetches per row per keystroke.
- Does `modalLink` reuse the Layers URL machinery from ADR-0003, or does `cardArray` own its own
  deep-link contract?
- `enableWhen` ships in phase 1 but is rare by design. If the demo's use of it feels contrived,
  that is evidence the effect is wrong rather than the demo — worth revisiting rather than
  decorating.
