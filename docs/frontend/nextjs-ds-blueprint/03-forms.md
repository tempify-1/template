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

interface Option {
  label: string;
  value: string;
  description?: string;
  icon?: LucideIconName;        // string names, resolved via a lookup map
  image?: { src: string; alt: string };
  badge?: { label: string };
  disabled?: boolean;
}

interface Field {
  name: string;                  // dot-path; "#" segment inside array item templates.
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
  readonly?: boolean;
  options?: Option[];
  fields?: Field[];              // containers + array item template
  min?: number; max?: number;    // numbers, array counts
  minDate?: Date | "today"; maxDate?: Date | "today";
  colSpan?: Responsive<number>;
  validate?: ZodSchema;      // per-field schema fragment, merged into the form schema
  showWhen?: Condition;          // unmounts when false
  enableWhen?: Condition;        // locked-by-default: disabled unless condition holds
  requiredWhen?: Condition;
  cardDisplay?: CardDisplay;     // cardArray summary config (title/description/chips/avatar)
  step?: StepConfig;             // wizard chrome for type: "step"
}

type Condition =
  | { field: string; value: string }     // equality (array fields: membership)
  | { field: string; notEmpty: true };
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

**2. Schema builder** — `buildSchema(fields: Field[]): ZodSchema`. Walks the config once and
produces the whole-form zod schema handed to `useForm({ resolver: zodResolver(schema) })`:

- `required` → `z.string().min(1, msg)` etc. per type; `min/max/minDate/email/url`
  map to the obvious zod pipes; `field.validate` fragments are merged in.
- **Conditions live at the object level**, where the whole values object is in scope:
  `requiredWhen`/`showWhen` become `superRefine` + `ctx.addIssue({ path })` placing the issue on
  the right path. A field hidden by `showWhen` is never required. This replaces the old system's
  self-evaluating-validator workaround and its `shouldActive`/unmounted-field bug class outright
  — the schema is the single source of truth regardless of what's mounted.
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

## Value contracts — simpler than the old system

**Store plain values.** The old system stored `{key, label}` "SelectionRecord" objects for every
select-family field, and unwrapping them was its #1 recurring bug. New rule:

- select / radioCards / radioTabs → `string` (the option value)
- multiSelect / checkboxCards → `string[]`
- checkbox / switch → `boolean`
- number → `number` (not string — zod coerces at the field boundary)
- date → `"yyyy-MM-dd"` string; dateRange → `{ start, end }` of the same (no fake-Z timestamps)
- fieldArray / cardArray → `object[]`; each row gets a client-generated `id` (uuid) stored in the
  row for React keys, dialog identity, and reorder stability across server round-trips

  **Amended (spec #22).** Field Arrays store bare objects; react-hook-form owns the row key via
  `useFieldArray`, so values stay bare and there are no identity records. The render-side row key
  is separate from the submitted value. Nested arrays are configured as recursive `fields[]` rather
  than dot-path templates with a `#` segment.
- fieldset / accordion / step → no value (containers)

Option metadata (label, icon, image) is looked up from `field.options` at render time when a
summary needs it. Conditions compare plain strings — no `.key` unwrapping anywhere.

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

- **fieldArray**: stacked rows, add/remove, drag-reorder + keyboard up/down with an `aria-live`
  position announcement, min/max counts with friendly messages
  (`At least 1 traveller required`).
- **cardArray**: rows render as summary Cards (`cardDisplay`: title from field(s), description
  lines, chips, avatar initials, incomplete-fields badge computed from the schema); clicking
  opens a shadcn Dialog containing the row's nested `FormRenderer`, with prev/next navigation
  between rows. One `activeItemId` context so a single dialog is open across nested arrays.
- Item templates use `#` in nested names (`travellers.#.firstName`) resolved via a path-prefix
  context — conditions inside a row are sibling-relative.

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
