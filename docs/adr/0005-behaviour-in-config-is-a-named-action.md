# Behaviour in config is a named Action, not a function

Configs describe behaviour by string — `{ action: "signOut", args?: Json }` — resolved
client-side through an action registry. Functions and React nodes never appear in a config.

## Status

accepted

## Considered options

- **Functions in config** (`onClick: () => signOut()`) — the obvious React answer, fully typed,
  no indirection. Rejected: configs are stored in Payload (ADR-0002) and must survive JSON
  serialization, which a function does not.
- **React node slots** — pass behavioural elements as children rather than describing them.
  Typed, idiomatic, no registry. Rejected for the same reason: a slot cannot be stored in a CMS,
  so it splits the model into serializable pages and non-serializable ones.
- **Links only** — configs carry `href` and nothing else; anything behavioural lives in
  hand-written code. Rejected: it makes sign-out, a layer-opening card, or a CTA that submits
  unreachable from the CMS, which quietly turns most real pages into code-only pages.

## Consequences

- **This will look wrong to a React developer.** Seeing `{ action: "signOut" }` resolved through
  a lookup map instead of `onClick={signOut}` reads as indirection for its own sake, which is why
  it is recorded here rather than left as a convention. The serializability constraint is the
  whole reason, and it is not visible from the call site.
- It is the **same registry pattern** already governing Blocks (`blockRegistry`) and form Fields,
  so it is one mechanism applied consistently rather than a new concept.
- Actions are untyped at the config boundary unless the union is narrowed. Prefer a string-literal
  union over `string` so a typo is a type error rather than a silent no-op at runtime.
- The previous Qwik system reached the same design independently — `action: "signOut" | "custom"`
  with a `customActionId` in its nav config — which is evidence the constraint is real, not
  evidence we should copy its shape.
- Scope is wider than navigation: a preset's `cta`, a card that opens a record drawer, a button
  that submits. Anywhere a config implies behaviour, it names an Action.
