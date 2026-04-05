---
name: omw-cli-smoke-testing
description: This skill should be used when the user asks to "run all commands", "smoke test the CLI", "test every omw command", "do manual QA", "verify commands in isolation", or "exhaustively test oh-my-worktree".
version: 0.1.0
---

# omw CLI Smoke Testing

Use this skill to run exhaustive, real-command QA for `oh-my-worktree` without touching the developer's real repo, shell config, or tmux state.

## Purpose

Treat `src/cli/index.ts` and `src/cli/cmd/*.ts` as the source of truth for the command surface. Build the execution plan from code first, then run commands in isolated temp environments and collect evidence for every command family.

Keep `AGENTS.md` short. Put the long-form manual QA procedure here.

## Use This Skill When

- Full CLI smoke coverage is requested, not just one command.
- A change touched multiple CLI commands or shared core behavior.
- A release-ready verification pass is needed.
- A command appears broken only in certain repo/config/tmux states and isolation is required.

## Do Not Use This Skill When

- Only one command needs a quick local check.
- The work is docs-only and no runtime behavior changed.
- A single focused regression test already proves the behavior and no wider smoke pass is requested.

## Core Rules

1. Read `src/cli/index.ts` and `src/cli/cmd/*.ts` before running anything.
2. Use temp directories for `HOME`, `XDG_CONFIG_HOME`, and any generated repos.
3. Use a unique tmux prefix or isolated tmux socket when testing `session` flows.
4. Never run destructive QA against the project repo.
5. Capture exact command, cwd, relevant env isolation, exit code, stdout, and stderr.
6. Distinguish fixture problems from product bugs by re-running suspicious failures in a cleaner fixture.

## Execution Workflow

### 1. Build the command manifest

Enumerate commands from the registry, then classify each as one of:

- config/init/shell setup
- read-only repo inspection
- worktree mutation
- remote/archive/import
- session/tmux
- TUI startup

Use `references/command-groups.md` as the current baseline, but trust the code over the reference if they diverge.

### 2. Build isolated fixtures

Create temp roots for:

- `HOME`
- `XDG_CONFIG_HOME`
- seeded git repo
- optional bare remote
- disposable worktree directories
- tmux state

Use `references/manual-qa-playbook.md` for the fixture layout and wave plan.

### 3. Run baseline repo validation

For non-doc-only work, run this order first:

1. `bun run typecheck`
2. targeted `bun test <file>` if a focused regression file exists
3. `bun test`
4. `bun run build`
5. `bun run src/index.ts` for TUI startup if TUI behavior changed or a broad smoke pass is requested

### 4. Run grouped command QA

Run commands in safe groups:

- config/init commands against temp `HOME`/`XDG_CONFIG_HOME`
- read-only commands against a seeded temp repo
- destructive commands against disposable worktrees or repo copies
- remote commands against a temp bare remote
- session commands with isolated tmux state

Prefer real commands over synthetic assertions. Verify the side effects after each mutating command.

### 5. Record evidence

For each command, record:

- command line
- cwd
- important env isolation
- exit code
- stdout summary
- stderr summary
- follow-up assertion (`git worktree list`, file existence, tmux session existence, config file contents)

### 6. Handle failures carefully

When a command fails:

1. Decide whether the fixture was invalid.
2. Re-run once in a simpler clean fixture if the failure might be environmental.
3. Treat repeatable failures in a valid fixture as real bugs.
4. Do not silently skip the command.

## Additional Resources

- `references/manual-qa-playbook.md` — fixture design, isolation rules, and verification waves
- `references/command-groups.md` — current command surface grouped by QA setup

## Output Expectations

End with a compact evidence report that covers:

- what was executed
- which commands passed
- which commands failed
- whether a failure was caused by the product or by an intentionally dirty fixture
- any commands that required special isolation
