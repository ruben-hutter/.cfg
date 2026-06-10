---
description: "Initialize opencode commands for the current project"
agent: build
---

You are setting up opencode commands for a project. Do NOT make code changes to the project itself — only create opencode config files (`.opencode/commands/`, `.opencode/agents/`, `.opencode/plugins/`).

## 1. Detect project context

Run these in order:

- Read `package.json` — get scripts, dependencies, framework
- Run `git remote -v` — get GitHub repo (owner/name)
- Run `git branch -r` — get branch names (main/master, working branch)
- Run `ls .opencode/commands/ 2>/dev/null` — check existing commands
- Run `test -f TODO.md && echo "EXISTS" || echo "NONE"` — check for TODO.md

Extract and report:
- **framework**: from dependencies (next, astro, react, etc.)
- **repo**: owner/name from git remote origin
- **mainBranch**: main or master from remote branches
- **workingBranch**: dev, develop, or same as main
- **buildCmd**: from scripts.build or scripts["build"] (e.g. `npm run build`)
- **lintCmd**: from scripts.lint or detect (e.g. `npx next lint`, `npx astro check`, `eslint .`)
- **typecheckCmd**: from scripts.typecheck or detect (e.g. `npx tsc --noEmit`, `npx astro check`)

## 2. Ask the user

Present the detected values and ask which of these to create:

**Commands** (multi-select):
- **next** — Pick next TODO/GitHub issue and create an actionable plan
- **deploy** — Build, review, commit, push, deploy to production
- **refactor** — Analyze code structure and suggest improvements

**Note:** `idea` command is always created (it's the same everywhere).

**Agent & plugin** (multi-select):
- **reviewer** — Read-only code reviewer subagent
- **lint-on-edit** — Auto-lint plugin after file edits

Then ask ONLY what you could NOT auto-detect:
- **Deploy method**: SSH to server, or PR merge via `gh`? (only if `deploy` selected)
- **Deploy target**: server hostname or production URL? (only if `deploy` selected)

## 3. Create files

Create directories as needed: `.opencode/commands/`, `.opencode/agents/`, `.opencode/plugins/`.

### ALWAYS: `.opencode/commands/idea.md`

```markdown
---
description: "Capture an idea as a plan in plans/ directory"
agent: build
---

The user has an idea they want to capture as a plan document. Based on their input ($ARGUMENTS), do the following:

1. Create a new plan document in `plans/` with a descriptive filename (kebab-case, e.g. `plans/feature-name.md`)
2. The plan should include:
   - **Title** and brief description of the idea
   - **Why** — motivation and context
   - **What** — proposed approach / implementation outline
   - **Open questions** — anything that needs research or decisions
3. Keep it concise — this is a starting point, not a full spec
4. Report back the file path so the user can review it

If the idea is very small and doesn't warrant a full plan, suggest adding it to TODO.md instead.
```

### IF SELECTED: `.opencode/commands/next.md`

Fill in `{repo}` with the detected owner/repo:

```markdown
---
description: "Pick the next open GitHub issue or TODO item and create an actionable plan"
agent: build
---

You are a project planner. Do the following steps IN ORDER:

1. Run: `gh issue list --repo {repo} --state open --limit 5 --json number,title --jq '.[] | "#\(.number): \(.title)"'`
2. If there are open issues, pick the oldest one (lowest number) and fetch its full details with `gh issue view <number> --repo {repo}`
3. If there are NO open issues, read TODO.md and pick the first unchecked item (`- [ ]`).
4. Analyze the issue/todo item thoroughly — read relevant source files, understand what needs to change.
5. Present a clear, structured plan:
   - **What** the task is (brief summary)
   - **Why** it matters
   - **Files to modify/create** (with specific paths)
   - **Step-by-step implementation plan**
   - **Potential risks or considerations**
6. Do NOT make any changes. Just present the plan and wait for the user to approve before implementing.

IMPORTANT: If working on a GitHub issue, clearly state the issue number (e.g. "Working on issue #N") so it can be referenced when committing. The commit message should include `Closes #N` so GitHub auto-closes the issue on push.
```

### IF SELECTED: `.opencode/commands/deploy.md`

Choose the variant based on the user's deploy method answer. Fill in all `{placeholders}` with detected/answered values.

**SSH variant** (if deploy method is SSH):

```markdown
---
description: "Build and deploy to production"
agent: build
---

You are deploying the current changes to production. Follow these steps exactly:

## 1. Pre-flight checks
Verify the build works locally:
- `{buildCmd}`

If the build fails, STOP and report errors — do not proceed.

## 2. AI code review
Invoke the `@reviewer` subagent on the staged diff. Pass it all changed files so it can review for security issues, code quality, and best practices.

- If the reviewer returns **FAIL**: STOP and report the issues to the user. Do not proceed until the user confirms the issues are acceptable or have been fixed.
- If the reviewer returns **PASS**: proceed to the next step.

## 3. Commit
- Run `git status` and `git diff` to see all changes
- Stage all relevant files (`git add`)
- Write a concise commit message in **English**, imperative mood
- If the changes resolve a GitHub issue, include `Closes #N` in the commit message (on its own line) so GitHub auto-closes the issue on push
- If no changes are staged, report that and stop

## 4. Push
- Push to origin {mainBranch}: `git push origin {mainBranch}`
- If the push fails, report the error and stop

## 5. Close the GitHub issue
If the changes address an open GitHub issue:
- Close it: `gh issue close <number> --repo {repo}`
- If unsure which issue, run `gh issue list --repo {repo} --state open` and check which one is relevant to the changes
- If there is no related issue, skip this step

## 6. Deploy via SSH
SSH into the server and run the deploy:
```bash
ssh {deployTarget} "cd ~/{projectDir} && git pull && npm ci --omit=dev && {buildCmd}"
```

If the deploy fails, report the error and stop.

## 7. Verify
Check that the site is responding:
```bash
curl -s -o /dev/null -w "%{http_code}" {productionUrl}
```

## 8. Report
- Confirm the deployment was successful
- Report what was deployed to production

IMPORTANT: Never force push. Never use --no-verify. If anything fails, stop and report.
```

**PR merge variant** (if deploy method is PR merge via `gh`):

```markdown
---
description: "Validate, commit, merge to main, deploy to production"
agent: build
---

You are deploying the current changes to production. Follow these steps exactly:

## 1. Pre-flight checks
Run lint and typecheck to ensure nothing is broken:
- `{lintCmd}`
- `{typecheckCmd}`

If there are errors, STOP and report them — do not proceed.

## 2. AI code review
Invoke the `@reviewer` subagent on the staged diff. Pass it all changed files so it can review for security issues, code quality, duplicate code, and best practices.

- If the reviewer returns **FAIL**: STOP and report the issues to the user. Do not proceed until the user confirms the issues are acceptable or have been fixed.
- If the reviewer returns **PASS**: proceed to the next step.

## 3. Commit
- Run `git status` and `git diff` to see all changes
- Stage all relevant files (`git add`)
- Write a concise commit message in **English** that describes the changes (imperative mood)
- If no changes are staged, report that and stop

## 4. Push to working branch
- Push to origin {workingBranch}: `git push origin {workingBranch}`
- If the push fails, report the error and stop

## 5. Create or update PR
- Check if there's already an open PR from {workingBranch} to {mainBranch}: `gh pr list --head {workingBranch} --base {mainBranch}`
- If no PR exists, create one: `gh pr create --base {mainBranch} --head {workingBranch} --title "deploy: <commit subject>" --body "<summary>"`
- If a PR already exists, it will automatically update with the new commit

## 6. Wait for CI
- Wait for the CI check to pass on the PR: `gh pr checks <pr-number>`
- If CI fails, report the failure and STOP — do not merge

## 7. Merge PR to main
- Once CI passes, merge the PR: `gh pr merge <pr-number> --merge`
- This deploys to production

## 8. Report
- Confirm the merge was successful
- Report what was deployed to production

IMPORTANT: Never force push. Never use --no-verify. If anything fails, stop and report.
```

If the working branch is the same as the main branch (no separate working branch), simplify the deploy command: skip PR creation, push directly to main.

### IF SELECTED: `.opencode/commands/refactor.md`

Fill in `{lintCmd}` and `{typecheckCmd}`:

```markdown
---
description: "Analyze code structure and suggest refactoring improvements"
agent: build
---

Analyze the codebase (or the path specified in $ARGUMENTS) for code structure improvements. Follow this workflow:

## 1. Scope
- If $ARGUMENTS is provided, focus on that file or directory
- If no arguments, analyze the files changed in the current session (check `git diff`)

## 2. Analysis — invoke @reviewer first
Use the @reviewer subagent to analyze the code for:
- Duplicate code that could be extracted into shared utilities
- Inconsistent patterns that should be standardized
- Missing abstractions (shared interfaces, base classes, utility functions)
- Code that belongs in a library/module vs inline

## 3. Create a refactoring plan
Based on the analysis, create a concrete plan with:
- **What to extract**: specific functions, components, or patterns
- **Where to put it**: proposed file paths for shared utilities
- **Before/After**: show the current code and the proposed structure
- **Priority**: which changes have the biggest impact

## 4. Ask for approval
Present the plan and ask the user which refactorings to proceed with before making any changes.

## 5. Implement
After approval, make the changes following the project conventions:
- Use TypeScript with proper types
- Follow existing file organization patterns
- Update all imports in affected files
- Run `{lintCmd}` and `{typecheckCmd}` after changes to verify
```

### IF SELECTED: `.opencode/agents/reviewer.md`

```markdown
---
description: "Read-only code reviewer — checks security, style, duplicates, best practices"
mode: subagent
permission:
  edit: deny
  bash: deny
---

You are a senior code reviewer. Review the code changes provided to you and return a structured verdict.

## Review checklist

For every review, evaluate these categories:

### 1. Security
- XSS vulnerabilities, unescaped user input
- SQL injection or unsafe DB queries
- Exposed secrets, tokens, or credentials in code
- Missing auth checks or authorization bypasses
- Unsafe file uploads or path traversal

### 2. Code style & best practices
- Inconsistent naming conventions
- Missing or incorrect TypeScript types
- Unused imports, variables, or dead code
- Functions that are too long or do too much
- Missing error handling (try/catch, null checks)

### 3. Duplicate code
- Copy-pasted logic that should be shared
- Similar components that could be abstracted
- Repeated patterns across files that belong in a utility

### 4. Performance
- Unnecessary re-renders or missing memoization
- Missing lazy loading for heavy components
- N+1 queries or missing pagination
- Large bundle imports (import entire library vs specific)

### 5. Correctness
- Off-by-one errors, wrong conditions
- Race conditions or async/await mistakes
- Missing edge cases (empty arrays, null values, undefined)

## Output format

Return your review in this exact format:

```
## Review: [PASS or FAIL]

### Summary
[1-2 sentence overall assessment]

### Issues found
[If FAIL, list specific issues with file:line references and clear explanations]

### Suggestions (non-blocking)
[Optional improvements that don't block deployment]
```

Be strict but pragmatic. Block deployment only for genuine security issues, bugs, or significant code quality problems. Style preferences and minor improvements should be suggestions, not blockers.
```

### IF SELECTED: `.opencode/plugins/lint-on-edit.js`

Fill in `{lintCmd}` with the detected lint command (e.g. `npx next lint`, `npx astro check`). For astro-based projects, use `npx astro check` instead of the `--file` flag approach.

For Next.js or ESLint-based projects:

```javascript
export const LintOnEdit = async ({ $ }) => {
  return {
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "edit" && input.tool !== "write") return

      const filePath = output.args?.filePath
      if (!filePath) return

      const exts = [".ts", ".tsx", ".js", ".jsx", ".mjs"]
      if (!exts.some((ext) => filePath.endsWith(ext))) return

      if (filePath.includes("node_modules") || filePath.includes(".next")) return

      try {
        const result = await $`{lintCmd} --file ${filePath} 2>&1`
        if (result.exitCode !== 0) {
          console.log(`[lint-on-edit] Issues in ${filePath}:\n${result.stdout}`)
        }
      } catch {
        // Silently ignore — lint-on-edit is advisory, not blocking
      }
    },
  }
}
```

For Astro-based projects, use `npx astro check` without `--file` (it checks the whole project):

```javascript
export const LintOnEdit = async ({ $ }) => {
  return {
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "edit" && input.tool !== "write") return

      const filePath = output.args?.filePath
      if (!filePath) return

      const exts = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".astro"]
      if (!exts.some((ext) => filePath.endsWith(ext))) return

      if (filePath.includes("node_modules") || filePath.includes("dist")) return

      try {
        const result = await $`npx astro check 2>&1`
        if (result.exitCode !== 0) {
          console.log(`[lint-on-edit] Issues:\n${result.stdout}`)
        }
      } catch {
        // Silently ignore — lint-on-edit is advisory, not blocking
      }
    },
  }
}
```

## 4. Report

After creating all files, report:
- List of created files with their full paths
- Summary of detected values used (repo, branches, commands, framework)
- Reminder to review the files and adjust as needed
- Note: re-run `/init` to add more commands later (it detects existing files and won't overwrite)
