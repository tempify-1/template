# Qwen Code parity

Qwen Code (`qwen`) runs against the same repo as Claude Code. This document records how the two
agents are kept in step and why the mirroring is a copy rather than a symlink or a shared path.

`scripts/sync-qwen.mjs` performs the mirroring. Re-run it after installing or updating a Claude
plugin — nothing watches for drift.

```
node scripts/sync-qwen.mjs
```

## What maps to what

| Claude Code                                          | Qwen Code                       |
| ---------------------------------------------------- | ------------------------------- |
| `.claude/skills/<name>/SKILL.md`                     | `.qwen/skills/<name>/SKILL.md`   |
| `~/.claude/skills/`                                  | `~/.qwen/skills/`               |
| `.claude/commands/`, `~/.claude/commands/`           | `.qwen/commands/`, `~/.qwen/commands/` |
| Plugin skills declared in `.claude-plugin/plugin.json` | flattened into `~/.qwen/skills/` |
| `~/.claude/CLAUDE.md`                                | `~/.qwen/CLAUDE.md`             |
| project `CLAUDE.md`                                  | read in place via `context.fileName` |
| `~/.claude.json` → `mcpServers`                      | `~/.qwen/settings.json` → `mcpServers` |

## Why the plugin skills are flattened

Claude Code resolves plugin skills through the `skills` array in `.claude-plugin/plugin.json`, so a
plugin is free to nest them under category folders — `mattpocock-skills` ships
`skills/engineering/tdd/SKILL.md`. Qwen Code discovers only `<skills-root>/<name>/SKILL.md`, one
level deep, with no manifest. The sync script therefore reads each installed plugin's manifest and
copies the declared skill directories to the flat root, which also excludes the plugin's
unregistered `in-progress/` and `deprecated/` skills exactly as Claude does.

The copy is taken from the `installPath` recorded in `~/.claude/plugins/installed_plugins.json`, not
from a glob over `plugins/cache/`, because the cache retains superseded versions.

## Why copies, not symlinks

Qwen's skill discovery walks directory entries with `withFileTypes`. A `Dirent` for a symlink
reports `isDirectory() === false`, so a symlinked skill can be skipped silently depending on how the
walk is written. A copy is correct under either implementation. Drift is the cost, and re-running
the script is the mitigation.

## Config that has no Claude equivalent

- `context.fileName` in `~/.qwen/settings.json` is set to `["QWEN.md", "CLAUDE.md", "AGENTS.md"]`.
  Qwen defaults to `QWEN.md` only; without this it would ignore the project's `CLAUDE.md`.
- `CONTEXT.md` is deliberately **not** in that list. Claude does not auto-load it either — it is read
  on demand per `docs/agents/domain.md`, and auto-loading it in one agent only would break parity.

## Credentials

`modelProviders[].envKey` is the **name of an environment variable**, not a key. The value lives in
`~/.qwen/.env` (git-ignored, `chmod 600`), which Qwen loads at startup.

## Skills that stay inert under Qwen

The `claude-mem` skills (`mem-search`, `smart-explore`, `timeline-report`, `weekly-digests`,
`knowledge-agent`, `standup`, `cloud-sync`, `how-it-works`, `mode-creator`, `version-bump`) drive the
claude-mem database. Its MCP server is registered in `~/.qwen/settings.json` as `claude-mem`, but
claude-mem's *capture* side is a set of Claude Code hooks with no Qwen equivalent — Qwen can read the
memory Claude writes, not add to it.
