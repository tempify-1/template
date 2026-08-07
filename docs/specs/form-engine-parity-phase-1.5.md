# Form engine parity, phase 1.5 — the combobox, done properly

## Problem Statement

Phase 1 shipped a combobox that is the wrong control wearing the right name, with an anatomy that
does not render.

**The wrong control.** What landed in `2a979d3` is a scalar type-to-filter select: one value, a
bare string, options narrowed as you type. In the old system's vocabulary that control is
`searchableSelect`. Kallax's `combobox` — the thing the registry maps to `ArrayCombobox` — is an
array control: every selection is a chip, the control is always multiple, each chip opens a modal
that edits that row's nested fields, and `reselectOptions` decides whether re-picking an option
adds a second row or removes the first. The phase 1 spec inherited this confusion and recorded it
backwards ("searchableSelect — folded into combobox"): it took the array control's name and gave
it the scalar control's behaviour.

**The broken anatomy.** The hand-written `src/components/ui/combobox.tsx` aliases
`ComboboxContent` to Base UI's bare `List` and never renders a `Popup`. Base UI's anatomy is
`Portal → Positioner → Popup → List`; the Popup *is* the surface — background, border, shadow,
z-index. Without it the options render as bare text in normal document flow, which is exactly what
the screenshot shows. The field component compounds it: an `<input>` nested inside the `<button>`
trigger (invalid HTML), the placeholder rendered twice side by side, focus rings stacked three
deep, and `ComboboxContent` nested inside itself.

**The root cause is procedural, not technical.** Ticket #36's first instruction was to take the
registry's combobox and wrap it. The component was hand-written against `@base-ui/react` instead.
The registry component ships the Popup with its surface classes correct; the defect class this
produced is precisely the one hard rule 4 exists to prevent.

## Solution

One control, rebuilt: Kallax `ArrayCombobox` semantics on the shadcn registry combobox, with
shadcn's rendering as the default at every point where the two disagree visually.

The first implementation step is destructive and non-negotiable: delete
`src/components/ui/combobox.tsx` and `src/components/ds/form/fields/combobox.tsx`, run
`pnpm dlx shadcn@latest add combobox`, and build on what it installs. Nothing of the phase 1
combobox survives.

The demo restructures to match the control's real model: rooms are not a `fieldArray` containing a
scalar select — rooms **are** the combobox. Each chip is a room; the chip's modal holds the room's
fields, including its nested travellers array.

## User Stories

### Site visitor

1. As a visitor, I want to add three rooms in three clicks — type, Enter, type, Enter — so that
   capturing my party takes seconds, with details to follow.
2. As a visitor, I want to click a room chip and fill in its travellers in a focused dialog, and
   step to the next room without closing it, so that completing four rooms is one pass, not four
   open-edit-close cycles.
3. As a visitor, I want to add the same room type twice when my booking needs two Doubles, so that
   the form matches reality rather than a set.
4. As a visitor, I want a room I haven't finished to say so on its chip, so that I find the gap
   before the submit button does.
5. As a visitor using a keyboard, I want arrows, Enter, Escape and Backspace to behave the way
   every combobox behaves, and I want Enter to never submit the form out from under me.
6. As a visitor using a screen reader, I want the chip list announced as a list, each chip's edit
   affordance announced as opening a dialog, and option selection states announced truthfully.

### Developer

7. As a developer, I want the chip row's modal editor to be a component I can reuse for
   `cardArray` in phase 2, so that the two array presentations share one editing surface.
8. As a developer, I want Kallax configs to port with their flag names and meanings intact, so
   that porting a form is mechanical.

## Implementation Decisions

### The control

`combobox` is an **array control, always multiple**. There is no single-select mode; the scalar
type-to-filter control (`searchableSelect`) is a different, currently unbuilt type.

**Chip.** shadcn's chip exactly — label plus remove ×, same tokens, padding, radius as the docs
page. The label is a button with `aria-haspopup="dialog"` that opens the row modal; this is
Kallax's own arrangement (`array-combobox-item.tsx:311`) and adds nothing to the chip's visual
surface. The drag grip renders only when `draggable: true`.

**Value.** Always `object[]`. Every row is an object regardless of config — `{value, label}` from
the picked option, merged over the row template, plus whatever nested fields the row's `fields`
define. One shape, no branching in the mapper, the schema builder, or the submission path. This is
a deliberate second carve-out from the bare-values rule and is recorded in the value contracts
before this component lands (hard rule 11). Row identity for React keys is owned by
`useFieldArray`, never stored in the value (per #26/#31).

**Seeding.** Picking an option inserts `mergeDeep(rowTemplate, {value, label}, option.data ?? {})`
— the same precedent as the #27 picker. Adding does **not** open the modal: chips accumulate as
fast as the visitor can click, and incompleteness is carried by the chip badge and the schema, not
by a modal ambush.

**Modal.** A shadcn Dialog, live-editing the row: fields bind directly to the row's
react-hook-form paths, so typing in the modal is editing the form and closing it — ×, Done,
backdrop — just stops looking. No Cancel, no draft layer, no dirty prompt. This is the only
semantics under which prev/next between rows works: hopping Room 1 → Room 2 mid-edit cannot ask
"save changes?" per hop. Chrome, all configurable: prev/next header navigation (disabled at the
ends), an incomplete-fields Alert computed from the schema, header chips and description lines
from `cardDisplay`, footer up/down reorder, Done. The row's `fields` mount only while the modal is
open. The editor is factored as a shared component — `cardArray` renders the identical modal in
phase 2 with a card in place of a chip.

**Removal.** × removes the row immediately — no confirmation, no undo, matching both Kallax and
every shadcn chip pattern. Rows that must not be casually deletable set
`cardDisplay.removable: false`. Re-adding is one click; that is the mitigation.

**Dropdown.** shadcn's list: right-aligned `ItemIndicator` check for selected options,
`ComboboxEmpty` for no results, `Group`/`GroupLabel` for `Option.group`. Kallax's behavioural
rules apply on top, both deliberate and both kept:

- In reselect mode, **no selected highlight** — a tonal background reads as toggle state that
  does not exist when clicks always add (`array-combobox-options-list.tsx:79`).
- Limit disabling is asymmetric: toggle mode disables only *unselected* options at `max`, so the
  visitor can still untick; reselect mode disables everything.

**Keyboard.** Base UI's defaults plus `autoHighlight`: arrows navigate, Enter adds the
highlighted (with autoHighlight, the first) match and clears the input, Backspace on an empty
input removes the last chip, Escape closes. One Kallax guarantee is kept explicitly: **Enter
inside the combobox never submits the form.** No hand-wired key handlers — reproducing Kallax's
handlers on top of the primitive would be shape-inheritance (ADR-0006) and would re-own keyboard
accessibility the library has already solved.

**Theming.** The popup portals to `document.body`, outside the themed subtree. `data-theme` is
stamped on the outermost portalled element via `useSectionTheme()`, per the `design-tokens` skill
and the `Select` precedent. No test covers this; it is verified by looking.

### Configuration

Kallax's names, Kallax's opt-out semantics, so a Kallax config ports unchanged in meaning:

| Flag | Home | Default | Effect |
|---|---|---|---|
| `editableOptions` | `field` | on | chip label opens the modal; off renders a plain chip |
| `draggable` | `field` | **off** | grip handle on the chip (divergence — see below) |
| `reselectOptions` | `field` | off | re-pick adds another row; off, re-pick removes that row |
| `max` | `field` | — | count cap; drives the asymmetric option disabling |
| `singularLabel` | `field` | — | "Type to add rooms", "Add traveller", modal titles |
| `cardDisplay.addable` | `cardDisplay` | on | inline input + dropdown render at all |
| `cardDisplay.removable` | `cardDisplay` | on | × on the chip; also gates programmatic removal |
| `cardDisplay.showCompletionStatus` | `cardDisplay` | **off** (opt-in, as Kallax) | incomplete badge on the chip |
| `cardDisplay.chips` / `description` / `title` | `cardDisplay` | — | modal header chips, description lines, title |

The one divergence from Kallax's defaults: `draggable` is off rather than on, so the out-of-the-box
chip is pixel-identical to the docs page. Kallax renders the grip by default; here it is opted
into. Recorded so it reads as a decision, not an accident.

`optionIdField` does not exist: identity is `value`, per the `{value, label}` convention, with
`isItemEqualToValue` for object comparison.

Pulling `cardDisplay` into this phase is deliberate: the modal header and the addable/removable/
completion flags are driven by it, so it stops being phase 2 config. Phase 2 shrinks to
`cardArray`'s card presentation and the form-level chrome.

### The demo

`/demo/form`'s rooms section becomes one `combobox` field:

```
rooms                 ← combobox, options = room types, reselectOptions: true
  (chip = a room; modal holds:)
  board               ← select, static
  travellers[]        ← nested fieldArray
    firstName         ← text, autocomplete="given-name"
    age               ← number, showWhen sibling
```

`reselectOptions: true` because two Doubles is a legitimate booking.
`cardDisplay.showCompletionStatus: true` so an unfinished room says so on its chip.

### Modules

- delete: `src/components/ui/combobox.tsx`, `src/components/ds/form/fields/combobox.tsx`
- `pnpm dlx shadcn@latest add combobox` → new `src/components/ui/combobox.tsx` (registry-owned;
  style edits only, no structural rewrites)
- `src/components/ds/form/fields/combobox.tsx` — the array control, rebuilt
- `src/components/ds/form/row-editor-dialog.tsx` — the shared modal editor (phase 2's `cardArray`
  consumes it)
- `src/lib/forms/types.ts` — `editableOptions`, `draggable`, `singularLabel`, `cardDisplay`
- `src/lib/forms/schema-builder.ts` — combobox rows as `z.array(rowSchema)` with min/max counts
- `src/app/(frontend)/demo/form/` — rooms restructured
- `docs/frontend/nextjs-ds-blueprint/03-forms.md` — value contract row for `object[]` rows;
  the backwards `searchableSelect` note corrected — **before the component, per hard rule 11**

## Testing Decisions

**Browser, not jsdom** — established twice now (#31, and phase 1's combobox passed its jsdom
tests while rendering unusably). Playwright against `/demo/form`:

- type → Enter adds a chip and clears the input; three rooms in three Enters
- re-picking with `reselectOptions: true` yields two chips and two rows in the payload
- toggle mode: re-picking removes; at `max`, unselected options disable but selected stay
  clickable
- chip label opens the modal; editing a traveller then closing keeps the edit; prev/next moves
  rows without closing; footer reorder reorders the payload
- × removes the row and its nested values from the payload
- Backspace on empty input removes the last chip; Escape closes; Enter never submits
- payload is `object[]` with `{value, label}` plus nested fields, asserted on the wire
- incomplete room shows the badge when `showCompletionStatus: true`

**Visual.** The default chip, input and popup are compared against the shadcn docs page rendering
side by side — by a person, deliberately. "Pixel perfect" is the acceptance bar and no assertion
substitutes for looking. The popup inside a themed Section renders in that Section's colours.

**Static checks.** `pnpm vitest run tests/int/section-theme.int.spec.ts` (the control is under
`src/components/**`), `tsc --noEmit`, and the existing condition/`submittedValues` suites extended
for `object[]` rows.

## Out of Scope

- **Async option source** — follow-on ticket. Additive: `filter={null}`, externally controlled
  `items`, `Combobox.Status`, request aborting, merging selections with results so chosen chips
  survive a query change. Nothing in this phase's anatomy changes for it.
- **`searchableSelect`** — the scalar type-to-filter select. Orphaned by this spec: single-choice
  with filtering has no control until it is ticketed. The phase 1 implementation, corrected, is
  most of it — but it is not this ticket.
- **Pointer drag reorder** — phase 2, with `cardArray`. `draggable: true` renders the grip only
  when drag lands; until then the flag is documented as inert.
- **`cardArray`, form-level chrome, wizard resumption** — phase 2, unchanged except that
  `cardDisplay` config and the shared row editor now precede it.

---

## Appendix — grilling record, 2026-08-08

### Facts established

- Kallax's registry maps `combobox` → `ArrayCombobox` (`field-registry.tsx:117`), `searchableSelect`
  → `SearchableSelectField`, `multiSelect` → `MultiSelectField`. Three controls; phase 1 built the
  first's name around the second's behaviour.
- `ArrayCombobox` chips: drag handle when `isDraggable !== false`, edit button with
  `aria-haspopup="dialog"` when `editableOptions !== false`, composed summary
  `[...resolvedChips, displayTitle].join(" - ")` (`array-combobox-item.tsx:280-330`).
- `handleSelectItem` inserts only — adding never opens the modal.
- The modal is a live editor: fields bind to the store, every close path keeps, no Cancel
  (`array-combobox-modal.tsx`). Prev/next moves `activeItemId` without closing.
- Options list: `showCheckboxes = !reselectOptions`; selected highlight suppressed in reselect
  mode (comment at `array-combobox-options-list.tsx:79`); asymmetric max-disabling.
- Kallax flag defaults: everything opt-out except `showCompletionStatus` (opt-in).
- shadcn registry combobox (`pnpm dlx shadcn@latest add combobox`): `Combobox multiple`,
  `ComboboxChips`, `ComboboxValue`, `ComboboxChip`, `ComboboxChipsInput`, `ComboboxContent`
  (= Portal + Positioner + **Popup**), `ComboboxEmpty`, `ComboboxList`, `ComboboxItem`; 11 examples
  including Multiple, Groups, Clear Button, Auto Highlight.
- Base UI keyboard defaults + `autoHighlight` reproduce Kallax's Enter-adds-first without custom
  handlers; Backspace-on-empty-removes-last-chip comes free.

### Decisions

| # | Decision |
|---|---|
| 1 | Chip is shadcn's exactly; label is the modal trigger; grip only via `draggable: true` |
| 2 | Value is always `object[]` — no branching on config |
| 3 | Every chip opens the row modal; chrome (prev/next, incomplete alert, footer reorder, header chips/descriptions) all configurable |
| 4 | Kallax flag names and opt-out semantics; recorded divergence: `draggable` defaults off |
| 5 | Dropdown = shadcn check indicator + Kallax's two behavioural rules |
| 6 | Static options only; async is a follow-on |
| 7 | No auto-open on add |
| 8 | Modal is a live editor; close/prev/next keep; no Cancel |
| 9 | × removes immediately; protection is `removable: false` |
| 10 | Base UI keyboard defaults + `autoHighlight` + Enter-never-submits guard |

### Rejected

- **Two chip variants switched by config** (first answer, revised by the user): every chip opens a
  modal; the config switch survives only as `editableOptions: false` for plain chips.
- **Bare-value rows for static options** — rejected for one shape everywhere; the doc carve-out
  widens to combobox rows as such.
- **Draft/Cancel modal** — breaks prev/next, costs a clone-and-diff layer, diverges from Kallax.
- **Confirm-on-remove / undo toast** — punishes the common case or adds a pattern the DS lacks.
- **Hand-wiring Kallax's key handlers** — shape-inheritance; the primitive + `autoHighlight`
  reproduces the semantics.
- **Auto-open modal on add** — interrupts rapid multi-add; incompleteness is chip badge + schema.
- **Kallax checkbox rows in the dropdown** — diverges from the docs page; check indicator carries
  the same `aria-selected` truth.

### Open questions carried forward

- Async: Base UI's async-multiple example merges selections with results so chosen items survive a
  query change — adopt that pattern when the follow-on lands.
- `searchableSelect` needs a ticket; until then single-choice-with-filter has no control.
- Incomplete-badge computation should share code with phase 2's `cardArray`
  `showCompletionStatus`.
- Whether `draggable`'s grip ships inert in 1.5 or waits for drag in phase 2 — this spec says
  wait.
