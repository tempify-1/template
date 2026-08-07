# Stack

Payload CMS 3 embedded in Next.js · Postgres · Next 16.2.6 (pinned) · App Router, RSC by default
Tailwind v4 (CSS-first `@theme`) · shadcn/ui (Base UI) · react-hook-form + zod · Lexical rich text · pnpm · Node 24

Domain material lives in CONTEXT.md. Rationale and architecture live in docs/.

# Hard rules

1. Schema first. Every feature starts as a Payload collection/field or a zod schema. Run `payload generate:types` before writing consuming code and commit the result. Generated types are the contract for Payload data — never hand-write duplicates. Carve-out: design-system config types (`SectionDefinition`, `Field`, `LayoutConfig`) are hand-authored TypeScript and Payload is derived from them, not the reverse — see `docs/adr/0002`.
2. Local API (`getPayload`) in all RSC/server code. Server Functions for client mutations. REST only for external consumers.
3. Mapper boundary: Payload data is transformed in `src/mappers/` before reaching any component. Presentational components never import Payload types.
4. shadcn best practice first. Check the registry before writing a component; check for a block before assembling primitives. When shadcn has an opinion — token naming, component anatomy, `cva` over per-component CSS — shadcn wins. The old Qwik design system in `~/Development/design-system` is evidence about pitfalls, never a source of design. This is not a port — see `docs/adr/0006`.
5. Server Components by default; `'use client'` as low in the tree as possible.
6. Generate configs, not JSX. Pages and sections are authored as typed config objects rendered by design-system components. Never hand-write or generate bespoke JSX for something a config can describe. If the config can't express it, extend the config type and the DS component — dropping to one-off markup is the failure mode this rule exists to prevent.
7. Semantic tokens only in components. DS components style with semantic utilities
   (`bg-background`, `text-foreground`, `bg-primary`, `border-border`). Never raw palette classes
   (`bg-blue-500`, `text-slate-700`) and never literal colour values. Section colour is set by
   `data-theme` on a section container; components inherit it and never branch on theme themselves.

   **Why this is stricter than shadcn's baseline**: shadcn's registry allows palette classes in
   user code, but this project enforces semantic tokens everywhere under `src/components` for
   three reasons: (1) automatic theme inheritance via `data-theme` scoping, (2) consistency with
   shadcn's own components which always use semantic tokens, and (3) future-proofing — new section
   themes work out of the box. Enforcement: `tests/int/section-theme.int.spec.ts`.
8. Access control: function-per-operation. `authenticated` for admin ops, `authenticatedOrPublished` for public reads. Never leave default-open.
9. `afterChange` hooks → `revalidatePath` / `revalidateTag`.
10. Forms: react-hook-form + zod (via `@hookform/resolvers/zod`), field registry. STORE BARE VALUES — string keys, numbers, booleans, `yyyy-MM-dd` strings — wherever the display label can be resolved from an options list. One carve-out: a combobox reading an `optionSource` stores `{value,label}` (Base UI's own convention, not Kallax's `{key,label}`), because there is no options array to resolve against; `value` is the identity for conditions and submission, `label` is display only. Array rows are objects already and need no carve-out. Conditions live at the schema's object level and self-evaluate at validation time, never baked in at render time. Three effects — `showWhen`, `enableWhen`, `requiredWhen` — over Payload's operator names (`equals`, `not_equals`, `exists`, plus `count_equals`). What reaches the payload is HTML's rule, not ours: hidden and disabled are both absent, `readonly` is present. Validation mode is `onTouched`, never `onChange` from empty. Every field collecting personal data carries an `autocomplete` (WCAG 2.1 SC 1.3.5).
11. Value contracts are law: a row in `docs/frontend/nextjs-ds-blueprint/03-forms.md` (Value contracts) before any new field component.
12. No comments in code. Rationale goes in docs/.
13. Verify, don't assume: typecheck + targeted test + observe the live page. A log is only evidence if it logs the value that goes over the wire.
14. Payload work loads the skill first. Before writing or reviewing any collection, global, field, hook, access-control or plugin code, load the `payload` skill (`.claude/skills/payload`) and judge the implementation against it. Any spec or ticket touching Payload carries this as a stated precondition, not as a review afterthought — Payload defects have repeatedly been caught downstream instead of avoided upstream.

# Retrieval guardrail

Use Augment's `codebase-retrieval` for broad "where does X happen / what touches Y" questions. Results are leads, not truth — verify against current source. Prefer Grep for exact identifiers, Read for known files.

# Version constraint

Payload supports Next 15.2.9–15.2.x, 15.3.9–15.3.x, 15.4.11–15.4.x, and 16.2.6+. Do not upgrade Next outside those ranges. `cacheComponents` stays off.

# Local environment

Postgres runs on port **5433**, not 5432.

# Commands

```
pnpm dev · pnpm build · pnpm lint · tsc --noEmit
payload generate:types · payload generate:importmap
```

## Agent skills

### Issue tracker

GitHub Issues on `tempify-1/template`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, label strings unchanged. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Payload

Project-local skill at `.claude/skills/payload`. A precondition for Payload work, not a reference
— see hard rule 14.

### Design tokens

Project-local skill at `.claude/skills/design-tokens`, path-gated to `src/components`, `globals.css`
and any stylesheet. Encodes hard rule 7 and the Section Theme contract upstream of
`tests/int/section-theme.int.spec.ts`, which fails on every violation.

### MCP servers

`.mcp.json` registers `shadcn` (registry search — hard rule 4) and `nextjs-dev` (live errors, logs
and routes off the running dev server — hard rule 13). The Next server needs `pnpm dev` up.

### Qwen Code

Mirrored from `.claude` by `scripts/sync-qwen.mjs`. Re-run it after adding a skill or updating a
Claude plugin. See `docs/agents/qwen-parity.md`.
