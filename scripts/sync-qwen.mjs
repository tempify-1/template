#!/usr/bin/env node
// Mirrors Claude Code's skills, commands and context files into Qwen Code's
// equivalents. Re-run after installing or updating a Claude plugin.
// Rationale: docs/agents/qwen-parity.md

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CLAUDE_HOME = join(homedir(), '.claude')
const QWEN_HOME = join(homedir(), '.qwen')
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const ensure = (p) => mkdirSync(p, { recursive: true })
const dirs = (p) =>
  existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((e) => e.isDirectory()) : []

function copySkill(srcDir, destRoot, name = srcDir.split('/').pop()) {
  if (!existsSync(join(srcDir, 'SKILL.md'))) return null
  const dest = join(destRoot, name)
  rmSync(dest, { recursive: true, force: true })
  cpSync(srcDir, dest, { recursive: true, dereference: true })
  return name
}

function readJson(p) {
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

ensure(join(QWEN_HOME, 'skills'))
ensure(join(QWEN_HOME, 'commands'))
ensure(join(REPO_ROOT, '.qwen/skills'))
ensure(join(REPO_ROOT, '.qwen/commands'))

const copied = { project: [], personal: [], plugin: [] }

if (existsSync(join(CLAUDE_HOME, 'CLAUDE.md'))) {
  cpSync(join(CLAUDE_HOME, 'CLAUDE.md'), join(QWEN_HOME, 'CLAUDE.md'))
}

for (const e of dirs(join(REPO_ROOT, '.claude/skills'))) {
  const name = copySkill(join(REPO_ROOT, '.claude/skills', e.name), join(REPO_ROOT, '.qwen/skills'))
  if (name) copied.project.push(name)
}

for (const e of dirs(join(CLAUDE_HOME, 'skills'))) {
  const name = copySkill(join(CLAUDE_HOME, 'skills', e.name), join(QWEN_HOME, 'skills'))
  if (name) copied.personal.push(name)
}

for (const [from, to] of [
  [join(REPO_ROOT, '.claude/commands'), join(REPO_ROOT, '.qwen/commands')],
  [join(CLAUDE_HOME, 'commands'), join(QWEN_HOME, 'commands')],
]) {
  if (existsSync(from)) cpSync(from, to, { recursive: true, dereference: true })
}

// Claude plugin skills are nested under category folders and declared in
// plugin.json; Qwen discovers only <skills-root>/<name>/SKILL.md, so flatten
// and take only the versions actually installed.
const installed = readJson(join(CLAUDE_HOME, 'plugins/installed_plugins.json'))?.plugins ?? {}
for (const entries of Object.values(installed)) {
  for (const { installPath } of entries) {
    if (!installPath || !existsSync(installPath)) continue
    const manifest = readJson(join(installPath, '.claude-plugin/plugin.json'))
    const declared = Array.isArray(manifest?.skills)
      ? manifest.skills.map((rel) => resolve(installPath, rel))
      : dirs(join(installPath, 'skills')).map((e) => join(installPath, 'skills', e.name))
    for (const skillDir of declared) {
      const name = copySkill(skillDir, join(QWEN_HOME, 'skills'))
      if (name) copied.plugin.push(name)
    }
  }
}

const report = (label, list) =>
  console.log(`${label}: ${list.length}${list.length ? ` — ${list.sort().join(', ')}` : ''}`)

report('Project skills  -> .qwen/skills', copied.project)
report('Personal skills -> ~/.qwen/skills', copied.personal)
report('Plugin skills   -> ~/.qwen/skills', copied.plugin)
