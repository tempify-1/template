# A Page chooses its Shell, the route group does not

A Page document carries a Shell field — website, dashboard, blank — and the layout for the
section-page segment reads it and wraps the page in the Shell it names. The same Preset-composed
page can be published as a marketing page or as a dashboard page by changing one select, with no
file moved and no second route added.

**The choice is read in the layout, not in the page.** A Next layout persists across navigation
within its segment; a page remounts. Reading the Shell in the layout means navigating between two
Pages that share a Shell keeps the chrome mounted rather than tearing it down and rebuilding it.
The layout fetches the document to read one field, and the page fetches it again for its Sections;
both calls are deduplicated by the request-scoped cache already wrapping the page loader.

An earlier draft justified this by claiming the sidebar would otherwise lose its collapsed state.
That is false: shadcn's sidebar provider persists that in a cookie, so it survives a remount
either way. The remaining benefit is not re-mounting the chrome on every navigation — real, but
smaller than first claimed.

## Status

accepted

## Considered options

- **The route group decides**, which is what doc 05 specifies and what a Next.js developer
  expects. Rejected: chrome then follows the URL, so a Preset-composed page cannot be given
  dashboard chrome without adding a second dynamic route that reads the same collection. Two
  routes, one collection, and an editor who still cannot make the choice.
- **The page component wraps itself in a Shell.** Simpler — no field read in the layout, no double
  fetch. Rejected, but narrowly: the chrome remounts on every navigation between Pages that share
  a Shell. Sidebar collapsed state survives regardless, because it is cookie-backed, so the cost
  is the remount itself rather than lost state. The saving is a query the request cache already
  removes.
- **Route group sets a default, the document overrides it.** Rejected: two mechanisms for one
  decision. Debugging "why does this page look like a dashboard" means checking both, and the
  override can contradict the URL it sits under.
- **Layout templates as a runtime registry keyed by name**, as the previous Qwik system did.
  Rejected in that shape: it is the same idea, but expressing it as Next layouts keeps the
  persistence semantics rather than reimplementing them.

## Consequences

- **This contradicts doc 05**, which maps four Shells to four route groups. That section must be
  amended or marked superseded when this lands; leaving both readings in the blueprint is worse
  than either one alone.
- **It does not require consolidating the root layouts.** A Page that chooses dashboard chrome
  renders the dashboard Shell as a component inside the route group it already lives in. An
  earlier draft of this ADR claimed the two were coupled; they are not, and the claim was removed
  before any code was written. The separate question of how many root layouts the app should have
  (#18) is unaffected by this decision in either direction.
- **Shells become components, not layouts.** Hand-coded dashboard routes and CMS pages that chose
  dashboard chrome render the same component, so there is one implementation of dashboard chrome
  rather than one per caller.
- **An absent or unrecognised Shell falls back to the website Shell and reports through the
  mapper's warning channel**, mirroring an unrecognised Section Theme. A page rendering with the
  wrong chrome is recoverable; a page that throws because someone renamed a Shell is not. This is
  the same failure mode the Preset mappers were hardened against — content saved in the admin that
  then removes the page.
- **The glossary definition of Shell is wrong once this lands.** It reads "the persistent chrome
  that every route in a route group renders inside", which is precisely the coupling this removes.
- **Navigating between two Pages with different Shells works.** Next's documentation warns that
  layouts do not re-render on navigation, which would have left stale chrome. Verified before
  building: a client-side navigation between two Pages matching the same dynamic segment does
  re-render the layout with the new parameter.
- **A Shell is structure; its content is configuration.** The dashboard Shell takes its header and
  sidebar as props rather than embedding them. The first implementation extracted the shadcn
  dashboard demo verbatim, so a public Page choosing dashboard chrome shipped a header reading
  "Documents", another party's brand and seven dead links. The hand-coded dashboard routes pass
  their own demo content; CMS pages pass the page title and a sidebar built from navigation
  config. Sharing the Shell was always right — sharing its content was not.
- **The dashboard routes are no longer statically prerendered.** Reading the sidebar cookie is a
  Dynamic API, so `/dashboard` and `/dashboard/charts` moved from static to server-rendered per
  request. They render from a committed fixture, so the cost is small, and the alternative —
  reading the cookie on the client — trades a correct first paint for a flash of the wrong
  sidebar state. Recorded because it was an unintended and initially invisible consequence of the
  persistence fix.
- **The layout reads a document.** Layouts that fetch are unusual and worth knowing about: it is
  one field, and it is free because the loader is memoised per request. If that memoisation is
  ever removed, this doubles the query count on every page.
