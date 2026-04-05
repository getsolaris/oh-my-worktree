# Manual QA Playbook

Use this playbook for full `omw` CLI smoke testing.

## Source of Truth

- `src/cli/index.ts`
- `src/cli/cmd/*.ts`

Refresh the command list from code before every broad smoke run.

## Isolation Layout

Create one temp root and place these under it:

- `home/` → `HOME`
- `xdg/` → `XDG_CONFIG_HOME`
- `repo/` → seeded git repository under test
- `remote.git/` → optional bare remote for clone/push flows
- `worktrees/` or dedicated per-command dirs for added worktrees
- `tmux/` → isolated tmux socket/tmpdir when session commands are involved

## Recommended Fixture Setup

1. Initialize a temp repo on `main`.
2. Configure git identity locally in the fixture repo.
3. Commit a minimal seed file.
4. Add a local bare remote if clone/remote behavior must be exercised.
5. Initialize temp config with `omw config --init` or `omw init`.
6. Patch config only inside temp `XDG_CONFIG_HOME`.

## QA Waves

### Wave 1 — command manifest

Read the command registry and write down the exact commands to cover.

### Wave 2 — baseline verification

Run, when applicable:

1. `bun run typecheck`
2. targeted `bun test <file>`
3. `bun test`
4. `bun run build`
5. `bun run src/index.ts` for TUI startup smoke

### Wave 3 — config/init/shell commands

Run in temp `HOME` / `XDG_CONFIG_HOME`:

- `config --init`
- `config --path`
- `config --show`
- `config --validate`
- `config --profiles`
- `config --profile <name> --activate`
- `config --edit` with `EDITOR=/usr/bin/true`
- `init`
- `init --skill <platform>`
- `shell-init ...`
- `completion`

### Wave 4 — seeded repo read-only commands

Run against a valid temp repo:

- `list`
- `status`
- `switch`
- `open --editor /usr/bin/true`
- `exec ...`
- `diff ...`
- `doctor`

Prefer JSON or machine-readable modes where available for easy verification.

### Wave 5 — mutating worktree commands

Run with disposable worktrees or fresh repo copies:

- `add`
- `remove` / `rm`
- `pin` / `unpin`
- `rename`
- `clean`

After each mutating command, verify with concrete follow-up checks such as:

- `git worktree list --porcelain`
- target path exists / no longer exists
- metadata files under git internals

### Wave 6 — remote/archive/import commands

Use a temp bare remote or manually created linked worktree where needed:

- `clone`
- `import`
- `archive`

Verify generated artifacts explicitly:

- cloned repo path exists
- archive patch/json exists
- imported worktree now shows expected metadata

### Wave 7 — session/tmux commands

Use isolated tmux state and a unique prefix:

- `session --list`
- `session <branch>` or `add --session`
- `session <branch> --kill`
- `session --kill-all`

Verify with tmux inspection after each command.

## Evidence Format

For every command run, capture:

- label
- full args
- cwd
- exit code
- stdout summary
- stderr summary
- post-condition

## Failure Triage

Treat these as fixture issues first:

- intentionally dirty worktree during `doctor`
- unrelated sibling directories under a custom worktree root
- tmux state leaking from a previous test root

Treat these as product bugs when they reproduce in a clean fixture.
