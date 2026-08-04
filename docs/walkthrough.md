# Walkthrough — testing what was built

A guided tour of the template for someone who has not seen it before. Roughly 45 minutes end to
end. Every step names the ticket it exercises, so you can stop early and still know what you have
and have not seen.

Nothing here needs a deploy. Everything runs against local Postgres.

---

## 1. Get it running (10 minutes)

**Prerequisites:** Node 24, pnpm, and Postgres listening on **port 5433** (not the default 5432).

```bash
createdb -h localhost -p 5433 template     # or your usual Postgres client
cp .env.example .env                        # then set PAYLOAD_SECRET to any random string
pnpm install
pnpm dev
```

Open **http://localhost:3000**. You should get a full landing page.

> **What you are looking at.** No CMS content exists yet, so the page is rendering from a code
> Fixture (`src/fixtures/pages/home.ts`). That fallback is deliberate: a fresh clone shows a
> complete site before anyone logs in.

Now open **http://localhost:3000/admin** and create the first user. Payload prompts for this on
first run; there is no seed script and no default password.

---

## 2. The landing page, section by section (10 minutes)

Scroll the home page top to bottom. Each band is a **Preset** — a typed factory that returns a
section configuration. There is no hand-written JSX for any of it.

| What you see | Ticket |
| --- | --- |
| Hero with two buttons and trust badges | #2 |
| Logo wall, service list, CTA banner, community, FAQ accordion | #12 |
| Benefits grid (auto-numbered), feature grid (icons) | #10 |
| Testimonial carousel, team grid | #13 |
| Pricing table with a monthly/annual toggle | #14 |
| Contact form and newsletter form | #15 |
| Header with dropdown, footer, "Toggle theme" | #7 |

**Three things worth doing rather than just reading:**

1. **Click "Toggle theme"** in the header. The whole site inverts and the choice survives a
   reload. That control is a *named Action* — the nav config stores the string `toggleTheme`, not
   a function, because configs have to survive being stored in a database (#7, ADR-0005).

2. **Toggle the pricing table to Annual.** Prices change instantly with no page load. Now view
   source and search for `$290` — it is already in the server HTML. Only the toggle button is a
   client component; the tier cards are server-rendered and both price sets ship in the markup
   (#9, #14).

3. **Shrink the window below 768px.** The header nav collapses into a sheet containing the same
   config, including the theme Action (#7).

---

## 3. The admin panel — the part that matters (10 minutes)

Go to **http://localhost:3000/admin** → **Pages** → **Create new**.

Set **Title** `Home` and **Slug** `home`, then open the **Sections** dropdown.

> **This is the core claim of the project.** Every Preset a developer can call appears here as a
> block an editor can pick, with the same fields. Nobody wrote those admin forms — they are
> generated from the same zod schemas the factories validate against (#11). Add a preset, get an
> admin form.

Add a **Hero (centered)** block, type a heading, and hit **Save**.

Reload **http://localhost:3000**. Your page has replaced the code Fixture (#5).

**Then try to break it** — this is the most informative five minutes in the tour:

- Add a **Pricing table** block, add a tier, but leave the call-to-action fields blank. Save.
  The bad row is dropped; the rest of the section still renders. It does **not** take the page
  down. (Five separate review passes found variants of "content saves, then the whole section
  silently vanishes" — this is the fix.)
- Try a **negative price**. The admin refuses it, because the zod bound is translated into a
  Payload field constraint rather than being enforced only at render time.
- Try slug `about/team`. Refused — a slug that the router cannot serve would otherwise end up
  advertised in the sitemap as a 404.

---

## 4. Drafts and Live Preview (5 minutes)

Still in the admin, on your Pages document:

1. Change the status to **Draft** and edit the heading.
2. Open **http://localhost:3000** in a private window. You see the *published* version, not your
   edit (#16).
3. Back in the admin, use the **Preview** button. You land on the site showing the draft, with an
   **"Exit preview"** control pinned at the bottom.
4. Edit the heading in the admin and watch the preview tab refresh on save. The render tree stays
   Server Components throughout — there is no client-side mirror of the page (#16, ADR-0004).
5. Hit **Publish**. Reload the public tab. Your change is live on the *first* request, with no
   deploy and no blanket cache purge — only that document's cache tag was expired.

---

## 5. SEO (3 minutes)

With a published page at slug `about`:

```bash
curl -s localhost:3000/sitemap.xml     # lists / and /about with lastmod
curl -s localhost:3000/robots.txt      # allows /api/media/, disallows /admin
curl -s localhost:3000/about | grep -E 'og:|canonical'
```

In the admin, the page's **SEO** tab shows a live Google-result preview as you type (#17).

The `Allow: /api/media/` line matters: Payload serves uploaded images from `/api`, so blocking
that path wholesale would stop Facebook and Twitter fetching your social image — the page would
share with no picture.

---

## 6. The dashboard (2 minutes)

**http://localhost:3000/dashboard** and **/dashboard/charts** — sidebar, cards, data table and
Recharts wrappers, assembled from shadcn blocks rather than hand-built (#3). No login required;
it is chrome, not a protected area.

---

## 7. Fixtures and preview routes (5 minutes)

```
http://localhost:3000/preview/heroCentered
http://localhost:3000/preview/pricing
http://localhost:3000/preview/faqAccordion
```

One committed example per Preset, rendered in isolation with no CMS and no deploy (#8). These
are the worked examples to read when writing a new Preset — `src/fixtures/presets/index.ts`.

`/preview/config?c=<base64url>` renders an arbitrary posted configuration, but **requires you to
be logged in**. Log out and try it: you get a 404. Unauthenticated, it would be a phishing page
hosted on your own domain.

---

## 8. Run the tests (5 minutes)

```bash
pnpm test:int     # 234 tests, needs Postgres — creates its own <db>_test database
pnpm test:e2e     # 104 tests, starts its own dev server on port 3001
```

Both suites are isolated from your dev database. The e2e suite seeds and cleans up after itself.

**Visual regression is opt-in**, because the baselines are macOS-specific:

```bash
VISUAL=1 pnpm exec playwright test tests/e2e/fixtures-visual.e2e.spec.ts
```

On Linux or Windows, regenerate once with `--update-snapshots` and commit your own baselines.
They will differ from the committed macOS set — that is font rendering, not a bug.

---

## 9. Where to read the code

Follow one Preset all the way through. `pricing` is the most instructive because it touches
everything:

```
src/lib/presets/pricing.ts              zod args + factory → SectionDefinition
src/lib/presets/registry.ts             one line registers it
src/lib/presets/payload-fields.ts       generates the admin form from the zod schema
src/mappers/page.ts                     stored blocks → configs, dropping bad rows
src/components/ds/section/pricing-*.tsx the renderer and its one client component
src/fixtures/presets/index.ts           the committed example
```

Then read `CLAUDE.md` for the thirteen rules the code follows, and `docs/adr/` for the six
decisions that were hard enough to be worth recording.

---

## What is deliberately not done

Two decisions were left open for you rather than guessed at:

- **#18** — doc 05 says providers belong in one root layout; the repo has three (`(frontend)`,
  `(dashboard)`, `(payload)`). Both `ThemeProvider`s are currently duplicated as a result. Not a
  bug today, but it is the reason the theme toggle needed fixing once already.
- **#20** — media currently writes to the local filesystem. On any host with an ephemeral disk
  (Vercel, Fly, most containers), uploaded images vanish on redeploy. A storage adapter is needed
  before this goes anywhere real.

Also worth knowing: `/signup`, `/docs`, `/contact`, `/privacy` and `/terms` are linked from the
nav and footer but have no routes. They are pinned as declared placeholders in a test, so adding a
new dead link is a deliberate act rather than an accident — but they do 404 (inside the site
chrome, with a way back).
