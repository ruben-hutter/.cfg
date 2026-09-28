# Global instructions

## Feature work in wtree repos

Many of my repos use the "wtree" layout: the repo root contains a `.bare` directory, a `.git` file (`gitdir: ./.bare`), and one subdirectory per checked-out worktree (`main/` or `master/`, plus one directory per feature). Feature branches are named `feat/<name>`.

When I ask you to implement a feature, task, or bugfix in a repo with this layout (`.bare` at the repo root), do NOT start working right away:

1. If you are not already inside a feature worktree (i.e. your working directory is the repo root or the `main`/`master` worktree), first create one: run `wtree feature <name>` with a short kebab-case name derived from the task, then do ALL work inside `<repo-root>/<name>/` on branch `feat/<name>`.
2. The point is isolation: other agents may be working in parallel in the main worktree or other worktrees. Never commit feature work to `main`/`master`.
3. Use the `feature-worktree` skill for the full workflow, including the finish/merge-back flow.
4. If the repo does not have the wtree layout (no `.bare` at its root), just work normally — no worktree needed.

This rule also applies when the task looks small.
