# A Page chooses its Shell, the route group does not

A Page document carries a Shell field — website, dashboard, blank — and the layout for the
section-page segment reads it and wraps the page in the Shell it names. The same Preset-composed
page can be published as a marketing page or as a dashboard page by changing one select, with no
file moved and no second route added.

**The choice is read in the layout, not in the page.** A Next layout persists across navigation
within its segment; a page remounts. Putting dashboard chrome inside the page would remount the
sidebar provider on every navigation, losing collapsed state and scroll position — the exact thing
Next distinguishes layouts and pages to avoid. The layout therefore fetches the document to read
one field, and the page fetches it again for its Sections; both calls are deduplicated by the
request-scoped cache already wrapping the page loader.

## Status

proposed — specified but not built; the layouts track of the Shell and forms spec.

## Considered options

- **The route group decides**, which is what doc 05 specifies and what a Next.js developer
  expects. Rejected: chrome then follows the URL, so a Preset-composed page cannot be given
  dashboard chrome without adding a second dynamic route that reads the same collection. Two
  routes, one collection, and an editor who still cannot make the choice.
- **The page component wraps itself in a Shell.** Simpler — no field read in the layout, no double
  fetch. Rejected: the page remounts on every navigation, so the dashboard sidebar loses its
  state. The saving is a query that the request cache already removes; the cost is a visibly worse
  dashboard.
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
- **It forces the single root layout doc 05 already asks for.** The repo currently has three root
  layouts, each with its own `<html>` and its own copy of the providers, which is the open
  question in #18 — a theme preference set on the marketing site was silently forgotten when
  crossing into the dashboard, because the dashboard mounted a second provider. Shell-per-document
  cannot work while chrome is decided by which root layout you happened to land in, so this
  decision closes that question rather than living alongside it.
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
- **The layout reads a document.** Layouts that fetch are unusual and worth knowing about: it is
  one field, and it is free because the loader is memoised per request. If that memoisation is
  ever removed, this doubles the query count on every page.
