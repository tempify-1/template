# react-hook-form + zod for forms

The form engine builds one whole-form schema from a `Field[]` config and renders fields through a
registry. We use react-hook-form for form state and zod for validation, wired together by
`@hookform/resolvers/zod`. zod is also the schema library for preset arguments (ADR-0002), so the
repo has exactly one.

## Status

accepted

## Considered options

### Formisch + Valibot — chosen first, then reversed

Formisch is schema-first and takes the whole-form schema directly (`useForm({ schema })`), which
seemed the natural grain for `buildSchema(Field[])`. Spiking the shipped `.d.ts` (there is no
usable published documentation — `formisch.dev/docs` 404s and the npm README is empty) reversed it
on three findings:

- **It cannot do per-step validation.** `validate` is the only function in the API without a
  field-path overload; `ValidateFormConfig` exposes `shouldFocus` and nothing else. The wizard
  needs to validate one step's paths without surfacing later steps' errors, which would mean
  building per-step schemas and parsing them by hand. react-hook-form's
  `trigger(name | name[], opts)` does it in one call.
- **Its typed paths do not survive a config-driven engine.** `ValidPath<TValue, TPath>` validates
  segment-array paths against a *statically known* schema. Ours is built at runtime from
  `Field[]`, so the value type degrades to `Record<string, unknown>` and both libraries lose path
  typing identically. The headline advantage is inapplicable here.
- **Its dirty-tracking advantage is small.** `getDirtyPaths()` is nicer than walking
  react-hook-form's nested `formState.dirtyFields`, but that walk is roughly twenty lines. The
  larger saving — deleting ~160 lines of snapshot diffing — is measured against the old Qwik
  system, not against react-hook-form, which tracks dirty state natively.

`@formisch/react` also has no stable release (`latest` is `1.0.0-rc.0`) and ~4,000 weekly
downloads.

### Valibot — carried by the Formisch decision, then dropped with it

Valibot entered the stack only because Formisch requires it (`type Schema = v.GenericSchema`).
When Formisch was dropped, the remaining justification turned out to be circular: this ADR cited
ADR-0002's per-preset Valibot schemas, and ADR-0002 had chosen Valibot because this ADR originally
chose Formisch. With the cause removed, the only independent argument left was bundle size — weak
in a repo already shipping React, TanStack Table and dnd-kit, where preset schemas run server-side
generating Payload fields and only the form schema reaches the client.

zod wins on the terms blueprint principle 7 actually sets — *"boring on purpose so Claude's
ecosystem knowledge applies directly"*: 251M weekly downloads against Valibot's 16M, the most
travelled `@hookform/resolvers` path, and already a dependency of shadcn's `dashboard-01` block.

## Consequences

- **`Field.name` stays a dot-string**, which is what doc 03 specifies and what Payload can store
  (ADR-0002). react-hook-form consumes dot-paths natively, so there is no conversion layer.
- **`dashboard-01` installs unmodified.** It ships zod as a dependency; since zod is now the
  project standard, nothing is stripped and no divergence from the block is introduced.
- **The schema library stays swappable.** `@hookform/resolvers` ships twenty adapters, so moving
  off zod later is a one-line change rather than a rewrite.
- **Conditions live at the schema's object level.** `showWhen` / `requiredWhen` become
  `superRefine` + `ctx.addIssue({ path })` against the whole values object, so a field hidden by
  `showWhen` is never required regardless of what is mounted. This remains the fix for the old
  system's `skipIfDisabled` bug class.
- **Autosave uses `formState.dirtyFields`**, flattened to leaf paths by a small recursive helper.
  The snapshot-diffing design described in doc 03 should not be built.
