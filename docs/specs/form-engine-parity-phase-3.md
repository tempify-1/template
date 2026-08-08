# Form engine parity, phase 3 — the wizard, then the sweep

## Problem Statement

The engine now owns the hard shapes — arrays, rows, modals, async sources, per-row options — and
still cannot express the most common structures real forms are made of.

**A long form cannot become steps.** Doc 03 has specced the wizard since the blueprint was
written: per-step validation via `trigger(paths)`, step error summaries, an async `onBeforeNext`
gate. It is the capability ADR-0001 chose react-hook-form *for*, and it exists nowhere. `fieldset`
and `accordion` — the two container types every grouped form wants — are equally unbuilt: the
engine renders flat lists or arrays, nothing in between.

**Fourteen everyday field types are missing.** A form cannot ask for a password, a date, a date
range, a colour, a quantity, a rating on a slider, a multi-pick of tags, or an option presented as
a card instead of a dropdown row. Each is small; collectively they are why the engine still reads
as a demo rather than a toolkit. The cost is bimodal, as it was for blocks (#21): trivial where a
registry primitive exists, real where one must be installed first — and today `ui/` has no
`switch`, no `radio-group`, no `calendar`, no `slider`.

**The CMS allowlist is frozen at seven types** while flat, CMS-safe types queue up behind it.

## Solution

The wizard first, as the phase's anchor. Then a per-component sweep — one ticket per field type —
fanned out behind four small **foundations tickets**, one per family, each doing exactly two
things: writing the family's value-contract rows (hard rule 11) and installing its registry
primitive deliberately rather than as a side effect of whichever component ticket runs first.
One batched CMS-allowlist ticket closes the phase.

Three phase 2 lessons are spec text here, not per-ticket rediscoveries:

- **Browser seams are named per ticket.** All ten phase 2 findings lived in pointer lifecycles,
  Base UI reconcile semantics and mount-time effects — surfaces unit seams cannot reach. Every
  component ticket names its browser seams alongside its schema seams.
- **`resolvedConfig` is inherited, not implemented.** `FieldList` resolves `optionsFrom` before
  any leaf renders, so every new option-bearing control gets per-row options for free. Tickets
  assert it with a test; none may re-implement it.
- **Nothing fetches on mount.** Any future async behaviour inherits the engagement-gating
  pattern from `useOptionSource`. No exceptions.

## User Stories

### Site visitor

1. As a visitor, I want a long enquiry broken into steps with a visible strip of where I am,
   so that forty fields feel like four pages.
2. As a visitor, I want Next to check only the step I just filled, and the summary to tell me
   exactly what is missing in words — never to surface errors from steps I haven't reached.
3. As a visitor, I want to pick dates from a calendar that understands ranges, minimums and
   "today", so that a trip's dates are two taps, not two text fields.
4. As a visitor, I want options that read as cards with icons and descriptions when the choice
   is the point of the page, so that choosing a plan doesn't feel like filling in a tax return.
5. As a visitor, I want quantities as steppers — two adults, one child — not as free-typed
   numbers with validation errors.
6. As a visitor who finished a step, I want a small moment of delight where the form's author
   chose one, and none at all when my system asks for reduced motion.

### Content editor

7. As an editor, I want the flat newcomers — switch, date, multi-pick, option cards, colour —
   available in CMS-authored forms, so that a marketing form can use a toggle without a deploy.

### Developer

8. As a developer, I want containers to group presentation and never paths, so that moving a
   field into a fieldset changes nothing about its name, its conditions or its payload.
9. As a developer, I want resumable wizards — initial step, completed steps, save-per-step —
   so a half-finished application can reopen where it stopped.

### Agent working in this repo

10. As an agent, I want each foundations ticket to hand me settled contract rows and an installed
    primitive, so that a component ticket is a pure build against a written contract.

## Implementation Decisions

### The wizard (`step`), and containers first

**Containers group presentation, never paths.** A field inside a `fieldset`, `accordion` or
`step` keeps its top-level name: no path prefix, no payload nesting, no condition rescoping.
This is the single most important engine decision in the phase, and it has a seam:
`assertConditionTargetsExist`, `buildSchema`, `submittedValues` and `hiddenValues` must all see
*through* containers when collecting field names — a condition targeting a field that moved into
a fieldset must keep working. Red-first tests at that flattening seam before any container
renders.

- **`fieldset`** — `FieldSet`/`FieldLegend` grouping a nested `FieldList` at the same basePath.
- **`accordion`** — `ui/accordion` (already installed) wrapping the same; an accordion section
  with an invalid field inside renders its trigger in the error state and opens on submit-sweep.
- **`step`** — consecutive `step` fields become the wizard, per doc 03's semantics kept whole:
  tab strip with completed ✓ / error ! states, a step clickable iff completed or previously
  reached, `Shift+←/→` ignored while typing, per-step `trigger(paths)` on Next with paths
  collected from the step's subtree, the step error summary in words ("{Label} is required";
  array errors grouped per row), `onBeforeNext(stepIndex, values)` async gate with a Saving state,
  whole-form submit failure sweeping all steps and jumping to the first invalid, completed steps
  readonly in save-per-step mode. Resumption ships with it: `initialStep`,
  `initialCompletedSteps`, `stepSubmitMode`.
- **`stepAlert` is cut** (this phase's grilling): its one real use — a host reporting a per-step
  save failure — is `onBeforeNext` returning false plus the summary saying why; phase 4's
  `message` banner is the form-level channel. Recorded so it is not rediscovered as a gap.
- **Confetti ships** exactly as doc 03 has it: opt-in per step, `canvas-confetti`, and nothing
  fires under `prefers-reduced-motion` — the reduced-motion visitor gets the final state, never
  a hidden flash. This is a deliberate keep, not residue: it is the Kallax delight that made
  wizards feel finished, at near-zero risk.

Wizard browser seams to name in its ticket: focus placement when a step swaps (first field vs
tab), `trigger` racing a fast double-click on Next, and the tab strip under portalled dialogs
opened from inside a step.

### The four families, foundations first

Every foundations ticket: contract rows into 03-forms, registry install with the diff reviewed
(quote churn reverted, real updates kept — the standing rule from phase 1.5), and nothing else.
Component tickets are blocked by their family's foundations ticket and by nothing else, so the
sweep fans out.

**Trivial nine** — foundations installs `switch`; rows for:

- `password` → `string`; never echoed by any summary, and phase 4's debug panel masks it
- `hidden` → `string`; renders nothing, submits per visibility rules like any field
- `switch` → `boolean`, exactly as `checkbox`
- `paragraph`, `alert` → no value; static content in the flow, `alert` on semantic tokens only
- `slug` → `string`; derive-from (`slugFrom`), lock, regenerate — the input-group pattern
- `price` → **contract decided by this foundations ticket**, recommendation binding unless
  refuted on the ticket: integer minor units (`4999`), currency display-only from config —
  no floats near money; the step-modulo float bug was the warning shot
- `multiSelect` → `string[]`; the registry combobox in `multiple` mode with chips, **no row
  fields, no modal** — a different type from `combobox`, flat and CMS-eligible by design
- `color` → `string`; native colour input, swept in by decision after being caught missing
  from the tranche table

**Option cards three** — foundations installs `radio-group`; rows: `radioCards`/`radioTabs` →
`string`, `checkboxCards` → `string[]`. Cards render option `description`/`icon` through the
existing `Option` shape; `radioTabs` is the same semantics in a `toggle-group` reading. Browser
seams: roving focus/arrow-key behaviour inside a group, and reconcile behaviour when
`optionsFrom` swaps the option list under a checked value — the Select null-reconcile lesson,
re-checked per primitive.

**Dates two** — foundations installs `calendar` (accepting `react-day-picker` + `date-fns` as
real dependencies); rows already exist (`"yyyy-MM-dd"`; `dateRange` → `{ start, end }` of the
same, no fake-Z timestamps) and the foundations ticket confirms rather than invents them.
`minDate`/`maxDate` accept `Date | "today"`. Browser seams: the popover calendar is portalled —
`data-theme` re-stamped, verified by looking; keyboard month navigation; typing versus picking.

**Numeric three** — foundations installs `slider`; rows: `range` → `number`;
`numberPickerTable` → **decided by this foundations ticket**, recommendation binding unless
refuted: `Record<optionValue, number>` (`{ standard: 2, deluxe: 1 }`); `numberPickerCards` →
same record shape, cards presentation. The pickers are the sweep's only real builds — quantity
steppers over option metadata — and their tickets carry the largest browser-seam lists
(rapid-click stepping, min/max clamping at the control, the table under overflow scroll).

### CMS allowlist, batched

One ticket at the end: evaluate the flat newcomers — `switch`, `date`, `multiSelect`,
`radioCards`, `radioTabs`, `checkboxCards`, `color`, `range` — against `CMS_FIELD_TYPES` once,
extend `cmsFieldSchema` and the mapper for those admitted, and record on the ticket any that
stay out and why (`password` stays out; a CMS-authored password field is a phishing kit).

### Demo and ordering

Every component ticket adds its demo consumer to `/demo/form` and asserts its payload on the
wire, as phase 2 did — no trailing demo ticket; phase 5 remains the completeness sweep. The
wizard's demo consumer wraps the existing kitchen sink into steps, which exercises the
containers-don't-change-paths rule against every already-tested payload assertion at once: if
stepping the demo changes a single existing e2e payload, the container rule is broken.

Ordering inside the phase: containers → wizard as the anchor; the four foundations tickets fan
out in parallel behind it; component tickets behind their foundations. The CMS batch closes.

### Modules

- `src/lib/forms/types.ts` — the FieldType additions per family; `slugFrom`, `step` config
- `src/lib/forms/schema-builder.ts` / `conditions.ts` / `submitted-values.ts` — container
  flattening seam; new leaf schemas per contract rows
- `src/components/ds/form/config-form.tsx` — container rendering; wizard machinery
  (`form-steps` equivalent); step summary
- `src/components/ds/form/fields/` — one file per new leaf control
- `src/components/ui/` — `switch`, `radio-group`, `calendar`, `slider` via registry
- `src/lib/forms/cms-form-schema.ts` + `map-cms-form.ts` — the batched allowlist growth
- `src/app/(frontend)/demo/form/` — per-ticket consumers; the stepped kitchen sink

## Testing Decisions

Red-first at named seams, schema *and* browser, per ticket:

- **Container flattening** (vitest): conditions, schema, `submittedValues`, `hiddenValues` all
  see through `fieldset`/`accordion`/`step`; a field moved into a container keeps identical
  payload and condition behaviour — asserted by moving a field in an existing fixture and
  diffing nothing.
- **Wizard** (Playwright): Next validates only the current step's paths; the summary names
  fields in words; `onBeforeNext` false blocks with Saving state shown; submit-sweep jumps to
  first invalid step; resumption opens at `initialStep` with completed steps readonly in
  save-per-step mode; reduced-motion emulation shows no confetti.
- **Per family**: each control submits its contracted shape on the wire; each option-bearing
  control proves `optionsFrom` inheritance with one keyed case; each portalled surface is
  eyeballed for theme carry; visual-bar screenshots per the standing template (docs-example
  pixel-identical where one exists — switch, radio-group, calendar, slider all have one;
  registry-primitives-and-tokens for the pickers and wizard chrome).
- **Definition of done per ticket**: on `main`, CI green. Phase gate to phase 4: every ticket
  closed, CI green, and the stepped demo submitting the same payloads it did flat.

## Out of Scope

- **Phase 4** — the `FormProps` surface: layout grid + `colSpan`, `debug` (masking `password`),
  autosave + save status, `readonly` forms, named actions + `actionButton`, `prefillFromQuery`,
  `message`/`confirmedLabel`/`actions`/`keyboardShortcuts` chrome.
- **Phase 5** — demo completeness: every type rendered, wire-asserted, screenshotted.
- **Deferred lane, unchanged** — `file` (#20), `address` (async + geocoding decision),
  `definitionList`/`aside` (on demand), `aiPopulate`/`layerCombobox` (out / Layers track),
  async `optionsFrom`.

---

## Appendix — grilling record, 2026-08-08 (phase 3 session)

Deliberately short: the roadmap session (recorded in the phase 2 spec's appendix) settled this
phase's shape; this session closed the two questions that remained.

### Decisions

| # | Decision |
|---|---|
| 1 | `stepAlert` cut — `onBeforeNext` + step summary cover it; phase 4's banner is the form-level channel. Confetti ships opt-in with reduced-motion bail, a deliberate keep |
| 2 | `price` and `numberPickerTable`/`numberPickerCards` contracts delegated to their owning foundations tickets, recommendations binding unless refuted on the record: integer minor units; `Record<optionValue, number>` |

### Phase 2 lessons promoted to spec text

- Ten of ten phase 2 findings were browser-lifecycle defects (pointer events, Base UI reconcile,
  mount effects); zero were in red-first schema seams — the third consecutive phase with that
  split. Hence: browser seams named per ticket.
- `resolvedConfig` hands `optionsFrom` to every leaf; the Select null-reconcile lesson
  (an orphaned controlled value must not be silently destroyed by the primitive) is re-checked
  per new primitive, since each reconciles differently.
- Engagement gating is the standing pattern for anything async.
- An empty findings list is only as good as its provenance — the first phase 2 review returned
  zero findings because its finders had died on a spend limit.

### Carried, not re-argued

Wizard anchors; ticket-per-component behind foundations; trivial nine incl. `multiSelect` and
`color`; option cards; dates; numeric; CMS batch last; visual-bar template; strict gate to
phase 4; deferred lane unchanged.
