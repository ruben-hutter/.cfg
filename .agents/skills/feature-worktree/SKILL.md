---
name: feature-worktree
description: "Isolated git worktrees for feature work in wtree-layout repos (repo root contains a .bare directory). Use this automatically BEFORE implementing any feature, task, or bugfix when the repo root has .bare and you are not already inside a feature worktree: creates <repo>/<name> on branch feat/<name> via `wtree feature`, merges back via `wtree finish`. Never work directly in the main/master worktree of such repos. Also available as /feature-worktree start|finish."
argument-hint: "start <feature-name> | finish <feature-name>"
---

# Feature worktrees

Feature work happens in its own worktree; `main` is never worked on directly.

Assumes the `wtree` layout: `<repo>/.bare` plus a `.git` file at the repo root, with each worktree checked out as a subdirectory (`<repo>/main`, `<repo>/<feature>`). Feature branches are named `feat/<feature-name>`.

## start <feature-name>

1. If no name was given, derive a short kebab-case slug from the spec or ticket title.
2. Run `wtree feature <feature-name>` from anywhere inside the repo. It creates the worktree at `<repo>/<feature-name>` on a new branch `feat/<feature-name>`.
3. `cd` into the new worktree and install dependencies the way the repo prescribes.
4. If the repo needs dev servers or databases and `docs/agents/worktrees.md` defines per-worktree offsets, apply them now.

If the repo has no `.bare` directory at its root, it wasn't created with `wtree`: tell the user and ask how to proceed (a plain `git worktree add ../<repo>-wt-<name> -b feat/<name>` is a fine fallback).

## finish <feature-name>

Finish only when ALL of these hold — if any don't, say which and stop:

- the full test suite passes inside the worktree
- `/code-review` was run and its findings addressed
- `git status --porcelain` is clean in the worktree (commit first, per repo convention)

Then:

1. Run `wtree finish <feature-name>` from anywhere inside the repo. It rebases `feat/<feature-name>` onto `main`, fast-forward merges `main`, removes the worktree, and deletes the branch.
2. If the script fails, report its output and stop. Never force a merge and never resolve rebase conflicts silently — hand the conflict back to the user, or ask before resolving it.
3. If the repo has a remote, ask the user whether to push `main`.

## Parallel agents

Run worktrees in parallel only for tickets that don't block each other (the blocking edges from `/to-tickets` are the map). Worktrees isolate git only: ports, databases, and containers are still shared — check `docs/agents/worktrees.md` for offset conventions before starting servers. When several features finish against the same `main`, later ones may need a rebase with real conflicts; that's expected, don't force it.
