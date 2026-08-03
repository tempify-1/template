# Scaffold decisions — 2026-08-03

One-time record of the choices made while standing up this template. Not auto-loaded, not maintained.

## Blank template over the website template

Roughly 85% of the Payload website template would have been deleted: its block model, form builder,
and design-token setup are all replaced by our own. Dead scaffold code poisons agent retrieval — an
agent cannot distinguish our Hero block from the template's, and every retrieval hit on the template's
version is a wrong lead.

The website template is kept as a read-only reference clone outside this repo, for copying live
preview, draft mode, and revalidation patterns when needed.

## Next pinned to 16.2.6

Payload's supported Next ranges are 15.2.9–15.2.x, 15.3.9–15.3.x, 15.4.11–15.4.x, and 16.2.6+.
Note the gaps *inside* the 15.x minors — a patch version being 15.3.x is not sufficient on its own.
16.2.6 is the lowest version on the open-ended tail, so it is pinned there.

## Postgres over Mongo, on port 5433

Relational modelling and generated SQL types suit the content model better than Mongo.

Port 5433, not the default 5432: 5432 on this machine is occupied by tempify's `core-postgres-1`.
Any clone of this template that assumes 5432 will fail to connect — check `.env` before first boot.

## Pocock skills via the Claude Code plugin, not a skills.sh fork

Subscribe, don't fork. The plugin tracks upstream; a `skills.sh` fork would drift and require manual
merges. Installing both would duplicate every skill and give the agent two competing copies of each.

## Augment as an MCP server at user scope

Registered at user scope (not project scope) so it is available across repos, providing
`codebase-retrieval`. Its results are leads, not truth — verify against current source before acting.

## Single app, no monorepo

No `packages/` directory. A monorepo is deferred until a second app actually exists; the abstraction
cost is real and the benefit is currently zero.

## cacheComponents left off

It can be enabled alongside Payload without erroring in the admin panel, but full compatibility is not
guaranteed. Off until that changes.
