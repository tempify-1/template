# Server-side Live Preview, to keep the page tree in RSC

Payload Live Preview renders the frontend in an iframe inside the admin panel and pushes document
events over `window.postMessage`. We use Payload's **server-side** mode — the
`RefreshRouteOnSave` component from `@payloadcms/live-preview-react` calls `router.refresh()` — so
the Page, Section, Column and Block tree stays entirely React Server Components.

**The refresh fires on save, not on keystroke.** Server-side Live Preview makes a roundtrip only
when the document is saved: draft save, autosave, or publish. Only the client-side
`useLivePreview` hook updates continuously, because it renders against *form state* rather than
saved data. The real trade is therefore "updates on save" versus "updates as you type" — not
"snappy versus laggy".

## Status

accepted

## Considered options

- **Client-side Live Preview** — instant updates, and what most Payload sites do. Rejected: it
  requires the section system to be client-renderable, which would ship the whole page builder as
  client JavaScript and give up the near-zero-JS marketing page.
- **A dual render path** — RSC in production, a client mirror for preview only. Rejected: two
  implementations of one render tree, free to drift.
- **No Live Preview** — draft mode only. Rejected: it is the feature editors most expect from a
  page builder.

## Consequences

- **The Pages collection must enable drafts and autosave.** Without autosave, an editor types a
  heading and sees nothing until they save, which does not read as live preview. Payload's own
  recommendation is `versions: { drafts: { autosave: { interval } } }` with a low interval; we use
  ~2s. The cost is a draft write plus a full RSC render plus its DB reads per edit burst — a
  deliberate trade for keeping the render tree in RSC.
- Live Preview reintroduces an iframe, which the blueprint had otherwise eliminated when
  record-detail drawers moved off iframe embedding. The two are unrelated; the instinct that
  iframes are gone is wrong.
- The `/preview` route that renders an encoded `SectionDefinition[]` is a developer tool and is
  **not** Live Preview. It does nothing for an editor in the admin panel.
- Publishing still needs `revalidateTag` from Payload `afterChange` hooks; Live Preview covers the
  unsaved-draft case only.
