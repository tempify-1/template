# 03 — Config-Driven Forms (react-hook-form + zod + shadcn fields)

The second big addition on top of shadcn: forms defined as a `Field[]` config array and rendered
by an engine, instead of hand-written per-form JSX. shadcn provides the field *visuals*
(Input, Select, Checkbox, RadioGroup, Calendar, Combobox…); **react-hook-form** provides the form
state; **zod** provides validation, wired in via `@hookform/resolvers/zod`; the engine
wires them together. See [ADR-0001](../../adr/0001-react-hook-form-zod-for-forms.md) for why
this is react-hook-form and not Formisch.

Why config-driven: one engine to maintain, CMS-definable forms, and Claude generates a typed
config (reliable) instead of form JSX (error-prone). This was the most-used part of the old
system; the *semantics* below are proven — the implementation is new.

## The `Field` config

Start minimal; grow only when a real form needs it. Core shape:

```ts
type FieldType =
  | "text" | "email" | "password" | "tel" | "textarea" | "number" | "price" | "color" | "hidden" | "slug"
  | "checkbox" | "switch"
  | "date" | "dateRange"
  | "select" | "combobox" | "multiSelect"
  | "radioCards" | "checkboxCards" | "radioTabs"
  | "fieldArray" | "cardArray"
  | "fieldset" | "accordion" | "step"
  | "paragraph" | "alert" | "submit";
// Amended: three capabilities the old system had are absent from this union and from doc 06.
//   layerCombobox — pick-or-create a related record by opening a Layer. Doc 04 lists
//     "create related record flows from form fields" as a Layers consumer, so this omission is a
//     cross-doc contradiction, not a scoping choice.
//   URL query prefill (~110 lines, getQueryPrefillValues) and AI populate (buildAiSchema /
//     buildAiSystemPrompt + ai-populate-field) are not field types at all — they are value
//     sources, and are handled by the resolver chain (decision 13) rather than the registry.
//
// Deferred by decision — the old system has 39 field types, this union has 25, and the balance is
// listed here so each one is a choice on the record rather than a gap someone rediscovers:
//   searchableSelect — the scalar type-to-filter select (one value, bare string). Scoped to
//     phase 2; the control phase 1 shipped under the name `combobox` was actually this, mis-named.
//     `combobox` is the array chip control — see spec form-engine-parity-phase-1.5.
//   numberPickerCards / numberPickerTable — quantity steppers. Wanted; needs a value contract row
//     first (hard rule 11) because the table variant is a matrix of counts, not a scalar.
//   address — geocode search plus subfields. A composite over an async combobox, so it is blocked
//     on that, not on itself.
//   file — blocked on the storage adapter decision (#20), not on the form engine.
//   range, color, definitionList, aside, actionButton — no form in the backlog needs them. Add on
//     demand, with a contract row, never speculatively.
// Not a field type but a real gap: ADR-0005 records that behaviour in config is a named action,
//   and the engine has no binding for one (the old system's `action` / `append` / `onFieldAction`).
//   Not in the parity spec; needs its own ticket.
// Doc 06's composite-fields row mentions several of these; that row is an inventory of intent, and
// this union is the contract. Where they disagree, this union wins.

interface Option {
  label: string;
  value: string;
  description?: string;
  icon?: LucideIconName;        // string names, resolved via a lookup map
  image?: { src: string; alt: string };
  badge?: { label: string };
  disabled?: boolean;
  group?: string;               // heading this option sits under; maps onto Base UI's
                                // Combobox.Group / Combobox.GroupLabel parts. Options sharing a
                                // group render together under one heading, in first-seen order.
}

interface Field {
  name: string;                  // dot-path. Inside an array item template it is the bare leaf
                                 // name, resolved against the row's path prefix — there is no "#"
                                 // segment (superseded by spec #22; see Value contracts).
                                 // Dot-strings all the way through: JSON-serializable for Payload
                                 // (ADR-0002) and consumed natively by react-hook-form's
                                 // FieldPath. No conversion layer.
  type: FieldType;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;            // presentational (the *); enforcement is the schema
  requiredMessage?: string;
  disabled?: boolean;
  readonly?: boolean;            // visible, not editable, and PRESENT in the payload — the tool
                                 // for "locked but submitted". Contrast enableWhen below.
  options?: Option[];
  optionSource?: OptionSource;   // async options; mutually exclusive with `options`
  fields?: Field[];              // containers + array item template
  min?: number; max?: number;    // numbers, array counts
  minLength?: number; maxLength?: number;   // strings
  step?: number;                 // numeric granularity (not the wizard `step` type)
  minDate?: Date | "today"; maxDate?: Date | "today";
  colSpan?: Responsive<number>;
  validate?: ZodSchema;      // per-field schema fragment, merged into the form schema
  showWhen?: Condition;          // unmounts when false
  enableWhen?: Condition;        // rendered but `disabled` when false
  requiredWhen?: Condition;
  reselectOptions?: boolean;     // array-backed combobox: when true, re-picking an option adds
                                 // another row (two Deluxe Twins); when false/absent the option
                                 // list is a toggle and re-picking removes that row
  cardDisplay?: CardDisplay;     // cardArray summary config (title/description/chips/avatar)
  step?: StepConfig;             // wizard chrome for type: "step"

  // Accessibility and input purpose — pass-through to the control.
  // `autocomplete` is how WCAG 2.1 SC 1.3.5 (Identify Input Purpose, Level AA) is satisfied; a
  // config-driven engine can only be as accessible as its config allows, so every field
  // collecting personal data carries one.
  autocomplete?: string;         // "given-name", "email", "tel", "address-line1"…
  inputmode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  enterkeyhint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
  ariaLabel?: string;
  ariaDescribedby?: string;
  ariaDescription?: string;
  tabIndex?: number;
}

type Condition =
  | { field: string; equals: string }       // equality (array fields: membership)
  | { field: string; not_equals: string }
  | { field: string; exists: boolean }      // non-empty; for arrays, "has any rows"
  | { field: string; count_equals: number }; // exact array row count
// Operator names track Payload's query vocabulary (`equals`, `not_equals`, `exists`) because
// conditions are CMS-authored and stored as JSON — a form config and a Payload query should not
// use two words for the same idea. `count_equals` is the deliberate exception: Payload has no
// length operator, so the name is invented. That divergence is intentional; do not "correct" it
// to an operator Payload does not have.
// The equality key is `equals`, not `value`. `src/lib/forms/types.ts` is the built contract.

// An async option source. Returns options for a query; the engine supplies the query from the
// combobox input and aborts a previous call when a new one starts. Debounce is the source's
// concern, not the engine's.
type OptionSource = (query: string, signal: AbortSignal) => Promise<Option[]>;

// Per-row options: a row field may take its options from a static map keyed by a sibling field's
// current value. `field` resolves against the same row (row-scoped, like conditions). JSON only —
// no functions (ADR-0002); async per-row sources are deliberately unsupported. A missing key
// offers no options; a key change that orphans a stored value surfaces that value as invalid —
// never silently kept, never silently deleted.
interface OptionsFrom {
  field: string;
  map: Record<string, Option[]>;
}
```

## Engine architecture (three small pieces)

**1. Field registry** — `Record<FieldType, { component, defaultValue, isContainer?, isArray? }>`.
Renderers dispatch through it; new field types are registered, never switch-cased. Each leaf
renderer is a client component wrapping the shadcn primitive with shadcn's current **Field**
anatomy (the Base UI-era `Field` component set — label/description/error slots), bound to
react-hook-form via `useController` (or `register` for uncontrolled inputs). Also use the newer
shadcn primitives where they fit: Input Group
(prefix/suffix adornments for price/slug fields), Button Group (wizard nav), Native Select,
Spinner (saving states), Empty (empty array states).

Every leaf renderer is wrapped in a **per-field error boundary**. A field that throws renders an
inline error in its own slot; the rest of the form keeps working. A form that loses one field is
degraded, a form that unmounts has lost the visitor's whole session, and the difference costs one
boundary component.

**2. Schema builder** — `buildSchema(fields: Field[]): ZodSchema`. Walks the config once and
produces the whole-form zod schema handed to `useForm({ resolver: zodResolver(schema) })`:

- `required` → `z.string().min(1, msg)` etc. per type; `min/max/minLength/maxLength/step/minDate/
  email/url` map to the obvious zod pipes; `field.validate` fragments are merged in.
- **Conditions live at the object level**, where the whole values object is in scope:
  `requiredWhen`/`showWhen`/`enableWhen` become `superRefine` + `ctx.addIssue({ path })` placing
  the issue on the right path. A field hidden by `showWhen` is never required, and neither is one
  disabled by `enableWhen` — per HTML, a disabled control does not participate in constraint
  validation. This replaces the old system's self-evaluating-validator workaround and its
  `shouldActive`/unmounted-field bug class outright — the schema is the single source of truth
  regardless of what's mounted.
- Array types → `z.array(itemSchema)` with min/max count messages.

**3. `FormRenderer`** — walks `Field[]`, evaluates conditions against current values
(one pure `evaluateConditions(field, values, pathPrefix)` used by renderer, schema builder, and
card summaries alike), renders through the registry, recurses into containers. Groups
consecutive `step` fields into a wizard.

```tsx
<ConfigForm
  fields={fields}
  defaultValues={resolvers}   // decision 13: an ordered resolver chain, not a values object
  onSubmit={handler}          // server action
  onPatch={patchHandler}      // optional blur-autosave, per changed leaf path
  readonly={bool}
  debug={bool}
/>
```

## When validation fires

`mode: 'onTouched'`, and leave `reValidateMode` at its default `'onChange'`. A field is validated
first at blur, and from then on it re-validates as the visitor types — so a message that appears
while they are correcting an error updates live, but no message appears before they have finished
their first attempt at a field.

The two neighbouring choices are both worse, and this doc previously specified neither, which is
how the engine ended up on react-hook-form's `'onSubmit'` default by accident rather than by
decision:

- **`'onSubmit'`** (what was built) withholds every error until the submit button, so a long form
  reveals its problems all at once, after the visitor believes they are done.
- **`'onChange'`** (what the old system used — `validateOn: 'change'`, itself an override of
  modular-forms' own `'submit'` default) validates from the first keystroke, so `Enter a valid
  email` is announced while someone is typing the `j` of their address. With errors wired to
  `aria-live`, that is not just noise, it is a screen reader reading a failure the visitor has not
  had a chance to avoid. Matching the old system here would be copying a defect.

Per-step wizard validation is unaffected: `trigger(paths)` on Next is explicit and stays explicit.

## Value contracts — simpler than the old system

**Store plain values wherever the label can be resolved from an options list.** The old system
stored `{key, label}` "SelectionRecord" objects for *every* select-family field, and unwrapping
them was its #1 recurring bug. The rule is not "never objects" — it is that an object is only
warranted when there is no options array to resolve a display label against. Rule:

- select / radioCards / radioTabs → `string` (the option value)
- multiSelect / checkboxCards → `string[]`
- checkbox / switch → `boolean`
- number → `number` (not string — the control coerces at the field boundary and the schema
  validates the result)
- date → `"yyyy-MM-dd"` string; dateRange → `{ start, end }` of the same (no fake-Z timestamps)
- fieldArray / cardArray → `object[]`; each row gets a client-generated `id` (uuid) stored in the
  row for React keys, dialog identity, and reorder stability across server round-trips

  **Amended (spec #22).** Field Arrays store bare objects; react-hook-form owns the row key via
  `useFieldArray`, so values stay bare and there are no identity records. The render-side row key
  is separate from the submitted value. Nested arrays are configured as recursive `fields[]` rather
  than dot-path templates with a `#` segment.
- fieldset / accordion / step → no value (containers)
- combobox → **`object[]`, always** — the combobox is an array chip control (spec 1.5), and
  every row is an object regardless of config: `{ value, label }` from the picked option, merged
  over the row template, plus whatever nested fields the row's `fields` define. One shape, no
  branching in the mapper, schema builder or submission path. `value` is the identity for
  conditions, equality and submission; `label` is display only and never what a condition compares
  against. Row identity for React keys is owned by `useFieldArray`, never stored in the value.
- an async `optionSource` adds no new shape — rows stay `{ value, label, ... }`, with the
  label carried rather than looked up, because a remote source has no `field.options` array to
  resolve against. The scalar `searchableSelect` stores a bare `string` over static options
  and `{ value, label }` over an async source, per the rule above. When a source's results
  replace the list, **current selections are merged in** so a chosen value never vanishes because
  the query moved on; "No results" and "Couldn't load results" are different states and render as
  different status lines, never as an empty list.
- cardArray → `object[]`, the same seam treatment as `combobox` rows — but **no `value`/`label`
  leaves and no reserved row-field names**: cardArray rows are template-born, not option-born, so
  the row schema is the row `fields` alone, exactly as `fieldArray`. Cards are a presentation of
  rows, never a shape.

  **`{ value, label }` is Base UI's own convention, not Kallax's.** (This applies to combobox
  rows and to any future async control alike.) Given that shape,
  `itemToStringLabel` resolves the display string and form submission resolves the value with no
  props supplied; `isItemEqualToValue` handles identity for object values, which is why there is no
  `optionIdField` here. Kallax's `SelectionRecord` was `{ key, label }` — adopting that spelling
  would mean hand-writing both converters on every async combobox to land somewhere strictly worse
  than the library default, and would be inheriting a shape rather than a semantic, which ADR-0006
  prohibits.

Option metadata (label, icon, image) is looked up from `field.options` at render time when a
summary needs it. Conditions compare plain strings — object unwrapping exists in exactly one
place, the async combobox, and nowhere else.

**A repeating group needs no carve-out.** `fieldArray` / `cardArray` rows are already objects, so a
row seeded from a picker or an async combobox simply carries its identity and display fields as
ordinary row keys. Rooms-holding-travellers is expressible today under the bare-value rule; reach
for the carve-out only for a *scalar* async field.

## Availability owns the payload, not react-hook-form's unmount

What reaches the server is decided by HTML, not by us. Per MDN, a `disabled` control is not
submitted with form data and does not participate in constraint validation; a `readonly` control
is focusable and *is* submitted. The three condition effects follow that:

| Effect | Rendering | In the submitted payload |
|---|---|---|
| `showWhen` false | unmounted | **absent** |
| `enableWhen` false | rendered, `disabled` | **absent** |
| `requiredWhen` true | unchanged | unchanged |
| `readonly` | rendered, not editable | **present** |

So "visible, locked, still submitted" is `readonly` — a different tool from `enableWhen`, not a
competing one. And one accessibility consequence worth stating: a disabled control is not
focusable, so a keyboard or screen-reader user cannot reach it to find out *why* it is
unavailable. `enableWhen` is therefore the rarest of the three effects; `showWhen` (remove it) or
`readonly` (show it, locked) are usually the better answer.

A hidden field must not reach the submission, and a value the form seeded must. Those two rules
sound independent and are not: react-hook-form's `shouldUnregister: true` delivered the first as a
side-effect of unmounting, and broke the second in the process.

With the flag on, values written by `useFieldArray`'s `append` never reach form state for anything
registered through a `Controller` — only fields the visitor physically touches are committed. A row
added from a picker therefore rendered its seeded values and submitted without them, so a required
seeded field failed validation while visibly showing an answer. The nested array key survived only
because `useFieldArray` registers its own name. This does not reproduce in jsdom; it needs
hydration in a real browser, which is why the engine's integration tests never saw it.

Turning the flag off fixes seeding and costs the other rule, so both are now explicit:

- **`submittedValues(fields, values)`** projects form state onto the config before submission.
  A field whose condition does not hold is absent from the payload — absent, not empty — and so is
  any key the config does not declare. It walks with the same path helpers as the rest of the
  engine, so a dot-path name stays nested rather than becoming a literal `"address.city"` key.
- **`hiddenValues(fields, values)`** reports the paths that must be reset when a branch collapses,
  and `ConfigForm` clears them. Without this, a hidden field keeps its value, which has two
  consequences the projection cannot reach: a *chained* condition reads the stale value and keeps
  its own field visible and required under a collapsed branch, and re-opening a branch resurrects
  an answer the visitor withdrew.

Both are pure functions tested at their own seam. Conditions inside an array row evaluate against
that row, never the form root, so a sibling row is unaffected.

`submitForm` applies the same projection before writing. That is defence rather than a live path:
no form in the repo declares a condition today — `cmsFieldSchema` has no `showWhen`, so an editor
cannot author one — and zod already strips undeclared keys. It matters the moment conditions become
authorable, because the client projection is not a boundary a caller has to respect.

## Element ids

`ConfigForm` prefixes every control id with a `useId()` value, so `htmlFor` resolves to the
control in *this* form. Field names alone are not unique: a page can carry a contact Section and
a newsletter Section, both with a field named `email`, and duplicate ids silently point every
label at the first match. Controls receive the resolved id as an explicit `controlId` prop rather
than deriving it from `config.name`.

Checkbox fields render `orientation="horizontal"` with the control before a `FieldContent`
wrapper holding label, description and error — the vertical variant applies `*:w-full`, which
stretches a checkbox into a full-width bar.

## Layout

The form body is a grid: `grid-cols-[repeat(auto-fit,minmax(200px,1fr))]`, leaf fields flow
`auto`, containers span full width, `colSpan` overrides per breakpoint via the same inline-var
technique as the section grid. This one convention made the old forms look designed with zero
per-form CSS — keep it.

## Repeatable groups

- **fieldArray**: stacked rows, add/remove, keyboard up/down reorder with an `aria-live` position
  announcement, min/max counts with friendly messages (`At least 1 traveller required`). Built.
  Pointer drag-reorder is additive on top of the keyboard controls, not a replacement for them,
  and lands with `cardArray`.
- **cardArray** — rows render as summary Cards; the whole card is a button
  (`aria-haspopup="dialog"`) opening the same shared row-editor Dialog the combobox uses, with
  prev/next, footer reorder and the incomplete alert. `cardDisplay` is shared by both array
  controls: `title` / `modalTitle` (field name or names, joined), `description` entries — strings
  or `{ field }` / `{ text }`, each optionally carrying a row-scoped `showWhen` — `chips`,
  `icon`, `avatar { from, fallbackPrefix }` (initials from row fields), `hideHeader`, `addable`,
  `removable`, `showCompletionStatus`. Option-valued fields resolve display labels through
  `field.options` in every summary — a raw stored value never renders on a card. Kallax's
  `variant` is deliberately not carried: a per-card visual variant is a DS decision nobody has
  made; if a real form needs one it arrives with a contract row, not a prop.
- **combobox** is the array-backed chip control: rows are appended from a type-to-filter option
  list, each selection renders as a chip (shadcn's chip exactly; the label is the modal trigger,
  `aria-haspopup="dialog"`), and each chip opens a live-editing Dialog holding the row's nested
  `fields` — prev/next between rows, incomplete-fields alert from the schema, footer reorder.
  `reselectOptions` decides whether re-picking an option adds a second row or removes the existing
  one. Config flags carry Kallax's names and opt-out semantics (`editableOptions`, `draggable` —
  off by default here, a recorded divergence — `cardDisplay.addable/removable/showCompletionStatus`,
  `max`, `singularLabel`). See spec form-engine-parity-phase-1.5.
- Item templates are recursive `fields[]` carrying bare leaf names (`firstName`), resolved against
  the row's path prefix — conditions inside a row are sibling-relative and evaluate against that
  row, never the form root. The `#` template segment this doc previously described
  (`travellers.#.firstName`) was superseded by spec #22 and is not implemented.

## Wizard (`step` fields)

Consecutive `step` fields become a multi-step form; a trailing `submit` is absorbed into the
last step's nav. Proven semantics to keep:

- Tab strip with completed ✓ / error ! states; a step is clickable iff completed or previously
  reached. Keyboard: `Shift+←/→` (ignored while typing).
- **Per-step validation** on Next: `trigger(paths)` with that step's leaf paths, collected from
  the step's `Field[]` subtree. It resolves to a boolean and only touches the paths given, so
  later steps' errors are never surfaced early. This capability is why the engine is on
  react-hook-form (ADR-0001). On failure show a **step error summary** (generic "required" errors become "{Label} is required";
  array errors group into one line: "Add traveller information for: First name, DOB
  (travellers 1, 3)").
- `onBeforeNext(stepIndex, values) => Promise<boolean>` async gate for save-per-step flows;
  "Saving…" state while pending; returning false blocks navigation.
- Whole-form submit failure sweeps all steps, marks invalid ones, jumps to the first.
- Optional per-step confetti (`canvas-confetti`, reduced-motion bail).
- Completed steps in save-per-step mode re-render readonly.

## Autosave (`onPatch`)

**Amended (ADR-0001): do not build this.** The snapshot-diffing design below describes ~160 lines
the old system hand-rolled against modular-forms (`syncFormStoreAndLocal`, `useSyncedField`,
`syncDateRangeFormStoreAndLocal`). react-hook-form tracks dirty state natively:
`formState.dirtyFields` is a nested boolean map mirroring the values shape, and
`getFieldState(name)` scopes it to one path. `onPatch` flattens that map to leaf paths with a
small recursive helper (~20 lines) and patches those — no snapshots, no re-baselining.

~~Blur/change diffs a flattened snapshot of values and patches only changed leaf paths
(arrays of objects recurse by index; a structural array change re-baselines the snapshot so
shifted paths aren't re-patched).~~ Save feedback per field (`saving → saved`, auto-clear 2s;
error state with tooltip) via a data-attribute on the field wrapper — avoids re-rendering the
tree per keystroke. `debug` prop renders a values/errors JSON panel.

## Named forms

Marketing forms are code, not CMS content. `src/lib/forms/definitions.ts` holds one
`FormDefinition` per named form — its `Field[]`, submit label, success message, and which field
becomes the stored submission's summary. The Payload block an editor places carries only the form
*name*; the field list never round-trips through the database. That keeps the schema the server
re-validates against identical to the one the browser enforced, and it means an editor cannot add
a field the server action does not expect.

The action re-parses submitted values with `buildSchema(definition.fields)` before writing.
Client-side validation is a convenience; a form post is an anonymous HTTP request and the server
treats it as one. Failure returns a message the visitor sees rather than throwing — a swallowed
error reads to a visitor as a form that does nothing.

Submissions land in the `form-submissions` collection, whose `create` access is `() => false`.
Payload generates a REST/GraphQL endpoint for every collection, so a public `create` rule would
let anyone POST straight to `/api/form-submissions` with an arbitrary `form` name and arbitrary
JSON — the action's zod re-validation would not be a boundary at all, merely the polite path in.
The action therefore writes with `overrideAccess: true`: it is the only writer, and it has
already validated. The `form` field additionally validates against `FORM_NAMES`, so a row can
never name a form that does not exist. It stays a `text` field rather than a `select` because
forms are code — adding one should not require a database migration.

## CMS integration

If forms are CMS-defined (Payload in Kallax): CMS block types map 1:1 onto `FieldType`; a mapper
converts the form document → `Field[]`; validation rule rows (`required`, `minLength`,
`pattern`, …) map to schema-builder inputs. Submissions post to a generic endpoint with
flattened pairs + raw JSON. This all lives in the app/mapper layer, not the DS.
