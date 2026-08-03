# Stack

Payload CMS 3 embedded in Next.js · Postgres · Next 16.2.6 (pinned) · App Router, RSC by default
Tailwind v4 (CSS-first `@theme`) · shadcn/ui · react-hook-form + zod · Lexical rich text · pnpm · Node 24

Domain material lives in CONTEXT.md. Rationale and architecture live in docs/.

# Hard rules

1. Schema first. Every feature starts as a Payload collection/field or a zod schema. Run `payload generate:types` before writing consuming code and commit the result. Generated types are the contract — never hand-write duplicates.
2. Local API (`getPayload`) in all RSC/server code. Server Functions for client mutations. REST only for external consumers.
3. Mapper boundary: Payload data is transformed in `src/mappers/` before reaching any component. Presentational components never import Payload types.
4. Server Components by default; `'use client'` as low in the tree as possible.
5. Access control: function-per-operation. `authenticated` for admin ops, `authenticatedOrPublished` for public reads. Never leave default-open.
6. `afterChange` hooks → `revalidatePath` / `revalidateTag`.
7. Forms: react-hook-form + zod, field registry. STORE BARE VALUES — string keys, numbers, booleans, `yyyy-MM-dd` strings. Never `{key,label}` objects in form state. Conditional validators self-evaluate at validation time, never baked in at render time.
8. Value contracts are law: a row in `docs/frontend/form-runtime-contracts.md` before any new field component.
9. No comments in code. Rationale goes in docs/.
10. Verify, don't assume: typecheck + targeted test + observe the live page. A log is only evidence if it logs the value that goes over the wire.

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
